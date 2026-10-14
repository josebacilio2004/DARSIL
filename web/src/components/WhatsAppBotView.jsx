import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  QrCode, 
  Smartphone, 
  Send, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  RefreshCw, 
  Power, 
  Settings, 
  MessageSquare, 
  ShieldCheck, 
  ExternalLink, 
  Sparkles, 
  Copy, 
  Check, 
  FileText, 
  Receipt, 
  ClipboardList,
  Flame,
  Radio,
  X
} from 'lucide-react';
import { api } from '../services/api';

export default function WhatsAppBotView() {
  const [botStatus, setBotStatus] = useState({
    status: 'CONECTADO',
    phoneNumber: '51934787006',
    instanceName: 'DARSIL_CRM_GATEWAY_V1',
    qrCode: null,
    triggers: {
      onQuoteCreated: true,
      onWorkOrderCheckIn: true,
      onWorkOrderFinished: true,
      onInvoiceIssued: true
    },
    autoReply: true,
    delaySeconds: 2
  });

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrCodeData, setQrCodeData] = useState('');
  const [pairingPhone, setPairingPhone] = useState('934787006');
  const [isPairing, setIsPairing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Simulador y Prueba de Envío
  const [testRecipient, setTestRecipient] = useState('934787006');
  const [testTemplate, setTestTemplate] = useState('quote');
  const [testMessage, setTestMessage] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const fetchBotData = async () => {
    try {
      setLoading(true);
      const [statusRes, logsRes] = await Promise.all([
        api.getWhatsAppBotStatus(),
        api.getWhatsAppLogs()
      ]);

      if (statusRes?.success && statusRes.data) {
        setBotStatus(statusRes.data);
      }
      if (logsRes?.success && Array.isArray(logsRes.data)) {
        setLogs(logsRes.data);
      }
    } catch (err) {
      console.error('Error fetching WhatsApp bot data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBotData();
  }, []);

  // Actualizar plantilla de prueba al cambiar selector
  useEffect(() => {
    if (testTemplate === 'quote') {
      setTestMessage(`⚡ *DARSIL AUTOMOTIVE SOLUTIONS* ⚡
_Tecnología • Diagnóstico • Ingeniería • Innovación_

Estimado/a *FR & CARS MAQUINARIAS S.A.C.*,
Le compartimos la cotización oficial solicitada:

📋 *N° Cotización:* DA-2026-004
🚗 *Vehículo:* BUS SCANIA K360 (B1T-918)
💰 *Total:* S/ 5,900.00
📅 *Validez:* 15 días hábiles
💳 *Condición:* Crédito 15 días calendario

📄 *Descargue su cotización oficial en PDF aquí:*
https://darsil-backend.onrender.com/api/quotes/sample/pdf

Quedamos a su entera disposición para coordinar la atención técnica.
📞 Asesor: Darios Bacilio (934787006)`);
    } else if (testTemplate === 'workorder') {
      setTestMessage(`🔧 *DARSIL AUTOMOTIVE SOLUTIONS* 🔧
_Check-In Oficial de Taller_

Estimado/a *MINERA AURÍFERA DEL SUR*,
Su unidad ha ingresado satisfactoriamente a nuestro taller:

📋 *OT N°:* OT-2026-001
🚛 *Placa:* V6Y-900 (VOLVO FH 500)
🕒 *Fecha/Hora:* 22/09/2026 09:30 AM
📋 *Acta Digital & Diagnóstico:*
https://darsil-backend.onrender.com/api/work-orders/sample/pdf

Nuestro equipo técnico ya inició el protocolo de diagnóstico oficial.`);
    } else if (testTemplate === 'invoice') {
      setTestMessage(`⚡ *DARSIL AUTOMOTIVE SOLUTIONS S.A.C.* ⚡
_R.U.C. 20608765432 • Comprobante Electrónico SUNAT UBL 2.1_

Estimado/a *CONCRETOS DEL PERÚ S.A.C.*,
Le informamos que su comprobante electrónico ha sido emitido con éxito:

📋 *Comprobante:* FACTURA ELECTRÓNICA F001-00000001
💰 *Total:* S/ 3,450.00
🔐 *Hash SUNAT:* a8f9e1b2c3d4e5f6
✅ *Estado:* ACEPTADO CON CONSTANCIA CDR

📄 *Descargue su factura oficial y CDR aquí:*
https://darsil-backend.onrender.com/api/invoices/sample/pdf`);
    }
  }, [testTemplate]);

  // Auto-detectar vinculación mientras el modal QR está abierto
  useEffect(() => {
    let interval = null;
    if (showQrModal) {
      interval = setInterval(async () => {
        try {
          const res = await api.getWhatsAppBotStatus();
          if (res?.success && res.data?.status === 'CONECTADO') {
            setBotStatus(res.data);
            setShowQrModal(false);
          } else if (res?.success && res.data?.sessionQr && res.data.sessionQr !== qrCodeData) {
            setQrCodeData(res.data.sessionQr);
          }
        } catch (e) {}
      }, 1500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showQrModal, qrCodeData]);

  // Manejar apertura de QR
  const handleOpenQrModal = async () => {
    setShowQrModal(true);
    setQrCodeData('');
    setIsPairing(true);
    try {
      const res = await api.getWhatsAppQr();
      if (res?.success && res.data?.qrCode) {
        setQrCodeData(res.data.qrCode);
      }
    } catch (err) {
      console.error('Error fetching QR:', err);
    } finally {
      setIsPairing(false);
    }
  };

  // Manejar desconexión
  const handleDisconnect = async () => {
    if (!window.confirm('¿Desea desconectar la sesión actual de WhatsApp? El bot no podrá enviar mensajes automáticos hasta que vuelva a escanear el QR.')) return;
    try {
      const res = await api.disconnectWhatsAppBot();
      if (res?.success) {
        setBotStatus(prev => ({ ...prev, status: 'DESCONECTADO' }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Manejar cambio de disparadores (Triggers)
  const handleToggleTrigger = async (triggerName) => {
    const updatedTriggers = {
      ...botStatus.triggers,
      [triggerName]: !botStatus.triggers[triggerName]
    };
    setBotStatus(prev => ({ ...prev, triggers: updatedTriggers }));

    try {
      await api.updateWhatsAppConfig({ triggers: updatedTriggers });
    } catch (err) {
      console.error('Error updating triggers:', err);
    }
  };

  // Enviar mensaje de prueba
  const handleSendTest = async () => {
    if (!testRecipient.trim() || !testMessage.trim()) {
      setTestResult({ success: false, message: 'Por favor ingrese el número telefónico y el mensaje de prueba.' });
      return;
    }
    try {
      setSendingTest(true);
      setTestResult(null);
      const res = await api.sendWhatsAppTestMessage(testRecipient, testMessage);
      if (res?.success) {
        setTestResult({ 
          success: true, 
          message: res.message || '¡Mensaje y documento PDF despachados con éxito por el Bot!' 
        });
        fetchBotData();
      } else {
        setTestResult({ success: false, message: res?.message || 'Error al enviar mensaje' });
      }
    } catch (err) {
      setTestResult({ success: false, message: err.message });
    } finally {
      setSendingTest(false);
    }
  };

  const isConnected = botStatus.status === 'CONECTADO';

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* Encabezado y Estado de Sesión en Vivo */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-darsil-card via-slate-900 to-darsil-card p-4 sm:p-6 rounded-2xl border border-darsil-border shadow-xl">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
              {isConnected ? 'GATEWAY WHATSAPP ACTIVO' : 'ESPERANDO VINCULACIÓN'}
            </span>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
              API CRM v2.6
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <Bot className="w-7 h-7 text-emerald-400 shrink-0" />
            Bot Automatizador CRM & WhatsApp
          </h1>
          <p className="text-xs text-slate-400 max-w-2xl">
            Notificaciones automáticas en tiempo real al cliente por WhatsApp: Envío de Cotizaciones con PDF, Actas de Ingreso a Taller, Estado de Reparación y Facturas Electrónicas SUNAT.
          </p>
        </div>

        {/* Acciones de Conexión */}
        <div className="flex flex-wrap items-center gap-2">
          {isConnected ? (
            <button
              onClick={handleDisconnect}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-950 border border-red-500/30 text-red-400 hover:bg-red-500/10 transition"
            >
              <Power className="w-3.5 h-3.5" />
              <span>Desconectar Bot</span>
            </button>
          ) : (
            <button
              onClick={handleOpenQrModal}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:brightness-110 active:scale-95 transition"
            >
              <QrCode className="w-4 h-4 stroke-[2.5]" />
              <span>Vincular por Código QR</span>
            </button>
          )}

          <button
            onClick={fetchBotData}
            className="p-2.5 rounded-xl bg-slate-950 border border-darsil-border text-slate-400 hover:text-white transition"
            title="Refrescar estado"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tarjetas de Información de Conexión & Disparadores */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Card 1: Dispositivo Vinculado */}
        <div className="bg-darsil-card border border-darsil-border p-5 rounded-2xl space-y-4 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">
              Dispositivo Vinculado
            </span>
            <Smartphone className="w-5 h-5 text-emerald-400" />
          </div>

          <div className="flex items-center space-x-3 bg-slate-950 p-3.5 rounded-xl border border-darsil-border">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0">
              WA
            </div>
            <div className="overflow-hidden">
              <span className="text-sm font-black text-white font-mono block truncate">
                +51 934 787 006
              </span>
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400 inline" />
                <span>Ruben Bacilio • DARSIL Master</span>
              </span>
            </div>
          </div>

          <div className="space-y-2 text-xs text-slate-400 font-mono">
            <div className="flex justify-between py-1 border-b border-darsil-border/60">
              <span>Instancia:</span>
              <span className="text-white font-bold">{botStatus.instanceName || 'DARSIL_CRM_GATEWAY_V1'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-darsil-border/60">
              <span>Canal Oficial:</span>
              <span className="text-emerald-400 font-bold">WhatsApp Multi-Device</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Velocidad de Respuesta:</span>
              <span className="text-amber-400 font-bold">~ 2.0 seg (Simulación Humana)</span>
            </div>
          </div>

          {!isConnected && (
            <button
              onClick={handleOpenQrModal}
              className="w-full py-2 px-3 rounded-xl bg-amber-400 text-slate-950 font-black text-xs hover:brightness-110 flex items-center justify-center gap-1.5 shadow-gold-glow"
            >
              <QrCode className="w-4 h-4" />
              <span>Escanear Código QR Ahora</span>
            </button>
          )}
        </div>

        {/* Card 2: Disparadores Automáticos (Triggers CRM) */}
        <div className="lg:col-span-2 bg-darsil-card border border-darsil-border p-5 rounded-2xl space-y-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-black text-slate-400 uppercase tracking-wider block">
                Disparadores Automáticos (Triggers CRM)
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Configure los eventos del taller que notificarán instantáneamente al cliente por WhatsApp.
              </p>
            </div>
            <Settings className="w-5 h-5 text-amber-400" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Trigger 1: Cotización Creada */}
            <div 
              onClick={() => handleToggleTrigger('onQuoteCreated')}
              className={`p-3 rounded-xl border cursor-pointer transition select-none flex items-start justify-between ${
                botStatus.triggers?.onQuoteCreated 
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-white' 
                  : 'bg-slate-950 border-darsil-border text-slate-400 opacity-60'
              }`}
            >
              <div className="space-y-1 pr-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold">Cotización Oficial Creada</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  Envía enlace directo al PDF, total de la cotización y validez en días.
                </p>
              </div>
              <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border ${
                botStatus.triggers?.onQuoteCreated ? 'bg-emerald-500 border-emerald-400 text-slate-950' : 'border-slate-600'
              }`}>
                {botStatus.triggers?.onQuoteCreated && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </div>

            {/* Trigger 2: Check-In Taller */}
            <div 
              onClick={() => handleToggleTrigger('onWorkOrderCheckIn')}
              className={`p-3 rounded-xl border cursor-pointer transition select-none flex items-start justify-between ${
                botStatus.triggers?.onWorkOrderCheckIn 
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-white' 
                  : 'bg-slate-950 border-darsil-border text-slate-400 opacity-60'
              }`}
            >
              <div className="space-y-1 pr-2">
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-bold">Ingreso a Taller (Check-In)</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  Avisa al cliente que su camión/mixer ingresó y remite el acta con inventario.
                </p>
              </div>
              <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border ${
                botStatus.triggers?.onWorkOrderCheckIn ? 'bg-emerald-500 border-emerald-400 text-slate-950' : 'border-slate-600'
              }`}>
                {botStatus.triggers?.onWorkOrderCheckIn && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </div>

            {/* Trigger 3: Trabajo Concluido */}
            <div 
              onClick={() => handleToggleTrigger('onWorkOrderFinished')}
              className={`p-3 rounded-xl border cursor-pointer transition select-none flex items-start justify-between ${
                botStatus.triggers?.onWorkOrderFinished 
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-white' 
                  : 'bg-slate-950 border-darsil-border text-slate-400 opacity-60'
              }`}
            >
              <div className="space-y-1 pr-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold">Servicio Concluido (Listo)</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  Notifica que las pruebas técnicas finalizaron y el vehículo está listo para retiro.
                </p>
              </div>
              <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border ${
                botStatus.triggers?.onWorkOrderFinished ? 'bg-emerald-500 border-emerald-400 text-slate-950' : 'border-slate-600'
              }`}>
                {botStatus.triggers?.onWorkOrderFinished && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </div>

            {/* Trigger 4: Factura Electrónica SUNAT */}
            <div 
              onClick={() => handleToggleTrigger('onInvoiceIssued')}
              className={`p-3 rounded-xl border cursor-pointer transition select-none flex items-start justify-between ${
                botStatus.triggers?.onInvoiceIssued 
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-white' 
                  : 'bg-slate-950 border-darsil-border text-slate-400 opacity-60'
              }`}
            >
              <div className="space-y-1 pr-2">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-yellow-400" />
                  <span className="text-xs font-bold">Facturación SUNAT UBL 2.1</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  Envía el comprobante tributario con código QR, Hash SHA-256 y CDR aceptado.
                </p>
              </div>
              <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border ${
                botStatus.triggers?.onInvoiceIssued ? 'bg-emerald-500 border-emerald-400 text-slate-950' : 'border-slate-600'
              }`}>
                {botStatus.triggers?.onInvoiceIssued && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Simulador y Envíos de Prueba */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Panel de Configuración del Envío de Prueba */}
        <div className="lg:col-span-7 bg-darsil-card border border-darsil-border p-5 rounded-2xl space-y-4 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">
              Simulador & Probador de Mensajes
            </span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">
                Número WhatsApp de Prueba:
              </label>
              <input
                type="text"
                value={testRecipient}
                onChange={(e) => setTestRecipient(e.target.value)}
                placeholder="Ej. 934787006 o 51934787006"
                className="w-full bg-slate-950 border border-darsil-border rounded-xl px-3 py-2 text-xs text-white font-mono outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">
                Plantilla Automática:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setTestTemplate('quote')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition ${
                    testTemplate === 'quote' 
                      ? 'bg-amber-400 text-slate-950 border-amber-400' 
                      : 'bg-slate-950 text-slate-300 border-darsil-border'
                  }`}
                >
                  Cotización
                </button>
                <button
                  type="button"
                  onClick={() => setTestTemplate('workorder')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition ${
                    testTemplate === 'workorder' 
                      ? 'bg-blue-500 text-white border-blue-500' 
                      : 'bg-slate-950 text-slate-300 border-darsil-border'
                  }`}
                >
                  Check-In OT
                </button>
                <button
                  type="button"
                  onClick={() => setTestTemplate('invoice')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition ${
                    testTemplate === 'invoice' 
                      ? 'bg-yellow-400 text-slate-950 border-yellow-400' 
                      : 'bg-slate-950 text-slate-300 border-darsil-border'
                  }`}
                >
                  Factura SUNAT
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-[11px] font-medium">
              <FileText className="w-3.5 h-3.5 shrink-0" />
              <span>Adjunto Automático: El PDF oficial se enviará como documento descargable en WhatsApp junto con este texto.</span>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">
                Cuerpo del Mensaje (formato oficial de WhatsApp):
              </label>
              <textarea
                rows="7"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                className="w-full bg-slate-950 border border-darsil-border rounded-xl p-3 text-xs text-white font-mono outline-none focus:border-amber-400 resize-none leading-relaxed"
              ></textarea>
            </div>

            {testResult && (
              <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                testResult.success 
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' 
                  : 'bg-red-500/10 border border-red-500/30 text-red-400'
              }`}>
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{testResult.message}</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={handleSendTest}
                disabled={sendingTest}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:brightness-110 active:scale-95 transition disabled:opacity-50"
              >
                {sendingTest ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Enviando mensaje a WhatsApp...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 stroke-[2.5]" />
                    <span>Disparar Mensaje de Prueba</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Visualizador Tipo Smartphone (WhatsApp Chat UI Preview) */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="w-full max-w-sm bg-slate-950 border-4 border-slate-800 rounded-[32px] p-3 shadow-2xl relative overflow-hidden">
            
            {/* Header WhatsApp */}
            <div className="bg-[#1f2c34] -mx-3 -mt-3 p-3 text-white flex items-center space-x-2.5 border-b border-slate-800">
              <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center font-black text-slate-950 text-xs">
                DS
              </div>
              <div className="flex-1 overflow-hidden">
                <span className="text-xs font-bold block truncate">DARSIL Automotive Bot</span>
                <span className="text-[9px] text-emerald-400 block font-mono">En línea • Bot Oficial</span>
              </div>
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            </div>

            {/* Chat Messages Body */}
            <div className="py-4 space-y-3 min-h-[320px] max-h-[420px] overflow-y-auto pr-1">
              <div className="text-center">
                <span className="bg-[#182229] text-slate-400 text-[9px] px-2 py-0.5 rounded-md font-mono">
                  HOY
                </span>
              </div>

              {/* Burbuja WhatsApp Saliente */}
              <div className="bg-[#005c4b] text-white p-3 rounded-2xl rounded-tr-none text-[11px] shadow space-y-2 ml-4">
                <div className="whitespace-pre-wrap font-sans leading-relaxed text-slate-100">
                  {testMessage}
                </div>
                <div className="flex items-center justify-end space-x-1 text-[9px] text-slate-300 font-mono pt-1">
                  <span>10:45 AM</span>
                  <span className="text-blue-300 font-bold">✓✓</span>
                </div>
              </div>
            </div>

            {/* Input Fake WhatsApp */}
            <div className="bg-[#1f2c34] -mx-3 -mb-3 p-2 text-slate-400 flex items-center space-x-2 border-t border-slate-800 text-xs">
              <div className="flex-1 bg-[#2a3942] rounded-full px-3 py-1.5 text-[10px] text-slate-400 font-sans">
                Escribe un mensaje...
              </div>
              <div className="w-7 h-7 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center">
                <Send className="w-3.5 h-3.5" />
              </div>
            </div>

          </div>
          <span className="text-[10px] text-slate-500 mt-2 font-mono">
            Vista previa exacta renderizada en WhatsApp Web / Mobile
          </span>
        </div>

      </div>

      {/* Registro de Auditoría de Mensajes Enviados */}
      <div className="bg-darsil-card border border-darsil-border rounded-2xl p-4 sm:p-5 space-y-3 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider block">
              Registro de Auditoría & Trazabilidad (Logs WhatsApp)
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Historial de mensajes emitidos automáticamente con confirmación de entrega y enlaces PDF.
            </p>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            {logs.length} Mensajes Registrados
          </span>
        </div>

        {logs.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No se han registrado envíos recientes en la bitácora.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 border-b border-darsil-border text-slate-400 uppercase tracking-wider font-mono text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Fecha & Hora</th>
                  <th className="py-2.5 px-3">Destinatario</th>
                  <th className="py-2.5 px-3">Disparador</th>
                  <th className="py-2.5 px-3">Mensaje</th>
                  <th className="py-2.5 px-3 text-center">Estado</th>
                  <th className="py-2.5 px-3 text-center">Enlace PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-darsil-border/60">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-800/30 transition">
                    <td className="py-2.5 px-3 font-mono text-slate-400 whitespace-nowrap">
                      {log.createdAt ? new Date(log.createdAt).toLocaleString('es-PE') : 'Reciente'}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-white">
                      +{log.recipient}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-400/10 text-amber-400 border border-amber-400/20">
                        {log.triggerEvent || 'MANUAL'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 max-w-xs truncate">
                      {log.message}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{log.status || 'ENTREGADO'}</span>
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {log.mediaUrl ? (
                        <a 
                          href={log.mediaUrl}
                          target="_blank" 
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-amber-400 hover:underline font-bold"
                        >
                          <FileText className="w-3 h-3" />
                          <span>Ver PDF</span>
                        </a>
                      ) : (
                        <span className="text-slate-600 font-mono">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: Vincular WhatsApp por Código QR */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-darsil-card border border-darsil-border rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 text-center">
            <div className="flex justify-between items-center border-b border-darsil-border pb-3">
              <div className="text-left">
                <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase">
                  VINCULACIÓN DIRECTA
                </span>
                <h3 className="text-base font-black text-white">
                  Escanear Código QR con WhatsApp
                </h3>
              </div>
              <button
                onClick={() => setShowQrModal(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 text-left">
              Abra WhatsApp en su teléfono móvil &gt; Menú o Ajustes &gt; <strong>Dispositivos vinculados</strong> &gt; <strong>Vincular un dispositivo</strong> y apunte la cámara a esta pantalla:
            </p>

            {/* QR Render */}
            <div className="p-4 bg-white rounded-2xl inline-block shadow-lg mx-auto">
              {qrCodeData ? (
                <img src={qrCodeData} alt="WhatsApp QR Code" className="w-52 h-52 mx-auto object-contain animate-in fade-in zoom-in-95 duration-200" />
              ) : (
                <div className="w-52 h-52 flex flex-col items-center justify-center text-slate-900 gap-3 p-4 text-center">
                  <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
                  <span className="text-xs font-black text-slate-800 tracking-tight">Generando Código QR Oficial...</span>
                  <span className="text-[10px] text-slate-500 font-medium leading-tight">Estableciendo enlace criptográfico con WhatsApp</span>
                </div>
              )}
            </div>

            <div className="space-y-1 bg-slate-950 p-3 rounded-xl border border-darsil-border text-xs text-left">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">
                Dispositivo a Vincular:
              </span>
              <div className="flex items-center justify-between">
                <span className="font-mono text-white font-black text-sm">
                  {botStatus.phoneNumber || '+51 906623068'}
                </span>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {botStatus.status === 'CONECTADO' ? 'CONECTADO' : 'ESPERANDO ESCANEO'}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setShowQrModal(false);
                  setBotStatus(prev => ({ ...prev, status: 'CONECTADO', phoneNumber: '51934787006' }));
                }}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:brightness-110 transition"
              >
                Confirmar Vinculación Exitosa
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
