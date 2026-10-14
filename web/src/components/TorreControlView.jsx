import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Search, 
  RefreshCw, 
  ArrowRight, 
  ArrowLeft, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Wrench, 
  Cpu, 
  Send, 
  Share2, 
  ExternalLink, 
  Car, 
  User, 
  Calendar, 
  ShieldCheck, 
  Gauge, 
  BatteryCharging, 
  Sliders, 
  Fuel, 
  X, 
  Check, 
  ChevronRight, 
  FileText,
  Sparkles,
  Zap,
  Phone,
  GripVertical,
  Archive,
  CheckSquare,
  History,
  RotateCcw,
  Download,
  Eye
} from 'lucide-react';
import { api } from '../services/api';

const STAGES = [
  { id: 'RECEPCIONADO', label: '1. Recepción & Check-In', short: 'Recepción', color: 'border-sky-500/40 bg-sky-500/10 text-sky-400', badgeColor: 'bg-sky-500/20 text-sky-300' },
  { id: 'EN_DIAGNOSTICO', label: '2. Diagnóstico & Escaneo 24V', short: 'Diagnóstico', color: 'border-amber-500/40 bg-amber-500/10 text-amber-400', badgeColor: 'bg-amber-500/20 text-amber-300' },
  { id: 'ESPERA_REPUESTOS', label: '3. Cotización & Repuestos', short: 'Repuestos', color: 'border-orange-500/40 bg-orange-500/10 text-orange-400', badgeColor: 'bg-orange-500/20 text-orange-300' },
  { id: 'EN_REPARACION', label: '4. Reparación Activa', short: 'Reparación', color: 'border-purple-500/40 bg-purple-500/10 text-purple-400', badgeColor: 'bg-purple-500/20 text-purple-300' },
  { id: 'CONTROL_CALIDAD', label: '5. Control de Calidad & Banco', short: 'Calidad', color: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400', badgeColor: 'bg-cyan-500/20 text-cyan-300' },
  { id: 'LISTO_ENTREGA', label: '6. Listo para Retiro', short: 'Entrega', color: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400', badgeColor: 'bg-emerald-500/20 text-emerald-300' }
];

export default function TorreControlView({ onNavigateToWorkOrder }) {
  const [columns, setColumns] = useState({
    RECEPCIONADO: [],
    EN_DIAGNOSTICO: [],
    ESPERA_REPUESTOS: [],
    EN_REPARACION: [],
    CONTROL_CALIDAD: [],
    LISTO_ENTREGA: []
  });
  const [kpis, setKpis] = useState({
    totalActive: 0,
    inDiagnosis: 0,
    waitingParts: 0,
    inRepair: 0,
    qualityControl: 0,
    readyForDelivery: 0,
    urgentCount: 0
  });
  const [loading, setLoading] = useState(true);

  // Estado de Arrastrar y Soltar (Drag & Drop Kanban)
  const [draggedOrder, setDraggedOrder] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);

  // Filtros
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('TODAS');
  const [mechanicFilter, setMechanicFilter] = useState('TODOS');

  const [activeViewMode, setActiveViewMode] = useState('ACTIVE'); // 'ACTIVE' | 'HISTORY'
  const [deliveredOrders, setDeliveredOrders] = useState([]);

  // Modales
  const [selectedOrderForEdit, setSelectedOrderForEdit] = useState(null);
  const [trackingModalData, setTrackingModalData] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [directSearchCode, setDirectSearchCode] = useState('');

  // Formulario de Transición de Fase
  const [editStage, setEditStage] = useState('RECEPCIONADO');
  const [editPriority, setEditPriority] = useState('MEDIA');
  const [editProgress, setEditProgress] = useState(25);
  const [editMechanic, setEditMechanic] = useState('Darios Bacilio');
  const [editEstimatedDate, setEditEstimatedDate] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editNotifyClient, setEditNotifyClient] = useState(true);
  const [submittingStage, setSubmittingStage] = useState(false);

  // Feedback
  const [actionFeedback, setActionFeedback] = useState(null);

  const fetchKanban = async () => {
    try {
      setLoading(true);
      const res = await api.getKanbanOrders({
        search,
        priority: priorityFilter,
        mechanic: mechanicFilter
      });
      if (res?.success && res.data) {
        setColumns(res.data.columns || {});
        setDeliveredOrders(res.data.deliveredOrders || []);
        if (res.data.kpis) setKpis(res.data.kpis);
      }
    } catch (err) {
      console.error('Error cargando Kanban Torre de Control:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKanban();
  }, [priorityFilter, mechanicFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchKanban();
  };

  // Marcar vehículo como entregado al cliente y archivar al Historial
  const handleDeliverOrder = async (order) => {
    if (!order) return;
    const confirmMsg = `¿Confirmar entrega y retiro para:\n\nPlaca: ${order.plate}\nOT: ${order.orderNumber}\nCliente: ${order.clientName}?\n\nAl confirmar, la orden se marcará como ENTREGADA y pasará al Historial de Taller para mantener el tablero operativo despejado.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await api.updateKanbanStage(order._id, {
        stage: 'ENTREGADO',
        progressPercent: 100,
        notes: 'Vehículo entregado y retirado satisfactoriamente del taller.',
        notifyClient: false
      });
      if (res?.success) {
        setActionFeedback({
          type: 'success',
          msg: `¡Unidad ${order.plate} archivada con éxito en el Historial de Entregados!`
        });
        fetchKanban();
      } else {
        alert(res?.message || 'Error al archivar orden');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  // Reactivar orden de trabajo desde el Historial
  const handleReactivateOrder = async (order) => {
    if (!order) return;
    if (!window.confirm(`¿Deseas reactivar la orden ${order.orderNumber} (${order.plate}) y reingresarla a la Torre de Control Activa?`)) return;

    try {
      const res = await api.updateKanbanStage(order._id, {
        stage: 'RECEPCIONADO',
        progressPercent: 20,
        notes: 'Reingreso técnico de unidad desde Historial.',
        notifyClient: false
      });
      if (res?.success) {
        setActionFeedback({
          type: 'success',
          msg: `Unidad ${order.plate} reingresada a la fase de Recepción en el tablero activo.`
        });
        fetchKanban();
      }
    } catch (err) {
      alert('Error reactivando orden: ' + err.message);
    }
  };

  const openEditModal = (order) => {
    setSelectedOrderForEdit(order);
    setEditStage(order.canonicalStage || order.status || 'RECEPCIONADO');
    setEditPriority(order.priority || 'MEDIA');
    setEditProgress(order.progressPercent || 25);
    setEditMechanic(order.assignedMechanic || 'Darios Bacilio');
    setEditEstimatedDate(order.estimatedCompletionDate ? new Date(order.estimatedCompletionDate).toISOString().slice(0, 16) : '');
    setEditNotes('');
    setEditNotifyClient(true);
  };

  const handleSaveStage = async (e) => {
    e.preventDefault();
    if (!selectedOrderForEdit) return;
    try {
      setSubmittingStage(true);
      const res = await api.updateKanbanStage(selectedOrderForEdit._id, {
        stage: editStage,
        priority: editPriority,
        progressPercent: editProgress,
        assignedMechanic: editMechanic,
        estimatedCompletionDate: editEstimatedDate || null,
        notes: editNotes,
        notifyClient: editNotifyClient
      });

      if (res?.success) {
        setActionFeedback({
          type: 'success',
          msg: `Unidad ${selectedOrderForEdit.plate} actualizada a fase: ${STAGES.find(s => s.id === editStage)?.short || editStage}. ${editNotifyClient ? 'Notificación despachada por WhatsApp.' : ''}`
        });
        setSelectedOrderForEdit(null);
        fetchKanban();
      } else {
        setActionFeedback({ type: 'error', msg: res?.message || 'Error actualizando fase' });
      }
    } catch (err) {
      setActionFeedback({ type: 'error', msg: err.message });
    } finally {
      setSubmittingStage(false);
    }
  };

  const handleQuickAdvance = async (order, direction = 'next') => {
    const curIdx = STAGES.findIndex(s => s.id === (order.canonicalStage || order.status));
    let nextIdx = direction === 'next' ? curIdx + 1 : curIdx - 1;
    if (nextIdx < 0 || nextIdx >= STAGES.length) return;

    const nextStage = STAGES[nextIdx];
    const defaultProgress = Math.round(((nextIdx + 1) / STAGES.length) * 100);

    try {
      const res = await api.updateKanbanStage(order._id, {
        stage: nextStage.id,
        progressPercent: defaultProgress,
        notes: `Avance rápido de fase a ${nextStage.label}`,
        notifyClient: false
      });
      if (res?.success) {
        fetchKanban();
      }
    } catch (err) {
      console.error('Error avanzando etapa:', err);
    }
  };

  // Controladores de Arrastrar y Soltar (HTML5 Drag & Drop)
  const handleDragStart = (e, order) => {
    setDraggedOrder(order);
    e.dataTransfer.setData('text/plain', order._id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedOrder(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e, stageId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== stageId) {
      setDragOverColumn(stageId);
    }
  };

  const handleDragLeave = (e, stageId) => {
    if (e.currentTarget.contains(e.relatedTarget)) return;
    if (dragOverColumn === stageId) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = async (e, targetStageId) => {
    e.preventDefault();
    setDragOverColumn(null);
    if (!draggedOrder) return;

    const sourceStageId = draggedOrder.canonicalStage || draggedOrder.status || 'RECEPCIONADO';
    if (sourceStageId === targetStageId) {
      setDraggedOrder(null);
      return;
    }

    const stageIdx = STAGES.findIndex(s => s.id === targetStageId);
    const targetStage = STAGES[stageIdx] || { short: targetStageId, label: targetStageId };
    const defaultProgress = Math.round(((stageIdx + 1) / STAGES.length) * 100);

    // Actualización optimista inmediata en la UI
    setColumns(prev => {
      const newCols = { ...prev };
      if (newCols[sourceStageId]) {
        newCols[sourceStageId] = newCols[sourceStageId].filter(o => o._id !== draggedOrder._id);
      }
      const updatedOrder = {
        ...draggedOrder,
        canonicalStage: targetStageId,
        status: targetStageId,
        progressPercent: defaultProgress
      };
      newCols[targetStageId] = [updatedOrder, ...(newCols[targetStageId] || [])];
      return newCols;
    });

    const movedOrder = draggedOrder;
    setDraggedOrder(null);

    try {
      const res = await api.updateKanbanStage(movedOrder._id, {
        stage: targetStageId,
        progressPercent: defaultProgress,
        notes: `Transición arrastrada en Kanban a ${targetStage.label}`,
        notifyClient: false
      });

      if (res?.success) {
        setActionFeedback({
          type: 'success',
          msg: `Unidad ${movedOrder.plate} movida a "${targetStage.short}". Presiona "WhatsApp" en la tarjeta si deseas notificar al cliente.`
        });
        fetchKanban();
      } else {
        setActionFeedback({ type: 'warning', msg: res?.message || 'Error al persistir cambio de fase' });
        fetchKanban();
      }
    } catch (err) {
      console.error('Error al soltar bloque en fase:', err);
      fetchKanban();
    }
  };

  const handleOpenTracking = async (identifier) => {
    try {
      setTrackingLoading(true);
      const res = await api.getPublicTracking(identifier);
      if (res?.success && res.data) {
        setTrackingModalData(res.data);
      } else {
        setActionFeedback({ type: 'warning', msg: res?.message || 'No se encontró trazabilidad para la unidad solicitada' });
      }
    } catch (err) {
      setActionFeedback({ type: 'error', msg: 'Error consultando trazabilidad: ' + err.message });
    } finally {
      setTrackingLoading(false);
    }
  };

  const handleSendWhatsAppNotification = async (order) => {
    try {
      const res = await api.notifyTrackingWhatsApp(order._id, {
        notes: `Unidad en fase ${order.canonicalStage || order.status} - Avance: ${order.progressPercent || 25}%`
      });
      if (res?.success) {
        setActionFeedback({
          type: 'success',
          msg: `Enlace de trazabilidad en vivo enviado por WhatsApp al cliente (${order.clientPhone || order.driverPhone || 'Cliente'}).`
        });
      } else {
        setActionFeedback({ type: 'warning', msg: res?.message || 'No se pudo enviar la notificación' });
      }
    } catch (err) {
      setActionFeedback({ type: 'error', msg: err.message });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      
      {/* Encabezado Principal y Telemetría */}
      <div className="bg-gradient-to-r from-darsil-card via-slate-900 to-darsil-card p-4 sm:p-6 rounded-2xl border border-darsil-border shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 animate-pulse" />
                TORRE DE CONTROL TÉCNICO & TELEMETRÍA DE TALLER
              </span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 font-bold flex items-center gap-1">
                <Zap className="w-3 h-3 text-cyan-400" />
                TRAZABILIDAD EN TIEMPO REAL
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              <Gauge className="w-7 h-7 text-amber-400 shrink-0" />
              Tablero Kanban Operativo & Seguimiento de Unidades
            </h1>
            <p className="text-xs text-slate-400 max-w-3xl">
              Control visual del flujo de vehículos pesados y livianos en taller. Registro de tiempos, asignación de mecánicos, transición de fases y portal de trazabilidad en vivo para clientes con notificaciones automáticas por WhatsApp.
            </p>
          </div>

          {/* Acciones de Cabecera */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-darsil-border">
              <input 
                type="text"
                placeholder="Consultar Placa u OT..."
                value={directSearchCode}
                onChange={(e) => setDirectSearchCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => { if (e.key === 'Enter' && directSearchCode) handleOpenTracking(directSearchCode); }}
                className="bg-transparent text-xs text-white px-2 py-1 outline-none w-36 uppercase font-mono placeholder:text-slate-600"
              />
              <button
                type="button"
                onClick={() => { if (directSearchCode) handleOpenTracking(directSearchCode); }}
                className="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black transition flex items-center gap-1"
                title="Buscar trazabilidad"
              >
                <Search className="w-3.5 h-3.5 stroke-[3]" />
                <span>Rastrear</span>
              </button>
            </div>

            <button
              onClick={fetchKanban}
              className="p-2.5 rounded-xl text-slate-400 hover:text-white bg-slate-950 border border-darsil-border transition active:scale-95"
              title="Actualizar datos"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Alerta de Feedback */}
      {actionFeedback && (
        <div className={`p-4 rounded-xl text-xs flex items-center justify-between gap-3 shadow-lg animate-in slide-in-from-top-2 ${
          actionFeedback.type === 'success' ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300' :
          actionFeedback.type === 'warning' ? 'bg-amber-500/15 border border-amber-500/30 text-amber-300' :
          'bg-red-500/15 border border-red-500/30 text-red-300'
        }`}>
          <div className="flex items-center gap-2">
            {actionFeedback.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />}
            {actionFeedback.type === 'warning' && <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />}
            {actionFeedback.type === 'error' && <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />}
            <span className="font-semibold">{actionFeedback.msg}</span>
          </div>
          <button onClick={() => setActionFeedback(null)} className="text-slate-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Cinta de KPIs Operativos de Taller */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'En Taller', val: kpis.totalActive, color: 'text-white', bg: 'bg-slate-800/40', border: 'border-slate-700/50' },
          { label: 'En Diagnóstico', val: kpis.inDiagnosis, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
          { label: 'Espera Repuestos', val: kpis.waitingParts, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
          { label: 'En Reparación', val: kpis.inRepair, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
          { label: 'Control Calidad', val: kpis.qualityControl, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
          { label: 'Listas para Retiro', val: kpis.readyForDelivery, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' }
        ].map((k, i) => (
          <div key={i} className={`p-3.5 rounded-2xl border ${k.border} ${k.bg} backdrop-blur-sm shadow-md`}>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{k.label}</div>
            <div className={`text-2xl font-black font-mono mt-0.5 ${k.color}`}>{k.val}</div>
          </div>
        ))}
      </div>

      {/* Selector de Modo: Activas en Taller vs Historial de Entregados */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 p-1 bg-slate-950 border border-darsil-border rounded-2xl w-fit">
          <button
            type="button"
            onClick={() => setActiveViewMode('ACTIVE')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
              activeViewMode === 'ACTIVE'
                ? 'bg-amber-500 text-slate-950 shadow-gold-glow font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Car className="w-4 h-4" />
            <span>Torre de Control Activa</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
              activeViewMode === 'ACTIVE' ? 'bg-slate-950 text-amber-400' : 'bg-slate-800 text-slate-300'
            }`}>
              {kpis.totalActive || 0}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveViewMode('HISTORY')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
              activeViewMode === 'HISTORY'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Archive className="w-4 h-4" />
            <span>Historial de Entregados</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
              activeViewMode === 'HISTORY' ? 'bg-slate-950 text-emerald-400' : 'bg-slate-800 text-slate-300'
            }`}>
              {deliveredOrders.length}
            </span>
          </button>
        </div>

        <div className="text-xs text-slate-400">
          {activeViewMode === 'ACTIVE' 
            ? 'Monitoreando vehículos actualmente en taller por fases operativas'
            : 'Archivo permanente de vehículos despachados y retirados'}
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-darsil-card border border-darsil-border p-3.5 rounded-2xl shadow-lg flex flex-col md:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtrar por placa, cliente u OT..."
            className="w-full bg-slate-950 border border-darsil-border rounded-xl pl-9 pr-4 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-400 transition"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          {/* Filtro Prioridad */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Prioridad:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-slate-950 border border-darsil-border text-white text-xs font-bold rounded-xl px-2.5 py-1.5 outline-none focus:border-amber-400"
            >
              <option value="TODAS">Todas</option>
              <option value="URGENTE">🚨 Urgente</option>
              <option value="ALTA">Alta</option>
              <option value="MEDIA">Media</option>
              <option value="BAJA">Baja</option>
            </select>
          </div>

          {/* Filtro Mecánico */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Técnico:</span>
            <select
              value={mechanicFilter}
              onChange={(e) => setMechanicFilter(e.target.value)}
              className="bg-slate-950 border border-darsil-border text-white text-xs font-bold rounded-xl px-2.5 py-1.5 outline-none focus:border-amber-400"
            >
              <option value="TODOS">Todos los Técnicos</option>
              <option value="Darios Bacilio">Darios Bacilio</option>
            </select>
          </div>
        </div>
      </div>

      {activeViewMode === 'ACTIVE' ? (
        /* Tablero Kanban - 6 Fases */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 items-start">
        {STAGES.map((stage) => {
          const ordersInStage = columns[stage.id] || [];

          return (
            <div 
              key={stage.id}
              onDragOver={(e) => handleDragOver(e, stage.id)}
              onDragLeave={(e) => handleDragLeave(e, stage.id)}
              onDrop={(e) => handleDrop(e, stage.id)}
              className={`bg-darsil-card/90 border rounded-2xl overflow-hidden flex flex-col shadow-xl min-h-[500px] transition-all duration-200 ${
                dragOverColumn === stage.id 
                  ? 'border-amber-400 ring-2 ring-amber-400/50 bg-amber-500/10 shadow-[0_0_25px_rgba(245,158,11,0.25)] scale-[1.01]' 
                  : 'border-darsil-border'
              }`}
            >
              {/* Cabecera de Columna */}
              <div className={`p-3 border-b border-darsil-border flex items-center justify-between ${stage.color}`}>
                <div className="flex items-center gap-1.5 truncate">
                  <span className="w-2 h-2 rounded-full bg-current"></span>
                  <span className="text-xs font-black uppercase tracking-tight truncate">{stage.short}</span>
                </div>
                <span className={`text-[11px] font-mono font-black px-2 py-0.5 rounded-full ${stage.badgeColor}`}>
                  {ordersInStage.length}
                </span>
              </div>

              {/* Lista de Tarjetas de Vehículos */}
              <div className="p-2.5 space-y-2.5 overflow-y-auto max-h-[calc(100vh-280px)] flex-1">
                {ordersInStage.length === 0 ? (
                  <div className={`text-center py-12 px-2 text-[11px] border border-dashed rounded-xl transition ${
                    dragOverColumn === stage.id 
                      ? 'border-amber-400/80 text-amber-300 font-bold bg-amber-500/5' 
                      : 'border-slate-800 text-slate-500'
                  }`}>
                    {dragOverColumn === stage.id ? '⚡ Suelta aquí para mover' : 'Sin unidades en esta fase'}
                  </div>
                ) : (
                  ordersInStage.map((order) => {
                    const isUrgent = order.priority === 'URGENTE';
                    const isHigh = order.priority === 'ALTA';
                    const isDraggingThis = draggedOrder?._id === order._id;

                    return (
                      <div
                        key={order._id}
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, order)}
                        onDragEnd={handleDragEnd}
                        className={`bg-slate-950/80 border rounded-xl p-3 space-y-2.5 hover:border-amber-500/50 transition-all duration-200 shadow-md group relative cursor-grab active:cursor-grabbing select-none ${
                          isDraggingThis ? 'opacity-30 scale-95 border-amber-400 border-dashed ring-2 ring-amber-400' : ''
                        } ${
                          isUrgent ? 'border-red-500/50 bg-red-950/10' : 
                          isHigh ? 'border-amber-500/40' : 
                          'border-slate-800/80'
                        }`}
                        title="Arrastra para mover de fase o usa los botones rápidos"
                      >
                        {/* Cabecera Tarjeta: Placa y Prioridad */}
                        <div className="flex items-center justify-between gap-1.5">
                          {/* Placa estilo vehicular peruano con Grip de arrastre */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-600 group-hover:text-amber-400/80 transition" title="Arrastrar unidad">
                              <GripVertical className="w-3.5 h-3.5" />
                            </span>
                            <div className="flex items-center gap-1 bg-yellow-400 text-slate-950 px-2 py-0.5 rounded-md font-mono font-black text-xs shadow-sm">
                              <Car className="w-3 h-3" />
                              <span>{order.plate || 'POR ASIGNAR'}</span>
                            </div>
                          </div>

                          {/* Badge de Prioridad */}
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                            isUrgent ? 'bg-red-500 text-white animate-pulse' :
                            isHigh ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                            'bg-slate-800 text-slate-400'
                          }`}>
                            {order.priority || 'MEDIA'}
                          </span>
                        </div>

                        {/* Datos Cliente y OT */}
                        <div>
                          <div className="text-[11px] font-black text-white truncate" title={order.clientName}>
                            {order.clientName}
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-0.5">
                            <span className="font-mono text-amber-400 font-bold">{order.orderNumber}</span>
                            <span className="truncate max-w-[110px]">{order.model || 'Tracto / Unidad'}</span>
                          </div>
                        </div>

                        {/* Falla Reportada / Diagnóstico */}
                        {order.reportedFault && (
                          <div className="text-[10px] text-slate-400 bg-slate-900/60 p-2 rounded-lg border border-slate-800/60 line-clamp-2 leading-relaxed">
                            {order.reportedFault}
                          </div>
                        )}

                        {/* Barra de Progreso y Tiempo Transcurrido */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-500" />
                              {order.elapsedDays > 0 ? `${order.elapsedDays}d en taller` : `${order.elapsedHours || 1}h en taller`}
                            </span>
                            <span className="font-mono font-black text-amber-400">{order.progressPercent || 20}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                            <div 
                              className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-500 rounded-full"
                              style={{ width: `${Math.min(100, Math.max(5, order.progressPercent || 20))}%` }}
                            />
                          </div>
                        </div>

                        {/* Técnico y Acciones Rápidas */}
                        <div className="pt-1 border-t border-slate-900 flex items-center justify-between text-[10px]">
                          <span className="text-slate-400 font-medium truncate max-w-[100px]" title={order.assignedMechanic}>
                            👨‍🔧 {order.assignedMechanic || 'Darios Bacilio'}
                          </span>

                          <div className="flex items-center gap-1">
                            {/* Retroceder */}
                            <button
                              type="button"
                              onClick={() => handleQuickAdvance(order, 'prev')}
                              disabled={stage.id === STAGES[0].id}
                              className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-20 transition"
                              title="Retroceder a fase anterior"
                            >
                              <ArrowLeft className="w-3.5 h-3.5" />
                            </button>

                            {/* Avanzar */}
                            <button
                              type="button"
                              onClick={() => handleQuickAdvance(order, 'next')}
                              disabled={stage.id === STAGES[STAGES.length - 1].id}
                              className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-20 transition"
                              title="Avanzar a fase siguiente"
                            >
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Botones de Acción de Tarjeta */}
                        <div className="grid grid-cols-3 gap-1 pt-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(order)}
                            className="px-1.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-[10px] font-bold border border-slate-800 transition flex items-center justify-center gap-1"
                            title="Ajustar fase y notas"
                          >
                            <Sliders className="w-3 h-3 text-amber-400" />
                            <span>Fase</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenTracking(order.orderNumber)}
                            className="px-1.5 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 text-[10px] font-bold border border-sky-500/30 transition flex items-center justify-center gap-1"
                            title="Ver Trazabilidad en Vivo"
                          >
                            <Activity className="w-3 h-3" />
                            <span>Tracking</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSendWhatsAppNotification(order)}
                            className="px-1.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30 transition flex items-center justify-center gap-1"
                            title="Notificar estado por WhatsApp"
                          >
                            <Send className="w-3 h-3" />
                            <span>WhatsApp</span>
                          </button>
                        </div>

                        {/* Botón Destacado: Entregar y Archivar (Solo en fase 6: Listo para Retiro) */}
                        {stage.id === 'LISTO_ENTREGA' && (
                          <button
                            type="button"
                            onClick={() => handleDeliverOrder(order)}
                            className="w-full mt-1.5 py-1.5 px-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-black text-[10px] flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition"
                            title="Marcar como entregado y retirar del tablero operativo"
                          >
                            <CheckSquare className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>Entregar y Archivar</span>
                          </button>
                        )}

                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
      ) : (
        /* Apartado de Historial de Unidades Entregadas */
        <div className="bg-darsil-card border border-darsil-border rounded-2xl p-5 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-darsil-border pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Archive className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <span>Archivo de Unidades Entregadas</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                    {deliveredOrders.length} {deliveredOrders.length === 1 ? 'servicio' : 'servicios'}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Registro histórico permanente de todos los vehículos que culminaron su servicio técnico y fueron retirados por el cliente.
                </p>
              </div>
            </div>
          </div>

          {deliveredOrders.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-2xl">
              No hay órdenes archivadas en el historial todavía. Cuando marques una unidad como "Entregar y Archivar" en la última fase del tablero activo, aparecerá archivada aquí.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {deliveredOrders.map(order => (
                <div key={order._id} className="bg-darsil-obsidian border border-darsil-border rounded-2xl p-4 space-y-3 hover:border-emerald-500/40 transition shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="bg-amber-400 text-slate-950 font-mono font-black text-xs px-2.5 py-1 rounded-lg shadow-sm">
                        {order.plate}
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                        ENTREGADO
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">{order.orderNumber}</span>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-white truncate">{order.clientName}</h4>
                    <p className="text-[11px] text-slate-400">{order.model || 'Vehículo General'}</p>
                  </div>

                  <div className="text-[11px] bg-black/40 p-2.5 rounded-xl border border-darsil-border/60 text-slate-300 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Técnico Responsable:</span>
                      <span className="font-semibold text-slate-200">{order.assignedMechanic || 'Darios Bacilio'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Ingreso a Taller:</span>
                      <span className="font-mono text-slate-300">{new Date(order.createdAt).toLocaleDateString('es-PE')}</span>
                    </div>
                    {order.deliveredAt && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Fecha de Entrega:</span>
                        <span className="font-mono text-emerald-300 font-bold">{new Date(order.deliveredAt).toLocaleDateString('es-PE')}</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-darsil-border/60">
                    <button
                      type="button"
                      onClick={() => handleOpenTracking(order.orderNumber)}
                      className="px-2 py-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 text-[10px] font-bold border border-sky-500/30 flex items-center justify-center gap-1 transition"
                      title="Ver Trazabilidad"
                    >
                      <Activity className="w-3 h-3" />
                      <span>Tracking</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSendWhatsAppNotification(order)}
                      className="px-2 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30 flex items-center justify-center gap-1 transition"
                      title="WhatsApp"
                    >
                      <Send className="w-3 h-3" />
                      <span>WhatsApp</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleReactivateOrder(order)}
                      className="px-2 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-[10px] font-bold border border-amber-500/30 flex items-center justify-center gap-1 transition"
                      title="Reactivar servicio en el tablero activo"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reingreso</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal Ajustar Fase & Telemetría */}
      {selectedOrderForEdit && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-darsil-card border border-darsil-border w-full max-w-xl rounded-2xl shadow-2xl p-5 sm:p-6 space-y-4 my-8 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-darsil-border pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Sliders className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-black text-white">
                    Actualizar Fase de Taller: {selectedOrderForEdit.plate}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {selectedOrderForEdit.orderNumber} • {selectedOrderForEdit.clientName}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedOrderForEdit(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStage} className="space-y-4 text-xs">
              {/* Selector de Nueva Fase */}
              <div>
                <label className="block text-slate-300 font-bold mb-1.5">Fase de Taller:</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {STAGES.map(s => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setEditStage(s.id)}
                      className={`p-2.5 rounded-xl border text-left font-bold transition flex items-center justify-between ${
                        editStage === s.id 
                          ? `${s.color} border-current ring-1 ring-amber-400/50 font-black` 
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="truncate">{s.short}</span>
                      {editStage === s.id && <Check className="w-3.5 h-3.5 shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Porcentaje de Avance y Prioridad */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-slate-300 font-bold">Porcentaje de Avance:</label>
                    <span className="font-mono font-black text-amber-400 text-sm">{editProgress}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="100"
                    step="5"
                    value={editProgress}
                    onChange={(e) => setEditProgress(Number(e.target.value))}
                    className="w-full accent-amber-400 bg-slate-950 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between gap-1 mt-1">
                    {[15, 30, 50, 75, 100].map(pct => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setEditProgress(pct)}
                        className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-[10px] text-slate-400 font-mono"
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Nivel de Prioridad:</label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value)}
                    className="w-full bg-slate-950 border border-darsil-border rounded-xl px-3 py-2 text-white font-bold outline-none focus:border-amber-400"
                  >
                    <option value="BAJA">Baja</option>
                    <option value="MEDIA">Media</option>
                    <option value="ALTA">Alta</option>
                    <option value="URGENTE">🚨 URGENTE</option>
                  </select>
                </div>
              </div>

              {/* Técnico Asignado y Fecha Estimada */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Técnico Líder Asignado:</label>
                  <input
                    type="text"
                    value={editMechanic}
                    onChange={(e) => setEditMechanic(e.target.value)}
                    className="w-full bg-slate-950 border border-darsil-border rounded-xl px-3 py-2 text-white outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Fecha Estimada de Entrega:</label>
                  <input
                    type="datetime-local"
                    value={editEstimatedDate}
                    onChange={(e) => setEditEstimatedDate(e.target.value)}
                    className="w-full bg-slate-950 border border-darsil-border rounded-xl px-3 py-2 text-white outline-none focus:border-amber-400 font-mono"
                  />
                </div>
              </div>

              {/* Notas Técnicas / Observaciones */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">Observaciones Técnicas / Bitácora:</label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Detalle el trabajo realizado o repuestos cambiados en esta fase..."
                  rows={3}
                  className="w-full bg-slate-950 border border-darsil-border rounded-xl p-3 text-white outline-none focus:border-amber-400 placeholder:text-slate-600"
                />
              </div>

              {/* Checkbox Notificar WhatsApp */}
              <div className="bg-slate-950/80 p-3 rounded-xl border border-darsil-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div className="text-white font-bold">Notificar al cliente por WhatsApp</div>
                    <div className="text-[10px] text-slate-400">
                      Despacha mensaje automático con avance y enlace de seguimiento en vivo.
                    </div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={editNotifyClient}
                  onChange={(e) => setEditNotifyClient(e.target.checked)}
                  className="w-4 h-4 accent-amber-400 rounded cursor-pointer"
                />
              </div>

              {/* Botones de Acción */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-darsil-border">
                <button
                  type="button"
                  onClick={() => setSelectedOrderForEdit(null)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingStage}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black flex items-center gap-2 shadow-gold-glow hover:brightness-110 active:scale-95 transition disabled:opacity-50"
                >
                  {submittingStage ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                  )}
                  <span>Guardar y Actualizar Fase</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Portal de Trazabilidad en Vivo (Tracking para Cliente / Asesor) */}
      {trackingModalData && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-darsil-card border border-darsil-border w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden my-6 animate-in zoom-in-95">
            {/* Cabecera Telemetría */}
            <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-5 sm:p-6 border-b border-darsil-border relative">
              <button 
                onClick={() => setTrackingModalData(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  SEGUIMIENTO EN VIVO DARSIL
                </span>
                <span className="text-[10px] font-mono text-amber-400 font-bold">
                  {trackingModalData.orderNumber}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-yellow-400 text-slate-950 px-2.5 py-0.5 rounded-md font-mono font-black text-sm">
                      {trackingModalData.plate}
                    </span>
                    <h2 className="text-lg font-black text-white">{trackingModalData.model || 'Unidad de Carga'}</h2>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Cliente: <strong className="text-slate-200">{trackingModalData.clientName}</strong>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Avance de Taller</div>
                  <div className="text-2xl font-black font-mono text-amber-400">
                    {trackingModalData.progressPercent || 25}%
                  </div>
                </div>
              </div>

              {/* Barra de Progreso */}
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800 mt-3">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-400 rounded-full transition-all duration-700"
                  style={{ width: `${trackingModalData.progressPercent || 25}%` }}
                />
              </div>
            </div>

            {/* Contenido: Telemetría de Ingreso & Línea de Tiempo */}
            <div className="p-5 sm:p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              
              {/* Datos de Ingreso */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-950/80 p-3 rounded-xl border border-darsil-border text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Odómetro</span>
                  <span className="font-mono text-white font-bold">{trackingModalData.mileage || 'No registrado'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Horómetro</span>
                  <span className="font-mono text-white font-bold">{trackingModalData.hourmeter || 'No registrado'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Combustible</span>
                  <span className="font-mono text-amber-400 font-bold">{trackingModalData.fuelLevel || '1/2'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Técnico</span>
                  <span className="font-bold text-white truncate block">{trackingModalData.assignedMechanic || 'Darios Bacilio'}</span>
                </div>
              </div>

              {/* Falla Reportada */}
              {trackingModalData.reportedFault && (
                <div className="bg-slate-950/80 p-3 rounded-xl border border-darsil-border text-xs">
                  <span className="text-slate-400 block text-[10px] uppercase font-black mb-1">Diagnóstico / Motivo de Ingreso:</span>
                  <p className="text-slate-200 leading-relaxed">{trackingModalData.reportedFault}</p>
                </div>
              )}

              {/* Línea de Tiempo Histórica de Fases */}
              <div>
                <h4 className="text-xs font-black uppercase text-amber-400 tracking-wider mb-3 flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  Bitácora de Fases y Trazabilidad Cronológica
                </h4>

                <div className="space-y-4 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                  {(trackingModalData.timeline || []).map((t, idx) => (
                    <div key={idx} className="flex items-start gap-3 relative pl-1">
                      <div className="w-6 h-6 rounded-full bg-slate-900 border border-amber-400 text-amber-400 flex items-center justify-center shrink-0 z-10 text-[10px] font-black">
                        {idx + 1}
                      </div>
                      <div className="bg-slate-950/90 border border-darsil-border p-3 rounded-xl flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-black text-white">{t.title}</span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {new Date(t.timestamp).toLocaleDateString('es-PE')} {new Date(t.timestamp).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {t.notes && (
                          <p className="text-xs text-slate-300 leading-relaxed">{t.notes}</p>
                        )}
                        {t.updatedBy && (
                          <div className="text-[10px] text-slate-500 pt-0.5">
                            Registrado por: {t.updatedBy}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Información de Taller & Contacto Asesor */}
              <div className="bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/20 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div>
                  <div className="font-bold text-white">Central de Taller DARSIL AUTOMOTIVE</div>
                  <div className="text-slate-400 text-[11px]">Av. Los Forestales MZ I1, Villa El Salvador, Lima</div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href="tel:934787006"
                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center gap-1.5 transition"
                  >
                    <Phone className="w-3.5 h-3.5 text-amber-400" />
                    <span>934787006</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/#tracking/${trackingModalData.orderNumber}`);
                      setActionFeedback({ type: 'success', msg: 'Enlace de trazabilidad copiado al portapapeles' });
                    }}
                    className="px-3 py-1.5 rounded-lg bg-amber-400 text-slate-950 font-black hover:bg-amber-300 transition flex items-center gap-1"
                  >
                    <Share2 className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Copiar Enlace</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
