const WorkOrder = require('../models/WorkOrder');
const Quote = require('../models/Quote');
const InventoryItem = require('../models/InventoryItem');
const KardexMovement = require('../models/KardexMovement');

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
    res.json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/work-orders/:id
exports.getWorkOrderById = async (req, res) => {
  try {
    const order = await WorkOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Orden de trabajo no encontrada' });
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/work-orders (Check-In Digital Inicial)
exports.createWorkOrder = async (req, res) => {
  try {
    const orderNumber = req.body.orderNumber || await getNextOrderNumber();

    let tasks = req.body.tasks || [];

    // Si viene vinculada a una cotización previa, precargar tareas de los ítems de la cotización
    if (req.body.quoteId && tasks.length === 0) {
      const quote = await Quote.findById(req.body.quoteId);
      if (quote && quote.items) {
        tasks = quote.items.map(item => ({
          description: `${item.code ? item.code + ' - ' : ''}${item.description}`,
          isCompleted: false,
          mechanic: req.body.assignedMechanic || 'Ruben Basil'
        }));
      }
    }

    // Si no hay tareas, agregar diagnóstico inicial
    if (tasks.length === 0) {
      tasks.push({
        description: `Inspección inicial y escaneo digital CAN Bus: ${req.body.reportedFault || 'Revisión general'}`,
        isCompleted: false,
        mechanic: req.body.assignedMechanic || 'Ruben Basil'
      });
    }

    const order = new WorkOrder({
      ...req.body,
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
