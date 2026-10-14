const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const PaymentSchedule = require('../models/PaymentSchedule');
const Quote = require('../models/Quote');
const WorkOrder = require('../models/WorkOrder');
const CompanyConfig = require('../models/CompanyConfig');
const {
  generateContractPdf,
  generateCashReceiptPdf,
  generatePazYSalvoPdf,
  renderContractHtml,
  renderCashReceiptHtml,
  renderPazYSalvoHtml
} = require('../services/pdfService');
const {
  notifyScheduleAgreed,
  notifyFriendlyReminder,
  notifyPaymentReceived,
  notifyPazYSalvoIssued,
  notifyFinalContractPaid,
  notifyAdvisorOverdueAlert
} = require('../services/whatsappBotService');

// Helper: Obtener Host público adecuado (Render vs Local)
function getPublicHost(req) {
  if (process.env.BASE_URL && !process.env.BASE_URL.includes('localhost')) {
    return process.env.BASE_URL.replace(/\/$/, '');
  }
  let host = req.get('host') || 'localhost:3005';
  if (host === 'localhost') host = 'localhost:3005';
  return `${req.protocol}://${host}`;
}

// Helper: Generar correlativo atómico para Contrato
async function getNextContractNumber() {
  const currentYear = new Date().getFullYear();
  const prefix = `CP-${currentYear}-`;
  const last = await PaymentSchedule.findOne({ contractNumber: new RegExp(`^${prefix}`) })
    .sort({ contractNumber: -1 });
  let next = 1;
  if (last && last.contractNumber) {
    const match = last.contractNumber.match(/(\d+)$/);
    if (match) next = parseInt(match[1], 10) + 1;
  }
  return `${prefix}${String(next).padStart(3, '0')}`;
}

// Helper: Generar correlativo para Recibo de Caja
async function getNextReceiptNumber() {
  const currentYear = new Date().getFullYear();
  const prefix = `RC-${currentYear}-`;
  const allSchedules = await PaymentSchedule.find({ 'payments.0': { $exists: true } });
  let maxNum = 0;
  for (const s of allSchedules) {
    for (const p of (s.payments || [])) {
      if (p.receiptNumber && p.receiptNumber.startsWith(prefix)) {
        const match = p.receiptNumber.match(/(\d+)$/);
        if (match) {
          const val = parseInt(match[1], 10);
          if (val > maxNum) maxNum = val;
        }
      }
    }
  }
  return `${prefix}${String(maxNum + 1).padStart(3, '0')}`;
}

// GET /api/financial/schedules - Listado ordenado ALFABÉTICAMENTE A-Z con filtros y métricas
exports.getSchedules = async (req, res) => {
  try {
    const { search, status, paymentType, sortBy = 'clientName', order = 'asc' } = req.query;
    const query = {};

    if (status && status !== 'TODOS') query.status = status;
    if (paymentType && paymentType !== 'TODOS') query.paymentType = paymentType;

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { clientName: regex },
        { clientDoc: regex },
        { plate: regex },
        { quoteNumber: regex },
        { contractNumber: regex }
      ];
    }

    // Ordenamiento: Flexible (Alfabético A-Z, Tiempo de Creación/Contrato, Placa, Saldo)
    const sortObj = {};
    if (sortBy === 'createdAt') {
      sortObj.createdAt = order === 'asc' ? 1 : -1;
    } else if (sortBy === 'contractNumber') {
      sortObj.contractNumber = order === 'asc' ? 1 : -1;
    } else if (sortBy === 'plate') {
      sortObj.plate = order === 'desc' ? -1 : 1;
    } else if (sortBy === 'balance') {
      sortObj.balance = order === 'desc' ? -1 : 1;
    } else {
      // clientName (A-Z)
      sortObj.clientName = order === 'desc' ? -1 : 1;
    }

    const schedules = await PaymentSchedule.find(query).sort(sortObj);

    // Actualizar estado dinámico de cuotas vencidas (Al día vs Vencido)
    const now = new Date();
    for (const schedule of schedules) {
      let isModified = false;
      let hasOverdue = false;

      for (const inst of (schedule.installments || [])) {
        if (!inst.isPaid && inst.dueDate) {
          const due = new Date(inst.dueDate);
          const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
          let currentStatus = inst.status;

          if (diffDays < 0) {
            currentStatus = 'VENCIDO';
            hasOverdue = true;
          } else if (diffDays <= 3) {
            currentStatus = 'POR_VENCER';
          } else {
            currentStatus = 'AL_DIA';
          }

          if (inst.status !== currentStatus) {
            inst.status = currentStatus;
            isModified = true;
          }
        }
      }

      if (schedule.balance > 0 && hasOverdue && schedule.status !== 'VENCIDO') {
        schedule.status = 'VENCIDO';
        isModified = true;
      }

      if (isModified) {
        await schedule.save();
      }
    }

    // Calcular Métricas Globales de Cobranza para el Dashboard
    const all = await PaymentSchedule.find();
    const totalReceivable = all.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
    const totalCollected = all.reduce((sum, s) => sum + (s.paidAmount || 0), 0);
    const totalBalance = all.reduce((sum, s) => sum + (s.balance || 0), 0);
    const overdueCount = all.filter(s => s.status === 'VENCIDO' || (s.balance > 0 && s.installments?.some(i => !i.isPaid && new Date(i.dueDate) < now))).length;
    const paidCount = all.filter(s => s.status === 'PAGADO' || s.balance <= 0).length;

    return res.json({
      success: true,
      data: schedules,
      metrics: {
        totalReceivable,
        totalCollected,
        totalBalance,
        collectionRate: totalReceivable > 0 ? ((totalCollected / totalReceivable) * 100).toFixed(1) + '%' : '100%',
        overdueCount,
        paidCount,
        totalAgreements: all.length
      }
    });
  } catch (error) {
    console.error('Error listando cronogramas financieros:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/financial/schedules/:id - Detalle de un cronograma
exports.getScheduleById = async (req, res) => {
  try {
    const schedule = await PaymentSchedule.findById(req.params.id);
    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Cronograma de pagos no encontrado' });
    }
    return res.json({ success: true, data: schedule });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/financial/schedules - Crear Acuerdo & Contrato de Pago
exports.createSchedule = async (req, res) => {
  try {
    const {
      quoteId,
      paymentType = 'EN_PARTES',
      installments = [],
      clauses = [],
      advisorSignature = null,
      clientSignature = null
    } = req.body;

    const quote = await Quote.findById(quoteId);
    if (!quote) {
      return res.status(404).json({ success: false, message: 'Cotización no encontrada para generar cronograma' });
    }

    const company = await CompanyConfig.findOne() || {};
    const contractNumber = await getNextContractNumber();
    const totalAmount = Number(quote.total) || 0;

    // Normalizar cuotas si es pago único
    let finalInstallments = [];
    if (paymentType === 'PAGO_UNICO') {
      const due = installments[0]?.dueDate ? new Date(installments[0].dueDate) : new Date(Date.now() + 15 * 86400000);
      finalInstallments = [{
        installmentNumber: 1,
        amount: totalAmount,
        dueDate: due,
        isPaid: false,
        status: 'PENDIENTE',
        notes: 'Pago único al vencimiento acordado'
      }];
    } else {
      finalInstallments = installments.map((inst, idx) => ({
        installmentNumber: idx + 1,
        amount: Number(inst.amount) || 0,
        dueDate: new Date(inst.dueDate),
        isPaid: false,
        status: 'PENDIENTE',
        notes: inst.notes || `Cuota N° ${idx + 1}`
      }));
    }

    const schedule = new PaymentSchedule({
      contractNumber,
      quoteId: quote._id,
      quoteNumber: quote.quoteNumber,
      workOrderId: quote.workOrderId || null,
      workOrderNumber: quote.originWorkOrderNumber || '',
      clientId: quote.clientId,
      clientName: quote.clientName,
      clientDoc: quote.clientDoc || '',
      clientPhone: quote.clientPhone || '',
      clientAddress: quote.clientAddress || '',
      clientEmail: quote.clientEmail || '',
      plate: quote.plate || 'POR ASIGNAR',
      model: quote.model || '',
      vin: quote.vin || '',
      advisorName: quote.advisorName || 'Darios Bacilio',
      advisorPhone: quote.advisorPhone || '934787006',
      currency: quote.currency || 'PEN',
      totalAmount,
      paidAmount: 0,
      balance: totalAmount,
      paymentType,
      status: 'EN_CRONOGRAMA',
      installments: finalInstallments,
      payments: [],
      clauses: (clauses && clauses.length > 0) ? clauses : [],
      advisorSignature,
      clientSignature
    });

    await schedule.save();

    // Generar PDF Oficial del Contrato
    try {
      const contractPdf = await generateContractPdf(schedule, company);
      schedule.contractPdfUrl = contractPdf.urlPath;
      await schedule.save();
    } catch (pdfErr) {
      console.warn('[FINANZAS] Aviso generando PDF de contrato:', pdfErr.message);
    }

    // Actualizar estado de cotización a APROBADA
    if (quote.status === 'BORRADOR' || quote.status === 'ENVIADA') {
      quote.status = 'APROBADA';
      await quote.save();
    }

    // Disparar hook de WhatsApp con el Contrato y Cronograma Oficial
    if (schedule.clientPhone) {
      try {
        const fullPdfUrl = `${getPublicHost(req)}${schedule.contractPdfUrl || `/api/financial/schedules/${schedule._id}/contract-pdf`}`;
        notifyScheduleAgreed(schedule, fullPdfUrl).catch(e => console.warn('[WHATSAPP BOT] Error notifiando cronograma:', e.message));
      } catch (e) {}
    }

    return res.status(201).json({
      success: true,
      message: `Contrato & Cronograma ${schedule.contractNumber} generado exitosamente`,
      data: schedule
    });
  } catch (error) {
    console.error('Error creando cronograma:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/financial/schedules/:id/payments - Registrar Abono & Generar Recibo de Caja Digital
exports.registerPayment = async (req, res) => {
  try {
    const {
      amount,
      paymentMethod = 'TRANSFERENCIA_BCP',
      operationNumber = '',
      notes = '',
      registeredBy = 'Darios Bacilio'
    } = req.body;

    const schedule = await PaymentSchedule.findById(req.params.id);
    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Cronograma de pagos no encontrado' });
    }

    const payAmount = Number(amount);
    if (isNaN(payAmount) || payAmount <= 0) {
      return res.status(400).json({ success: false, message: 'El monto de abono debe ser mayor a 0' });
    }

    const company = await CompanyConfig.findOne() || {};
    const receiptNumber = await getNextReceiptNumber();

    // Actualizar montos del cronograma con precisión de 2 decimales
    const payAmountRounded = Math.round(payAmount * 100) / 100;
    const newPaidAmount = Math.round((schedule.paidAmount + payAmountRounded) * 100) / 100;
    const rawBalance = schedule.totalAmount - newPaidAmount;
    const isFullyPaid = rawBalance <= 0.01;
    const newBalance = isFullyPaid ? 0 : Math.max(0, Math.round(rawBalance * 100) / 100);

    schedule.paidAmount = isFullyPaid ? schedule.totalAmount : newPaidAmount;
    schedule.balance = newBalance;

    // Aplicar pago a las cuotas en orden cronológico (FIFO)
    let remainingToApply = payAmountRounded;
    for (const inst of schedule.installments) {
      if (remainingToApply <= 0) break;
      if (!inst.isPaid) {
        const instPending = Math.round((inst.amount - (inst.paidAmount || 0)) * 100) / 100;
        if (remainingToApply >= instPending - 0.01) {
          inst.paidAmount = inst.amount;
          inst.isPaid = true;
          inst.paidAt = new Date();
          inst.status = 'PAGADO';
          remainingToApply = Math.max(0, Math.round((remainingToApply - instPending) * 100) / 100);
        } else {
          inst.paidAmount = Math.round(((inst.paidAmount || 0) + remainingToApply) * 100) / 100;
          inst.status = 'PENDIENTE';
          remainingToApply = 0;
        }
      }
    }

    // Determinar nuevo estado general
    if (isFullyPaid) {
      for (const inst of schedule.installments) {
        inst.isPaid = true;
        inst.paidAmount = inst.amount;
        if (!inst.paidAt) inst.paidAt = new Date();
        inst.status = 'PAGADO';
      }
      schedule.status = 'PAGADO';
      // Marcar cotización vinculada como FACTURADA / CANCELADA
      await Quote.findByIdAndUpdate(schedule.quoteId, { status: 'FACTURADA' });
    } else {
      schedule.status = 'PAGO_PARCIAL';
    }

    // Crear registro del recibo de caja
    const newPayment = {
      receiptNumber,
      amount: payAmountRounded,
      paymentDate: new Date(),
      paymentMethod,
      operationNumber,
      registeredBy,
      notes,
      receiptPdfUrl: `/uploads/receipts/${receiptNumber}.pdf`
    };

    schedule.payments.push(newPayment);
    await schedule.save();

    // Generar PDF del Recibo de Caja Digital
    let receiptPdf = null;
    try {
      receiptPdf = await generateCashReceiptPdf(schedule, newPayment, company);
    } catch (pdfErr) {
      console.warn('[FINANZAS] Error generando PDF de recibo de caja:', pdfErr.message);
    }

    // Actualizar el PDF del Contrato en disco para que refleje el estado CANCELADO de las cuotas abonadas
    let contractPdf = null;
    try {
      contractPdf = await generateContractPdf(schedule, company);
      schedule.contractPdfUrl = contractPdf.urlPath;
      await schedule.save();
    } catch (cErr) {
      console.warn('[FINANZAS] Aviso actualizando PDF de contrato tras abono:', cErr.message);
    }

    // Si la deuda quedó en 0, generar Paz y Salvo Oficial automáticamente
    let pazYSalvoPdf = null;
    if (isFullyPaid) {
      try {
        pazYSalvoPdf = await generatePazYSalvoPdf(schedule, company);
        schedule.pazYSalvoPdfUrl = pazYSalvoPdf.urlPath;
        await schedule.save();
      } catch (pysErr) {
        console.warn('[FINANZAS] Error generando Paz y Salvo:', pysErr.message);
      }
    }

    // 1. Disparar WhatsApp al cliente con el Recibo de Caja Digital adjunto
    if (schedule.clientPhone) {
      try {
        const fullReceiptUrl = `${getPublicHost(req)}${receiptPdf?.urlPath || `/api/financial/schedules/${schedule._id}/receipt-pdf/${schedule.payments.length - 1}`}`;
        notifyPaymentReceived(schedule, newPayment, fullReceiptUrl).catch(e => 
          console.warn('[WHATSAPP BOT] Error notificando abono:', e.message)
        );
      } catch (e) {}
    }

    // 2. Si quedó 100% pagado, notificar Paz y Salvo Oficial Y Contrato Oficial Cancelado (Sin cuentas pendientes)
    if (isFullyPaid && schedule.clientPhone) {
      try {
        const fullPazYSalvoUrl = `${getPublicHost(req)}${schedule.pazYSalvoPdfUrl || `/api/financial/schedules/${schedule._id}/paz-y-salvo-pdf`}`;
        const fullContractUrl = `${getPublicHost(req)}${schedule.contractPdfUrl || `/api/financial/schedules/${schedule._id}/contract-pdf`}`;

        // Despachar Paz y Salvo con su PDF adjunto
        setTimeout(() => {
          notifyPazYSalvoIssued(schedule, fullPazYSalvoUrl).catch(e => 
            console.warn('[WHATSAPP BOT] Error notificando Paz y Salvo:', e.message)
          );
        }, 1500);

        // Despachar Contrato Cancelado (Sin Cuentas Pendientes) con su PDF adjunto
        setTimeout(() => {
          notifyFinalContractPaid(schedule, fullContractUrl).catch(e => 
            console.warn('[WHATSAPP BOT] Error notificando Contrato Cancelado:', e.message)
          );
        }, 3500);
      } catch (e) {}
    }

    return res.status(201).json({
      success: true,
      message: `Abono de S/ ${payAmountRounded.toFixed(2)} registrado con éxito. Recibo N° ${receiptNumber}${isFullyPaid ? ' — ¡Contrato 100% Pagado!' : ''}`,
      data: {
        schedule,
        payment: newPayment,
        isFullyPaid,
        receiptNumber
      }
    });
  } catch (error) {
    console.error('Error registrando abono:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/financial/schedules/:id/remind/:installmentIndex - Enviar Recordatorio Preventivo Amigable
exports.sendFriendlyReminder = async (req, res) => {
  try {
    const { id, installmentIndex } = req.params;
    const schedule = await PaymentSchedule.findById(id);
    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Cronograma de pagos no encontrado' });
    }

    const idx = parseInt(installmentIndex, 10);
    const installment = schedule.installments[idx] || schedule.installments.find(i => !i.isPaid);
    if (!installment) {
      return res.status(400).json({ success: false, message: 'No hay cuotas pendientes para recordar' });
    }

    const result = await notifyFriendlyReminder(schedule, installment);
    schedule.lastReminderSentAt = new Date();
    await schedule.save();

    return res.json({
      success: true,
      message: `Recordatorio amigable enviado a ${schedule.clientPhone} para la Cuota N° ${installment.installmentNumber}`,
      data: result
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/financial/schedules/:id/alert-advisor - Alerta de Cobranza al Asesor
exports.sendAdvisorAlert = async (req, res) => {
  try {
    const schedule = await PaymentSchedule.findById(req.params.id);
    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Cronograma no encontrado' });
    }

    const overdue = schedule.installments.filter(i => !i.isPaid && new Date(i.dueDate) < new Date());
    const result = await notifyAdvisorOverdueAlert(schedule, overdue);
    schedule.lastAdvisorAlertSentAt = new Date();
    await schedule.save();

    return res.json({
      success: true,
      message: `Alerta interna de cobranza despachada al asesor ${schedule.advisorName}`,
      data: result
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Helper para envolver documentos imprimibles cuando se visualizan en navegador
function wrapPrintableHtml(title, innerHtml) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    @media print {
      .darsil-no-print { display: none !important; }
      body { margin: 0; padding: 0; background: #fff !important; }
      .sheet-container { box-shadow: none !important; margin: 0 !important; width: 100% !important; max-width: 100% !important; }
    }
    .darsil-no-print-bar {
      position: sticky;
      top: 0;
      z-index: 9999;
      background: #0f172a;
      color: #fff;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 24px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .darsil-btn-print {
      background: #2563eb;
      color: #fff;
      font-weight: 700;
      padding: 8px 18px;
      border-radius: 6px;
      border: none;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      transition: background 0.2s;
    }
    .darsil-btn-print:hover {
      background: #1d4ed8;
    }
  </style>
</head>
<body style="background: #f1f5f9; margin: 0; padding: 0; font-family: sans-serif;">
  <div class="darsil-no-print-bar darsil-no-print">
    <div style="display: flex; align-items: center; gap: 12px;">
      <span style="background: #dc2626; color: #fff; font-size: 11px; font-weight: 900; padding: 2px 8px; border-radius: 4px; letter-spacing: 1px;">DARSIL ERP</span>
      <span style="font-size: 14px; font-weight: 600;">${title}</span>
    </div>
    <div style="display: flex; gap: 10px;">
      <button class="darsil-btn-print" onclick="window.print()">
        🖨️ Imprimir / Guardar en PDF
      </button>
    </div>
  </div>
  <div style="display: flex; justify-content: center; padding: 20px 0;">
    <div class="sheet-container" style="background: #fff; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); border-radius: 8px; overflow: hidden; width: 100%; max-width: 840px;">
      ${innerHtml}
    </div>
  </div>
</body>
</html>`;
}

// GET /api/financial/schedules/:id/contract-pdf
exports.getContractPdf = async (req, res) => {
  try {
    const schedule = await PaymentSchedule.findById(req.params.id);
    if (!schedule) return res.status(404).send('Contrato no encontrado');

    const company = await CompanyConfig.findOne() || {};

    // Si se solicita formato HTML directo
    if (req.query.format === 'html') {
      const html = renderContractHtml(schedule, company);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(wrapPrintableHtml(`Contrato ${schedule.contractNumber}`, html));
    }

    // 1. Si ya existe en disco y está actualizado respecto a la última modificación del cronograma, servir inmediatamente
    const existingContract = path.join(__dirname, '../../uploads/contracts', `${schedule.contractNumber}.pdf`);
    if (fs.existsSync(existingContract)) {
      const stat = fs.statSync(existingContract);
      const schedTime = new Date(schedule.updatedAt || schedule.createdAt).getTime();
      if (stat.mtimeMs >= schedTime - 2000) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${schedule.contractNumber}.pdf"`);
        return fs.createReadStream(existingContract).pipe(res);
      }
    }

    try {
      const pdfResult = await generateContractPdf(schedule, company);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${schedule.contractNumber}.pdf"`);
      return res.send(pdfResult.buffer);
    } catch (pdfErr) {
      console.warn('[FINANZAS] Puppeteer no disponible para Contrato, retornando vista imprimible HTML:', pdfErr.message);
      const html = renderContractHtml(schedule, company);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(wrapPrintableHtml(`Contrato ${schedule.contractNumber}`, html));
    }
  } catch (error) {
    return res.status(500).send('Error generando PDF de contrato: ' + error.message);
  }
};

// GET /api/financial/schedules/:id/paz-y-salvo-pdf
exports.getPazYSalvoPdf = async (req, res) => {
  try {
    const schedule = await PaymentSchedule.findById(req.params.id);
    if (!schedule) return res.status(404).send('Documento no encontrado');

    const company = await CompanyConfig.findOne() || {};

    if (req.query.format === 'html') {
      const html = renderPazYSalvoHtml(schedule, company);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(wrapPrintableHtml(`Constancia de Paz y Salvo - ${schedule.contractNumber}`, html));
    }

    // 1. Si ya existe en disco, servir inmediatamente
    const safeNumber = (schedule.contractNumber || 'PYS').replace(/[^a-zA-Z0-9_-]/g, '_');
    const existingPys = path.join(__dirname, '../../uploads/paz-y-salvo', `PazYSalvo_${safeNumber}.pdf`);
    if (fs.existsSync(existingPys)) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="PazYSalvo_${schedule.contractNumber}.pdf"`);
      return fs.createReadStream(existingPys).pipe(res);
    }

    try {
      const pdfResult = await generatePazYSalvoPdf(schedule, company);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="PazYSalvo_${schedule.contractNumber}.pdf"`);
      return res.send(pdfResult.buffer);
    } catch (pdfErr) {
      console.warn('[FINANZAS] Puppeteer no disponible para Paz y Salvo, retornando vista imprimible HTML:', pdfErr.message);
      const html = renderPazYSalvoHtml(schedule, company);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(wrapPrintableHtml(`Constancia de Paz y Salvo - ${schedule.contractNumber}`, html));
    }
  } catch (error) {
    return res.status(500).send('Error generando Paz y Salvo: ' + error.message);
  }
};

// GET /api/financial/schedules/:id/receipt-pdf/:receiptIndex
exports.getReceiptPdf = async (req, res) => {
  try {
    const schedule = await PaymentSchedule.findById(req.params.id);
    if (!schedule) return res.status(404).send('Cronograma no encontrado');

    const rIdx = parseInt(req.params.receiptIndex, 10);
    const payment = schedule.payments[rIdx] || schedule.payments[schedule.payments.length - 1];
    if (!payment) return res.status(404).send('Recibo de pago no encontrado');

    const company = await CompanyConfig.findOne() || {};

    if (req.query.format === 'html') {
      const html = renderCashReceiptHtml(schedule, payment, company);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(wrapPrintableHtml(`Recibo de Caja ${payment.receiptNumber}`, html));
    }

    // 1. Si ya existe en disco, servir inmediatamente
    const safeReceipt = (payment.receiptNumber || 'RECIBO').replace(/[^a-zA-Z0-9_-]/g, '_');
    const existingReceipt = path.join(__dirname, '../../uploads/receipts', `${safeReceipt}.pdf`);
    if (fs.existsSync(existingReceipt)) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${payment.receiptNumber}.pdf"`);
      return fs.createReadStream(existingReceipt).pipe(res);
    }

    try {
      const pdfResult = await generateCashReceiptPdf(schedule, payment, company);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${payment.receiptNumber}.pdf"`);
      return res.send(pdfResult.buffer);
    } catch (pdfErr) {
      console.warn('[FINANZAS] Puppeteer no disponible para Recibo, retornando vista imprimible HTML:', pdfErr.message);
      const html = renderCashReceiptHtml(schedule, payment, company);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(wrapPrintableHtml(`Recibo de Caja ${payment.receiptNumber}`, html));
    }
  } catch (error) {
    return res.status(500).send('Error generando recibo: ' + error.message);
  }
};

// POST /api/financial/schedules/:id/resend-contract-whatsapp
exports.resendContractWhatsApp = async (req, res) => {
  try {
    const schedule = await PaymentSchedule.findById(req.params.id);
    if (!schedule) return res.status(404).json({ success: false, message: 'Cronograma no encontrado' });
    if (!schedule.clientPhone) return res.status(400).json({ success: false, message: 'El cliente no tiene teléfono registrado' });

    const company = await CompanyConfig.findOne() || {};
    const contractPdf = await generateContractPdf(schedule, company);
    schedule.contractPdfUrl = contractPdf.urlPath;
    await schedule.save();

    const fullContractUrl = `${getPublicHost(req)}${contractPdf.urlPath}`;
    let sendResult;
    if (schedule.status === 'PAGADO') {
      sendResult = await notifyFinalContractPaid(schedule, fullContractUrl);
    } else {
      sendResult = await notifyScheduleAgreed(schedule, fullContractUrl);
    }

    return res.json({
      success: true,
      message: `Contrato ${schedule.contractNumber} enviado exitosamente por WhatsApp a ${schedule.clientPhone}`,
      data: sendResult
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/financial/schedules/:id/resend-paz-y-salvo-whatsapp
exports.resendPazYSalvoWhatsApp = async (req, res) => {
  try {
    const schedule = await PaymentSchedule.findById(req.params.id);
    if (!schedule) return res.status(404).json({ success: false, message: 'Cronograma no encontrado' });
    if (schedule.status !== 'PAGADO') return res.status(400).json({ success: false, message: 'El cronograma aún tiene saldo pendiente' });
    if (!schedule.clientPhone) return res.status(400).json({ success: false, message: 'El cliente no tiene teléfono registrado' });

    const company = await CompanyConfig.findOne() || {};
    const pazPdf = await generatePazYSalvoPdf(schedule, company);
    schedule.pazYSalvoPdfUrl = pazPdf.urlPath;
    await schedule.save();

    const fullPazUrl = `${getPublicHost(req)}${pazPdf.urlPath}`;
    const sendResult = await notifyPazYSalvoIssued(schedule, fullPazUrl);

    return res.json({
      success: true,
      message: `Constancia de Paz y Salvo enviada exitosamente por WhatsApp a ${schedule.clientPhone}`,
      data: sendResult
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/financial/schedules/:id/resend-receipt-whatsapp/:receiptIndex
exports.resendReceiptWhatsApp = async (req, res) => {
  try {
    const schedule = await PaymentSchedule.findById(req.params.id);
    if (!schedule) return res.status(404).json({ success: false, message: 'Cronograma no encontrado' });

    const rIdx = parseInt(req.params.receiptIndex, 10);
    const payment = schedule.payments[rIdx] || schedule.payments[schedule.payments.length - 1];
    if (!payment) return res.status(404).json({ success: false, message: 'Recibo no encontrado' });
    if (!schedule.clientPhone) return res.status(400).json({ success: false, message: 'El cliente no tiene teléfono registrado' });

    const company = await CompanyConfig.findOne() || {};
    const receiptPdf = await generateCashReceiptPdf(schedule, payment, company);
    const fullReceiptUrl = `${getPublicHost(req)}${receiptPdf.urlPath}`;

    const sendResult = await notifyPaymentReceived(schedule, payment, fullReceiptUrl);

    return res.json({
      success: true,
      message: `Recibo de Caja ${payment.receiptNumber} enviado exitosamente por WhatsApp a ${schedule.clientPhone}`,
      data: sendResult
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/financial/bi-metrics - Métricas ejecutivas y Business Intelligence
exports.getBIMetrics = async (req, res) => {
  try {
    const schedules = await PaymentSchedule.find();
    const quotes = await Quote.find();
    const workOrders = await WorkOrder.find();
    let invoices = [];
    try {
      const ElectronicInvoice = require('../models/ElectronicInvoice');
      invoices = await ElectronicInvoice.find();
    } catch (e) {}

    const now = new Date();

    // 1. KPIs Generales
    let totalContracted = 0;
    let totalCollected = 0;
    let totalAccountsReceivable = 0;
    let overdueAmount = 0;
    let overdueCount = 0;
    let paidCount = 0;
    let partialCount = 0;

    const allPayments = [];
    const upcomingInstallments = [];

    // Desglose de Flujo de Caja (Cash Flow Forecasting)
    let cashFlow15Days = 0;
    let cashFlow30Days = 0;
    let cashFlow60Days = 0;
    let cashFlowOverdue = 0;

    schedules.forEach(s => {
      const totalAmt = Number(s.totalAmount || 0);
      const bal = Math.max(0, Math.round(Number(s.balance || 0) * 100) / 100);
      totalContracted += totalAmt;
      totalAccountsReceivable += bal;

      if (bal <= 0.01) {
        paidCount++;
      } else {
        partialCount++;
      }

      // Procesar pagos registrados
      if (Array.isArray(s.payments)) {
        s.payments.forEach(p => {
          const amt = Number(p.amount || 0);
          totalCollected += amt;
          allPayments.push({
            receiptNumber: p.receiptNumber,
            contractNumber: s.contractNumber,
            clientName: s.clientName,
            plate: s.plate,
            amount: amt,
            paymentMethod: p.paymentMethod,
            operationNumber: p.operationNumber,
            paidAt: p.paidAt || s.createdAt
          });
        });
      }

      // Procesar cuotas para proyección de flujo de caja
      if (Array.isArray(s.installments)) {
        s.installments.forEach(inst => {
          if (!inst.isPaid && inst.dueDate) {
            const due = new Date(inst.dueDate);
            const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
            const instAmt = Number(inst.amount || 0);

            if (diffDays < 0) {
              cashFlowOverdue += instAmt;
              overdueAmount += instAmt;
              overdueCount++;
            } else {
              if (diffDays <= 15) cashFlow15Days += instAmt;
              if (diffDays <= 30) cashFlow30Days += instAmt;
              if (diffDays <= 60) cashFlow60Days += instAmt;
            }

            upcomingInstallments.push({
              contractNumber: s.contractNumber,
              clientName: s.clientName,
              clientPhone: s.clientPhone,
              plate: s.plate,
              installmentNumber: inst.installmentNumber,
              amount: instAmt,
              dueDate: inst.dueDate,
              diffDays,
              isOverdue: diffDays < 0
            });
          }
        });
      }
    });

    // Ordenar próximas cuotas por fecha de vencimiento
    upcomingInstallments.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    const recoveryRate = (totalContracted > 0)
      ? Math.min(100, Math.round((totalCollected / totalContracted) * 1000) / 10)
      : 100;

    const overdueRate = (totalAccountsReceivable > 0)
      ? Math.min(100, Math.round((overdueAmount / totalAccountsReceivable) * 1000) / 10)
      : 0;

    // 2. Facturación Total del Taller
    let totalQuotesApprovedSum = 0;
    let quotesApprovedCount = 0;
    let quotesPendingCount = 0;
    quotes.forEach(q => {
      const qTotal = Number(q.total || 0);
      if (q.status === 'APROBADA' || q.status === 'FACTURADA') {
        totalQuotesApprovedSum += qTotal;
        quotesApprovedCount++;
      } else if (q.status === 'PENDIENTE') {
        quotesPendingCount++;
      }
    });

    // 3. Desglose de Ingresos por Tipo de Servicio
    const serviceCategoryMap = {
      'Diagnóstico & Electrónica 24V': { total: 0, count: 0, color: '#38bdf8' },
      'Mecánica Diésel & Motor': { total: 0, count: 0, color: '#f59e0b' },
      'Sistema Eléctrico & Ramales': { total: 0, count: 0, color: '#10b981' },
      'Repuestos & Insumos': { total: 0, count: 0, color: '#a855f7' },
      'Auxilio Técnico & Despacho': { total: 0, count: 0, color: '#ec4899' }
    };

    quotes.forEach(q => {
      if (Array.isArray(q.items)) {
        q.items.forEach(it => {
          const val = Number(it.value || (it.quantity * it.unitPrice) || 0);
          const desc = String(it.description || '').toLowerCase();
          if (desc.includes('diagnostico') || desc.includes('scanner') || desc.includes('escaneo') || desc.includes('banco')) {
            serviceCategoryMap['Diagnóstico & Electrónica 24V'].total += val;
            serviceCategoryMap['Diagnóstico & Electrónica 24V'].count++;
          } else if (desc.includes('motor') || desc.includes('mecanica') || desc.includes('culata') || desc.includes('embrague') || desc.includes('freno')) {
            serviceCategoryMap['Mecánica Diésel & Motor'].total += val;
            serviceCategoryMap['Mecánica Diésel & Motor'].count++;
          } else if (desc.includes('electrico') || desc.includes('arrancador') || desc.includes('alternador') || desc.includes('ramal') || desc.includes('bateria')) {
            serviceCategoryMap['Sistema Eléctrico & Ramales'].total += val;
            serviceCategoryMap['Sistema Eléctrico & Ramales'].count++;
          } else if (desc.includes('repuesto') || desc.includes('filtro') || desc.includes('aceite') || desc.includes('sensor') || desc.includes('valvula')) {
            serviceCategoryMap['Repuestos & Insumos'].total += val;
            serviceCategoryMap['Repuestos & Insumos'].count++;
          } else {
            serviceCategoryMap['Auxilio Técnico & Despacho'].total += val;
            serviceCategoryMap['Auxilio Técnico & Despacho'].count++;
          }
        });
      }
    });

    const serviceCategories = Object.keys(serviceCategoryMap).map(key => ({
      name: key,
      total: Math.round(serviceCategoryMap[key].total * 100) / 100,
      count: serviceCategoryMap[key].count,
      color: serviceCategoryMap[key].color
    })).sort((a, b) => b.total - a.total);

    // 4. Distribución por Marca / Modelo
    const brandMap = {};
    const processBrand = (plate, modelStr) => {
      const text = `${modelStr || ''} ${plate || ''}`.toUpperCase();
      let brand = 'OTROS / MULTIMARCA';
      if (text.includes('VOLVO') || text.includes('FH') || text.includes('FM')) brand = 'VOLVO';
      else if (text.includes('SCANIA') || text.includes('P410') || text.includes('G440') || text.includes('R500')) brand = 'SCANIA';
      else if (text.includes('MERCEDES') || text.includes('ACTROS') || text.includes('AXOR')) brand = 'MERCEDES-BENZ';
      else if (text.includes('INTERNATIONAL') || text.includes('PROSTAR') || text.includes('WORKSTAR')) brand = 'INTERNATIONAL';
      else if (text.includes('FREIGHTLINER') || text.includes('COLUMBIA') || text.includes('CASCADIA')) brand = 'FREIGHTLINER';
      else if (text.includes('HINO') || text.includes('ISUZU') || text.includes('FUSO')) brand = 'ISUZU / HINO';
      else if (text.includes('TOYOTA') || text.includes('HILUX')) brand = 'TOYOTA';

      if (!brandMap[brand]) brandMap[brand] = { name: brand, count: 0 };
      brandMap[brand].count++;
    };

    workOrders.forEach(wo => processBrand(wo.plate, wo.model));
    const fleetBrands = Object.values(brandMap).sort((a, b) => b.count - a.count);

    // 5. Ranking de Clientes (Top 10)
    const clientMap = {};
    schedules.forEach(s => {
      const key = s.clientDoc || s.clientName;
      if (!clientMap[key]) {
        clientMap[key] = {
          name: s.clientName,
          doc: s.clientDoc,
          phone: s.clientPhone,
          totalAgreements: 0,
          totalContracted: 0,
          totalPaid: 0,
          balance: 0,
          status: s.status
        };
      }
      clientMap[key].totalAgreements++;
      clientMap[key].totalContracted += Number(s.totalAmount || 0);
      clientMap[key].balance += Number(s.balance || 0);
      const paid = (s.payments || []).reduce((acc, p) => acc + Number(p.amount || 0), 0);
      clientMap[key].totalPaid += paid;
      if (clientMap[key].balance > 0.01) {
        clientMap[key].status = 'PENDIENTE';
      }
    });

    const topClients = Object.values(clientMap)
      .map(c => ({
        ...c,
        totalContracted: Math.round(c.totalContracted * 100) / 100,
        totalPaid: Math.round(c.totalPaid * 100) / 100,
        balance: Math.max(0, Math.round(c.balance * 100) / 100),
        complianceRate: c.totalContracted > 0 ? Math.round((c.totalPaid / c.totalContracted) * 100) : 100
      }))
      .sort((a, b) => b.totalContracted - a.totalContracted)
      .slice(0, 10);

    // 6. Tendencia Mensual (Facturación vs Cobranzas reales)
    const monthlyTrends = [];
    const monthsNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      const mIdx = d.getMonth();
      const yr = d.getFullYear();
      const label = `${monthsNames[mIdx]} ${yr.toString().slice(-2)}`;

      const monthQuotesSum = quotes
        .filter(q => {
          const qDate = new Date(q.createdAt);
          return qDate.getMonth() === mIdx && qDate.getFullYear() === yr;
        })
        .reduce((sum, q) => sum + Number(q.total || 0), 0);

      const monthPaymentsSum = allPayments
        .filter(p => {
          const pDate = new Date(p.paidAt);
          return pDate.getMonth() === mIdx && pDate.getFullYear() === yr;
        })
        .reduce((sum, p) => sum + Number(p.amount || 0), 0);

      monthlyTrends.push({
        month: label,
        billed: Math.round(monthQuotesSum * 100) / 100,
        collected: Math.round(monthPaymentsSum * 100) / 100
      });
    }

    return res.json({
      success: true,
      data: {
        kpis: {
          totalContracted: Math.round(totalContracted * 100) / 100,
          totalCollected: Math.round(totalCollected * 100) / 100,
          totalAccountsReceivable: Math.round(totalAccountsReceivable * 100) / 100,
          recoveryRate,
          overdueAmount: Math.round(overdueAmount * 100) / 100,
          overdueRate,
          totalContracts: schedules.length,
          paidContracts: paidCount,
          partialContracts: partialCount,
          overdueContracts: overdueCount,
          totalQuotesApprovedSum: Math.round(totalQuotesApprovedSum * 100) / 100,
          quotesApprovedCount,
          quotesPendingCount
        },
        cashFlow: {
          next15Days: Math.round(cashFlow15Days * 100) / 100,
          next30Days: Math.round(cashFlow30Days * 100) / 100,
          next60Days: Math.round(cashFlow60Days * 100) / 100,
          overdue: Math.round(cashFlowOverdue * 100) / 100,
          upcomingInstallments: upcomingInstallments.slice(0, 15)
        },
        serviceCategories,
        fleetBrands,
        topClients,
        monthlyTrends,
        recentPayments: allPayments.sort((a, b) => new Date(b.paidAt) - new Date(a.paidAt)).slice(0, 8)
      }
    });
  } catch (error) {
    console.error('Error calculando BI Metrics:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/financial/bi-advisor - Bot Inteligente Asesor de Decisiones BI conectado a la DB
exports.getBIAdvisorInsight = async (req, res) => {
  try {
    const { question } = req.body || {};
    const schedules = await PaymentSchedule.find();
    const quotes = await Quote.find();
    const workOrders = await WorkOrder.find();
    const now = new Date();

    let totalContracted = 0;
    let totalCollected = 0;
    let totalBalance = 0;
    let overdueSum = 0;
    const overdueDebtors = [];
    const upcomingDebtors = [];

    schedules.forEach(s => {
      totalContracted += Number(s.totalAmount || 0);
      const b = Math.max(0, Math.round(Number(s.balance || 0) * 100) / 100);
      totalBalance += b;
      (s.payments || []).forEach(p => { totalCollected += Number(p.amount || 0); });

      (s.installments || []).forEach(inst => {
        if (!inst.isPaid && inst.dueDate) {
          const diffDays = Math.ceil((new Date(inst.dueDate) - now) / (1000 * 60 * 60 * 24));
          const instAmt = Number(inst.amount || 0);
          if (diffDays < 0) {
            overdueSum += instAmt;
            overdueDebtors.push({
              client: s.clientName,
              plate: s.plate,
              contract: s.contractNumber,
              amount: instAmt,
              daysLate: Math.abs(diffDays),
              phone: s.clientPhone
            });
          } else if (diffDays <= 30) {
            upcomingDebtors.push({
              client: s.clientName,
              plate: s.plate,
              contract: s.contractNumber,
              amount: instAmt,
              diffDays
            });
          }
        }
      });
    });

    const recoveryRate = totalContracted > 0 ? ((totalCollected / totalContracted) * 100).toFixed(1) : 100;
    const overdueRate = totalBalance > 0 ? ((overdueSum / totalBalance) * 100).toFixed(1) : 0;

    let answer = '';
    const qLower = (question || '').toLowerCase();

    if (qLower) {
      if (qLower.includes('mora') || qLower.includes('vencid') || qLower.includes('deuda')) {
        answer = `📊 **Diagnóstico de Cartera Vencida & Mora:**\n` +
          `Actualmente existen **S/ ${overdueSum.toFixed(2)}** en mora pendientes de cobro, correspondientes a ${overdueDebtors.length} cuotas vencidas.\n\n` +
          `🚨 **Clientes en mora prioritaria:**\n` +
          overdueDebtors.map(d => `• **${d.client}** (${d.plate || 'Sin Placa'} - ${d.contract}): S/ ${d.amount.toFixed(2)} (${d.daysLate} días de mora) - Tel: ${d.phone || 'Sin tel'}`).join('\n') +
          `\n\n💡 **Recomendación Estratégica BI:** Disparar de inmediato la alerta interna al asesor técnico (Darios Bacilio) y programar recordatorio amable por WhatsApp ofreciendo pago digital vía Yape/Plin o transferencia inmediata BCP/BBVA.`;
      } else if (qLower.includes('flujo') || qLower.includes('proyeccion') || qLower.includes('15') || qLower.includes('30') || qLower.includes('liquidez')) {
        const next15Sum = upcomingDebtors.filter(d => d.diffDays <= 15).reduce((acc, d) => acc + d.amount, 0);
        const next30Sum = upcomingDebtors.reduce((acc, d) => acc + d.amount, 0);
        answer = `📈 **Proyección Predictiva de Flujo de Caja:**\n` +
          `• **Próximos 15 Días:** Se proyecta un ingreso en caja de **S/ ${next15Sum.toFixed(2)}**.\n` +
          `• **Próximos 30 Días:** Ingreso esperado acumulado de **S/ ${next30Sum.toFixed(2)}**.\n` +
          `• **Tasa de Recuperación Histórica:** **${recoveryRate}%** de efectividad.\n\n` +
          `💡 **Recomendación de Tesorería:** El 40% del flujo proyectado de los próximos 15 días debe reservarse para compra de insumos de alta rotación (relés 24V, terminales y sensores) para evitar cuellos de botella en taller.`;
      } else if (qLower.includes('servicio') || qLower.includes('rentab') || qLower.includes('margen')) {
        answer = `🔧 **Análisis de Servicios y Rentabilidad Operativa:**\n` +
          `• **Diagnóstico Electrónico 24V & Scanner:** Es la línea con mayor margen neto (más del 80% de margen) y menor costo de materiales.\n` +
          `• **Sistema Eléctrico & Banco de Baterías:** Representa el mayor volumen recurrente en unidades pesadas (Volvo/Scania).\n` +
          `• **Mecánica Pesada Diésel:** Buen volumen de facturación pero mayor tiempo de ocupación en rampa.\n\n` +
          `💡 **Decisión Sugerida:** Promover paquetes de 'Mantenimiento Preventivo Eléctrico 24V + Certificación de Baterías' a clientes de flotas mineras e interprovinciales con tarifa cerrada para maximizar ocupación del taller sin canibalizar horas hombre.`;
      } else {
        answer = `🤖 **Dictamen General del Asistente BI DARSIL:**\n` +
          `Analizando las ${schedules.length} operaciones activas, ${workOrders.length} órdenes de trabajo y ${quotes.length} cotizaciones registradas:\n\n` +
          `1️⃣ **Salud Financiera:** La tasa de cobro es del **${recoveryRate}%**, con **S/ ${totalCollected.toFixed(2)}** recaudados de **S/ ${totalContracted.toFixed(2)}** contratados.\n` +
          `2️⃣ **Saldo en Calle:** Quedan **S/ ${totalBalance.toFixed(2)}** por recaudar, de los cuales **S/ ${overdueSum.toFixed(2)}** (${overdueRate}%) están en riesgo de mora.\n` +
          `3️⃣ **Ocupación de Taller:** Se registran unidades en proceso de diagnóstico y cotización activa.\n\n` +
          `🎯 **Estrategia Recomendada:** Focalizar las gestiones de cobranza matutinas en los clientes con cuotas superiores a 5 días de mora y ofrecer un 5% de descuento por pronto pago en la última cuota si liquidan antes de la entrega del vehículo.`;
      }
    }

    const strategicActions = [
      {
        category: 'COBRANZA_INMEDIATA',
        title: overdueDebtors.length > 0 
          ? `Recuperación de Cartera en Mora (S/ ${overdueSum.toFixed(2)})`
          : 'Cartera 100% al Día',
        urgency: overdueDebtors.length > 0 ? 'CRITICA' : 'BAJA',
        summary: overdueDebtors.length > 0
          ? `Hay ${overdueDebtors.length} cuotas vencidas. Cliente principal: ${overdueDebtors[0]?.client || 'N/A'} con S/ ${overdueDebtors[0]?.amount?.toFixed(2) || 0} (${overdueDebtors[0]?.daysLate || 0}d de mora).`
          : 'No se detectan cuotas vencidas actualmente. La puntualidad de los clientes es óptima.',
        action: overdueDebtors.length > 0
          ? 'Disparar el Recordatorio Amigable o Alerta al Asesor Darios Bacilio vía WhatsApp con número de operación bancaria.'
          : 'Mantener la disciplina de confirmación de depósitos 24h previas al vencimiento.',
        impact: `Inyección de S/ ${overdueSum.toFixed(2)} directa a liquidez inmediata.`
      },
      {
        category: 'PROYECCION_LIQUIDEZ',
        title: 'Plan de Tesorería a 15 Días',
        urgency: 'MEDIA',
        summary: `Se prevén ingresos por S/ ${(upcomingDebtors.filter(d => d.diffDays <= 15).reduce((acc, d) => acc + d.amount, 0)).toFixed(2)} en los próximos 15 días.`,
        action: 'Asegurar la liberación de constancias de Paz y Salvo automáticas en cuanto se acrediten los abonos en cuenta corriente.',
        impact: 'Cero retención innecesaria de unidades en rampa y mayor rotación de puestos de trabajo.'
      },
      {
        category: 'LINEAS_NEGOCIO',
        title: 'Impulso a Diagnóstico Electrónico 24V',
        urgency: 'ALTA',
        summary: 'El diagnóstico computarizado CAN Bus y banco de pruebas ofrece el margen de utilidad operativa más alto del taller (85%).',
        action: 'Empaquetar el servicio DG01 con cambio de relé y revisión de alternador como check-up estándar de ingreso.',
        impact: 'Incremento del ticket promedio cotizado en un 22% por unidad ingresada.'
      },
      {
        category: 'FIDELIZACION_FLOTAS',
        title: 'Contratos Periódicos para Flotas Pesadas',
        urgency: 'MEDIA',
        summary: 'Volvo y Scania representan la mayor concentración de unidades atendidas en Villa El Salvador.',
        action: 'Ofrecer a transportistas mineros acuerdos marco de pago en 2 o 3 partes con firma de contrato digital formal.',
        impact: 'Fidelización de flotas corporativas y predictibilidad de ingresos mensuales.'
      }
    ];

    res.json({
      success: true,
      data: {
        timestamp: new Date(),
        question: question || null,
        answer: answer || null,
        summaryKpis: {
          totalContracted: Math.round(totalContracted * 100) / 100,
          totalCollected: Math.round(totalCollected * 100) / 100,
          totalBalance: Math.round(totalBalance * 100) / 100,
          recoveryRate,
          overdueSum: Math.round(overdueSum * 100) / 100,
          overdueCount: overdueDebtors.length
        },
        strategicActions,
        overdueDebtors: overdueDebtors.slice(0, 5),
        recommendedPrompts: [
          '¿Cuál es la estrategia para recuperar la cartera vencida hoy?',
          '¿Cuánto flujo de caja ingresará en los próximos 15 días?',
          '¿Cuáles son los 3 servicios con mayor margen de ganancia?',
          '¿Qué plan de mantenimiento sugerir para flotas Volvo?'
        ]
      }
    });
  } catch (error) {
    console.error('Error en BI Advisor:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};


