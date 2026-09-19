const CatalogItem = require('../models/CatalogItem');
const { OFFICIAL_CATALOG } = require('../services/initService');

exports.getCatalog = async (req, res) => {
  try {
    const { category, search } = req.query;
    const filter = { isActive: true };

    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { code: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') }
      ];
    }

    let items = await CatalogItem.find(filter).sort({ code: 1 });

    // Si la coleccion esta vacia en la BD, auto-poblar inmediatamente
    if (items.length === 0 && !category && !search) {
      console.log('Catalogo vacio en base de datos. Auto-poblando 25 servicios oficiales...');
      await CatalogItem.insertMany(OFFICIAL_CATALOG);
      items = await CatalogItem.find(filter).sort({ code: 1 });
    }

    res.json({ success: true, count: items.length, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.seedCatalog = async (req, res) => {
  try {
    for (const item of OFFICIAL_CATALOG) {
      await CatalogItem.findOneAndUpdate(
        { code: item.code },
        item,
        { upsert: true, new: true }
      );
    }
    const all = await CatalogItem.find({ isActive: true }).sort({ code: 1 });
    res.json({ success: true, message: 'Catalogo oficial sincronizado con exito', count: all.length, data: all });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createCatalogItem = async (req, res) => {
  try {
    const item = await CatalogItem.create(req.body);
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateCatalogItem = async (req, res) => {
  try {
    const item = await CatalogItem.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ success: false, message: 'Item de catalogo no encontrado' });
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteCatalogItem = async (req, res) => {
  try {
    const item = await CatalogItem.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Item de catalogo no encontrado' });
    res.json({ success: true, message: 'Item de catalogo eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
