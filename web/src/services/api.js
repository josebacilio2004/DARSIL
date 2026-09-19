const API_URL = import.meta.env.VITE_API_URL || 
  ((typeof window !== 'undefined' && (window.location.port === '3005' || window.location.port === '80')) 
    ? '/api' 
    : 'http://localhost:4000/api');

export const api = {
  // Cotizaciones
  getQuotes: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_URL}/quotes?${query}`);
    return res.json();
  },
  getQuoteById: async (id) => {
    const res = await fetch(`${API_URL}/quotes/${id}`);
    return res.json();
  },
  createQuote: async (data) => {
    const res = await fetch(`${API_URL}/quotes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  updateQuote: async (id, data) => {
    const res = await fetch(`${API_URL}/quotes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  deleteQuote: async (id) => {
    const res = await fetch(`${API_URL}/quotes/${id}`, {
      method: 'DELETE',
    });
    return res.json();
  },
  updateQuoteStatus: async (id, status) => {
    const res = await fetch(`${API_URL}/quotes/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    return res.json();
  },
  saveSignature: async (id, signatures) => {
    const res = await fetch(`${API_URL}/quotes/${id}/signature`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(signatures),
    });
    return res.json();
  },
  getPdfUrl: (id) => `${API_URL}/quotes/${id}/pdf`,

  // Catálogo
  getCatalog: async (category = '') => {
    const query = category ? `?category=${category}` : '';
    const res = await fetch(`${API_URL}/catalog${query}`);
    return res.json();
  },

  // Integraciones SUNAT
  lookupRuc: async (ruc) => {
    const res = await fetch(`${API_URL}/integrations/ruc/${ruc}`);
    return res.json();
  },
  lookupDni: async (dni) => {
    const res = await fetch(`${API_URL}/integrations/dni/${dni}`);
    return res.json();
  },

  // Empresa y Taller
  getCompany: async () => {
    const res = await fetch(`${API_URL}/company`);
    return res.json();
  },
  updateCompany: async (data) => {
    const res = await fetch(`${API_URL}/company`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  addBankAccount: async (data) => {
    const res = await fetch(`${API_URL}/company/bank-accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  updateBankAccount: async (accountId, data) => {
    const res = await fetch(`${API_URL}/company/bank-accounts/${accountId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  deleteBankAccount: async (accountId) => {
    const res = await fetch(`${API_URL}/company/bank-accounts/${accountId}`, {
      method: 'DELETE',
    });
    return res.json();
  }
};
