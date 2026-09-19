const mongoose = require('mongoose');

const ClientSchema = new mongoose.Schema({
  docType: { type: String, enum: ['RUC', 'DNI', 'CE', 'OTRO'], default: 'RUC' },
  docNumber: { type: String, required: true, trim: true },
  name: { type: String, required: true, trim: true }, // Razón social o Nombre completo
  contactPerson: { type: String, trim: true, default: '' },
  phone: { type: String, trim: true, default: '' },
  email: { type: String, trim: true, default: '' },
  address: { type: String, trim: true, default: '' },
  city: { type: String, default: 'Lima' }
}, { timestamps: true });

ClientSchema.index({ docNumber: 1 });

module.exports = mongoose.model('Client', ClientSchema);
