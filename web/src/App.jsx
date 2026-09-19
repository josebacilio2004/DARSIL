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
import { api } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [quotes, setQuotes] = useState([]);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

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
  }, []);

  const handleShareWhatsApp = (q) => {
    const totalStr = 'S/ ' + Number(q.total || 0).toFixed(2);
    const phone = q.clientPhone ? q.clientPhone.replace(/\D/g, '') : '934787006';
    const msg = `Hola ${q.clientName}, le compartimos la cotización oficial ${q.quoteNumber} de DARSIL Automotive Solutions por un total de ${totalStr}.\nPuede descargar su documento oficial aquí: ${window.location.origin}/api/quotes/${q._id}/pdf`;
    window.open(`https://api.whatsapp.com/send?phone=51${phone}&text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Si está en la vista del Portal / Landing de Clientes, mostrar a pantalla completa con video
  if (activeTab === 'portal') {
    return (
      <LandingPage
        quotes={quotes}
        onSwitchToAdmin={() => setActiveTab('dashboard')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-darsil-obsidian text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      
      {/* Barra Superior */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewQuote={() => setShowNewQuoteModal(true)}
        company={company}
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
