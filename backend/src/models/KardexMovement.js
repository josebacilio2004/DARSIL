const mongoose = require('mongoose');

const KardexMovementSchema = new mongoose.Schema({
  itemId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'InventoryItem', 
    required: true 
  },
  sku: { 
    type: String, 
    required: true, 
    uppercase: true 
  },
  itemName: { 
    type: String, 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['ENTRADA', 'SALIDA', 'AJUSTE_POSITIVO', 'AJUSTE_NEGATIVO'], 
    required: true 
  },
  quantity: { 
    type: Number, 
    required: true, 
    min: 0.01 
  },
  unitCost: { 
    type: Number, 
    default: 0 
  },
  previousStock: { 
    type: Number, 
    required: true 
  },
  newStock: { 
    type: Number, 
    required: true 
  },
  referenceDoc: { 
    type: String, 
    default: 'Ajuste Manual' 
  }, // ej. Factura F001-2834, OT-2026-001, DA-2026-018
  performedBy: { 
    type: String, 
    default: 'darios' 
  },
  notes: { 
    type: String, 
    default: '' 
  }
}, { timestamps: true });

module.exports = mongoose.model('KardexMovement', KardexMovementSchema);
