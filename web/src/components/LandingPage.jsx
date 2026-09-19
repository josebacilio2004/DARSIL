import React, { useState } from 'react';
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
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';

export default function LandingPage({ quotes = [], onSwitchToAdmin }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [foundQuote, setFoundQuote] = useState(null);
  const [searchError, setSearchError] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchError('');
    setFoundQuote(null);

    const query = searchQuery.trim().toUpperCase();
    if (!query) return;

    // Buscar por N° de cotización o por placa o por RUC/DNI
    const match = quotes.find(q => 
      (q.quoteNumber && q.quoteNumber.toUpperCase() === query) ||
      (q.plate && q.plate.toUpperCase() === query) ||
      (q.clientDoc && q.clientDoc.trim() === query)
    );

    if (match) {
      setFoundQuote(match);
    } else {
      setSearchError(`No se encontró ninguna cotización activa para "${searchQuery}". Verifica el número o placa ingresada.`);
    }
  };

  const formatSoles = (val) => {
    return 'S/ ' + Number(val || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="relative min-h-screen bg-black text-white font-sans overflow-x-hidden selection:bg-amber-500 selection:text-black">
      
      {/* 1. Fondo de Video Futurista en Bucle con Overlay */}
      <div className="fixed inset-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover filter brightness-[0.38] contrast-125 scale-105"
        >
          <source src="./video_fondo.mp4" type="video/mp4" />
        </video>
        {/* Capas de degradado de alta tecnología */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-slate-950/75 to-black/95"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/5 via-transparent to-black/80"></div>
      </div>

      {/* Contenido Principal por encima del video */}
      <div className="relative z-10 flex flex-col min-h-screen">

        {/* Barra Superior / Header Futurista */}
        <header className="border-b border-white/10 bg-black/40 backdrop-blur-xl sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
            
            {/* Logo Transparente */}
            <div className="flex items-center space-x-3">
              <div className="h-12 w-36 sm:w-44 flex items-center justify-center p-1 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
                <img
                  src="./logo_transparente.png"
                  alt="DARSIL Automotive Solutions"
                  className="h-full w-full object-contain filter drop-shadow-[0_0_8px_rgba(229,169,60,0.4)]"
                />
              </div>
              <div className="hidden md:block pl-3 border-l border-white/15">
                <span className="text-[11px] tracking-widest font-black text-amber-400 block uppercase">
                  Ingeniería & Soluciones Automotrices
                </span>
                <span className="text-[9px] text-slate-400 font-medium tracking-wide">
                  Diagnóstico Avanzado • Impresión 3D • Flotas
                </span>
              </div>
            </div>

            {/* Enlaces de Navegación Rápida & Acceso Interno */}
            <nav className="flex items-center space-x-4 sm:space-x-6">
              <a href="#rastreador" className="hidden sm:inline-block text-xs font-bold text-slate-300 hover:text-amber-400 transition">
                Consultar Cotización
              </a>
              <a href="#servicios" className="hidden sm:inline-block text-xs font-bold text-slate-300 hover:text-amber-400 transition">
                Servicios Técnicos
              </a>
              <a 
                href="https://api.whatsapp.com/send?phone=51934787006&text=Hola%20DARSIL,%20solicito%20asistencia%20t%C3%A9cnica%20automotriz."
                target="_blank" 
                rel="noreferrer"
                className="hidden lg:flex items-center space-x-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-full hover:bg-emerald-500/20 transition"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Central: 934 787 006</span>
              </a>

              {/* Botón Acceso ERP Interno */}
              <button
                onClick={onSwitchToAdmin}
                className="flex items-center space-x-1.5 text-xs font-black bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 px-4 py-2 rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.4)] hover:brightness-110 active:scale-95 transition"
              >
                <span>Acceso ERP Taller</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </nav>

          </div>
        </header>

        {/* Sección HERO de Alto Impacto */}
        <section className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 flex flex-col justify-center items-center text-center">
          
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-400/30 backdrop-blur-md text-amber-300 text-xs font-bold tracking-widest uppercase mb-6 shadow-inner animate-pulse">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>TECNOLOGÍA DE VANGUARDIA • DIAGNÓSTICO DIGITAL DE FLOTAS & MANUFACTURA 3D</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400 tracking-tight max-w-5xl leading-none sm:leading-tight">
            INGENIERÍA AUTOMOTRIZ DE PRECISIÓN Y SOLUCIONES EN CAMPO
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-3xl leading-relaxed font-normal">
            Especialistas en electrónica pesada, reparación de sistemas de arranque de 24V, diagnóstico computarizado con escáner oficial y fabricación de componentes descontinuados mediante impresión 3D industrial.
          </p>

          {/* Buscador / Rastreador de Cotizaciones para Clientes */}
          <div id="rastreador" className="mt-12 w-full max-w-2xl">
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
                    placeholder="Ingresa tu Placa (ej. ABG890) o N° Cotización (DA-2026-022)"
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

        {/* Sección de Especialidades / Servicios */}
        <section id="servicios" className="py-16 bg-black/60 backdrop-blur-md border-t border-white/10">
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

        {/* Footer Futurista */}
        <footer className="border-t border-white/10 bg-black/80 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <div className="flex items-center space-x-3">
              <img src="./logo_transparente.png" alt="DARSIL" className="h-7 object-contain opacity-80" />
              <span>© 2026 DARSIL Automotive Solutions. Todos los derechos reservados.</span>
            </div>
            <div className="flex items-center space-x-4">
              <span>Av. Los Forestales MZ I1, Villa El Salvador, Lima</span>
              <span>•</span>
              <a 
                href="https://api.whatsapp.com/send?phone=51934787006" 
                target="_blank" 
                rel="noreferrer" 
                className="text-amber-400 hover:underline"
              >
                WhatsApp Oficial
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
        className="fixed bottom-6 right-6 z-50 p-4 bg-emerald-500 hover:bg-emerald-400 text-white rounded-full shadow-[0_0_20px_rgba(16,185,129,0.5)] active:scale-95 transition duration-300 flex items-center justify-center group"
        title="Contáctanos por WhatsApp"
      >
        <Phone className="w-6 h-6" />
        <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 ease-in-out font-bold text-xs pl-0 group-hover:pl-2">
          Atención Inmediata
        </span>
      </a>

    </div>
  );
}
