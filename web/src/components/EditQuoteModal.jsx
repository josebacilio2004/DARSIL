import React, { useState, useEffect } from 'react';
import { X, Search, Plus, Trash2, CheckCircle2, Loader2, Wrench, Building2, Car, Clock } from 'lucide-react';
import { api } from '../services/api';
import CatalogSearchModal from './CatalogSearchModal';

export default function EditQuoteModal({ quote, onClose, onQuoteUpdated }) {
  if (!quote) return null;

  const [loading, setLoading] = useState(false);
  const [catalog, setCatalog] = useState([]);
  const [showCatalogSearch, setShowCatalogSearch] = useState(false);

  // Formato para campos date HTML (YYYY-MM-DD)
  const formatInputDate = (dateVal) => {
    if (!dateVal) return new Date().toISOString().split('T')[0];
    const d = new Date(dateVal);
    return isNaN(d.getTime()) ? new Date().toISOString().split('T')[0] : d.toISOString().split('T')[0];
  };

  // Datos Cliente
  const [clientDoc, setClientDoc] = useState(quote.clientDoc || '');
  const [clientName, setClientName] = useState(quote.clientName || '');
  const [clientAddress, setClientAddress] = useState(quote.clientAddress || '');
  const [clientPhone, setClientPhone] = useState(quote.clientPhone || '');
  const [referencePerson, setReferencePerson] = useState(quote.referencePerson || quote.clientName || 'Atención en Taller');

  // Datos Vehículo
  const [plate, setPlate] = useState(quote.plate || '');
  const [vin, setVin] = useState(quote.vin || '');
  const [model, setModel] = useState(quote.model || '');

  // Tiempos y Plazos
  const [issueDate, setIssueDate] = useState(formatInputDate(quote.issueDate));
  const [validityDays, setValidityDays] = useState(quote.validityDays || 15);
  const [validUntil, setValidUntil] = useState(
    quote.validUntil ? formatInputDate(quote.validUntil) : new Date(Date.now() + (quote.validityDays || 15) * 86400000).toISOString().split('T')[0]
  );
  const [deliveryTerm, setDeliveryTerm] = useState(quote.deliveryTerm || 'Inmediato / Según programación');
  const [orderType, setOrderType] = useState(quote.orderType || 'Taller de Servicios');
  const [advisorName, setAdvisorName] = useState(quote.advisorName || 'Ruben Basil');
  const [paymentCondition, setPaymentCondition] = useState(quote.paymentCondition || 'Condición de pago 07 días despues de realizar el servicio.');

  // Ítems
  const [items, setItems] = useState(quote.items && quote.items.length > 0 ? quote.items : [
    { code: 'MO01', description: 'INSTALACIÓN DE RELÉ DE ARRANQUE', quantity: 1, unitPrice: 50.00 }
  ]);

  useEffect(() => {
    api.getCatalog().then(res => {
      if (res?.data) setCatalog(res.data);
    });
  }, []);

  const handleAddCatalogItem = (codeOrItem) => {
    const found = typeof codeOrItem === 'object' ? codeOrItem : catalog.find(c => c.code === codeOrItem);
    if (!found) return;
    setItems([
      ...items,
      {
        code: found.code,
        description: found.description,
        quantity: 1,
        unitPrice: Number(found.defaultPrice) || 0
      }
    ]);
  };

  const handleAddBlankRow = () => {
    setItems([
      ...items,
      { code: `MO${String(items.length + 1).padStart(2, '0')}`, description: '', quantity: 1, unitPrice: 0 }
    ]);
  };

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const subtotal = items.reduce((sum, item) => sum + (Number(item.quantity || 1) * Number(item.unitPrice || 0)), 0);
  const total = subtotal;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!clientName) {
      alert('Por favor especifica el nombre del cliente');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        templateType: 'TALLER_DETALLADO',
        clientDoc,
        clientName,
        clientAddress,
        clientPhone,
        referencePerson: referencePerson || clientName,
        plate: plate.toUpperCase(),
        vin,
        model,
        issueDate,
        validityDays: Number(validityDays) || 15,
        validUntil,
        deliveryTerm: deliveryTerm || 'Inmediato / Según programación',
        orderType: orderType || 'Taller de Servicios',
        advisorName,
        paymentCondition,
        items: items.map(i => ({
          ...i,
          quantity: Number(i.quantity) || 1,
          unitPrice: Number(i.unitPrice) || 0,
          value: (Number(i.quantity) || 1) * (Number(i.unitPrice) || 0)
        }))
      };

      const res = await api.updateQuote(quote._id, payload);
      if (res.success) {
        alert('¡Cotización y PDF oficial actualizados exitosamente con todos los tiempos completos!');
        if (onQuoteUpdated) onQuoteUpdated(res.data);
        onClose();
      } else {
        alert('Error: ' + res.message);
      }
    } catch (err) {
      alert('Error al actualizar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-darsil-card w-full max-w-4xl my-8 rounded-3xl shadow-2xl overflow-hidden border border-darsil-border text-white">
        
        {/* Header */}
        <div className="bg-darsil-obsidian px-6 py-4 flex items-center justify-between border-b border-darsil-border">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-darsil-gold border border-amber-500/30 font-black">
              ✏️
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-white">Editar Cotización</h2>
                <span className="font-mono text-xs font-black px-2.5 py-1 rounded bg-amber-400 text-slate-950">
                  {quote.quoteNumber}
                </span>
              </div>
              <p className="text-xs text-slate-400">Actualiza datos, plazos de entrega y partidas de la cotización</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          
          {/* Cliente */}
          <div className="bg-darsil-obsidian border border-darsil-border rounded-2xl p-4 space-y-3">
            <div className="flex items-center space-x-2 text-darsil-gold font-bold text-xs uppercase tracking-wider">
              <Building2 className="w-4 h-4 text-darsil-gold" />
              <span>1. Datos del Cliente</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">RUC o DNI:</label>
                <input
                  type="text"
                  value={clientDoc}
                  onChange={(e) => setClientDoc(e.target.value)}
                  className="w-full bg-darsil-card border border-darsil-border rounded-xl px-3 py-2 text-white outline-none focus:border-amber-400"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-400 font-semibold mb-1">Razón Social / Nombre:</label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full bg-darsil-card border border-darsil-border rounded-xl px-3 py-2 text-white font-semibold outline-none focus:border-amber-400"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-400 font-semibold mb-1">Dirección Fiscal / Destino:</label>
                <input
                  type="text"
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  className="w-full bg-darsil-card border border-darsil-border rounded-xl px-3 py-2 text-white outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Teléfono (WhatsApp):</label>
                <input
                  type="text"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="w-full bg-darsil-card border border-darsil-border rounded-xl px-3 py-2 text-white outline-none focus:border-amber-400"
                />
              </div>
            </div>
          </div>

          {/* Vehículo */}
          <div className="bg-darsil-obsidian border border-darsil-border rounded-2xl p-4 space-y-3">
            <div className="flex items-center space-x-2 text-darsil-gold font-bold text-xs uppercase tracking-wider">
              <Car className="w-4 h-4 text-darsil-gold" />
              <span>2. Datos del Vehículo / Maquinaria</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Matrícula / Placa:</label>
                <input
                  type="text"
                  value={plate}
                  onChange={(e) => setPlate(e.target.value.toUpperCase())}
                  className="w-full bg-darsil-card border border-darsil-border rounded-xl px-3 py-2 text-amber-400 font-mono font-bold outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">VIN / N° Chasis:</label>
                <input
                  type="text"
                  value={vin}
                  onChange={(e) => setVin(e.target.value)}
                  className="w-full bg-darsil-card border border-darsil-border rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Modelo:</label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full bg-darsil-card border border-darsil-border rounded-xl px-3 py-2 text-white outline-none focus:border-amber-400"
                />
              </div>
            </div>
          </div>

          {/* Tiempos, Validez y Plazos */}
          <div className="bg-darsil-obsidian border border-darsil-border rounded-2xl p-4 space-y-3">
            <div className="flex items-center space-x-2 text-darsil-gold font-bold text-xs uppercase tracking-wider">
              <Clock className="w-4 h-4 text-darsil-gold" />
              <span>3. Tiempos, Plazos de Entrega y Referencia</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Fecha Emisión:</label>
                <input
                  type="date"
                  required
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full bg-darsil-card border border-darsil-border rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Días de Validez:</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={validityDays}
                  onChange={(e) => {
                    const days = parseInt(e.target.value, 10) || 15;
                    setValidityDays(days);
                    setValidUntil(new Date(Date.now() + days * 86400000).toISOString().split('T')[0]);
                  }}
                  className="w-full bg-darsil-card border border-darsil-border rounded-xl px-3 py-2 text-amber-300 font-mono font-bold outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Fecha Vencimiento:</label>
                <input
                  type="date"
                  required
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="w-full bg-darsil-card border border-darsil-border rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Plazo de Entrega:</label>
                <input
                  type="text"
                  required
                  value={deliveryTerm}
                  onChange={(e) => setDeliveryTerm(e.target.value)}
                  placeholder="Ej. Inmediato / 24 a 48 horas"
                  className="w-full bg-darsil-card border border-darsil-border rounded-xl px-3 py-2 text-white font-medium outline-none focus:border-amber-400"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-400 font-semibold mb-1">Referencia / Contacto:</label>
                <input
                  type="text"
                  value={referencePerson}
                  onChange={(e) => setReferencePerson(e.target.value)}
                  placeholder="Ej. Joel Cordova"
                  className="w-full bg-darsil-card border border-darsil-border rounded-xl px-3 py-2 text-white outline-none focus:border-amber-400"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-400 font-semibold mb-1">Asesor Responsable:</label>
                <input
                  type="text"
                  value={advisorName}
                  onChange={(e) => setAdvisorName(e.target.value)}
                  className="w-full bg-darsil-card border border-darsil-border rounded-xl px-3 py-2 text-white font-semibold outline-none focus:border-amber-400"
                />
              </div>

              <div className="sm:col-span-4">
                <label className="block text-slate-400 font-semibold mb-1">Condición de Pago (Impresa en PDF):</label>
                <input
                  type="text"
                  required
                  value={paymentCondition}
                  onChange={(e) => setPaymentCondition(e.target.value)}
                  placeholder="Ej. Condición de pago 07 días despues de realizar el servicio."
                  className="w-full bg-darsil-card border border-darsil-border rounded-xl px-3 py-2 text-amber-300 font-medium outline-none focus:border-amber-400"
                />
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {[
                    'Contado contra entrega',
                    'Condición de pago 07 días despues de realizar el servicio.',
                    'Crédito 15 días calendario',
                    '50% adelanto y saldo contra entrega'
                  ].map((p, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setPaymentCondition(p)}
                      className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-slate-700 transition"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Ítems */}
          <div className="bg-darsil-obsidian border border-darsil-border rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-darsil-gold font-bold text-xs uppercase tracking-wider">
                <Wrench className="w-4 h-4 text-darsil-gold" />
                <span>4. Desglose de Servicios & Mano de Obra</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowCatalogSearch(true)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-gold-glow hover:brightness-110 active:scale-95 transition"
                >
                  <Search className="w-3.5 h-3.5 text-slate-950" />
                  <span>🔍 Buscar Servicio (Código / Palabra)</span>
                </button>

                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAddCatalogItem(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="text-xs bg-darsil-card border border-darsil-border rounded-xl px-2.5 py-1.5 font-semibold text-slate-200 focus:border-amber-400 outline-none"
                >
                  <option value="">⚡ + Catálogo Rápido...</option>
                  {catalog.map(c => (
                    <option key={c.code} value={c.code}>
                      {c.code} - {c.description} (S/ {c.defaultPrice})
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleAddBlankRow}
                  className="bg-darsil-card hover:bg-slate-800 text-slate-200 border border-darsil-border px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5 text-darsil-gold" />
                  <span>Fila</span>
                </button>
              </div>
            </div>

            {/* Tabla */}
            <div className="overflow-x-auto border border-darsil-border rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-900 text-slate-300 font-bold">
                  <tr>
                    <th className="p-2.5 w-20">Ref.</th>
                    <th className="p-2.5">Descripción</th>
                    <th className="p-2.5 w-16 text-center">Uds.</th>
                    <th className="p-2.5 w-28 text-right">P. Unit (S/)</th>
                    <th className="p-2.5 w-28 text-right">Valor (S/)</th>
                    <th className="p-2.5 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-darsil-border font-medium">
                  {items.map((item, idx) => {
                    const rowVal = (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0);
                    return (
                      <tr key={idx} className="hover:bg-darsil-card/50">
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.code}
                            onChange={(e) => handleItemChange(idx, 'code', e.target.value)}
                            className="w-full font-mono text-center bg-darsil-card border border-darsil-border rounded-lg py-1 text-darsil-gold font-bold"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            required
                            value={item.description}
                            onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                            className="w-full bg-darsil-card border border-darsil-border rounded-lg px-2.5 py-1 text-slate-200 uppercase"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                            className="w-full text-center bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold rounded-lg py-1"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            step="0.50"
                            value={item.unitPrice}
                            onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                            className="w-full text-right bg-darsil-card border border-darsil-border rounded-lg px-2 py-1 font-mono text-white"
                          />
                        </td>
                        <td className="p-2 text-right font-mono font-black text-amber-400 pr-3">
                          S/ {rowVal.toFixed(2)}
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-slate-500 hover:text-rose-400 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Total */}
            <div className="flex justify-end items-center space-x-4 bg-darsil-card p-3.5 rounded-xl border border-darsil-border">
              <span className="text-xs font-bold uppercase text-slate-400">Total Actualizado:</span>
              <span className="text-xl font-black text-darsil-gold font-mono">
                S/ {total.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-darsil-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 px-6 py-2.5 rounded-xl font-black text-xs flex items-center space-x-2 shadow-gold-glow active:scale-95 transition"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Actualizando y Re-generando PDF...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-slate-950" />
                  <span>Guardar y Actualizar PDF</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>

      {/* Modal de Búsqueda Avanzada de Catálogo por Código y Palabra Clave */}
      <CatalogSearchModal
        isOpen={showCatalogSearch}
        onClose={() => setShowCatalogSearch(false)}
        catalog={catalog}
        onSelectItem={handleAddCatalogItem}
        onAddBlankRow={handleAddBlankRow}
      />
    </div>
  );
}
