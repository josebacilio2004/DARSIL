import React, { useState, useEffect } from 'react';
import { X, Search, Plus, Trash2, CheckCircle2, Loader2, Car, Building2, Wrench, Calendar, Clock, UserCheck } from 'lucide-react';
import { api } from '../services/api';

export default function NewQuoteModal({ onClose, onSuccess }) {
  const [templateType, setTemplateType] = useState('TALLER_DETALLADO');
  const [loading, setLoading] = useState(false);
  const [searchingDoc, setSearchingDoc] = useState(false);
  const [catalog, setCatalog] = useState([]);

  // Helper para fechas por defecto (hoy y +15 días)
  const todayStr = new Date().toISOString().split('T')[0];
  const defaultValidUntil = new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0];

  // Datos Cliente
  const [clientDoc, setClientDoc] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [referencePerson, setReferencePerson] = useState('Atención en Taller');

  // Datos Vehículo
  const [plate, setPlate] = useState('');
  const [vin, setVin] = useState('');
  const [model, setModel] = useState('');

  // Tiempos y Plazos (Para que NUNCA salgan vacíos en el PDF)
  const [issueDate, setIssueDate] = useState(todayStr);
  const [validUntil, setValidUntil] = useState(defaultValidUntil);
  const [deliveryTerm, setDeliveryTerm] = useState('Inmediato / Según programación');
  const [orderType, setOrderType] = useState('Taller de Servicios');
  const [advisorName, setAdvisorName] = useState('Ruben Basil');
  const [paymentCondition, setPaymentCondition] = useState('Condición de pago 07 días despues de realizar el servicio.');

  // Ítems para Taller Detallado
  const [items, setItems] = useState([
    { code: 'MO01', description: 'INSTALACIÓN DE RELÉ DE ARRANQUE', quantity: 1, unitPrice: 50.00, stockDisp: 'DISPONIBLE' }
  ]);

  useEffect(() => {
    api.getCatalog().then(res => {
      if (res?.data) setCatalog(res.data);
    });
  }, []);

  // Búsqueda inteligente de RUC (SUNAT) o DNI (RENIEC) vía APIsPerú
  const handleLookupDoc = async () => {
    const clean = clientDoc.trim();
    if (clean.length !== 8 && clean.length !== 11) {
      alert('Ingresa un DNI de 8 dígitos o un RUC de 11 dígitos');
      return;
    }

    setSearchingDoc(true);
    try {
      if (clean.length === 11) {
        const res = await api.lookupRuc(clean);
        if (res.success && res.data) {
          setClientName(res.data.razonSocial || '');
          if (res.data.direccion) {
            setClientAddress(res.data.direccion);
          }
          if (!referencePerson || referencePerson === 'Atención en Taller') {
            setReferencePerson(res.data.razonSocial);
          }
        }
      } else {
        const res = await api.lookupDni(clean);
        if (res.success && res.data) {
          const fullName = res.data.nombreCompleto || `${res.data.nombres} ${res.data.apellidoPaterno || ''}`.trim();
          setClientName(fullName);
          if (!referencePerson || referencePerson === 'Atención en Taller') {
            setReferencePerson(fullName);
          }
        }
      }
    } catch (err) {
      alert('Error en consulta APIsPerú: ' + err.message);
    } finally {
      setSearchingDoc(false);
    }
  };

  const handleAddCatalogItem = (code) => {
    const found = catalog.find(c => c.code === code);
    if (!found) return;
    setItems([
      ...items,
      {
        code: found.code,
        description: found.description,
        quantity: 1,
        unitPrice: found.defaultPrice,
        stockDisp: 'DISPONIBLE'
      }
    ]);
  };

  const handleAddBlankRow = () => {
    setItems([
      ...items,
      { code: `MO${String(items.length + 1).padStart(2, '0')}`, description: '', quantity: 1, unitPrice: 0, stockDisp: 'DISPONIBLE' }
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
      alert('Por favor ingresa la Razón Social o Nombre del cliente');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        templateType,
        clientDoc,
        clientName,
        clientAddress: clientAddress || 'Lima, Perú',
        clientPhone,
        referencePerson: referencePerson || clientName,
        plate: plate.toUpperCase(),
        vin,
        model,
        issueDate,
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

      const res = await api.createQuote(payload);
      if (res.success) {
        onSuccess(res.data);
      } else {
        alert('Error: ' + res.message);
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-darsil-card w-full max-w-4xl my-8 rounded-3xl shadow-2xl overflow-hidden border border-darsil-border text-white">
        
        {/* Header con Logo */}
        <div className="bg-darsil-obsidian px-6 py-4 flex items-center justify-between border-b border-darsil-border">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-28 flex items-center justify-center bg-black/40 rounded-xl p-1 border border-darsil-border">
              <img src="/logo.jpg" alt="Logo" className="h-full w-full object-contain" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">Nueva Cotización Oficial</h2>
              <p className="text-[11px] text-slate-400">DARSIL Automotive Solutions • Sistema Automatizado</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          
          {/* Selector de Plantilla */}
          <div className="bg-darsil-obsidian p-1.5 rounded-2xl flex space-x-1.5 border border-darsil-border">
            <button
              type="button"
              onClick={() => setTemplateType('TALLER_DETALLADO')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                templateType === 'TALLER_DETALLADO'
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-gold-glow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Plantilla Oficial Taller / Flotas por Ítems (Plantilla 2)
            </button>
            <button
              type="button"
              onClick={() => setTemplateType('PROYECTO_ESPECIAL')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                templateType === 'PROYECTO_ESPECIAL'
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-gold-glow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Plantilla Proyecto Especial / Licitación (Plantilla 1)
            </button>
          </div>

          {/* Sección 1: Cliente con Consulta APIsPerú */}
          <div className="bg-darsil-obsidian border border-darsil-border rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-darsil-gold font-bold text-xs uppercase tracking-wider">
                <Building2 className="w-4 h-4 text-darsil-gold" />
                <span>1. Información del Cliente</span>
              </div>
              <span className="text-[10px] text-amber-400/80 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-mono">
                API APIsPerú Conectada (RUC & DNI)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">RUC o DNI:</label>
                <div className="flex space-x-1.5">
                  <input
                    type="text"
                    value={clientDoc}
                    onChange={(e) => setClientDoc(e.target.value)}
                    placeholder="Ej. 10418236103 / 72409984"
                    className="w-full bg-darsil-card border border-darsil-border rounded-xl px-3 py-2 text-white outline-none focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={handleLookupDoc}
                    disabled={searchingDoc}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-3 py-2 rounded-xl font-bold flex items-center shadow-gold-glow active:scale-95"
                    title="Consultar RUC ante SUNAT o DNI ante RENIEC vía APIsPerú"
                  >
                    {searchingDoc ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-400 font-semibold mb-1">Razón Social / Nombre Completo:</label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Ej. DE LA CRUZ BALDEON ROCIO ELENA"
                  className="w-full bg-darsil-card border border-darsil-border rounded-xl px-3 py-2 text-white font-semibold outline-none focus:border-amber-400"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-400 font-semibold mb-1">Dirección Fiscal / Destino:</label>
                <input
                  type="text"
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  placeholder="Av Los Forestales MZ I1, Villa EL Salvador"
                  className="w-full bg-darsil-card border border-darsil-border rounded-xl px-3 py-2 text-white outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Teléfono (WhatsApp):</label>
                <input
                  type="text"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="Ej. 906623068"
                  className="w-full bg-darsil-card border border-darsil-border rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-amber-400"
                />
              </div>
            </div>
          </div>

          {/* Sección 2: Vehículo */}
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
                  placeholder="Ej. ABG890"
                  className="w-full bg-darsil-card border border-darsil-border rounded-xl px-3 py-2 text-amber-400 font-mono font-bold outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">VIN / N° Chasis / Unidad:</label>
                <input
                  type="text"
                  value={vin}
                  onChange={(e) => setVin(e.target.value)}
                  placeholder="Ej. unidad 1056"
                  className="w-full bg-darsil-card border border-darsil-border rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Modelo:</label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="Ej. Camc Mixer / Bus 12m"
                  className="w-full bg-darsil-card border border-darsil-border rounded-xl px-3 py-2 text-white outline-none focus:border-amber-400"
                />
              </div>
            </div>
          </div>

          {/* Sección 3: Plazos, Tiempos y Metadatos (CAMPOS QUE SALÍAN VACÍOS) */}
          <div className="bg-darsil-obsidian border border-darsil-border rounded-2xl p-4 space-y-3">
            <div className="flex items-center space-x-2 text-darsil-gold font-bold text-xs uppercase tracking-wider">
              <Clock className="w-4 h-4 text-darsil-gold" />
              <span>3. Tiempos, Validez y Condiciones (Campos Oficiales)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Fecha Alta (Emisión):</label>
                <input
                  type="date"
                  required
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full bg-darsil-card border border-darsil-border rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Fecha Validez (15 días):</label>
                <input
                  type="date"
                  required
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="w-full bg-darsil-card border border-darsil-border rounded-xl px-3 py-2 text-amber-300 font-mono font-bold outline-none focus:border-amber-400"
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

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Referencia / Contacto:</label>
                <input
                  type="text"
                  value={referencePerson}
                  onChange={(e) => setReferencePerson(e.target.value)}
                  placeholder="Ej. Joel Cordova"
                  className="w-full bg-darsil-card border border-darsil-border rounded-xl px-3 py-2 text-white outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Tipo de Pedido:</label>
                <input
                  type="text"
                  value={orderType}
                  onChange={(e) => setOrderType(e.target.value)}
                  placeholder="Ej. Taller de Servicios"
                  className="w-full bg-darsil-card border border-darsil-border rounded-xl px-3 py-2 text-white outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Asesor Técnico Responsable:</label>
                <input
                  type="text"
                  value={advisorName}
                  onChange={(e) => setAdvisorName(e.target.value)}
                  className="w-full bg-darsil-card border border-darsil-border rounded-xl px-3 py-2 text-white font-semibold outline-none focus:border-amber-400"
                />
              </div>
            </div>
          </div>

          {/* Sección 4: Ítems y Catálogo */}
          <div className="bg-darsil-obsidian border border-darsil-border rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-darsil-gold font-bold text-xs uppercase tracking-wider">
                <Wrench className="w-4 h-4 text-darsil-gold" />
                <span>4. Propuesta Económica y Mano de Obra</span>
              </div>

              <div className="flex items-center space-x-2">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAddCatalogItem(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="text-xs bg-darsil-card border border-darsil-border rounded-xl px-2.5 py-1.5 font-semibold text-slate-200 focus:border-amber-400 outline-none"
                >
                  <option value="">⚡ + Agregar del Catálogo (MO01-MO21)...</option>
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
              <span className="text-xs font-bold uppercase text-slate-400">Total Cotización:</span>
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
                  <span>Generando Cotización con Tiempos y PDF Oficial...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-slate-950" />
                  <span>Guardar y Generar PDF Oficial</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
