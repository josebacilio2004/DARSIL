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
import { api } from './services/api';
import { Menu, PlusCircle, Radio, Sparkles, ClipboardList } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('portal'); // Iniciar en el portal público de clientes
  const [quotes, setQuotes] = useState([]);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Autenticación de Darios Bacilio
  const [authUser, setAuthUser] = useState(() => {
    try {
      const saved = localStorage.getItem('darsil_auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Estados de Modales
  const [showNewQuoteModal, setShowNewQuoteModal] = useState(false);
  const [selectedQuoteForPdf, setSelectedQuoteForPdf] = useState(null);
  const [editingQuote, setEditingQuote] = useState(null);
  const [mappingQuote, setMappingQuote] = useState(null);
  const [triggerNewWorkOrder, setTriggerNewWorkOrder] = useState(null);

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      const res = await api.getQuotes();
      if (res.success && res.data) {
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
      if (res.success && res.data) {
        setCompany(res.data);
      }
    } catch (err) {
      console.error('Error fetching company:', err);
    }
  };

  useEffect(() => {
    fetchQuotes();
    fetchCompany();
    // Siempre mostrar el Landing Page en primer plano al entrar al enlace
    setActiveTab('portal');
  }, []);

  const handleShareWhatsApp = (q) => {
    const totalStr = 'S/ ' + Number(q.total || 0).toFixed(2);
    const phone = q.clientPhone ? q.clientPhone.replace(/\D/g, '') : '934787006';
    const msg = `Hola ${q.clientName}, le compartimos la cotización oficial ${q.quoteNumber} de DARSIL Automotive Solutions por un total de ${totalStr}.\nPuede descargar su documento oficial aquí: ${window.location.origin}/api/quotes/${q._id}/pdf`;
    window.open(`https://api.whatsapp.com/send?phone=51${phone}&text=${encodeURIComponent(msg)}`, '_blank');
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
    <div className="min-h-screen bg-darsil-obsidian text-slate-100 flex font-sans selection:bg-amber-500 selection:text-slate-950">
      
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
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'lg:pl-72' : 'lg:pl-20'
        }`}
      >
        
        {/* Topbar Ejecutiva */}
        <header className="sticky top-0 z-30 bg-darsil-obsidian/95 backdrop-blur-md border-b border-darsil-border h-16 px-4 sm:px-6 flex items-center justify-between shadow-md">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-xl bg-darsil-card hover:bg-slate-800 text-slate-300 hover:text-white border border-darsil-border transition active:scale-95"
              title="Desplegar / Ocultar Menú Lateral"
            >
              <Menu className="w-4 h-4" />
            </button>

            {/* Breadcrumb del ERP */}
            <div className="flex items-center space-x-2 text-xs">
              <span className="font-bold text-slate-400 hidden sm:inline">ERP DARSIL</span>
              <span className="text-slate-600 hidden sm:inline">/</span>
              <span className="font-black text-amber-400 tracking-wide uppercase">
                {activeTab === 'dashboard' ? 'Dashboard General' :
                 activeTab === 'quotes' ? 'Cotizaciones Oficiales' :
                 activeTab === 'workorders' ? 'Órdenes de Trabajo & Check-In Taller' :
                 activeTab === 'catalog' ? 'Catálogo de Mano de Obra' :
                 activeTab === 'inventory' ? 'Control de Inventario & Kardex' :
                 activeTab === 'reports' ? 'Reportes Ejecutivos & Libro Ventas' :
                 activeTab === 'company' ? 'Datos Bancarios & Taller' :
                 activeTab}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Píldora de Estado */}
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Render Cloud & Atlas Conectado</span>
            </div>

            {/* Botón Acción Rápida: Nueva Orden de Trabajo */}
            <button
              onClick={handleOpenNewWorkOrder}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-gold-glow hover:brightness-110 active:scale-95 transition"
              title="Crear Nueva Orden de Trabajo y Check-In Taller"
            >
              <ClipboardList className="w-3.5 h-3.5 text-slate-950" />
              <span className="hidden sm:inline">+ Nueva Orden de Trabajo</span>
              <span className="sm:hidden">+ Nueva OT</span>
            </button>

            {/* Perfil Rápido */}
            <div className="flex items-center space-x-2 pl-2 border-l border-darsil-border">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 font-black flex items-center justify-center text-xs shadow-inner">
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

        {/* Contenido de la Vista Activa */}
        <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 space-y-6">
          
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
            />
          )}

          {/* Pestaña: Órdenes de Trabajo & Check-In Taller */}
          {activeTab === 'workorders' && (
            <WorkOrdersView
              triggerNewOrder={triggerNewWorkOrder}
              onSelectQuote={(q) => setSelectedQuoteForPdf(q)}
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
        <footer className="bg-darsil-obsidian border-t border-darsil-border py-4 px-6 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <span>DARSIL AUTOMOTIVE SOLUTIONS • Av. Los Forestales MZ I1, Villa El Salvador, Lima, Lima • 2026</span>
          <span className="text-amber-400 font-mono text-[10px]">v2.6.0 Enterprise</span>
        </footer>

      </div>

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
          onQuoteUpdated={() => {
            fetchQuotes();
            setEditingQuote(null);
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
            api.getQuoteById(selectedQuoteForPdf._id).then(r => {
              if (r?.data) setSelectedQuoteForPdf(r.data);
            });
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
