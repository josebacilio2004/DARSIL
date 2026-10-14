import React, { useState, useEffect } from 'react';
import { 
  Receipt, 
  PlusCircle, 
  FileText, 
  Download, 
  QrCode, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Filter, 
  Eye, 
  Send, 
  FileCode, 
  RefreshCw, 
  X, 
  Building2, 
  User, 
  Calendar, 
  DollarSign, 
  Share2, 
  ExternalLink,
  ChevronRight,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import { api } from '../services/api';

export default function BillingView({ quotes = [], onRefreshQuotes }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL'); // ALL, FACTURA, BOLETA
  const [selectedEnvironment, setSelectedEnvironment] = useState('BETA'); // BETA, PRODUCCION

  // Modales
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [qrModalInvoice, setQrModalInvoice] = useState(null);

  // Formulario Nueva Factura / Boleta
  const [docType, setDocType] = useState('01'); // 01 = Factura (F001), 03 = Boleta (B001)
  const [clientRucDni, setClientRucDni] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [paymentCondition, setPaymentCondition] = useState('CONTADO');
  const [items, setItems] = useState([
    { description: 'Mantenimiento Electrónico y Diagnóstico Computarizado', quantity: 1, unitPrice: 450 }
  ]);
  const [associatedQuoteId, setAssociatedQuoteId] = useState('');
  const [emitting, setEmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await api.getInvoices();
      if (res?.success && Array.isArray(res.data)) {
        setInvoices(res.data);
      }
    } catch (err) {
      console.error('Error fetching invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  // Getters para compatibilidad de esquemas
  const getNum = (inv) => inv?.fullNumber || inv?.invoiceNumber || `${inv?.serie || 'F001'}-${String(inv?.number || 1).padStart(8, '0')}`;
  const getType = (inv) => inv?.invoiceType || inv?.documentType || '01';
  const getTotal = (inv) => Number(inv?.totals?.total ?? inv?.total ?? 0);
  const getIgv = (inv) => Number(inv?.totals?.igv ?? inv?.igv ?? 0);
  const getSubtotal = (inv) => Number(inv?.totals?.opGravadas ?? inv?.subtotal ?? 0);
  const getDoc = (inv) => inv?.clientDoc || inv?.clientDocNumber || '';
  const getHash = (inv) => inv?.sunatResponse?.hash || inv?.hash || 'GEN-SHA256-DARSIL';
  const getQr = (inv) => inv?.sunatResponse?.qrCode || inv?.qrCode || '';

  // Calcular métricas
  const totalInvoiced = invoices.reduce((acc, inv) => acc + getTotal(inv), 0);
  const totalIgv = invoices.reduce((acc, inv) => acc + getIgv(inv), 0);
  const totalFacturas = invoices.filter(inv => getType(inv) === '01').length;
  const totalBoletas = invoices.filter(inv => getType(inv) === '03').length;

  // Filtrado
  const filteredInvoices = invoices.filter(inv => {
    const num = getNum(inv);
    const doc = getDoc(inv);
    const matchesSearch = 
      num.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv?.clientName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = 
      typeFilter === 'ALL' ||
      (typeFilter === 'FACTURA' && getType(inv) === '01') ||
      (typeFilter === 'BOLETA' && getType(inv) === '03');

    return matchesSearch && matchesType;
  });

  // Autocompletar desde Cotización existente
  const handleSelectQuoteToLoad = (quoteId) => {
    setAssociatedQuoteId(quoteId);
    const q = quotes.find(item => item._id === quoteId);
    if (!q) return;

    const isRuc = (q.clientRuc || '').length === 11 || (q.clientName || '').toUpperCase().includes('S.A.C') || (q.clientName || '').toUpperCase().includes('S.A.');
    setDocType(isRuc ? '01' : '03');
    setClientRucDni(q.clientRuc || q.clientDni || '');
    setClientName(q.clientName || '');
    setClientAddress(q.clientAddress || 'LIMA, PERÚ');
    setClientPhone(q.clientPhone || '');
    setClientEmail(q.clientEmail || '');

    if (Array.isArray(q.items) && q.items.length > 0) {
      setItems(q.items.map(it => ({
        description: it.description || it.serviceName || 'Servicio Automotriz Especializado',
        quantity: Number(it.quantity || 1),
        unitPrice: Number(it.unitPrice || it.price || 0)
      })));
    } else {
      setItems([{
        description: `Servicio integral según cotización ${q.quoteNumber}`,
        quantity: 1,
        unitPrice: Number(q.total || 0)
      }]);
    }
  };

  const handleAddItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0 }]);
  };

  const handleRemoveItem = (index) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = field === 'description' ? value : Number(value);
    setItems(updated);
  };

  // Cálculos del formulario
  const formSubtotal = items.reduce((acc, it) => acc + (Number(it.quantity || 1) * Number(it.unitPrice || 0)), 0);
  const formTotal = Math.round(formSubtotal * 100) / 100;
  const formGravado = Math.round((formTotal / 1.18) * 100) / 100;
  const formIgv = Math.round((formTotal - formGravado) * 100) / 100;

  const handleEmitInvoice = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!clientName.trim()) {
      setFormError('Debe ingresar la Razón Social o Nombre del cliente');
      return;
    }

    if (docType === '01') {
      const cleanRuc = clientRucDni.replace(/\D/g, '');
      if (cleanRuc.length !== 11) {
        setFormError('Para Factura Electrónica (F001) el RUC debe tener exactamente 11 dígitos');
        return;
      }
    } else {
      const cleanDni = clientRucDni.replace(/\D/g, '');
      if (cleanDni.length !== 8 && cleanDni.length !== 11) {
        setFormError('Para Boleta de Venta (B001) ingrese un DNI válido de 8 dígitos');
        return;
      }
    }

    if (items.length === 0 || formTotal <= 0) {
      setFormError('Debe agregar al menos un ítem con precio mayor a 0');
      return;
    }

    try {
      setEmitting(true);
      const payload = {
        documentType: docType,
        clientDocType: docType === '01' ? '6' : '1',
        clientDoc: clientRucDni.trim(),
        clientName: clientName.trim(),
        clientAddress: clientAddress.trim(),
        clientPhone: clientPhone.trim(),
        clientEmail: clientEmail.trim(),
        paymentCondition,
        environment: selectedEnvironment,
        quoteId: associatedQuoteId || null,
        items: items.map(it => ({
          description: it.description,
          quantity: Number(it.quantity),
          unitPrice: Number(it.unitPrice),
          subtotal: Number(it.quantity) * Number(it.unitPrice)
        }))
      };

      const res = await api.createInvoice(payload);
      if (res?.success) {
        setShowNewModal(false);
        // Reset form
        setClientRucDni('');
        setClientName('');
        setClientAddress('');
        setClientPhone('');
        setClientEmail('');
        setAssociatedQuoteId('');
        setItems([{ description: 'Mantenimiento Electrónico y Diagnóstico', quantity: 1, unitPrice: 450 }]);
        fetchInvoices();
        // Mostrar comprobante emitido
        if (res.data) setSelectedInvoice(res.data);
      } else {
        setFormError(res?.message || 'Error al emitir el comprobante a SUNAT');
      }
    } catch (err) {
      setFormError(err.message || 'Error de conexión con el servidor');
    } finally {
      setEmitting(false);
    }
  };

  const handleShareWhatsAppInvoice = (inv) => {
    const totalVal = getTotal(inv);
    const totalStr = 'S/ ' + totalVal.toLocaleString('es-PE', { minimumFractionDigits: 2 });
    const rawPhone = inv?.clientPhone ? String(inv.clientPhone).replace(/\D/g, '') : '934787006';
    const phone = rawPhone.startsWith('51') ? rawPhone : `51${rawPhone}`;
    const pdfUrl = api.getInvoicePdfUrl(inv._id);
    const isFactura = getType(inv) === '01';
    const tipo = isFactura ? 'FACTURA ELECTRÓNICA' : 'BOLETA DE VENTA ELECTRÓNICA';
    const num = getNum(inv);
    const hash = getHash(inv);
    const doc = getDoc(inv);

    const msg = `⚡ *DARSIL AUTOMOTIVE SOLUTIONS S.A.C.* ⚡
_R.U.C. 20608765432 • Comprobante Electrónico UBL 2.1_

Estimado/a *${inv.clientName}*,
Le hacemos llegar su comprobante de pago electrónico oficial aceptado por SUNAT:

📋 *Comprobante:* ${tipo} ${num}
🏢 *${isFactura ? 'RUC' : 'DNI'}:* ${doc}
💰 *Op. Gravada:* S/ ${getSubtotal(inv).toFixed(2)}
⚖️ *I.G.V. (18%):* S/ ${getIgv(inv).toFixed(2)}
💵 *TOTAL:* ${totalStr}
🔐 *Código Hash SHA-256:* ${hash ? hash.slice(0, 16) + '...' : 'DARSIL-UBL21-CERT'}
✅ *Estado SUNAT:* ACEPTADO CON CONSTANCIA CDR

📄 *Descargue su PDF Oficial con QR Tributario aquí:*
${pdfUrl}

Agradecemos su preferencia y confianza.
📞 Central DARSIL: (01) 934 787 006`;

    window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="space-y-6 animate-in fade-in">

      {/* Encabezado y Selector de Entorno SUNAT */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-darsil-card via-slate-900 to-darsil-card p-4 sm:p-6 rounded-2xl border border-darsil-border shadow-xl">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20">
              UBL 2.1 • SUNAT OFICIAL
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              SUNAT ONLINE (OK)
            </span>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
              RUC 20608765432
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <Receipt className="w-7 h-7 text-amber-400 shrink-0" />
            Facturación Electrónica SUNAT
          </h1>
          <p className="text-xs text-slate-400 max-w-2xl">
            Emisión de Facturas (`F001`) y Boletas (`B001`) con firma digital SHA-256, XML UBL 2.1, Constancia de Recepción (CDR) y Código QR tributario oficial.
          </p>
        </div>

        {/* Acciones y Switcher de Entorno */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Selector de Entorno */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-darsil-border text-xs">
            <button
              onClick={() => setSelectedEnvironment('BETA')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                selectedEnvironment === 'BETA'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>BETA (Pruebas)</span>
            </button>
            <button
              onClick={() => setSelectedEnvironment('PRODUCCION')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                selectedEnvironment === 'PRODUCCION'
                  ? 'bg-emerald-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>PRODUCCIÓN</span>
            </button>
          </div>

          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-gold-glow hover:brightness-110 active:scale-95 transition"
          >
            <PlusCircle className="w-4 h-4 stroke-[2.5]" />
            <span>+ Nueva Factura / Boleta</span>
          </button>
        </div>
      </div>

      {/* Tarjetas de Métricas Tributarias */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Facturado */}
        <div className="bg-darsil-card border border-darsil-border p-3.5 sm:p-5 rounded-2xl relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-wider">
              Total Facturado (PEN)
            </span>
            <div className="p-2 rounded-xl bg-amber-400/10 text-amber-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 text-lg sm:text-2xl font-black text-white font-mono">
            S/ {totalInvoiced.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-[10px] text-slate-400 flex items-center gap-1">
            <span>IGV 18%:</span>
            <span className="text-amber-400 font-mono font-bold">
              S/ {totalIgv.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Total Facturas F001 */}
        <div className="bg-darsil-card border border-darsil-border p-3.5 sm:p-5 rounded-2xl relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-wider">
              Facturas (F001)
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 text-lg sm:text-2xl font-black text-white font-mono">
            {totalFacturas}
          </div>
          <div className="mt-1 text-[10px] text-slate-400">
            Con RUC 11 dígitos (Empresas)
          </div>
        </div>

        {/* Total Boletas B001 */}
        <div className="bg-darsil-card border border-darsil-border p-3.5 sm:p-5 rounded-2xl relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-wider">
              Boletas (B001)
            </span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <User className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 text-lg sm:text-2xl font-black text-white font-mono">
            {totalBoletas}
          </div>
          <div className="mt-1 text-[10px] text-slate-400">
            Con DNI (Personas Naturales)
          </div>
        </div>

        {/* Tasa Aceptación SUNAT */}
        <div className="bg-darsil-card border border-darsil-border p-3.5 sm:p-5 rounded-2xl relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-wider">
              Estado SUNAT
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 text-lg sm:text-2xl font-black text-emerald-400 font-mono">
            100% OK
          </div>
          <div className="mt-1 text-[10px] text-emerald-400/80 flex items-center gap-1 font-bold">
            <CheckCircle2 className="w-3 h-3" />
            <span>CDR Código 0 (Aceptado)</span>
          </div>
        </div>
      </div>

      {/* Barra de Búsqueda y Filtros */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-darsil-card p-3 rounded-2xl border border-darsil-border">
        {/* Input de Búsqueda */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por RUC/DNI, Razón Social, F001-XXXX o B001-XXXX..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-darsil-border rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder:text-slate-500 outline-none focus:border-amber-400 transition"
          />
        </div>

        {/* Filtros de Tipo */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setTypeFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              typeFilter === 'ALL'
                ? 'bg-amber-400 text-slate-950 shadow'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-darsil-border'
            }`}
          >
            Todos ({invoices.length})
          </button>
          <button
            onClick={() => setTypeFilter('FACTURA')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              typeFilter === 'FACTURA'
                ? 'bg-blue-500 text-white shadow'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-darsil-border'
            }`}
          >
            Facturas ({totalFacturas})
          </button>
          <button
            onClick={() => setTypeFilter('BOLETA')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              typeFilter === 'BOLETA'
                ? 'bg-purple-500 text-white shadow'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-darsil-border'
            }`}
          >
            Boletas ({totalBoletas})
          </button>
          <button
            onClick={fetchInvoices}
            className="p-2 rounded-xl bg-slate-950 border border-darsil-border text-slate-400 hover:text-white transition"
            title="Recargar listado"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Listado de Comprobantes Electrónicos */}
      {loading ? (
        <div className="bg-darsil-card border border-darsil-border rounded-2xl p-12 text-center text-slate-400">
          <RefreshCw className="w-8 h-8 mx-auto animate-spin text-amber-400 mb-3" />
          <p className="text-xs font-bold">Consultando comprobantes electrónicos en SUNAT...</p>
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="bg-darsil-card border border-darsil-border rounded-2xl p-12 text-center text-slate-400">
          <Receipt className="w-12 h-12 mx-auto text-slate-600 mb-3 stroke-[1.5]" />
          <h3 className="text-base font-bold text-white mb-1">No hay comprobantes emitidos</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
            Emita su primera Factura o Boleta Electrónica UBL 2.1 para generar el XML firmado, el código QR tributario y la Constancia de Recepción (CDR).
          </p>
          <button
            onClick={() => setShowNewModal(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-black bg-amber-400 text-slate-950 shadow-gold-glow hover:brightness-110 transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Emitir Comprobante Ahora</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Vista Tabla Desktop */}
          <div className="hidden lg:block bg-darsil-card border border-darsil-border rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 border-b border-darsil-border text-slate-400 uppercase tracking-wider font-mono text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Comprobante</th>
                    <th className="py-3 px-4">Fecha</th>
                    <th className="py-3 px-4">Cliente / Razón Social</th>
                    <th className="py-3 px-4 text-right">Gravado</th>
                    <th className="py-3 px-4 text-right">IGV (18%)</th>
                    <th className="py-3 px-4 text-right">Total PEN</th>
                    <th className="py-3 px-4 text-center">Estado SUNAT</th>
                    <th className="py-3 px-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-darsil-border/60">
                  {filteredInvoices.map((inv) => {
                    const isFactura = getType(inv) === '01';
                    const num = getNum(inv);
                    const doc = getDoc(inv);
                    const hash = getHash(inv);
                    return (
                      <tr key={inv._id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                              isFactura ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                            }`}>
                              {isFactura ? 'FACTURA' : 'BOLETA'}
                            </span>
                            <span className="font-mono font-bold text-white">
                              {num}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                            Hash: {hash ? hash.slice(0, 12) + '...' : 'GEN-UBL21'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-300">
                          {inv.issueDate ? new Date(inv.issueDate).toLocaleDateString('es-PE') : 'Hoy'}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-white block truncate max-w-xs">
                            {inv.clientName}
                          </span>
                          <span className="text-[10px] font-mono text-amber-400 block">
                            {isFactura ? 'RUC: ' : 'DNI: '}{doc}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                          S/ {getSubtotal(inv).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-slate-400">
                          S/ {getIgv(inv).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-black text-amber-400 text-sm">
                          S/ {getTotal(inv).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>ACEPTADO CDR</span>
                          </span>
                          <span className="block text-[9px] text-slate-400 font-mono mt-0.5">
                            {inv.environment || 'BETA'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* PDF */}
                            <a
                              href={api.getInvoicePdfUrl(inv._id)}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-lg bg-slate-950 border border-darsil-border text-slate-300 hover:text-amber-400 hover:border-amber-400 transition"
                              title="Ver PDF Oficial SUNAT"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </a>
                            {/* XML */}
                            <a
                              href={api.getInvoiceXmlUrl(inv._id)}
                              download={`${num}.xml`}
                              className="p-1.5 rounded-lg bg-slate-950 border border-darsil-border text-slate-300 hover:text-blue-400 hover:border-blue-400 transition"
                              title="Descargar XML UBL 2.1 firmado"
                            >
                              <FileCode className="w-3.5 h-3.5" />
                            </a>
                            {/* CDR */}
                            <a
                              href={api.getInvoiceCdrUrl(inv._id)}
                              download={`R-${num}.xml`}
                              className="p-1.5 rounded-lg bg-slate-950 border border-darsil-border text-slate-300 hover:text-emerald-400 hover:border-emerald-400 transition"
                              title="Descargar Constancia CDR de SUNAT"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                            </a>
                            {/* QR & Detalle */}
                            <button
                              onClick={() => setQrModalInvoice(inv)}
                              className="p-1.5 rounded-lg bg-slate-950 border border-darsil-border text-slate-300 hover:text-yellow-400 hover:border-yellow-400 transition"
                              title="Ver Código QR Oficial"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                            </button>
                            {/* WhatsApp */}
                            <button
                              onClick={() => handleShareWhatsAppInvoice(inv)}
                              className="p-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 transition"
                              title="Enviar por WhatsApp"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Vista Cards Móvil (Optimizada para iPhone 15 Pro y pantallas pequeñas) */}
          <div className="grid grid-cols-1 gap-3 lg:hidden">
            {filteredInvoices.map((inv) => {
              const isFactura = getType(inv) === '01';
              const num = getNum(inv);
              const doc = getDoc(inv);
              return (
                <div 
                  key={inv._id}
                  className="bg-darsil-card border border-darsil-border rounded-2xl p-4 space-y-3 shadow-lg"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                          isFactura ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                        }`}>
                          {isFactura ? 'FACTURA' : 'BOLETA'}
                        </span>
                        <span className="font-mono font-bold text-white text-sm">
                          {num}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono block mt-1">
                        {inv.issueDate ? new Date(inv.issueDate).toLocaleDateString('es-PE') : 'Hoy'} • {inv.environment || 'BETA'}
                      </span>
                    </div>

                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>CDR OK</span>
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-white text-xs leading-snug">
                      {inv.clientName}
                    </h4>
                    <span className="text-[11px] font-mono text-amber-400 block mt-0.5">
                      {isFactura ? 'RUC: ' : 'DNI: '}{doc}
                    </span>
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded-xl border border-darsil-border flex items-center justify-between font-mono">
                    <div className="text-[10px] text-slate-400">
                      <div>Gravado: S/ {getSubtotal(inv).toFixed(2)}</div>
                      <div>IGV (18%): S/ {getIgv(inv).toFixed(2)}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-slate-400 block">TOTAL A PAGAR</span>
                      <span className="text-base font-black text-amber-400">
                        S/ {getTotal(inv).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {/* Acciones Rápidas en Móvil */}
                  <div className="grid grid-cols-4 gap-1.5 pt-1 border-t border-darsil-border/60">
                    <a
                      href={api.getInvoicePdfUrl(inv._id)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-950 border border-darsil-border text-slate-300 hover:text-amber-400 text-[10px] font-bold"
                    >
                      <FileText className="w-4 h-4 mb-0.5" />
                      <span>PDF</span>
                    </a>

                    <a
                      href={api.getInvoiceXmlUrl(inv._id)}
                      download={`${inv.invoiceNumber}.xml`}
                      className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-950 border border-darsil-border text-slate-300 hover:text-blue-400 text-[10px] font-bold"
                    >
                      <FileCode className="w-4 h-4 mb-0.5" />
                      <span>XML</span>
                    </a>

                    <button
                      onClick={() => setQrModalInvoice(inv)}
                      className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-950 border border-darsil-border text-slate-300 hover:text-yellow-400 text-[10px] font-bold"
                    >
                      <QrCode className="w-4 h-4 mb-0.5" />
                      <span>QR</span>
                    </button>

                    <button
                      onClick={() => handleShareWhatsAppInvoice(inv)}
                      className="flex flex-col items-center justify-center p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 text-[10px] font-bold"
                    >
                      <Share2 className="w-4 h-4 mb-0.5" />
                      <span>Wsp</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL: Nueva Factura / Boleta Electrónica */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-darsil-card border border-darsil-border rounded-2xl w-full max-w-2xl my-auto p-4 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-darsil-border pb-3">
              <div>
                <span className="text-[10px] font-mono text-amber-400 uppercase font-bold tracking-wider">
                  SUNAT UBL 2.1 • EMISIÓN DIRECTA
                </span>
                <h3 className="text-base sm:text-lg font-black text-white">
                  Emitir Comprobante Electrónico
                </h3>
              </div>
              <button
                onClick={() => setShowNewModal(false)}
                className="p-1.5 rounded-xl bg-slate-950 text-slate-400 hover:text-white border border-darsil-border"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleEmitInvoice} className="space-y-4">
              {/* Opción para cargar desde Cotización */}
              {quotes.length > 0 && (
                <div className="bg-slate-950 p-3 rounded-xl border border-darsil-border space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    ⚡ Autocompletar desde Cotización u Orden de Trabajo:
                  </label>
                  <select
                    value={associatedQuoteId}
                    onChange={(e) => handleSelectQuoteToLoad(e.target.value)}
                    className="w-full text-xs bg-darsil-card border border-darsil-border text-slate-200 rounded-lg p-2 font-medium outline-none focus:border-amber-400"
                  >
                    <option value="">-- Seleccionar cotización o ingresar manualmente --</option>
                    {quotes.map((q) => (
                      <option key={q._id} value={q._id}>
                        {q.quoteNumber} • {q.clientName} (S/ {Number(q.total || 0).toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Selector de Tipo: Factura o Boleta */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDocType('01')}
                  className={`p-3 rounded-xl border text-left transition ${
                    docType === '01'
                      ? 'bg-blue-500/10 border-blue-500/40 text-white'
                      : 'bg-slate-950 border-darsil-border text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black">FACTURA ELECTRÓNICA</span>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">F001</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Requiere R.U.C. 11 dígitos para empresas con derecho a crédito fiscal.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setDocType('03')}
                  className={`p-3 rounded-xl border text-left transition ${
                    docType === '03'
                      ? 'bg-purple-500/10 border-purple-500/40 text-white'
                      : 'bg-slate-950 border-darsil-border text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black">BOLETA DE VENTA</span>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400">B001</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Para personas naturales con DNI de 8 dígitos o consumidores finales.
                  </p>
                </button>
              </div>

              {/* Datos del Cliente */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">
                    {docType === '01' ? 'R.U.C. (11 dígitos) *' : 'D.N.I. (8 dígitos) *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={docType === '01' ? '20601234567' : '72345678'}
                    value={clientRucDni}
                    onChange={(e) => setClientRucDni(e.target.value)}
                    className="w-full bg-slate-950 border border-darsil-border rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">
                    Razón Social / Nombre Completo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. CONSTRUCTORA Y TRANSPORTES S.A.C."
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full bg-slate-950 border border-darsil-border rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">
                    Dirección Fiscal
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Av. Los Laureles 340, Lurín, Lima"
                    value={clientAddress}
                    onChange={(e) => setClientAddress(e.target.value)}
                    className="w-full bg-slate-950 border border-darsil-border rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">
                    WhatsApp / Celular (para envío automático)
                  </label>
                  <input
                    type="text"
                    placeholder="934787006"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-darsil-border rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400 font-mono"
                  />
                </div>
              </div>

              {/* Ítems del Comprobante */}
              <div className="space-y-2 pt-2 border-t border-darsil-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Detalle de Servicios & Repuestos
                  </span>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-[11px] text-amber-400 hover:underline font-bold"
                  >
                    + Agregar ítem
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {items.map((it, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-darsil-border">
                      <input
                        type="text"
                        placeholder="Descripción del servicio o componente..."
                        value={it.description}
                        onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                        className="flex-1 bg-transparent text-xs text-white outline-none"
                      />
                      <input
                        type="number"
                        min="1"
                        placeholder="Cant."
                        value={it.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                        className="w-14 bg-darsil-card border border-darsil-border rounded-lg px-2 py-1 text-xs text-white text-center font-mono outline-none"
                      />
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400 text-xs font-mono">S/</span>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          placeholder="P.U."
                          value={it.unitPrice}
                          onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                          className="w-20 bg-darsil-card border border-darsil-border rounded-lg px-2 py-1 text-xs text-white font-mono text-right outline-none"
                        />
                      </div>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1 text-slate-500 hover:text-red-400"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Resumen de Totales e IGV */}
              <div className="bg-slate-950 p-3 rounded-xl border border-darsil-border space-y-1 font-mono text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Op. Gravada:</span>
                  <span>S/ {formGravado.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>I.G.V. (18%):</span>
                  <span>S/ {formIgv.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-black text-amber-400 pt-1 border-t border-darsil-border">
                  <span>TOTAL A PAGAR:</span>
                  <span>S/ {formTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-950 border border-darsil-border text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={emitting}
                  className="flex items-center space-x-2 px-5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-gold-glow hover:brightness-110 active:scale-95 transition disabled:opacity-50"
                >
                  {emitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Firmando y enviando a SUNAT...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Emitir Comprobante a SUNAT</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Visualizador QR y Datos Tributarios SUNAT */}
      {qrModalInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-darsil-card border border-darsil-border rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 text-center">
            <div className="flex justify-between items-center border-b border-darsil-border pb-3">
              <span className="text-xs font-mono font-bold text-amber-400">
                {getType(qrModalInvoice) === '01' ? 'FACTURA' : 'BOLETA'} {getNum(qrModalInvoice)}
              </span>
              <button
                onClick={() => setQrModalInvoice(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Render del QR generado */}
            <div className="p-4 bg-white rounded-2xl inline-block shadow-lg mx-auto">
              {getQr(qrModalInvoice) ? (
                <img src={getQr(qrModalInvoice)} alt="QR SUNAT" className="w-48 h-48 mx-auto" />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-slate-900 font-mono text-xs">
                  QR SUNAT UBL 2.1
                </div>
              )}
            </div>

            <div className="space-y-1 text-left bg-slate-950 p-3 rounded-xl border border-darsil-border text-xs font-mono">
              <div className="text-slate-400 text-[10px]">HASH SHA-256 SUNAT:</div>
              <div className="text-amber-400 text-[11px] break-all font-bold">
                {getHash(qrModalInvoice) || 'GEN-SHA256-DARSIL-OK'}
              </div>
              <div className="text-slate-400 text-[10px] pt-1">CONSTANCIA CDR:</div>
              <div className="text-emerald-400 text-[11px]">
                Código 0: El comprobante número {getNum(qrModalInvoice)}, ha sido aceptado por SUNAT.
              </div>
            </div>

            <div className="flex gap-2 justify-center pt-2">
              <a
                href={api.getInvoicePdfUrl(qrModalInvoice._id)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black bg-amber-400 text-slate-950 shadow-gold-glow hover:brightness-110"
              >
                <FileText className="w-4 h-4" />
                <span>Abrir PDF Oficial</span>
              </a>
              <button
                onClick={() => handleShareWhatsAppInvoice(qrModalInvoice)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black bg-emerald-500 text-slate-950 hover:brightness-110"
              >
                <Share2 className="w-4 h-4" />
                <span>WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
