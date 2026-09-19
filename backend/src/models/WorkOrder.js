const mongoose = require('mongoose');

const WorkOrderTaskSchema = new mongoose.Schema({
  description: { type: String, required: true, trim: true },
  mechanic: { type: String, default: '' },
  isCompleted: { type: Boolean, default: false },
  completedAt: { type: Date }
});

const WorkOrderMaterialSchema = new mongoose.Schema({
  inventoryItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryItem' },
  sku: { type: String, default: '' },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 0.01 },
  unit: { type: String, default: 'Uds.' },
  unitPrice: { type: Number, default: 0 }
});

const WorkOrderSchema = new mongoose.Schema({
  orderNumber: { 
    type: String, 
    required: true, 
    unique: true, 
    uppercase: true, 
    trim: true 
  }, // ej. OT-2026-001
  
  // Vinculación opcional con Cotización previa
  quoteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quote' },
  quoteNumber: { type: String, default: '' },

  // Cliente y Vehículo
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  clientName: { type: String, required: true },
  clientDoc: { type: String, default: '' },
  clientPhone: { type: String, default: '' },
  clientAddress: { type: String, default: '' },

  plate: { type: String, required: true, uppercase: true, trim: true }, // Placa / Matrícula
  vin: { type: String, default: '' },
  model: { type: String, default: '' },
  unitType: { type: String, default: 'Tractocamión' }, // Tracto, Mixer, Bus, etc.

  assignedMechanic: { type: String, default: 'Ruben Basil' },
  status: {
    type: String,
    enum: [
      'RECEPCIONADO', 
      'EN_DIAGNOSTICO', 
      'EN_PROCESO', 
      'PRUEBA_BANCO_24V', 
      'CONTROL_CALIDAD', 
      'FINALIZADO', 
      'ENTREGADO'
    ],
    default: 'RECEPCIONADO'
  },

  // Check-In Digital de Recepción
  checkInDate: { type: Date, default: Date.now },
  driverName: { type: String, default: '' }, // Conductor que ingresa la unidad
  driverPhone: { type: String, default: '' },
  mileage: { type: String, default: '' }, // Kilometraje (ej. 145,000 km)
  hourmeter: { type: String, default: '' }, // Horómetro (ej. 3,500 hrs)
  fuelLevel: { 
    type: String, 
    enum: ['RESERVA', '1/4', '1/2', '3/4', 'LLENO'], 
    default: '1/2' 
  },
  batteryVoltage: { type: String, default: '25.2 V' }, // Voltaje medido en reposo
  
  entryChecklist: {
    bancoBaterias: { type: String, default: 'BUENO' }, // BUENO, REGULAR, DEFICIENTE
    arrancador: { type: String, default: 'OPERATIVO' }, // OPERATIVO, FALLA_ARRANQUE, NO_GIRA
    alternador: { type: String, default: 'OPERATIVO' }, // OPERATIVO, NO_CARGA, DEFICIENTE
    lucesYFaros: { type: String, default: 'OPERATIVO' }, // OPERATIVO, PARCIAL, DEFICIENTE
    ramalElectrico: { type: String, default: 'INTEGRO' }, // INTEGRO, CORTADO, REPARADO
    computadoraEcu: { type: String, default: 'SIN_ERRORES' }, // SIN_ERRORES, CHECK_ACTIVO
    llantaRepuesto: { type: Boolean, default: true },
    extintor: { type: Boolean, default: true },
    herramientas: { type: Boolean, default: true }
  },

  reportedFault: { type: String, required: true }, // Falla reportada por el cliente
  visualObservations: { type: String, default: 'Unidad ingresa en condiciones habituales de operación.' },
  
  // Tareas y Materiales
  tasks: [WorkOrderTaskSchema],
  materialsUsed: [WorkOrderMaterialSchema],

  // Entrega y Salida
  deliveredTo: { type: String, default: '' },
  deliveredAt: { type: Date },
  clientSignature: { type: String, default: null }, // Base64 de firma táctil
  deliveryNotes: { type: String, default: '' },
  pdfUrl: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('WorkOrder', WorkOrderSchema);
