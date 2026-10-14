const mongoose = require('mongoose');

const InvoiceItemSchema = new mongoose.Schema({
  code: { type: String, trim: true, default: '' },
  description: { type: String, required: true, trim: true },
  quantity: { type: Number, required: true, min: 0.01, default: 1 },
  unit: { type: String, default: 'NIU' }, // NIU para unidades/repuestos, ZZ para servicios
  unitPrice: { type: Number, required: true, min: 0 }, // Precio de venta (con IGV)
  unitValue: { type: Number, required: true, min: 0 }, // Valor unitario (sin IGV)
  igv: { type: Number, required: true, default: 0 },
  subtotal: { type: Number, required: true, min: 0 }, // Base imponible
  total: { type: Number, required: true, min: 0 }
});

const ElectronicInvoiceSchema = new mongoose.Schema({
  // Tipo de Comprobante: 01 = Factura, 03 = Boleta, 07 = Nota de Crédito
  invoiceType: { 
    type: String, 
    required: true, 
    enum: ['01', '03', '07'],
    default: '01'
  },
  serie: { type: String, required: true, trim: true, uppercase: true }, // F001, B001
  number: { type: Number, required: true }, // 1, 2, 3...
  fullNumber: { type: String, required: true, unique: true, uppercase: true, trim: true }, // F001-00000001
  
  issueDate: { type: Date, default: Date.now },
  dueDate: { type: Date },
  currency: { type: String, default: 'PEN' }, // Soles
  
  // Datos del Receptor / Cliente
  clientDocType: { type: String, required: true, enum: ['6', '1', '4', '7'], default: '6' }, // 6 = RUC, 1 = DNI
  clientDoc: { type: String, required: true, trim: true },
  clientName: { type: String, required: true, trim: true },
  clientAddress: { type: String, default: 'Lima, Perú', trim: true },
  clientPhone: { type: String, default: '', trim: true },
  clientEmail: { type: String, default: '', trim: true },
  
  // Vehículo asociado al servicio técnico
  plate: { type: String, uppercase: true, default: '', trim: true },
  vin: { type: String, uppercase: true, default: '', trim: true },
  vehicleModel: { type: String, default: '', trim: true },
  
  // Trazabilidad Operativa
  quoteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quote' },
  quoteNumber: { type: String, default: '', trim: true },
  workOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkOrder' },
  workOrderNumber: { type: String, default: '', trim: true },
  
  // Partidas del Comprobante
  items: [InvoiceItemSchema],
  
  // Resumen Tributario UBL 2.1
  totals: {
    opGravadas: { type: Number, required: true, default: 0 },
    opExoneradas: { type: Number, default: 0 },
    opInafectas: { type: Number, default: 0 },
    igv: { type: Number, required: true, default: 0 },
    total: { type: Number, required: true, default: 0 },
    totalWords: { type: String, default: '' } // "SON: CINCO MIL NOVECIENTOS CON 00/100 SOLES"
  },
  
  // Estado ante SUNAT
  sunatStatus: {
    type: String,
    enum: ['ACEPTADO', 'RECHAZADO', 'PENDIENTE', 'ANULADO'],
    default: 'ACEPTADO'
  },
  sunatResponse: {
    code: { type: String, default: '0' },
    description: { type: String, default: 'La Factura número F001-XXXX, ha sido aceptada por SUNAT' },
    hash: { type: String, default: '' }, // Hash SHA-256 del XML firmado
    qrCode: { type: String, default: '' }, // Contenido o Data URL del QR oficial
    cdrZipBase64: { type: String, default: '' },
    xmlContent: { type: String, default: '' },
    ticketSunat: { type: String, default: '' }
  },
  
  environment: {
    type: String,
    enum: ['BETA', 'PRODUCCION'],
    default: 'BETA'
  },
  
  paymentCondition: { type: String, default: 'Contado' },
  advisorName: { type: String, default: 'Darios Bacilio' },
  notes: { type: String, default: '' }
}, {
  timestamps: true
});

module.exports = mongoose.model('ElectronicInvoice', ElectronicInvoiceSchema);
