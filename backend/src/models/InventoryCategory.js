const mongoose = require('mongoose');

const InventoryCategorySchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  color: { type: String, default: 'amber' }
}, { timestamps: true });

module.exports = mongoose.model('InventoryCategory', InventoryCategorySchema);
