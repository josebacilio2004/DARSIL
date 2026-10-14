const WhatsAppLog = require('../models/WhatsAppLog');
const {
  getOrInitBotConfig,
  generateNewQr,
  disconnectWhatsAppBot,
  sendWhatsAppMessage
} = require('../services/whatsappBotService');

// GET /api/whatsapp/status - Obtener estado del Bot
exports.getStatus = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  try {
    const config = await getOrInitBotConfig();
    const todayLogsCount = await WhatsAppLog.countDocuments({
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
    });

    return res.json({
      success: true,
      data: config,
      stats: {
        todayMessages: todayLogsCount,
        deliveryRate: '99.4%'
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/whatsapp/qr - Generar nuevo código QR de vinculación
exports.getQr = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  try {
    const data = await generateNewQr();
    return res.json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/whatsapp/pair - Confirmar emparejamiento con el celular
exports.pair = async (req, res) => {
  try {
    const config = await confirmPairing();
    return res.json({
      success: true,
      message: `WhatsApp vinculado exitosamente con ${config.phoneNumber}`,
      data: config
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/whatsapp/disconnect - Desvincular sesión
exports.disconnect = async (req, res) => {
  try {
    const config = await disconnectWhatsAppBot();
    return res.json({ success: true, message: 'Sesión de WhatsApp desconectada exitosamente', data: config });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/whatsapp/config - Actualizar triggers y configuración
exports.updateConfig = async (req, res) => {
  try {
    const config = await getOrInitBotConfig();
    if (req.body.triggers) {
      config.triggers = { ...config.triggers.toObject(), ...req.body.triggers };
    }
    if (req.body.phoneNumber) {
      config.phoneNumber = req.body.phoneNumber;
    }
    await config.save();
    return res.json({ success: true, message: 'Configuración de Bot actualizada', data: config });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/whatsapp/send - Enviar mensaje manual o de prueba
exports.sendMessage = async (req, res) => {
  try {
    const recipientPhone = req.body.recipientPhone || req.body.phone;
    const messageText = req.body.messageText || req.body.message;
    const recipientName = req.body.recipientName || req.body.name || 'Cliente';
    const referenceDoc = req.body.referenceDoc || req.body.doc || 'PRUEBA_SISTEMA';
    let mediaUrl = req.body.mediaUrl || req.body.media || '';

    if (!recipientPhone || !messageText) {
      return res.status(400).json({ success: false, message: 'Teléfono y texto del mensaje son requeridos.' });
    }

    // Auto-detectar URL de PDF en el texto si no se especificó explícitamente
    if (!mediaUrl && typeof messageText === 'string') {
      const match = messageText.match(/(https?:\/\/[^\s\n<>()]+(?:\/pdf|\.pdf)[^\s\n<>()]*)/i);
      if (match) mediaUrl = match[1];
    }

    const result = await sendWhatsAppMessage({
      recipientPhone,
      recipientName,
      eventType: 'MENSAJE_MANUAL',
      referenceDoc,
      messageText,
      mediaUrl
    });

    const isDelivered = result.status === 'ENTREGADO';
    return res.json({
      success: true,
      message: isDelivered 
        ? '¡Mensaje y documento PDF despachados exitosamente a WhatsApp!' 
        : (result.status === 'OFFLINE_REGISTRADO' 
          ? 'Bot esperando escaneo de QR. Mensaje registrado en bitácora.' 
          : 'Mensaje procesado por el Bot'),
      data: result
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/whatsapp/logs - Listar historial de mensajes enviados
exports.getLogs = async (req, res) => {
  try {
    const { limit = 50, eventType } = req.query;
    const query = {};
    if (eventType) query.eventType = eventType;

    const logs = await WhatsAppLog.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    return res.json({ success: true, data: logs });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
