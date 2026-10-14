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
const invoiceController = require('../controllers/invoiceController');
const whatsappController = require('../controllers/whatsappController');
const financialController = require('../controllers/financialController');

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

// Órdenes de Trabajo (OT) & Check-In Digital & Torre de Control
router.get('/work-orders/kanban', workOrderController.getKanbanOrders);
router.get('/work-orders/track/:identifier', workOrderController.getPublicTracking);
router.get('/work-orders', workOrderController.getWorkOrders);
router.get('/work-orders/:id', workOrderController.getWorkOrderById);
router.post('/work-orders', workOrderController.createWorkOrder);
router.put('/work-orders/:id', workOrderController.updateWorkOrder);
router.patch('/work-orders/:id/status', workOrderController.updateStatus);
router.put('/work-orders/:id/kanban-stage', workOrderController.updateKanbanStage);
router.post('/work-orders/:id/notify-tracking', workOrderController.notifyTrackingWhatsApp);
router.post('/work-orders/:id/signature', workOrderController.addSignature);
router.post('/work-orders/:id/materials', workOrderController.addMaterial);
router.post('/work-orders/:id/generate-quote', workOrderController.generateQuoteFromWorkOrder);
router.get('/work-orders/:id/pdf', workOrderController.getWorkOrderPdf);
router.delete('/work-orders/:id', workOrderController.deleteWorkOrder);

// Control de Inventario & Kardex
router.get('/inventory', inventoryController.getItems);
router.get('/inventory/summary', inventoryController.getInventorySummary);
router.get('/inventory/categories', inventoryController.getCategories);
router.post('/inventory/categories', inventoryController.createCategory);
router.delete('/inventory/categories/:id', inventoryController.deleteCategory);
router.get('/inventory/units', inventoryController.getUnits);
router.post('/inventory/units', inventoryController.createUnit);
router.delete('/inventory/units/:id', inventoryController.deleteUnit);
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
router.get('/vehicles/validate-plate', clientController.validateVehiclePlate);

// Integraciones SUNAT / RENIEC / SUNARP
router.get('/integrations/ruc/:ruc', clientController.lookupRuc);
router.get('/integrations/dni/:dni', clientController.lookupDni);
router.get('/integrations/sunarp/:plate', clientController.lookupSunarp);

// Configuración de Empresa y Taller
router.get('/company', companyController.getCompanyConfig);
router.put('/company', companyController.updateCompanyConfig);
router.post('/company/bank-accounts', companyController.addBankAccount);
router.put('/company/bank-accounts/:accountId', companyController.updateBankAccount);
router.delete('/company/bank-accounts/:accountId', companyController.deleteBankAccount);

// Facturación Electrónica SUNAT UBL 2.1
router.get('/invoices', invoiceController.getInvoices);
router.get('/invoices/:id', invoiceController.getInvoiceById);
router.post('/invoices', invoiceController.createInvoice);
router.get('/invoices/:id/pdf', invoiceController.getInvoicePdf);
router.get('/invoices/:id/xml', invoiceController.getInvoiceXml);
router.get('/invoices/:id/cdr', invoiceController.getInvoiceCdr);

// Bot Automatizador CRM & WhatsApp
router.get('/whatsapp/status', whatsappController.getStatus);
router.get('/whatsapp/qr', whatsappController.getQr);
router.post('/whatsapp/pair', whatsappController.pair);
router.post('/whatsapp/disconnect', whatsappController.disconnect);
router.put('/whatsapp/config', whatsappController.updateConfig);
router.post('/whatsapp/send', whatsappController.sendMessage);
router.get('/whatsapp/logs', whatsappController.getLogs);


// Gestión Financiera & Cuentas por Cobrar (Cronogramas, Contratos & Abonos)
router.get('/financial/bi-metrics', financialController.getBIMetrics);
router.post('/financial/bi-advisor', financialController.getBIAdvisorInsight);
router.get('/financial/schedules', financialController.getSchedules);
router.get('/financial/schedules/:id', financialController.getScheduleById);
router.post('/financial/schedules', financialController.createSchedule);
router.post('/financial/schedules/:id/payments', financialController.registerPayment);
router.post('/financial/schedules/:id/remind/:installmentIndex', financialController.sendFriendlyReminder);
router.post('/financial/schedules/:id/alert-advisor', financialController.sendAdvisorAlert);
router.get('/financial/schedules/:id/contract-pdf', financialController.getContractPdf);
router.get('/financial/schedules/:id/paz-y-salvo-pdf', financialController.getPazYSalvoPdf);
router.get('/financial/schedules/:id/receipt-pdf/:receiptIndex', financialController.getReceiptPdf);
router.post('/financial/schedules/:id/resend-contract-whatsapp', financialController.resendContractWhatsApp);
router.post('/financial/schedules/:id/resend-paz-y-salvo-whatsapp', financialController.resendPazYSalvoWhatsApp);
router.post('/financial/schedules/:id/resend-receipt-whatsapp/:receiptIndex', financialController.resendReceiptWhatsApp);

module.exports = router;
