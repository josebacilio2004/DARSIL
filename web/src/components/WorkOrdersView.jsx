import React, { useState, useEffect, useRef } from 'react';
import { 
  ClipboardList, 
  Plus, 
  Search, 
  CheckCircle2, 
  Clock, 
  Wrench, 
  Truck, 
  BatteryCharging, 
  Fuel, 
  Gauge, 
  Check, 
  X, 
  User, 
  Phone, 
  ShieldAlert, 
  FileText, 
  ExternalLink,
  Edit2,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';

export default function WorkOrdersView({ onSelectQuote }) {
  const [orders, setOrders] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Modales
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);

  // Formulario Check-In
  const [formQuoteId, setFormQuoteId] = useState('');
  const [formPlate, setFormPlate] = useState('');
  const [formModel, setFormModel] = useState('');
  const [formClientName, setFormClientName] = useState('');
  const [formClientDoc, setFormClientDoc] = useState('');
  const [formClientPhone, setFormClientPhone] = useState('');
  const [formDriverName, setFormDriverName] = useState('');
  const [formDriverPhone, setFormDriverPhone] = useState('');
  const [formMileage, setFormMileage] = useState('');
  const [formHourmeter, setFormHourmeter] = useState('');
  const [formFuelLevel, setFormFuelLevel] = useState('1/2');
  const [formBatteryVoltage, setFormBatteryVoltage] = useState('25.4 V');
  const [formReportedFault, setFormReportedFault] = useState('');
  const [formAssignedMechanic, setFormAssignedMechanic] = useState('Ruben Basil');
  const [formVisualObs, setFormVisualObs] = useState('Unidad ingresa sin daños mayores en carrocería.');

  // Checklist
  const [chkBatteries, setChkBatteries] = useState('BUENO');
  const [chkStarter, setChkStarter] = useState('OPERATIVO');
  const [chkAlternator, setChkAlternator] = useState('OPERATIVO');
  const [chkLights, setChkLights] = useState('OPERATIVO');
  const [chkHarness, setChkHarness] = useState('INTEGRO');
  const [chkEcu, setChkEcu] = useState('SIN_ERRORES');
  const [chkSpareTire, setChkSpareTire] = useState(true);
  const [chkExtinguisher, setChkExtinguisher] = useState(true);

  // Canvas de Firma Táctil
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [deliveredToName, setDeliveredToName] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');

  // Asignar Material a OT
  const [selectedMaterialId, setSelectedMaterialId] = useState('');
  const [materialQty, setMaterialQty] = useState(1);

  const fetchWorkOrders = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (search) params.search = search;

      const [resOrders, resQuotes, resInv] = await Promise.all([
        api.getWorkOrders(params),
        api.getQuotes(),
        api.getInventory()
      ]);

      if (resOrders?.success && resOrders.data) setOrders(resOrders.data);
      if (resQuotes?.success && resQuotes.data) setQuotes(resQuotes.data);
      if (resInv?.success && resInv.data) setInventoryItems(resInv.data);
    } catch (err) {
      console.error('Error fetching work orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkOrders();
  }, [statusFilter]);

  const handleOpenCheckIn = () => {
    setFormQuoteId('');
    setFormPlate('');
    setFormModel('');
    setFormClientName('');
    setFormClientDoc('');
    setFormClientPhone('');
    setFormDriverName('');
    setFormDriverPhone('');
    setFormMileage('');
    setFormHourmeter('');
    setFormFuelLevel('1/2');
    setFormBatteryVoltage('25.4 V');
    setFormReportedFault('');
    setFormAssignedMechanic('Ruben Basil');
    setFormVisualObs('Unidad ingresa en condiciones de operación.');
    setChkBatteries('BUENO');
    setChkStarter('OPERATIVO');
    setChkAlternator('OPERATIVO');
    setChkLights('OPERATIVO');
    setChkHarness('INTEGRO');
    setChkEcu('SIN_ERRORES');
    setChkSpareTire(true);
    setChkExtinguisher(true);
    setShowCheckInModal(true);
  };

  const handleSelectQuoteForCheckIn = (quoteId) => {
    setFormQuoteId(quoteId);
    const q = quotes.find(item => item._id === quoteId);
    if (q) {
      setFormPlate(q.plate || '');
      setFormModel(q.model || '');
      setFormClientName(q.clientName || '');
      setFormClientDoc(q.clientDoc || '');
      setFormClientPhone(q.clientPhone || '');
      setFormReportedFault(q.projectObject || (q.items && q.items[0]?.description) || 'Mantenimiento preventivo / correctivo de flota');
    }
  };

  const handleSaveCheckIn = async (e) => {
    e.preventDefault();
    try {
      const selectedQuote = quotes.find(q => q._id === formQuoteId);

      const payload = {
        quoteId: formQuoteId || undefined,
        quoteNumber: selectedQuote?.quoteNumber || '',
        plate: formPlate.toUpperCase().trim(),
        model: formModel.trim(),
        clientName: formClientName.trim(),
        clientDoc: formClientDoc.trim(),
        clientPhone: formClientPhone.trim(),
        driverName: formDriverName.trim(),
        driverPhone: formDriverPhone.trim(),
        mileage: formMileage.trim(),
        hourmeter: formHourmeter.trim(),
        fuelLevel: formFuelLevel,
        batteryVoltage: formBatteryVoltage.trim(),
        reportedFault: formReportedFault.trim(),
        assignedMechanic: formAssignedMechanic.trim(),
        visualObservations: formVisualObs.trim(),
        entryChecklist: {
          bancoBaterias: chkBatteries,
          arrancador: chkStarter,
          alternador: chkAlternator,
          lucesYFaros: chkLights,
          ramalElectrico: chkHarness,
          computadoraEcu: chkEcu,
          llantaRepuesto: chkSpareTire,
          extintor: chkExtinguisher,
          herramientas: true
        }
      };

      const res = await api.createWorkOrder(payload);
      if (res?.success) {
        setShowCheckInModal(false);
        fetchWorkOrders();
        // Si estaba vinculada a cotización, pasarla a EN_TALLER
        if (formQuoteId) {
          api.updateQuoteStatus(formQuoteId, 'EN_TALLER');
        }
      }
    } catch (err) {
      alert('Error al registrar Check-In: ' + err.message);
    }
  };

  const handleOpenDetail = (order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await api.updateWorkOrderStatus(orderId, newStatus);
      fetchWorkOrders();
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      alert('Error al actualizar estado: ' + err.message);
    }
  };

  const handleToggleTask = async (taskIndex) => {
    if (!selectedOrder) return;
    const updatedTasks = [...selectedOrder.tasks];
    updatedTasks[taskIndex].isCompleted = !updatedTasks[taskIndex].isCompleted;
    if (updatedTasks[taskIndex].isCompleted) {
      updatedTasks[taskIndex].completedAt = new Date();
    }

    try {
      const res = await api.updateWorkOrder(selectedOrder._id, { tasks: updatedTasks });
      if (res?.success) {
        setSelectedOrder(res.data);
        fetchWorkOrders();
      }
    } catch (err) {
      console.error('Error updating tasks:', err);
    }
  };

  const handleAddMaterialToOrder = async (e) => {
    e.preventDefault();
    if (!selectedOrder || !selectedMaterialId) return;

    try {
      const res = await api.addWorkOrderMaterial(selectedOrder._id, {
        inventoryItemId: selectedMaterialId,
        quantity: Number(materialQty)
      });
      if (res?.success) {
        setSelectedOrder(res.data);
        setSelectedMaterialId('');
        setMaterialQty(1);
        fetchWorkOrders();
      } else {
        alert(res?.message || 'Error al agregar material');
      }
    } catch (err) {
      alert('Error al descontar de almacén: ' + err.message);
    }
  };

  // Métodos de Firma Táctil
  const handleStartDraw = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const handleDraw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const handleStopDraw = () => {
    setIsDrawing(false);
  };

  const handleClearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSaveSignature = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature) {
      alert('Por favor dibuja la firma de entrega en pantalla.');
      return;
    }
    const signatureData = canvas.toDataURL('image/png');

    try {
      const res = await api.saveWorkOrderSignature(selectedOrder._id, {
        clientSignature: signatureData,
        deliveredTo: deliveredToName.trim() || selectedOrder.driverName || selectedOrder.clientName,
        deliveryNotes: deliveryNotes.trim()
      });

      if (res?.success) {
        setShowSignatureModal(false);
        setSelectedOrder(res.data);
        fetchWorkOrders();
      }
    } catch (err) {
      alert('Error al registrar entrega: ' + err.message);
    }
  };

  const statusConfig = {
    RECEPCIONADO: { label: 'Check-In Realizado', color: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
    EN_DIAGNOSTICO: { label: 'En Diagnóstico CAN', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40' },
    EN_PROCESO: { label: 'En Proceso Taller', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
    PRUEBA_BANCO_24V: { label: 'Prueba de Banco 24V', color: 'bg-orange-500/20 text-orange-300 border-orange-500/40' },
    CONTROL_CALIDAD: { label: 'Control de Calidad', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' },
    FINALIZADO: { label: 'Listo para Entrega', color: 'bg-teal-500/20 text-teal-300 border-teal-500/40' },
    ENTREGADO: { label: 'Entregado a Chofer', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* Cabecera y Botón Nuevo Check-In */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest block">
            TALLER & OPERACIONES EN VIVO
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Órdenes de Trabajo & Check-In Digital
          </h1>
          <p className="text-xs text-slate-400">
            Recepción e inspección digital de flotas, control de arrancadores, nivel de combustible y entrega con firma táctil.
          </p>
        </div>

        <button
          onClick={handleOpenCheckIn}
          className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-gold-glow hover:brightness-110 active:scale-95 transition"
        >
          <Plus className="w-4 h-4 text-slate-950" />
          <span>+ Nuevo Check-In de Recepción</span>
        </button>
      </div>

      {/* Filtros */}
      <div className="p-4 rounded-2xl bg-darsil-card border border-darsil-border flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por N° OT, placa (ABG890) o chofer..."
            className="w-full bg-darsil-obsidian border border-darsil-border rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-400"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-darsil-obsidian border border-darsil-border text-slate-200 rounded-xl px-3 py-2 font-bold outline-none focus:border-amber-400"
          >
            <option value="ALL">Todos los Estados</option>
            <option value="RECEPCIONADO">Recepcionado (Check-In)</option>
            <option value="EN_DIAGNOSTICO">En Diagnóstico</option>
            <option value="EN_PROCESO">En Proceso Taller</option>
            <option value="PRUEBA_BANCO_24V">Prueba de Banco</option>
            <option value="FINALIZADO">Listo para Entrega</option>
            <option value="ENTREGADO">Entregado</option>
          </select>
        </div>
      </div>

      {/* Lista de Órdenes de Trabajo en Tarjetas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {orders.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 text-xs bg-darsil-card rounded-2xl border border-darsil-border">
            No hay órdenes de trabajo activas en este momento. Registra un nuevo Check-In.
          </div>
        ) : (
          orders.map(order => {
            const st = statusConfig[order.status] || { label: order.status, color: 'bg-slate-800 text-slate-300' };
            const completedTasks = (order.tasks || []).filter(t => t.isCompleted).length;
            const totalTasks = (order.tasks || []).length;
            const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

            return (
              <div
                key={order._id}
                onClick={() => handleOpenDetail(order)}
                className="p-5 rounded-3xl bg-darsil-card border border-darsil-border hover:border-amber-500/50 transition cursor-pointer flex flex-col justify-between space-y-4 group shadow-lg"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-black text-amber-400 text-sm">{order.orderNumber}</span>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${st.color}`}>
                      {st.label}
                    </span>
                  </div>

                  <div>
                    <div className="text-lg font-black text-white flex items-center space-x-2">
                      <Truck className="w-5 h-5 text-amber-400" />
                      <span>{order.plate || 'SIN PLACA'}</span>
                    </div>
                    <div className="text-xs text-slate-300 font-semibold">{order.clientName}</div>
                    <div className="text-[10px] text-slate-400">{order.model || order.unitType}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] p-2.5 rounded-xl bg-black/40 border border-darsil-border/60">
                    <div className="flex items-center space-x-1.5 text-slate-300">
                      <Fuel className="w-3.5 h-3.5 text-amber-400" />
                      <span>Tanque: <strong>{order.fuelLevel}</strong></span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-slate-300">
                      <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Batería: <strong>{order.batteryVoltage}</strong></span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">Falla / Solicitud:</span>
                    <p className="text-xs text-slate-200 line-clamp-2 italic">"{order.reportedFault}"</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-darsil-border/60 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Avance de Tareas:</span>
                    <span className="font-mono font-bold text-amber-400">{completedTasks}/{totalTasks} ({progress}%)</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                    <span>Mecánico: <strong>{order.assignedMechanic}</strong></span>
                    {order.quoteNumber && <span className="text-amber-400 font-mono">{order.quoteNumber}</span>}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Nuevo Check-In de Recepción Digital */}
      {showCheckInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-darsil-card border border-darsil-border rounded-3xl w-full max-w-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-darsil-border pb-3">
              <div className="flex items-center space-x-2 text-amber-400">
                <Truck className="w-5 h-5" />
                <h3 className="font-bold text-sm text-white">Acta de Check-In Digital de Taller</h3>
              </div>
              <button onClick={() => setShowCheckInModal(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCheckIn} className="space-y-4 text-xs">
              
              {/* Vinculación con Cotización previa */}
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30">
                <label className="text-amber-300 font-bold block mb-1">
                  ¿Viene de una Cotización previa aprobada? (Opcional):
                </label>
                <select
                  value={formQuoteId}
                  onChange={(e) => handleSelectQuoteForCheckIn(e.target.value)}
                  className="w-full bg-darsil-obsidian border border-darsil-border rounded-xl px-3 py-2 text-white focus:border-amber-400 outline-none"
                >
                  <option value="">Ingreso Directo / Sin Cotización Previa</option>
                  {quotes.map(q => (
                    <option key={q._id} value={q._id}>
                      {q.quoteNumber} - {q.clientName} ({q.plate || 'S/P'}) - Total: S/ {q.total}
                    </option>
                  ))}
                </select>
              </div>

              {/* Datos de Unidad y Cliente */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-bold">Placa del Vehículo (*):</label>
                  <input
                    type="text"
                    required
                    value={formPlate}
                    onChange={(e) => setFormPlate(e.target.value)}
                    placeholder="ej. ABG890"
                    className="w-full bg-darsil-obsidian border border-darsil-border rounded-xl px-3 py-2 text-white uppercase font-mono font-bold focus:border-amber-400 outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-bold">Modelo / Tipo:</label>
                  <input
                    type="text"
                    value={formModel}
                    onChange={(e) => setFormModel(e.target.value)}
                    placeholder="ej. Camc Mixer / Volvo FH"
                    className="w-full bg-darsil-obsidian border border-darsil-border rounded-xl px-3 py-2 text-white focus:border-amber-400 outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-bold">Mecánico Asignado:</label>
                  <input
                    type="text"
                    value={formAssignedMechanic}
                    onChange={(e) => setFormAssignedMechanic(e.target.value)}
                    className="w-full bg-darsil-obsidian border border-darsil-border rounded-xl px-3 py-2 text-white focus:border-amber-400 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-bold">Cliente / Razón Social (*):</label>
                  <input
                    type="text"
                    required
                    value={formClientName}
                    onChange={(e) => setFormClientName(e.target.value)}
                    placeholder="ej. TRANSPORTES & MAQUINARIAS S.A.C."
                    className="w-full bg-darsil-obsidian border border-darsil-border rounded-xl px-3 py-2 text-white focus:border-amber-400 outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-bold">Nombre del Conductor que ingresa:</label>
                  <input
                    type="text"
                    value={formDriverName}
                    onChange={(e) => setFormDriverName(e.target.value)}
                    placeholder="ej. Juan Carlos Pérez"
                    className="w-full bg-darsil-obsidian border border-darsil-border rounded-xl px-3 py-2 text-white focus:border-amber-400 outline-none"
                  />
                </div>
              </div>

              {/* Medición de Tanque, Batería, Km y Horas */}
              <div className="p-3.5 rounded-2xl bg-black/40 border border-darsil-border space-y-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">
                  Telemetría & Estado de Recepción:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-1 font-bold">Tanque Combustible:</label>
                    <select
                      value={formFuelLevel}
                      onChange={(e) => setFormFuelLevel(e.target.value)}
                      className="w-full bg-darsil-obsidian border border-darsil-border rounded-xl px-2.5 py-1.5 text-white outline-none"
                    >
                      <option value="RESERVA">⚠️ Reserva</option>
                      <option value="1/4">1/4 de Tanque</option>
                      <option value="1/2">1/2 de Tanque</option>
                      <option value="3/4">3/4 de Tanque</option>
                      <option value="LLENO">🟢 Tanque Lleno</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1 font-bold">Voltaje Batería 24V:</label>
                    <input
                      type="text"
                      value={formBatteryVoltage}
                      onChange={(e) => setFormBatteryVoltage(e.target.value)}
                      placeholder="25.4 V"
                      className="w-full bg-darsil-obsidian border border-darsil-border rounded-xl px-2.5 py-1.5 text-white font-mono outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1 font-bold">Kilometraje:</label>
                    <input
                      type="text"
                      value={formMileage}
                      onChange={(e) => setFormMileage(e.target.value)}
                      placeholder="145,200 km"
                      className="w-full bg-darsil-obsidian border border-darsil-border rounded-xl px-2.5 py-1.5 text-white font-mono outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1 font-bold">Horómetro:</label>
                    <input
                      type="text"
                      value={formHourmeter}
                      onChange={(e) => setFormHourmeter(e.target.value)}
                      placeholder="3,420 hrs"
                      className="w-full bg-darsil-obsidian border border-darsil-border rounded-xl px-2.5 py-1.5 text-white font-mono outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Checklist Táctil Rápido */}
              <div className="p-3.5 rounded-2xl bg-black/40 border border-darsil-border space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 block">
                  Inspección Visual de Componentes Críticos:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <div>
                    <label className="text-slate-400 block text-[10px]">Arrancador:</label>
                    <select 
                      value={chkStarter} 
                      onChange={(e) => setChkStarter(e.target.value)}
                      className="w-full bg-darsil-obsidian border border-darsil-border rounded-lg p-1.5 text-white"
                    >
                      <option value="OPERATIVO">Operativo</option>
                      <option value="FALLA_ARRANQUE">Falla en Arranque</option>
                      <option value="NO_GIRA">No Gira / Bloqueado</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-400 block text-[10px]">Alternador:</label>
                    <select 
                      value={chkAlternator} 
                      onChange={(e) => setChkAlternator(e.target.value)}
                      className="w-full bg-darsil-obsidian border border-darsil-border rounded-lg p-1.5 text-white"
                    >
                      <option value="OPERATIVO">Operativo</option>
                      <option value="NO_CARGA">No Carga</option>
                      <option value="DEFICIENTE">Deficiente / Ruidos</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-400 block text-[10px]">Computadora ECU:</label>
                    <select 
                      value={chkEcu} 
                      onChange={(e) => setChkEcu(e.target.value)}
                      className="w-full bg-darsil-obsidian border border-darsil-border rounded-lg p-1.5 text-white"
                    >
                      <option value="SIN_ERRORES">Sin Errores</option>
                      <option value="CHECK_ACTIVO">Check Engine Activo</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-bold">Falla o Motivo de Ingreso (*):</label>
                <textarea
                  required
                  rows="2"
                  value={formReportedFault}
                  onChange={(e) => setFormReportedFault(e.target.value)}
                  placeholder="Detallar lo manifestado por el cliente o conductor..."
                  className="w-full bg-darsil-obsidian border border-darsil-border rounded-xl p-2.5 text-white focus:border-amber-400 outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-darsil-border">
                <button
                  type="button"
                  onClick={() => setShowCheckInModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black shadow-gold-glow"
                >
                  Registrar Check-In & Crear OT
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Modal Detalle de OT, Avance de Tareas y Repuestos */}
      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-darsil-card border border-darsil-border rounded-3xl w-full max-w-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-darsil-border pb-3">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-black text-lg text-white">{selectedOrder.orderNumber}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold">
                    {selectedOrder.plate}
                  </span>
                </div>
                <p className="text-xs text-slate-400">{selectedOrder.clientName} • {selectedOrder.model}</p>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cambio Rápido de Estado */}
            <div className="p-3 rounded-2xl bg-black/40 border border-darsil-border flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-bold text-slate-400">Estado en Taller:</span>
              <div className="flex flex-wrap gap-1.5">
                {['RECEPCIONADO', 'EN_DIAGNOSTICO', 'EN_PROCESO', 'PRUEBA_BANCO_24V', 'CONTROL_CALIDAD', 'FINALIZADO'].map(st => (
                  <button
                    key={st}
                    onClick={() => handleStatusChange(selectedOrder._id, st)}
                    className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition ${
                      selectedOrder.status === st
                        ? 'bg-amber-500 text-slate-950 font-black shadow-gold-glow'
                        : 'bg-darsil-card text-slate-400 hover:text-white border border-darsil-border'
                    }`}
                  >
                    {st.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Tareas de Trabajo */}
            <div className="space-y-2">
              <span className="text-xs font-black text-amber-400 uppercase tracking-wider block">
                Tareas de Mano de Obra e Intervención:
              </span>
              <div className="space-y-1.5 divide-y divide-darsil-border/50 border border-darsil-border rounded-2xl p-2 bg-darsil-obsidian">
                {(selectedOrder.tasks || []).map((t, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleToggleTask(idx)}
                    className="p-2 flex items-center justify-between cursor-pointer hover:bg-slate-900 rounded-xl transition"
                  >
                    <div className="flex items-center space-x-2 text-xs">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                        t.isCompleted ? 'bg-emerald-500 border-emerald-500 text-slate-950' : 'border-slate-600'
                      }`}>
                        {t.isCompleted && <Check className="w-3 h-3 font-bold" />}
                      </div>
                      <span className={t.isCompleted ? 'line-through text-slate-500' : 'text-slate-200'}>
                        {t.description}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">{t.mechanic || 'Taller'}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Repuestos e Insumos Consumidos (Descontados de Kardex) */}
            <div className="space-y-2">
              <span className="text-xs font-black text-cyan-400 uppercase tracking-wider block">
                Repuestos e Insumos Consumidos de Almacén:
              </span>
              
              <form onSubmit={handleAddMaterialToOrder} className="flex gap-2">
                <select
                  value={selectedMaterialId}
                  onChange={(e) => setSelectedMaterialId(e.target.value)}
                  className="flex-1 bg-darsil-obsidian border border-darsil-border text-white text-xs rounded-xl px-3 py-2 outline-none"
                >
                  <option value="">Seleccionar repuesto de almacén...</option>
                  {inventoryItems.map(item => (
                    <option key={item._id} value={item._id}>
                      {item.sku} - {item.name} (Stock: {item.currentStock} {item.unit})
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={materialQty}
                  onChange={(e) => setMaterialQty(e.target.value)}
                  className="w-20 bg-darsil-obsidian border border-darsil-border text-white text-xs rounded-xl px-2 py-2 font-mono"
                />
                <button
                  type="submit"
                  className="px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shrink-0"
                >
                  + Asignar
                </button>
              </form>

              <div className="space-y-1">
                {(selectedOrder.materialsUsed || []).length === 0 ? (
                  <div className="text-[11px] text-slate-500 italic p-2">No se han registrado repuestos utilizados.</div>
                ) : (
                  (selectedOrder.materialsUsed || []).map((m, idx) => (
                    <div key={idx} className="p-2 rounded-xl bg-black/40 border border-darsil-border flex items-center justify-between text-xs">
                      <span className="font-bold text-white">{m.name}</span>
                      <span className="font-mono text-cyan-400 font-bold">{m.quantity} {m.unit}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Acciones de Entrega */}
            <div className="flex items-center justify-between pt-3 border-t border-darsil-border">
              <div className="text-xs text-slate-400">
                {selectedOrder.status === 'ENTREGADO' ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Entregado con firma digital de conformidad
                  </span>
                ) : (
                  <span>Pendiente de entrega final</span>
                )}
              </div>

              <div className="flex items-center space-x-2">
                {selectedOrder.status !== 'ENTREGADO' && (
                  <button
                    onClick={() => {
                      setDeliveredToName(selectedOrder.driverName || selectedOrder.clientName);
                      setShowSignatureModal(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg transition active:scale-95"
                  >
                    ✍️ Entrega con Firma Digital
                  </button>
                )}
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
                >
                  Cerrar
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Modal Firma Digital de Entrega */}
      {showSignatureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="bg-darsil-card border border-darsil-border rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-darsil-border pb-3">
              <h3 className="font-black text-sm text-white">Acta de Conformidad y Entrega de Unidad</h3>
              <button onClick={() => setShowSignatureModal(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1 font-bold">Nombre del Chofer / Quien Retira:</label>
                <input
                  type="text"
                  value={deliveredToName}
                  onChange={(e) => setDeliveredToName(e.target.value)}
                  className="w-full bg-darsil-obsidian border border-darsil-border rounded-xl px-3 py-2 text-white outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-bold">Observaciones de Salida:</label>
                <input
                  type="text"
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  placeholder="Unidad probada en ruta, conforme."
                  className="w-full bg-darsil-obsidian border border-darsil-border rounded-xl px-3 py-2 text-white outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-400 font-bold">Firma Digital del Receptor en Pantalla:</label>
                  <button
                    type="button"
                    onClick={handleClearSignature}
                    className="text-[10px] text-amber-400 hover:underline"
                  >
                    Borrar trazo
                  </button>
                </div>
                
                <canvas
                  ref={canvasRef}
                  width={460}
                  height={150}
                  onMouseDown={handleStartDraw}
                  onMouseMove={handleDraw}
                  onMouseUp={handleStopDraw}
                  onTouchStart={handleStartDraw}
                  onTouchMove={handleDraw}
                  onTouchEnd={handleStopDraw}
                  className="w-full h-36 bg-black rounded-2xl border border-amber-500/30 cursor-crosshair touch-none"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-darsil-border">
              <button
                onClick={() => setShowSignatureModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveSignature}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs shadow-gold-glow"
              >
                Guardar y Finalizar Entrega
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
