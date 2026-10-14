import React, { useState, useEffect } from 'react';
import {
  Coins,
  FileText,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Send,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Download,
  ShieldCheck,
  Receipt,
  User,
  Truck,
  DollarSign,
  ChevronRight,
  Sparkles,
  RefreshCw,
  Bell,
  X,
  CreditCard,
  Building,
  Check,
  Printer
} from 'lucide-react';
import { api, getApiUrl } from '../services/api';

export default function FinancialManagementView({ quotes = [], onRefreshQuotes }) {
  const [schedules, setSchedules] = useState([]);
  const [metrics, setMetrics] = useState({
    totalReceivable: 0,
    totalCollected: 0,
    totalBalance: 0,
    collectionRate: '0%',
    overdueCount: 0,
    paidCount: 0,
    totalAgreements: 0
  });
  const [loading, setLoading] = useState(true);

  // Filtros y Búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('TODOS');
  const [sortBy, setSortBy] = useState('clientName'); // clientName (A-Z) por defecto
  const [sortOrder, setSortOrder] = useState('asc');

  // Modales
  const [showNewScheduleModal, setShowNewScheduleModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptsModal, setShowReceiptsModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);

  // Formulario Nuevo Acuerdo
  const [selectedQuoteId, setSelectedQuoteId] = useState('');
  const [paymentType, setPaymentType] = useState('EN_PARTES'); // EN_PARTES o PAGO_UNICO
  const [numberOfInstallments, setNumberOfInstallments] = useState(2);
  const [customInstallments, setCustomInstallments] = useState([]);
  const [customClauses, setCustomClauses] = useState([
    {
      title: 'PRIMERA: OBJETO DEL SERVICIO & ALCANCE TÉCNICO',
      content: 'El presente contrato regula los servicios especializados de diagnóstico, reparación y provisión de repuestos ejecutados por DARSIL AUTOMOTIVE SOLUTIONS S.A.C.'
    },
    {
      title: 'SEGUNDA: CONDICIONES DE PAGO ACORDADAS',
      content: 'Ambas partes pactan que los pagos se realizarán estrictamente en las fechas programadas en el cronograma. Los abonos deben realizarse en las cuentas corrientes autorizadas.'
    },
    {
      title: 'TERCERA: ENTREGA DE LA UNIDAD Y GARANTÍA DE RETENCIÓN',
      content: 'La entrega del vehículo se realizará conforme al cumplimiento del cronograma pactado. La empresa se reserva el derecho legal de retención ante incumplimiento de cuotas.'
    },
    {
      title: 'CUARTA: GARANTÍA TÉCNICA DARSIL',
      content: 'DARSIL otorga garantía técnica sobre los trabajos realizados, condicionada al cumplimiento total de los abonos acordados.'
    }
  ]);
  const [savingSchedule, setSavingSchedule] = useState(false);

  // Formulario Registro de Abono
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('TRANSFERENCIA_BCP');
  const [operationNumber, setOperationNumber] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [savingPayment, setSavingPayment] = useState(false);

  // Feedback y Notificaciones
  const [actionNotice, setActionNotice] = useState(null);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const res = await api.getFinancialSchedules({
        search: searchTerm,
        status: statusFilter,
        sortBy,
        order: sortOrder
      });
      if (res?.success) {
        setSchedules(res.data || []);
        if (res.metrics) setMetrics(res.metrics);
      }
    } catch (err) {
      console.error('Error cargando cronogramas financieros:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, [statusFilter, sortBy, sortOrder]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchSchedules();
  };

  // Preparar cuotas automáticas al seleccionar cotización o cambiar número de cuotas
  useEffect(() => {
    if (!selectedQuoteId) return;
    const q = quotes.find(item => item._id === selectedQuoteId);
    if (!q) return;

    const total = Number(q.total) || 0;
    const count = paymentType === 'PAGO_UNICO' ? 1 : numberOfInstallments;
    const splitAmount = Math.floor((total / count) * 100) / 100;
    const remainder = Math.round((total - (splitAmount * count)) * 100) / 100;

    const newInsts = [];
    const baseDate = new Date();
    for (let i = 0; i < count; i++) {
      const dueDate = new Date(baseDate);
      dueDate.setDate(dueDate.getDate() + (i + 1) * 15); // Cada 15 días
      const amount = (i === count - 1) ? Number((splitAmount + remainder).toFixed(2)) : splitAmount;

      newInsts.push({
        installmentNumber: i + 1,
        amount,
        dueDate: dueDate.toISOString().split('T')[0],
        notes: `Cuota N° ${i + 1}`
      });
    }
    setCustomInstallments(newInsts);
  }, [selectedQuoteId, paymentType, numberOfInstallments]);

  // Guardar Nuevo Acuerdo
  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    if (!selectedQuoteId) {
      alert('Por favor seleccione una cotización');
      return;
    }

    try {
      setSavingSchedule(true);
      const res = await api.createFinancialSchedule({
        quoteId: selectedQuoteId,
        paymentType,
        installments: customInstallments,
        clauses: customClauses
      });

      if (res?.success) {
        setActionNotice({
          type: 'success',
          msg: `¡Contrato ${res.data.contractNumber} generado con éxito! El bot envió la notificación y cronograma PDF por WhatsApp.`
        });
        setShowNewScheduleModal(false);
        setSelectedQuoteId('');
        fetchSchedules();
        if (onRefreshQuotes) onRefreshQuotes();
      } else {
        alert(res?.message || 'Error creando cronograma');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSavingSchedule(false);
    }
  };

  // Registrar Abono
  const handleRegisterPayment = async (e) => {
    e.preventDefault();
    if (!selectedSchedule || !paymentAmount || Number(paymentAmount) <= 0) {
      alert('Ingrese un monto válido mayor a 0');
      return;
    }

    try {
      setSavingPayment(true);
      const res = await api.registerPaymentSchedule(selectedSchedule._id, {
        amount: Number(paymentAmount),
        paymentMethod,
        operationNumber,
        notes: paymentNotes
      });

      if (res?.success) {
        const isPaid = res.data?.isFullyPaid;
        setActionNotice({
          type: 'success',
          msg: isPaid
            ? `🎉 ¡SERVICIO 100% CANCELADO! Recibo ${res.data.receiptNumber} generado y Certificado de Paz y Salvo emitido por WhatsApp.`
            : `✅ Abono de S/ ${Number(paymentAmount).toFixed(2)} registrado (Recibo ${res.data.receiptNumber}). WhatsApp enviado con el recibo digital adjunto.`
        });
        setShowPaymentModal(false);
        setPaymentAmount('');
        setOperationNumber('');
        setPaymentNotes('');
        fetchSchedules();
        if (onRefreshQuotes) onRefreshQuotes();
      } else {
        alert(res?.message || 'Error registrando abono');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSavingPayment(false);
    }
  };

  // Enviar Recordatorio Amigable
  const handleSendReminder = async (sched, idx = 0) => {
    try {
      const res = await api.sendScheduleReminder(sched._id, idx);
      if (res?.success) {
        setActionNotice({
          type: 'info',
          msg: `📲 Recordatorio preventivo amigable enviado a ${sched.clientName} (${sched.clientPhone}) por WhatsApp.`
        });
        fetchSchedules();
      } else {
        alert(res?.message || 'No se pudo enviar el recordatorio');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  // Enviar Alerta al Asesor
  const handleSendAdvisorAlert = async (sched) => {
    try {
      const res = await api.sendAdvisorAlert(sched._id);
      if (res?.success) {
        setActionNotice({
          type: 'warning',
          msg: `🚨 Alerta interna de cobranza enviada al asesor técnico por WhatsApp.`
        });
        fetchSchedules();
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  // Reenviar Contrato por WhatsApp
  const handleResendContract = async (sched) => {
    try {
      const res = await api.resendContractWhatsApp(sched._id);
      if (res?.success) {
        setActionNotice({
          type: 'success',
          msg: `📄 Contrato ${sched.contractNumber} enviado por WhatsApp a ${sched.clientPhone} con su PDF adjunto.`
        });
        fetchSchedules();
      } else {
        alert(res?.message || 'Error enviando contrato por WhatsApp');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  // Reenviar Paz y Salvo por WhatsApp
  const handleResendPazYSalvo = async (sched) => {
    try {
      const res = await api.resendPazYSalvoWhatsApp(sched._id);
      if (res?.success) {
        setActionNotice({
          type: 'success',
          msg: `🛡️ Constancia Oficial de Paz y Salvo enviada por WhatsApp a ${sched.clientPhone}.`
        });
        fetchSchedules();
      } else {
        alert(res?.message || 'Error enviando Paz y Salvo por WhatsApp');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  // Reenviar Recibo de Caja por WhatsApp
  const handleResendReceipt = async (sched, receiptIndex) => {
    try {
      const res = await api.resendReceiptWhatsApp(sched._id, receiptIndex);
      if (res?.success) {
        setActionNotice({
          type: 'success',
          msg: `🧾 Recibo de caja enviado exitosamente por WhatsApp a ${sched.clientPhone}.`
        });
        fetchSchedules();
      } else {
        alert(res?.message || 'Error enviando recibo por WhatsApp');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  // Cotizaciones elegibles (no deben tener ya un cronograma activo)
  const existingQuoteIds = new Set(schedules.map(s => String(s.quoteId)));
  const availableQuotes = quotes.filter(q => !existingQuoteIds.has(String(q._id)));

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* Encabezado Principal */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-darsil-card via-slate-900 to-darsil-card p-4 sm:p-6 rounded-2xl border border-darsil-border shadow-xl">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20 flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5" />
              GESTIÓN FINANCIERA & COBRANZAS
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
              {sortBy === 'clientName' 
                ? 'ORDENAMIENTO ALFABÉTICO (A - Z)' 
                : sortBy === 'createdAt' 
                ? 'ORDEN CRONOLÓGICO (TIEMPO DE GENERACIÓN)' 
                : sortBy === 'contractNumber'
                ? 'ORDEN POR N° DE CONTRATO'
                : 'ORDEN PERSONALIZADO'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <CreditCard className="w-7 h-7 text-amber-400 shrink-0" />
            Cuentas por Cobrar & Cronograma de Pagos
          </h1>
          <p className="text-xs text-slate-400 max-w-3xl">
            Control cronológico de cuotas y acuerdos comerciales pactados por el asesor técnico. Registro de abonos, emisión de contratos con cláusulas legales, recibos de caja digitales y constancias de Paz y Salvo automáticas con el Bot.
          </p>
        </div>

        {/* Botón Acción Principal */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewScheduleModal(true)}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:brightness-110 active:scale-95 transition"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Nuevo Acuerdo & Contrato</span>
          </button>
        </div>
      </div>

      {/* Alerta / Notificación de Acción */}
      {actionNotice && (
        <div className={`p-4 rounded-xl text-xs flex items-center justify-between gap-3 shadow-lg animate-in slide-in-from-top-2 ${
          actionNotice.type === 'success' ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300' :
          actionNotice.type === 'warning' ? 'bg-red-500/15 border border-red-500/30 text-red-300' :
          'bg-blue-500/15 border border-blue-500/30 text-blue-300'
        }`}>
          <div className="flex items-center gap-2">
            {actionNotice.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />}
            {actionNotice.type === 'warning' && <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />}
            {actionNotice.type === 'info' && <Send className="w-4 h-4 shrink-0 text-blue-400" />}
            <span className="font-semibold">{actionNotice.msg}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="text-slate-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tarjetas de Métricas Ejecutivas (KPIs Financieros) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Total Facturado / Por Cobrar */}
        <div className="bg-darsil-card border border-darsil-border p-4 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="flex justify-between items-center text-slate-400 text-xs font-bold uppercase mb-1">
            <span>Cartera Total Acordada</span>
            <Building className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-lg sm:text-2xl font-black text-white font-mono">
            S/ {Number(metrics.totalReceivable || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 font-mono">
            {metrics.totalAgreements} acuerdos formalizados
          </div>
          <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-blue-500/5 rounded-full blur-xl pointer-events-none"></div>
        </div>

        {/* Total Recaudado */}
        <div className="bg-darsil-card border border-darsil-border p-4 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="flex justify-between items-center text-slate-400 text-xs font-bold uppercase mb-1">
            <span>Cobrado / Abonado</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg sm:text-2xl font-black text-emerald-400 font-mono">
            S/ {Number(metrics.totalCollected || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-emerald-500 font-bold mt-1">
            {metrics.collectionRate} recupero de cartera
          </div>
          <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-emerald-500/5 rounded-full blur-xl pointer-events-none"></div>
        </div>

        {/* Saldo Pendiente de Cobro */}
        <div className="bg-darsil-card border border-darsil-border p-4 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="flex justify-between items-center text-slate-400 text-xs font-bold uppercase mb-1">
            <span>Saldo Pendiente</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-lg sm:text-2xl font-black text-amber-400 font-mono">
            S/ {Number(metrics.totalBalance || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-amber-500/80 font-mono mt-1">
            {metrics.paidCount} clientes al día 100%
          </div>
          <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-amber-500/5 rounded-full blur-xl pointer-events-none"></div>
        </div>

        {/* Cuentas Vencidas / En Mora */}
        <div className="bg-darsil-card border border-darsil-border p-4 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="flex justify-between items-center text-slate-400 text-xs font-bold uppercase mb-1">
            <span>Cuotas en Mora</span>
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-lg sm:text-2xl font-black text-red-400 font-mono">
            {metrics.overdueCount} {metrics.overdueCount === 1 ? 'Cliente' : 'Clientes'}
          </div>
          <div className="text-[10px] text-red-400/80 font-medium mt-1">
            Requiere gestión de cobranza
          </div>
          <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-red-500/5 rounded-full blur-xl pointer-events-none"></div>
        </div>

      </div>

      {/* Barra de Filtros, Búsqueda y Ordenamiento A-Z */}
      <div className="bg-darsil-card border border-darsil-border p-4 rounded-2xl shadow-lg space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          
          {/* Formulario de Búsqueda */}
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por cliente (A-Z), RUC, placa o contrato..."
              className="w-full bg-slate-950 border border-darsil-border rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-400 transition"
            />
          </form>

          {/* Selector de Ordenamiento */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
            {/* Botones de Acceso Rápido */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-darsil-border">
              <button
                type="button"
                onClick={() => { setSortBy('clientName'); setSortOrder('asc'); }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                  sortBy === 'clientName' 
                    ? 'bg-amber-400 text-slate-950 shadow font-black' 
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Ordenar alfabéticamente por cliente de A a Z"
              >
                <span>🔤</span>
                <span>Alfabético A-Z</span>
              </button>
              <button
                type="button"
                onClick={() => { setSortBy('createdAt'); setSortOrder('desc'); }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                  sortBy === 'createdAt' 
                    ? 'bg-amber-400 text-slate-950 shadow font-black' 
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Ordenar por tiempo de generación del contrato (más recientes primero)"
              >
                <span>⏱️</span>
                <span>Por Tiempo</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  if (e.target.value === 'createdAt' || e.target.value === 'contractNumber' || e.target.value === 'balance') {
                    setSortOrder('desc');
                  } else {
                    setSortOrder('asc');
                  }
                }}
                className="bg-slate-950 border border-darsil-border text-white text-xs font-bold rounded-xl px-3 py-1.5 outline-none focus:border-amber-400 cursor-pointer"
              >
                <option value="clientName">Cliente (Alfabético A - Z)</option>
                <option value="createdAt">Tiempo Generación Contrato</option>
                <option value="contractNumber">N° Contrato Oficial (CP)</option>
                <option value="plate">Placa del Vehículo</option>
                <option value="balance">Mayor Saldo Pendiente</option>
              </select>
              <button
                type="button"
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                title={sortOrder === 'asc' ? 'Orden Ascendente (Click para Descendente)' : 'Orden Descendente (Click para Ascendente)'}
                className="bg-slate-950 border border-darsil-border p-2 rounded-xl text-slate-300 hover:text-white transition flex items-center gap-1"
              >
                <ArrowUpDown className={`w-3.5 h-3.5 ${sortOrder === 'desc' ? 'rotate-180 text-amber-400' : 'text-slate-400'}`} />
                <span className="text-[10px] font-mono font-bold text-slate-400">{sortOrder.toUpperCase()}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Píldoras de Filtro por Estado */}
        <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-800/60">
          {[
            { id: 'TODOS', label: 'Todos los Acuerdos' },
            { id: 'EN_CRONOGRAMA', label: 'En Cronograma' },
            { id: 'PAGO_PARCIAL', label: 'Con Abono Parcial' },
            { id: 'PAGADO', label: '100% Cancelados' },
            { id: 'VENCIDO', label: 'En Mora / Vencidos' }
          ].map(p => (
            <button
              key={p.id}
              onClick={() => setStatusFilter(p.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                statusFilter === p.id 
                  ? 'bg-amber-400 text-slate-950 shadow-md font-black' 
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-darsil-border'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista Principal de Acuerdos Comerciales (Orden Alfabético) */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-darsil-card border border-darsil-border p-12 rounded-2xl text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-amber-400 mx-auto mb-3" />
            <span className="text-xs text-slate-400 font-bold">Cargando cuentas por cobrar ordenadas alfabéticamente...</span>
          </div>
        ) : schedules.length === 0 ? (
          <div className="bg-darsil-card border border-darsil-border p-12 rounded-2xl text-center space-y-3">
            <Coins className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">No hay acuerdos financieros registrados</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Comienza acordando un cronograma de pago único o fraccionado a partir de una cotización aprobada.
            </p>
            <button
              onClick={() => setShowNewScheduleModal(true)}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold bg-amber-400 text-slate-950 hover:brightness-110 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Generar Primer Acuerdo & Contrato</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {schedules.map((sched) => {
              const isPaid = sched.status === 'PAGADO' || sched.balance <= 0;
              const isOverdue = sched.status === 'VENCIDO';
              const progressPct = sched.totalAmount > 0 
                ? Math.min(100, Math.round((sched.paidAmount / sched.totalAmount) * 100)) 
                : 100;
              const nextUnpaidInstallment = (sched.installments || []).find(i => !i.isPaid);

              return (
                <div 
                  key={sched._id}
                  className={`bg-darsil-card border rounded-2xl p-4 sm:p-5 transition hover:border-amber-400/50 shadow-xl ${
                    isOverdue ? 'border-red-500/40 bg-red-950/10' : 
                    isPaid ? 'border-emerald-500/40 bg-emerald-950/10' : 
                    'border-darsil-border'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    
                    {/* Columna Izquierda: Identidad Cliente (A-Z) y Vehículo */}
                    <div className="space-y-2 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono font-black text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-md border border-amber-400/20">
                          {sched.contractNumber}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                          Cotización: {sched.quoteNumber}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          isPaid ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' :
                          isOverdue ? 'bg-red-500/15 border-red-500/30 text-red-400 animate-pulse' :
                          'bg-amber-500/15 border-amber-500/30 text-amber-300'
                        }`}>
                          {isPaid ? '100% CANCELADO' : isOverdue ? 'CUOTA VENCIDA EN MORA' : 'PAGO EN CRONOGRAMA'}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                          Modalidad: {sched.paymentType === 'PAGO_UNICO' ? 'Pago Único' : `${sched.installments?.length || 2} Cuotas`}
                        </span>
                      </div>

                      {/* Nombre del Cliente en Grande (Orden Alfabético) */}
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-white shrink-0">
                          {sched.clientName?.charAt(0)?.toUpperCase() || 'C'}
                        </div>
                        <div className="min-w-0">
                          <h2 className="text-base font-black text-white truncate">
                            {sched.clientName}
                          </h2>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 font-mono">
                            <span>RUC/DNI: <strong className="text-slate-200">{sched.clientDoc || 'S/N'}</strong></span>
                            <span>Tel: <strong className="text-slate-200">{sched.clientPhone || '934787006'}</strong></span>
                            <span className="text-amber-400 flex items-center gap-1 font-bold">
                              <Truck className="w-3.5 h-3.5 shrink-0" />
                              {sched.plate || 'POR ASIGNAR'} ({sched.model || 'Unidad'})
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Columna Central: Resumen Financiero y Barra de Progreso */}
                    <div className="bg-slate-950 p-3.5 rounded-xl border border-darsil-border space-y-2 w-full lg:w-80 shrink-0">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Monto Total:</span>
                        <span className="font-mono font-bold text-white">S/ {Number(sched.totalAmount).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-emerald-400 font-medium">Abonado a la Fecha:</span>
                        <span className="font-mono font-bold text-emerald-400">S/ {Number(sched.paidAmount).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs border-t border-slate-800 pt-1 font-bold">
                        <span className={isPaid ? 'text-emerald-400' : 'text-red-400'}>
                          {isPaid ? 'Saldo Total:' : 'Saldo Pendiente:'}
                        </span>
                        <span className={`font-mono text-sm ${isPaid ? 'text-emerald-400' : 'text-red-400'}`}>
                          S/ {Number(sched.balance).toFixed(2)}
                        </span>
                      </div>

                      {/* Barra de Progreso */}
                      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 rounded-full ${
                            isPaid ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-500 to-emerald-400'
                          }`}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-right font-mono text-slate-400">
                        {progressPct}% pagado ({sched.payments?.length || 0} abonos)
                      </div>
                    </div>

                    {/* Columna Derecha: Acciones Rápidas */}
                    <div className="flex flex-row lg:flex-col gap-2 shrink-0 justify-end">
                      {!isPaid && (
                        <button
                          onClick={() => {
                            setSelectedSchedule(sched);
                            setShowPaymentModal(true);
                          }}
                          className="flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 hover:brightness-110 active:scale-95 transition shadow-md"
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Registrar Abono</span>
                        </button>
                      )}

                      <div className="flex items-center gap-1.5">
                        {/* Contrato PDF */}
                        <a
                          href={api.getContractPdfUrl(sched._id)}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 flex items-center justify-center space-x-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-slate-900 border border-slate-700 text-slate-200 hover:text-white hover:border-slate-500 transition"
                        >
                          <FileText className="w-3 h-3 text-blue-400" />
                          <span>Contrato</span>
                        </a>

                        {/* Recibos Emitidos */}
                        <button
                          onClick={() => {
                            setSelectedSchedule(sched);
                            setShowReceiptsModal(true);
                          }}
                          className="flex-1 flex items-center justify-center space-x-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-slate-900 border border-slate-700 text-slate-200 hover:text-white hover:border-slate-500 transition"
                        >
                          <Receipt className="w-3 h-3 text-amber-400" />
                          <span>Recibos ({sched.payments?.length || 0})</span>
                        </button>

                        {/* Paz y Salvo Oficial (Si está cancelado) */}
                        {isPaid && (
                          <a
                            href={api.getPazYSalvoPdfUrl(sched._id)}
                            target="_blank"
                            rel="noreferrer"
                            className="flex-1 flex items-center justify-center space-x-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 hover:brightness-110 transition"
                          >
                            <ShieldCheck className="w-3 h-3 text-emerald-400" />
                            <span>Paz y Salvo</span>
                          </a>
                        )}
                      </div>

                      {/* Acciones de WhatsApp Bot */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <button
                          onClick={() => handleResendContract(sched)}
                          className="flex-1 flex items-center justify-center space-x-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-900 border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 transition"
                          title="Enviar o reenviar Contrato por WhatsApp"
                        >
                          <Send className="w-2.5 h-2.5" />
                          <span>{isPaid ? 'Contrato Pagado' : 'Enviar Contrato'}</span>
                        </button>

                        {isPaid && (
                          <button
                            onClick={() => handleResendPazYSalvo(sched)}
                            className="flex-1 flex items-center justify-center space-x-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/20 transition"
                            title="Enviar Constancia de Paz y Salvo por WhatsApp"
                          >
                            <ShieldCheck className="w-2.5 h-2.5" />
                            <span>Paz y Salvo</span>
                          </button>
                        )}

                        {!isPaid && nextUnpaidInstallment && (
                          <button
                            onClick={() => handleSendReminder(sched, 0)}
                            className="flex-1 flex items-center justify-center space-x-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-900 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 transition"
                            title="Enviar recordatorio amigable por WhatsApp"
                          >
                            <Send className="w-2.5 h-2.5" />
                            <span>Recordar Cuota</span>
                          </button>
                        )}
                        {isOverdue && (
                          <button
                            onClick={() => handleSendAdvisorAlert(sched)}
                            className="flex-1 flex items-center justify-center space-x-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-red-950/60 border border-red-500/40 text-red-300 hover:bg-red-500/20 transition"
                            title="Alerta de mora interna"
                          >
                            <Bell className="w-2.5 h-2.5" />
                            <span>Alerta Asesor</span>
                          </button>
                        )}
                      </div>
                    </div>

                  </div>

                  {/* Tabla Desplegada de Cuotas Cronológicas */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                      Cronograma Cronológico de Cuotas Acordadas:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                      {(sched.installments || []).map((inst) => {
                        const dueDate = new Date(inst.dueDate);
                        const isInstOverdue = !inst.isPaid && dueDate < new Date();
                        const isNearDue = !inst.isPaid && !isInstOverdue && (dueDate - new Date() < 3 * 86400000);

                        return (
                          <div 
                            key={inst._id || inst.installmentNumber}
                            className={`p-2.5 rounded-xl border text-xs flex flex-col justify-between ${
                              inst.isPaid ? 'bg-emerald-500/5 border-emerald-500/20 text-slate-300' :
                              isInstOverdue ? 'bg-red-500/10 border-red-500/30 text-red-200' :
                              isNearDue ? 'bg-amber-500/10 border-amber-500/30 text-amber-200' :
                              'bg-slate-950 border-slate-800 text-slate-300'
                            }`}
                          >
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-bold text-[11px]">Cuota {inst.installmentNumber}</span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                inst.isPaid ? 'bg-emerald-500/20 text-emerald-400' :
                                isInstOverdue ? 'bg-red-500/20 text-red-400 font-black' :
                                'bg-slate-800 text-slate-400'
                              }`}>
                                {inst.isPaid ? 'PAGADO' : isInstOverdue ? 'VENCIDO' : 'PENDIENTE'}
                              </span>
                            </div>
                            <div className="font-mono font-bold text-sm text-white">
                              S/ {Number(inst.amount).toFixed(2)}
                            </div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-1">
                              <Calendar className="w-3 h-3" />
                              <span>Vence: {dueDate.toLocaleDateString('es-PE')}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL 1: Crear Nuevo Acuerdo & Contrato */}
      {showNewScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-darsil-card border border-darsil-border rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-4 my-8">
            <div className="flex justify-between items-center border-b border-darsil-border pb-3">
              <div>
                <span className="text-[10px] font-mono text-amber-400 font-bold uppercase">
                  CONVENIO FINANCIERO COMERCIAL
                </span>
                <h3 className="text-base font-black text-white">
                  Generar Nuevo Contrato & Cronograma de Pagos
                </h3>
              </div>
              <button onClick={() => setShowNewScheduleModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSchedule} className="space-y-4 text-xs">
              
              {/* Selección de Cotización */}
              <div>
                <label className="font-bold text-slate-300 block mb-1">
                  Seleccionar Cotización Aprobada:
                </label>
                <select
                  value={selectedQuoteId}
                  onChange={(e) => setSelectedQuoteId(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-darsil-border rounded-xl px-3 py-2 text-white font-medium outline-none focus:border-amber-400"
                >
                  <option value="">-- Seleccione una cotización --</option>
                  {availableQuotes.map(q => (
                    <option key={q._id} value={q._id}>
                      {q.quoteNumber} • {q.clientName} (Placa: {q.plate || 'S/P'}) - Total: S/ {Number(q.total).toFixed(2)}
                    </option>
                  ))}
                </select>
                {availableQuotes.length === 0 && (
                  <p className="text-[10px] text-amber-400 mt-1">
                    * No hay cotizaciones pendientes de cronograma. Todas tienen contrato o cree una nueva.
                  </p>
                )}
              </div>

              {/* Modalidad de Pago */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Modalidad de Pago:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentType('PAGO_UNICO')}
                      className={`p-2 rounded-xl border text-center font-bold transition ${
                        paymentType === 'PAGO_UNICO' 
                          ? 'bg-amber-400 text-slate-950 border-amber-400' 
                          : 'bg-slate-950 text-slate-300 border-slate-700'
                      }`}
                    >
                      Pago Único
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentType('EN_PARTES')}
                      className={`p-2 rounded-xl border text-center font-bold transition ${
                        paymentType === 'EN_PARTES' 
                          ? 'bg-amber-400 text-slate-950 border-amber-400' 
                          : 'bg-slate-950 text-slate-300 border-slate-700'
                      }`}
                    >
                      Fraccionado (Cuotas)
                    </button>
                  </div>
                </div>

                {paymentType === 'EN_PARTES' && (
                  <div>
                    <label className="font-bold text-slate-300 block mb-1">Número de Cuotas:</label>
                    <select
                      value={numberOfInstallments}
                      onChange={(e) => setNumberOfInstallments(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-darsil-border rounded-xl px-3 py-2 text-white font-bold outline-none focus:border-amber-400"
                    >
                      <option value={2}>2 Cuotas (50% / 50%)</option>
                      <option value={3}>3 Cuotas</option>
                      <option value={4}>4 Cuotas</option>
                      <option value={5}>5 Cuotas</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Cronograma Detallado Configurable */}
              {customInstallments.length > 0 && (
                <div className="space-y-2 bg-slate-950 p-3.5 rounded-xl border border-darsil-border">
                  <span className="font-bold text-slate-300 block text-[11px] uppercase">
                    Configuración de Fechas e Importes de Cuotas:
                  </span>
                  <div className="space-y-2">
                    {customInstallments.map((inst, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-3 text-slate-400 font-bold">
                          Cuota N° {inst.installmentNumber}:
                        </div>
                        <div className="col-span-4">
                          <input
                            type="number"
                            step="0.01"
                            value={inst.amount}
                            onChange={(e) => {
                              const updated = [...customInstallments];
                              updated[idx].amount = Number(e.target.value);
                              setCustomInstallments(updated);
                            }}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono font-bold"
                          />
                        </div>
                        <div className="col-span-5">
                          <input
                            type="date"
                            value={inst.dueDate}
                            onChange={(e) => {
                              const updated = [...customInstallments];
                              updated[idx].dueDate = e.target.value;
                              setCustomInstallments(updated);
                            }}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cláusulas Contractuales */}
              <div className="space-y-2">
                <span className="font-bold text-slate-300 block text-[11px] uppercase">
                  Cláusulas Legales & Técnicas del Contrato:
                </span>
                <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                  {customClauses.map((c, i) => (
                    <div key={i} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1">
                      <div className="font-bold text-amber-400 text-[10px]">{c.title}</div>
                      <p className="text-[10px] text-slate-400 leading-relaxed">{c.content}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="flex justify-end gap-2 pt-3 border-t border-darsil-border">
                <button
                  type="button"
                  onClick={() => setShowNewScheduleModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingSchedule}
                  className="flex items-center space-x-2 px-5 py-2.5 rounded-xl font-bold bg-amber-400 text-slate-950 hover:brightness-110 active:scale-95 transition disabled:opacity-50"
                >
                  {savingSchedule ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  <span>Emitir Contrato & Notificar por WhatsApp</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Registrar Abono & Emitir Recibo de Caja Digital */}
      {showPaymentModal && selectedSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-darsil-card border border-darsil-border rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-darsil-border pb-3">
              <div>
                <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase">
                  CAJA CENTRAL & TESORERÍA
                </span>
                <h3 className="text-base font-black text-white">
                  Registrar Abono a Cuenta
                </h3>
              </div>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterPayment} className="space-y-3.5 text-xs">
              
              <div className="bg-slate-950 p-3 rounded-xl border border-darsil-border space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Cliente:</span>
                  <strong className="text-white truncate max-w-[200px]">{selectedSchedule.clientName}</strong>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Unidad / Placa:</span>
                  <strong className="text-amber-400">{selectedSchedule.plate} ({selectedSchedule.model})</strong>
                </div>
                <div className="flex justify-between text-slate-400 border-t border-slate-800 pt-1">
                  <span>Saldo Pendiente Actual:</span>
                  <strong className="text-red-400 font-mono font-black text-sm">
                    S/ {Number(selectedSchedule.balance).toFixed(2)}
                  </strong>
                </div>
              </div>

              {/* Monto del Abono */}
              <div>
                <label className="font-bold text-slate-300 block mb-1">Monto a Abonar (S/):</label>
                <input
                  type="number"
                  step="0.01"
                  max={selectedSchedule.balance}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder={`Máximo S/ ${Number(selectedSchedule.balance).toFixed(2)}`}
                  required
                  className="w-full bg-slate-950 border border-darsil-border rounded-xl px-3 py-2 text-base font-mono font-black text-emerald-400 outline-none focus:border-emerald-400"
                />
              </div>

              {/* Medio de Pago */}
              <div>
                <label className="font-bold text-slate-300 block mb-1">Medio de Pago:</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-slate-950 border border-darsil-border rounded-xl px-3 py-2 text-white font-medium outline-none focus:border-emerald-400"
                >
                  <option value="TRANSFERENCIA_BCP">Transferencia BCP (Cta. Cte.)</option>
                  <option value="TRANSFERENCIA_BBVA">Transferencia BBVA Continental</option>
                  <option value="TRANSFERENCIA_INTERBANK">Transferencia Interbank</option>
                  <option value="YAPE_PLIN">Yape / Plin Comercial (934787006)</option>
                  <option value="EFECTIVO">Efectivo en Caja Taller</option>
                  <option value="TARJETA_POS">Tarjeta Débito / Crédito POS</option>
                  <option value="CHEQUE">Cheque Bancario</option>
                </select>
              </div>

              {/* N° Operación / Voucher */}
              <div>
                <label className="font-bold text-slate-300 block mb-1">N° de Operación o Voucher:</label>
                <input
                  type="text"
                  value={operationNumber}
                  onChange={(e) => setOperationNumber(e.target.value)}
                  placeholder="Ej. OP-4892184 o N° Voucher"
                  className="w-full bg-slate-950 border border-darsil-border rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-emerald-400"
                />
              </div>

              {/* Notas */}
              <div>
                <label className="font-bold text-slate-300 block mb-1">Notas u Observaciones:</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Ej. Pago correspondiente a Cuota 1 contra entrega"
                  className="w-full bg-slate-950 border border-darsil-border rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-400"
                />
              </div>

              {/* Aviso Automático del Bot */}
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-[10px] flex items-center gap-2">
                <Send className="w-3.5 h-3.5 shrink-0" />
                <span>Al registrar, el Bot despachará el Recibo de Caja Digital en PDF automáticamente al WhatsApp del cliente ({selectedSchedule.clientPhone}).</span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-darsil-border">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingPayment}
                  className="flex items-center space-x-2 px-5 py-2.5 rounded-xl font-black bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 hover:brightness-110 active:scale-95 transition disabled:opacity-50"
                >
                  {savingPayment ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 stroke-[3]" />}
                  <span>Acreditar Abono & Emitir Recibo</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Historial de Recibos de Caja Emitidos */}
      {showReceiptsModal && selectedSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-darsil-card border border-darsil-border rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-darsil-border pb-3">
              <div>
                <span className="text-[10px] font-mono text-amber-400 font-bold uppercase">
                  HISTORIAL DE ABONOS REGISTRADOS
                </span>
                <h3 className="text-base font-black text-white">
                  Recibos de Caja Digitales
                </h3>
              </div>
              <button onClick={() => setShowReceiptsModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {(selectedSchedule.payments || []).length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  No se han registrado abonos para este contrato todavía.
                </div>
              ) : (
                selectedSchedule.payments.map((p, idx) => (
                  <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                    <div>
                      <div className="font-mono font-bold text-amber-400">{p.receiptNumber}</div>
                      <div className="text-[11px] text-slate-300 font-bold">
                        {p.paymentMethod?.replace('_', ' ')} • Op: {p.operationNumber || 'S/N'}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {new Date(p.paymentDate).toLocaleString('es-PE')}
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="font-mono font-black text-emerald-400 text-sm">
                        S/ {Number(p.amount).toFixed(2)}
                      </div>
                      <div className="flex items-center gap-2 justify-end">
                        <a
                          href={api.getReceiptPdfUrl(selectedSchedule._id, idx)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] text-blue-400 hover:underline font-bold"
                        >
                          <Printer className="w-3 h-3" />
                          <span>Ver Recibo</span>
                        </a>
                        <button
                          onClick={() => handleResendReceipt(selectedSchedule, idx)}
                          className="inline-flex items-center gap-1 text-[10px] text-emerald-400 hover:text-emerald-300 font-bold px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 hover:bg-emerald-500/20 transition"
                          title="Enviar este recibo digital por WhatsApp"
                        >
                          <Send className="w-2.5 h-2.5" />
                          <span>WhatsApp</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-darsil-border">
              <button
                onClick={() => setShowReceiptsModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 border border-slate-700 text-white hover:bg-slate-800"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
