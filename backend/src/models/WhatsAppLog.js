const mongoose = require('mongoose');

const WhatsAppLogSchema = new mongoose.Schema({
  recipientPhone: { type: String, required: true, trim: true },
  recipientName: { type: String, default: 'Cliente DARSIL', trim: true },
  eventType: {
    type: String,
    enum: [
      'COTIZACION_EMITIDA',
      'CHECKIN_TALLER',
      'DIAGNOSTICO_LISTO',
      'TRABAJO_CONCLUIDO',
      'FACTURA_EMITIDA',
      'MENSAJE_MANUAL',
      'RECORDATORIO_MANTENIMIENTO'
    ],
    default: 'MENSAJE_MANUAL'
  },
  referenceDoc: { type: String, default: '' }, // N° Cotización, N° OT o N° Factura
  messageText: { type: String, required: true },
  mediaUrl: { type: String, default: '' }, // Enlace PDF
  status: {
    type: String,
    enum: ['ENVIADO', 'ENTREGADO', 'LEIDO', 'FALLIDO'],
    default: 'ENVIADO'
  },
  sentBy: { type: String, default: 'Bot DARSIL CRM' },
  errorDetails: { type: String, default: '' }
}, {
  timestamps: true
});

module.exports = mongoose.model('WhatsAppLog', WhatsAppLogSchema);
