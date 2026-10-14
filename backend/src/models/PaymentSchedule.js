const mongoose = require('mongoose');

const InstallmentSchema = new mongoose.Schema({
  installmentNumber: { type: Number, required: true },
  amount: { type: Number, required: true },
  dueDate: { type: Date, required: true },
  isPaid: { type: Boolean, default: false },
  paidAmount: { type: Number, default: 0 },
  paidAt: { type: Date, default: null },
  status: {
    type: String,
    enum: ['PENDIENTE', 'POR_VENCER', 'AL_DIA', 'VENCIDO', 'PAGADO'],
    default: 'PENDIENTE'
  },
  notes: { type: String, default: '' }
});

const PaymentReceiptSchema = new mongoose.Schema({
  receiptNumber: { type: String, required: true }, // ej. RC-2026-001
  amount: { type: Number, required: true },
  paymentDate: { type: Date, default: Date.now },
  paymentMethod: { 
    type: String, 
    default: 'TRANSFERENCIA_BCP' 
  },
  operationNumber: { type: String, default: '' }, // N° de Operación o Voucher
  installmentIndex: { type: Number, default: null }, // Cuota aplicada
  registeredBy: { type: String, default: 'Darios Bacilio' },
  notes: { type: String, default: '' },
  receiptPdfUrl: { type: String, default: '' }
}, { timestamps: true });

const PaymentScheduleSchema = new mongoose.Schema({
  contractNumber: { type: String, required: true, unique: true, uppercase: true, trim: true }, // ej. CONTRATO-DA-2026-004
  quoteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quote', required: true },
  quoteNumber: { type: String, required: true, uppercase: true },
  workOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkOrder', default: null },
  workOrderNumber: { type: String, default: '' },

  // Datos del Cliente (para ordenamiento A-Z rápido y búsqueda)
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  clientName: { type: String, required: true, trim: true, index: true },
  clientDoc: { type: String, default: '' },
  clientPhone: { type: String, default: '' },
  clientAddress: { type: String, default: '' },
  clientEmail: { type: String, default: '' },

  // Vehículo
  plate: { type: String, uppercase: true, default: '', index: true },
  model: { type: String, default: '' },
  vin: { type: String, default: '' },

  // Asesor Técnico
  advisorName: { type: String, default: 'Darios Bacilio' },
  advisorPhone: { type: String, default: '934787006' },

  // Montos Financieros
  currency: { type: String, default: 'PEN' }, // Soles
  totalAmount: { type: Number, required: true, min: 0 },
  paidAmount: { type: Number, default: 0, min: 0 },
  balance: { type: Number, required: true, min: 0 }, // Saldo restante por cobrar

  // Modalidad de Pago
  paymentType: {
    type: String,
    enum: ['PAGO_UNICO', 'EN_PARTES'],
    default: 'EN_PARTES'
  },
  status: {
    type: String,
    enum: ['EN_CRONOGRAMA', 'PAGO_PARCIAL', 'PAGADO', 'VENCIDO'],
    default: 'EN_CRONOGRAMA',
    index: true
  },

  // Cronograma de Cuotas Cronológicas
  installments: [InstallmentSchema],

  // Historial de Pagos / Abonos Registrados
  payments: [PaymentReceiptSchema],

  // Cláusulas Contractuales Personalizadas por el Asesor
  clauses: [{
    title: { type: String, required: true },
    content: { type: String, required: true }
  }],

  // Documentos PDF Generados
  contractPdfUrl: { type: String, default: '' },
  pazYSalvoPdfUrl: { type: String, default: '' },

  // Firmas Digitales
  clientSignature: { type: String, default: null },
  advisorSignature: { type: String, default: null },

  // Recordatorios y Alertas
  lastReminderSentAt: { type: Date, default: null },
  lastAdvisorAlertSentAt: { type: Date, default: null },
  notes: { type: String, default: '' }
}, {
  timestamps: true
});

// Índice compuesto para ordenamiento alfabético optimizado
PaymentScheduleSchema.index({ clientName: 1, status: 1 });
PaymentScheduleSchema.index({ balance: 1 });

module.exports = mongoose.model('PaymentSchedule', PaymentScheduleSchema);
