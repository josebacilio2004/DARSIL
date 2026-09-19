import React from 'react';
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
  Layers
} from 'lucide-react';

export default function DashboardView({ quotes, catalog, onOpenNewQuote, onSelectQuote, setActiveTab, onShareWhatsApp }) {
  // Cálculos estadísticos
  const totalCotizaciones = quotes.length;
  const totalMonto = quotes.reduce((acc, q) => acc + (Number(q.total) || 0), 0);
  const aprobadas = quotes.filter(q => q.status === 'APROBADA');
  const enTaller = quotes.filter(q => q.status === 'EN TALLER');
  const enviadas = quotes.filter(q => q.status === 'ENVIADA' || q.status === 'BORRADOR');
  const facturadas = quotes.filter(q => q.status === 'FACTURADA');

  const montoAprobado = aprobadas.reduce((acc, q) => acc + (Number(q.total) || 0), 0);
  const tasaAprobacion = totalCotizaciones > 0 ? Math.round((aprobadas.length / totalCotizaciones) * 100) : 0;
  const promedioCotizacion = totalCotizaciones > 0 ? totalMonto / totalCotizaciones : 0;

  // Clientes únicos
  const clientesUnicos = new Set(quotes.map(q => q.clientName?.trim()).filter(Boolean)).size;

  // Formato de moneda
  const formatSoles = (num) => {
    return 'S/ ' + Number(num || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="space-y-6">
      
      {/* Banner de Bienvenida Ejecutivo */}
      <div className="relative overflow-hidden bg-gradient-to-r from-darsil-obsidian via-slate-900 to-black p-6 sm:p-8 rounded-3xl border border-darsil-border shadow-2xl">
        <div className="absolute -right-10 -top-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black tracking-wider uppercase">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Panel de Control Ejecutivo • Operaciones & Flotas</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              DARSIL Automotive Solutions
            </h1>
            <p className="text-slate-400 text-sm max-w-xl">
              Monitoreo en tiempo real de presupuestos, órdenes de trabajo, tasa de conversión comercial y servicios técnicos de taller y terreno.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setActiveTab('portal')}
              className="flex items-center space-x-2 bg-slate-800/80 hover:bg-slate-700 text-white px-4 py-2.5 rounded-xl border border-slate-700 text-xs font-bold transition shadow-lg"
            >
              <Globe className="w-4 h-4 text-cyan-400" />
              <span>Ver Landing Clientes</span>
            </button>
            <button
              onClick={onOpenNewQuote}
              className="flex items-center space-x-2 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 px-5 py-2.5 rounded-xl text-xs font-black shadow-gold-glow active:scale-95 transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Nueva Cotización</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid de KPIs Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Facturación Cotizada */}
        <div className="bg-darsil-card p-5 rounded-2xl border border-darsil-border hover:border-amber-500/40 transition group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Cotizado</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 group-hover:scale-110 transition">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white">{formatSoles(totalMonto)}</div>
            <div className="flex items-center space-x-1.5 mt-1 text-xs text-amber-400 font-semibold">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{totalCotizaciones} cotizaciones registradas</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Monto Aprobado */}
        <div className="bg-darsil-card p-5 rounded-2xl border border-darsil-border hover:border-emerald-500/40 transition group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Monto Aprobado</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-400">{formatSoles(montoAprobado)}</div>
            <div className="flex items-center space-x-1.5 mt-1 text-xs text-emerald-400 font-semibold">
              <span>{aprobadas.length} órdenes aprobadas ({tasaAprobacion}%)</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Clientes y Flotas */}
        <div className="bg-darsil-card p-5 rounded-2xl border border-darsil-border hover:border-blue-500/40 transition group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Clientes & Flotas</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 group-hover:scale-110 transition">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white">{clientesUnicos} Empresas</div>
            <div className="flex items-center space-x-1.5 mt-1 text-xs text-blue-400 font-semibold">
              <Car className="w-3.5 h-3.5" />
              <span>Atención técnica en Lima y Regiones</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Ticket Promedio */}
        <div className="bg-darsil-card p-5 rounded-2xl border border-darsil-border hover:border-purple-500/40 transition group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ticket Promedio</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 group-hover:scale-110 transition">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white">{formatSoles(promedioCotizacion)}</div>
            <div className="flex items-center space-x-1.5 mt-1 text-xs text-purple-400 font-semibold">
              <span>Por servicio / proyecto emitido</span>
            </div>
          </div>
        </div>

      </div>

      {/* Sección Analítica: Distribución por Estado y Resumen de Servicios */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Columna Izquierda: Estados del Pipeline Comercial */}
        <div className="bg-darsil-card p-6 rounded-3xl border border-darsil-border space-y-5">
          <div className="flex items-center justify-between border-b border-darsil-border pb-3">
            <h3 className="text-sm font-black text-white flex items-center space-x-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Estado del Pipeline Comercial</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-bold">{totalCotizaciones} Total</span>
          </div>

          <div className="space-y-4">
            {/* Aprobadas */}
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Aprobadas
                </span>
                <span className="text-slate-300 font-bold">{aprobadas.length} ({totalCotizaciones > 0 ? Math.round((aprobadas.length / totalCotizaciones) * 100) : 0}%)</span>
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
                  <span className="w-2 h-2 rounded-full bg-cyan-400"></span> En Taller / Ejecución
                </span>
                <span className="text-slate-300 font-bold">{enTaller.length} ({totalCotizaciones > 0 ? Math.round((enTaller.length / totalCotizaciones) * 100) : 0}%)</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-cyan-500 rounded-full transition-all duration-500" 
                  style={{ width: `${totalCotizaciones > 0 ? (enTaller.length / totalCotizaciones) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            {/* Facturadas */}
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-purple-400 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-400"></span> Facturadas / Cerradas
                </span>
                <span className="text-slate-300 font-bold">{facturadas.length} ({totalCotizaciones > 0 ? Math.round((facturadas.length / totalCotizaciones) * 100) : 0}%)</span>
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
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span> Enviadas / Por Aprobar
                </span>
                <span className="text-slate-300 font-bold">{enviadas.length} ({totalCotizaciones > 0 ? Math.round((enviadas.length / totalCotizaciones) * 100) : 0}%)</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-500 rounded-full transition-all duration-500" 
                  style={{ width: `${totalCotizaciones > 0 ? (enviadas.length / totalCotizaciones) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

          </div>

          <div className="pt-2 border-t border-darsil-border flex justify-between items-center text-xs">
            <span className="text-slate-400">Tasa de Conversión:</span>
            <span className="text-emerald-400 font-black text-sm">{tasaAprobacion}%</span>
          </div>
        </div>

        {/* Columna Central y Derecha: Cotizaciones Recientes con Acciones */}
        <div className="lg:col-span-2 bg-darsil-card p-6 rounded-3xl border border-darsil-border space-y-4">
          <div className="flex items-center justify-between border-b border-darsil-border pb-3">
            <div>
              <h3 className="text-sm font-black text-white flex items-center space-x-2">
                <FileText className="w-4 h-4 text-amber-400" />
                <span>Últimas Cotizaciones Emitidas</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Control de documentos generados y acceso rápido a PDF y WhatsApp</p>
            </div>
            <button
              onClick={() => setActiveTab('quotes')}
              className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center space-x-1"
            >
              <span>Ver todas</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {quotes.slice(0, 5).map((q) => (
              <div 
                key={q._id}
                className="p-3.5 bg-darsil-obsidian/70 rounded-2xl border border-darsil-border/60 hover:border-amber-500/40 transition flex items-center justify-between gap-4"
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

                <div className="flex items-center space-x-3 shrink-0">
                  <div className="text-right">
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
            ))}
          </div>

        </div>

      </div>

      {/* Servicios Principales y Especialidades DARSIL */}
      <div className="bg-darsil-card p-6 rounded-3xl border border-darsil-border space-y-4">
        <div className="flex items-center justify-between border-b border-darsil-border pb-3">
          <div className="flex items-center space-x-2">
            <Wrench className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-black text-white">Especialidades & Capacidad Operativa</h3>
          </div>
          <span className="text-[11px] text-amber-400 font-bold">Laboratorio Técnico & Taller de Potencia</span>
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
