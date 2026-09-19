const mongoose = require('mongoose');

const VehicleSchema = new mongoose.Schema({
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  plate: { type: String, required: true, uppercase: true, trim: true }, // Matrícula
  vin: { type: String, uppercase: true, trim: true, default: '' }, // VIN / N° Chasis / Unidad
  brand: { type: String, trim: true, default: '' },
  model: { type: String, trim: true, default: '' }, // ej. Camc Mixer, Bus 12m
  year: { type: Number },
  color: { type: String, default: '' },
  notes: { type: String, default: '' }
}, { timestamps: true });

VehicleSchema.index({ plate: 1 });

module.exports = mongoose.model('Vehicle', VehicleSchema);
