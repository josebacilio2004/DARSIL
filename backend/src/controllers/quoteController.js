const path = require('path');
const fs = require('fs');
const Quote = require('../models/Quote');
const CompanyConfig = require('../models/CompanyConfig');
const Client = require('../models/Client');
const Vehicle = require('../models/Vehicle');
const { generateQuotePdf } = require('../services/pdfService');
const { generateWhatsAppShareLink } = require('../services/integrationService');
const { getNextAtomicQuoteNumber } = require('../services/sequenceService');
const { validatePlateAndModel, syncVehicleRecord } = require('../services/vehicleValidationService');

exports.getQuotes = async (req, res) => {
  try {
    const { status, search, templateType } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (templateType) filter.templateType = templateType;
    if (search) {
      filter.$or = [
        { quoteNumber: new RegExp(search, 'i') },
        { clientName: new RegExp(search, 'i') },
        { plate: new RegExp(search, 'i') },
        { vin: new RegExp(search, 'i') },
        { clientAddress: new RegExp(search, 'i') }
      ];
    }

    const quotes = await Quote.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: quotes.length, data: quotes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getQuoteById = async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id);
    if (!quote) {
      return res.status(404).json({ success: false, message: 'Cotización no encontrada' });
    }
    const whatsappInfo = generateWhatsAppShareLink(quote, `${req.protocol}://${req.get('host')}`);
    res.json({ success: true, data: quote, whatsapp: whatsappInfo });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createQuote = async (req, res) => {
  try {
    const company = await CompanyConfig.findOne() || {};

    // 1. Validación estricta de Placa vs Modelo en Perú
    if (req.body.plate && req.body.plate !== 'POR ASIGNAR') {
      const plateValidation = await validatePlateAndModel(req.body.plate, req.body.model);
      if (!plateValidation.valid) {
        return res.status(400).json({
          success: false,
          code: plateValidation.code || 'PLATE_MODEL_MISMATCH',
          message: plateValidation.message,
          existingModel: plateValidation.existingModel
        });
      }
      if (plateValidation.existingModel && !req.body.model) {
        req.body.model = plateValidation.existingModel;
      }
    }

    let quoteNumber = req.body.quoteNumber;
    if (!quoteNumber) {
      quoteNumber = await getNextAtomicQuoteNumber();
    }

    const items = (req.body.items || []).map(i => ({
      ...i,
      quantity: Number(i.quantity) || 1,
      unitPrice: Number(i.unitPrice) || 0,
      value: (Number(i.quantity) || 1) * (Number(i.unitPrice) || 0)
    }));

    const subtotal = items.reduce((acc, curr) => acc + curr.value, 0);
    const applyIgv = req.body.applyIgv === true;
    const igv = applyIgv ? subtotal * 0.18 : 0;
    const total = subtotal + igv;

    // Calcular fechas y plazos para que NUNCA salgan vacíos
    const issueDate = req.body.issueDate ? new Date(req.body.issueDate) : new Date();
    const validUntil = req.body.validUntil 
      ? new Date(req.body.validUntil) 
      : new Date(issueDate.getTime() + 15 * 24 * 60 * 60 * 1000); // 15 días hábiles

    const deliveryTerm = (req.body.deliveryTerm && req.body.deliveryTerm.trim() !== '')
      ? req.body.deliveryTerm.trim()
      : 'Inmediato / Según programación';

    const referencePerson = (req.body.referencePerson && req.body.referencePerson.trim() !== '')
      ? req.body.referencePerson.trim()
      : (req.body.clientName || 'Atención en Taller');

    const orderType = (req.body.orderType && req.body.orderType.trim() !== '')
      ? req.body.orderType.trim()
      : 'Taller de Servicios';

    // Guardar o vincular cliente si se envían datos
    let clientId = req.body.clientId;
    if (!clientId && req.body.clientDoc) {
      let client = await Client.findOne({ docNumber: req.body.clientDoc });
      if (!client) {
        client = await Client.create({
          docNumber: req.body.clientDoc,
          name: req.body.clientName || 'Cliente Particular',
          phone: req.body.clientPhone,
          address: req.body.clientAddress,
          contactPerson: referencePerson
        });
      }
      clientId = client._id;
    }

    // Guardar o vincular vehículo si viene placa
    let vehicleId = req.body.vehicleId;
    if (!vehicleId && req.body.plate && req.body.plate !== 'POR ASIGNAR') {
      const formattedPlate = req.body.plate.toUpperCase().trim();
      let vehicle = await Vehicle.findOne({ plate: formattedPlate });
      if (!vehicle) {
        vehicle = await Vehicle.create({
          clientId,
          plate: formattedPlate,
          vin: req.body.vin,
          model: req.body.model
        });
      }
      vehicleId = vehicle._id;
    }

    const newQuote = new Quote({
      ...req.body,
      quoteNumber,
      clientId,
      vehicleId,
      issueDate,
      validUntil,
      deliveryTerm,
      referencePerson,
      orderType,
      items,
      subtotal,
      igv,
      total,
      bankAccountsSnapshot: company.bankAccounts || []
    });

    try {
      await newQuote.save();
    } catch (saveErr) {
      // Reintento atómico automático ante colisión E11000 bajo alta concurrencia
      if (saveErr.code === 11000 && !req.body.quoteNumber) {
        newQuote.quoteNumber = await getNextAtomicQuoteNumber();
        await newQuote.save();
      } else {
        throw saveErr;
      }
    }

    // Generar PDF con Puppeteer de forma protegida
    try {
      const pdfResult = await generateQuotePdf(newQuote, company);
      newQuote.pdfUrl = pdfResult.urlPath;
      await newQuote.save();
    } catch (pdfErr) {
      console.warn('Aviso: El PDF se generará bajo demanda al consultar la cotización:', pdfErr.message);
      newQuote.pdfUrl = `/api/quotes/${newQuote._id}/pdf`;
      await newQuote.save();
    }

    // Sincronizar vehículo en la base de datos
    if (newQuote.plate && newQuote.plate !== 'POR ASIGNAR') {
      syncVehicleRecord({
        plate: newQuote.plate,
        model: newQuote.model,
        vin: newQuote.vin,
        clientId: newQuote.clientId
      }).catch(err => console.warn('Aviso sincronizando vehículo:', err.message));
    }

    const whatsappInfo = generateWhatsAppShareLink(newQuote, `${req.protocol}://${req.get('host')}`);

    res.status(201).json({
      success: true,
      message: 'Cotización creada exitosamente',
      data: newQuote,
      whatsapp: whatsappInfo
    });
  } catch (error) {
    console.error('Error al crear cotización:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateQuote = async (req, res) => {
  try {
    const company = await CompanyConfig.findOne() || {};
    const quote = await Quote.findById(req.params.id);
    if (!quote) {
      return res.status(404).json({ success: false, message: 'Cotización no encontrada' });
    }

    // Validar coherencia de placa vs modelo
    const targetPlate = req.body.plate || quote.plate;
    const targetModel = req.body.model !== undefined ? req.body.model : quote.model;
    if (targetPlate && targetPlate !== 'POR ASIGNAR') {
      const plateValidation = await validatePlateAndModel(targetPlate, targetModel);
      if (!plateValidation.valid) {
        return res.status(400).json({
          success: false,
          code: plateValidation.code || 'PLATE_MODEL_MISMATCH',
          message: plateValidation.message,
          existingModel: plateValidation.existingModel
        });
      }
    }

    Object.assign(quote, req.body);

    if (req.body.items) {
      quote.items = req.body.items.map(i => ({
        ...i,
        quantity: Number(i.quantity) || 1,
        unitPrice: Number(i.unitPrice) || 0,
        value: (Number(i.quantity) || 1) * (Number(i.unitPrice) || 0)
      }));
      quote.subtotal = quote.items.reduce((acc, curr) => acc + curr.value, 0);
      quote.igv = quote.applyIgv ? quote.subtotal * 0.18 : 0;
      quote.total = quote.subtotal + quote.igv;
    }

    if (!quote.validUntil) {
      quote.validUntil = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
    }
    if (!quote.deliveryTerm) {
      quote.deliveryTerm = 'Inmediato / Según programación';
    }
    if (!quote.referencePerson) {
      quote.referencePerson = quote.clientName || 'Atención en Taller';
    }

    try {
      const pdfResult = await generateQuotePdf(quote, company);
      quote.pdfUrl = pdfResult.urlPath;
      await quote.save();
    } catch (pdfErr) {
      console.warn('Aviso: El PDF se generará bajo demanda al consultar la cotización:', pdfErr.message);
      quote.pdfUrl = `/api/quotes/${quote._id}/pdf`;
      await quote.save();
    }

    // Sincronizar vehículo
    if (quote.plate && quote.plate !== 'POR ASIGNAR') {
      syncVehicleRecord({
        plate: quote.plate,
        model: quote.model,
        vin: quote.vin,
        clientId: quote.clientId
      }).catch(err => console.warn('Aviso sincronizando vehículo:', err.message));
    }

    const whatsappInfo = generateWhatsAppShareLink(quote, `${req.protocol}://${req.get('host')}`);

    res.json({ success: true, message: 'Cotización actualizada', data: quote, whatsapp: whatsappInfo });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteQuote = async (req, res) => {
  try {
    const quote = await Quote.findByIdAndDelete(req.params.id);
    if (!quote) return res.status(404).json({ success: false, message: 'Cotización no encontrada' });
    res.json({ success: true, message: 'Cotización eliminada exitosamente' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const quote = await Quote.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!quote) return res.status(404).json({ success: false, message: 'Cotización no encontrada' });
    res.json({ success: true, message: `Estado actualizado a ${status}`, data: quote });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.addSignature = async (req, res) => {
  try {
    const { clientSignature, advisorSignature } = req.body;
    const company = await CompanyConfig.findOne() || {};
    const quote = await Quote.findById(req.params.id);
    if (!quote) return res.status(404).json({ success: false, message: 'Cotización no encontrada' });

    if (clientSignature) quote.clientSignature = clientSignature;
    if (advisorSignature) quote.advisorSignature = advisorSignature;

    const pdfResult = await generateQuotePdf(quote, company);
    quote.pdfUrl = pdfResult.urlPath;
    await quote.save();

    res.json({ success: true, message: 'Firma registrada y PDF actualizado', data: quote });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.downloadPdf = async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id);
    if (!quote) return res.status(404).json({ success: false, message: 'Cotización no encontrada' });

    const uploadsDir = path.join(__dirname, '../../uploads/quotes');
    const existingFile = path.join(uploadsDir, `${quote.quoteNumber}.pdf`);

    if (fs.existsSync(existingFile)) {
      const buffer = fs.readFileSync(existingFile);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${quote.quoteNumber}.pdf"`);
      return res.send(buffer);
    }

    const company = await CompanyConfig.findOne() || {};
    const pdfResult = await generateQuotePdf(quote, company);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${quote.quoteNumber}.pdf"`);
    res.send(pdfResult.buffer);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
