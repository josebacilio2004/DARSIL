const CatalogItem = require('../models/CatalogItem');

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

    const items = await CatalogItem.find(filter).sort({ code: 1 });
    res.json({ success: true, count: items.length, data: items });
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
