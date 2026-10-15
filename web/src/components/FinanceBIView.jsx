import React, { useState, useEffect, useMemo, useRef } from 'react';
import * as echarts from 'echarts';
import { 
  TrendingUp, 
  DollarSign, 
  CreditCard, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight, 
  PieChart, 
  BarChart3, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Users, 
  Car, 
  Receipt, 
  Coins, 
  RefreshCw, 
  Download, 
  Printer, 
  ChevronRight, 
  AlertTriangle,
  Award,
  ExternalLink,
  Percent,
  Sparkles,
  Bot,
  Send,
  HelpCircle,
  Lightbulb,
  Zap,
  Target,
  ArrowRight,
  Search,
  Filter,
  Activity,
  Check
} from 'lucide-react';
import { api } from '../services/api';

/**
 * Componente Wrapper para gráficos de Apache ECharts
 * Soporta auto-resize reactivo con ResizeObserver
 */
function EChartCard({ option, style = { height: 300 } }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!chartRef.current) return;

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    if (option) {
      chartInstance.current.setOption(option, true);
    }

    const resizeObserver = new ResizeObserver(() => {
      chartInstance.current?.resize();
    });
    resizeObserver.observe(chartRef.current);

    const handleWindowResize = () => {
      chartInstance.current?.resize();
    };
    window.addEventListener('resize', handleWindowResize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleWindowResize);
      chartInstance.current?.dispose();
      chartInstance.current = null;
    };
  }, [option]);

  return <div ref={chartRef} style={{ width: '100%', ...style }} />;
}

export default function FinanceBIView({ onNavigateToFinancial }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados del Bot Asesor BI Inteligente
  const [advisorData, setAdvisorData] = useState(null);
  const [advisorLoading, setAdvisorLoading] = useState(false);
  const [advisorQuery, setAdvisorQuery] = useState('');
  const [advisorChat, setAdvisorChat] = useState([]);

  // Estados para filtro y búsqueda de Rentabilidad por Trabajo
  const [jobSearch, setJobSearch] = useState('');
  const [jobLevelFilter, setJobLevelFilter] = useState('ALL');
  const [jobSortField, setJobSortField] = useState('netProfit');
  const [jobSortOrder, setJobSortOrder] = useState('desc');

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getBIMetrics();
      if (res?.success && res.data) {
        setData(res.data);
      } else {
        setError(res?.message || 'Error cargando métricas financieras');
      }
    } catch (err) {
      console.error('Error cargando métricas BI:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdvisorInsight = async (questionText = '') => {
    try {
      setAdvisorLoading(true);
      const res = await api.getBIAdvisorInsight({ question: questionText });
      if (res?.success && res.data) {
        setAdvisorData(res.data);
        if (questionText && res.data.answer) {
          setAdvisorChat(prev => [
            ...prev,
            {
              question: questionText,
              answer: res.data.answer,
              time: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
            }
          ]);
        }
      }
    } catch (err) {
      console.error('Error cargando dictamen del Bot Asesor BI:', err);
    } finally {
      setAdvisorLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    fetchAdvisorInsight(''); // Auditoría inicial automática
  }, []);

  const formatCurrency = (val) => {
    return 'S/ ' + Number(val || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleAskAdvisor = (e) => {
    e?.preventDefault();
    if (!advisorQuery.trim()) return;
    const query = advisorQuery;
    setAdvisorQuery('');
    fetchAdvisorInsight(query);
  };

  const handleQuickQuestion = (q) => {
    fetchAdvisorInsight(q);
  };

  // --- OPCIONES PARA APACHE ECHARTS ---

  // 1. Gráfico de Flujo de Caja Proyectado (Forecasting a 15, 30 y 60 Días)
  const cashFlowOption = useMemo(() => {
    if (!data?.cashFlow) return null;
    const { next15Days, next30Days, next60Days } = data.cashFlow;

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: '#090d16',
        borderColor: '#334155',
        borderWidth: 1,
        textStyle: { color: '#f8fafc' },
        formatter: (params) => {
          let html = `<div style="font-size:12px;font-weight:bold;color:#f8fafc;padding:2px 4px;">${params[0].name}</div>`;
          params.forEach(p => {
            html += `<div style="display:flex;justify-content:space-between;gap:12px;font-size:11px;color:#cbd5e1;">
              <span>${p.marker} ${p.seriesName}:</span>
              <span style="font-weight:bold;color:#f59e0b;">S/ ${Number(p.value).toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
            </div>`;
          });
          return html;
        }
      },
      grid: { top: '15%', left: '3%', right: '4%', bottom: '8%', containLabel: true },
      xAxis: {
        type: 'category',
        data: ['Próximos 15 Días', 'Próximos 30 Días', 'Próximos 60 Días'],
        axisLine: { lineStyle: { color: '#334155' } },
        axisLabel: { color: '#cbd5e1', fontWeight: 'bold', fontSize: 11 }
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#1e293b', type: 'dashed' } },
        axisLabel: {
          color: '#64748b',
          formatter: (v) => `S/ ${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`
        }
      },
      series: [
        {
          name: 'Proyección de Recaudación',
          type: 'bar',
          barWidth: '42%',
          data: [
            {
              value: next15Days || 0,
              itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: '#10b981' },
                  { offset: 1, color: '#047857' }
                ]),
                borderRadius: [8, 8, 0, 0]
              }
            },
            {
              value: next30Days || 0,
              itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: '#0ea5e9' },
                  { offset: 1, color: '#0369a1' }
                ]),
                borderRadius: [8, 8, 0, 0]
              }
            },
            {
              value: next60Days || 0,
              itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: '#a855f7' },
                  { offset: 1, color: '#6b21a8' }
                ]),
                borderRadius: [8, 8, 0, 0]
              }
            }
          ],
          label: {
            show: true,
            position: 'top',
            color: '#f8fafc',
            fontWeight: 'bold',
            fontSize: 12,
            formatter: (p) => 'S/ ' + Number(p.value).toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
          }
        }
      ]
    };
  }, [data?.cashFlow]);

  // 2. Gráfico Donut de Rentabilidad por Servicio
  const serviceCategoriesOption = useMemo(() => {
    if (!data?.serviceCategories || data.serviceCategories.length === 0) return null;
    const pieData = data.serviceCategories.map((c, i) => ({
      name: c.name,
      value: c.total,
      count: c.count,
      itemStyle: {
        color: c.color || ['#f59e0b', '#10b981', '#0ea5e9', '#8b5cf6', '#ec4899', '#f97316'][i % 6]
      }
    }));

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: '#090d16',
        borderColor: '#334155',
        borderWidth: 1,
        formatter: (p) => {
          return `<div style="padding:4px 6px;">
            <div style="font-weight:bold;color:#fff;">${p.name}</div>
            <div style="color:#94a3b8;font-size:11px;margin-top:2px;">Monto Total: <b style="color:#f59e0b;">S/ ${Number(p.value).toLocaleString('es-PE', { minimumFractionDigits: 2 })}</b></div>
            <div style="color:#94a3b8;font-size:11px;">Participación: <b style="color:#10b981;">${p.percent}%</b> (${p.data.count} atenciones)</div>
          </div>`;
        }
      },
      legend: {
        orient: 'vertical',
        right: '2%',
        top: 'middle',
        textStyle: { color: '#94a3b8', fontSize: 11 },
        itemWidth: 10,
        itemHeight: 10
      },
      series: [
        {
          name: 'Línea de Servicio',
          type: 'pie',
          radius: ['45%', '75%'],
          center: ['35%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 8,
            borderColor: '#0f172a',
            borderWidth: 3
          },
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 13,
              fontWeight: 'bold',
              color: '#fff',
              formatter: '{b}\n{d}%'
            }
          },
          labelLine: { show: false },
          data: pieData
        }
      ]
    };
  }, [data?.serviceCategories]);

  // 3. Gráfico Horizontal de Concentración de Flotas / Marcas
  const fleetBrandsOption = useMemo(() => {
    if (!data?.fleetBrands || data.fleetBrands.length === 0) return null;
    const sorted = [...data.fleetBrands].slice(0, 6).reverse();
    const names = sorted.map(b => b.name);
    const values = sorted.map(b => b.count);

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: '#090d16',
        borderColor: '#334155',
        borderWidth: 1,
        formatter: (params) => {
          const p = params[0];
          return `<div style="padding:4px 6px;">
            <div style="font-weight:bold;color:#fff;">${p.name}</div>
            <div style="color:#94a3b8;font-size:11px;margin-top:2px;">Unidades en Taller: <b style="color:#f59e0b;">${p.value} unidades</b></div>
          </div>`;
        }
      },
      grid: { top: '8%', left: '3%', right: '12%', bottom: '5%', containLabel: true },
      xAxis: {
        type: 'value',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#1e293b', type: 'dashed' } },
        axisLabel: { color: '#64748b' }
      },
      yAxis: {
        type: 'category',
        data: names,
        axisLine: { lineStyle: { color: '#334155' } },
        axisLabel: { color: '#cbd5e1', fontWeight: 'bold', fontSize: 11 }
      },
      series: [
        {
          name: 'Unidades Atendidas',
          type: 'bar',
          barWidth: 16,
          data: values,
          label: {
            show: true,
            position: 'right',
            color: '#f59e0b',
            fontWeight: 'bold',
            fontSize: 11,
            formatter: '{c} uds'
          },
          itemStyle: {
            color: new echarts.graphic.LinearGradient(1, 0, 0, 0, [
              { offset: 0, color: '#f59e0b' },
              { offset: 1, color: '#b45309' }
            ]),
            borderRadius: [0, 6, 6, 0]
          }
        }
      ]
    };
  }, [data?.fleetBrands]);

  // 4. Gráfico Histórico Semestral: Facturación vs Cobranzas + Tasa de Recupero
  const monthlyTrendsOption = useMemo(() => {
    if (!data?.monthlyTrends || data.monthlyTrends.length === 0) return null;
    const months = data.monthlyTrends.map(t => t.month);
    const billedData = data.monthlyTrends.map(t => t.billed);
    const collectedData = data.monthlyTrends.map(t => t.collected);
    const rateData = data.monthlyTrends.map(t => t.billed > 0 ? Math.round((t.collected / t.billed) * 100) : 100);

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#090d16',
        borderColor: '#334155',
        borderWidth: 1,
        formatter: (params) => {
          let res = `<div style="font-weight:bold;color:#fff;margin-bottom:4px;">${params[0].name}</div>`;
          params.forEach(p => {
            const val = p.seriesName.includes('%') 
              ? `${p.value}%` 
              : `S/ ${Number(p.value).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;
            res += `<div style="display:flex;justify-content:space-between;gap:12px;font-size:11px;color:#cbd5e1;">
              <span>${p.marker} ${p.seriesName}:</span>
              <span style="font-weight:bold;color:#f8fafc;">${val}</span>
            </div>`;
          });
          return res;
        }
      },
      legend: {
        data: ['Facturación Acordada', 'Cobranza Efectiva', 'Tasa Recupero (%)'],
        textStyle: { color: '#94a3b8', fontSize: 11 },
        top: 0
      },
      grid: { top: '18%', left: '3%', right: '5%', bottom: '5%', containLabel: true },
      xAxis: {
        type: 'category',
        data: months,
        axisLine: { lineStyle: { color: '#334155' } },
        axisLabel: { color: '#94a3b8', fontSize: 11 }
      },
      yAxis: [
        {
          type: 'value',
          axisLine: { show: false },
          splitLine: { lineStyle: { color: '#1e293b', type: 'dashed' } },
          axisLabel: {
            color: '#64748b',
            formatter: (v) => `S/ ${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`
          }
        },
        {
          type: 'value',
          max: 100,
          axisLine: { show: false },
          splitLine: { show: false },
          axisLabel: {
            color: '#38bdf8',
            formatter: '{value}%'
          }
        }
      ],
      series: [
        {
          name: 'Facturación Acordada',
          type: 'bar',
          barGap: 0,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#f59e0b' },
              { offset: 1, color: '#b45309' }
            ]),
            borderRadius: [4, 4, 0, 0]
          },
          data: billedData
        },
        {
          name: 'Cobranza Efectiva',
          type: 'bar',
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#10b981' },
              { offset: 1, color: '#047857' }
            ]),
            borderRadius: [4, 4, 0, 0]
          },
          data: collectedData
        },
        {
          name: 'Tasa Recupero (%)',
          type: 'line',
          yAxisIndex: 1,
          smooth: true,
          lineStyle: { color: '#38bdf8', width: 3 },
          itemStyle: { color: '#38bdf8' },
          data: rateData
        }
      ]
    };
  }, [data?.monthlyTrends]);

  // 5. Gráfico Horizontal de Top Trabajos por Utilidad Neta (S/)
  const topJobsProfitOption = useMemo(() => {
    if (!data?.jobProfitability?.jobs || data.jobProfitability.jobs.length === 0) return null;
    const top5 = [...data.jobProfitability.jobs].slice(0, 5).reverse();

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: '#090d16',
        borderColor: '#334155',
        borderWidth: 1,
        textStyle: { color: '#f8fafc' },
        formatter: (params) => {
          const item = top5[params[0].dataIndex];
          if (!item) return '';
          return `<div style="font-size:12px;font-weight:bold;color:#f8fafc;padding:2px 4px;">${item.orderNumber} - ${item.clientName}</div>
            <div style="font-size:11px;color:#94a3b8;margin-bottom:4px;">Placa: ${item.plate} • ${item.serviceDescription}</div>
            <div style="display:flex;justify-content:space-between;gap:12px;font-size:11px;color:#cbd5e1;">
              <span>Facturación:</span>
              <span style="font-weight:bold;color:#f8fafc;">S/ ${Number(item.totalRevenue).toFixed(2)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;gap:12px;font-size:11px;color:#f43f5e;">
              <span>Costos Operativos:</span>
              <span style="font-weight:bold;">- S/ ${Number(item.totalCost).toFixed(2)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;gap:12px;font-size:11px;color:#10b981;border-top:1px solid #334155;padding-top:4px;margin-top:4px;">
              <span>Utilidad Neta:</span>
              <span style="font-weight:bold;">S/ ${Number(item.netProfit).toFixed(2)} (${item.marginPercent}% Margen)</span>
            </div>`;
        }
      },
      grid: { top: '8%', left: '3%', right: '12%', bottom: '5%', containLabel: true },
      xAxis: {
        type: 'value',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#1e293b', type: 'dashed' } },
        axisLabel: {
          color: '#64748b',
          formatter: (v) => `S/ ${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`
        }
      },
      yAxis: {
        type: 'category',
        data: top5.map(j => `${j.orderNumber} (${j.plate})`),
        axisLine: { lineStyle: { color: '#334155' } },
        axisLabel: { color: '#cbd5e1', fontWeight: 'bold', fontSize: 11 }
      },
      series: [
        {
          name: 'Utilidad Neta (S/)',
          type: 'bar',
          barWidth: '45%',
          data: top5.map(j => ({
            value: j.netProfit,
            itemStyle: {
              color: new echarts.graphic.LinearGradient(1, 0, 0, 0, [
                { offset: 0, color: '#10b981' },
                { offset: 1, color: '#047857' }
              ]),
              borderRadius: [0, 8, 8, 0]
            }
          })),
          label: {
            show: true,
            position: 'right',
            color: '#10b981',
            fontWeight: 'bold',
            fontSize: 11,
            formatter: (p) => 'S/ ' + Number(p.value).toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
          }
        }
      ]
    };
  }, [data?.jobProfitability]);

  // Lista filtrada y ordenada de trabajos analizados
  const filteredJobs = useMemo(() => {
    if (!data?.jobProfitability?.jobs) return [];
    let list = [...data.jobProfitability.jobs];

    if (jobSearch.trim()) {
      const q = jobSearch.toLowerCase().trim();
      list = list.filter(j =>
        (j.orderNumber || '').toLowerCase().includes(q) ||
        (j.quoteNumber || '').toLowerCase().includes(q) ||
        (j.clientName || '').toLowerCase().includes(q) ||
        (j.plate || '').toLowerCase().includes(q) ||
        (j.serviceDescription || '').toLowerCase().includes(q)
      );
    }

    if (jobLevelFilter !== 'ALL') {
      list = list.filter(j => j.profitabilityLevel === jobLevelFilter);
    }

    list.sort((a, b) => {
      let valA = a[jobSortField];
      let valB = b[jobSortField];
      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }
      if (valA < valB) return jobSortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return jobSortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [data?.jobProfitability?.jobs, jobSearch, jobLevelFilter, jobSortField, jobSortOrder]);

  if (loading) {
    return (
      <div className="bg-darsil-card border border-darsil-border p-16 rounded-2xl text-center space-y-3">
        <RefreshCw className="w-10 h-10 animate-spin text-amber-400 mx-auto" />
        <div className="text-sm font-bold text-white">Calculando Indicadores Ejecutivos & Proyecciones Financieras...</div>
        <p className="text-xs text-slate-400">Analizando flujo de caja, cobranzas, cartera vencida y rentabilidad por servicio con MongoDB.</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl text-center space-y-3">
        <AlertTriangle className="w-8 h-8 text-red-400 mx-auto" />
        <div className="text-sm font-bold text-red-300">Error al cargar métricas de Business Intelligence</div>
        <p className="text-xs text-slate-400">{error || 'No se recibieron datos del servidor'}</p>
        <button
          onClick={fetchMetrics}
          className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition"
        >
          Reintentar
        </button>
      </div>
    );
  }

  const { kpis, cashFlow, topClients, recentPayments, jobProfitability } = data;
  const jobSummary = jobProfitability?.summary || {
    totalRevenue: 0,
    totalPartsCost: 0,
    totalLaborCost: 0,
    totalOperatingCost: 0,
    totalNetProfit: 0,
    overallMarginPercent: 0,
    overallRoiPercent: 0,
    analyzedJobsCount: 0,
    mostProfitableJob: null,
    highestMarginJob: null
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16 print:p-0 print:space-y-4">
      
      {/* Encabezado Ejecutivo */}
      <div className="bg-gradient-to-r from-darsil-card via-slate-900 to-darsil-card p-4 sm:p-6 rounded-2xl border border-darsil-border shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                PANEL EJECUTIVO DE FINANZAS & BUSINESS INTELLIGENCE
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
                AUDITORÍA AUTOMÁTICA EN TIEMPO REAL
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              <BarChart3 className="w-7 h-7 text-amber-400 shrink-0" />
              Métricas de Rentabilidad, ECharts & Asesor BI DARSIL
            </h1>
            <p className="text-xs text-slate-400 max-w-3xl">
              Consolidado gerencial de facturación, recaudación en caja, cartera por cobrar y proyección de liquidez a 15, 30 y 60 días conectado directamente a MongoDB.
            </p>
          </div>

          {/* Acciones */}
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            {onNavigateToFinancial && (
              <button
                type="button"
                onClick={onNavigateToFinancial}
                className="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-900 text-slate-300 hover:text-white border border-darsil-border text-xs font-bold transition flex items-center gap-1.5"
              >
                <Coins className="w-4 h-4 text-amber-400" />
                <span>Gestión de Cobranzas</span>
              </button>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-900 text-slate-300 hover:text-white border border-darsil-border text-xs font-bold transition flex items-center gap-1.5"
              title="Imprimir reporte"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / PDF</span>
            </button>

            <button
              type="button"
              onClick={() => {
                fetchMetrics();
                fetchAdvisorInsight();
              }}
              className="p-2 rounded-xl bg-slate-950 text-slate-400 hover:text-white border border-darsil-border transition"
              title="Recargar métricas"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tarjetas Principales de KPIs Financieros */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        
        {/* Total Contratado / Facturación Acordada */}
        <div className="bg-darsil-card border border-darsil-border p-4 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="flex justify-between items-center text-slate-400 text-xs font-bold uppercase mb-1">
            <span>Volumen Contratado</span>
            <Receipt className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-mono">
            {formatCurrency(kpis.totalContracted)}
          </div>
          <div className="text-[10px] text-slate-400 font-medium mt-1 flex items-center gap-1">
            <span className="text-amber-400 font-bold">{kpis.totalContracts}</span> contratos formalizados
          </div>
          <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-amber-500/5 rounded-full blur-xl pointer-events-none"></div>
        </div>

        {/* Total Cobrado / Liquidez Real */}
        <div className="bg-darsil-card border border-darsil-border p-4 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="flex justify-between items-center text-slate-400 text-xs font-bold uppercase mb-1">
            <span>Recaudación Efectiva</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
            {formatCurrency(kpis.totalCollected)}
          </div>
          <div className="text-[10px] text-emerald-400/80 font-medium mt-1 flex items-center gap-1">
            <span className="font-bold">{kpis.recoveryRate}%</span> tasa de recupero global
          </div>
          <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-emerald-500/5 rounded-full blur-xl pointer-events-none"></div>
        </div>

        {/* Cuentas por Cobrar Pendientes */}
        <div className="bg-darsil-card border border-darsil-border p-4 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="flex justify-between items-center text-slate-400 text-xs font-bold uppercase mb-1">
            <span>Cuentas por Cobrar</span>
            <Clock className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-sky-400 font-mono">
            {formatCurrency(kpis.totalAccountsReceivable)}
          </div>
          <div className="text-[10px] text-slate-400 font-medium mt-1">
            Pendiente de vencimiento ordenado
          </div>
          <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-sky-500/5 rounded-full blur-xl pointer-events-none"></div>
        </div>

        {/* Cartera Vencida / En Mora */}
        <div className="bg-darsil-card border border-darsil-border p-4 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="flex justify-between items-center text-slate-400 text-xs font-bold uppercase mb-1">
            <span>Cartera en Mora</span>
            <ShieldAlert className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-red-400 font-mono">
            {formatCurrency(kpis.overdueAmount)}
          </div>
          <div className="text-[10px] text-red-400/80 font-medium mt-1 flex items-center gap-1">
            <span className="font-bold">{kpis.overdueCount}</span> cuotas vencidas ({kpis.overdueRate}%)
          </div>
          <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-red-500/5 rounded-full blur-xl pointer-events-none"></div>
        </div>

        {/* Cotizaciones Aprobadas / Facturadas */}
        <div className="bg-darsil-card border border-darsil-border p-4 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="flex justify-between items-center text-slate-400 text-xs font-bold uppercase mb-1">
            <span>Cotizaciones Aprobadas</span>
            <CheckCircle2 className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
            {formatCurrency(kpis.totalQuotesApprovedSum)}
          </div>
          <div className="text-[10px] text-slate-400 font-medium mt-1">
            {kpis.quotesApprovedCount} cotizaciones ejecutadas
          </div>
          <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-amber-500/5 rounded-full blur-xl pointer-events-none"></div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* SECCIÓN NUEVA: BOT ASESOR DE DECISIONES BI CONECTADO A LA BASE DE DATOS */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/20 border-2 border-amber-500/30 p-5 sm:p-6 rounded-2xl shadow-2xl space-y-5">
        
        {/* Encabezado del Bot Asesor */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-500/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950">
              <Bot className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                  CONECTADO A MONGODB EN VIVO
                </span>
                <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  MOTOR DE INTELIGENCIA ACTIVO
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                Bot Asesor BI & Toma de Decisiones Estratégicas
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={() => fetchAdvisorInsight('')}
            disabled={advisorLoading}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs transition shadow-lg shadow-amber-500/20 flex items-center gap-2 self-start sm:self-auto disabled:opacity-50"
          >
            <Zap className={`w-4 h-4 ${advisorLoading ? 'animate-spin' : ''}`} />
            <span>{advisorLoading ? 'Auditando Base de Datos...' : 'Re-auditar Cartera & Taller'}</span>
          </button>
        </div>

        {/* 4 Tarjetas de Acciones Estratégicas Inmediatas Generadas por el Bot */}
        {advisorData?.strategicActions && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Target className="w-4 h-4 text-amber-400" />
                Matriz de Decisiones Inmediatas Priorizadas:
              </span>
              <span className="text-[11px] text-slate-400">
                Basado en saldos reales, fechas de vencimiento y órdenes de trabajo
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {advisorData.strategicActions.map((action, idx) => {
                const isCrit = action.urgency === 'CRITICA';
                const isHigh = action.urgency === 'ALTA';
                const isMed = action.urgency === 'MEDIA';

                return (
                  <div 
                    key={idx}
                    className={`p-3.5 rounded-xl border flex flex-col justify-between transition relative overflow-hidden ${
                      isCrit 
                        ? 'bg-red-950/30 border-red-500/40 hover:border-red-500' 
                        : isHigh 
                        ? 'bg-amber-950/30 border-amber-500/40 hover:border-amber-500' 
                        : isMed
                        ? 'bg-sky-950/30 border-sky-500/40 hover:border-sky-500'
                        : 'bg-emerald-950/30 border-emerald-500/40 hover:border-emerald-500'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                          isCrit 
                            ? 'bg-red-500/20 text-red-300 border-red-500/30 animate-pulse' 
                            : isHigh 
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' 
                            : isMed
                            ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        }`}>
                          URGENCIA {action.urgency}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 font-bold">
                          {action.category.replace('_', ' ')}
                        </span>
                      </div>

                      <h4 className="text-xs font-black text-white leading-tight">
                        {action.title}
                      </h4>

                      <p className="text-[11px] text-slate-300 mt-1.5 leading-relaxed">
                        {action.summary}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-1.5">
                      <div className="text-[10px] text-amber-300 font-bold flex items-start gap-1">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span>{action.action}</span>
                      </div>
                      <div className="text-[10px] font-mono text-emerald-400 font-bold bg-slate-950/80 px-2 py-1 rounded border border-emerald-500/20">
                        Impacto: {action.impact}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Consola de Consultas & Chat Interactivo con el Bot BI */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Bot className="w-4 h-4" />
              Consultar Directamente al Bot Asesor BI:
            </span>
            <span className="text-[10px] text-slate-400">
              Responde con datos vivos de cotizaciones, OTs y pagos
            </span>
          </div>

          {/* Píldoras de preguntas rápidas */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleQuickQuestion('mora')}
              disabled={advisorLoading}
              className="text-[11px] px-3 py-1 rounded-lg bg-red-950/40 text-red-300 border border-red-500/30 hover:bg-red-900/40 transition font-medium flex items-center gap-1"
            >
              🚨 ¿Cuál es la estrategia para cobrar la mora hoy?
            </button>
            <button
              type="button"
              onClick={() => handleQuickQuestion('flujo')}
              disabled={advisorLoading}
              className="text-[11px] px-3 py-1 rounded-lg bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-900/40 transition font-medium flex items-center gap-1"
            >
              📈 ¿Cuánto flujo proyectamos a 15 y 30 días?
            </button>
            <button
              type="button"
              onClick={() => handleQuickQuestion('servicios')}
              disabled={advisorLoading}
              className="text-[11px] px-3 py-1 rounded-lg bg-sky-950/40 text-sky-300 border border-sky-500/30 hover:bg-sky-900/40 transition font-medium flex items-center gap-1"
            >
              🔧 ¿Cuáles son las líneas de servicio más rentables?
            </button>
            <button
              type="button"
              onClick={() => handleQuickQuestion('general')}
              disabled={advisorLoading}
              className="text-[11px] px-3 py-1 rounded-lg bg-amber-950/40 text-amber-300 border border-amber-500/30 hover:bg-amber-900/40 transition font-medium flex items-center gap-1"
            >
              🎯 Diagnóstico integral del negocio
            </button>
          </div>

          {/* Formulario de Pregunta Libre */}
          <form onSubmit={handleAskAdvisor} className="flex gap-2">
            <input
              type="text"
              value={advisorQuery}
              onChange={(e) => setAdvisorQuery(e.target.value)}
              placeholder="Escribe una pregunta para el asesor BI (ej. ¿cuántos clientes tienen saldo pendiente?)..."
              disabled={advisorLoading}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-medium"
            />
            <button
              type="submit"
              disabled={advisorLoading || !advisorQuery.trim()}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Preguntar</span>
            </button>
          </form>

          {/* Área de Respuestas Dinámicas del Bot */}
          {(advisorChat.length > 0 || advisorData?.answer) && (
            <div className="mt-3 space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {advisorChat.map((chat, i) => (
                <div key={i} className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-3 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-400 text-[10px]">
                    <span className="font-bold text-amber-400 flex items-center gap-1">
                      <HelpCircle className="w-3 h-3" /> Pregunta: "{chat.question}"
                    </span>
                    <span>{chat.time}</span>
                  </div>
                  <div className="text-slate-200 whitespace-pre-line leading-relaxed font-sans">
                    {chat.answer}
                  </div>
                </div>
              ))}

              {advisorChat.length === 0 && advisorData?.answer && (
                <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-3 text-xs text-slate-200 whitespace-pre-line leading-relaxed">
                  {advisorData.answer}
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* ========================================================================= */}
      {/* SECCIÓN NUEVA: INTELIGENCIA FINANCIERA & RENTABILIDAD POR TRABAJO (ROI POR OT) */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-br from-darsil-card via-slate-900 to-darsil-card border border-emerald-500/30 p-5 sm:p-6 rounded-2xl shadow-2xl space-y-5">
        
        {/* Encabezado de la Sección */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-500/20 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                CONTROL DE COSTOS, MÁRGENES & RENTABILIDAD
              </span>
              <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-bold">
                ROI REAL POR ORDEN DE TRABAJO
              </span>
            </div>
            <h2 className="text-lg sm:text-xl md:text-2xl font-black text-white flex items-center gap-2 mt-1">
              <TrendingUp className="w-6 h-6 text-emerald-400 shrink-0" />
              Inteligencia Financiera: Rentabilidad y Margen Real por Trabajo
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Auditoría de utilidades deducidas por consumo real de repuestos en almacén/Kardex y costo de mano de obra técnica asignada.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-3 py-1.5 rounded-xl font-bold">
              {jobSummary.analyzedJobsCount} Trabajos Analizados
            </span>
          </div>
        </div>

        {/* 4 KPIs de Rentabilidad */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Margen Operativo Promedio */}
          <div className="bg-slate-950/80 border border-emerald-500/40 p-4 rounded-xl relative overflow-hidden">
            <div className="flex justify-between items-center text-slate-400 text-xs font-bold uppercase mb-1">
              <span>Margen Operativo Promedio</span>
              <Percent className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
              {jobSummary.overallMarginPercent}%
            </div>
            <div className="text-[10px] text-slate-400 font-medium mt-1">
              ROI Operativo global: <b className="text-emerald-300 font-bold font-mono">+{jobSummary.overallRoiPercent}%</b>
            </div>
          </div>

          {/* Utilidad Neta Consolidada */}
          <div className="bg-slate-950/80 border border-emerald-500/40 p-4 rounded-xl relative overflow-hidden">
            <div className="flex justify-between items-center text-slate-400 text-xs font-bold uppercase mb-1">
              <span>Utilidad Neta Consolidada</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono">
              {formatCurrency(jobSummary.totalNetProfit)}
            </div>
            <div className="text-[10px] text-slate-400 font-medium mt-1">
              Facturación neta: <span className="text-slate-300 font-mono font-bold">{formatCurrency(jobSummary.totalRevenue)}</span>
            </div>
          </div>

          {/* Costo Operativo Total */}
          <div className="bg-slate-950/80 border border-rose-500/30 p-4 rounded-xl relative overflow-hidden">
            <div className="flex justify-between items-center text-slate-400 text-xs font-bold uppercase mb-1">
              <span>Costos Operativos (Repuestos + MO)</span>
              <Activity className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-rose-400 font-mono">
              {formatCurrency(jobSummary.totalOperatingCost)}
            </div>
            <div className="text-[10px] text-slate-400 font-medium mt-1 flex items-center justify-between">
              <span>Rep: <b className="text-slate-300 font-mono">{formatCurrency(jobSummary.totalPartsCost)}</b></span>
              <span>MO: <b className="text-slate-300 font-mono">{formatCurrency(jobSummary.totalLaborCost)}</b></span>
            </div>
          </div>

          {/* Trabajo Más Rentable */}
          <div className="bg-slate-950/80 border border-amber-500/30 p-4 rounded-xl relative overflow-hidden">
            <div className="flex justify-between items-center text-slate-400 text-xs font-bold uppercase mb-1">
              <span>Trabajo Mayor Margen</span>
              <Award className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-lg sm:text-xl font-black text-amber-400 font-mono truncate">
              {jobSummary.mostProfitableJob?.orderNumber || '---'}
            </div>
            <div className="text-[10px] text-slate-400 font-medium mt-1 truncate">
              {jobSummary.mostProfitableJob ? (
                <>
                  <span className="text-white font-bold">{jobSummary.mostProfitableJob.clientName}</span> (Placa: {jobSummary.mostProfitableJob.plate})
                  <div className="text-emerald-400 font-bold font-mono">
                    +{formatCurrency(jobSummary.mostProfitableJob.netProfit)} ({jobSummary.mostProfitableJob.marginPercent}%)
                  </div>
                </>
              ) : 'Sin órdenes registradas'}
            </div>
          </div>
        </div>

        {/* Gráfico Top 5 Trabajos por Utilidad */}
        {topJobsProfitOption && (
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                Top 5 Trabajos / Órdenes con Mayor Utilidad Neta (S/):
              </span>
              <span className="text-[10px] text-slate-400">
                Ganancia líquida en caja tras costos directos
              </span>
            </div>
            <EChartCard option={topJobsProfitOption} style={{ height: 220 }} />
          </div>
        )}

        {/* Tabla Detallada de Rentabilidad por Trabajo */}
        <div className="space-y-3 pt-2">
          {/* Barra de Filtros y Búsqueda */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por N° OT, cotización, cliente, placa..."
                value={jobSearch}
                onChange={(e) => setJobSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-emerald-400 outline-none"
              />
            </div>

            {/* Filtros de Nivel de Rentabilidad */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'ALL', label: 'Todos' },
                { id: 'EXCELENTE', label: 'Excelente (>60%)' },
                { id: 'SALUDABLE', label: 'Saludable (40-60%)' },
                { id: 'MODERADO', label: 'Moderado (25-40%)' },
                { id: 'CRITICO', label: 'Crítico (<25%)' }
              ].map(lvl => (
                <button
                  key={lvl.id}
                  type="button"
                  onClick={() => setJobLevelFilter(lvl.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                    jobLevelFilter === lvl.id
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm'
                      : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {lvl.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tabla de Trabajos */}
          <div className="overflow-x-auto rounded-xl border border-darsil-border bg-slate-950/70">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-darsil-border bg-slate-900/80 text-slate-400 text-[10px] font-black uppercase tracking-wider">
                  <th className="py-2.5 px-3">Orden / Coti</th>
                  <th className="py-2.5 px-3">Cliente & Vehículo</th>
                  <th className="py-2.5 px-3">Servicio / Falla</th>
                  <th className="py-2.5 px-3 text-right">Facturación</th>
                  <th className="py-2.5 px-3 text-right">Costo Repuestos</th>
                  <th className="py-2.5 px-3 text-right">Costo M.O.</th>
                  <th className="py-2.5 px-3 text-right">Costo Total</th>
                  <th className="py-2.5 px-3 text-right">Utilidad Neta</th>
                  <th className="py-2.5 px-3 text-center">Margen Real</th>
                  <th className="py-2.5 px-3 text-center">Nivel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredJobs.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="text-center py-8 text-slate-500">
                      No se encontraron trabajos o servicios que coincidan con el filtro.
                    </td>
                  </tr>
                ) : (
                  filteredJobs.map((j, idx) => {
                    const isExc = j.profitabilityLevel === 'EXCELENTE';
                    const isSal = j.profitabilityLevel === 'SALUDABLE';
                    const isMod = j.profitabilityLevel === 'MODERADO';
                    const isCrit = j.profitabilityLevel === 'CRITICO';

                    return (
                      <tr key={j.id || idx} className="hover:bg-slate-900/50 transition">
                        <td className="py-2.5 px-3 font-mono">
                          <span className="font-bold text-white block">{j.orderNumber}</span>
                          <span className="text-[10px] text-amber-400 font-medium">{j.quoteNumber}</span>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-white truncate max-w-[150px]">{j.clientName}</div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1">
                            <span className="font-mono text-amber-300 font-bold">{j.plate}</span>
                            <span>•</span>
                            <span className="truncate max-w-[80px]">{j.model}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-[11px] text-slate-300 max-w-[160px] truncate" title={j.serviceDescription}>
                          {j.serviceDescription}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-right text-white">
                          {formatCurrency(j.totalRevenue)}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-right text-slate-400 text-[11px]">
                          {formatCurrency(j.partsCost)}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-right text-slate-400 text-[11px]">
                          {formatCurrency(j.laborCost)}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-right text-rose-400 font-medium">
                          {formatCurrency(j.totalCost)}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-black text-right text-emerald-400 text-sm">
                          +{formatCurrency(j.netProfit)}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex flex-col items-center">
                            <span className="font-mono font-black text-xs text-white">{j.marginPercent}%</span>
                            <div className="w-14 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-0.5">
                              <div
                                className={`h-full rounded-full ${
                                  isExc ? 'bg-emerald-400' : isSal ? 'bg-sky-400' : isMod ? 'bg-amber-400' : 'bg-rose-500'
                                }`}
                                style={{ width: `${Math.min(100, Math.max(5, j.marginPercent))}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black tracking-wide uppercase border ${
                            isExc
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : isSal
                              ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                              : isMod
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-rose-500/20 text-red-400 border-rose-500/40'
                          }`}>
                            {j.profitabilityLevel}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* GRÁFICO 1 DE ECHARTS: PROYECCIÓN DE FLUJO DE CAJA (FORECASTING A 15, 30, 60 DÍAS) */}
      {/* ========================================================================= */}
      <div className="bg-darsil-card border border-darsil-border p-5 sm:p-6 rounded-2xl shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-darsil-border pb-3">
          <div>
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              FORECASTING & LIQUIDEZ PREDICTIVA (APACHE ECHARTS)
            </span>
            <h3 className="text-base sm:text-lg font-black text-white">
              Proyección de Flujo de Caja Entrante (15, 30 y 60 Días)
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Calculado a partir de los cronogramas contractuales pactados por el asesor técnico
          </span>
        </div>

        {/* 3 Tarjetas de Resumen Numérico */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="bg-slate-950/80 border border-emerald-500/30 p-4 rounded-xl relative overflow-hidden">
            <div className="text-[11px] font-black text-emerald-400 uppercase tracking-wide flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Próximos 15 Días
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono mt-1">
              {formatCurrency(cashFlow.next15Days)}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Ingreso proyectado a corto plazo con alta probabilidad de cobro
            </p>
          </div>

          <div className="bg-slate-950/80 border border-sky-500/30 p-4 rounded-xl relative overflow-hidden">
            <div className="text-[11px] font-black text-sky-400 uppercase tracking-wide flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-400"></span>
              Próximos 30 Días
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono mt-1">
              {formatCurrency(cashFlow.next30Days)}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Ingreso mensual acumulado según fechas pactadas en contrato
            </p>
          </div>

          <div className="bg-slate-950/80 border border-purple-500/30 p-4 rounded-xl relative overflow-hidden">
            <div className="text-[11px] font-black text-purple-400 uppercase tracking-wide flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-400"></span>
              Próximos 60 Días
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono mt-1">
              {formatCurrency(cashFlow.next60Days)}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Flujo bimestral proyectado para reinversión en inventario de repuestos
            </p>
          </div>
        </div>

        {/* Gráfico de Barras ECharts */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
          <EChartCard option={cashFlowOption} style={{ height: 260 }} />
        </div>

        {/* Tabla de Próximos Vencimientos Calendarizados */}
        {cashFlow.upcomingInstallments && cashFlow.upcomingInstallments.length > 0 && (
          <div className="pt-2">
            <div className="text-xs font-black text-slate-300 uppercase tracking-wider mb-2">
              Calendario Inmediato de Cuotas por Vencer / Vencidas:
            </div>
            <div className="overflow-x-auto rounded-xl border border-darsil-border bg-slate-950/60">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-darsil-border bg-slate-900/60 text-slate-400 text-[10px] font-black uppercase tracking-wider">
                    <th className="py-2.5 px-3">Contrato</th>
                    <th className="py-2.5 px-3">Cliente</th>
                    <th className="py-2.5 px-3">Placa</th>
                    <th className="py-2.5 px-3">Cuota</th>
                    <th className="py-2.5 px-3">Fecha Vencimiento</th>
                    <th className="py-2.5 px-3 text-right">Monto</th>
                    <th className="py-2.5 px-3 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {cashFlow.upcomingInstallments.map((inst, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/40 transition">
                      <td className="py-2 px-3 font-mono font-bold text-amber-400">{inst.contractNumber}</td>
                      <td className="py-2 px-3 font-medium truncate max-w-[180px]">{inst.clientName}</td>
                      <td className="py-2 px-3 font-mono font-bold">{inst.plate || '---'}</td>
                      <td className="py-2 px-3">Cuota N° {inst.installmentNumber}</td>
                      <td className="py-2 px-3 font-mono text-[11px]">
                        {new Date(inst.dueDate).toLocaleDateString('es-PE')}
                      </td>
                      <td className="py-2 px-3 font-mono font-bold text-white text-right">
                        {formatCurrency(inst.amount)}
                      </td>
                      <td className="py-2 px-3 text-center">
                        {inst.isOverdue ? (
                          <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-bold">
                            En Mora ({Math.abs(inst.diffDays)}d)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                            En {inst.diffDays} días
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* GRÁFICOS 2 Y 3: RENTABILIDAD POR SERVICIO (DONUT ECHARTS) & FLOTAS (HORIZONTAL ECHARTS) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Desglose por Tipo de Servicio (Donut Chart) */}
        <div className="bg-darsil-card border border-darsil-border p-5 rounded-2xl shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-darsil-border pb-3">
            <div>
              <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1">
                <PieChart className="w-3.5 h-3.5" />
                RENTABILIDAD OPERATIVA (ECHARTS)
              </span>
              <h3 className="text-base font-black text-white">
                Ingresos por Línea de Servicio Técnico
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">MO01 - MO21</span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-2">
            <EChartCard option={serviceCategoriesOption} style={{ height: 280 }} />
          </div>
        </div>

        {/* Distribución por Marca / Flota Vehicular (Horizontal Bars) */}
        <div className="bg-darsil-card border border-darsil-border p-5 rounded-2xl shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-darsil-border pb-3">
            <div>
              <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1">
                <Car className="w-3.5 h-3.5" />
                CONCENTRACIÓN DE FLOTAS (ECHARTS)
              </span>
              <h3 className="text-base font-black text-white">
                Marcas y Unidades más Atendidas en Taller
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">Heavy & Light Duty</span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-2">
            <EChartCard option={fleetBrandsOption} style={{ height: 280 }} />
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* GRÁFICO 4: HISTÓRICO SEMESTRAL DE FACTURACIÓN VS COBRANZA (ECHARTS) & RECIBOS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Tendencia Mensual (6 Meses con ECharts) */}
        <div className="bg-darsil-card border border-darsil-border p-5 rounded-2xl shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-darsil-border pb-3">
            <div>
              <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1">
                <BarChart3 className="w-3.5 h-3.5" />
                HISTÓRICO SEMESTRAL (ECHARTS)
              </span>
              <h3 className="text-base font-black text-white">
                Facturación vs Cobranzas (Últimos 6 Meses)
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">Tendencia Real</span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-2">
            <EChartCard option={monthlyTrendsOption} style={{ height: 280 }} />
          </div>
        </div>

        {/* Auditoría de Últimos Recibos de Caja Emitidos */}
        <div className="bg-darsil-card border border-darsil-border p-5 rounded-2xl shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-darsil-border pb-3">
            <div>
              <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1">
                <Receipt className="w-3.5 h-3.5" />
                AUDITORÍA DE CAJA
              </span>
              <h3 className="text-base font-black text-white">
                Últimos Recibos de Caja Emitidos
              </h3>
            </div>
            <span className="text-xs text-emerald-400 font-mono font-bold">Asentados en Banco</span>
          </div>

          <div className="space-y-2 pt-1 max-h-[280px] overflow-y-auto">
            {recentPayments && recentPayments.length > 0 ? (
              recentPayments.map((p, idx) => (
                <div key={idx} className="bg-slate-950/70 border border-slate-800/80 p-2.5 rounded-xl flex items-center justify-between text-xs hover:border-slate-700 transition">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-black text-amber-400">{p.receiptNumber}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-white font-bold truncate max-w-[140px]">{p.clientName}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                      <span>{p.plate || 'Sin Placa'}</span>
                      <span>•</span>
                      <span>{p.paymentMethod || 'TRANSFERENCIA'}</span>
                      {p.operationNumber && <span>(Op: {p.operationNumber})</span>}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-mono font-black text-emerald-400 text-sm">
                      {formatCurrency(p.amount)}
                    </div>
                    <div className="text-[10px] font-mono text-slate-500">
                      {new Date(p.paidAt).toLocaleDateString('es-PE')}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-500 text-xs">
                Aún no hay recibos de caja registrados
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* RANKING TOP 10 CLIENTES POR FACTURACIÓN & PUNTUALIDAD */}
      {/* ========================================================================= */}
      <div className="bg-darsil-card border border-darsil-border p-5 sm:p-6 rounded-2xl shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-darsil-border pb-3">
          <div>
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1">
              <Award className="w-3.5 h-3.5" />
              PORTAFOLIO DE CUENTAS CLAVE
            </span>
            <h3 className="text-base sm:text-lg font-black text-white">
              Top Clientes por Volumen Financiero & Cumplimiento
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Monitoreo de puntualidad y saldo por cliente corporativo y particular
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-darsil-border bg-slate-950/60">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-darsil-border bg-slate-900/60 text-slate-400 text-[10px] font-black uppercase tracking-wider">
                <th className="py-2.5 px-3">Ranking</th>
                <th className="py-2.5 px-3">Cliente / Razón Social</th>
                <th className="py-2.5 px-3">RUC / DNI</th>
                <th className="py-2.5 px-3 text-right">Total Contratado</th>
                <th className="py-2.5 px-3 text-right">Total Abonado</th>
                <th className="py-2.5 px-3 text-right">Saldo en Calle</th>
                <th className="py-2.5 px-3 text-center">Cumplimiento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {topClients.map((client, idx) => (
                <tr key={idx} className="hover:bg-slate-900/40 transition">
                  <td className="py-2.5 px-3">
                    <span className={`w-5 h-5 rounded-full inline-flex items-center justify-center font-mono font-black text-[10px] ${
                      idx === 0 ? 'bg-amber-400 text-slate-950 shadow' :
                      idx === 1 ? 'bg-slate-300 text-slate-950' :
                      idx === 2 ? 'bg-amber-700 text-white' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      {idx + 1}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-bold text-white max-w-[220px] truncate">
                    {client.name}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-400">
                    {client.doc || '---'}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-black text-right text-white">
                    {formatCurrency(client.totalContracted)}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-right text-emerald-400">
                    {formatCurrency(client.totalPaid)}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-right text-sky-400">
                    {formatCurrency(client.balance)}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      client.complianceRate >= 100 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                        : client.complianceRate >= 50
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                      {client.complianceRate}% Pagado
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
