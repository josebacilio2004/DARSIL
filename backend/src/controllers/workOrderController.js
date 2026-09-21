const fs = require('fs');
const path = require('path');
const WorkOrder = require('../models/WorkOrder');
const Quote = require('../models/Quote');
const CompanyConfig = require('../models/CompanyConfig');
const InventoryItem = require('../models/InventoryItem');
const KardexMovement = require('../models/KardexMovement');
const { generateWorkOrderPdf } = require('../services/pdfService');

async function getNextOrderNumber() {
  const currentYear = new Date().getFullYear();
  const prefix = `OT-${currentYear}-`;

  const lastOrder = await WorkOrder.findOne({ orderNumber: new RegExp(`^${prefix}`) })
    .sort({ orderNumber: -1 });

  if (!lastOrder) {
    return `${prefix}001`;
  }

  const match = lastOrder.orderNumber.match(/(\d+)$/);
  const nextNum = match ? parseInt(match[1], 10) + 1 : 1;
  return `${prefix}${String(nextNum).padStart(3, '0')}`;
}

// GET /api/work-orders
exports.getWorkOrders = async (req, res) => {
  try {
    const { status, search, plate } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (plate) filter.plate = new RegExp(plate, 'i');
    if (search) {
      filter.$or = [
        { orderNumber: new RegExp(search, 'i') },
        { clientName: new RegExp(search, 'i') },
        { plate: new RegExp(search, 'i') },
        { driverName: new RegExp(search, 'i') },
        { reportedFault: new RegExp(search, 'i') }
      ];
    }

    const orders = await WorkOrder.find(filter).sort({ createdAt: -1 });
    const sanitizedOrders = orders.map(o => {
      const doc = o.toObject ? o.toObject() : o;
      if (!doc.assignedMechanic || doc.assignedMechanic.includes('Basil')) {
        doc.assignedMechanic = 'Darios Bacilio';
      }
      return doc;
    });
    res.json({ success: true, count: sanitizedOrders.length, data: sanitizedOrders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/work-orders/:id
exports.getWorkOrderById = async (req, res) => {
  try {
    const order = await WorkOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Orden de trabajo no encontrada' });
    const doc = order.toObject ? order.toObject() : order;
    if (!doc.assignedMechanic || doc.assignedMechanic.includes('Basil')) {
      doc.assignedMechanic = 'Darios Bacilio';
    }
    res.json({ success: true, data: doc });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/work-orders (Check-In Digital Inicial)
exports.createWorkOrder = async (req, res) => {
  try {
    const orderNumber = req.body.orderNumber || await getNextOrderNumber();

    let tasks = req.body.tasks || [];

    const assignedMechanic = (req.body.assignedMechanic && !req.body.assignedMechanic.includes('Basil'))
      ? req.body.assignedMechanic
      : 'Darios Bacilio';

    // Si viene vinculada a una cotización previa, precargar tareas de los ítems de la cotización
    if (req.body.quoteId && tasks.length === 0) {
      const quote = await Quote.findById(req.body.quoteId);
      if (quote && quote.items) {
        tasks = quote.items.map(item => ({
          description: `${item.code ? item.code + ' - ' : ''}${item.description}`,
          isCompleted: false,
          mechanic: assignedMechanic
        }));
      }
    }

    // Si no hay tareas, agregar diagnóstico inicial
    if (tasks.length === 0) {
      tasks.push({
        description: `Inspección inicial y escaneo digital CAN Bus: ${req.body.reportedFault || 'Revisión general'}`,
        isCompleted: false,
        mechanic: assignedMechanic
      });
    }

    const order = new WorkOrder({
      ...req.body,
      assignedMechanic,
      orderNumber,
      tasks,
      status: req.body.status || 'RECEPCIONADO'
    });

    await order.save();

    res.status(201).json({
      success: true,
      message: `Orden de Trabajo ${orderNumber} generada exitosamente (Check-In completado)`,
      data: order
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// PUT /api/work-orders/:id
exports.updateWorkOrder = async (req, res) => {
  try {
    const order = await WorkOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Orden de trabajo no encontrada' });

    Object.assign(order, req.body);
    await order.save();

    res.json({ success: true, message: 'Orden de trabajo actualizada', data: order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// PATCH /api/work-orders/:id/status
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await WorkOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Orden de trabajo no encontrada' });

    order.status = status;
    if (status === 'ENTREGADO' && !order.deliveredAt) {
      order.deliveredAt = new Date();
    }

    await order.save();
    res.json({ success: true, message: `Estado de la OT actualizado a ${status}`, data: order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// POST /api/work-orders/:id/signature (Firma digital de entrega)
exports.addSignature = async (req, res) => {
  try {
    const { clientSignature, deliveredTo, deliveryNotes } = req.body;
    const order = await WorkOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Orden de trabajo no encontrada' });

    if (clientSignature) order.clientSignature = clientSignature;
    if (deliveredTo) order.deliveredTo = deliveredTo;
    if (deliveryNotes) order.deliveryNotes = deliveryNotes;
    
    order.deliveredAt = new Date();
    order.status = 'ENTREGADO';

    await order.save();
    res.json({ success: true, message: 'Firma de conformidad registrada y unidad entregada', data: order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// POST /api/work-orders/:id/materials (Consumir material de inventario en la OT)
exports.addMaterial = async (req, res) => {
  try {
    const { inventoryItemId, quantity, notes } = req.body;
    const order = await WorkOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Orden de trabajo no encontrada' });

    const item = await InventoryItem.findById(inventoryItemId);
    if (!item) return res.status(404).json({ success: false, message: 'Ítem de inventario no encontrado' });

    const qty = Number(quantity);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ success: false, message: 'Cantidad inválida' });
    }

    if (item.currentStock < qty) {
      return res.status(400).json({ 
        success: false, 
        message: `Stock insuficiente en almacén. Stock: ${item.currentStock} ${item.unit}, requerido: ${qty}` 
      });
    }

    // Descontar de inventario y registrar en Kardex
    const previousStock = item.currentStock;
    item.currentStock -= qty;
    await item.save();

    await KardexMovement.create({
      itemId: item._id,
      sku: item.sku,
      itemName: item.name,
      type: 'SALIDA',
      quantity: qty,
      unitCost: item.unitCost,
      previousStock,
      newStock: item.currentStock,
      referenceDoc: order.orderNumber,
      performedBy: 'Taller',
      notes: `Consumido en Orden de Trabajo ${order.orderNumber} para unidad ${order.plate}`
    });

    order.materialsUsed.push({
      inventoryItemId: item._id,
      sku: item.sku,
      name: item.name,
      quantity: qty,
      unit: item.unit,
      unitPrice: item.salePrice
    });

    await order.save();

    res.status(201).json({
      success: true,
      message: `${qty} ${item.unit} de ${item.name} asignados a la OT y descontados de Kardex`,
      data: order
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// POST /api/work-orders/:id/generate-quote (Generación Automática de Cotización Oficial)
exports.generateQuoteFromWorkOrder = async (req, res) => {
  try {
    const order = await WorkOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Orden de Trabajo no encontrada' });
    }

    // Helper para próximo correlativo DA-YYYY-XXX
    const currentYear = new Date().getFullYear();
    const prefix = `DA-${currentYear}-`;
    const lastQuote = await Quote.findOne({ quoteNumber: new RegExp(`^${prefix}`) }).sort({ quoteNumber: -1 });
    let nextNum = 1;
    if (lastQuote) {
      const match = lastQuote.quoteNumber.match(/(\d+)$/);
      if (match) nextNum = parseInt(match[1], 10) + 1;
    }
    const quoteNumber = `${prefix}${String(nextNum).padStart(3, '0')}`;

    // Construir ítems agrupando Servicios (MO) y Repuestos
    const items = [];

    // 1. Servicios de Mano de Obra
    if (order.diagnosticServices && order.diagnosticServices.length > 0) {
      order.diagnosticServices.forEach((s, idx) => {
        const qty = Number(s.quantity) || 1;
        const price = Number(s.unitPrice) || 0;
        items.push({
          code: s.code || `MO${String(idx + 1).padStart(2, '0')}`,
          description: s.description,
          quantity: qty,
          unitPrice: price,
          value: qty * price
        });
      });
    } else if (order.tasks && order.tasks.length > 0) {
      order.tasks.forEach((t, idx) => {
        items.push({
          code: `MO${String(idx + 1).padStart(2, '0')}`,
          description: t.description,
          quantity: 1,
          unitPrice: 80,
          value: 80
        });
      });
    }

    // 2. Repuestos e Insumos de Taller
    if (order.diagnosticParts && order.diagnosticParts.length > 0) {
      order.diagnosticParts.forEach((p, idx) => {
        const qty = Number(p.quantity) || 1;
        const price = Number(p.unitPrice) || 0;
        items.push({
          code: p.sku || `REP${String(idx + 1).padStart(2, '0')}`,
          description: `REPUESTO: ${p.name}`,
          quantity: qty,
          unitPrice: price,
          value: qty * price
        });
      });
    }

    // 3. Viáticos / Auxilio en Ruta si aplica
    if (order.travelCost && order.travelCost > 0) {
      items.push({
        code: 'LOG01',
        description: `DESPLAZAMIENTO Y AUXILIO MECÁNICO EN RUTA (${(order.routeDistanceKm || 0).toFixed(1)} KM)`,
        quantity: 1,
        unitPrice: order.travelCost,
        value: order.travelCost
      });
    }

    // Si aún no hay ítems, colocar uno por defecto
    if (items.length === 0) {
      items.push({
        code: 'MO01',
        description: `SERVICIO DIAGNÓSTICO Y REVISIÓN: ${order.reportedFault || 'Inspección técnica general'}`,
        quantity: 1,
        unitPrice: 120,
        value: 120
      });
    }

    const subtotal = items.reduce((acc, item) => acc + (item.value || 0), 0);
    const total = subtotal;

    // Obtener cuentas bancarias de CompanyConfig si existen
    const company = await CompanyConfig.findOne();
    const bankAccountsSnapshot = company?.bankAccounts || [];

    const validityDays = req.body.validityDays ? Number(req.body.validityDays) : (order.validityDays || 15);
    const validUntilDate = new Date(Date.now() + validityDays * 86400000);

    const quote = new Quote({
      quoteNumber,
      templateType: 'TALLER_DETALLADO',
      status: 'BORRADOR',
      workOrderId: order._id,
      originWorkOrderNumber: order.orderNumber,
      clientName: order.clientName,
      clientDoc: order.clientDoc,
      clientPhone: order.clientPhone || order.driverPhone,
      clientAddress: order.destinationLocation?.address || order.clientAddress || '',
      plate: order.plate,
      vin: order.vin || '',
      model: order.model || '',
      orderType: 'Taller de Servicios',
      referencePerson: order.driverName || order.clientName,
      advisorName: (order.assignedMechanic && !order.assignedMechanic.includes('Basil')) ? order.assignedMechanic : 'Darios Bacilio',
      validityDays,
      validUntil: validUntilDate,
      deliveryTerm: 'Inmediato / Según programación de taller',
      paymentCondition: req.body.paymentCondition || order.paymentCondition || 'Condición de pago 07 días despues de realizar el servicio.',
      notes: `Nota: Cotización generada automáticamente a partir de la Orden de Trabajo ${order.orderNumber}. Válida por ${validityDays} días calendario.`,
      items,
      subtotal,
      total,
      bankAccountsSnapshot,
      clientSignature: order.clientSignature,
      advisorSignature: order.advisorSignature
    });

    await quote.save();

    // Actualizar OT con el vínculo a la cotización
    order.generatedQuoteId = quote._id;
    order.generatedQuoteNumber = quote.quoteNumber;
    order.quoteId = quote._id;
    order.quoteNumber = quote.quoteNumber;
    await order.save();

    res.status(201).json({
      success: true,
      message: `Cotización oficial ${quoteNumber} generada y vinculada a la OT ${order.orderNumber}`,
      data: {
        quote,
        workOrder: order
      }
    });
  } catch (error) {
    console.error('Error generando cotización automática desde OT:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/work-orders/:id/pdf (Generación y descarga de PDF oficial de OT)
exports.getWorkOrderPdf = async (req, res) => {
  try {
    const order = await WorkOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Orden de trabajo no encontrada' });
    }

    const company = await CompanyConfig.findOne();
    const pdfResult = await generateWorkOrderPdf(order, company);

    order.pdfUrl = pdfResult.urlPath;
    await order.save();

    const stream = fs.createReadStream(pdfResult.filePath);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${pdfResult.fileName}"`);
    stream.pipe(res);
  } catch (error) {
    console.error('Error al generar PDF de OT:', error);
    res.status(500).json({ success: false, message: 'Error generando PDF: ' + error.message });
  }
};

// DELETE /api/work-orders/:id (Eliminar Orden de Trabajo)
exports.deleteWorkOrder = async (req, res) => {
  try {
    const order = await WorkOrder.findByIdAndDelete(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Orden de trabajo no encontrada' });
    }
    res.json({
      success: true,
      message: `Orden de trabajo ${order.orderNumber} eliminada exitosamente`,
      data: order
    });
  } catch (error) {
    console.error('Error eliminando orden de trabajo:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
