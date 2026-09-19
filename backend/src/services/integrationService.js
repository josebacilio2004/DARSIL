const axios = require('axios');

const APISPERU_TOKEN = process.env.APISPERU_TOKEN || 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6ImpmY2M5NTAxMjMwOUBnbWFpbC5jb20ifQ.UaK6eecpbt-mVnF9hI-BYSHtl6QQ5hCLU1MNItWe9P8';

// Fallback de caché para casos sin conexión externa
const MOCK_SUNAT_RUC = {
  '20608765432': {
    ruc: '20608765432',
    razonSocial: 'FR & Cars Maquinarias S.A.C',
    estado: 'ACTIVO',
    condicion: 'HABIDO',
    direccion: 'Av Los Forestales MZ I1, Villa EL Salvador 15842',
    departamento: 'LIMA',
    provincia: 'LIMA',
    distrito: 'VILLA EL SALVADOR'
  }
};

/**
 * Consulta RUC ante APIsPerú (SUNAT)
 */
async function searchRuc(ruc) {
  const cleanRuc = String(ruc).trim();
  if (!/^(10|20)\d{9}$/.test(cleanRuc)) {
    throw new Error('El RUC debe tener 11 dígitos y empezar con 10 o 20.');
  }

  // 1. Consulta directa a APIsPerú
  try {
    const url = `https://dniruc.apisperu.com/api/v1/ruc/${cleanRuc}?token=${APISPERU_TOKEN}`;
    const response = await axios.get(url, { timeout: 7000 });
    
    if (response.data && response.data.ruc) {
      const data = response.data;
      let fullAddress = data.direccion || '';
      if (!fullAddress && (data.distrito || data.departamento)) {
        fullAddress = [data.distrito, data.provincia, data.departamento].filter(Boolean).join(', ');
      }

      return {
        ruc: data.ruc,
        razonSocial: data.razonSocial,
        estado: data.estado || 'ACTIVO',
        condicion: data.condicion || 'HABIDO',
        direccion: fullAddress || 'Lima, Perú',
        distrito: data.distrito || '',
        provincia: data.provincia || '',
        departamento: data.departamento || ''
      };
    }
  } catch (apiErr) {
    console.warn(`Aviso: Error en APIsPerú RUC (${cleanRuc}):`, apiErr.message);
  }

  // 2. Fallback de caché
  if (MOCK_SUNAT_RUC[cleanRuc]) {
    return MOCK_SUNAT_RUC[cleanRuc];
  }

  return {
    ruc: cleanRuc,
    razonSocial: `EMPRESA RUC ${cleanRuc}`,
    estado: 'ACTIVO',
    condicion: 'HABIDO',
    direccion: 'Lima, Perú'
  };
}

/**
 * Consulta DNI ante APIsPerú (RENIEC)
 */
async function searchDni(dni) {
  const cleanDni = String(dni).trim();
  if (!/^\d{8}$/.test(cleanDni)) {
    throw new Error('El DNI debe tener 8 dígitos numéricos.');
  }

  try {
    const url = `https://dniruc.apisperu.com/api/v1/dni/${cleanDni}?token=${APISPERU_TOKEN}`;
    const response = await axios.get(url, { timeout: 7000 });
    
    if (response.data && (response.data.success !== false) && response.data.nombres) {
      const data = response.data;
      const nombreCompleto = `${data.nombres} ${data.apellidoPaterno || ''} ${data.apellidoMaterno || ''}`.trim();
      return {
        dni: data.dni || cleanDni,
        nombres: data.nombres,
        apellidoPaterno: data.apellidoPaterno,
        apellidoMaterno: data.apellidoMaterno,
        nombreCompleto
      };
    }
  } catch (apiErr) {
    console.warn(`Aviso: Error en APIsPerú DNI (${cleanDni}):`, apiErr.message);
  }

  return {
    dni: cleanDni,
    nombres: 'CLIENTE',
    apellidoPaterno: 'PARTICULAR',
    apellidoMaterno: '',
    nombreCompleto: `CLIENTE PARTICULAR (${cleanDni})`
  };
}

/**
 * Generador de enlaces de WhatsApp para enviar la cotización al cliente
 */
function generateWhatsAppShareLink(quote, baseUrl = 'http://localhost:4000') {
  const phone = quote.clientPhone ? String(quote.clientPhone).replace(/\D/g, '') : '';
  const pdfLink = `${baseUrl}/api/quotes/${quote._id}/pdf`;
  
  const vehicleText = quote.plate ? `\n🚗 *Vehículo:* ${quote.plate} (${quote.model || 'Sin modelo'})` : '';
  const formattedTotal = Number(quote.total || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  
  const message = 
`⚡ *DARSIL AUTOMOTIVE SOLUTIONS* ⚡
_Tecnología • Diagnóstico • Ingeniería • Innovación_

Estimado/a *${quote.clientName}*,
Le hacemos llegar la cotización solicitada:

📋 *Cotización:* ${quote.quoteNumber}${vehicleText}
💰 *Total:* S/ ${formattedTotal}
📅 *Validez:* ${quote.validUntil ? new Date(quote.validUntil).toLocaleDateString('es-PE') : '15 días hábiles'}
💳 *Condición:* ${quote.paymentCondition || '07 días después de realizado el servicio'}

📄 *Descargue su cotización oficial en PDF aquí:*
${pdfLink}

Quedamos a su entera disposición para coordinar la atención.
📞 Asesor: ${quote.advisorName || 'Ruben Basil'} (${quote.advisorPhone || '934787006'})`;

  const phoneParam = phone ? (phone.startsWith('51') ? phone : `51${phone}`) : '';
  const url = `https://api.whatsapp.com/send?phone=${phoneParam}&text=${encodeURIComponent(message)}`;
  
  return {
    phone: phoneParam,
    message,
    whatsappUrl: url
  };
}

module.exports = {
  searchRuc,
  searchDni,
  generateWhatsAppShareLink
};
