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

    // Si la colecci坦n est叩 vac鱈a en la BD, auto-poblar inmediatamente
    if (items.length === 0 && !category && !search) {
      console.log('Cat叩logo vac鱈o en base de datos. Auto-poblando 25 servicios oficiales...');
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
    res.json({ success: true, message: 'Cat叩logo oficial sincronizado con 辿xito', count: all.length, data: all });
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
