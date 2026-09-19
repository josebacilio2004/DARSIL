import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Wrench, 
  ShieldCheck, 
  Globe, 
  PlusCircle, 
  ChevronLeft, 
  ChevronRight, 
  LogOut, 
  Server, 
  UserCheck, 
  Shield, 
  X,
  Radio,
  ExternalLink,
  CheckCircle2,
  Menu
} from 'lucide-react';
import { getApiUrl, setApiUrl } from '../services/api';

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  onOpenNewQuote, 
  quotes = [], 
  authUser, 
  onLogout,
  isOpen,
  setIsOpen
}) {
  const [serverModalOpen, setServerModalOpen] = useState(false);
  const [customApiUrl, setCustomApiUrl] = useState('');
  const [testStatus, setTestStatus] = useState(null);
  const [testMsg, setTestMsg] = useState('');

  useEffect(() => {
    setCustomApiUrl(getApiUrl());
  }, [serverModalOpen]);

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

  const navigationGroups = [
    {
      title: 'OPERACIONES & FLOTAS',
      items: [
        { id: 'dashboard', label: 'Dashboard General', icon: LayoutDashboard, badge: null },
        { id: 'quotes', label: 'Cotizaciones', icon: FileText, badge: quotes.length ? String(quotes.length) : null },
        { id: 'catalog', label: 'Catálogo MO', icon: Wrench, badge: '25' }
      ]
    },
    {
      title: 'ADMINISTRACIÓN & TALLER',
      items: [
        { id: 'company', label: 'Datos Bancarios & Taller', icon: ShieldCheck, badge: null }
      ]
    },
    {
      title: 'PORTAL EXTERNO',
      items: [
        { id: 'portal', label: 'Landing Clientes', icon: Globe, badge: 'Web' }
      ]
    }
  ];

  return (
    <>
      {/* Backdrop para móviles cuando el sidebar está abierto */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
        />
      )}

      {/* Menú Lateral Desplegable */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 z-50 bg-darsil-obsidian border-r border-darsil-border text-white flex flex-col justify-between transition-all duration-300 ease-in-out shadow-2xl ${
          isOpen ? 'w-64 sm:w-72 translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-20'
        }`}
      >
        {/* Cabecera del Sidebar con Logo y Botón Colapsar */}
        <div className="p-4 border-b border-darsil-border flex items-center justify-between">
          <div 
            onClick={() => setActiveTab('dashboard')} 
            className="flex items-center space-x-3 cursor-pointer select-none overflow-hidden"
          >
            <div className="h-10 w-28 sm:w-32 flex items-center justify-center p-1 rounded-xl bg-black/40 border border-amber-500/20 shrink-0">
              <img
                src="./logo_transparente.png"
                alt="DARSIL"
                className="h-full w-full object-contain filter drop-shadow-[0_0_8px_rgba(229,169,60,0.3)]"
              />
            </div>
            {isOpen && (
              <span className="text-[10px] font-black uppercase text-amber-400 tracking-widest hidden sm:inline">
                ERP
              </span>
            )}
          </div>

          {/* Botón cerrar / togglear sidebar */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-xl bg-darsil-card hover:bg-slate-800 text-slate-400 hover:text-white border border-darsil-border transition"
            title={isOpen ? 'Contraer Menú' : 'Desplegar Menú'}
          >
            {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {/* Botón Acción Principal: Nueva Cotización */}
        <div className="p-3 border-b border-darsil-border/60">
          <button
            onClick={onOpenNewQuote}
            className={`w-full flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl font-black text-xs bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-gold-glow hover:brightness-110 active:scale-95 transition ${
              !isOpen && 'lg:px-0'
            }`}
            title="Crear Nueva Cotización"
          >
            <PlusCircle className="w-4 h-4 shrink-0 text-slate-950" />
            {isOpen && <span>+ Nueva Cotización</span>}
          </button>
        </div>

        {/* Grupos de Navegación */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin">
          {navigationGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1.5">
              {isOpen && (
                <div className="px-3 text-[9px] font-black tracking-widest text-slate-300 uppercase select-none">
                  {group.title}
                </div>
              )}

              {group.items.map((item) => {
                const IconComponent = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      if (window.innerWidth < 1024) setIsOpen(false);
                    }}
                    title={!isOpen ? item.label : undefined}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition group ${
                      isActive
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-400/50 shadow-gold-glow'
                        : 'text-slate-400 hover:text-white hover:bg-darsil-card border border-transparent'
                    } ${!isOpen ? 'lg:justify-center' : ''}`}
                  >
                    <div className="flex items-center space-x-3">
                      <IconComponent className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-400' : 'text-slate-400 group-hover:text-amber-400 transition'}`} />
                      {isOpen && <span className="truncate">{item.label}</span>}
                    </div>

                    {isOpen && item.badge && (
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                        isActive ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer del Sidebar: Usuario, Configuración Servidor & Logout */}
        <div className="p-3 border-t border-darsil-border bg-black/40 space-y-2">
          
          {/* Tarjeta Usuario */}
          {isOpen ? (
            <div className="p-2.5 rounded-xl bg-darsil-card border border-darsil-border flex items-center justify-between">
              <div className="flex items-center space-x-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 font-black flex items-center justify-center text-xs shrink-0 shadow-inner">
                  DB
                </div>
                <div className="text-left truncate">
                  <span className="text-xs font-bold text-white block truncate">
                    {authUser?.name || 'Darios Bacilio'}
                  </span>
                  <span className="text-[9px] text-amber-400 font-mono block">
                    {authUser?.role || 'ADMINISTRADOR'}
                  </span>
                </div>
              </div>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0 ml-2" title="Sesión activa"></div>
            </div>
          ) : (
            <div className="hidden lg:flex justify-center" title={`${authUser?.name || 'Darios Bacilio'} (Admin)`}>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 font-black flex items-center justify-center text-xs shadow-inner">
                DB
              </div>
            </div>
          )}

          {/* Acciones Rápidas del Footer */}
          <div className={`flex items-center gap-1.5 ${!isOpen ? 'lg:flex-col' : ''}`}>
            <button
              onClick={() => setServerModalOpen(true)}
              className="flex-1 flex items-center justify-center space-x-1.5 py-2 px-2.5 rounded-xl bg-darsil-card hover:bg-slate-800 text-slate-400 hover:text-white border border-darsil-border text-xs transition"
              title="Configurar Conexión con Servidor Render"
            >
              <Server className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              {isOpen && <span>Servidor</span>}
            </button>

            <button
              onClick={onLogout}
              className="flex-1 flex items-center justify-center space-x-1.5 py-2 px-2.5 rounded-xl bg-red-950/30 hover:bg-red-900/50 text-red-300 border border-red-900/40 text-xs transition"
              title="Cerrar Sesión del ERP"
            >
              <LogOut className="w-3.5 h-3.5 text-red-400 shrink-0" />
              {isOpen && <span>Salir</span>}
            </button>
          </div>

        </div>
      </aside>

      {/* Modal de Configuración de Servidor */}
      {serverModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-darsil-card border border-darsil-border rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-darsil-border pb-3">
              <div className="flex items-center space-x-2 text-cyan-400">
                <Server className="w-5 h-5" />
                <h3 className="font-bold text-sm text-white">Configuración del Servidor Backend</h3>
              </div>
              <button 
                onClick={() => setServerModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-400">
                La URL del backend conecta el frontend con la base de datos de MongoDB Atlas en Render:
              </p>
              
              <div className="space-y-1">
                <label className="text-slate-300 font-bold block">URL de la API (Render):</label>
                <input
                  type="text"
                  value={customApiUrl}
                  onChange={(e) => setCustomApiUrl(e.target.value)}
                  className="w-full bg-darsil-obsidian border border-darsil-border rounded-xl px-3 py-2 text-white font-mono focus:border-amber-400 outline-none"
                  placeholder="https://darsil-backend.onrender.com/api"
                />
              </div>

              {testMsg && (
                <div className={`p-3 rounded-xl border flex items-start space-x-2 ${
                  testStatus === 'success' 
                    ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300' 
                    : testStatus === 'testing'
                    ? 'bg-amber-950/60 border-amber-500/50 text-amber-300'
                    : 'bg-red-950/60 border-red-500/50 text-red-300'
                }`}>
                  <Radio className={`w-4 h-4 shrink-0 mt-0.5 ${testStatus === 'testing' ? 'animate-spin' : ''}`} />
                  <span>{testMsg}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-darsil-border">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testStatus === 'testing'}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition"
              >
                Probar Conexión
              </button>
              <button
                type="button"
                onClick={handleSaveServer}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition shadow-gold-glow"
              >
                Guardar URL
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
