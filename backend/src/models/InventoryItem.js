const mongoose = require('mongoose');

const InventoryItemSchema = new mongoose.Schema({
  sku: { 
    type: String, 
    required: true, 
    unique: true, 
    uppercase: true, 
    trim: true 
  }, // ej. REP-REL-24V, FIL-NYLON-CF, CAB-IGN-01
  name: { 
    type: String, 
    required: true, 
    trim: true 
  }, // ej. Relé de arranque 24V 70A
  category: { 
    type: String, 
    enum: [
      'REPUESTO_ELECTRICO', 
      'CABLEADO_CONECTORES', 
      'FILAMENTO_3D', 
      'ILUMINACION_FAROS', 
      'SENSORES_ACTUADORES',
      'CONSUMIBLES_TALLER'
    ],
    default: 'REPUESTO_ELECTRICO'
  },
  unit: { 
    type: String, 
    default: 'Uds.' 
  }, // Uds., Metros, Gramos (g), Rollos, Kits
  currentStock: { 
    type: Number, 
    required: true, 
    default: 0, 
    min: 0 
  },
  minStock: { 
    type: Number, 
    default: 5, 
    min: 0 
  }, // Alerta de stock crítico
  unitCost: { 
    type: Number, 
    required: true, 
    default: 0, 
    min: 0 
  }, // Costo de adquisición (S/)
  salePrice: { 
    type: Number, 
    required: true, 
    default: 0, 
    min: 0 
  }, // Precio de venta sugerido (S/)
  location: { 
    type: String, 
    default: 'Taller Principal - Almacén A' 
  }, // Ubicación física en taller
  supplier: { 
    type: String, 
    default: '' 
  },
  notes: { 
    type: String, 
    default: '' 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  }
}, { timestamps: true });

module.exports = mongoose.model('InventoryItem', InventoryItemSchema);
