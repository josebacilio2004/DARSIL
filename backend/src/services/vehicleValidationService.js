const Vehicle = require('../models/Vehicle');
const WorkOrder = require('../models/WorkOrder');
const Quote = require('../models/Quote');

/**
 * Normaliza una placa vehicular eliminando guiones, espacios y convirtiendo a mayúsculas
 */
function normalizePlate(plate) {
  if (!plate) return '';
  return String(plate).replace(/[^A-Za-z0-9]/g, '').toUpperCase().trim();
}

/**
 * Normaliza un modelo para comparación estricta insensible a mayúsculas/minúsculas y espacios
 */
function normalizeModel(model) {
  if (!model) return '';
  return String(model).toLowerCase().replace(/[\s\-_]+/g, ' ').trim();
}

/**
 * Busca si una placa ya se encuentra registrada previamente en el sistema (Vehicle, WorkOrder o Quote)
 * y retorna el vehículo con su modelo oficial registrado.
 */
async function findExistingVehicleByPlate(plate) {
  const cleanPlate = normalizePlate(plate);
  if (!cleanPlate || cleanPlate === 'PORASIGNAR') {
    return null;
  }

  // 1. Buscar en la colección oficial de Vehículos
  let vehicle = await Vehicle.findOne({
    $or: [
      { plate: cleanPlate },
      { plate: plate.toUpperCase().trim() },
      { plate: new RegExp(`^${cleanPlate.replace(/([A-Z0-9]{3})([A-Z0-9]{3})/, '$1-?$2')}$`, 'i') }
    ]
  });

  if (vehicle && vehicle.model && vehicle.model.trim()) {
    return {
      source: 'Vehicle',
      id: vehicle._id,
      plate: vehicle.plate,
      model: vehicle.model.trim(),
      brand: vehicle.brand,
      vin: vehicle.vin,
      color: vehicle.color,
      year: vehicle.year
    };
  }

  // 2. Si no está en Vehicle, buscar en Órdenes de Trabajo históricas
  const order = await WorkOrder.findOne({
    $or: [
      { plate: cleanPlate },
      { plate: plate.toUpperCase().trim() },
      { plate: new RegExp(`^${cleanPlate.replace(/([A-Z0-9]{3})([A-Z0-9]{3})/, '$1-?$2')}$`, 'i') }
    ],
    model: { $exists: true, $ne: '' }
  }).sort({ createdAt: -1 });

  if (order && order.model && order.model.trim()) {
    return {
      source: 'WorkOrder',
      id: order._id,
      plate: order.plate,
      model: order.model.trim(),
      vin: order.vin,
      color: order.color,
      year: order.year
    };
  }

  // 3. Buscar en Cotizaciones históricas
  const quote = await Quote.findOne({
    $or: [
      { plate: cleanPlate },
      { plate: plate.toUpperCase().trim() },
      { plate: new RegExp(`^${cleanPlate.replace(/([A-Z0-9]{3})([A-Z0-9]{3})/, '$1-?$2')}$`, 'i') }
    ],
    model: { $exists: true, $ne: '' }
  }).sort({ createdAt: -1 });

  if (quote && quote.model && quote.model.trim()) {
    return {
      source: 'Quote',
      id: quote._id,
      plate: quote.plate,
      model: quote.model.trim(),
      vin: quote.vin
    };
  }

  return null;
}

/**
 * Valida la consistencia de placa vehicular contra modelo según normativa peruana:
 * En el Perú, una placa única de rodaje pertenece a una sola unidad vehicular física
 * y no puede registrarse con un modelo distinto.
 */
async function validatePlateAndModel(plate, incomingModel) {
  const cleanPlate = normalizePlate(plate);
  if (!cleanPlate || cleanPlate === 'PORASIGNAR') {
    return { valid: true };
  }

  const existing = await findExistingVehicleByPlate(plate);
  if (!existing || !existing.model) {
    return { valid: true, isNew: true };
  }

  const cleanIncoming = normalizeModel(incomingModel);
  const cleanExisting = normalizeModel(existing.model);

  // Si no se proporcionó modelo entrante, se auto-rellena con el modelo oficial
  if (!cleanIncoming) {
    return {
      valid: true,
      existingModel: existing.model,
      autoFilled: true,
      vehicle: existing
    };
  }

  // Si el modelo entrante no coincide con el registrado en Perú
  if (cleanIncoming !== cleanExisting) {
    return {
      valid: false,
      code: 'PLATE_MODEL_MISMATCH',
      plate: plate.toUpperCase().trim(),
      existingModel: existing.model,
      incomingModel: incomingModel.trim(),
      message: `Inconsistencia vehicular: La placa ${plate.toUpperCase().trim()} ya está registrada con el modelo "${existing.model}". En Perú una placa de rodaje pertenece a un único vehículo y no puede asociarse al modelo diferente "${incomingModel.trim()}".`
    };
  }

  return {
    valid: true,
    existingModel: existing.model,
    vehicle: existing
  };
}

/**
 * Asegura que el vehículo quede registrado o actualizado en la colección Vehicle
 */
async function syncVehicleRecord({ plate, model, vin, color, year, clientId }) {
  const cleanPlate = normalizePlate(plate);
  if (!cleanPlate || cleanPlate === 'PORASIGNAR') return null;

  const formattedPlate = plate.toUpperCase().trim();
  let vehicle = await Vehicle.findOne({
    $or: [
      { plate: cleanPlate },
      { plate: formattedPlate }
    ]
  });

  if (!vehicle) {
    vehicle = await Vehicle.create({
      plate: formattedPlate,
      model: model || '',
      vin: vin || '',
      color: color || '',
      year: Number(year) || undefined,
      clientId: clientId || null
    });
  } else {
    let updated = false;
    if (model && !vehicle.model) { vehicle.model = model; updated = true; }
    if (vin && !vehicle.vin) { vehicle.vin = vin; updated = true; }
    if (color && !vehicle.color) { vehicle.color = color; updated = true; }
    if (year && !vehicle.year) { vehicle.year = Number(year); updated = true; }
    if (clientId && !vehicle.clientId) { vehicle.clientId = clientId; updated = true; }
    if (updated) await vehicle.save();
  }

  return vehicle;
}

module.exports = {
  normalizePlate,
  normalizeModel,
  findExistingVehicleByPlate,
  validatePlateAndModel,
  syncVehicleRecord
};
