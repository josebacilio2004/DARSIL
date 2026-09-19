const mongoose = require('mongoose');

const QuoteItemSchema = new mongoose.Schema({
  code: { type: String, trim: true, default: '' }, // ej. MO01
  description: { type: String, required: true, trim: true },
  quantity: { type: Number, required: true, min: 1, default: 1 },
  unit: { type: String, default: 'Uds.' },
  stockDisp: { type: String, default: '' },
  unitPrice: { type: Number, required: true, min: 0 },
  value: { type: Number, required: true, min: 0 } // quantity * unitPrice
});

const FleetUnitSchema = new mongoose.Schema({
  unitType: { type: String, required: true }, // ej. Bus 12 m, Bus 9 m
  quantity: { type: Number, required: true, min: 1 },
  itemsPerUnit: { type: Number, default: 1 }, // ej. 7 sensores / bus
  totalItems: { type: Number, required: true } // quantity * itemsPerUnit
});

const QuoteSchema = new mongoose.Schema({
  quoteNumber: { type: String, required: true, unique: true, uppercase: true, trim: true }, // ej. DA-2026-018
  templateType: { 
    type: String, 
    enum: ['TALLER_DETALLADO', 'PROYECTO_ESPECIAL'], 
    default: 'TALLER_DETALLADO' 
  },
  status: {
    type: String,
    enum: ['BORRADOR', 'ENVIADA', 'APROBADA', 'EN_TALLER', 'FACTURADA', 'RECHAZADA'],
    default: 'BORRADOR'
  },
  
  // Cliente y Vehículo
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  clientName: { type: String, required: true },
  clientDoc: { type: String, default: '' },
  clientAddress: { type: String, default: '' },
  clientPhone: { type: String, default: '' },
  clientEmail: { type: String, default: '' },
  
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
  plate: { type: String, uppercase: true, default: '' }, // Matrícula
  vin: { type: String, uppercase: true, default: '' },
  model: { type: String, default: '' },
  
  // Metadatos
  orderType: { type: String, default: 'Taller de Servicios' }, // Tipo Pedido
  referencePerson: { type: String, default: '' }, // Referencia / Contacto
  advisorName: { type: String, default: 'Ruben Basil' },
  advisorPhone: { type: String, default: '934787006' },
  location: { type: String, default: 'Lima' },
  
  // Fechas
  issueDate: { type: Date, default: Date.now }, // Fecha Alta
  validUntil: { type: Date }, // Fecha Validez
  deliveryTerm: { type: String, default: '' }, // Plazo Entrega
  commissionDays: { type: String, default: '' }, // ej. 4 días
  
  // Contenido de la Cotización
  items: [QuoteItemSchema],
  
  // Campos específicos para PROYECTO_ESPECIAL (Plantilla 1)
  projectObject: { type: String, default: '' }, // 1. OBJETO
  fleetUnits: [FleetUnitSchema], // 2. ALCANCE Y CANTIDAD DE UNIDADES
  executionTime: { type: String, default: '' }, // 4. TIEMPO DE EJECUCIÓN
  includes: [{ type: String }], // 5. INCLUYE
  notIncludes: [{ type: String }], // NO INCLUYE
  commercialConditions: [{ type: String }], // 6. CONDICIONES COMERCIALES
  
  // Totales
  currency: { type: String, default: 'PEN' }, // Soles (S/) o USD
  subtotal: { type: Number, required: true, default: 0 },
  igv: { type: Number, default: 0 },
  applyIgv: { type: Boolean, default: false },
  total: { type: Number, required: true, default: 0 },
  
  // Cuentas Bancarias
  bankAccountsSnapshot: [
    {
      bank: String,
      accountNumber: String,
      interbankAccount: String
    }
  ],
  
  // Observaciones y Notas
  paymentCondition: { type: String, default: 'Condición de pago 07 días despues de realizar el servicio.' },
  notes: { type: String, default: 'Nota: Cotización válida por 15 días hábiles desde su emisión.' },
  
  // Firmas
  clientSignature: { type: String, default: null }, // Base64 PNG
  advisorSignature: { type: String, default: null }, // Base64 PNG
  
  // Archivo PDF
  pdfUrl: { type: String, default: '' }
}, { timestamps: true });

// QuoteSchema.index({ quoteNumber: 1 });
QuoteSchema.index({ plate: 1 });
QuoteSchema.index({ status: 1 });

module.exports = mongoose.model('Quote', QuoteSchema);
