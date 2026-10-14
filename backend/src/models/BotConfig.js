const mongoose = require('mongoose');

const BotConfigSchema = new mongoose.Schema({
  phoneNumber: { type: String, default: '+51 934 787 006' },
  status: {
    type: String,
    enum: ['CONECTADO', 'DESCONECTADO', 'EMPAREJANDO'],
    default: 'CONECTADO'
  },
  sessionQr: { type: String, default: '' },
  lastConnectedAt: { type: Date, default: Date.now },
  batteryLevel: { type: Number, default: 98 },
  
  // Disparadores automáticos (Triggers)
  triggers: {
    autoSendQuote: { type: Boolean, default: true },
    autoSendCheckIn: { type: Boolean, default: true },
    autoSendDiagnosis: { type: Boolean, default: true },
    autoSendFinished: { type: Boolean, default: true },
    autoSendInvoice: { type: Boolean, default: true }
  },
  
  // Plantillas de Mensajes
  templates: {
    quote: {
      type: String,
      default: '⚡ *DARSIL AUTOMOTIVE SOLUTIONS* ⚡\nEstimado/a *{{cliente}}*, le compartimos la cotización oficial {{numero}} por un total de {{total}}.\nPuede descargar el PDF oficial aquí: {{pdfUrl}}'
    },
    checkin: {
      type: String,
      default: '🔧 *DARSIL TALLER - CHECK-IN* 🔧\nEstimado/a *{{cliente}}*, su unidad {{vehiculo}} (Placa: {{placa}}) ha ingresado a taller para diagnóstico.\nActa de recepción: {{pdfUrl}}'
    },
    finished: {
      type: String,
      default: '✅ *UNIDAD LISTA PARA RETIRO* ✅\nEstimado/a *{{cliente}}*, su unidad {{vehiculo}} (Placa: {{placa}}) ha finalizado exitosamente el servicio técnico en Taller DARSIL.'
    },
    invoice: {
      type: String,
      default: '📄 *COMPROBANTE ELECTRÓNICO SUNAT* 📄\nEstimado/a *{{cliente}}*, adjuntamos su {{tipoDoc}} {{numero}} por un total de {{total}}.\nComprobante oficial: {{pdfUrl}}'
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('BotConfig', BotConfigSchema);
