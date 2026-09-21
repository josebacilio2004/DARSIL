import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Wrench, 
  Cpu, 
  Printer, 
  Truck, 
  Phone, 
  ExternalLink, 
  Shield, 
  Zap, 
  Download,
  Car,
  ChevronRight,
  ArrowRight,
  Activity,
  Layers,
  Award,
  Sparkles,
  Gauge,
  Check,
  Settings,
  Flame,
  ShieldCheck,
  Send,
  Radio,
  Boxes
} from 'lucide-react';
import { api } from '../services/api';

export default function LandingPage({ quotes = [], authUser, onSwitchToAdmin }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [foundQuote, setFoundQuote] = useState(null);
  const [searchError, setSearchError] = useState('');

  // Playlist secuencial de videos de fondo (FONDO1.mp4 -> video_fondo.mp4 -> loop)
  const backgroundVideos = ['./FONDO1.mp4', './video_fondo.mp4'];
  const [currentVideoIdx, setCurrentVideoIdx] = useState(0);
  const videoRef = useRef(null);

  // Asegurar reproducción automática forzada y continua en móviles (iOS Safari / Android)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', 'true');

    const tryPlay = () => {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // El navegador pausó el video por política de ahorro de batería
        });
      }
    };

    tryPlay();

    // Despertador automático en primera interacción táctil o scroll
    const handleInteraction = () => {
      if (video && video.paused) {
        video.muted = true;
        video.play().catch(() => {});
      }
    };

    window.addEventListener('touchstart', handleInteraction, { once: true, passive: true });
    window.addEventListener('click', handleInteraction, { once: true, passive: true });
    window.addEventListener('scroll', handleInteraction, { once: true, passive: true });

    return () => {
      window.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('scroll', handleInteraction);
    };
  }, [currentVideoIdx]);

  const handleVideoEnded = () => {
    setCurrentVideoIdx((prev) => (prev + 1) % backgroundVideos.length);
  };

  // Estados del Cotizador Rápido Interactivo para Clientes
  const [calcVehicle, setCalcVehicle] = useState('tracto');
  const [calcService, setCalcService] = useState('canbus');

  const vehicleOptions = [
    { id: 'tracto', label: 'Tractocamión', desc: 'Volvo, Scania, Shacman, Sinotruk', icon: Truck },
    { id: 'mixer', label: 'Volquete / Mixer', desc: 'Camc, Mack, Mercedes, Dongfeng', icon: Boxes },
    { id: 'bus', label: 'Bus Interprovincial', desc: 'Mercedes O500, Scania K410, Modasa', icon: Car },
    { id: 'maquinaria', label: 'Línea Amarilla', desc: 'Caterpillar, Komatsu, JCB, Bobcat', icon: Settings }
  ];

  const serviceOptions = [
    { 
      id: 'canbus', 
      label: 'Diagnóstico CAN Bus & ECU', 
      desc: 'Lectura y reprogramación con escáner OEM de parámetros vivos y sensores NOx.',
      time: '1 a 2 horas (Inmediato)',
      tag: 'Electrónica Digital'
    },
    { 
      id: 'arranque', 
      label: 'Sistema de Arranque 24V', 
      desc: 'Mantenimiento preventivo/correctivo y prueba dinámica en banco bajo carga real.',
      time: 'Mismo día / 2 a 4 hrs',
      tag: 'Potencia Eléctrica'
    },
    { 
      id: '3dprint', 
      label: 'Manufactura 3D Aditiva', 
      desc: 'Ingeniería inversa de piezas descontinuadas en polímeros reforzados con fibra de carbono.',
      time: '24 a 48 horas (Diseño CAD)',
      tag: 'Obsolescencia Cero'
    },
    { 
      id: 'auxilio', 
      label: 'Auxilio de Campo en Ruta', 
      desc: 'Unidad móvil especializada para rescate técnico vial y reactivación inmediata.',
      time: '< 45 min despacho',
      tag: 'Emergencia 24/7'
    }
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchError('');
    setFoundQuote(null);

    const q = searchQuery.trim().toUpperCase();
    if (!q) {
      setSearchError('Por favor ingresa un número de cotización o placa para consultar.');
      return;
    }

    const match = quotes.find(item => 
      (item.quoteNumber && item.quoteNumber.toUpperCase().includes(q)) ||
      (item.plate && item.plate.toUpperCase().includes(q)) ||
      (item.clientDoc && item.clientDoc.includes(q))
    );

    if (match) {
      setFoundQuote(match);
    } else {
      setSearchError(`No encontramos una cotización registrada con: "${searchQuery}". Verifica el número (ej. DA-2026-001) o la placa.`);
    }
  };

  const formatSoles = (amount) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  const getWhatsAppEstimateUrl = () => {
    const vObj = vehicleOptions.find(v => v.id === calcVehicle) || vehicleOptions[0];
    const sObj = serviceOptions.find(s => s.id === calcService) || serviceOptions[0];
    const text = `Hola DARSIL Automotive Solutions, requiero atención técnica especializada:\n\n*Tipo de Unidad:* ${vObj.label} (${vObj.desc})\n*Servicio Requerido:* ${sObj.label}\n*Especialidad:* ${sObj.tag}\n*Tiempo Estimado:* ${sObj.time}\n\nPor favor contáctenme para coordinar detalles y disponibilidad.`;
    return `https://api.whatsapp.com/send?phone=51934787006&text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="relative min-h-screen bg-black text-white font-sans selection:bg-amber-500 selection:text-black overflow-x-hidden">
      
      {/* Video de Fondo con Overlay Oscuro, Gradiente de Respaldo y Efecto Granulado */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-gradient-to-b from-slate-950 via-black to-slate-950">
        <video
          ref={videoRef}
          src={backgroundVideos[currentVideoIdx]}
          autoPlay
          loop
          muted
          defaultMuted
          playsInline
          webkit-playsinline="true"
          x5-playsinline="true"
          preload="auto"
          onEnded={handleVideoEnded}
          className="w-full h-full object-cover filter brightness-[0.28] contrast-125 scale-105 transition-opacity duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black pointer-events-none"></div>
        <div className="absolute inset-0 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none"></div>
      </div>


      {/* Contenido Foreground */}
      <div className="relative z-10 flex flex-col min-h-screen">
        
        {/* Header / Barra de Navegación del Portal */}
        <header className="border-b border-white/10 backdrop-blur-md bg-black/60 sticky top-0 z-40 transition duration-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
            
            <div className="flex items-center space-x-3">
              <div className="h-12 w-36 sm:w-44 flex items-center justify-center p-1 rounded-xl bg-black/50 border border-amber-500/20 backdrop-blur-sm">
                <img
                  src="./logo_transparente.png"
                  alt="DARSIL Logo"
                  className="h-full w-full object-contain filter drop-shadow-[0_0_12px_rgba(245,158,11,0.3)]"
                />
              </div>
              <div className="hidden md:block pl-3 border-l border-white/20">
                <span className="text-[10px] tracking-widest font-black text-amber-400 block uppercase">
                  DIVISIÓN FLOTAS & TALLER
                </span>
                <span className="text-[9px] text-slate-400 font-medium">
                  SOLUCIONES AUTOMOTRICES 2026
                </span>
              </div>
            </div>

            <nav className="flex items-center space-x-3 sm:space-x-5">
              <a 
                href="#rastreador" 
                className="text-xs font-bold text-slate-300 hover:text-amber-400 transition hidden sm:inline-block"
              >
                Rastrear Cotización
              </a>
              <a 
                href="#servicios" 
                className="text-xs font-bold text-slate-300 hover:text-amber-400 transition hidden sm:inline-block"
              >
                Pilares Técnicos
              </a>
              <a 
                href="#aditiva3d" 
                className="text-xs font-bold text-slate-300 hover:text-amber-400 transition hidden sm:inline-block"
              >
                Manufactura 3D
              </a>
              <a 
                href="#calculadora" 
                className="text-xs font-bold text-slate-300 hover:text-amber-400 transition hidden lg:inline-block"
              >
                Cotizador Rápido
              </a>
              <a 
                href="tel:934787006"
                className="hidden lg:flex items-center space-x-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-full hover:bg-emerald-500/20 transition"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Central: 934 787 006</span>
              </a>

              {/* Botón Acceso ERP Interno (Sin nombre de asesor) */}
              <button
                onClick={onSwitchToAdmin}
                className="flex items-center space-x-2 text-xs font-black bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 px-4 py-2 rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.4)] hover:brightness-110 active:scale-95 transition"
              >
                {authUser ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                    <span>ERP</span>
                  </>
                ) : (
                  <span>ERP</span>
                )}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </nav>

          </div>
        </header>

        {/* Sección HERO de Alto Impacto */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-16 flex flex-col justify-center items-center text-center">
          
          <div className="inline-flex items-center space-x-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-amber-500/10 border border-amber-400/30 backdrop-blur-md text-amber-300 text-[10px] sm:text-xs font-bold tracking-wider sm:tracking-widest uppercase mb-4 sm:mb-6 shadow-inner animate-pulse max-w-full">
            <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate sm:whitespace-normal">TECNOLOGÍA DE VANGUARDIA • DIAGNÓSTICO DIGITAL & MANUFACTURA 3D</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400 tracking-tight max-w-5xl leading-tight sm:leading-none break-words">
            INGENIERÍA AUTOMOTRIZ DE PRECISIÓN Y SOLUCIONES EN CAMPO
          </h1>

          <p className="mt-4 sm:mt-6 text-sm sm:text-lg text-slate-300 max-w-3xl leading-relaxed font-normal">
            Especialistas en electrónica pesada, reparación de sistemas de arranque de 24V, diagnóstico computarizado con escáner oficial y fabricación de componentes descontinuados mediante impresión 3D industrial.
          </p>

          {/* Buscador / Rastreador de Cotizaciones para Clientes */}
          <div id="rastreador" className="mt-10 w-full max-w-2xl">
            <div className="bg-slate-900/80 backdrop-blur-2xl p-4 sm:p-6 rounded-3xl border border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.15)]">
              <div className="flex items-center space-x-2 text-xs font-bold text-amber-400 mb-3 uppercase tracking-wider text-left">
                <Search className="w-4 h-4 text-amber-400" />
                <span>Portal de Consulta para Clientes: Rastrea tu Cotización</span>
              </div>

              <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Ingresa tu Placa (ej. ABG890) o N° Cotización (DA-2026-001)"
                    className="w-full bg-black/60 border border-white/20 rounded-2xl px-4 py-3.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-amber-400 transition uppercase tracking-wider"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black px-6 py-3.5 rounded-2xl text-sm shadow-gold-glow hover:brightness-110 active:scale-95 transition shrink-0 flex items-center justify-center space-x-2"
                >
                  <Search className="w-4 h-4" />
                  <span>Consultar Estado</span>
                </button>
              </form>

              {/* Mensaje de Error */}
              {searchError && (
                <div className="mt-4 p-3 bg-red-500/15 border border-red-500/30 rounded-xl text-red-300 text-xs text-left">
                  {searchError}
                </div>
              )}

              {/* Tarjeta de Cotización Encontrada */}
              {foundQuote && (
                <div className="mt-6 p-5 bg-black/80 rounded-2xl border border-emerald-500/40 text-left shadow-2xl space-y-4 animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                    <div>
                      <span className="text-xs font-bold text-slate-400">Cotización Oficial</span>
                      <h4 className="text-lg font-black text-amber-400">{foundQuote.quoteNumber}</h4>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs font-black px-3 py-1 rounded-full border ${
                        foundQuote.status === 'APROBADA' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                        foundQuote.status === 'EN TALLER' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' :
                        'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      }`}>
                        {foundQuote.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block">Cliente:</span>
                      <span className="font-bold text-white text-sm">{foundQuote.clientName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Vehículo / Placa:</span>
                      <span className="font-bold text-white text-sm">
                        {foundQuote.plate ? `${foundQuote.plate} • ${foundQuote.model || ''}` : 'Proyecto Industrial'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Total Cotizado:</span>
                      <span className="font-black text-amber-400 text-lg">{formatSoles(foundQuote.total)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Plazo de Entrega:</span>
                      <span className="font-semibold text-slate-200">{foundQuote.deliveryTerm || 'Inmediato / Según programación'}</span>
                    </div>
                  </div>

                  {/* Acciones de Cliente */}
                  <div className="pt-3 border-t border-white/10 flex flex-wrap gap-2 justify-end">
                    <a
                      href={`/api/quotes/${foundQuote._id}/pdf`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl border border-white/20 transition"
                    >
                      <Download className="w-4 h-4 text-amber-400" />
                      <span>Descargar PDF Oficial</span>
                    </a>
                    <a
                      href={`https://api.whatsapp.com/send?phone=51934787006&text=${encodeURIComponent(`Hola DARSIL, deseo coordinar sobre la cotización ${foundQuote.quoteNumber} de mi vehículo ${foundQuote.plate || ''}.`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition"
                    >
                      <Phone className="w-4 h-4" />
                      <span>Contactar Asesor por WhatsApp</span>
                    </a>
                  </div>
                </div>
              )}

            </div>
          </div>

        </section>

        {/* SECCIÓN NUEVA 1: Telemetría Holográfica & Indicadores en Vivo */}
        <section className="py-12 border-y border-amber-500/20 bg-gradient-to-b from-black/80 via-slate-950/70 to-black/80 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              
              <div className="bg-slate-900/60 p-5 rounded-2xl border border-amber-500/30 hover:border-amber-400 transition group flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">Flotas Pesadas</span>
                  <Truck className="w-4 h-4 text-amber-400 group-hover:scale-110 transition" />
                </div>
                <div className="text-3xl sm:text-4xl font-black text-white tracking-tight group-hover:text-amber-300 transition">
                  +1,250<span className="text-amber-400">+</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">Unidades atendidas en ruta y taller (Mixers, Tractos, Buses y Maquinaria).</p>
              </div>

              <div className="bg-slate-900/60 p-5 rounded-2xl border border-amber-500/30 hover:border-amber-400 transition group flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Precisión CAN Bus</span>
                  <Cpu className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition" />
                </div>
                <div className="text-3xl sm:text-4xl font-black text-white tracking-tight group-hover:text-emerald-300 transition">
                  99.4<span className="text-emerald-400">%</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">Efectividad en reprogramación de computadoras de abordo y sensores NOx.</p>
              </div>

              <div className="bg-slate-900/60 p-5 rounded-2xl border border-amber-500/30 hover:border-amber-400 transition group flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Respuesta Vial</span>
                  <Clock className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition" />
                </div>
                <div className="text-3xl sm:text-4xl font-black text-white tracking-tight group-hover:text-cyan-300 transition">
                  &lt; 45<span className="text-cyan-400"> min</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">Tiempo promedio de despacho de unidades móviles de rescate técnico.</p>
              </div>

              <div className="bg-slate-900/60 p-5 rounded-2xl border border-amber-500/30 hover:border-amber-400 transition group flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-purple-400">Trazabilidad QR</span>
                  <ShieldCheck className="w-4 h-4 text-purple-400 group-hover:scale-110 transition" />
                </div>
                <div className="text-3xl sm:text-4xl font-black text-white tracking-tight group-hover:text-purple-300 transition">
                  100<span className="text-purple-400">%</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">Certificación técnica digital de cada cotización y servicio ejecutado.</p>
              </div>

            </div>
          </div>
        </section>

        {/* Sección de Especialidades / Pilares Tecnológicos */}
        <section id="servicios" className="py-16 bg-black/60 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="text-center max-w-3xl mx-auto mb-12">
              <span className="text-xs font-black text-amber-400 uppercase tracking-widest block mb-2">
                Capacidades de Alto Rendimiento
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white">
                Nuestros Pilares Tecnológicos
              </h2>
              <p className="mt-3 text-sm text-slate-400">
                Diseñado para maximizar la disponibilidad y rendimiento operativo de maquinaria pesada, transporte interprovincial y flotas comerciales.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              
              <div className="bg-slate-900/60 p-6 rounded-3xl border border-white/10 hover:border-amber-500/50 transition duration-300 group">
                <div className="p-3 bg-amber-500/10 rounded-2xl w-fit text-amber-400 mb-4 group-hover:scale-110 transition">
                  <Cpu className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">Diagnóstico Digital CAN</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Lectura y reprogramación de computadoras de abordo ECU, sensores NOx, actuadores y subsistemas electrónicos 12V/24V.
                </p>
              </div>

              <div className="bg-slate-900/60 p-6 rounded-3xl border border-white/10 hover:border-amber-500/50 transition duration-300 group">
                <div className="p-3 bg-amber-500/10 rounded-2xl w-fit text-amber-400 mb-4 group-hover:scale-110 transition">
                  <Printer className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">Manufactura 3D Aditiva</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Ingeniería inversa y fabricación aditiva de engranajes, conectores y piezas plásticas descontinuadas en polímeros de alta resistencia.
                </p>
              </div>

              <div className="bg-slate-900/60 p-6 rounded-3xl border border-white/10 hover:border-amber-500/50 transition duration-300 group">
                <div className="p-3 bg-amber-500/10 rounded-2xl w-fit text-amber-400 mb-4 group-hover:scale-110 transition">
                  <Truck className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">Auxilio Técnico en Ruta</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Unidades móviles equipadas para rescate vial, solución de fallas eléctricas de arranque y sustitución de alternadores en ruta.
                </p>
              </div>

              <div className="bg-slate-900/60 p-6 rounded-3xl border border-white/10 hover:border-amber-500/50 transition duration-300 group">
                <div className="p-3 bg-amber-500/10 rounded-2xl w-fit text-amber-400 mb-4 group-hover:scale-110 transition">
                  <Wrench className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">Mantenimiento de Potencia</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Banco de prueba dinámico para motores de arranque pesados, bobinado de alternadores y cableado automotriz ignífugo.
                </p>
              </div>

            </div>

          </div>
        </section>

        {/* SECCIÓN NUEVA 2: Laboratorio de Manufactura Aditiva 3D & Obsolescencia Cero */}
        <section id="aditiva3d" className="py-20 bg-gradient-to-b from-black via-slate-950 to-black border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              
              <div className="lg:col-span-6 space-y-6 text-left">
                <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Laboratorio de Ingeniería Inversa & Materiales Avanzados</span>
                </div>

                <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight">
                  Superando la Obsolescencia: <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300">Piezas 3D de Grado Aeroespacial</span>
                </h2>

                <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                  ¿Piezas rotas descatalogadas por el fabricante que detienen tu unidad? En DARSIL digitalizamos la geometría original mediante escaneo 3D y fabricamos reemplazos estructurales reforzados con filamento de fibra de carbono.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex items-center space-x-2 text-amber-400 text-xs font-black mb-1">
                      <Check className="w-4 h-4 text-amber-400" />
                      <span>Nylon-CF & Carbon Fiber</span>
                    </div>
                    <p className="text-slate-400 text-xs">Resistencia mecánica comparable al aluminio con una fracción de su peso.</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex items-center space-x-2 text-cyan-400 text-xs font-black mb-1">
                      <Check className="w-4 h-4 text-cyan-400" />
                      <span>Tolerancia Térmica &gt; 140°C</span>
                    </div>
                    <p className="text-slate-400 text-xs">Polímeros técnicos aptos para zonas de vano motor y componentes de transmisión.</p>
                  </div>
                </div>

                <div className="pt-2">
                  <a
                    href="https://api.whatsapp.com/send?phone=51934787006&text=Hola%20DARSIL,%20tengo%20una%20pieza%20descontinuada%20que%20deseo%20fabricar%20en%20impresi%C3%B3n%203D."
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-2 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs px-6 py-3.5 rounded-2xl shadow-gold-glow hover:brightness-110 transition active:scale-95"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Cotizar Fabricación de Pieza 3D</span>
                  </a>
                </div>

              </div>

              {/* Showcase Visual Holográfico */}
              <div className="lg:col-span-6">
                <div className="relative p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-amber-500/40 shadow-[0_0_40px_rgba(245,158,11,0.15)] space-y-6">
                  
                  <div className="flex items-center justify-between border-b border-white/10 pb-4 gap-2">
                    <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping shrink-0"></div>
                      <span className="text-[10px] sm:text-xs font-black tracking-wider sm:tracking-widest text-slate-300 uppercase truncate">
                        DARSIL 3D LAB • VIRTUAL CAD SCAN
                      </span>
                    </div>
                    <span className="text-[9px] sm:text-[10px] font-mono px-2 py-0.5 sm:px-2.5 sm:py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
                      ISO 9001
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="p-4 rounded-2xl bg-black/60 border border-red-500/30 text-left space-y-2">
                      <div className="text-[11px] font-bold text-red-400 flex items-center space-x-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                        <span>Pieza Tradicional Rota</span>
                      </div>
                      <p className="text-slate-400 text-xs">Conector de ABS frágil quebrado por vibración. Repuesto sin stock en fábrica nacional.</p>
                      <div className="text-[10px] font-mono text-slate-500">Tiempo parada: 3 a 4 semanas</div>
                    </div>

                    <div className="p-4 rounded-2xl bg-black/60 border border-emerald-500/40 text-left space-y-2">
                      <div className="text-[11px] font-bold text-emerald-400 flex items-center space-x-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span>DARSIL Titanium 3D</span>
                      </div>
                      <p className="text-slate-300 text-xs">Rediseñado en CAD con nervaduras de refuerzo y fabricado en Nylon de fibra de carbono.</p>
                      <div className="text-[10px] font-mono text-emerald-400 font-bold">Tiempo DARSIL: 24 Horas</div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-left flex items-start space-x-3">
                    <Zap className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-200">
                      <strong>Garantía Estructural:</strong> Cada componente manufacturado es probado bajo carga y calibración dimensional con micrómetro digital antes de la entrega final.
                    </p>
                  </div>

                </div>
              </div>

            </div>

          </div>
        </section>

        {/* SECCIÓN NUEVA 3: Protocolo Quirúrgico Titanium (4 Fases) */}
        <section className="py-20 bg-black/90 border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-xs font-black text-amber-400 uppercase tracking-widest block mb-2">
                Metodología Operativa Certificada
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white">
                El Protocolo Quirúrgico Titanium
              </h2>
              <p className="mt-3 text-sm text-slate-400">
                Desde el diagnóstico hasta la reactivación en ruta: máxima rigurosidad y transparencia técnica en cada intervención.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
              
              <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/10 hover:border-amber-400/50 transition space-y-3 relative group">
                <div className="text-2xl font-black text-amber-500/40 group-hover:text-amber-400 transition font-mono">01</div>
                <h3 className="text-base font-black text-white">Escaneo Digital CAN</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Conexión con interfaz OEM para capturar códigos de falla activos (DTC), señales de sensores y parámetros de inyección.
                </p>
                <div className="text-[10px] text-amber-400 font-mono font-bold pt-2">Telemetría en Vivo</div>
              </div>

              <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/10 hover:border-amber-400/50 transition space-y-3 relative group">
                <div className="text-2xl font-black text-amber-500/40 group-hover:text-amber-400 transition font-mono">02</div>
                <h3 className="text-base font-black text-white">Cotización Algorítmica</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Generación instantánea del presupuesto con código oficial de mano de obra, validación Sunat/Reniec y entrega digital.
                </p>
                <div className="text-[10px] text-amber-400 font-mono font-bold pt-2">Trazabilidad PDF Sunat</div>
              </div>

              <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/10 hover:border-amber-400/50 transition space-y-3 relative group">
                <div className="text-2xl font-black text-amber-500/40 group-hover:text-amber-400 transition font-mono">03</div>
                <h3 className="text-base font-black text-white">Intervención de Potencia</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Ejecución de trabajos con cableado ignífugo automotriz, banco de prueba de arrancadores y repuestos originales.
                </p>
                <div className="text-[10px] text-amber-400 font-mono font-bold pt-2">Prueba Dinámica 24V</div>
              </div>

              <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/10 hover:border-amber-400/50 transition space-y-3 relative group">
                <div className="text-2xl font-black text-amber-500/40 group-hover:text-amber-400 transition font-mono">04</div>
                <h3 className="text-base font-black text-white">Certificación y Entrega</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Prueba de campo final, firma digital del asesor y activación de la garantía técnica DARSIL con respaldo QR.
                </p>
                <div className="text-[10px] text-amber-400 font-mono font-bold pt-2">Garantía Respaldada</div>
              </div>

            </div>

          </div>
        </section>

        {/* SECCIÓN NUEVA 4: Cotizador Rápido Interactivo para Clientes */}
        <section id="calculadora" className="py-20 bg-gradient-to-b from-black via-slate-950/90 to-black border-t border-white/10">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-300 text-xs font-bold uppercase tracking-wider mb-4">
              <Gauge className="w-3.5 h-3.5 text-amber-400" />
              <span>Cotizador Rápido de Solución</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-black text-white mb-4">
              ¿Qué problema presenta tu flota hoy?
            </h2>
            <p className="text-slate-400 text-sm max-w-2xl mx-auto mb-10">
              Selecciona tu tipo de unidad y el síntoma o servicio que requieres para coordinar inmediatamente la asistencia con el equipo técnico de guardia.
            </p>

            <div className="bg-slate-900/80 p-6 sm:p-8 rounded-3xl border border-amber-500/30 backdrop-blur-2xl shadow-2xl text-left space-y-8">
              
              {/* Paso 1: Seleccionar Tipo de Vehículo */}
              <div>
                <span className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-3">
                  1. Selecciona la Unidad de tu Flota:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {vehicleOptions.map((v) => {
                    const IconComp = v.icon;
                    const isSelected = calcVehicle === v.id;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setCalcVehicle(v.id)}
                        className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-400 text-white shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                            : 'bg-black/40 border-white/10 text-slate-400 hover:border-white/30 hover:text-white'
                        }`}
                      >
                        <IconComp className={`w-5 h-5 mb-2 ${isSelected ? 'text-amber-400' : 'text-slate-400'}`} />
                        <div>
                          <div className="text-xs font-black">{v.label}</div>
                          <div className="text-[10px] text-slate-500 truncate">{v.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Paso 2: Seleccionar Servicio */}
              <div>
                <span className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-3">
                  2. Selecciona la Especialidad Técnica:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {serviceOptions.map((s) => {
                    const isSelected = calcService === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setCalcService(s.id)}
                        className={`p-4 rounded-2xl border text-left transition ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-400 text-white shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                            : 'bg-black/40 border-white/10 text-slate-400 hover:border-white/30 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-xs font-black ${isSelected ? 'text-amber-300' : 'text-white'}`}>
                            {s.label}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-slate-300">
                            {s.tag}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">{s.desc}</p>
                        <div className="text-[11px] font-mono text-amber-400 font-bold mt-2">
                          Tiempo estimado: {s.time}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Resumen y Botón de Enlace WhatsApp */}
              <div className="p-4 rounded-2xl bg-black/60 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-left space-y-1">
                  <div className="flex items-center space-x-2 text-emerald-400 text-xs font-black uppercase">
                    <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                    <span>Equipo Técnico de Guardia Disponible</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Atención directa por WhatsApp con personal certificado de DARSIL.
                  </p>
                </div>

                <a
                  href={getWhatsAppEstimateUrl()}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-6 py-3.5 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.4)] transition active:scale-95 shrink-0"
                >
                  <Send className="w-4 h-4" />
                  <span>Enviar Solicitud Inmediata</span>
                </a>
              </div>

            </div>

          </div>
        </section>

        {/* SECCIÓN NUEVA 5: Matriz de Cobertura de Flotas Pesadas */}
        <section className="py-16 bg-black border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <span className="text-xs font-black text-amber-400 uppercase tracking-widest block mb-2">
              Sectores Estratégicos
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-white mb-8">
              Respaldamos las Flotas Más Exigentes del País
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-900/40 border border-white/10">
                <span className="text-xs font-bold text-white block">Minería & Canteras</span>
                <span className="text-[11px] text-slate-400">Volquetes y maquinaria 24/7</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/40 border border-white/10">
                <span className="text-xs font-bold text-white block">Transporte Nacional</span>
                <span className="text-[11px] text-slate-400">Buses interprovinciales de 2 pisos</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/40 border border-white/10">
                <span className="text-xs font-bold text-white block">Concreteras & Mixers</span>
                <span className="text-[11px] text-slate-400">Sistemas electrohidráulicos</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/40 border border-white/10">
                <span className="text-xs font-bold text-white block">Carga & Logística Fría</span>
                <span className="text-[11px] text-slate-400">Tractocamiones de larga distancia</span>
              </div>
            </div>
          </div>
        </section>

        {/* Footer Futurista */}
        <footer className="border-t border-white/10 bg-black/90 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <div className="flex items-center space-x-3">
              <img src="./logo_transparente.png" alt="DARSIL" className="h-7 object-contain opacity-80" />
              <span>© 2026 DARSIL Automotive Solutions. Todos los derechos reservados.</span>
            </div>
            <div className="flex items-center space-x-4">
              <span>Villa El Salvador, Lima, Lima</span>
              <span>•</span>
              <a 
                href="https://api.whatsapp.com/send?phone=51934787006" 
                target="_blank" 
                rel="noreferrer" 
                className="text-amber-400 hover:underline"
              >
                WhatsApp Oficial: 934 787 006
              </a>
            </div>
          </div>
        </footer>

      </div>

      {/* Botón Flotante WhatsApp */}
      <a
        href="https://api.whatsapp.com/send?phone=51934787006&text=Hola%20DARSIL,%20quisiera%20cotizar%20un%20servicio%20t%C3%A9cnico."
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-6 right-6 z-50 p-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.5)] active:scale-95 transition duration-300 flex items-center justify-center group"
        title="Contáctanos por WhatsApp"
      >
        <Phone className="w-6 h-6 text-slate-950" />
        <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 ease-in-out font-black text-xs pl-0 group-hover:pl-2 text-slate-950">
          Atención Inmediata
        </span>
      </a>

    </div>
  );
}
