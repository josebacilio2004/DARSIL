export const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    const saved = window.localStorage.getItem('darsil_api_url');
    if (saved) return saved.replace(/\/$/, '');
    if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL.replace(/\/$/, '');
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return window.location.port === '3005' ? '/api' : 'http://localhost:4000/api';
    }
  }
  return 'https://darsil.onrender.com/api';
};

export const setApiUrl = (url) => {
  if (typeof window !== 'undefined') {
    if (url && url.trim()) {
      window.localStorage.setItem('darsil_api_url', url.trim().replace(/\/$/, ''));
    } else {
      window.localStorage.removeItem('darsil_api_url');
    }
  }
};

export const api = {
  // Cotizaciones
  getQuotes: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${getApiUrl()}/quotes?${query}`);
    return res.json();
  },
  getQuoteById: async (id) => {
    const res = await fetch(`${getApiUrl()}/quotes/${id}`);
    return res.json();
  },
  createQuote: async (data) => {
    const res = await fetch(`${getApiUrl()}/quotes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  updateQuote: async (id, data) => {
    const res = await fetch(`${getApiUrl()}/quotes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  deleteQuote: async (id) => {
    const res = await fetch(`${getApiUrl()}/quotes/${id}`, {
      method: 'DELETE',
    });
    return res.json();
  },
  updateQuoteStatus: async (id, status) => {
    const res = await fetch(`${getApiUrl()}/quotes/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    return res.json();
  },
  saveSignature: async (id, signatures) => {
    const res = await fetch(`${getApiUrl()}/quotes/${id}/signature`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(signatures),
    });
    return res.json();
  },
  getPdfUrl: (id) => `${getApiUrl()}/quotes/${id}/pdf`,

  // Catálogo
  getCatalog: async (category = '') => {
    const query = category ? `?category=${category}` : '';
    const res = await fetch(`${getApiUrl()}/catalog${query}`);
    return res.json();
  },

  // Integraciones SUNAT
  lookupRuc: async (ruc) => {
    const res = await fetch(`${getApiUrl()}/integrations/ruc/${ruc}`);
    return res.json();
  },
  lookupDni: async (dni) => {
    const res = await fetch(`${getApiUrl()}/integrations/dni/${dni}`);
    return res.json();
  },

  // Empresa y Taller
  getCompany: async () => {
    const res = await fetch(`${getApiUrl()}/company`);
    return res.json();
  },
  updateCompany: async (data) => {
    const res = await fetch(`${getApiUrl()}/company`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  addBankAccount: async (data) => {
    const res = await fetch(`${getApiUrl()}/company/bank-accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  updateBankAccount: async (accountId, data) => {
    const res = await fetch(`${getApiUrl()}/company/bank-accounts/${accountId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  deleteBankAccount: async (accountId) => {
    const res = await fetch(`${getApiUrl()}/company/bank-accounts/${accountId}`, {
      method: 'DELETE',
    });
    return res.json();
  }
};
