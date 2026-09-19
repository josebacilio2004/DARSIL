import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import DashboardView from './components/DashboardView';
import QuoteList from './components/QuoteList';
import LandingPage from './components/LandingPage';
import NewQuoteModal from './components/NewQuoteModal';
import EditQuoteModal from './components/EditQuoteModal';
import PdfViewerModal from './components/PdfViewerModal';
import MapboxRouteModal from './components/MapboxRouteModal';
import CatalogView from './components/CatalogView';
import CompanyInfoView from './components/CompanyInfoView';
import LoginModal from './components/LoginModal';
import { api } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('portal'); // Iniciar en el portal público de clientes
  const [quotes, setQuotes] = useState([]);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

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

  // 3. Sistema ERP Taller Autenticado (Darios Bacilio)
  return (
    <div className="min-h-screen bg-darsil-obsidian text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      
      {/* Barra Superior */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleNavClickTab}
        onOpenNewQuote={() => setShowNewQuoteModal(true)}
        company={company}
        authUser={authUser}
        onLogout={handleLogout}
        onOpenLogin={() => setShowLoginModal(true)}
      />

      {/* Contenido Principal */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 space-y-6">
        
        {/* Pestaña: Dashboard Ejecutivo */}
        {activeTab === 'dashboard' && (
          <DashboardView
            quotes={quotes}
            onOpenNewQuote={() => setShowNewQuoteModal(true)}
            onSelectQuote={(q) => setSelectedQuoteForPdf(q)}
            setActiveTab={setActiveTab}
            onShareWhatsApp={handleShareWhatsApp}
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

        {/* Pestaña: Catálogo MO */}
        {activeTab === 'catalog' && (
          <CatalogView />
        )}

        {/* Pestaña: Datos Bancarios & Taller */}
        {activeTab === 'company' && (
          <CompanyInfoView />
        )}

      </main>

      {/* Modal Login si se abre desde navbar */}
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

      {/* Footer */}
      <footer className="bg-darsil-obsidian border-t border-darsil-border py-4 text-center text-xs text-slate-500">
        DARSIL AUTOMOTIVE SOLUTIONS • Sistema de Cotizaciones & Logística con Mapbox • 2026
      </footer>

    </div>
  );
}
