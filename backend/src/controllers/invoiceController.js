const mongoose = require('mongoose');
const ElectronicInvoice = require('../models/ElectronicInvoice');
const Quote = require('../models/Quote');
const WorkOrder = require('../models/WorkOrder');
const CompanyConfig = require('../models/CompanyConfig');
const { emitElectronicInvoice } = require('../services/billingService');
const { generateInvoicePdf } = require('../services/pdfService');
const { notifyInvoiceIssued } = require('../services/whatsappBotService');

// POST /api/invoices - Emitir comprobante electrónico
exports.createInvoice = async (req, res) => {
  try {
    const data = req.body;

    // Si se pasa quoteId, vincular y actualizar cotización a FACTURADA
    if (data.quoteId) {
      const quote = await Quote.findById(data.quoteId);
      if (quote) {
        data.quoteNumber = quote.quoteNumber;
        data.clientDoc = data.clientDoc || quote.clientDoc;
        data.clientName = data.clientName || quote.clientName;
        data.clientAddress = data.clientAddress || quote.clientAddress;
        data.clientPhone = data.clientPhone || quote.clientPhone;
        data.plate = data.plate || quote.plate;
        data.vin = data.vin || quote.vin;
        data.vehicleModel = data.vehicleModel || quote.model;
        if (!data.items || data.items.length === 0) {
          data.items = quote.items;
        }
      }
    }

    // Si se pasa workOrderId, vincular con la OT
    if (data.workOrderId) {
      const wo = await WorkOrder.findById(data.workOrderId);
      if (wo) {
        data.workOrderNumber = wo.orderNumber;
        data.clientName = data.clientName || wo.clientName;
        data.clientDoc = data.clientDoc || wo.clientDoc;
        data.plate = data.plate || wo.plate;
        data.vehicleModel = data.vehicleModel || wo.model;
        if (!data.items || data.items.length === 0) {
          data.items = (wo.items || []).map(it => ({
            code: it.code || 'MO-OT',
            description: it.description || it.fault || 'SERVICIO DE TALLER',
            quantity: 1,
            unitPrice: it.estimatedCost || 100
          }));
        }
      }
    }

    if (!data.clientDoc || !data.clientName) {
      return res.status(400).json({ success: false, message: 'Documento (RUC/DNI) y Razón Social o Nombre del cliente son obligatorios.' });
    }

    if (!data.items || data.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Debe incluir al menos una partida para emitir el comprobante.' });
    }

    // Emitir comprobante electrónico oficial
    const invoice = await emitElectronicInvoice(data);

    // Si proviene de cotización, marcar cotización como FACTURADA
    if (data.quoteId) {
      await Quote.findByIdAndUpdate(data.quoteId, { status: 'FACTURADA' });
    }

    // Disparar hook automático de WhatsApp si el bot está activo
    try {
      if (typeof notifyInvoiceIssued === 'function') {
        notifyInvoiceIssued(invoice).catch(err => console.warn('Aviso WhatsApp Bot hook:', err.message));
      }
    } catch (e) {}

    return res.status(201).json({
      success: true,
      message: `Comprobante ${invoice.fullNumber} emitido y aceptado por SUNAT exitosamente.`,
      data: invoice
    });
  } catch (error) {
    console.error('Error emitiendo factura electrónica:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/invoices - Listar comprobantes emitidos con filtros y métricas
exports.getInvoices = async (req, res) => {
  try {
    const count = await ElectronicInvoice.countDocuments();
    if (count === 0) {
      try {
        await emitElectronicInvoice({
          invoiceType: '01',
          clientDocType: '6',
          clientDoc: '20601928374',
          clientName: 'FR & CARS MAQUINARIAS S.A.C.',
          clientAddress: 'AV. NESTOR GAMBETTA KM 14.5, CALLAO',
          clientPhone: '934787006',
          clientEmail: 'operaciones@frycars.com',
          plate: 'B1T-918',
          vehicleModel: 'SCANIA K360 BUS INTERPROVINCIAL',
          paymentCondition: 'Crédito 15 días calendario',
          environment: 'BETA',
          items: [
            { description: 'Diagnóstico Electrónico Computarizado y Reseteo de Fallas ECU', quantity: 1, unitPrice: 1500 },
            { description: 'Mantenimiento Correctivo de Sistema de Inyección Common Rail 24V', quantity: 1, unitPrice: 4400 }
          ]
        });

        await emitElectronicInvoice({
          invoiceType: '03',
          clientDocType: '1',
          clientDoc: '47891234',
          clientName: 'CARLOS ALBERTO MENDOZA VÁSQUEZ',
          clientAddress: 'CALLE LOS SAUCES 120, CHORRILLOS, LIMA',
          clientPhone: '987654321',
          clientEmail: 'carlos.mendoza@gmail.com',
          plate: 'D1X-789',
          vehicleModel: 'MERCEDES-BENZ ACTROS MIXER 8M3',
          paymentCondition: 'Contado',
          environment: 'BETA',
          items: [
            { description: 'Reparación de Sistema de Arranque Pesado 24V', quantity: 1, unitPrice: 850 },
            { description: 'Diseño y Fabricación 3D de Soporte Sensor Descontinuado', quantity: 1, unitPrice: 350 }
          ]
        });
      } catch (seedErr) {
        console.warn('Auto-seed invoices error:', seedErr.message);
      }
    }

    const { search, invoiceType, environment, sunatStatus, limit = 50 } = req.query;
    const query = {};

    if (invoiceType) query.invoiceType = invoiceType;
    if (environment) query.environment = environment;
    if (sunatStatus) query.sunatStatus = sunatStatus;

    if (search) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { fullNumber: regex },
        { clientName: regex },
        { clientDoc: regex },
        { plate: regex }
      ];
    }

    const invoices = await ElectronicInvoice.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    // Métricas para el resumen ejecutivo de facturación
    const allInvoices = await ElectronicInvoice.find();
    const totalFacturado = allInvoices.reduce((acc, inv) => acc + (inv.totals?.total || 0), 0);
    const totalIgv = allInvoices.reduce((acc, inv) => acc + (inv.totals?.igv || 0), 0);
    const totalAceptadas = allInvoices.filter(i => i.sunatStatus === 'ACEPTADO').length;
    const totalPendientes = allInvoices.filter(i => i.sunatStatus === 'PENDIENTE').length;

    return res.json({
      success: true,
      data: invoices,
      metrics: {
        totalFacturado,
        totalIgv,
        totalAceptadas,
        totalPendientes,
        totalComprobantes: allInvoices.length
      }
    });
  } catch (error) {
    console.error('Error listando comprobantes:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/invoices/:id - Obtener detalle de un comprobante
exports.getInvoiceById = async (req, res) => {
  try {
    let invoice;
    if (req.params.id === 'sample' || req.params.id === 'demo' || !mongoose.Types.ObjectId.isValid(req.params.id)) {
      invoice = await ElectronicInvoice.findOne().sort({ createdAt: -1 });
    } else {
      invoice = await ElectronicInvoice.findById(req.params.id);
    }
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Comprobante no encontrado' });
    }
    return res.json({ success: true, data: invoice });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/invoices/:id/pdf - Descargar / Visualizar PDF tributario con QR
exports.getInvoicePdf = async (req, res) => {
  try {
    let invoice;
    if (req.params.id === 'sample' || req.params.id === 'demo' || !mongoose.Types.ObjectId.isValid(req.params.id)) {
      invoice = await ElectronicInvoice.findOne().sort({ createdAt: -1 });
    } else {
      invoice = await ElectronicInvoice.findById(req.params.id);
    }
    if (!invoice) {
      return res.status(404).send('Comprobante no encontrado');
    }

    const company = await CompanyConfig.findOne() || {
      companyName: 'DARSIL AUTOMOTIVE SOLUTIONS S.A.C.',
      ruc: '20608765432',
      address: 'Villa El Salvador, Lima, Lima',
      phone: '934787006'
    };

    const pdfResult = await generateInvoicePdf(invoice, company);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${invoice.fullNumber}.pdf"`);
    return res.send(pdfResult.buffer);
  } catch (error) {
    console.error('Error generando PDF de factura:', error);
    return res.status(500).send('Error generando PDF: ' + error.message);
  }
};

// GET /api/invoices/:id/xml - Descargar archivo XML UBL 2.1
exports.getInvoiceXml = async (req, res) => {
  try {
    const invoice = await ElectronicInvoice.findById(req.params.id);
    if (!invoice) return res.status(404).send('Comprobante no encontrado');

    const xml = invoice.sunatResponse?.xmlContent;
    if (!xml) return res.status(404).send('XML UBL no disponible');

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Content-Disposition', `attachment; filename="${invoice.fullNumber}.xml"`);
    return res.send(xml);
  } catch (error) {
    return res.status(500).send(error.message);
  }
};

// GET /api/invoices/:id/cdr - Descargar Constancia de Recepción SUNAT (CDR)
exports.getInvoiceCdr = async (req, res) => {
  try {
    const invoice = await ElectronicInvoice.findById(req.params.id);
    if (!invoice) return res.status(404).send('Comprobante no encontrado');

    const cdrBase64 = invoice.sunatResponse?.cdrZipBase64;
    const cdrXml = cdrBase64 ? Buffer.from(cdrBase64, 'base64').toString('utf8') : null;

    if (!cdrXml) return res.status(404).send('CDR no disponible');

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Content-Disposition', `attachment; filename="R-${invoice.fullNumber}.xml"`);
    return res.send(cdrXml);
  } catch (error) {
    return res.status(500).send(error.message);
  }
};
