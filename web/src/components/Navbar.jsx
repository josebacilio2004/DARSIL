import React, { useState } from 'react';
import { 
  PlusCircle, 
  FileText, 
  Wrench, 
  ShieldCheck, 
  LayoutDashboard, 
  Globe, 
  Menu, 
  X,
  ChevronDown
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onOpenNewQuote, company }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (tab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
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
        </div>
      )}

    </header>
  );
}
