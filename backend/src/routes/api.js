const express = require('express');
const router = express.Router();

const quoteController = require('../controllers/quoteController');
const catalogController = require('../controllers/catalogController');
const clientController = require('../controllers/clientController');
const companyController = require('../controllers/companyController');
const authController = require('../controllers/authController');
const inventoryController = require('../controllers/inventoryController');
const reportController = require('../controllers/reportController');
const workOrderController = require('../controllers/workOrderController');

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

// Órdenes de Trabajo (OT) & Check-In Digital
router.get('/work-orders', workOrderController.getWorkOrders);
router.get('/work-orders/:id', workOrderController.getWorkOrderById);
router.post('/work-orders', workOrderController.createWorkOrder);
router.put('/work-orders/:id', workOrderController.updateWorkOrder);
router.patch('/work-orders/:id/status', workOrderController.updateStatus);
router.post('/work-orders/:id/signature', workOrderController.addSignature);
router.post('/work-orders/:id/materials', workOrderController.addMaterial);
router.post('/work-orders/:id/generate-quote', workOrderController.generateQuoteFromWorkOrder);
router.get('/work-orders/:id/pdf', workOrderController.getWorkOrderPdf);
router.delete('/work-orders/:id', workOrderController.deleteWorkOrder);

// Control de Inventario & Kardex
router.get('/inventory', inventoryController.getItems);
router.get('/inventory/summary', inventoryController.getInventorySummary);
router.post('/inventory', inventoryController.createItem);
router.put('/inventory/:id', inventoryController.updateItem);
router.delete('/inventory/:id', inventoryController.deleteItem);
router.post('/inventory/movements', inventoryController.registerMovement);
router.get('/inventory/:id/kardex', inventoryController.getKardexByItem);
router.post('/inventory/seed', inventoryController.seedInventory);

// Reportes Ejecutivos & Exportación Contable
router.get('/reports/executive', reportController.getExecutiveStats);
router.get('/reports/export-csv', reportController.exportQuotesCsv);

// Catálogo (MO01-MO21, Diagnóstico, Impresión 3D)
router.get('/catalog', catalogController.getCatalog);
router.post('/catalog', catalogController.createCatalogItem);
router.put('/catalog/:id', catalogController.updateCatalogItem);
router.delete('/catalog/:id', catalogController.deleteCatalogItem);
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
