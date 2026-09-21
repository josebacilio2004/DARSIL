const InventoryItem = require('../models/InventoryItem');
const KardexMovement = require('../models/KardexMovement');
const InventoryCategory = require('../models/InventoryCategory');
const InventoryUnit = require('../models/InventoryUnit');

const INITIAL_INVENTORY_SEEDS = [
  {
    sku: 'REP-REL-24V',
    name: 'Relé de Arranque Reforzado 24V 70A',
    category: 'REPUESTO_ELECTRICO',
    unit: 'Uds.',
    currentStock: 18,
    minStock: 5,
    unitCost: 28.00,
    salePrice: 50.00,
    location: 'Estante A - Gaveta 1',
    supplier: 'Bosch / Prestolite'
  },
  {
    sku: 'REP-FUS-10-50A',
    name: 'Kit Fusibles Automotrices Alta Potencia 10A a 50A',
    category: 'REPUESTO_ELECTRICO',
    unit: 'Kits',
    currentStock: 45,
    minStock: 10,
    unitCost: 8.50,
    salePrice: 20.00,
    location: 'Estante A - Gaveta 3',
    supplier: 'Littelfuse'
  },
  {
    sku: 'CAB-IGN-16MM',
    name: 'Cable Automotriz Ignífugo Grado Marino 16mm²',
    category: 'CABLEADO_CONECTORES',
    unit: 'Metros',
    currentStock: 120,
    minStock: 30,
    unitCost: 14.00,
    salePrice: 25.00,
    location: 'Carrete Principal 2',
    supplier: 'Indeco / BICC'
  },
  {
    sku: 'CON-TER-OJO-M8',
    name: 'Terminal de Ojo Cobre Estañado M8 / M10',
    category: 'CABLEADO_CONECTORES',
    unit: 'Uds.',
    currentStock: 150,
    minStock: 40,
    unitCost: 3.50,
    salePrice: 10.00,
    location: 'Gaveta Cobre 4',
    supplier: 'Panduit'
  },
  {
    sku: 'FIL-NYLON-CF',
    name: 'Filamento Técnico Nylon PA12 reforzado con Fibra de Carbono',
    category: 'FILAMENTO_3D',
    unit: 'Gramos (g)',
    currentStock: 3200,
    minStock: 1000,
    unitCost: 0.28,
    salePrice: 0.65,
    location: 'Cámara Desecante 3D-01',
    supplier: 'Polymaker Industrial'
  },
  {
    sku: 'FIL-PETG-CF',
    name: 'Filamento PETG-CF Alta Resistencia Térmica 120°C',
    category: 'FILAMENTO_3D',
    unit: 'Gramos (g)',
    currentStock: 4500,
    minStock: 1000,
    unitCost: 0.18,
    salePrice: 0.45,
    location: 'Cámara Desecante 3D-02',
    supplier: 'eSun Tech'
  },
  {
    sku: 'FAR-LED-LAT-24V',
    name: 'Faro LED Lateral Señalizador Ámbar 24V Hermético IP68',
    category: 'ILUMINACION_FAROS',
    unit: 'Uds.',
    currentStock: 32,
    minStock: 8,
    unitCost: 10.00,
    salePrice: 20.00,
    location: 'Estante B - Nivel 2',
    supplier: 'Optilux'
  },
  {
    sku: 'SEN-NOX-CAN-24V',
    name: 'Sensor NOx Digital Entrada/Salida Bus CAN 24V',
    category: 'SENSORES_ACTUADORES',
    unit: 'Uds.',
    currentStock: 4,
    minStock: 2,
    unitCost: 650.00,
    salePrice: 1150.00,
    location: 'Caja Fuerte Electrónica',
    supplier: 'Continental / Cummins'
  }
];

// Sembrar inventario inicial si está vacío
async function seedInitialInventory() {
  try {
    const count = await InventoryItem.countDocuments();
    if (count === 0) {
      console.log('Sembrando inventario oficial de repuestos y filamentos 3D...');
      for (const item of INITIAL_INVENTORY_SEEDS) {
        const created = await InventoryItem.create(item);
        await KardexMovement.create({
          itemId: created._id,
          sku: created.sku,
          itemName: created.name,
          type: 'ENTRADA',
          quantity: created.currentStock,
          unitCost: created.unitCost,
          previousStock: 0,
          newStock: created.currentStock,
          referenceDoc: 'INVENTARIO INICIAL 2026',
          performedBy: 'Sistema DARSIL',
          notes: 'Carga automática de inventario maestro'
        });
      }
      console.log('Inventario oficial sembrado exitosamente.');
    }
  } catch (err) {
    console.error('Error al sembrar inventario inicial:', err.message);
  }
}

// Ejecutar siembra pasiva
seedInitialInventory();

// GET /api/inventory
exports.getItems = async (req, res) => {
  try {
    const { category, search, lowStock } = req.query;
    const filter = { isActive: true };

    if (category && category !== 'ALL') {
      filter.category = category;
    }

    if (search) {
      filter.$or = [
        { sku: new RegExp(search, 'i') },
        { name: new RegExp(search, 'i') },
        { location: new RegExp(search, 'i') }
      ];
    }

    let items = await InventoryItem.find(filter).sort({ name: 1 });

    if (lowStock === 'true') {
      items = items.filter(i => i.currentStock <= i.minStock);
    }

    res.json({ success: true, count: items.length, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/inventory
exports.createItem = async (req, res) => {
  try {
    const { sku, name, category, unit, currentStock, minStock, unitCost, salePrice, location, supplier, notes } = req.body;

    const existing = await InventoryItem.findOne({ sku: sku.toUpperCase().trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: `Ya existe un ítem con el SKU ${sku}` });
    }

    const initialStock = Number(currentStock) || 0;
    const item = await InventoryItem.create({
      sku: sku.toUpperCase().trim(),
      name: name.trim(),
      category: category || 'REPUESTO_ELECTRICO',
      unit: unit || 'Uds.',
      currentStock: initialStock,
      minStock: Number(minStock) || 5,
      unitCost: Number(unitCost) || 0,
      salePrice: Number(salePrice) || 0,
      location: location || 'Taller Principal',
      supplier: supplier || '',
      notes: notes || ''
    });

    if (initialStock > 0) {
      await KardexMovement.create({
        itemId: item._id,
        sku: item.sku,
        itemName: item.name,
        type: 'ENTRADA',
        quantity: initialStock,
        unitCost: item.unitCost,
        previousStock: 0,
        newStock: initialStock,
        referenceDoc: 'ALTA INICIAL',
        performedBy: req.body.performedBy || 'darios',
        notes: 'Registro inicial de existencias'
      });
    }

    res.status(201).json({ success: true, message: 'Ítem registrado exitosamente en inventario', data: item });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// PUT /api/inventory/:id
exports.updateItem = async (req, res) => {
  try {
    const item = await InventoryItem.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Ítem no encontrado' });

    Object.assign(item, {
      name: req.body.name || item.name,
      category: req.body.category || item.category,
      unit: req.body.unit || item.unit,
      minStock: req.body.minStock !== undefined ? Number(req.body.minStock) : item.minStock,
      unitCost: req.body.unitCost !== undefined ? Number(req.body.unitCost) : item.unitCost,
      salePrice: req.body.salePrice !== undefined ? Number(req.body.salePrice) : item.salePrice,
      location: req.body.location || item.location,
      supplier: req.body.supplier || item.supplier,
      notes: req.body.notes || item.notes
    });

    await item.save();
    res.json({ success: true, message: 'Ítem actualizado exitosamente', data: item });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// DELETE /api/inventory/:id
exports.deleteItem = async (req, res) => {
  try {
    const item = await InventoryItem.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!item) return res.status(404).json({ success: false, message: 'Ítem no encontrado' });
    res.json({ success: true, message: 'Ítem desactivado del inventario activo' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/inventory/movements (Registrar en Kardex)
exports.registerMovement = async (req, res) => {
  try {
    const { itemId, type, quantity, referenceDoc, notes, unitCost, performedBy } = req.body;

    const item = await InventoryItem.findById(itemId);
    if (!item) return res.status(404).json({ success: false, message: 'Ítem de inventario no encontrado' });

    const qty = Number(quantity);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ success: false, message: 'La cantidad debe ser un número mayor a 0' });
    }

    const previousStock = item.currentStock;
    let newStock = previousStock;

    if (type === 'ENTRADA' || type === 'AJUSTE_POSITIVO') {
      newStock = previousStock + qty;
    } else if (type === 'SALIDA' || type === 'AJUSTE_NEGATIVO') {
      if (previousStock < qty) {
        return res.status(400).json({ 
          success: false, 
          message: `Stock insuficiente. Existencias actuales: ${previousStock} ${item.unit}, solicitadas: ${qty} ${item.unit}` 
        });
      }
      newStock = previousStock - qty;
    } else {
      return res.status(400).json({ success: false, message: 'Tipo de movimiento inválido' });
    }

    // Actualizar stock en ítem
    item.currentStock = newStock;
    if (unitCost && Number(unitCost) > 0) {
      item.unitCost = Number(unitCost);
    }
    await item.save();

    // Crear registro inmutable en Kardex
    const movement = await KardexMovement.create({
      itemId: item._id,
      sku: item.sku,
      itemName: item.name,
      type,
      quantity: qty,
      unitCost: item.unitCost,
      previousStock,
      newStock,
      referenceDoc: referenceDoc || 'Movimiento de Almacén',
      performedBy: performedBy || 'darios',
      notes: notes || ''
    });

    res.status(201).json({
      success: true,
      message: `Movimiento de ${type} registrado en Kardex exitosamente`,
      data: {
        item,
        movement
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// GET /api/inventory/:id/kardex
exports.getKardexByItem = async (req, res) => {
  try {
    const movements = await KardexMovement.find({ itemId: req.params.id })
      .sort({ createdAt: -1 });
    res.json({ success: true, count: movements.length, data: movements });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/inventory/summary
exports.getInventorySummary = async (req, res) => {
  try {
    const items = await InventoryItem.find({ isActive: true });
    
    let totalStockValue = 0;
    let lowStockCount = 0;

    items.forEach(i => {
      totalStockValue += (i.currentStock * i.unitCost);
      if (i.currentStock <= i.minStock) {
        lowStockCount++;
      }
    });

    res.json({
      success: true,
      data: {
        totalItems: items.length,
        totalStockValue,
        lowStockCount
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/inventory/seed
exports.seedInventory = async (req, res) => {
  try {
    let count = 0;
    for (const item of INITIAL_INVENTORY_SEEDS) {
      const existing = await InventoryItem.findOne({ sku: item.sku });
      if (!existing) {
        const created = await InventoryItem.create(item);
        await KardexMovement.create({
          itemId: created._id,
          sku: created.sku,
          itemName: created.name,
          type: 'ENTRADA',
          quantity: created.currentStock,
          unitCost: created.unitCost,
          previousStock: 0,
          newStock: created.currentStock,
          referenceDoc: 'INVENTARIO INICIAL 2026',
          performedBy: 'Sistema DARSIL',
          notes: 'Carga automática de inventario maestro'
        });
        count++;
      }
    }
    const all = await InventoryItem.find({ isActive: true });
    res.json({
      success: true,
      message: `Sembrado completado. Se insertaron ${count} nuevos repuestos e insumos.`,
      data: all
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// CRUD CATEGORÍAS DE INVENTARIO
// ==========================================
const DEFAULT_CATEGORIES = [
  { code: 'REPUESTO_ELECTRICO', name: 'Repuestos Eléctricos 24V', color: 'amber' },
  { code: 'CABLEADO_CONECTORES', name: 'Cableado Ignífugo & Conectores', color: 'blue' },
  { code: 'FILAMENTO_3D', name: 'Filamentos Técnicos 3D', color: 'purple' },
  { code: 'ILUMINACION_FAROS', name: 'Iluminación & Faros LED', color: 'yellow' },
  { code: 'SENSORES_ACTUADORES', name: 'Sensores & Actuadores', color: 'emerald' },
  { code: 'CONSUMIBLES_TALLER', name: 'Consumibles & Químicos', color: 'slate' },
  { code: 'MECANICA_LIGERA', name: 'Mecánica Ligera & Accesorios', color: 'rose' }
];

// GET /api/inventory/categories
exports.getCategories = async (req, res) => {
  try {
    let categories = await InventoryCategory.find().sort({ name: 1 });
    if (!categories || categories.length === 0) {
      await InventoryCategory.insertMany(DEFAULT_CATEGORIES);
      categories = await InventoryCategory.find().sort({ name: 1 });
    }
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/inventory/categories
exports.createCategory = async (req, res) => {
  try {
    const { code, name, description, color } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'El nombre de la categoría es obligatorio' });
    }
    const cleanCode = (code || name).toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '');
    const existing = await InventoryCategory.findOne({ code: cleanCode });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Ya existe una categoría con ese código/nombre' });
    }
    const category = await InventoryCategory.create({
      code: cleanCode,
      name: name.trim(),
      description: description || '',
      color: color || 'amber'
    });
    res.status(201).json({ success: true, message: 'Categoría creada con éxito', data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/inventory/categories/:id
exports.deleteCategory = async (req, res) => {
  try {
    const category = await InventoryCategory.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Categoría no encontrada' });
    }
    res.json({ success: true, message: 'Categoría eliminada con éxito' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// CRUD UNIDADES DE MEDIDA DE INVENTARIO
// ==========================================
const DEFAULT_UNITS = [
  { code: 'UDS', name: 'Unidades', abbreviation: 'Uds.' },
  { code: 'METROS', name: 'Metros Lineales', abbreviation: 'Metros' },
  { code: 'KITS', name: 'Kits / Juegos', abbreviation: 'Kits' },
  { code: 'ROLLOS', name: 'Rollos', abbreviation: 'Rollos' },
  { code: 'GRAMOS', name: 'Gramos', abbreviation: 'g' },
  { code: 'KILOS', name: 'Kilogramos', abbreviation: 'kg' },
  { code: 'LITROS', name: 'Litros / Galones', abbreviation: 'Lt.' }
];

// GET /api/inventory/units
exports.getUnits = async (req, res) => {
  try {
    let units = await InventoryUnit.find().sort({ name: 1 });
    if (!units || units.length === 0) {
      await InventoryUnit.insertMany(DEFAULT_UNITS);
      units = await InventoryUnit.find().sort({ name: 1 });
    }
    res.json({ success: true, data: units });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/inventory/units
exports.createUnit = async (req, res) => {
  try {
    const { code, name, abbreviation } = req.body;
    if (!name || !abbreviation) {
      return res.status(400).json({ success: false, message: 'El nombre y la abreviatura son obligatorios' });
    }
    const cleanCode = (code || abbreviation).toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '');
    const existing = await InventoryUnit.findOne({ code: cleanCode });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Ya existe una unidad con ese código/abreviatura' });
    }
    const unit = await InventoryUnit.create({
      code: cleanCode,
      name: name.trim(),
      abbreviation: abbreviation.trim()
    });
    res.status(201).json({ success: true, message: 'Unidad de medida creada con éxito', data: unit });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/inventory/units/:id
exports.deleteUnit = async (req, res) => {
  try {
    const unit = await InventoryUnit.findByIdAndDelete(req.params.id);
    if (!unit) {
      return res.status(404).json({ success: false, message: 'Unidad no encontrada' });
    }
    res.json({ success: true, message: 'Unidad de medida eliminada con éxito' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


