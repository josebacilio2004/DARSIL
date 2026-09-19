import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Calendar, 
  Download, 
  Users, 
  FileText, 
  DollarSign, 
  Percent, 
  Filter, 
  CheckCircle2, 
  BarChart3, 
  PieChart, 
  ArrowUpRight,
  ShieldCheck
} from 'lucide-react';
import { api } from '../services/api';

export default function ReportsView() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [quotes, setQuotes] = useState([]);
  
  // Filtros de fecha
  const [dateRange, setDateRange] = useState('ALL'); // ALL, THIS_MONTH, LAST_3_MONTHS, YEAR_2026, CUSTOM
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = {};

      const now = new Date();
      if (dateRange === 'THIS_MONTH') {
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        params.startDate = firstDay;
      } else if (dateRange === 'LAST_3_MONTHS') {
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString().split('T')[0];
        params.startDate = threeMonthsAgo;
      } else if (dateRange === 'YEAR_2026') {
        params.startDate = '2026-01-01';
        params.endDate = '2026-12-31';
      } else if (dateRange === 'CUSTOM') {
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
      }

      const [resStats, resQuotes] = await Promise.all([
        api.getExecutiveReports(params),
        api.getQuotes(params)
      ]);

      if (resStats?.success && resStats.data) setData(resStats.data);
      if (resQuotes?.success && resQuotes.data) setQuotes(resQuotes.data);
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [dateRange, startDate, endDate]);

  const formatMoney = (val) => {
    return 'S/ ' + Number(val || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleExportCsv = () => {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const url = api.getExportCsvUrl(params);
    window.open(url, '_blank');
  };

  const summary = data?.summary || {};
  const topClients = data?.topClients || [];
  const topServices = data?.topServices || [];
  const monthlyTrend = data?.monthlyTrend || [];

  const maxClientTotal = topClients.length > 0 ? topClients[0].total : 1;

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* Cabecera y Filtros */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest block">
            GERENCIA & CONTABILIDAD
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Reportes Ejecutivos & Libro Contable
          </h1>
          <p className="text-xs text-slate-400">
            Análisis de facturación, desglose tributario IGV, clientes de mayor volumen y exportación a Excel.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Selector de Período */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="text-xs bg-darsil-card border border-darsil-border text-slate-200 rounded-xl px-3 py-2.5 font-bold outline-none focus:border-amber-400"
          >
            <option value="ALL">Todo el Histórico</option>
            <option value="THIS_MONTH">Mes Actual</option>
            <option value="LAST_3_MONTHS">Últimos 3 Meses</option>
            <option value="YEAR_2026">Año Fiscal 2026</option>
            <option value="CUSTOM">Rango Personalizado</option>
          </select>

          {dateRange === 'CUSTOM' && (
            <div className="flex items-center gap-1.5 bg-darsil-card p-1 rounded-xl border border-darsil-border text-xs">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-white p-1 text-[11px] outline-none"
              />
              <span className="text-slate-500">-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-white p-1 text-[11px] outline-none"
              />
            </div>
          )}

          {/* Botón Exportar CSV */}
          <button
            onClick={handleExportCsv}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:brightness-110 active:scale-95 transition"
          >
            <Download className="w-4 h-4 text-slate-950" />
            <span>📥 Exportar a Excel (CSV)</span>
          </button>
        </div>
      </div>

      {/* Tarjetas KPI Financieras */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-4 rounded-2xl bg-darsil-card border border-darsil-border flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Total Cotizado</span>
            <span className="text-2xl font-black text-amber-400">{formatMoney(summary.totalQuoted)}</span>
            <span className="text-[10px] text-slate-500 block">{summary.totalCount || 0} cotizaciones emitidas</span>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-darsil-card border border-darsil-border flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Facturación Aprobada</span>
            <span className="text-2xl font-black text-emerald-400">{formatMoney(summary.totalApproved)}</span>
            <span className="text-[10px] text-slate-500 block">{summary.approvedCount || 0} órdenes aprobadas/taller</span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-darsil-card border border-darsil-border flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Ticket Promedio</span>
            <span className="text-2xl font-black text-cyan-400">{formatMoney(summary.averageTicket)}</span>
            <span className="text-[10px] text-slate-500 block">Promedio por orden de servicio</span>
          </div>
          <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-darsil-card border border-darsil-border flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Efectividad Comercial</span>
            <span className="text-2xl font-black text-purple-400">{summary.approvalRate || 0}%</span>
            <span className="text-[10px] text-slate-500 block">Tasa de cierre de cotizaciones</span>
          </div>
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
            <Percent className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Gráficos y Tablas de Demanda */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Top Clientes por Facturación */}
        <div className="lg:col-span-6 p-5 rounded-3xl bg-darsil-card border border-darsil-border space-y-4">
          <div className="flex items-center justify-between border-b border-darsil-border pb-3">
            <div className="flex items-center space-x-2 text-amber-400">
              <Users className="w-4 h-4" />
              <h3 className="text-sm font-black text-white">Top Clientes por Facturación</h3>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Volumen Acumulado</span>
          </div>

          <div className="space-y-3">
            {topClients.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs">No hay datos suficientes para el período.</div>
            ) : (
              topClients.map((client, idx) => {
                const percentage = Math.min(100, Math.round((client.total / maxClientTotal) * 100));
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white truncate max-w-[240px]">{client.name}</span>
                      <span className="font-mono font-bold text-amber-400">{formatMoney(client.total)}</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Top Servicios más Demandados */}
        <div className="lg:col-span-6 p-5 rounded-3xl bg-darsil-card border border-darsil-border space-y-4">
          <div className="flex items-center justify-between border-b border-darsil-border pb-3">
            <div className="flex items-center space-x-2 text-cyan-400">
              <BarChart3 className="w-4 h-4" />
              <h3 className="text-sm font-black text-white">Servicios con Mayor Demanda</h3>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Frecuencia de Cotización</span>
          </div>

          <div className="space-y-2.5">
            {topServices.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs">No hay datos de servicios disponibles.</div>
            ) : (
              topServices.map((srv, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-black/40 border border-darsil-border flex items-center justify-between">
                  <div className="flex items-center space-x-2.5 overflow-hidden">
                    <span className="w-5 h-5 rounded-lg bg-cyan-500/10 text-cyan-400 font-mono font-black text-[10px] flex items-center justify-center shrink-0">
                      #{idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-slate-200 truncate">{srv.name}</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-cyan-300 shrink-0 ml-2">
                    {srv.count} unidades
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Tabla del Libro Contable de Cotizaciones */}
      <div className="p-5 rounded-3xl bg-darsil-card border border-darsil-border space-y-4">
        <div className="flex items-center justify-between border-b border-darsil-border pb-3">
          <div className="flex items-center space-x-2 text-emerald-400">
            <FileText className="w-4 h-4" />
            <h3 className="text-sm font-black text-white">Registro Auxiliar de Ventas & Cotizaciones</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">Total {quotes.length} Registros</span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-darsil-border">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-900/90 text-slate-300 font-bold border-b border-darsil-border">
              <tr>
                <th className="p-3">Fecha</th>
                <th className="p-3">N° Cotización</th>
                <th className="p-3">RUC / DNI</th>
                <th className="p-3">Razón Social / Cliente</th>
                <th className="p-3">Placa</th>
                <th className="p-3 text-right">Subtotal</th>
                <th className="p-3 text-right">IGV (18%)</th>
                <th className="p-3 text-right">Total (S/)</th>
                <th className="p-3 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-darsil-border/60">
              {quotes.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-8 text-slate-500">
                    No hay cotizaciones para el período seleccionado.
                  </td>
                </tr>
              ) : (
                quotes.map(q => (
                  <tr key={q._id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3 font-mono text-slate-400">
                      {q.issueDate ? new Date(q.issueDate).toLocaleDateString('es-PE') : '-'}
                    </td>
                    <td className="p-3 font-mono font-bold text-amber-400">
                      {q.quoteNumber}
                    </td>
                    <td className="p-3 font-mono text-slate-300">
                      {q.clientDoc || 'S/N'}
                    </td>
                    <td className="p-3 font-semibold text-white truncate max-w-[200px]">
                      {q.clientName}
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-200">
                      {q.plate || 'S/P'}
                    </td>
                    <td className="p-3 text-right font-mono text-slate-300">
                      {formatMoney(q.subtotal)}
                    </td>
                    <td className="p-3 text-right font-mono text-slate-400">
                      {formatMoney(q.igv)}
                    </td>
                    <td className="p-3 text-right font-mono font-black text-amber-400">
                      {formatMoney(q.total)}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        q.status === 'APROBADA' || q.status === 'FACTURADA'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : q.status === 'EN_TALLER'
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      }`}>
                        {q.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
