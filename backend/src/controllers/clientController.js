const Client = require('../models/Client');
const Vehicle = require('../models/Vehicle');
const { searchRuc, searchDni } = require('../services/integrationService');

exports.getClients = async (req, res) => {
  try {
    const clients = await Client.find().sort({ name: 1 });
    res.json({ success: true, data: clients });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getVehicles = async (req, res) => {
  try {
    const { plate } = req.query;
    const filter = {};
    if (plate) filter.plate = new RegExp(plate, 'i');
    const vehicles = await Vehicle.find(filter).populate('clientId');
    res.json({ success: true, data: vehicles });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.lookupRuc = async (req, res) => {
  try {
    const { ruc } = req.params;
    const data = await searchRuc(ruc);
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.lookupDni = async (req, res) => {
  try {
    const { dni } = req.params;
    const data = await searchDni(dni);
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
