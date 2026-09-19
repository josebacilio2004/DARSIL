const express = require('express');
const router = express.Router();

const quoteController = require('../controllers/quoteController');
const catalogController = require('../controllers/catalogController');
const clientController = require('../controllers/clientController');
const companyController = require('../controllers/companyController');

// Cotizaciones
router.get('/quotes', quoteController.getQuotes);
router.get('/quotes/:id', quoteController.getQuoteById);
router.post('/quotes', quoteController.createQuote);
router.put('/quotes/:id', quoteController.updateQuote);
router.delete('/quotes/:id', quoteController.deleteQuote);
router.patch('/quotes/:id/status', quoteController.updateStatus);
router.post('/quotes/:id/signature', quoteController.addSignature);
router.get('/quotes/:id/pdf', quoteController.downloadPdf);

// Catálogo
router.get('/catalog', catalogController.getCatalog);
router.post('/catalog', catalogController.createCatalogItem);

// Clientes y Vehículos
router.get('/clients', clientController.getClients);
router.get('/vehicles', clientController.getVehicles);

// Integraciones
router.get('/integrations/ruc/:ruc', clientController.lookupRuc);
router.get('/integrations/dni/:dni', clientController.lookupDni);

// Configuración de Empresa y Taller
router.get('/company', companyController.getCompanyConfig);
router.put('/company', companyController.updateCompanyConfig);
router.post('/company/bank-accounts', companyController.addBankAccount);
router.put('/company/bank-accounts/:accountId', companyController.updateBankAccount);
router.delete('/company/bank-accounts/:accountId', companyController.deleteBankAccount);

module.exports = router;
