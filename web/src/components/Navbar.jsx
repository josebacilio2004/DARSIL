import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, 
  FileText, 
  Wrench, 
  ShieldCheck, 
  LayoutDashboard, 
  Globe, 
  Menu, 
  X,
  ChevronDown,
  Server,
  Check,
  RefreshCw,
  AlertCircle,
  Lock,
  LogOut,
  UserCheck
} from 'lucide-react';
import { getApiUrl, setApiUrl } from '../services/api';

export default function Navbar({ activeTab, setActiveTab, onOpenNewQuote, company, authUser, onLogout, onOpenLogin }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [serverModalOpen, setServerModalOpen] = useState(false);
  const [customApiUrl, setCustomApiUrl] = useState('');
  const [testStatus, setTestStatus] = useState(null); // 'testing', 'success', 'error'
  const [testMsg, setTestMsg] = useState('');

  useEffect(() => {
    setCustomApiUrl(getApiUrl());
  }, [serverModalOpen]);

  const handleNavClick = (tab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  const handleTestConnection = async () => {
    setTestStatus('testing');
    setTestMsg('Conectando con el servidor...');
    try {
      const cleanUrl = customApiUrl.trim().replace(/\/$/, '');
      const res = await fetch(`${cleanUrl}/catalog`, { method: 'GET' });
      if (res.ok) {
        setTestStatus('success');
        setTestMsg('¡Conexión exitosa! El backend está respondiendo correctamente.');
      } else {
        setTestStatus('error');
        setTestMsg(`El servidor respondió con código: ${res.status}`);
      }
    } catch (err) {
      setTestStatus('error');
      setTestMsg(`No se pudo conectar: ${err.message}. Verifica que Render esté activo.`);
    }
  };

  const handleSaveServer = () => {
    setApiUrl(customApiUrl);
    setServerModalOpen(false);
    window.location.reload();
  };

  return (
    <header className="bg-darsil-obsidian/95 backdrop-blur-md border-b border-darsil-border text-white sticky top-0 z-40 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo Oficial Transparente DARSIL */}
          <div 
            className="flex items-center space-x-3 cursor-pointer select-none group" 
            onClick={() => handleNavClick('dashboard')}
          >
            <div className="h-12 w-36 sm:w-44 flex items-center justify-center p-1 rounded-xl bg-black/40 border border-darsil-border/60 group-hover:border-amber-500/50 transition">
              <img
                src="./logo_transparente.png"
                alt="DARSIL Logo"
                className="h-full w-full object-contain filter drop-shadow-[0_0_8px_rgba(229,169,60,0.3)]"
              />
            </div>

            <div className="hidden sm:block pl-2 border-l border-darsil-border/80">
              <span className="text-[10px] tracking-widest font-black text-darsil-gold block uppercase">
                SISTEMA INTEGRAL
              </span>
              <span className="text-[9px] text-slate-400 font-medium">
                OPERACIONES & FLOTAS
              </span>
            </div>
          </div>

          {/* Menú de Navegación de Escritorio */}
          <nav className="hidden lg:flex items-center space-x-1.5">
            <button
              onClick={() => handleNavClick('dashboard')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-400/50 shadow-gold-glow'
                  : 'text-slate-400 hover:text-white hover:bg-darsil-card border border-transparent'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-darsil-gold" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => handleNavClick('quotes')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'quotes'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-400/50 shadow-gold-glow'
                  : 'text-slate-400 hover:text-white hover:bg-darsil-card border border-transparent'
              }`}
            >
              <FileText className="w-4 h-4 text-darsil-gold" />
              <span>Cotizaciones</span>
            </button>

            <button
              onClick={() => handleNavClick('catalog')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'catalog'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-400/50 shadow-gold-glow'
                  : 'text-slate-400 hover:text-white hover:bg-darsil-card border border-transparent'
              }`}
            >
              <Wrench className="w-4 h-4 text-darsil-gold" />
              <span>Catálogo MO</span>
            </button>

            <button
              onClick={() => handleNavClick('company')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'company'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-400/50 shadow-gold-glow'
                  : 'text-slate-400 hover:text-white hover:bg-darsil-card border border-transparent'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-darsil-gold" />
              <span>Datos Bancarios & Taller</span>
            </button>

            <button
              onClick={() => handleNavClick('portal')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'portal'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                  : 'text-cyan-400 hover:text-cyan-200 hover:bg-cyan-950/40 border border-cyan-500/30'
              }`}
            >
              <Globe className="w-4 h-4 text-cyan-400" />
              <span>Landing Clientes</span>
            </button>
          </nav>

          {/* Botón Acción Principal y Menú Desplegable Móvil */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setServerModalOpen(true)}
              title="Configuración de Servidor Backend"
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-amber-300 border border-slate-700 transition"
            >
              <Server className="w-4 h-4 text-amber-400" />
              <span className="hidden xl:inline">Servidor API</span>
            </button>

            {authUser ? (
              <div className="hidden sm:flex items-center space-x-2 pl-2 border-l border-slate-700">
                <div className="text-right">
                  <div className="text-[11px] font-bold text-amber-300 leading-tight">
                    {authUser.name || 'Darios Bacilio'}
                  </div>
                  <div className="text-[9px] text-emerald-400 flex items-center justify-end gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Admin ERP</span>
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  title="Cerrar Sesión ERP"
                  className="p-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-800/40 transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition"
              >
                <Lock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Acceso ERP</span>
              </button>
            )}

            <button
              onClick={onOpenNewQuote}
              className="flex items-center space-x-2 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 px-4 py-2.5 rounded-xl font-black text-xs shadow-gold-glow active:scale-95 transition-all"
            >
              <PlusCircle className="w-4 h-4 text-slate-950" />
              <span className="hidden sm:inline">Nueva Cotización</span>
            </button>

            {/* Botón Hamburguesa Móvil */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-darsil-card text-slate-300 hover:text-white border border-darsil-border"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Menú Desplegable Móvil y Tablet */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-darsil-card border-b border-darsil-border px-4 py-4 space-y-2 animate-in slide-in-from-top-2">
          <button
            onClick={() => handleNavClick('dashboard')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold ${
              activeTab === 'dashboard' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-300'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-amber-400" />
            <span>Dashboard Ejecutivo</span>
          </button>

          <button
            onClick={() => handleNavClick('quotes')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold ${
              activeTab === 'quotes' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-300'
            }`}
          >
            <FileText className="w-4 h-4 text-amber-400" />
            <span>Gestión de Cotizaciones</span>
          </button>

          <button
            onClick={() => handleNavClick('catalog')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold ${
              activeTab === 'catalog' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-300'
            }`}
          >
            <Wrench className="w-4 h-4 text-amber-400" />
            <span>Catálogo MO (MO01-MO21)</span>
          </button>

          <button
            onClick={() => handleNavClick('company')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold ${
              activeTab === 'company' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-300'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>Datos Bancarios & Taller</span>
          </button>

          <button
            onClick={() => handleNavClick('portal')}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold bg-cyan-950/40 text-cyan-300 border border-cyan-500/40"
          >
            <Globe className="w-4 h-4 text-cyan-400" />
            <span>Landing Page Clientes (Futurista con Video)</span>
          </button>

          <button
            onClick={() => { setServerModalOpen(true); setMobileMenuOpen(false); }}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold text-amber-400 bg-slate-900 border border-slate-800"
          >
            <Server className="w-4 h-4 text-amber-400" />
            <span>Configurar Servidor Backend (Render)</span>
          </button>

          {authUser ? (
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between px-2">
              <div>
                <span className="text-xs font-bold text-amber-300 block">{authUser.name}</span>
                <span className="text-[10px] text-emerald-400">Admin ERP Activo</span>
              </div>
              <button
                onClick={() => { onLogout(); setMobileMenuOpen(false); }}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-red-950/60 text-red-300 text-xs border border-red-800/50"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => { onOpenLogin(); setMobileMenuOpen(false); }}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40"
            >
              <Lock className="w-4 h-4 text-amber-400" />
              <span>Acceder como Darios Bacilio</span>
            </button>
          )}
        </div>
      )}

      {/* Modal de Configuración de Servidor API */}
      {serverModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-darsil-card border border-amber-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Server className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-sm">Configuración de Servidor (Render / API)</h3>
              </div>
              <button 
                onClick={() => setServerModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Ingresa la URL del backend provista por Render (o tu servidor en la nube). Esta configuración se guarda localmente en tu navegador.
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">URL del Backend / API</label>
              <input 
                type="text" 
                value={customApiUrl}
                onChange={(e) => setCustomApiUrl(e.target.value)}
                placeholder="https://darsil-backend.onrender.com/api"
                className="w-full bg-black/50 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            {testStatus && (
              <div className={`p-3 rounded-xl text-xs flex items-start space-x-2 ${
                testStatus === 'success' ? 'bg-emerald-950/60 border border-emerald-500/50 text-emerald-300' :
                testStatus === 'error' ? 'bg-red-950/60 border border-red-500/50 text-red-300' :
                'bg-slate-800/60 border border-slate-700 text-slate-300'
              }`}>
                {testStatus === 'success' && <Check className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />}
                {testStatus === 'error' && <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />}
                {testStatus === 'testing' && <RefreshCw className="w-4 h-4 shrink-0 mt-0.5 animate-spin text-amber-400" />}
                <span>{testMsg}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleTestConnection}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 transition"
              >
                Probar Conexión
              </button>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setCustomApiUrl('https://darsil-backend.onrender.com/api')}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Render Default
                </button>
                <button
                  type="button"
                  onClick={handleSaveServer}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-gold-glow hover:brightness-110 transition"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </header>
  );
}
