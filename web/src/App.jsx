import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import QuoteList from './components/QuoteList';
import LandingPage from './components/LandingPage';
import NewQuoteModal from './components/NewQuoteModal';
import EditQuoteModal from './components/EditQuoteModal';
import PdfViewerModal from './components/PdfViewerModal';
import MapboxRouteModal from './components/MapboxRouteModal';
import CatalogView from './components/CatalogView';
import CompanyInfoView from './components/CompanyInfoView';
import WorkOrdersView from './components/WorkOrdersView';
import InventoryView from './components/InventoryView';
import ReportsView from './components/ReportsView';
import LoginModal from './components/LoginModal';
import { api, getApiUrl } from './services/api';
import { Menu, PlusCircle, Radio, Sparkles, ClipboardList, LayoutDashboard, FileText } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('portal'); // Iniciar en el portal público de clientes
  const [quotes, setQuotes] = useState([]);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 1024 : false);

  // Autenticación de Darios Bacilio
  const [authUser, setAuthUser] = useState(() => {
    try {
      const saved = localStorage.getItem('darsil_auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Modales
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showNewQuoteModal, setShowNewQuoteModal] = useState(false);
  const [editingQuote, setEditingQuote] = useState(null);
  const [selectedQuoteForPdf, setSelectedQuoteForPdf] = useState(null);
  const [mappingQuote, setMappingQuote] = useState(null);
  const [triggerNewWorkOrder, setTriggerNewWorkOrder] = useState(0);

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      const res = await api.getQuotes();
      if (res?.data) {
        setQuotes(res.data);
      }
    } catch (err) {
      console.error('Error fetching quotes:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompany = async () => {
    try {
      const res = await api.getCompany();
      if (res?.data) {
        setCompany(res.data);
      }
    } catch (err) {
      console.error('Error fetching company:', err);
    }
  };

  useEffect(() => {
    fetchQuotes();
    fetchCompany();
  }, []);

  const handleShareWhatsApp = (q) => {
    const totalStr = 'S/ ' + Number(q.total || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 });
    const rawPhone = q.clientPhone ? String(q.clientPhone).replace(/\D/g, '') : '934787006';
    const phone = rawPhone.startsWith('51') ? rawPhone : `51${rawPhone}`;
    const pdfLink = `${getApiUrl()}/quotes/${q._id}/pdf`;
    const msg = `⚡ *DARSIL AUTOMOTIVE SOLUTIONS* ⚡
_Tecnología • Diagnóstico • Ingeniería • Innovación_

Estimado/a *${q.clientName}*,
Le hacemos llegar la cotización oficial solicitada:

📋 *N° Cotización:* ${q.quoteNumber}
${q.plate ? `🚗 *Vehículo:* ${q.plate} (${q.model || 'Sin modelo'})\n` : ''}💰 *Total:* ${totalStr}
📅 *Validez:* ${q.validUntil ? new Date(q.validUntil).toLocaleDateString('es-PE') : '15 días hábiles'}
💳 *Condición:* ${q.paymentCondition || 'Condición de pago 07 días despues de realizar el servicio.'}

📄 *Descargue su cotización oficial en PDF aquí:*
${pdfLink}

Quedamos a su entera disposición para coordinar la atención técnica.
📞 Asesor: ${q.advisorName || 'Darios Bacilio'} (${q.advisorPhone || '934787006'})`;

    window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleLogout = () => {
    localStorage.removeItem('darsil_auth_user');
    localStorage.removeItem('darsil_auth_token');
    setAuthUser(null);
    setActiveTab('portal');
  };

  const handleSwitchToAdmin = () => {
    if (authUser) {
      setActiveTab('dashboard');
    } else {
      setShowLoginModal(true);
    }
  };

  const handleNavClickTab = (tab) => {
    if (tab === 'portal') {
      setActiveTab('portal');
      return;
    }
    // Para acceder al ERP taller (dashboard, quotes, catalog, company) se requiere autenticación
    if (!authUser) {
      setShowLoginModal(true);
    } else {
      setActiveTab(tab);
    }
  };

  const handleOpenNewWorkOrder = () => {
    if (!authUser) {
      setShowLoginModal(true);
      return;
    }
    setActiveTab('workorders');
    setTriggerNewWorkOrder(Date.now());
  };

  // 1. Si está en el Portal / Landing Page de Clientes
  if (activeTab === 'portal') {
    return (
      <>
        <LandingPage
          quotes={quotes}
          authUser={authUser}
          onSwitchToAdmin={handleSwitchToAdmin}
        />
        {showLoginModal && (
          <LoginModal
            onLoginSuccess={(user) => {
              setAuthUser(user);
              setShowLoginModal(false);
              setActiveTab('dashboard');
            }}
            onCancel={() => setShowLoginModal(false)}
          />
        )}
      </>
    );
  }

  // 2. Si intenta acceder al ERP Taller sin sesión iniciada
  if (!authUser) {
    return (
      <div className="min-h-screen bg-darsil-obsidian flex flex-col justify-center items-center p-4">
        <LoginModal
          onLoginSuccess={(user) => {
            setAuthUser(user);
            setActiveTab('dashboard');
          }}
          onCancel={() => setActiveTab('portal')}
        />
      </div>
    );
  }

  // 3. Sistema ERP Taller Autenticado con Menú Lateral Desplegable
  return (
    <div className="min-h-screen bg-darsil-obsidian text-slate-100 flex font-sans selection:bg-amber-500 selection:text-slate-950 w-full max-w-full overflow-x-hidden">
      
      {/* Menú Lateral Desplegable (Sidebar Drawer) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleNavClickTab}
        onOpenNewQuote={() => setShowNewQuoteModal(true)}
        onOpenNewWorkOrder={handleOpenNewWorkOrder}
        quotes={quotes}
        authUser={authUser}
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />

      {/* Área de Trabajo Principal */}
      <div 
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out w-full max-w-full min-w-0 overflow-x-hidden ${
          sidebarOpen ? 'lg:pl-72' : 'lg:pl-20'
        }`}
      >
        
        {/* Topbar Ejecutiva Responsiva */}
        <header className="sticky top-0 z-30 bg-darsil-obsidian/95 backdrop-blur-md border-b border-darsil-border h-14 sm:h-16 px-2.5 sm:px-6 flex items-center justify-between shadow-md w-full max-w-full min-w-0">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 sm:p-2 rounded-xl bg-darsil-card hover:bg-slate-800 text-slate-300 hover:text-white border border-darsil-border transition active:scale-95 shrink-0"
              title="Desplegar / Ocultar Menú Lateral"
            >
              <Menu className="w-4 h-4" />
            </button>

            {/* Breadcrumb del ERP con truncamiento en pantallas pequeñas */}
            <div className="flex items-center space-x-1.5 sm:space-x-2 text-xs min-w-0">
              <span className="font-bold text-slate-400 hidden sm:inline">ERP DARSIL</span>
              <span className="text-slate-600 hidden sm:inline">/</span>
              <span className="font-black text-amber-400 tracking-wide uppercase truncate max-w-[105px] xs:max-w-[140px] sm:max-w-none text-[11px] sm:text-xs">
                {activeTab === 'dashboard' ? 'Dashboard' :
                 activeTab === 'quotes' ? 'Cotizaciones' :
                 activeTab === 'workorders' ? 'Órdenes de Trabajo' :
                 activeTab === 'catalog' ? 'Catálogo MO' :
                 activeTab === 'inventory' ? 'Inventario' :
                 activeTab === 'reports' ? 'Reportes' :
                 activeTab === 'company' ? 'Datos Bancarios' :
                 activeTab}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
            {/* Píldora de Estado */}
            <div className="hidden md:flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Render Cloud & Atlas Conectado</span>
            </div>

            {/* Botón Acción Rápida: Nueva Orden de Trabajo */}
            <button
              onClick={handleOpenNewWorkOrder}
              className="flex items-center space-x-1 sm:space-x-1.5 px-2 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-gold-glow hover:brightness-110 active:scale-95 transition"
              title="Crear Nueva Orden de Trabajo y Check-In Taller"
            >
              <ClipboardList className="w-3.5 h-3.5 text-slate-950 shrink-0" />
              <span className="hidden sm:inline">+ Nueva Orden de Trabajo</span>
              <span className="sm:hidden text-[10px] font-black">+ OT</span>
            </button>

            {/* Perfil Rápido */}
            <div className="flex items-center space-x-1 sm:space-x-2 pl-1 sm:pl-2 border-l border-darsil-border">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 font-black flex items-center justify-center text-xs shadow-inner shrink-0">
                DB
              </div>
              <div className="hidden xl:block text-left">
                <span className="text-xs font-bold text-white block leading-none">
                  {authUser?.name || 'Darios Bacilio'}
                </span>
                <span className="text-[9px] text-amber-400 font-mono">
                  ADMINISTRADOR
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Contenido de la Vista Activa con padding inferior para la barra móvil */}
        <main className="max-w-7xl w-full mx-auto px-2.5 sm:px-6 lg:px-8 py-3 sm:py-6 flex-1 space-y-4 sm:space-y-6 pb-24 lg:pb-6 min-w-0 overflow-x-hidden">
          
          {/* Pestaña: Dashboard Ejecutivo */}
          {activeTab === 'dashboard' && (
            <DashboardView
              quotes={quotes}
              onOpenNewQuote={() => setShowNewQuoteModal(true)}
              onSelectQuote={(q) => setSelectedQuoteForPdf(q)}
              setActiveTab={setActiveTab}
              onShareWhatsApp={handleShareWhatsApp}
              onRefreshQuotes={fetchQuotes}
            />
          )}

          {/* Pestaña: Cotizaciones */}
          {activeTab === 'quotes' && (
            <QuoteList
              quotes={quotes}
              onSelectQuote={(q) => setSelectedQuoteForPdf(q)}
              onEditQuote={(q) => setEditingQuote(q)}
              onOpenMap={(q) => setMappingQuote(q)}
              onRefresh={fetchQuotes}
              onOpenNewQuote={() => setShowNewQuoteModal(true)}
            />
          )}

          {/* Pestaña: Órdenes de Trabajo & Check-In Taller */}
          {activeTab === 'workorders' && (
            <WorkOrdersView
              triggerNewOrder={triggerNewWorkOrder}
              onSelectQuote={(q) => {
                fetchQuotes();
                setSelectedQuoteForPdf(q);
              }}
              onRefreshQuotes={fetchQuotes}
            />
          )}

          {/* Pestaña: Catálogo MO */}
          {activeTab === 'catalog' && (
            <CatalogView />
          )}

          {/* Pestaña: Control de Inventario & Kardex */}
          {activeTab === 'inventory' && (
            <InventoryView />
          )}

          {/* Pestaña: Reportes Ejecutivos & Contabilidad */}
          {activeTab === 'reports' && (
            <ReportsView />
          )}

          {/* Pestaña: Datos Bancarios & Taller */}
          {activeTab === 'company' && (
            <CompanyInfoView />
          )}

        </main>

        {/* Footer ERP */}
        <footer className="bg-darsil-obsidian border-t border-darsil-border py-4 px-3 sm:px-6 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 pb-20 lg:pb-4 w-full max-w-full overflow-hidden">
          <span className="text-[10px] sm:text-xs text-slate-500 text-center sm:text-left break-words max-w-full leading-relaxed">
            DARSIL AUTOMOTIVE SOLUTIONS • Av. Los Forestales MZ I1, Villa El Salvador, Lima, Lima • 2026
          </span>
          <span className="text-amber-400 font-mono text-[10px] shrink-0">v2.6.0 Enterprise</span>
        </footer>

      </div>

      {/* Barra de Navegación Inferior Móvil (Mobile Bottom Bar) estilo iOS App para iPhone 15 Pro */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-darsil-obsidian/95 backdrop-blur-xl border-t border-darsil-border py-1.5 px-3 flex items-center justify-around lg:hidden pb-safe shadow-[0_-5px_25px_rgba(0,0,0,0.6)] select-none">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition ${
            activeTab === 'dashboard' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 font-medium">Inicio</span>
        </button>

        <button
          onClick={() => setActiveTab('workorders')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition ${
            activeTab === 'workorders' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ClipboardList className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 font-medium">OT Taller</span>
        </button>

        {/* Botón Flotante Central: Nueva OT */}
        <button
          onClick={handleOpenNewWorkOrder}
          className="flex flex-col items-center justify-center -mt-5 p-3 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 shadow-gold-glow active:scale-95 transition"
          title="Nueva Orden de Trabajo"
        >
          <PlusCircle className="w-6 h-6 stroke-[2.5]" />
        </button>

        <button
          onClick={() => setActiveTab('quotes')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition ${
            activeTab === 'quotes' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 font-medium">Cotizaciones</span>
        </button>

        <button
          onClick={() => setSidebarOpen(true)}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition ${
            ['catalog', 'inventory', 'reports', 'company'].includes(activeTab) ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 font-medium">Menú</span>
        </button>
      </nav>

      {/* Modal Login si se abre desde sidebar */}
      {showLoginModal && (
        <LoginModal
          onLoginSuccess={(user) => {
            setAuthUser(user);
            setShowLoginModal(false);
          }}
          onCancel={() => setShowLoginModal(false)}
        />
      )}

      {/* Modal Nueva Cotización */}
      {showNewQuoteModal && (
        <NewQuoteModal
          onClose={() => setShowNewQuoteModal(false)}
          onSuccess={(created) => {
            setShowNewQuoteModal(false);
            fetchQuotes();
            setSelectedQuoteForPdf(created);
          }}
        />
      )}

      {/* Modal Editar Cotización */}
      {editingQuote && (
        <EditQuoteModal
          quote={editingQuote}
          onClose={() => setEditingQuote(null)}
          onQuoteUpdated={(updatedQuote) => {
            fetchQuotes();
            setEditingQuote(null);
            setSelectedQuoteForPdf(updatedQuote || editingQuote);
          }}
        />
      )}

      {/* Modal Previsualizador PDF */}
      {selectedQuoteForPdf && (
        <PdfViewerModal
          quote={selectedQuoteForPdf}
          onClose={() => setSelectedQuoteForPdf(null)}
          onOpenMap={(q) => {
            setSelectedQuoteForPdf(null);
            setMappingQuote(q);
          }}
          onRefresh={() => {
            fetchQuotes();
            if (selectedQuoteForPdf?.isWorkOrder || selectedQuoteForPdf?.orderNumber) {
              api.getWorkOrderById(selectedQuoteForPdf._id).then(r => {
                if (r?.data) setSelectedQuoteForPdf({ ...r.data, isWorkOrder: true });
              });
            } else {
              api.getQuoteById(selectedQuoteForPdf._id).then(r => {
                if (r?.data) setSelectedQuoteForPdf(r.data);
              });
            }
          }}
        />
      )}

      {/* Modal Mapbox Route & Viáticos */}
      {mappingQuote && (
        <MapboxRouteModal
          quote={mappingQuote}
          company={company}
          onClose={() => setMappingQuote(null)}
          onQuoteUpdated={() => {
            fetchQuotes();
          }}
        />
      )}

    </div>
  );
}
