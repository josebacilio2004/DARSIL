const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const BotConfig = require('../models/BotConfig');
const WhatsAppLog = require('../models/WhatsAppLog');

const DEFAULT_PHONE = '+51 934 787 006';
const AUTH_DIR = path.join(process.cwd(), 'auth_info_baileys');

function clearAuthDir() {
  try {
    if (fs.existsSync(AUTH_DIR)) {
      const files = fs.readdirSync(AUTH_DIR);
      for (const file of files) {
        try {
          fs.rmSync(path.join(AUTH_DIR, file), { recursive: true, force: true });
        } catch (err) {}
      }
      console.log('[WHATSAPP BOT] 🧹 Archivos residuales de sesión limpiados exitosamente.');
    }
  } catch (e) {
    console.error('[WHATSAPP BOT] Error limpiando directorio de sesión:', e.message);
  }
}

// Variables de estado en memoria del socket Baileys
let sock = null;
let currentQr = null;
let isConnected = false;
let isInitializing = false;

/**
 * Obtiene o inicializa la configuración en BD
 */
async function getOrInitBotConfig() {
  let config = await BotConfig.findOne();
  if (!config) {
    config = new BotConfig({
      phoneNumber: DEFAULT_PHONE,
      status: isConnected ? 'CONECTADO' : 'DESCONECTADO',
      sessionQr: currentQr || '',
      lastConnectedAt: isConnected ? new Date() : null,
      batteryLevel: 98,
      triggers: {
        autoSendQuote: true,
        autoSendCheckIn: true,
        autoSendDiagnosis: true,
        autoSendFinished: true,
        autoSendInvoice: true
      }
    });
    await config.save();
  } else {
    // Sincronizar estado en memoria con BD
    if (isConnected && config.status !== 'CONECTADO') {
      config.status = 'CONECTADO';
      await config.save();
    }
  }
  return config;
}

/**
 * Inicializa la conexión en vivo con Baileys (WhatsApp Web Multi-Dispositivo)
 */
async function initWhatsAppBot(forceRestart = false) {
  if (isInitializing && !forceRestart) return;
  if (isConnected && !forceRestart) return;

  isInitializing = true;

  try {
    if (!fs.existsSync(AUTH_DIR)) {
      fs.mkdirSync(AUTH_DIR, { recursive: true });
    }

    if (sock && forceRestart) {
      try {
        sock.ev.removeAllListeners();
        sock.end();
      } catch (e) {}
      sock = null;
    }

    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

    sock = makeWASocket({
      auth: state,
      printQRInTerminal: true, // Imprime en consola docker para monitoreo
      logger: pino({ level: 'silent' }),
      browser: ['DARSIL Taller ERP', 'Chrome', '124.0.0']
    });

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        console.log('[WHATSAPP BOT] 📲 Nuevo código QR emitido por WhatsApp.');
        try {
          currentQr = await QRCode.toDataURL(qr, {
            margin: 1,
            width: 280,
            color: { dark: '#0f294a', light: '#ffffff' }
          });
          const config = await getOrInitBotConfig();
          config.sessionQr = currentQr;
          config.status = 'EMPAREJANDO';
          await config.save();
        } catch (qrErr) {
          console.error('[WHATSAPP BOT] Error generando Data URL del QR:', qrErr.message);
        }
      }

      if (connection === 'open') {
        isConnected = true;
        currentQr = null;
        isInitializing = false;
        const rawId = sock.user?.id || '';
        const phone = rawId.split(':')[0] || rawId.split('@')[0] || '51934787006';
        const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;

        console.log(`[WHATSAPP BOT] ✅ CONEXIÓN EXITOSA. Sesión activa: ${formattedPhone}`);
        const config = await getOrInitBotConfig();
        config.status = 'CONECTADO';
        config.phoneNumber = formattedPhone;
        config.sessionQr = '';
        config.lastConnectedAt = new Date();
        await config.save();
      }

      if (connection === 'close') {
        isConnected = false;
        isInitializing = false;
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        console.warn(`[WHATSAPP BOT] ⚠️ Conexión cerrada. Código de desconexión: ${statusCode}`);

        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        if (statusCode === DisconnectReason.loggedOut) {
          console.log('[WHATSAPP BOT] 🔒 Sesión cerrada por el usuario. Limpiando credenciales...');
          try {
            clearAuthDir();
          } catch (e) {}
          currentQr = null;
          const config = await getOrInitBotConfig();
          config.status = 'DESCONECTADO';
          config.sessionQr = '';
          await config.save();
        } else if (shouldReconnect) {
          console.log('[WHATSAPP BOT] 🔄 Reintentando reconexión automática en 4 segundos...');
          setTimeout(() => initWhatsAppBot(), 4000);
        }
      }
    });

    sock.ev.on('creds.update', async () => {
      await saveCreds();
    });

  } catch (err) {
    console.error('[WHATSAPP BOT] Error iniciando Baileys:', err.message);
    isInitializing = false;
  }
}

/**
 * Genera o devuelve el código QR de vinculación actual
 */
async function generateNewQr() {
  const config = await getOrInitBotConfig();

  if (isConnected && sock) {
    return {
      status: 'CONECTADO',
      phoneNumber: config.phoneNumber,
      qrCode: null,
      message: 'El bot ya se encuentra vinculado y activo.'
    };
  }

  // Si no está conectado, forzar limpieza de credenciales residuales e inicializar nuevo handshake
  clearAuthDir();
  currentQr = null;
  await initWhatsAppBot(true);

  // Esperar activamente hasta que WhatsApp entregue el código QR (máximo 8s)
  for (let i = 0; i < 16; i++) {
    await new Promise(r => setTimeout(r, 500));
    if (currentQr || isConnected) break;
  }

  return {
    qrCode: currentQr,
    phoneNumber: config.phoneNumber,
    status: isConnected ? 'CONECTADO' : 'EMPAREJANDO'
  };
}

/**
 * Desconecta la sesión activa de WhatsApp
 */
async function disconnectWhatsAppBot() {
  if (sock) {
    try {
      await sock.logout();
    } catch (e) {
      try { sock.end(); } catch (err) {}
    }
    sock = null;
  }

  try {
    clearAuthDir();
  } catch (e) {}

  isConnected = false;
  currentQr = null;
  const config = await getOrInitBotConfig();
  config.status = 'DESCONECTADO';
  config.sessionQr = '';
  await config.save();
  return config;
}

/**
 * Despacha un mensaje por WhatsApp (texto o documento PDF adjunto)
 */
async function sendWhatsAppMessage({ recipientPhone, recipientName, eventType, referenceDoc, messageText, mediaUrl, fileName }) {
  const rawPhone = String(recipientPhone || '').replace(/\D/g, '');
  const cleanPhone = rawPhone ? (rawPhone.startsWith('51') ? rawPhone : `51${rawPhone}`) : '51934787006';
  const jid = `${cleanPhone}@s.whatsapp.net`;

  let deliveryStatus = 'ENTREGADO';
  let sendError = null;

  // Auto-detectar URL de PDF en el cuerpo del mensaje si no vino explícita
  let finalMediaUrl = mediaUrl;
  if (!finalMediaUrl && messageText) {
    const match = messageText.match(/(https?:\/\/[^\s\n<>()]+(?:\/pdf|\.pdf)[^\s\n<>()]*)/i);
    if (match) finalMediaUrl = match[1];
  }

  // 1. Verificar si el archivo está en disco local (ej. /uploads/...)
  let documentPayload = null;
  if (finalMediaUrl) {
    const uploadIndex = finalMediaUrl.indexOf('/uploads/');
    if (uploadIndex !== -1) {
      const relPath = finalMediaUrl.slice(uploadIndex); // /uploads/...
      const diskPath = path.join(__dirname, '../..', relPath);
      if (fs.existsSync(diskPath)) {
        console.log('[WHATSAPP BOT] 📂 Leyendo PDF directamente desde disco:', diskPath);
        documentPayload = fs.readFileSync(diskPath);
      }
    }
    
    // Normalizar URLs locales (reemplazar http://localhost con http://localhost:4000)
    finalMediaUrl = finalMediaUrl.replace(/http:\/\/localhost(:\d+)?\//, 'http://localhost:4000/');
    if (finalMediaUrl.includes('darsil-backend.onrender.com') && (finalMediaUrl.includes('/sample/pdf') || finalMediaUrl.includes('/demo/pdf'))) {
      finalMediaUrl = finalMediaUrl.replace('https://darsil-backend.onrender.com', 'http://localhost:4000');
    }
  }

  if (isConnected && sock) {
    try {
      console.log(`[WHATSAPP BOT] 🚀 Enviando a ${jid} (Evento: ${eventType})...`);

      const cleanFileName = fileName || `${referenceDoc || 'Documento'}_DARSIL.pdf`;

      // Si tenemos buffer local o URL de PDF, enviarlo como documento
      if (documentPayload) {
        try {
          await sock.sendMessage(jid, {
            document: documentPayload,
            mimetype: 'application/pdf',
            fileName: cleanFileName
          });
          console.log(`[WHATSAPP BOT] 📄 Documento PDF adjuntado desde disco y enviado con éxito a ${jid} (${cleanFileName})`);

          // Enviar mensaje de texto con desglose y detalles
          if (messageText) {
            await new Promise(r => setTimeout(r, 400));
            await sock.sendMessage(jid, { text: messageText });
            console.log(`[WHATSAPP BOT] 💬 Mensaje de texto explicativo entregado a ${jid}`);
          }
        } catch (mediaErr) {
          console.warn('[WHATSAPP BOT] Aviso enviando PDF desde disco, enviando mensaje de texto de respaldo:', mediaErr.message);
          await sock.sendMessage(jid, { text: messageText });
        }
      } else if (finalMediaUrl && (finalMediaUrl.endsWith('.pdf') || finalMediaUrl.includes('/pdf'))) {
        try {
          console.log('[WHATSAPP BOT] 📥 Descargando y adjuntando PDF oficial desde:', finalMediaUrl);
          await sock.sendMessage(jid, {
            document: { url: finalMediaUrl },
            mimetype: 'application/pdf',
            fileName: cleanFileName
          });
          console.log(`[WHATSAPP BOT] 📄 Documento PDF adjuntado y enviado con éxito a ${jid} (${cleanFileName})`);

          if (messageText) {
            await new Promise(r => setTimeout(r, 400));
            await sock.sendMessage(jid, { text: messageText });
            console.log(`[WHATSAPP BOT] 💬 Mensaje de texto explicativo entregado a ${jid}`);
          }
        } catch (mediaErr) {
          console.warn('[WHATSAPP BOT] Aviso al descargar PDF, enviando mensaje de texto como respaldo:', mediaErr.message);
          await sock.sendMessage(jid, { text: messageText });
        }
      } else {
        // Mensaje de texto estándar
        await sock.sendMessage(jid, {
          text: messageText
        });
        console.log(`[WHATSAPP BOT] 💬 Mensaje de texto entregado a ${jid}`);
      }
    } catch (err) {
      console.error('[WHATSAPP BOT] Error enviando mensaje por socket:', err.message);
      // Intento final de rescate con texto simple
      try {
        await sock.sendMessage(jid, { text: messageText });
        deliveryStatus = 'ENTREGADO';
      } catch (fallbackErr) {
        deliveryStatus = 'FALLIDO';
        sendError = err.message;
      }
    }
  } else {
    console.warn(`[WHATSAPP BOT] Socket offline. Mensaje registrado en bitácora para envío manual: ${cleanPhone}`);
    deliveryStatus = 'ENVIADO';
  }

  // Registrar en la bitácora de auditoría CRM
  const log = new WhatsAppLog({
    recipientPhone: cleanPhone,
    recipientName: recipientName || 'Cliente DARSIL',
    eventType: eventType || 'MENSAJE_MANUAL',
    referenceDoc: referenceDoc || '',
    messageText,
    mediaUrl: mediaUrl || '',
    status: deliveryStatus,
    sentBy: isConnected ? `Bot DARSIL Oficial (${cleanPhone})` : 'DARSIL Manual'
  });

  await log.save();

  return {
    success: deliveryStatus === 'ENTREGADO' || deliveryStatus === 'ENVIADO',
    status: deliveryStatus,
    error: sendError,
    log,
    whatsappUrl: `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(messageText)}`
  };
}

/**
 * Disparador: Cotización Emitida
 */
async function notifyQuoteIssued(quote, publicPdfUrl) {
  const config = await getOrInitBotConfig();
  const isQuoteActive = config.triggers?.autoSendQuote !== false && config.triggers?.onQuoteCreated !== false;
  if (!isQuoteActive) {
    console.log('[WHATSAPP BOT] Disparador de cotización desactivado por configuración.');
    return;
  }

  const totalStr = 'S/ ' + Number(quote.total || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 });
  const pdfLink = publicPdfUrl || `https://darsil-backend.onrender.com/api/quotes/${quote._id}/pdf`;

  const msg = 
`⚡ *DARSIL AUTOMOTIVE SOLUTIONS* ⚡
_Tecnología • Diagnóstico • Ingeniería • Innovación_

Estimado/a *${quote.clientName}*,
Le hacemos llegar la cotización oficial solicitada adjunta en este mensaje:

📋 *N° Cotización:* ${quote.quoteNumber}
${quote.plate ? `🚗 *Vehículo:* ${quote.plate} (${quote.model || 'Sin modelo'})\n` : ''}💰 *Total:* ${totalStr}
📅 *Validez:* ${quote.validUntil ? new Date(quote.validUntil).toLocaleDateString('es-PE') : '15 días hábiles'}
💳 *Condición:* ${quote.paymentCondition || '07 días después de realizado el servicio'}

📄 *Adjunto encontrará el documento PDF oficial con membrete y cuentas bancarias.*

Quedamos a su entera disposición para coordinar la atención técnica.
📞 Asesor: ${quote.advisorName || 'Darios Bacilio'} (${quote.advisorPhone || '934787006'})`;

  return sendWhatsAppMessage({
    recipientPhone: quote.clientPhone,
    recipientName: quote.clientName,
    eventType: 'COTIZACION_EMITIDA',
    referenceDoc: quote.quoteNumber,
    messageText: msg,
    mediaUrl: pdfLink,
    fileName: `Cotizacion_${quote.quoteNumber}_DARSIL.pdf`
  });
}

/**
 * Disparador: Check-In Taller (Acta de Ingreso)
 */
async function notifyWorkOrderCheckIn(workOrder, publicPdfUrl) {
  const config = await getOrInitBotConfig();
  const isCheckInActive = config.triggers?.autoSendCheckIn !== false && config.triggers?.onWorkOrderCheckIn !== false;
  if (!isCheckInActive) {
    console.log('[WHATSAPP BOT] Disparador de Check-In desactivado por configuración.');
    return;
  }

  const pdfLink = publicPdfUrl || `https://darsil-backend.onrender.com/api/work-orders/${workOrder._id}/pdf`;
  const vehicleText = [workOrder.plate, workOrder.model].filter(Boolean).join(' • ');

  const msg = 
`🔧 *DARSIL TALLER - CHECK-IN & RECEPCIÓN OFICIAL* 🔧
Estimado/a *${workOrder.clientName}*,
Le confirmamos el ingreso oficial de su unidad a nuestro Taller Central (VES):

📋 *N° Orden de Trabajo:* ${workOrder.orderNumber}
🚗 *Vehículo:* ${vehicleText || 'Unidad de Flota'}
⛽ *Nivel de Combustible:* ${workOrder.fuelLevel || '1/2'}
🔍 *Falla Reportada:* ${workOrder.reportedFault || 'Diagnóstico general'}

📄 *Adjunto encontrará el Acta Oficial de Recepción en PDF.*
Nuestro equipo técnico ya inició el protocolo de diagnóstico.
📞 Central Taller: 934787006`;

  return sendWhatsAppMessage({
    recipientPhone: workOrder.clientPhone || workOrder.driverPhone,
    recipientName: workOrder.clientName,
    eventType: 'CHECKIN_TALLER',
    referenceDoc: workOrder.orderNumber,
    messageText: msg,
    mediaUrl: pdfLink,
    fileName: `Acta_Ingreso_${workOrder.orderNumber}_DARSIL.pdf`
  });
}

/**
 * Despacha un mensaje con múltiples documentos PDF adjuntos y texto complementario
 */
async function sendWhatsAppMultipleDocuments({ recipientPhone, recipientName, eventType, referenceDoc, messageText, documents = [] }) {
  const rawPhone = String(recipientPhone || '').replace(/\D/g, '');
  const cleanPhone = rawPhone ? (rawPhone.startsWith('51') ? rawPhone : `51${rawPhone}`) : '51934787006';
  const jid = `${cleanPhone}@s.whatsapp.net`;

  let deliveryStatus = 'ENTREGADO';

  if (isConnected && sock) {
    try {
      console.log(`[WHATSAPP BOT] 🚀 Enviando paquete de ${documents.length} documentos a ${jid} (${eventType})...`);

      for (let i = 0; i < documents.length; i++) {
        const doc = documents[i];
        let documentPayload = null;
        let finalMediaUrl = doc.url || doc.mediaUrl;

        if (finalMediaUrl) {
          const uploadIndex = finalMediaUrl.indexOf('/uploads/');
          if (uploadIndex !== -1) {
            const relPath = finalMediaUrl.slice(uploadIndex);
            const diskPath = path.join(__dirname, '../..', relPath);
            if (fs.existsSync(diskPath)) {
              documentPayload = fs.readFileSync(diskPath);
            }
          }
          finalMediaUrl = finalMediaUrl.replace(/http:\/\/localhost(:\d+)?\//, 'http://localhost:4000/');
        }

        const fileName = doc.fileName || `Documento_${i + 1}_DARSIL.pdf`;

        if (documentPayload) {
          await sock.sendMessage(jid, {
            document: documentPayload,
            mimetype: 'application/pdf',
            fileName
          });
          console.log(`[WHATSAPP BOT] 📄 [${i + 1}/${documents.length}] PDF enviado desde disco: ${fileName}`);
        } else if (finalMediaUrl) {
          await sock.sendMessage(jid, {
            document: { url: finalMediaUrl },
            mimetype: 'application/pdf',
            fileName
          });
          console.log(`[WHATSAPP BOT] 📄 [${i + 1}/${documents.length}] PDF enviado desde URL: ${fileName}`);
        }
        await new Promise(r => setTimeout(r, 600));
      }

      if (messageText) {
        await new Promise(r => setTimeout(r, 400));
        await sock.sendMessage(jid, { text: messageText });
        console.log(`[WHATSAPP BOT] 💬 Mensaje explicativo conjunto entregado a ${jid}`);
      }
    } catch (err) {
      console.error('[WHATSAPP BOT] Error enviando paquete de documentos:', err.message);
      try {
        await sock.sendMessage(jid, { text: messageText });
        deliveryStatus = 'ENTREGADO';
      } catch (e2) {
        deliveryStatus = 'FALLIDO';
      }
    }
  } else {
    console.warn(`[WHATSAPP BOT] Socket offline. Paquete registrado para envío manual a ${cleanPhone}`);
    deliveryStatus = 'ENVIADO';
  }

  const log = new WhatsAppLog({
    recipientPhone: cleanPhone,
    recipientName: recipientName || 'Cliente DARSIL',
    eventType: eventType || 'COTIZACION_CONJUNTA_OT',
    referenceDoc: referenceDoc || '',
    messageText,
    mediaUrl: documents.map(d => d.url || d.fileName).join(' | '),
    status: deliveryStatus,
    sentBy: isConnected ? `Bot DARSIL Oficial (${cleanPhone})` : 'DARSIL Manual'
  });
  await log.save();

  return { success: deliveryStatus === 'ENTREGADO' || deliveryStatus === 'ENVIADO', status: deliveryStatus };
}

/**
 * Disparador: Envío Conjunto de Orden de Trabajo (Acta de Recepción) y Cotización Oficial
 * Se despacha cuando el diagnóstico está completo y se genera la cotización oficial.
 */
async function notifyWorkOrderWithQuote(workOrder, quote, workOrderPdfUrl, quotePdfUrl) {
  const config = await getOrInitBotConfig();
  if (config.triggers?.autoSendQuote === false) return;

  const vehicleText = [workOrder.plate, workOrder.model].filter(Boolean).join(' • ');
  const totalStr = 'S/ ' + Number(quote.total || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 });
  const mileageText = workOrder.mileage && workOrder.mileage.trim() !== '' ? workOrder.mileage : 'Registrado en taller';
  const hourmeterText = workOrder.hourmeter && workOrder.hourmeter.trim() !== '' ? workOrder.hourmeter : 'No aplica';

  const msg = 
`📋 *DARSIL TALLER - RECEPCIÓN TÉCNICA & COTIZACIÓN OFICIAL* 📋
_Informe de Diagnóstico y Presupuesto de Servicios_

Estimado/a *${workOrder.clientName}*,
Le confirmamos que su unidad *${vehicleText || 'en Taller'}* ha sido inspeccionada y diagnosticada satisfactoriamente en nuestro Taller Central (VES):

📋 *N° Orden de Trabajo:* ${workOrder.orderNumber}
📊 *Kilometraje Registrado:* ${mileageText}
⏱️ *Horómetro Maquinaria:* ${hourmeterText}
⛽ *Nivel de Combustible:* ${workOrder.fuelLevel || '1/2'}
🔍 *Diagnóstico / Falla:* ${workOrder.reportedFault || 'Revisión técnica general'}

⚡ *Cotización Vinculada:* ${quote.quoteNumber}
💰 *Inversión Total Cotizada:* ${totalStr}
📅 *Validez de la Oferta:* ${quote.validityDays || 15} días calendario
📋 *Condición de Pago:* ${quote.paymentCondition || 'Según acuerdo'}

📄 *Adjunto encontrará ambos documentos oficiales en PDF:*
1️⃣ *Acta de Recepción e Inventario Técnico (OT)*
2️⃣ *Cotización Detallada de Repuestos & Mano de Obra*
${quotePdfUrl ? `🔗 *Descarga Cotización en línea:* ${quotePdfUrl}\n` : ''}${workOrderPdfUrl ? `🔗 *Descarga OT en línea:* ${workOrderPdfUrl}\n` : ''}
💳 *Cuentas Autorizadas DARSIL:*
• BCP Soles: 191-9847291-0-28 (CCI: 00219100984729102854)
• BBVA Soles: 0011-0382-0100049281 (CCI: 01138200010004928172)
• Yape / Plin Comercial: 934787006

Quedamos atentos a su aprobación para dar inicio inmediato a los trabajos técnicos.
📞 Asesor Técnico: ${quote.advisorName || 'Darios Bacilio'} (${quote.advisorPhone || '934787006'})`;

  return sendWhatsAppMultipleDocuments({
    recipientPhone: quote.clientPhone || workOrder.clientPhone || workOrder.driverPhone,
    recipientName: quote.clientName,
    eventType: 'COTIZACION_CONJUNTA_OT',
    referenceDoc: `${workOrder.orderNumber}+${quote.quoteNumber}`,
    messageText: msg,
    documents: [
      {
        url: workOrderPdfUrl,
        fileName: `Acta_Recepcion_${workOrder.orderNumber}_DARSIL.pdf`
      },
      {
        url: quotePdfUrl,
        fileName: `Cotizacion_${quote.quoteNumber}_DARSIL.pdf`
      }
    ]
  });
}

/**
 * Disparador: Trabajo Concluido
 */
async function notifyWorkOrderFinished(workOrder) {
  const config = await getOrInitBotConfig();
  const isFinishedActive = config.triggers?.autoSendFinished !== false && config.triggers?.onWorkOrderFinished !== false;
  if (!isFinishedActive) {
    console.log('[WHATSAPP BOT] Disparador de Trabajo Concluido desactivado por configuración.');
    return;
  }

  const vehicleText = [workOrder.plate, workOrder.model].filter(Boolean).join(' • ');

  const msg = 
`✅ *DARSIL - UNIDAD LISTA PARA RETIRO* ✅
Estimado/a *${workOrder.clientName}*,
Le informamos que los servicios técnicos para su unidad *${vehicleText}* han concluido exitosamente.

📋 *N° Orden:* ${workOrder.orderNumber}
🏢 *Lugar de Retiro:* Taller Central DARSIL - Av. Los Forestales, Villa El Salvador, Lima
⏰ *Horario de Atención:* Lunes a Sábado de 8:00 AM a 6:00 PM

Agradecemos su confianza en DARSIL Automotive Solutions.
📞 Contacto: 934787006`;

  return sendWhatsAppMessage({
    recipientPhone: workOrder.clientPhone || workOrder.driverPhone,
    recipientName: workOrder.clientName,
    eventType: 'TRABAJO_CONCLUIDO',
    referenceDoc: workOrder.orderNumber,
    messageText: msg
  });
}

/**
 * Disparador: Factura Electrónica SUNAT
 */
async function notifyInvoiceIssued(invoice, publicPdfUrl) {
  const config = await getOrInitBotConfig();
  const isInvoiceActive = config.triggers?.autoSendInvoice !== false && config.triggers?.onInvoiceIssued !== false;
  if (!isInvoiceActive) {
    console.log('[WHATSAPP BOT] Disparador de Facturación SUNAT desactivado por configuración.');
    return;
  }

  const totalStr = 'S/ ' + Number(invoice.totals?.total || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 });
  const pdfLink = publicPdfUrl || `https://darsil-backend.onrender.com/api/invoices/${invoice._id}/pdf`;
  const tipoDoc = invoice.invoiceType === '01' ? 'Factura Electrónica' : 'Boleta de Venta Electrónica';

  const msg = 
`📄 *DARSIL - COMPROBANTE ELECTRÓNICO SUNAT* 📄
Estimado/a *${invoice.clientName}*,
Adjuntamos la emisión de su comprobante electrónico oficial con código QR y validación UBL 2.1 ante SUNAT:

📋 *${tipoDoc}:* ${invoice.fullNumber}
💰 *Importe Total:* ${totalStr}
📅 *Fecha de Emisión:* ${new Date(invoice.issueDate).toLocaleDateString('es-PE')}
${invoice.plate ? `🚗 *Unidad Atendida:* ${invoice.plate}\n` : ''}
🔐 *Hash SUNAT:* ${invoice.sunatResponse?.hash || 'Certificado'}
✅ *Estado:* ACEPTADO CON CONSTANCIA CDR

Gracias por confiar en DARSIL Automotive Solutions.`;

  return sendWhatsAppMessage({
    recipientPhone: invoice.clientPhone,
    recipientName: invoice.clientName,
    eventType: 'FACTURA_EMITIDA',
    referenceDoc: invoice.fullNumber,
    messageText: msg,
    mediaUrl: pdfLink,
    fileName: `${invoice.fullNumber}_DARSIL.pdf`
  });
}

// Inicializar el bot al arrancar el backend si ya existen credenciales guardadas
if (fs.existsSync(AUTH_DIR) && fs.readdirSync(AUTH_DIR).length > 0) {
  console.log('[WHATSAPP BOT] Credenciales existentes encontradas. Conectando sesión...');
  initWhatsAppBot().catch(e => console.warn('[WHATSAPP BOT] Error conectando sesión previa:', e.message));
}


/**
 * Disparador: Notificación del Cronograma Acordado al Cerrar el Trato
 */
async function notifyScheduleAgreed(schedule, contractPdfUrl) {
  const config = await getOrInitBotConfig();
  if (config.triggers?.autoSendSchedule === false) return;

  const totalStr = 'S/ ' + Number(schedule.totalAmount || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 });
  const installmentsSummary = (schedule.installments || []).map(i => 
    `• Cuota ${i.installmentNumber}: S/ ${Number(i.amount).toLocaleString('es-PE', { minimumFractionDigits: 2 })} — Vence: ${new Date(i.dueDate).toLocaleDateString('es-PE')}`
  ).join('\n');

  const msg = 
`🤝 *DARSIL AUTOMOTIVE SOLUTIONS* 🤝
_Acuerdo Comercial & Cronograma de Pagos_

Estimado/a *${schedule.clientName}*,
Le confirmamos las condiciones y cronograma de pagos pactados para la atención de su unidad *${schedule.plate || 'de flota'}* (Cotización ${schedule.quoteNumber}):

💰 *Total del Servicio:* ${totalStr}
📋 *Modalidad:* ${schedule.paymentType === 'PAGO_UNICO' ? 'Pago Único a plazo acordado' : 'Fraccionado en cuotas cronológicas'}

📅 *Cronograma de Vencimientos:*
${installmentsSummary || '• Pago único al vencimiento pactado'}

💳 *Cuentas Oficiales de Abono:*
• BCP Corriente: 191-9847291-0-28 (CCI: 00219100984729102854)
• BBVA Continental: 0011-0382-0100049281 (CCI: 01138200010004928172)
• Interbank: 200-3001892841 (CCI: 00320000300189284163)

📄 *Adjunto encontrará su Contrato Oficial y Convenio de Pago en PDF.*
${contractPdfUrl ? `🔗 *Descarga directa en línea:* ${contractPdfUrl}\n` : ''}📞 Asesor: ${schedule.advisorName || 'Darios Bacilio'} (${schedule.advisorPhone || '934787006'})`;

  return sendWhatsAppMessage({
    recipientPhone: schedule.clientPhone,
    recipientName: schedule.clientName,
    eventType: 'MENSAJE_MANUAL',
    referenceDoc: schedule.contractNumber,
    messageText: msg,
    mediaUrl: contractPdfUrl,
    fileName: `Contrato_${schedule.contractNumber}_DARSIL.pdf`
  });
}

/**
 * Disparador: Recordatorio Preventivo Amigable
 */
async function notifyFriendlyReminder(schedule, installment) {
  const config = await getOrInitBotConfig();
  if (config.triggers?.autoSendReminder === false) return;

  const dueStr = new Date(installment.dueDate).toLocaleDateString('es-PE');
  const amountStr = 'S/ ' + Number(installment.amount || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 });
  const balanceStr = 'S/ ' + Number(schedule.balance || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 });

  const msg = 
`⏰ *RECORDATORIO AMIGABLE DE PAGO - TALLER DARSIL* ⏰
_Seguimiento Financiero & Atención Técnica_

Estimado/a *${schedule.clientName}*,
Esperamos que se encuentre muy bien. Le recordamos cordialmente que la *Cuota N° ${installment.installmentNumber}* correspondiente a los servicios de su unidad *${schedule.plate || 'de flota'}* tiene fecha de vencimiento programada:

📅 *Fecha de Vencimiento:* ${dueStr}
💰 *Monto de la Cuota:* ${amountStr}
📊 *Saldo Total Pendiente:* ${balanceStr}

💳 *Cuentas Bancarias Autorizadas (DARSIL AUTOMOTIVE SOLUTIONS S.A.C.):*
• BCP Soles: 191-9847291-0-28 (CCI: 00219100984729102854)
• BBVA Soles: 0011-0382-0100049281 (CCI: 01138200010004928172)
• Yape / Plin Comercial: 934787006

Agradecemos remitir su voucher o número de operación respondiendo a este chat para generar su Recibo de Caja Digital de inmediato.
Quedamos a su disposición ante cualquier duda o coordinación técnica.
📞 Asesor: ${schedule.advisorName || 'Darios Bacilio'} (${schedule.advisorPhone || '934787006'})`;

  return sendWhatsAppMessage({
    recipientPhone: schedule.clientPhone,
    recipientName: schedule.clientName,
    eventType: 'MENSAJE_MANUAL',
    referenceDoc: schedule.contractNumber,
    messageText: msg
  });
}

/**
 * Disparador: Recibo de Caja Digital Automático (Al registrar un abono)
 */
async function notifyPaymentReceived(schedule, payment, receiptPdfUrl) {
  const config = await getOrInitBotConfig();
  if (config.triggers?.autoSendReceipt === false) return;

  const paidStr = 'S/ ' + Number(payment.amount || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 });
  const balanceStr = 'S/ ' + Number(schedule.balance || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 });
  const totalPaidStr = 'S/ ' + Number(schedule.paidAmount || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 });

  const msg = 
`✅ *¡ABONO ACREDITADO CON ÉXITO!* ✅
_Recibo de Caja Digital - DARSIL Automotive Solutions_

Estimado/a *${schedule.clientName}*,
Hemos recibido y validado satisfactoriamente su abono para el servicio de la unidad *${schedule.plate || 'vehicular'}*:

🧾 *N° Recibo:* ${payment.receiptNumber}
💰 *Monto Abonado:* ${paidStr}
🏷️ *Operación / Voucher:* ${payment.operationNumber || 'Verificado en Tesorería'}
🏦 *Medio:* ${payment.paymentMethod?.replace('_', ' ') || 'Transferencia'}

📊 *Estado de Cuenta Actual:*
• Total Cancelado a la fecha: ${totalPaidStr}
• *Saldo Restante por Pagar:* *${balanceStr}*

📄 *Adjuntamos su Recibo de Caja Digital Oficial en PDF.*
${receiptPdfUrl ? `🔗 *Descarga directa en línea:* ${receiptPdfUrl}\n` : ''}¡Muchas gracias por su puntualidad y confianza en DARSIL!
📞 Asesor: ${schedule.advisorName || 'Darios Bacilio'} (${schedule.advisorPhone || '934787006'})`;

  return sendWhatsAppMessage({
    recipientPhone: schedule.clientPhone,
    recipientName: schedule.clientName,
    eventType: 'MENSAJE_MANUAL',
    referenceDoc: payment.receiptNumber,
    messageText: msg,
    mediaUrl: receiptPdfUrl,
    fileName: `${payment.receiptNumber}_DARSIL.pdf`
  });
}

/**
 * Disparador: Emisión Automática de Paz y Salvo (Saldo = 0)
 */
async function notifyPazYSalvoIssued(schedule, pazYSalvoPdfUrl) {
  const config = await getOrInitBotConfig();
  if (config.triggers?.autoSendPazYSalvo === false) return;

  const totalStr = 'S/ ' + Number(schedule.totalAmount || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 });

  const msg = 
`🎉 *¡FELICITACIONES! SERVICIO 100% CANCELADO* 🎉
_Constancia Oficial de No Adeudo & Paz y Salvo_

Estimado/a *${schedule.clientName}*,
Le informamos con satisfacción que la obligación financiera vinculada al Contrato *${schedule.contractNumber}* por la unidad *${schedule.plate || 'de flota'}* ha sido *CANCELADA EN SU TOTALIDAD*:

💰 *Monto Total Cancelado:* ${totalStr}
📊 *Saldo Restante:* *S/ 0.00 (SIN DEUDA)*
🛡️ *Garantía Técnica:* 100% VIGENTE Y ACTIVA

📄 *Adjunto encontrará su Certificado Oficial de Paz y Salvo en PDF.*
${pazYSalvoPdfUrl ? `🔗 *Descarga directa en línea:* ${pazYSalvoPdfUrl}\n` : ''}Agradecemos sinceramente su preferencia. ¡Ha sido un gusto atenderle y estamos a su entera disposición!
⚡ *DARSIL AUTOMOTIVE SOLUTIONS S.A.C.* ⚡`;

  return sendWhatsAppMessage({
    recipientPhone: schedule.clientPhone,
    recipientName: schedule.clientName,
    eventType: 'MENSAJE_MANUAL',
    referenceDoc: schedule.contractNumber,
    messageText: msg,
    mediaUrl: pazYSalvoPdfUrl,
    fileName: `PazYSalvo_${schedule.contractNumber}_DARSIL.pdf`
  });
}

/**
 * Disparador: Alerta Interna de Cobranza para el Asesor
 */
async function notifyAdvisorOverdueAlert(schedule, overdueInstallments) {
  const defaultAdvisorPhone = '51934787006';
  const targetPhone = schedule.advisorPhone || defaultAdvisorPhone;

  const overdueList = (overdueInstallments || []).map(i => 
    `- Cuota ${i.installmentNumber}: S/ ${Number(i.amount).toLocaleString('es-PE', { minimumFractionDigits: 2 })} (Venció: ${new Date(i.dueDate).toLocaleDateString('es-PE')})`
  ).join('\n');

  const msg = 
`🚨 *ALERTA DE COBRANZA - CUOTA VENCIDA (DARSIL ERP)* 🚨
Asesor: *${schedule.advisorName || 'Darios Bacilio'}*

Se ha detectado mora en el siguiente acuerdo comercial:
👤 *Cliente:* ${schedule.clientName}
📞 *Teléfono Cliente:* ${schedule.clientPhone}
🚗 *Unidad:* ${schedule.plate} (${schedule.model})
📋 *Contrato:* ${schedule.contractNumber} (Cotización ${schedule.quoteNumber})
💰 *Saldo en Mora:* S/ ${Number(schedule.balance).toLocaleString('es-PE', { minimumFractionDigits: 2 })}

*Cuotas Vencidas:*
${overdueList}

Por favor, comuníquese cordialmente con el cliente o active reprogramación en el Módulo de Cobranzas.`;

  return sendWhatsAppMessage({
    recipientPhone: targetPhone,
    recipientName: schedule.advisorName || 'Asesor Técnico',
    eventType: 'MENSAJE_MANUAL',
    referenceDoc: `ALERTA_${schedule.contractNumber}`,
    messageText: msg
  });
}

/**
 * Disparador: Notificación de Contrato 100% Liquidado (Sin cuentas pendientes)
 */
async function notifyFinalContractPaid(schedule, contractPdfUrl) {
  const config = await getOrInitBotConfig();
  if (config.triggers?.autoSendSchedule === false) return;

  const totalStr = 'S/ ' + Number(schedule.totalAmount || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 });

  const msg = 
`📜 *CONTRATO LIQUIDADO Y CANCELADO EN SU TOTALIDAD* 📜
_DARSIL AUTOMOTIVE SOLUTIONS S.A.C._

Estimado/a *${schedule.clientName}*,
Le confirmamos con agrado que el Contrato Comercial *${schedule.contractNumber}* vinculado a la unidad *${schedule.plate || 'vehicular'}* (Cotización ${schedule.quoteNumber}) se encuentra *100% CANCELADO*:

💰 *Monto Total del Contrato:* ${totalStr}
📊 *Saldo Pendiente:* *S/ 0.00 (SIN CUENTAS PENDIENTES)*
✅ *Estado de Cuotas:* TODAS LAS CUOTAS PAGADAS Y ASENTADAS
🛡️ *Garantía Técnica DARSIL:* ACTIVA Y VIGENTE

📄 *Adjuntamos su Contrato Oficial con el sello de CANCELADO y cronograma liquidado en PDF.*
${contractPdfUrl ? `🔗 *Descarga directa en línea:* ${contractPdfUrl}\n` : ''}Muchas gracias por su puntualidad y confianza en el servicio técnico de DARSIL.
📞 Central DARSIL: ${schedule.advisorName || 'Darios Bacilio'} (${schedule.advisorPhone || '934787006'})`;

  return sendWhatsAppMessage({
    recipientPhone: schedule.clientPhone,
    recipientName: schedule.clientName,
    eventType: 'MENSAJE_MANUAL',
    referenceDoc: `${schedule.contractNumber}_CANCELADO`,
    messageText: msg,
    mediaUrl: contractPdfUrl,
    fileName: `Contrato_${schedule.contractNumber}_CANCELADO_DARSIL.pdf`
  });
}

/**
 * Disparador: Cambio de Fase en Torre de Control Técnico & Trazabilidad
 */
async function notifyWorkshopStageUpdate(workOrder, newStageTitle, notes = '', trackingUrl = '') {
  const vehicleText = [workOrder.plate, workOrder.model].filter(Boolean).join(' • ');
  const targetPhone = workOrder.clientPhone || workOrder.driverPhone;
  if (!targetPhone) return null;

  const msg = 
`🔧 *DARSIL TALLER - SEGUIMIENTO EN VIVO* 🔧
Estimado/a *${workOrder.clientName || 'Cliente'}*,
Le informamos la actualización en tiempo real del estado de su unidad:

🚗 *Vehículo:* ${vehicleText}
📋 *N° Orden de Trabajo:* ${workOrder.orderNumber}
📍 *Fase Actual de Taller:* 🟢 *${newStageTitle.toUpperCase()}*
👨‍🔧 *Técnico Especialista:* ${workOrder.assignedMechanic || 'Darios Bacilio'}
⏱️ *Avance Técnico:* ${workOrder.progressPercent || 20}%
${notes ? `📝 *Observaciones:* ${notes}\n` : ''}${workOrder.estimatedCompletionDate ? `📅 *Entrega Estimada:* ${new Date(workOrder.estimatedCompletionDate).toLocaleDateString('es-PE')} ${new Date(workOrder.estimatedCompletionDate).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}\n` : ''}
${trackingUrl ? `🌐 *Consulte la trazabilidad completa en vivo aquí:*
${trackingUrl}\n` : ''}Central Taller DARSIL (VES): 934787006`;

  return sendWhatsAppMessage({
    recipientPhone: targetPhone,
    recipientName: workOrder.clientName,
    eventType: 'MENSAJE_MANUAL',
    referenceDoc: `${workOrder.orderNumber}_TRAZABILIDAD`,
    messageText: msg
  });
}

module.exports = {
  getOrInitBotConfig,
  generateNewQr,
  disconnectWhatsAppBot,
  sendWhatsAppMessage,
  sendWhatsAppMultipleDocuments,
  notifyQuoteIssued,
  notifyWorkOrderCheckIn,
  notifyWorkOrderWithQuote,
  notifyWorkOrderFinished,
  notifyWorkshopStageUpdate,
  notifyInvoiceIssued,
  notifyScheduleAgreed,
  notifyFriendlyReminder,
  notifyPaymentReceived,
  notifyPazYSalvoIssued,
  notifyFinalContractPaid,
  notifyAdvisorOverdueAlert
};

