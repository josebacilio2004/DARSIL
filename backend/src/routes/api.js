const express = require('express');
const router = express.Router();

const quoteController = require('../controllers/quoteController');
const catalogController = require('../controllers/catalogController');
const clientController = require('../controllers/clientController');
const companyController = require('../controllers/companyController');
const authController = require('../controllers/authController');

// Autenticación ERP DARSIL
router.post('/auth/login', authController.login);
router.get('/auth/me', authController.getMe);

// Cotizaciones
router.get('/quotes', quoteController.getQuotes);
router.get('/quotes/:id', quoteController.getQuoteById);
router.post('/quotes', quoteController.createQuote);
router.put('/quotes/:id', quoteController.updateQuote);
router.delete('/quotes/:id', quoteController.deleteQuote);
router.patch('/quotes/:id/status', quoteController.updateStatus);
router.post('/quotes/:id/signature', quoteController.addSignature);
router.get('/quotes/:id/pdf', quoteController.downloadPdf);

// Catálogo (MO01-MO21, Diagnóstico, Impresión 3D)
router.get('/catalog', catalogController.getCatalog);
router.post('/catalog', catalogController.createCatalogItem);
router.post('/catalog/seed', catalogController.seedCatalog);

// Clientes y Vehículos
router.get('/clients', clientController.getClients);
router.get('/vehicles', clientController.getVehicles);

// Integraciones SUNAT / RENIEC
router.get('/integrations/ruc/:ruc', clientController.lookupRuc);
router.get('/integrations/dni/:dni', clientController.lookupDni);

// Configuración de Empresa y Taller
router.get('/company', companyController.getCompanyConfig);
router.put('/company', companyController.updateCompanyConfig);
router.post('/company/bank-accounts', companyController.addBankAccount);
router.put('/company/bank-accounts/:accountId', companyController.updateBankAccount);
router.delete('/company/bank-accounts/:accountId', companyController.deleteBankAccount);

module.exports = router;
