import React, { useState, useEffect } from 'react';
import { X, Search, Plus, Trash2, CheckCircle2, Loader2, Wrench, Building2, Car, Clock, Boxes } from 'lucide-react';
import { api } from '../services/api';
import CatalogSearchModal from './CatalogSearchModal';

const isPartItem = (item) => {
  const code = (item.code || '').toUpperCase();
  const desc = (item.description || '').toUpperCase();
  return code.startsWith('REP') || code.startsWith('CAB') || code.startsWith('CON') || 
         code.startsWith('FIL') || code.startsWith('FAR') || code.startsWith('SEN') ||
         desc.includes('REPUESTO') || desc.includes('ACCESORIO') || desc.includes('INSUMO');
};

export default function EditQuoteModal({ quote, onClose, onQuoteUpdated }) {
  if (!quote) return null;

  const [loading, setLoading] = useState(false);
  const [catalog, setCatalog] = useState([]);
  const [inventory, setInventory] = useState([]);
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
  const [advisorName, setAdvisorName] = useState(quote.advisorName || 'Darios Bacilio');
  const [paymentCondition, setPaymentCondition] = useState(quote.paymentCondition || 'Condición de pago 07 días despues de realizar el servicio.');

  // Partición de Ítems: Servicios (Bloque 4) vs Repuestos & Accesorios (Bloque 5)
  const initialItems = quote.items && quote.items.length > 0 ? quote.items : [];
  const [serviceItems, setServiceItems] = useState(
    initialItems.filter(i => !isPartItem(i)).length > 0
      ? initialItems.filter(i => !isPartItem(i))
      : [{ code: 'MO01', description: 'INSTALACIÓN DE RELÉ DE ARRANQUE', quantity: 1, unitPrice: 50.00 }]
  );
  const [partItems, setPartItems] = useState(
    initialItems.filter(i => isPartItem(i))
  );

  useEffect(() => {
    api.getCatalog().then(res => {
      if (res?.data) setCatalog(res.data);
    });
    api.getInventory().then(res => {
      if (res?.data) setInventory(res.data);
    });
  }, []);

  // Handlers para Servicios (Bloque 4)
  const handleAddCatalogService = (codeOrItem) => {
    const found = typeof codeOrItem === 'object' ? codeOrItem : catalog.find(c => c.code === codeOrItem);
    if (!found) return;
    setServiceItems([
      ...serviceItems,
      {
        code: found.code,
        description: found.description,
        quantity: 1,
        unitPrice: Number(found.defaultPrice) || 0
      }
    ]);
  };

  const handleAddServiceBlankRow = () => {
    setServiceItems([
      ...serviceItems,
      { code: `MO${String(serviceItems.length + 1).padStart(2, '0')}`, description: '', quantity: 1, unitPrice: 0 }
    ]);
  };

  const handleRemoveService = (index) => {
    setServiceItems(serviceItems.filter((_, i) => i !== index));
  };

  const handleServiceChange = (index, field, value) => {
    const updated = [...serviceItems];
    updated[index][field] = value;
    setServiceItems(updated);
  };

  // Handlers para Repuestos & Accesorios (Bloque 5)
  const handleAddInventoryPart = (part) => {
    if (!part) return;
    setPartItems([
      ...partItems,
      {
        code: part.sku || part.code || `REP${String(partItems.length + 1).padStart(2, '0')}`,
        description: `REPUESTO: ${part.name || part.description}`,
        quantity: 1,
        unitPrice: Number(part.salePrice || part.defaultPrice || 0)
      }
    ]);
  };

  const handleAddPartBlankRow = () => {
    setPartItems([
      ...partItems,
      { code: `REP${String(partItems.length + 1).padStart(2, '0')}`, description: 'REPUESTO: ', quantity: 1, unitPrice: 0 }
    ]);
  };

  const handleRemovePart = (index) => {
    setPartItems(partItems.filter((_, i) => i !== index));
  };

  const handlePartChange = (index, field, value) => {
    const updated = [...partItems];
    updated[index][field] = value;
    setPartItems(updated);
  };

  const subtotalServices = serviceItems.reduce((sum, item) => sum + (Number(item.quantity || 1) * Number(item.unitPrice || 0)), 0);
  const subtotalParts = partItems.reduce((sum, item) => sum + (Number(item.quantity || 1) * Number(item.unitPrice || 0)), 0);
  const total = subtotalServices + subtotalParts;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!clientName) {
      alert('Por favor especifica el nombre del cliente');
      return;
    }

    setLoading(true);
    try {
      const combinedItems = [
        ...serviceItems.map(i => ({
          ...i,
          quantity: Number(i.quantity) || 1,
          unitPrice: Number(i.unitPrice) || 0,
          value: (Number(i.quantity) || 1) * (Number(i.unitPrice) || 0)
        })),
        ...partItems.map(i => ({
          ...i,
          quantity: Number(i.quantity) || 1,
          unitPrice: Number(i.unitPrice) || 0,
          value: (Number(i.quantity) || 1) * (Number(i.unitPrice) || 0)
        }))
      ];

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
        items: combinedItems
      };

      const res = await api.updateQuote(quote._id, payload);
      if (res.success) {
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

          {/* 4. Desglose de Servicios & Mano de Obra */}
          <div className="bg-darsil-obsidian border border-darsil-border rounded-2xl p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2 text-darsil-gold font-bold text-xs uppercase tracking-wider">
                <Wrench className="w-4 h-4 text-darsil-gold" />
                <span>4. Desglose de Servicios & Mano de Obra ({serviceItems.length})</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowCatalogSearch(true)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-gold-glow hover:brightness-110 active:scale-95 transition"
                >
                  <Search className="w-3.5 h-3.5 text-slate-950" />
                  <span>🔍 Buscar Servicio</span>
                </button>

                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAddCatalogService(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="text-xs bg-darsil-card border border-darsil-border rounded-xl px-2.5 py-1.5 font-semibold text-slate-200 focus:border-amber-400 outline-none"
                >
                  <option value="">⚡ + Catálogo Servicios...</option>
                  {catalog.map(c => (
                    <option key={c.code} value={c.code}>
                      {c.code} - {c.description} (S/ {c.defaultPrice})
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleAddServiceBlankRow}
                  className="bg-darsil-card hover:bg-slate-800 text-slate-200 border border-darsil-border px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5 text-darsil-gold" />
                  <span>+ Fila Servicio</span>
                </button>
              </div>
            </div>

            {/* Tabla de Servicios */}
            <div className="overflow-x-auto border border-darsil-border rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-900 text-slate-300 font-bold">
                  <tr>
                    <th className="p-2.5 w-20">Ref.</th>
                    <th className="p-2.5">Descripción del Servicio</th>
                    <th className="p-2.5 w-16 text-center">Uds.</th>
                    <th className="p-2.5 w-28 text-right">P. Unit (S/)</th>
                    <th className="p-2.5 w-28 text-right">Valor (S/)</th>
                    <th className="p-2.5 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-darsil-border font-medium">
                  {serviceItems.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-3 text-center text-slate-500 italic">
                        Sin servicios asignados. Agrega desde el catálogo o una nueva fila.
                      </td>
                    </tr>
                  ) : (
                    serviceItems.map((item, idx) => {
                      const rowVal = (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0);
                      return (
                        <tr key={idx} className="hover:bg-darsil-card/50">
                          <td className="p-2">
                            <input
                              type="text"
                              value={item.code}
                              onChange={(e) => handleServiceChange(idx, 'code', e.target.value)}
                              className="w-full font-mono text-center bg-darsil-card border border-darsil-border rounded-lg py-1 text-darsil-gold font-bold"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              required
                              value={item.description}
                              onChange={(e) => handleServiceChange(idx, 'description', e.target.value)}
                              className="w-full bg-darsil-card border border-darsil-border rounded-lg px-2.5 py-1 text-slate-200 uppercase"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleServiceChange(idx, 'quantity', e.target.value)}
                              className="w-full text-center bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold rounded-lg py-1"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              step="0.50"
                              value={item.unitPrice}
                              onChange={(e) => handleServiceChange(idx, 'unitPrice', e.target.value)}
                              className="w-full text-right bg-darsil-card border border-darsil-border rounded-lg px-2 py-1 font-mono text-white"
                            />
                          </td>
                          <td className="p-2 text-right font-mono font-black text-amber-400 pr-3">
                            S/ {rowVal.toFixed(2)}
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveService(idx)}
                              className="text-slate-500 hover:text-rose-400 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Subtotal Servicios */}
            <div className="flex justify-end items-center space-x-2 text-xs text-slate-300 pr-2">
              <span className="font-semibold text-slate-400">Subtotal Mano de Obra:</span>
              <span className="font-mono font-bold text-amber-400">
                S/ {subtotalServices.toFixed(2)}
              </span>
            </div>
          </div>

          {/* 5. Desglose de Repuestos y Accesorios */}
          <div className="bg-darsil-obsidian border border-darsil-border rounded-2xl p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2 text-blue-400 font-bold text-xs uppercase tracking-wider">
                <Boxes className="w-4 h-4 text-blue-400" />
                <span>5. Desglose de Repuestos y Accesorios ({partItems.length})</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      const found = inventory.find(i => i.sku === e.target.value || i._id === e.target.value);
                      if (found) handleAddInventoryPart(found);
                      e.target.value = '';
                    }
                  }}
                  className="text-xs bg-darsil-card border border-darsil-border rounded-xl px-2.5 py-1.5 font-semibold text-slate-200 focus:border-blue-400 outline-none"
                >
                  <option value="">⚙️ + Repuestos en Almacén...</option>
                  {inventory.map(item => (
                    <option key={item.sku || item._id} value={item.sku || item._id}>
                      {item.sku} - {item.name} (S/ {Number(item.salePrice).toFixed(2)})
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleAddPartBlankRow}
                  className="bg-darsil-card hover:bg-slate-800 text-slate-200 border border-darsil-border px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5 text-blue-400" />
                  <span>+ Fila Repuesto</span>
                </button>
              </div>
            </div>

            {/* Tabla de Repuestos */}
            <div className="overflow-x-auto border border-darsil-border rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-900 text-slate-300 font-bold">
                  <tr>
                    <th className="p-2.5 w-28">SKU / Ref.</th>
                    <th className="p-2.5">Descripción del Repuesto / Accesorio</th>
                    <th className="p-2.5 w-16 text-center">Uds.</th>
                    <th className="p-2.5 w-28 text-right">P. Unit (S/)</th>
                    <th className="p-2.5 w-28 text-right">Valor (S/)</th>
                    <th className="p-2.5 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-darsil-border font-medium">
                  {partItems.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-3 text-center text-slate-500 italic">
                        Sin repuestos requeridos. Selecciona del almacén o agrega una fila manual.
                      </td>
                    </tr>
                  ) : (
                    partItems.map((item, idx) => {
                      const rowVal = (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0);
                      return (
                        <tr key={idx} className="hover:bg-darsil-card/50">
                          <td className="p-2">
                            <input
                              type="text"
                              value={item.code}
                              onChange={(e) => handlePartChange(idx, 'code', e.target.value)}
                              className="w-full font-mono text-center bg-darsil-card border border-darsil-border rounded-lg py-1 text-blue-400 font-bold"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              required
                              value={item.description}
                              onChange={(e) => handlePartChange(idx, 'description', e.target.value)}
                              className="w-full bg-darsil-card border border-darsil-border rounded-lg px-2.5 py-1 text-slate-200 uppercase"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handlePartChange(idx, 'quantity', e.target.value)}
                              className="w-full text-center bg-blue-500/10 border border-blue-500/30 text-blue-300 font-bold rounded-lg py-1"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              step="0.50"
                              value={item.unitPrice}
                              onChange={(e) => handlePartChange(idx, 'unitPrice', e.target.value)}
                              className="w-full text-right bg-darsil-card border border-darsil-border rounded-lg px-2 py-1 font-mono text-white"
                            />
                          </td>
                          <td className="p-2 text-right font-mono font-black text-blue-300 pr-3">
                            S/ {rowVal.toFixed(2)}
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemovePart(idx)}
                              className="text-slate-500 hover:text-rose-400 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Subtotal Repuestos */}
            <div className="flex justify-end items-center space-x-2 text-xs text-slate-300 pr-2">
              <span className="font-semibold text-slate-400">Subtotal Repuestos & Accesorios:</span>
              <span className="font-mono font-bold text-blue-400">
                S/ {subtotalParts.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Total Consolidado */}
          <div className="flex justify-between items-center bg-darsil-card p-4 rounded-2xl border border-darsil-border">
            <div className="text-xs text-slate-400">
              Servicios: <span className="text-amber-400 font-bold">S/ {subtotalServices.toFixed(2)}</span> • Repuestos: <span className="text-blue-400 font-bold">S/ {subtotalParts.toFixed(2)}</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-xs font-bold uppercase text-slate-400">TOTAL ACTUALIZADO:</span>
              <span className="text-2xl font-black text-darsil-gold font-mono">
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
        onSelectItem={handleAddCatalogService}
        onAddBlankRow={handleAddServiceBlankRow}
      />
    </div>
  );
}
