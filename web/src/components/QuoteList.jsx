import React, { useState } from 'react';
import { Search, Eye, Edit3, MapPin, Share2, Trash2, Car, Calendar, DollarSign, Filter, Building2, PlusCircle } from 'lucide-react';
import { api, getApiUrl } from '../services/api';

const STATUS_CONFIG = {
  'BORRADOR': { label: 'Borrador', bg: 'bg-slate-800 text-slate-300 border-slate-700' },
  'ENVIADA': { label: 'Enviada', bg: 'bg-blue-950/60 text-blue-300 border-blue-800/50' },
  'APROBADA': { label: 'Aprobada', bg: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/50' },
  'EN_TALLER': { label: 'En Taller', bg: 'bg-amber-950/60 text-amber-300 border-amber-800/50' },
  'FACTURADA': { label: 'Facturada', bg: 'bg-purple-950/60 text-purple-300 border-purple-800/50' },
  'RECHAZADA': { label: 'Rechazada', bg: 'bg-rose-950/60 text-rose-300 border-rose-800/50' }
};

export default function QuoteList({ quotes, onSelectQuote, onEditQuote, onOpenMap, onRefresh, onOpenNewQuote }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  const filteredQuotes = quotes.filter(q => {
    const matchesSearch = 
      (q.quoteNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.clientName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.plate || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.vin || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.clientAddress || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'ALL' || q.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = async (e, quoteId) => {
    e.stopPropagation();
    const newStatus = e.target.value;
    try {
      await api.updateQuoteStatus(quoteId, newStatus);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert('Error cambiando estado: ' + err.message);
    }
  };

  const handleDelete = async (e, quote) => {
    e.stopPropagation();
    if (!window.confirm(`¿Estás seguro de eliminar la cotización ${quote.quoteNumber}?`)) return;
    try {
      await api.deleteQuote(quote._id);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert('Error al eliminar: ' + err.message);
    }
  };

  // Función para abrir WhatsApp automáticamente redirigiendo al número registrado
  const handleShareWhatsApp = (e, quote) => {
    e.stopPropagation();
    const rawPhone = quote.clientPhone ? String(quote.clientPhone).replace(/\D/g, '') : '';
    const phone = rawPhone ? (rawPhone.startsWith('51') ? rawPhone : `51${rawPhone}`) : '';

    const pdfLink = `${getApiUrl()}/quotes/${quote._id}/pdf`;
    const formattedTotal = Number(quote.total || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 });

    const message = 
`⚡ *DARSIL AUTOMOTIVE SOLUTIONS* ⚡
_Tecnología • Diagnóstico • Ingeniería • Innovación_

Estimado/a *${quote.clientName}*,
Le hacemos llegar la cotización solicitada:

📋 *N° Cotización:* ${quote.quoteNumber}
${quote.plate ? `🚗 *Vehículo:* ${quote.plate} (${quote.model || 'Sin modelo'})\n` : ''}💰 *Total:* S/ ${formattedTotal}
📅 *Validez:* ${quote.validUntil ? new Date(quote.validUntil).toLocaleDateString('es-PE') : '15 días hábiles'}
💳 *Condición:* ${quote.paymentCondition || '07 días después de realizado el servicio'}

📄 *Descargue su cotización oficial en PDF aquí:*
${pdfLink}

Quedamos a su entera disposición para coordinar la atención técnica.
📞 Asesor: ${quote.advisorName || 'Darios Bacilio'} (${quote.advisorPhone || '934787006'})`;

    const url = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-4">
      
      {/* Barra de Filtros, Búsqueda y Botón Nueva Cotización */}
      <div className="bg-darsil-card p-3 sm:p-4 rounded-2xl shadow-card-dark border border-darsil-border space-y-3">
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Input de Búsqueda */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5 sm:top-3" />
            <input
              type="text"
              placeholder="Buscar por placa, N° cotización, cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs bg-darsil-obsidian border border-darsil-border rounded-xl text-slate-100 placeholder-slate-500 focus:border-amber-400 outline-none"
            />
          </div>

          {/* Botón Superior Derecho: Nueva Cotización */}
          {onOpenNewQuote && (
            <button
              onClick={onOpenNewQuote}
              className="w-full sm:w-auto flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-gold-glow hover:brightness-110 active:scale-95 transition shrink-0"
              title="Crear Nueva Cotización Oficial"
            >
              <PlusCircle className="w-4 h-4 text-slate-950" />
              <span>+ Nueva Cotización</span>
            </button>
          )}
        </div>

        {/* Filtros por Estado con scroll táctil suave */}
        <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar pb-0.5 text-xs">
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`px-3 py-1.5 rounded-lg font-bold transition shrink-0 ${
              filterStatus === 'ALL' 
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-gold-glow' 
                : 'bg-darsil-obsidian text-slate-400 hover:text-white border border-darsil-border'
            }`}
          >
            Todas ({quotes.length})
          </button>
          {['APROBADA', 'EN_TALLER', 'ENVIADA', 'BORRADOR'].map(st => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition border shrink-0 ${
                filterStatus === st 
                  ? 'bg-amber-500/20 text-amber-300 border-amber-400' 
                  : 'bg-darsil-obsidian text-slate-400 border-darsil-border hover:text-white'
              }`}
            >
              {STATUS_CONFIG[st]?.label || st}
            </button>
          ))}
        </div>

      </div>

      {/* Vista Móvil (Tarjetas Táctiles para iPhone 15 Pro y pantallas pequeñas) */}
      <div className="md:hidden space-y-3">
        {filteredQuotes.length === 0 ? (
          <div className="p-8 text-center text-slate-500 bg-darsil-card border border-darsil-border rounded-2xl text-xs">
            No se encontraron cotizaciones con los criterios seleccionados.
          </div>
        ) : (
          filteredQuotes.map((q) => {
            const statusInfo = STATUS_CONFIG[q.status] || STATUS_CONFIG['BORRADOR'];
            const dateStr = q.issueDate ? new Date(q.issueDate).toLocaleDateString('es-PE') : '-';

            return (
              <div
                key={q._id}
                className="bg-darsil-card border border-darsil-border hover:border-amber-500/40 rounded-2xl p-3.5 space-y-3 shadow-card-dark transition"
              >
                {/* Cabecera de la Tarjeta Móvil */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono bg-slate-900 border border-slate-800 text-amber-400 font-black px-2.5 py-1 rounded-lg text-xs shadow-inner">
                      {q.quoteNumber}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">{dateStr}</span>
                  </div>
                  <select
                    value={q.status}
                    onChange={(e) => handleStatusChange(e, q._id)}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border outline-none cursor-pointer ${statusInfo.bg}`}
                  >
                    <option value="BORRADOR" className="bg-slate-900 text-white">Borrador</option>
                    <option value="ENVIADA" className="bg-slate-900 text-white">Enviada</option>
                    <option value="APROBADA" className="bg-slate-900 text-white">Aprobada</option>
                    <option value="EN_TALLER" className="bg-slate-900 text-white">En Taller</option>
                    <option value="FACTURADA" className="bg-slate-900 text-white">Facturada</option>
                    <option value="RECHAZADA" className="bg-slate-900 text-white">Rechazada</option>
                  </select>
                </div>

                {/* Cliente & Vehículo */}
                <div className="space-y-1">
                  <div className="font-bold text-white text-sm line-clamp-1">{q.clientName}</div>
                  <div className="text-[11px] text-slate-400 flex items-center space-x-1">
                    {q.clientDoc && <span className="font-mono text-slate-300 font-semibold">{q.clientDoc} • </span>}
                    <span className="truncate">{q.clientAddress || 'Taller DARSIL (VES)'}</span>
                  </div>
                  {q.plate && (
                    <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs font-mono font-bold text-amber-300">
                      <Car className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>{q.plate}</span>
                      <span className="text-slate-400 font-sans font-normal text-[11px] truncate">({q.model || 'Sin modelo'})</span>
                    </div>
                  )}
                </div>

                {/* Total Presupuestado */}
                <div className="pt-2 border-t border-darsil-border flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Presupuestado</span>
                  <span className="text-base font-black text-amber-400 font-mono">
                    S/ {Number(q.total || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Botonera Táctil CRUD Móvil */}
                <div className="grid grid-cols-4 gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => onSelectQuote(q)}
                    className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition active:scale-95"
                    title="Ver PDF Oficial"
                  >
                    <Eye className="w-4 h-4 text-amber-400" />
                    <span className="text-[9px] font-bold mt-1">PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onEditQuote(q)}
                    className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 transition active:scale-95"
                    title="Editar Cotización"
                  >
                    <Edit3 className="w-4 h-4 text-amber-400" />
                    <span className="text-[9px] font-bold mt-1">Editar</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleShareWhatsApp(e, q)}
                    className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 text-emerald-400 border border-emerald-500/40 transition active:scale-95"
                    title="Compartir por WhatsApp"
                  >
                    <Share2 className="w-4 h-4" />
                    <span className="text-[9px] font-bold mt-1">WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, q)}
                    className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-rose-950/50 hover:bg-rose-900/70 text-rose-400 border border-rose-500/40 transition active:scale-95"
                    title="Eliminar Cotización"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="text-[9px] font-bold mt-1">Eliminar</span>
                  </button>
                </div>

                {onOpenMap && (
                  <button
                    type="button"
                    onClick={() => onOpenMap(q)}
                    className="w-full flex items-center justify-center space-x-1.5 py-1.5 rounded-xl bg-blue-950/40 hover:bg-blue-900/60 text-blue-300 border border-blue-500/30 text-[11px] font-semibold transition active:scale-95"
                    title="Ver Ruta y Viáticos en Mapa"
                  >
                    <MapPin className="w-3 h-3 text-blue-400" />
                    <span>Ruta & Viáticos Mapbox</span>
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Tabla Corporativa de Cotizaciones (Solo Pantallas Medianas y Grandes) */}
      <div className="hidden md:block bg-darsil-card rounded-2xl border border-darsil-border shadow-card-dark overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300 min-w-[720px]">
            <thead className="bg-darsil-obsidian border-b border-darsil-border text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3.5 w-32">Nº Cotización</th>
                <th className="p-3.5">Cliente / Empresa</th>
                <th className="p-3.5">Vehículo / Unidad</th>
                <th className="p-3.5 w-28">Fecha</th>
                <th className="p-3.5 w-28 text-right">Total (S/)</th>
                <th className="p-3.5 w-32 text-center">Estado</th>
                <th className="p-3.5 w-52 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-darsil-border font-medium">
              {filteredQuotes.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-10 text-center text-slate-500">
                    No se encontraron cotizaciones con los criterios seleccionados.
                  </td>
                </tr>
              ) : (
                filteredQuotes.map((q) => {
                  const statusInfo = STATUS_CONFIG[q.status] || STATUS_CONFIG['BORRADOR'];
                  const dateStr = q.issueDate ? new Date(q.issueDate).toLocaleDateString('es-PE') : '-';

                  return (
                    <tr key={q._id} className="hover:bg-darsil-cardHover/60 transition">
                      
                      {/* N° Cotización */}
                      <td className="p-3.5 font-mono">
                        <span className="bg-slate-900 border border-slate-800 text-amber-400 font-black px-2 py-1 rounded-lg text-xs shadow-inner">
                          {q.quoteNumber}
                        </span>
                      </td>

                      {/* Cliente */}
                      <td className="p-3.5">
                        <div className="font-bold text-white text-sm line-clamp-1">{q.clientName}</div>
                        <div className="text-[11px] text-slate-400 flex items-center space-x-1 mt-0.5">
                          {q.clientDoc && <span className="font-mono text-slate-500">RUC: {q.clientDoc} • </span>}
                          <span className="line-clamp-1 text-slate-400">📍 {q.clientAddress || 'Sin dirección'}</span>
                        </div>
                      </td>

                      {/* Vehículo */}
                      <td className="p-3.5">
                        {q.plate ? (
                          <div>
                            <div className="flex items-center space-x-1.5 font-bold font-mono text-amber-300 text-xs">
                              <Car className="w-3.5 h-3.5 text-amber-400" />
                              <span>{q.plate}</span>
                            </div>
                            <div className="text-[11px] text-slate-400">{q.model || q.vin || 'Mixer / Flota'}</div>
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-400 font-medium">
                            📁 {q.templateType === 'PROYECTO_ESPECIAL' ? 'Proyecto Especial' : 'Servicio Taller'}
                          </div>
                        )}
                      </td>

                      {/* Fecha */}
                      <td className="p-3.5 font-mono text-slate-400 text-xs">
                        {dateStr}
                      </td>

                      {/* Total */}
                      <td className="p-3.5 text-right font-mono font-black text-sm text-darsil-gold">
                        S/ {Number(q.total || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Estado */}
                      <td className="p-3.5 text-center">
                        <select
                          value={q.status}
                          onChange={(e) => handleStatusChange(e, q._id)}
                          className={`text-[11px] font-bold px-2 py-1 rounded-lg border outline-none cursor-pointer ${statusInfo.bg}`}
                        >
                          <option value="BORRADOR" className="bg-slate-900 text-white">Borrador</option>
                          <option value="ENVIADA" className="bg-slate-900 text-white">Enviada</option>
                          <option value="APROBADA" className="bg-slate-900 text-white">Aprobada</option>
                          <option value="EN_TALLER" className="bg-slate-900 text-white">En Taller</option>
                          <option value="FACTURADA" className="bg-slate-900 text-white">Facturada</option>
                          <option value="RECHAZADA" className="bg-slate-900 text-white">Rechazada</option>
                        </select>
                      </td>

                      {/* Botones de Acciones */}
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          
                          {/* Ver PDF */}
                          <button
                            onClick={() => onSelectQuote(q)}
                            className="p-1.5 rounded-lg bg-darsil-obsidian hover:bg-slate-800 text-slate-300 hover:text-white border border-darsil-border transition"
                            title="Ver PDF Oficial"
                          >
                            <Eye className="w-4 h-4 text-darsil-silver" />
                          </button>

                          {/* Editar */}
                          <button
                            onClick={() => onEditQuote(q)}
                            className="p-1.5 rounded-lg bg-darsil-obsidian hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-darsil-border transition"
                            title="Editar Cotización"
                          >
                            <Edit3 className="w-4 h-4 text-amber-400" />
                          </button>

                          {/* Ver Mapa & Viáticos */}
                          <button
                            onClick={() => onOpenMap(q)}
                            className="p-1.5 rounded-lg bg-darsil-obsidian hover:bg-blue-500/20 text-slate-300 hover:text-blue-300 border border-darsil-border transition"
                            title="Ver Ruta en Mapa y Calcular Viáticos"
                          >
                            <MapPin className="w-4 h-4 text-blue-400" />
                          </button>

                          {/* Enviar WhatsApp (Redirección automática) */}
                          <button
                            onClick={(e) => handleShareWhatsApp(e, q)}
                            className="p-1.5 rounded-lg bg-emerald-950/50 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-800/60 transition"
                            title={`Enviar por WhatsApp a ${q.clientPhone || 'cliente'}`}
                          >
                            <Share2 className="w-4 h-4" />
                          </button>

                          {/* Eliminar */}
                          <button
                            onClick={(e) => handleDelete(e, q)}
                            className="p-1.5 rounded-lg bg-darsil-obsidian hover:bg-rose-950/50 text-slate-400 hover:text-rose-400 border border-darsil-border transition"
                            title="Eliminar Cotización"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
