const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const WorkOrder = require('../models/WorkOrder');
const Quote = require('../models/Quote');
const CompanyConfig = require('../models/CompanyConfig');
const InventoryItem = require('../models/InventoryItem');
const KardexMovement = require('../models/KardexMovement');
const { generateWorkOrderPdf, renderWorkOrderHtml } = require('../services/pdfService');
const { getNextAtomicOrderNumber } = require('../services/sequenceService');
const { validatePlateAndModel, syncVehicleRecord } = require('../services/vehicleValidationService');

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
    let order;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      order = await WorkOrder.findById(req.params.id);
    }
    if (!order) {
      order = await WorkOrder.findOne({ orderNumber: req.params.id });
    }
    if (!order) {
      // Buscar si el parámetro corresponde a una cotización vinculada
      order = await WorkOrder.findOne({
        $or: [
          { generatedQuoteId: req.params.id },
          { quoteId: req.params.id },
          { quoteNumber: req.params.id },
          { generatedQuoteNumber: req.params.id }
        ]
      });
    }
    if (!order && (req.params.id === 'sample' || req.params.id === 'demo')) {
      order = await WorkOrder.findOne().sort({ createdAt: -1 });
    }
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
    // 1. Validación estricta de Placa vs Modelo en Perú
    if (req.body.plate && req.body.plate !== 'POR ASIGNAR') {
      const plateValidation = await validatePlateAndModel(req.body.plate, req.body.model);
      if (!plateValidation.valid) {
        return res.status(400).json({
          success: false,
          code: plateValidation.code || 'PLATE_MODEL_MISMATCH',
          message: plateValidation.message,
          existingModel: plateValidation.existingModel
        });
      }
      // Si el modelo vino vacío, auto-completar con el modelo registrado
      if (plateValidation.existingModel && !req.body.model) {
        req.body.model = plateValidation.existingModel;
      }
    }

    let orderNumber = req.body.orderNumber;
    if (!orderNumber) {
      orderNumber = await getNextAtomicOrderNumber();
    }

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

    try {
      await order.save();
    } catch (saveErr) {
      // Reintento atómico automático si ocurriera colisión E11000 bajo alta concurrencia
      if (saveErr.code === 11000 && !req.body.orderNumber) {
        order.orderNumber = await getNextAtomicOrderNumber();
        await order.save();
      } else {
        throw saveErr;
      }
    }

    // Sincronizar o registrar vehículo en la base de datos
    if (order.plate && order.plate !== 'POR ASIGNAR') {
      syncVehicleRecord({
        plate: order.plate,
        model: order.model,
        vin: order.vin,
        color: order.color,
        year: order.year,
        clientId: order.clientId
      }).catch(err => console.warn('Aviso sincronizando vehículo:', err.message));
    }

    // Registro de Check-In completado en taller (La notificación formal con la OT y Cotización se despachará al completar el diagnóstico y generar la cotización)
    res.status(201).json({
      success: true,
      message: `Orden de Trabajo ${order.orderNumber} generada exitosamente (Check-In completado en Taller)`,
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

    // Validar coherencia de placa vs modelo si se modifica la unidad
    const targetPlate = req.body.plate || order.plate;
    const targetModel = req.body.model !== undefined ? req.body.model : order.model;
    if (targetPlate && targetPlate !== 'POR ASIGNAR') {
      const plateValidation = await validatePlateAndModel(targetPlate, targetModel);
      if (!plateValidation.valid) {
        return res.status(400).json({
          success: false,
          code: plateValidation.code || 'PLATE_MODEL_MISMATCH',
          message: plateValidation.message,
          existingModel: plateValidation.existingModel
        });
      }
    }

    Object.assign(order, req.body);
    await order.save();

    // Sincronizar vehículo
    if (order.plate && order.plate !== 'POR ASIGNAR') {
      syncVehicleRecord({
        plate: order.plate,
        model: order.model,
        vin: order.vin,
        color: order.color,
        year: order.year,
        clientId: order.clientId
      }).catch(err => console.warn('Aviso sincronizando vehículo:', err.message));
    }

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

    // Disparar envío automático cuando la unidad concluye el servicio
    if (status === 'LISTO' || status === 'CONCLUIDO') {
      if (order.clientPhone || order.driverPhone) {
        try {
          const { notifyWorkOrderFinished } = require('../services/whatsappBotService');
          notifyWorkOrderFinished(order).catch(err => 
            console.warn('[WHATSAPP BOT] Aviso al despachar OT concluida:', err.message)
          );
        } catch (e) {
          console.warn('[WHATSAPP BOT] Error ejecutando trigger de OT concluida:', e.message);
        }
      }
    }
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

    // Evitar duplicados: Reutilizar cotización si ya existe para esta OT
    let quote = null;
    const existingQuoteId = order.generatedQuoteId || order.quoteId;
    if (existingQuoteId && mongoose.Types.ObjectId.isValid(existingQuoteId)) {
      quote = await Quote.findById(existingQuoteId);
    }
    if (!quote && order.quoteNumber) {
      quote = await Quote.findOne({ quoteNumber: order.quoteNumber });
    }
    if (!quote) {
      quote = await Quote.findOne({
        $or: [
          { workOrderId: order._id },
          { originWorkOrderNumber: order.orderNumber }
        ]
      }).sort({ createdAt: -1 });
    }

    let quoteNumber;
    if (quote) {
      // Actualizar cotización existente con los nuevos ítems de la OT
      quoteNumber = quote.quoteNumber;
      quote.clientName = order.clientName;
      quote.clientDoc = order.clientDoc;
      quote.clientPhone = order.clientPhone || order.driverPhone;
      quote.clientAddress = order.destinationLocation?.address || order.clientAddress || '';
      quote.plate = order.plate;
      quote.vin = order.vin || '';
      quote.model = order.model || '';
      quote.referencePerson = order.driverName || order.clientName;
      quote.advisorName = (order.assignedMechanic && !order.assignedMechanic.includes('Basil')) ? order.assignedMechanic : 'Darios Bacilio';
      quote.validityDays = validityDays;
      quote.validUntil = validUntilDate;
      quote.paymentCondition = req.body.paymentCondition || order.paymentCondition || 'Condición de pago 07 días despues de realizar el servicio.';
      quote.notes = `Nota: Cotización actualizada automáticamente a partir de la Orden de Trabajo ${order.orderNumber}.`;
      quote.items = items;
      quote.subtotal = subtotal;
      quote.total = total;
      quote.bankAccountsSnapshot = bankAccountsSnapshot;
      if (order.clientSignature) quote.clientSignature = order.clientSignature;
      if (order.advisorSignature) quote.advisorSignature = order.advisorSignature;
      await quote.save();
    } else {
      // Crear nueva cotización con correlativo atómico
      const currentYear = new Date().getFullYear();
      const prefix = `DA-${currentYear}-`;
      const lastQuote = await Quote.findOne({ quoteNumber: new RegExp(`^${prefix}`) }).sort({ quoteNumber: -1 });
      let nextNum = 1;
      if (lastQuote) {
        const match = lastQuote.quoteNumber.match(/(\d+)$/);
        if (match) nextNum = parseInt(match[1], 10) + 1;
      }
      quoteNumber = `${prefix}${String(nextNum).padStart(3, '0')}`;

      quote = new Quote({
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
    }

    // Actualizar datos técnicos de diagnóstico en la OT si se recibieron
    if (req.body.mileage !== undefined && req.body.mileage !== '') order.mileage = req.body.mileage;
    if (req.body.hourmeter !== undefined && req.body.hourmeter !== '') order.hourmeter = req.body.hourmeter;
    if (req.body.fuelLevel !== undefined) order.fuelLevel = req.body.fuelLevel;
    if (req.body.reportedFault !== undefined) order.reportedFault = req.body.reportedFault;
    if (req.body.entryChecklist) {
      order.entryChecklist = { ...(order.entryChecklist?.toObject ? order.entryChecklist.toObject() : order.entryChecklist), ...req.body.entryChecklist };
    }

    // Limpiar PDFs previos en disco para forzar render fresco con los datos actuales
    const quotePdfPath = path.join(__dirname, '../../uploads/quotes', `${quoteNumber}.pdf`);
    if (fs.existsSync(quotePdfPath)) {
      try { fs.unlinkSync(quotePdfPath); } catch (e) {}
    }
    const woPdfPath = path.join(__dirname, '../../uploads/work-orders', `${order.orderNumber}.pdf`);
    if (fs.existsSync(woPdfPath)) {
      try { fs.unlinkSync(woPdfPath); } catch (e) {}
    }

    // Actualizar OT con el vínculo a la cotización
    order.generatedQuoteId = quote._id;
    order.generatedQuoteNumber = quote.quoteNumber;
    order.quoteId = quote._id;
    order.quoteNumber = quote.quoteNumber;
    await order.save();

    // Disparar envío conjunto de Orden de Trabajo (Acta) y Cotización Oficial por WhatsApp
    const targetPhone = quote.clientPhone || order.clientPhone || order.driverPhone;
    if (targetPhone) {
      try {
        const { notifyWorkOrderWithQuote } = require('../services/whatsappBotService');
        let host = req.get('host') || 'localhost:3005';
        if (host === 'localhost') host = 'localhost:3005';
        const publicBase = (process.env.BASE_URL && !process.env.BASE_URL.includes('localhost')) 
          ? process.env.BASE_URL.replace(/\/$/, '') 
          : `${req.protocol}://${host}`;

        const workOrderPdfUrl = `${publicBase}/api/work-orders/${order._id}/pdf`;
        const quotePdfUrl = `${publicBase}/api/quotes/${quote._id}/pdf`;

        notifyWorkOrderWithQuote(order, quote, workOrderPdfUrl, quotePdfUrl).catch(err => 
          console.warn('[WHATSAPP BOT] Aviso al despachar paquete OT + Cotización:', err.message)
        );
      } catch (e) {
        console.warn('[WHATSAPP BOT] Error ejecutando trigger conjunto OT + Cotización:', e.message);
      }
    }

    res.status(200).json({
      success: true,
      message: `Cotización oficial ${quoteNumber} generada y vinculada a la OT ${order.orderNumber}. Acta y cotización despachadas al cliente.`,
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
    let order;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      order = await WorkOrder.findById(req.params.id);
    }
    if (!order) {
      order = await WorkOrder.findOne({ orderNumber: req.params.id });
    }
    if (!order && (req.params.id === 'sample' || req.params.id === 'demo')) {
      order = await WorkOrder.findOne().sort({ createdAt: -1 });
    }
    if (!order) {
      // Doble defensa: si req.params.id corresponde a una Cotización (por ObjectId o número DA-2026-xxx)
      try {
        const Quote = require('../models/Quote');
        let quote = null;
        if (mongoose.Types.ObjectId.isValid(req.params.id)) {
          quote = await Quote.findById(req.params.id);
        }
        if (!quote) {
          quote = await Quote.findOne({ quoteNumber: req.params.id });
        }
        if (quote) {
          const quoteController = require('./quoteController');
          return quoteController.downloadPdf(req, res);
        }
      } catch (errFallback) {
        console.warn('Aviso en fallback Quote desde OT:', errFallback.message);
      }
      return res.status(404).json({ success: false, message: 'Orden de trabajo no encontrada' });
    }

    // 1. Si el archivo PDF ya fue generado y existe en disco, verificar frescura
    const uploadsDir = path.join(__dirname, '../../uploads/work-orders');
    const existingFile = path.join(uploadsDir, `${order.orderNumber}.pdf`);
    if (fs.existsSync(existingFile)) {
      const stat = fs.statSync(existingFile);
      const orderTime = new Date(order.updatedAt || order.createdAt).getTime();
      if (stat.mtimeMs >= orderTime - 2000) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${order.orderNumber}.pdf"`);
        return fs.createReadStream(existingFile).pipe(res);
      }
    }

    const company = await CompanyConfig.findOne() || {};

    if (req.query.format === 'html') {
      const html = renderWorkOrderHtml(order, company);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(html);
    }

    try {
      const pdfResult = await generateWorkOrderPdf(order, company);
      order.pdfUrl = pdfResult.urlPath;
      await order.save();

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${pdfResult.fileName}"`);
      return fs.createReadStream(pdfResult.filePath).pipe(res);
    } catch (pdfErr) {
      console.warn('Aviso generando PDF de OT con Chromium, fallback a HTML imprimible:', pdfErr.message);
      const html = renderWorkOrderHtml(order, company);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(html);
    }
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

    const otPdfPath = path.join(__dirname, '../../uploads/work-orders', `${order.orderNumber}.pdf`);
    if (fs.existsSync(otPdfPath)) {
      try { fs.unlinkSync(otPdfPath); } catch (e) {}
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

// ==========================================
// TORRE DE CONTROL TÉCNICO & KANBAN EN VIVO
// ==========================================

const KANBAN_STAGES = [
  { id: 'RECEPCIONADO', label: '1. Recepción & Check-In', color: '#38bdf8' },
  { id: 'EN_DIAGNOSTICO', label: '2. Diagnóstico & Escaneo 24V', color: '#eab308' },
  { id: 'ESPERA_REPUESTOS', label: '3. Cotización & Repuestos', color: '#f97316' },
  { id: 'EN_REPARACION', label: '4. Reparación Activa', color: '#a855f7' },
  { id: 'CONTROL_CALIDAD', label: '5. Control de Calidad & Banco', color: '#06b6d4' },
  { id: 'LISTO_ENTREGA', label: '6. Listo para Retiro', color: '#10b981' }
];

function normalizeKanbanStage(status) {
  if (!status) return 'RECEPCIONADO';
  const s = status.toUpperCase();
  if (s === 'ENTREGADO' || s === 'ARCHIVADO') return 'ENTREGADO';
  if (s === 'DESPACHADO' || s === 'EN_CAMINO' || s === 'RECEPCIONADO') return 'RECEPCIONADO';
  if (s === 'EN_DIAGNOSTICO') return 'EN_DIAGNOSTICO';
  if (s === 'ESPERA_REPUESTOS') return 'ESPERA_REPUESTOS';
  if (s === 'EN_REPARACION' || s === 'EN_PROCESO') return 'EN_REPARACION';
  if (s === 'CONTROL_CALIDAD' || s === 'PRUEBA_BANCO_24V') return 'CONTROL_CALIDAD';
  if (s === 'LISTO_ENTREGA' || s === 'FINALIZADO') return 'LISTO_ENTREGA';
  return 'RECEPCIONADO';
}

// GET /api/work-orders/kanban - Listado estructurado para Torre de Control y Métricas de Taller
exports.getKanbanOrders = async (req, res) => {
  try {
    const { priority, mechanic, search } = req.query;
    const filter = {};

    if (priority && priority !== 'TODAS') filter.priority = priority;
    if (mechanic && mechanic !== 'TODOS') filter.assignedMechanic = new RegExp(mechanic, 'i');
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { orderNumber: regex },
        { plate: regex },
        { clientName: regex },
        { driverName: regex },
        { model: regex },
        { reportedFault: regex }
      ];
    }

    const orders = await WorkOrder.find(filter).sort({ updatedAt: -1 });
    const now = new Date();

    const columns = {
      RECEPCIONADO: [],
      EN_DIAGNOSTICO: [],
      ESPERA_REPUESTOS: [],
      EN_REPARACION: [],
      CONTROL_CALIDAD: [],
      LISTO_ENTREGA: []
    };

    const deliveredOrders = [];
    const activeOrders = [];

    let countUrgent = 0;
    let countInDiagnosis = 0;
    let countWaitingParts = 0;
    let countInRepair = 0;
    let countQuality = 0;
    let countReady = 0;

    orders.forEach(order => {
      const doc = order.toObject ? order.toObject() : order;
      if (!doc.assignedMechanic || doc.assignedMechanic.includes('Basil')) {
        doc.assignedMechanic = 'Darios Bacilio';
      }

      const canonicalStage = normalizeKanbanStage(doc.status);
      doc.canonicalStage = canonicalStage;

      const entryTime = new Date(doc.checkInDate || doc.createdAt).getTime();
      const elapsedHours = Math.max(0, Math.round((now.getTime() - entryTime) / (1000 * 60 * 60)));
      doc.elapsedHours = elapsedHours;
      doc.elapsedDays = Math.floor(elapsedHours / 24);

      if (canonicalStage === 'ENTREGADO') {
        deliveredOrders.push(doc);
      } else {
        activeOrders.push(doc);
        if (doc.priority === 'URGENTE') countUrgent++;
        if (canonicalStage === 'EN_DIAGNOSTICO') countInDiagnosis++;
        else if (canonicalStage === 'ESPERA_REPUESTOS') countWaitingParts++;
        else if (canonicalStage === 'EN_REPARACION') countInRepair++;
        else if (canonicalStage === 'CONTROL_CALIDAD') countQuality++;
        else if (canonicalStage === 'LISTO_ENTREGA') countReady++;

        if (columns[canonicalStage]) {
          columns[canonicalStage].push(doc);
        } else {
          columns.RECEPCIONADO.push(doc);
        }
      }
    });

    res.json({
      success: true,
      data: {
        columns,
        deliveredOrders,
        kpis: {
          totalActive: activeOrders.length,
          totalDelivered: deliveredOrders.length,
          inDiagnosis: countInDiagnosis,
          waitingParts: countWaitingParts,
          inRepair: countInRepair,
          qualityControl: countQuality,
          readyForDelivery: countReady,
          urgentCount: countUrgent
        },
        stages: KANBAN_STAGES
      }
    });
  } catch (error) {
    console.error('Error obteniendo datos Kanban Torre de Control:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/work-orders/:id/kanban-stage - Actualizar fase de torre de control y trazabilidad
exports.updateKanbanStage = async (req, res) => {
  try {
    const { stage, priority, progressPercent, assignedMechanic, estimatedCompletionDate, notes, notifyClient } = req.body;
    const order = await WorkOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Orden de trabajo no encontrada' });

    if (stage) order.status = stage;
    if (stage === 'ENTREGADO') {
      order.deliveredAt = new Date();
      order.progressPercent = 100;
    }
    if (priority) order.priority = priority;
    if (progressPercent !== undefined) order.progressPercent = Math.min(100, Math.max(0, Number(progressPercent)));
    if (assignedMechanic) order.assignedMechanic = assignedMechanic;
    if (estimatedCompletionDate) order.estimatedCompletionDate = new Date(estimatedCompletionDate);

    if (!Array.isArray(order.stageHistory)) order.stageHistory = [];
    const stageInfo = KANBAN_STAGES.find(s => s.id === stage) || 
      (stage === 'ENTREGADO' ? { label: '7. Entregado al Cliente (Archivado en Historial)' } : { label: stage });
    order.stageHistory.push({
      stage: stage || order.status,
      title: stageInfo.label,
      notes: notes || `Transición a ${stageInfo.label}`,
      updatedBy: req.body.updatedBy || order.assignedMechanic || 'Darios Bacilio',
      timestamp: new Date()
    });

    await order.save();

    let notificationResult = null;
    if (notifyClient && (order.clientPhone || order.driverPhone)) {
      try {
        const { notifyWorkshopStageUpdate } = require('../services/whatsappBotService');
        let host = req.get('host') || 'localhost:3005';
        if (host === 'localhost') host = 'localhost:3005';
        const publicBase = (process.env.BASE_URL && !process.env.BASE_URL.includes('localhost'))
          ? process.env.BASE_URL.replace(/\/$/, '')
          : `${req.protocol}://${host}`;

        const trackingUrl = `${publicBase}/#tracking/${order.orderNumber}`;
        notificationResult = await notifyWorkshopStageUpdate(order, stageInfo.label, notes, trackingUrl);
      } catch (waErr) {
        console.warn('Aviso notificando cambio de fase WhatsApp:', waErr.message);
      }
    }

    res.json({
      success: true,
      message: `Fase actualizada exitosamente a ${stageInfo.label}`,
      data: order,
      notification: notificationResult
    });
  } catch (error) {
    console.error('Error actualizando fase Kanban:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/work-orders/track/:identifier - Portal de Trazabilidad en tiempo real (Público / Asesor)
exports.getPublicTracking = async (req, res) => {
  try {
    const { identifier } = req.params;
    const cleanId = String(identifier || '').trim();

    let order = null;
    if (mongoose.Types.ObjectId.isValid(cleanId)) {
      order = await WorkOrder.findById(cleanId);
    }
    if (!order) {
      order = await WorkOrder.findOne({
        $or: [
          { orderNumber: new RegExp(`^${cleanId}$`, 'i') },
          { plate: new RegExp(`^${cleanId}$`, 'i') }
        ]
      }).sort({ createdAt: -1 });
    }

    if (!order) {
      return res.status(404).json({ success: false, message: 'Unidad o seguimiento no encontrado con el código provisto' });
    }

    const doc = order.toObject ? order.toObject() : order;
    if (!doc.assignedMechanic || doc.assignedMechanic.includes('Basil')) {
      doc.assignedMechanic = 'Darios Bacilio';
    }

    const canonicalStage = normalizeKanbanStage(doc.status);
    doc.canonicalStage = canonicalStage;

    const timeline = [];
    timeline.push({
      stage: 'RECEPCIONADO',
      title: '1. Check-In & Ingreso a Taller',
      timestamp: doc.checkInDate || doc.createdAt,
      notes: `Recepción técnica oficial con odómetro: ${doc.mileage || 'Registrado'} y combustible: ${doc.fuelLevel || '1/2'}.`,
      isDone: true
    });

    if (Array.isArray(doc.stageHistory) && doc.stageHistory.length > 0) {
      doc.stageHistory.forEach(h => {
        timeline.push({
          stage: h.stage,
          title: h.title || h.stage,
          timestamp: h.timestamp,
          notes: h.notes,
          updatedBy: h.updatedBy,
          isDone: true
        });
      });
    }

    res.json({
      success: true,
      data: {
        orderNumber: doc.orderNumber,
        plate: doc.plate,
        model: doc.model,
        clientName: doc.clientName,
        checkInDate: doc.checkInDate || doc.createdAt,
        currentStage: canonicalStage,
        currentStatus: doc.status,
        progressPercent: doc.progressPercent || 25,
        priority: doc.priority || 'MEDIA',
        assignedMechanic: doc.assignedMechanic,
        estimatedCompletionDate: doc.estimatedCompletionDate,
        reportedFault: doc.reportedFault,
        mileage: doc.mileage,
        hourmeter: doc.hourmeter,
        fuelLevel: doc.fuelLevel,
        batteryVoltage: doc.batteryVoltage,
        entryChecklist: doc.entryChecklist,
        damageMapCount: (doc.damageMap || []).length,
        diagnosticServices: doc.diagnosticServices || [],
        timeline,
        workshopInfo: {
          name: 'DARSIL AUTOMOTIVE SOLUTIONS S.A.C.',
          address: 'Av. Los Forestales MZ I1, Villa El Salvador, Lima',
          phone: '934787006',
          advisor: doc.assignedMechanic || 'Darios Bacilio'
        }
      }
    });
  } catch (error) {
    console.error('Error obteniendo seguimiento de unidad:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/work-orders/:id/notify-tracking - Enviar seguimiento por WhatsApp bajo demanda
exports.notifyTrackingWhatsApp = async (req, res) => {
  try {
    const order = await WorkOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Orden de trabajo no encontrada' });
    if (!order.clientPhone && !order.driverPhone) {
      return res.status(400).json({ success: false, message: 'La orden no tiene número de teléfono registrado' });
    }

    const { notifyWorkshopStageUpdate } = require('../services/whatsappBotService');
    let host = req.get('host') || 'localhost:3005';
    if (host === 'localhost') host = 'localhost:3005';
    const publicBase = (process.env.BASE_URL && !process.env.BASE_URL.includes('localhost'))
      ? process.env.BASE_URL.replace(/\/$/, '')
      : `${req.protocol}://${host}`;

    const trackingUrl = `${publicBase}/#tracking/${order.orderNumber}`;
    const stageInfo = KANBAN_STAGES.find(s => s.id === normalizeKanbanStage(order.status)) || { label: order.status };

    const result = await notifyWorkshopStageUpdate(
      order, 
      stageInfo.label, 
      req.body.notes || `Progreso actual del taller: ${order.progressPercent || 25}%`,
      trackingUrl
    );

    res.json({
      success: true,
      message: `Enlace de seguimiento despachado por WhatsApp a ${order.clientPhone || order.driverPhone}`,
      data: result
    });
  } catch (error) {
    console.error('Error enviando notificación WhatsApp de seguimiento:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

