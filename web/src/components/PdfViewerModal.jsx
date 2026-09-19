import React from 'react';
import { X, Download, ExternalLink, Share2, MapPin, Printer } from 'lucide-react';
import { api } from '../services/api';

export default function PdfViewerModal({ quote, onClose, onRefresh, onOpenMap }) {
  if (!quote) return null;

  const pdfUrl = api.getPdfUrl(quote._id);

  // Redirección directa a WhatsApp con el teléfono registrado
  const handleWhatsAppRedirect = () => {
    const rawPhone = quote.clientPhone ? String(quote.clientPhone).replace(/\D/g, '') : '';
    const phone = rawPhone ? (rawPhone.startsWith('51') ? rawPhone : `51${rawPhone}`) : '';
    const origin = window.location.origin;
    const pdfLink = `${origin}/api/quotes/${quote._id}/pdf`;
    const formattedTotal = Number(quote.total || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 });

    const message = 
`⚡ *DARSIL AUTOMOTIVE SOLUTIONS* ⚡
_Tecnología • Diagnóstico • Ingeniería • Innovación_

Estimado/a *${quote.clientName}*,
Le compartimos la cotización solicitada:

📋 *N° Cotización:* ${quote.quoteNumber}
${quote.plate ? `🚗 *Vehículo:* ${quote.plate} (${quote.model || 'Sin modelo'})\n` : ''}💰 *Total:* S/ ${formattedTotal}
📅 *Validez:* ${quote.validUntil ? new Date(quote.validUntil).toLocaleDateString('es-PE') : '15 días hábiles'}
💳 *Condición:* ${quote.paymentCondition || '07 días después de realizado el servicio'}

📄 *Descargue su cotización oficial en PDF aquí:*
${pdfLink}

Quedamos a su entera disposición para coordinar la atención técnica.
📞 Asesor: ${quote.advisorName || 'Ruben Basil'} (${quote.advisorPhone || '934787006'})`;

    const url = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await api.updateQuoteStatus(quote._id, newStatus);
      if (onRefresh) onRefresh();
    } catch (e) {
      alert('Error actualizando estado: ' + e.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="bg-darsil-card w-full max-w-5xl h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-darsil-border text-white">
        
        {/* Header */}
        <div className="bg-darsil-obsidian px-6 py-4 flex items-center justify-between border-b border-darsil-border">
          <div className="flex items-center space-x-3">
            <span className="font-mono bg-amber-400 text-slate-950 font-black px-2.5 py-1 rounded-xl text-sm shadow-gold-glow">
              {quote.quoteNumber}
            </span>
            <div>
              <h2 className="font-extrabold text-lg text-white">{quote.clientName}</h2>
              <p className="text-xs text-slate-400">
                {quote.plate ? `Placa: ${quote.plate} • ` : ''} Total: S/ {Number(quote.total).toFixed(2)}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            
            {/* Mapa / Viáticos */}
            {onOpenMap && (
              <button
                type="button"
                onClick={() => onOpenMap(quote)}
                className="flex items-center space-x-1.5 bg-blue-950/60 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-800/60 px-3 py-1.5 rounded-xl text-xs font-bold transition"
              >
                <MapPin className="w-4 h-4 text-blue-400" />
                <span className="hidden sm:inline">Ruta en Mapa</span>
              </button>
            )}

            {/* WhatsApp Directo */}
            <button
              type="button"
              onClick={handleWhatsAppRedirect}
              className="flex items-center space-x-1.5 bg-emerald-950/60 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-800/60 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm"
              title={`Enviar WhatsApp a ${quote.clientPhone || 'cliente'}`}
            >
              <Share2 className="w-4 h-4 text-emerald-400" />
              <span>Enviar WhatsApp</span>
            </button>

            {/* Descargar */}
            <a
              href={pdfUrl}
              download={`${quote.quoteNumber}.pdf`}
              className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-700 transition"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Descargar</span>
            </a>

            {/* Abrir en pestaña nueva */}
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition"
              title="Abrir en pestaña nueva"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            {/* Cerrar */}
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub-barra de Estado */}
        <div className="bg-darsil-obsidian/80 px-6 py-2 border-b border-darsil-border flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <span>Estado:</span>
            <select
              value={quote.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="bg-darsil-card border border-darsil-border rounded-lg px-2.5 py-1 font-bold text-amber-300 outline-none"
            >
              <option value="BORRADOR" className="bg-slate-900 text-white">Borrador</option>
              <option value="ENVIADA" className="bg-slate-900 text-white">Enviada</option>
              <option value="APROBADA" className="bg-slate-900 text-white">Aprobada</option>
              <option value="EN_TALLER" className="bg-slate-900 text-white">En Taller</option>
              <option value="FACTURADA" className="bg-slate-900 text-white">Facturada</option>
              <option value="RECHAZADA" className="bg-slate-900 text-white">Rechazada</option>
            </select>
          </div>

          <div>
            Plantilla: <span className="font-semibold text-slate-200">
              {quote.templateType === 'PROYECTO_ESPECIAL' ? 'Proyecto Especial (Plantilla 1)' : 'Taller Detallado (Plantilla 2 Oficial)'}
            </span>
          </div>
        </div>

        {/* Iframe del PDF */}
        <div className="flex-1 bg-slate-950 p-2 overflow-hidden">
          <iframe
            src={`${pdfUrl}#toolbar=1`}
            title={`Cotización ${quote.quoteNumber}`}
            className="w-full h-full rounded-2xl border border-darsil-border bg-white"
          />
        </div>

      </div>
    </div>
  );
}
