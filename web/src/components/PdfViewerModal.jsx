import React from 'react';
import { X, Download, ExternalLink, Share2, MapPin, Printer } from 'lucide-react';
import { api } from '../services/api';

export default function PdfViewerModal({ quote, onClose, onRefresh, onOpenMap }) {
  if (!quote) return null;

  const isWorkOrder = Boolean(quote.isWorkOrder || quote.orderNumber);
  const docId = quote._id;
  const pdfUrl = isWorkOrder ? api.getWorkOrderPdfUrl(docId) : api.getPdfUrl(docId);
  const docNumber = isWorkOrder ? (quote.orderNumber || 'ORDEN DE TRABAJO') : (quote.quoteNumber || 'COTIZACIÓN');
  const clientName = quote.clientName || 'Cliente DARSIL';
  const plate = quote.plate && quote.plate !== 'POR ASIGNAR' ? quote.plate : '';
  const vehicleDesc = [plate, quote.model && quote.model !== 'No especificado' ? quote.model : ''].filter(Boolean).join(' • ');

  // Redirección directa a WhatsApp con el teléfono registrado
  const handleWhatsAppRedirect = () => {
    const rawPhone = (quote.clientPhone || quote.driverPhone) ? String(quote.clientPhone || quote.driverPhone).replace(/\D/g, '') : '';
    const phone = rawPhone ? (rawPhone.startsWith('51') ? rawPhone : `51${rawPhone}`) : '';
    const origin = window.location.origin;
    const pdfLink = isWorkOrder ? `${origin}/api/work-orders/${docId}/pdf` : `${origin}/api/quotes/${docId}/pdf`;
    const formattedTotal = Number(quote.total || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 });

    const message = isWorkOrder ? 
`⚡ *DARSIL AUTOMOTIVE SOLUTIONS* ⚡
_Tecnología • Diagnóstico • Ingeniería • Innovación_

Estimado/a *${clientName}*,
Le compartimos el Acta Oficial de Atención Técnica / Check-In de su unidad:

📋 *N° Orden de Trabajo:* ${docNumber}
${vehicleDesc ? `🚗 *Vehículo:* ${vehicleDesc}\n` : ''}📍 *Ubicación:* ${quote.destinationLocation?.address || quote.clientAddress || 'Taller Central DARSIL (VES)'}
📅 *Fecha:* ${new Date(quote.createdAt || Date.now()).toLocaleDateString('es-PE')}
${quote.reportedFault ? `⚠️ *Motivo:* ${quote.reportedFault}\n` : ''}
📄 *Descargue o visualice su Acta Oficial en PDF aquí:*
${pdfLink}

Quedamos a su entera disposición para coordinar los trabajos en taller.
📞 Central DARSIL: 934787006` :
`⚡ *DARSIL AUTOMOTIVE SOLUTIONS* ⚡
_Tecnología • Diagnóstico • Ingeniería • Innovación_

Estimado/a *${clientName}*,
Le compartimos la cotización oficial solicitada:

📋 *N° Cotización:* ${docNumber}
${vehicleDesc ? `🚗 *Vehículo:* ${vehicleDesc}\n` : ''}💰 *Total:* S/ ${formattedTotal}
📅 *Validez:* ${quote.validUntil ? new Date(quote.validUntil).toLocaleDateString('es-PE') : '15 días hábiles'}
💳 *Condición:* ${quote.paymentCondition || '07 días después de realizado el servicio'}

📄 *Descargue su cotización oficial en PDF aquí:*
${pdfLink}

Quedamos a su entera disposición para coordinar la atención técnica.
📞 Asesor: ${quote.advisorName || 'Darios Bacilio'} (${quote.advisorPhone || '934787006'})`;

    const url = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleStatusChange = async (newStatus) => {
    try {
      if (isWorkOrder) {
        await api.updateWorkOrderStatus(docId, newStatus);
      } else {
        await api.updateQuoteStatus(docId, newStatus);
      }
      if (onRefresh) onRefresh();
    } catch (e) {
      alert('Error actualizando estado: ' + e.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4">
      <div className="bg-darsil-card w-full max-w-5xl h-[95vh] sm:h-[92vh] rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-darsil-border text-white">
        
        {/* Header */}
        <div className="bg-darsil-obsidian px-3 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-darsil-border">
          <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
            <span className="font-mono bg-amber-400 text-slate-950 font-black px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg sm:rounded-xl text-xs sm:text-sm shadow-gold-glow shrink-0">
              {docNumber}
            </span>
            <div className="min-w-0">
              <h2 className="font-extrabold text-sm sm:text-lg text-white truncate">{clientName}</h2>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate">
                {isWorkOrder ? (
                  <span>{vehicleDesc ? `${vehicleDesc} • ` : ''}Estado: <b className="text-amber-400">{quote.status || 'REGISTRADO'}</b></span>
                ) : (
                  <span>{vehicleDesc ? `${vehicleDesc} • ` : ''}Total: <b className="text-emerald-400">S/ {Number(quote.total || 0).toFixed(2)}</b></span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-1.5 sm:gap-2 justify-end shrink-0">
            
            {/* Mapa / Viáticos (si aplica a cotización) */}
            {onOpenMap && !isWorkOrder && (
              <button
                type="button"
                onClick={() => onOpenMap(quote)}
                className="flex items-center space-x-1 sm:space-x-1.5 bg-blue-950/60 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-800/60 px-2 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition"
              >
                <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" />
                <span className="hidden sm:inline">Ruta en Mapa</span>
              </button>
            )}

            {/* WhatsApp Directo */}
            <button
              type="button"
              onClick={handleWhatsAppRedirect}
              className="flex items-center space-x-1 sm:space-x-1.5 bg-emerald-950/60 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-800/60 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm"
              title={`Enviar WhatsApp a ${quote.clientPhone || quote.driverPhone || 'cliente'}`}
            >
              <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
              <span className="hidden sm:inline">Enviar WhatsApp</span>
              <span className="sm:hidden">WhatsApp</span>
            </button>

            {/* Descargar */}
            <a
              href={pdfUrl}
              download={`${docNumber}.pdf`}
              className="flex items-center space-x-1 sm:space-x-1.5 bg-slate-800 hover:bg-slate-700 text-white px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-700 transition"
            >
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Descargar</span>
            </a>

            {/* Abrir en pestaña nueva */}
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 sm:p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition"
              title="Abrir en pestaña nueva"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            {/* Cerrar */}
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition ml-0.5"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub-barra de Estado */}
        <div className="bg-darsil-obsidian/80 px-3 sm:px-6 py-2 border-b border-darsil-border flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <span>Estado:</span>
            {isWorkOrder ? (
              <select
                value={quote.status || 'DESPACHADO'}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="bg-darsil-card border border-darsil-border rounded-lg px-2 py-0.5 font-bold text-amber-300 outline-none text-xs"
              >
                <option value="DESPACHADO" className="bg-slate-900 text-white">Despachado</option>
                <option value="EN_DIAGNOSTICO" className="bg-slate-900 text-white">En Diagnóstico</option>
                <option value="COTIZADO" className="bg-slate-900 text-white">Cotizado</option>
                <option value="EN_PROCESO" className="bg-slate-900 text-white">En Proceso / Reparación</option>
                <option value="FINALIZADO" className="bg-slate-900 text-white">Finalizado</option>
                <option value="CANCELADO" className="bg-slate-900 text-white">Cancelado</option>
              </select>
            ) : (
              <select
                value={quote.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="bg-darsil-card border border-darsil-border rounded-lg px-2 py-0.5 font-bold text-amber-300 outline-none text-xs"
              >
                <option value="BORRADOR" className="bg-slate-900 text-white">Borrador</option>
                <option value="ENVIADA" className="bg-slate-900 text-white">Enviada</option>
                <option value="APROBADA" className="bg-slate-900 text-white">Aprobada</option>
                <option value="EN_TALLER" className="bg-slate-900 text-white">En Taller</option>
                <option value="FACTURADA" className="bg-slate-900 text-white">Facturada</option>
                <option value="RECHAZADA" className="bg-slate-900 text-white">Rechazada</option>
              </select>
            )}
          </div>

          <div className="text-[11px] sm:text-xs truncate max-w-full">
            <span className="text-slate-500">Documento:</span> <span className="font-semibold text-slate-300">
              {isWorkOrder ? 'Acta de Orden de Trabajo' : (
                quote.templateType === 'PROYECTO_ESPECIAL' ? 'Proyecto Especial' : 'Taller Detallado Oficial'
              )}
            </span>
          </div>
        </div>

        {/* Iframe del PDF */}
        <div className="flex-1 bg-slate-950 p-2 overflow-hidden">
          <iframe
            src={`${pdfUrl}#toolbar=1`}
            title={`Documento ${docNumber}`}
            className="w-full h-full rounded-2xl border border-darsil-border bg-white"
          />
        </div>

      </div>
    </div>
  );
}
