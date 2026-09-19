const mongoose = require('mongoose');

const CatalogItemSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  description: { type: String, required: true, trim: true },
  category: { 
    type: String, 
    enum: ['MANO_OBRA', 'REPUESTO', 'FABRICACION_3D', 'SOLUCION_ESPECIAL', 'COMISION_CAMPO'],
    default: 'MANO_OBRA' 
  },
  defaultPrice: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'PEN' },
  unit: { type: String, default: 'Uds.' },
  hasStock: { type: Boolean, default: false },
  stockAvailable: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('CatalogItem', CatalogItemSchema);
