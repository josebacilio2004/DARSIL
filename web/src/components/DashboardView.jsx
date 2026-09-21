import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  Wrench, 
  Car, 
  Building2, 
  PlusCircle, 
  FileText, 
  Share2, 
  ArrowUpRight, 
  Zap,
  Globe,
  Layers,
  Boxes,
  AlertTriangle,
  RefreshCw,
  Truck,
  ClipboardCheck,
  ShieldCheck
} from 'lucide-react';
import { api } from '../services/api';

export default function DashboardView({ 
  quotes = [], 
  onOpenNewQuote, 
  onSelectQuote, 
  setActiveTab, 
  onShareWhatsApp,
  onRefreshQuotes
}) {
  const [workOrders, setWorkOrders] = useState([]);
  const [inventorySummary, setInventorySummary] = useState(null);
  const [loadingData, setLoadingData] = useState(false);
  const [activeListTab, setActiveListTab] = useState('quotes'); // 'quotes' | 'workorders'

  // Cargar datos conectados de Órdenes de Trabajo e Inventario
  const fetchConnectedData = async () => {
    try {
      setLoadingData(true);
      const [woRes, invRes] = await Promise.allSettled([
        api.getWorkOrders(),
        api.getInventorySummary()
      ]);

      if (woRes.status === 'fulfilled' && woRes.value?.success) {
        setWorkOrders(woRes.value.data || []);
      }
      if (invRes.status === 'fulfilled' && invRes.value?.success) {
        setInventorySummary(invRes.value.data || null);
      }
    } catch (err) {
      console.error('Error fetching dashboard connected data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchConnectedData();
  }, []);

  const handleManualRefresh = () => {
    onRefreshQuotes?.();
    fetchConnectedData();
  };

  // ================= CÁLCULOS ESTADÍSTICOS EN VIVO =================
  // 1. Cotizaciones
  const totalCotizaciones = quotes.length;
  const totalMonto = quotes.reduce((acc, q) => acc + (Number(q.total) || 0), 0);
  const aprobadas = quotes.filter(q => q.status === 'APROBADA');
  const enTaller = quotes.filter(q => q.status === 'EN TALLER');
  const enviadas = quotes.filter(q => q.status === 'ENVIADA' || q.status === 'BORRADOR');
  const facturadas = quotes.filter(q => q.status === 'FACTURADA');

  const montoAprobado = aprobadas.reduce((acc, q) => acc + (Number(q.total) || 0), 0);
  const tasaAprobacion = totalCotizaciones > 0 ? Math.round((aprobadas.length / totalCotizaciones) * 100) : 0;
  const promedioCotizacion = totalCotizaciones > 0 ? totalMonto / totalCotizaciones : 0;

  // 2. Órdenes de Trabajo Taller & Terreno
  const otCounts = {
    total: workOrders.length,
    despachado: workOrders.filter(w => w.status === 'DESPACHADO').length,
    diagnostico: workOrders.filter(w => w.status === 'EN_DIAGNOSTICO').length,
    enProceso: workOrders.filter(w => w.status === 'EN_PROCESO').length,
    concluido: workOrders.filter(w => w.status === 'CONCLUIDO').length,
  };
  const otsActivas = otCounts.despachado + otCounts.diagnostico + otCounts.enProceso;

  // 3. Inventario
  const totalValuacionInventario = inventorySummary?.totalValuation || 0;
  const totalProductosInventario = inventorySummary?.totalProducts || 0;
  const productosBajoStock = inventorySummary?.lowStockCount || 0;

  // 4. Clientes únicos consolidados (de cotizaciones y órdenes de trabajo)
  const clientSet = new Set([
    ...quotes.map(q => q.clientName?.trim()).filter(Boolean),
    ...workOrders.map(w => w.clientName?.trim()).filter(Boolean)
  ]);
  const clientesUnicos = clientSet.size;

  // Formato de moneda Soles
  const formatSoles = (num) => {
    return 'S/ ' + Number(num || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="space-y-6">
      
      {/* Banner de Bienvenida Ejecutivo con Estado en Vivo */}
      <div className="relative overflow-hidden bg-gradient-to-r from-darsil-obsidian via-slate-900 to-black p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-darsil-border shadow-2xl">
        <div className="absolute -right-10 -top-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
          <div className="space-y-1.5 sm:space-y-2 min-w-0">
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] sm:text-xs font-black tracking-wider uppercase max-w-full">
              <Zap className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">Panel de Control Ejecutivo • Operaciones</span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">
              DARSIL Automotive Solutions
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm max-w-xl">
              Monitoreo en tiempo real de presupuestos, órdenes de trabajo, tasa de conversión comercial, inventario kardex y logística en ruta.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 sm:gap-3 w-full md:w-auto">
            <button
              onClick={handleManualRefresh}
              disabled={loadingData}
              className="flex items-center justify-center space-x-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white px-3.5 py-2 sm:py-2.5 rounded-xl border border-slate-700 text-xs font-bold transition shadow-lg active:scale-95 w-full sm:w-auto"
              title="Actualizar datos en vivo desde la base de datos"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${loadingData ? 'animate-spin' : ''}`} />
              <span>{loadingData ? 'Sincronizando...' : 'Actualizar Datos'}</span>
            </button>
            <button
              onClick={() => setActiveTab('portal')}
              className="flex items-center justify-center space-x-2 bg-slate-800/80 hover:bg-slate-700 text-white px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-slate-700 text-xs font-bold transition shadow-lg active:scale-95 w-full sm:w-auto"
            >
              <Globe className="w-4 h-4 text-cyan-400" />
              <span>Ver Landing Clientes</span>
            </button>
            <button
              onClick={onOpenNewQuote}
              className="flex items-center justify-center space-x-2 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 px-4 sm:px-5 py-2.5 rounded-xl text-xs font-black shadow-gold-glow active:scale-95 transition w-full sm:w-auto"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Nueva Cotización</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid de KPIs Principales: 2 columnas en iPhone 15 Pro, 3 en tablet, 6 en desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2.5 sm:gap-4">
        
        {/* KPI 1: Facturación Cotizada */}
        <div 
          onClick={() => setActiveTab('quotes')}
          className="bg-darsil-card p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-darsil-border hover:border-amber-500/50 transition cursor-pointer group hover:bg-darsil-obsidian shadow-card-dark"
        >
          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Total Cotizado</span>
            <div className="p-1 sm:p-1.5 rounded-lg sm:rounded-xl bg-amber-500/10 text-amber-400 group-hover:scale-110 transition shrink-0">
              <DollarSign className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2.5">
            <div className="text-base sm:text-xl font-black text-white truncate">{formatSoles(totalMonto)}</div>
            <div className="flex items-center space-x-1 mt-0.5 sm:mt-1 text-[10px] sm:text-[11px] text-amber-400 font-semibold truncate">
              <TrendingUp className="w-2.5 sm:w-3 h-2.5 sm:h-3 shrink-0" />
              <span>{totalCotizaciones} cotizaciones</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Monto Aprobado */}
        <div 
          onClick={() => setActiveTab('quotes')}
          className="bg-darsil-card p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-darsil-border hover:border-emerald-500/50 transition cursor-pointer group hover:bg-darsil-obsidian shadow-card-dark"
        >
          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Monto Aprobado</span>
            <div className="p-1 sm:p-1.5 rounded-lg sm:rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition shrink-0">
              <CheckCircle2 className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2.5">
            <div className="text-base sm:text-xl font-black text-emerald-400 truncate">{formatSoles(montoAprobado)}</div>
            <div className="flex items-center space-x-1 mt-0.5 sm:mt-1 text-[10px] sm:text-[11px] text-emerald-400 font-semibold truncate">
              <span>{aprobadas.length} ({tasaAprobacion}%)</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Órdenes de Trabajo Activas en Taller */}
        <div 
          onClick={() => setActiveTab('workorders')}
          className="bg-darsil-card p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-darsil-border hover:border-cyan-500/50 transition cursor-pointer group hover:bg-darsil-obsidian shadow-card-dark relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1 sm:space-x-1.5 min-w-0">
              <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-cyan-400 animate-pulse shrink-0"></span>
              <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">TALLER & OTs</span>
            </div>
            <div className="p-1 sm:p-1.5 rounded-lg sm:rounded-xl bg-cyan-500/10 text-cyan-400 group-hover:scale-110 transition shrink-0">
              <Wrench className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2.5">
            <div className="text-base sm:text-xl font-black text-cyan-400 truncate">{otsActivas} OTs Activas</div>
            <div className="mt-0.5 sm:mt-1 text-[9px] sm:text-[10px] text-slate-400 font-semibold truncate">
              {otCounts.diagnostico} Diag • {otCounts.enProceso} Proc
            </div>
          </div>
        </div>

        {/* KPI 4: Almacén & Kardex Valorizado */}
        <div 
          onClick={() => setActiveTab('inventory')}
          className="bg-darsil-card p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-darsil-border hover:border-purple-500/50 transition cursor-pointer group hover:bg-darsil-obsidian shadow-card-dark"
        >
          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">STOCK REPUESTOS</span>
            <div className="p-1 sm:p-1.5 rounded-lg sm:rounded-xl bg-purple-500/10 text-purple-400 group-hover:scale-110 transition shrink-0">
              <Boxes className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2.5">
            <div className="text-base sm:text-xl font-black text-purple-400 truncate">{formatSoles(totalValuacionInventario)}</div>
            <div className="flex items-center justify-between mt-0.5 sm:mt-1 text-[9px] sm:text-[10px]">
              <span className="text-slate-400 font-semibold truncate">{totalProductosInventario} repuestos</span>
              {productosBajoStock > 0 && (
                <span className="text-rose-400 font-bold flex items-center gap-0.5 shrink-0 ml-1">
                  <AlertTriangle className="w-2.5 h-2.5" />
                  {productosBajoStock}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* KPI 5: Clientes & Flotas Registradas */}
        <div 
          onClick={() => setActiveTab('quotes')}
          className="bg-darsil-card p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-darsil-border hover:border-blue-500/50 transition cursor-pointer group hover:bg-darsil-obsidian shadow-card-dark"
        >
          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Clientes & Flotas</span>
            <div className="p-1 sm:p-1.5 rounded-lg sm:rounded-xl bg-blue-500/10 text-blue-400 group-hover:scale-110 transition shrink-0">
              <Building2 className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2.5">
            <div className="text-base sm:text-xl font-black text-white truncate">{clientesUnicos} Empresas</div>
            <div className="flex items-center space-x-1 mt-0.5 sm:mt-1 text-[10px] sm:text-[11px] text-blue-400 font-semibold truncate">
              <Car className="w-2.5 sm:w-3 h-2.5 sm:h-3 shrink-0" />
              <span>Atención integral</span>
            </div>
          </div>
        </div>

        {/* KPI 6: Ticket Promedio */}
        <div 
          onClick={() => setActiveTab('quotes')}
          className="bg-darsil-card p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-darsil-border hover:border-amber-500/50 transition cursor-pointer group hover:bg-darsil-obsidian shadow-card-dark"
        >
          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Ticket Promedio</span>
            <div className="p-1 sm:p-1.5 rounded-lg sm:rounded-xl bg-yellow-500/10 text-yellow-400 group-hover:scale-110 transition shrink-0">
              <Layers className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2.5">
            <div className="text-base sm:text-xl font-black text-white truncate">{formatSoles(promedioCotizacion)}</div>
            <div className="mt-0.5 sm:mt-1 text-[10px] sm:text-[11px] text-slate-400 font-semibold truncate">
              <span>Por servicio</span>
            </div>
          </div>
        </div>

      </div>

      {/* Sección Analítica: Distribución por Estado y Actividad en Vivo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        
        {/* Columna Izquierda: Estados del Pipeline Comercial & Taller */}
        <div className="bg-darsil-card p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-darsil-border space-y-4 sm:space-y-5">
          <div className="flex items-center justify-between border-b border-darsil-border pb-3">
            <h3 className="text-sm font-black text-white flex items-center space-x-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Pipeline Comercial & Taller</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-bold">{totalCotizaciones} Cotizaciones</span>
          </div>

          <div className="space-y-4">
            {/* Aprobadas */}
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Cotizaciones Aprobadas
                </span>
                <span className="text-slate-300 font-bold">{aprobadas.length} ({tasaAprobacion}%)</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                  style={{ width: `${totalCotizaciones > 0 ? (aprobadas.length / totalCotizaciones) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            {/* En Taller */}
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-cyan-400 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400"></span> En Taller / En Proceso
                </span>
                <span className="text-slate-300 font-bold">{enTaller.length + otCounts.enProceso} unidades</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-cyan-500 rounded-full transition-all duration-500" 
                  style={{ width: `${totalCotizaciones > 0 ? ((enTaller.length + otCounts.enProceso) / Math.max(totalCotizaciones, 1)) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            {/* Órdenes de Trabajo en Terreno / Auxilio */}
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-blue-400 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-400"></span> Auxilio Técnico en Terreno
                </span>
                <span className="text-slate-300 font-bold">{otCounts.despachado} unidades</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-500" 
                  style={{ width: `${otCounts.total > 0 ? (otCounts.despachado / otCounts.total) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            {/* Facturadas / Concluidas */}
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-purple-400 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-400"></span> Concluidas & Facturadas
                </span>
                <span className="text-slate-300 font-bold">{facturadas.length + otCounts.concluido} registradas</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-500 rounded-full transition-all duration-500" 
                  style={{ width: `${totalCotizaciones > 0 ? (facturadas.length / totalCotizaciones) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            {/* Pendientes / Enviadas */}
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-amber-400 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span> Cotizaciones por Aprobar
                </span>
                <span className="text-slate-300 font-bold">{enviadas.length}</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-500 rounded-full transition-all duration-500" 
                  style={{ width: `${totalCotizaciones > 0 ? (enviadas.length / totalCotizaciones) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

          </div>

          <div className="pt-3 border-t border-darsil-border flex justify-between items-center text-xs">
            <span className="text-slate-400">Tasa de Conversión Comercial:</span>
            <span className="text-emerald-400 font-black text-sm">{tasaAprobacion}%</span>
          </div>
        </div>

        {/* Columna Central y Derecha: Actividad Reciente (Cotizaciones y Órdenes de Trabajo) */}
        <div className="lg:col-span-2 bg-darsil-card p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-darsil-border space-y-4">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-darsil-border pb-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setActiveListTab('quotes')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                  activeListTab === 'quotes'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-gold-glow'
                    : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Cotizaciones ({quotes.length})</span>
              </button>

              <button
                onClick={() => setActiveListTab('workorders')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                  activeListTab === 'workorders'
                    ? 'bg-cyan-500 text-slate-950 font-black shadow-cyan-glow'
                    : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Órdenes de Trabajo ({workOrders.length})</span>
              </button>
            </div>

            <button
              onClick={() => setActiveTab(activeListTab === 'quotes' ? 'quotes' : 'workorders')}
              className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center space-x-1 self-end sm:self-auto"
            >
              <span>Ver todas</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* LISTA 1: Cotizaciones */}
          {activeListTab === 'quotes' && (
            <div className="space-y-3">
              {quotes.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">
                  No hay cotizaciones registradas aún. Haz clic en "Nueva Cotización" para emitir la primera.
                </div>
              ) : (
                quotes.slice(0, 5).map((q) => (
                  <div 
                    key={q._id}
                    className="p-3 sm:p-3.5 bg-darsil-obsidian/70 rounded-2xl border border-darsil-border/60 hover:border-amber-500/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                        <Car className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-black text-white">{q.quoteNumber}</span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            q.status === 'APROBADA' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                            q.status === 'EN TALLER' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' :
                            'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}>
                            {q.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 truncate font-medium">{q.clientName}</p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {q.plate ? `Placa: ${q.plate} • ${q.model}` : 'Servicio Especial'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end space-x-3 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60 shrink-0">
                      <div className="text-left sm:text-right">
                        <div className="text-xs font-black text-amber-400">{formatSoles(q.total)}</div>
                        <div className="text-[10px] text-slate-400">{q.items?.length || 1} partida(s)</div>
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => onSelectQuote(q)}
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
                          title="Ver PDF Oficial"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onShareWhatsApp(q)}
                          className="p-1.5 rounded-lg bg-emerald-950/80 text-emerald-400 hover:bg-emerald-900 border border-emerald-500/30 transition"
                          title="Enviar WhatsApp al cliente"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* LISTA 2: Órdenes de Trabajo en Curso */}
          {activeListTab === 'workorders' && (
            <div className="space-y-3">
              {workOrders.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">
                  No hay órdenes de trabajo activas en taller. Registra un Check-In para comenzar el diagnóstico.
                </div>
              ) : (
                workOrders.slice(0, 5).map((wo) => (
                  <div 
                    key={wo._id}
                    className="p-3 sm:p-3.5 bg-darsil-obsidian/70 rounded-2xl border border-darsil-border/60 hover:border-cyan-500/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shrink-0">
                        <Wrench className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-black text-white">{wo.orderNumber}</span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            wo.status === 'EN_DIAGNOSTICO' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                            wo.status === 'EN_PROCESO' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' :
                            wo.status === 'DESPACHADO' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                            wo.status === 'CONCLUIDO' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                            'bg-slate-500/20 text-slate-300 border border-slate-500/30'
                          }`}>
                            {wo.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 truncate font-medium">{wo.clientName}</p>
                        <p className="text-[10px] text-amber-400 font-mono truncate">
                          Placa: {wo.plate} • {wo.model}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end space-x-3 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60 shrink-0">
                      <div className="text-left sm:text-right">
                        <div className="text-xs font-black text-cyan-400">{formatSoles(wo.totalEstimated)}</div>
                        <div className="text-[10px] text-slate-400">{wo.items?.length || 0} tareas / fallas</div>
                      </div>

                      <button
                        onClick={() => setActiveTab('workorders')}
                        className="px-2.5 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-bold transition flex items-center space-x-1"
                        title="Gestionar en módulo Taller"
                      >
                        <span>Gestionar OT</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

        </div>

      </div>

      {/* Especialidades DARSIL y Capacidades de Ingeniería */}
      <div className="bg-darsil-card p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-darsil-border space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-darsil-border pb-3">
          <div className="flex items-center space-x-2">
            <Wrench className="w-4 h-4 text-amber-400 shrink-0" />
            <h3 className="text-sm font-black text-white">Capacidad Operativa & Especialidades DARSIL</h3>
          </div>
          <span className="text-[10px] sm:text-[11px] text-amber-400 font-bold">Laboratorio Técnico & Taller Especializado</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-darsil-obsidian rounded-2xl border border-darsil-border/50">
            <div className="font-bold text-white mb-1">Diagnóstico Digital CAN-Bus</div>
            <p className="text-[11px] text-slate-400">Escaneo de computadoras ECU, sensores y actuadores de flotas pesadas 24V.</p>
          </div>
          <div className="p-3 bg-darsil-obsidian rounded-2xl border border-darsil-border/50">
            <div className="font-bold text-white mb-1">Manufactura 3D Aditiva</div>
            <p className="text-[11px] text-slate-400">Diseño y fabricación rápida de repuestos automotrices descontinuados en polímeros técnicos.</p>
          </div>
          <div className="p-3 bg-darsil-obsidian rounded-2xl border border-darsil-border/50">
            <div className="font-bold text-white mb-1">Unidades de Auxilio Técnico</div>
            <p className="text-[11px] text-slate-400">Asistencia mecánica y eléctrica móvil en ruta con cálculo logístico Mapbox.</p>
          </div>
          <div className="p-3 bg-darsil-obsidian rounded-2xl border border-darsil-border/50">
            <div className="font-bold text-white mb-1">Sistemas de Potencia & Arranque</div>
            <p className="text-[11px] text-slate-400">Rebobinado, alternadores de alto amperaje y bancos de baterías de ciclo pesado.</p>
          </div>
        </div>
      </div>

    </div>
  );
}
