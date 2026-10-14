const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = process.env.CHROME_PATH || '/usr/bin/chromium';

async function launchPuppeteerCore() {
  const customPath = process.env.CHROME_PATH;
  let executablePath = null;
  if (customPath && fs.existsSync(customPath)) {
    executablePath = customPath;
  } else if (fs.existsSync('/usr/bin/chromium')) {
    executablePath = '/usr/bin/chromium';
  } else if (fs.existsSync('/usr/bin/chromium-browser')) {
    executablePath = '/usr/bin/chromium-browser';
  } else if (fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')) {
    executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  } else if (fs.existsSync('C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe')) {
    executablePath = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
  } else if (fs.existsSync('/usr/bin/google-chrome')) {
    executablePath = '/usr/bin/google-chrome';
  }

  if (!executablePath) {
    throw new Error('Chromium binary not found on host (instant fallback to printable HTML)');
  }

  return await puppeteer.launch({
    executablePath,
    headless: 'new',
    timeout: 7000,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-first-run',
      '--no-proxy-server',
      '--disable-extensions',
      '--font-render-hinting=none'
    ]
  });
}

function formatCurrency(amount) {
  return Number(amount || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function isExcludedObservationNote(str) {
  if (!str || typeof str !== 'string') return true;
  const s = str.trim().toLowerCase();
  return (
    s.length === 0 ||
    s.includes('cotización válida') ||
    s.includes('cotizacion valida') ||
    s.includes('válida por') ||
    s.includes('valida por') ||
    s.includes('días hábiles') ||
    s.includes('dias habiles') ||
    s.includes('días calendario') ||
    s.includes('dias calendario') ||
    s.startsWith('nota: cotización actualizada automáticamente') ||
    s.startsWith('nota: cotizacion actualizada automaticamente')
  );
}

/**
 * Renderiza la lista de condiciones comerciales y observaciones en formato de lista vertical
 */
function renderObservationsList(paymentCondition, commercialConditions = [], notes = '') {
  const items = [];

  if (paymentCondition && typeof paymentCondition === 'string') {
    const parts = paymentCondition
      .split(/\r?\n|•|\s+-\s+|;/)
      .map(s => s.trim())
      .filter(s => !isExcludedObservationNote(s));
    items.push(...parts);
  }

  if (Array.isArray(commercialConditions)) {
    commercialConditions.forEach(c => {
      if (c && typeof c === 'string' && !isExcludedObservationNote(c)) {
        const cClean = c.trim();
        if (!items.includes(cClean)) items.push(cClean);
      }
    });
  }

  if (notes && typeof notes === 'string' && !isExcludedObservationNote(notes)) {
    const noteParts = notes
      .split(/\r?\n|•/)
      .map(s => s.trim())
      .filter(s => !isExcludedObservationNote(s));
    items.push(...noteParts);
  }

  // Deduplicación preservando orden
  const uniqueItems = [];
  const seen = new Set();
  items.forEach(it => {
    const key = it.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      uniqueItems.push(it);
    }
  });

  if (uniqueItems.length === 0) {
    uniqueItems.push('Condición de pago 07 días despues de realizar el servicio.');
  }

  return uniqueItems.map(item => `
    <div class="obs-item">
      <span class="obs-bullet">•</span>
      <span class="obs-item-text">${item}</span>
    </div>
  `).join('');
}

let cachedLogoBase64 = null;
function getLogoDataUri() {
  if (cachedLogoBase64) return cachedLogoBase64;
  try {
    const assetPath = path.join(__dirname, '../../assets/logo_transparente.png');
    if (fs.existsSync(assetPath)) {
      const data = fs.readFileSync(assetPath).toString('base64');
      cachedLogoBase64 = `data:image/png;base64,${data}`;
      return cachedLogoBase64;
    }
  } catch (err) {
    console.warn('Could not read logo_transparente.png:', err.message);
  }
  return '';
}

function formatDate(date, fallbackAddDays = 0) {
  let d;
  if (!date) {
    if (fallbackAddDays > 0) {
      d = new Date(Date.now() + fallbackAddDays * 86400000);
    } else {
      d = new Date();
    }
  } else {
    d = new Date(date);
  }
  if (isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Genera el HTML de la plantilla Oficial de Taller (Plantilla 2)
 */
function renderTallerHtml(quote, company) {
  const logoSrc = getLogoDataUri();
  const isPartItem = (item) => {
    const code = (item.code || '').toUpperCase().trim();
    const desc = (item.description || '').toUpperCase().trim();
    const cat = (item.category || '').toUpperCase().trim();
    return code.startsWith('REP') || code.startsWith('CAB') || code.startsWith('CON') || 
           code.startsWith('FIL') || code.startsWith('FAR') || code.startsWith('SEN') ||
           desc.startsWith('REPUESTO') || desc.startsWith('ACCESORIO') || desc.startsWith('REP-') ||
           cat.includes('REPUESTO') || cat.includes('INSUMO') || cat.includes('PARTE');
  };

  const serviceItems = (quote.items || []).filter(item => !isPartItem(item));
  const partItems = (quote.items || []).filter(item => isPartItem(item));

  const subtotalServices = serviceItems.reduce((acc, it) => acc + (Number(it.value) || 0), 0);
  const subtotalParts = partItems.reduce((acc, it) => acc + (Number(it.value) || 0), 0);

  const advisorClean = (quote.advisorName && !quote.advisorName.includes('Basil'))
    ? quote.advisorName
    : 'Darios Bacilio';

  const banksHtml = (quote.bankAccountsSnapshot && quote.bankAccountsSnapshot.length > 0 
    ? quote.bankAccountsSnapshot 
    : (company?.bankAccounts || [])).map(b => `
      <tr>
        <td class="font-bold">${b.bank}</td>
        <td class="font-mono font-bold">${b.accountNumber}</td>
        <td class="font-mono font-bold">${b.interbankAccount}</td>
      </tr>
  `).join('');

  const clientSignatureHtml = quote.clientSignature 
    ? `<img src="${quote.clientSignature}" style="max-height: 45px; display: block; margin-bottom: 2px;" />` 
    : '';
  
  const advisorSignatureHtml = quote.advisorSignature 
    ? `<img src="${quote.advisorSignature}" style="max-height: 45px; display: block; margin-bottom: 2px;" />` 
    : '';

  // Asegurar que ningún campo de fecha/tiempo quede en blanco
  const validityDays = Number(quote.validityDays) || 15;
  const fechaAlta = formatDate(quote.issueDate);
  const fechaValidez = formatDate(quote.validUntil, validityDays);
  const plazoEntrega = quote.deliveryTerm && quote.deliveryTerm.trim() !== '' 
    ? quote.deliveryTerm 
    : 'Inmediato / Según programación';
  const referencia = quote.referencePerson && quote.referencePerson.trim() !== '' 
    ? quote.referencePerson 
    : (quote.clientName || 'Atención en Taller');

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 10px;
      color: #000;
      background: #fff;
      padding: 15px 25px;
      line-height: 1.25;
    }
    .header-table {
      width: 100%;
      margin-bottom: 8px;
    }
    .logo-container {
      width: 32%;
      vertical-align: middle;
      text-align: left;
    }
    .company-title-container {
      width: 68%;
      text-align: center;
      vertical-align: middle;
    }
    .company-main-title {
      font-size: 14px;
      font-weight: 900;
      color: #0f294a;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
      text-align: center;
    }
    .company-contact {
      font-size: 10px;
      font-weight: bold;
      color: #333;
      text-align: center;
    }

    /* Grid de Metadatos */
    .meta-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
    }
    .meta-table td {
      border: 1px solid #a0aec0;
      padding: 3.5px 6px;
      font-size: 10px;
    }
    .meta-label {
      background-color: #f1f5f9;
      font-weight: bold;
      color: #1e293b;
      width: 14%;
    }
    .meta-val {
      width: 36%;
    }

    /* Tabla de Ítems */
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 8px;
    }
    .items-table th {
      background-color: #1b3252;
      color: #ffffff;
      border: 1px solid #1b3252;
      padding: 4px 5px;
      font-size: 10.5px;
      font-weight: bold;
    }
    .items-table td {
      border: 1px solid #a0aec0;
      padding: 3px 5px;
      font-size: 9.5px;
    }
    .bg-yellow {
      background-color: #fef9c3 !important;
      font-weight: bold;
    }
    .text-center { text-align: center; }
    .text-left { text-align: left; }
    .text-right { text-align: right; }
    .font-mono { font-family: monospace; font-size: 9.5px; }
    .font-bold { font-weight: bold; }

    /* Total */
    .total-bar {
      width: 100%;
      background-color: #e2e8f0;
      border: 1px solid #a0aec0;
      padding: 4px 8px;
      text-align: right;
      font-size: 11px;
      font-weight: bold;
      margin-bottom: 14px;
    }
    .total-amount {
      display: inline-block;
      min-width: 90px;
      text-align: right;
    }

    /* Bancos */
    .bank-table {
      width: 80%;
      border-collapse: collapse;
      margin-bottom: 12px;
      font-size: 9.5px;
    }
    .bank-table th {
      text-align: left;
      font-size: 9.5px;
      padding-bottom: 3px;
      color: #1e293b;
    }
    .bank-table td {
      padding: 2px 0;
    }

    /* Observaciones y Términos Comerciales */
    .obs-section {
      margin-top: 10px;
      margin-bottom: 14px;
      padding: 7px 12px;
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-left: 3.5px solid #0f294a;
      border-radius: 4px;
    }
    .obs-title {
      font-weight: 800;
      color: #0f294a;
      margin-bottom: 5px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      font-size: 8.5px;
    }
    .obs-list {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .obs-item {
      display: flex;
      align-items: flex-start;
      color: #334155;
      line-height: 1.35;
      font-size: 8.5px;
    }
    .obs-bullet {
      color: #d97706;
      font-weight: 900;
      font-size: 11px;
      margin-right: 6px;
      line-height: 1;
    }
    .obs-item-text {
      font-weight: 600;
    }

    /* Firmas */
    .signatures-table {
      width: 100%;
      margin-top: 15px;
      margin-bottom: 15px;
    }
    .signatures-table td {
      width: 50%;
      vertical-align: bottom;
      font-size: 9.5px;
      font-weight: bold;
    }
    .sig-line {
      border-bottom: 1px solid #000;
      display: inline-block;
      width: 170px;
    }

    /* Footer */
    .footer-note {
      font-size: 8.5px;
      font-style: italic;
      color: #4a5568;
      margin-bottom: 8px;
    }
    .doc-type-bottom {
      text-align: center;
      font-size: 11px;
      font-weight: bold;
      margin-top: 6px;
    }
  </style>
</head>
<body>

  <!-- Encabezado con Logo y Datos de Contacto -->
  <table class="header-table">
    <tr>
      <td class="logo-container">
        ${logoSrc ? `<img src="${logoSrc}" style="height: 52px; max-width: 170px; object-fit: contain;" />` : `
        <svg width="46" height="46" viewBox="0 0 100 100">
          <polygon points="10,5 50,5 30,50 60,50 15,95 35,45 10,45" fill="#eab308" stroke="#0f294a" stroke-width="4"/>
          <path d="M45 15 L70 15 C85 15 95 25 95 45 C95 65 85 75 70 75 L45 75 Z" fill="none" stroke="#0f294a" stroke-width="12" stroke-linejoin="round"/>
        </svg>`}
      </td>
      <td class="company-title-container" style="text-align: center;">
        <div class="company-main-title" style="text-align: center;">${company?.name || 'DARSIL AUTOMOTIVE SOLUTIONS'}</div>
        <div class="company-contact" style="text-align: center;">Telefonos: ${(company?.phones || ['934787006']).join(' - ')}</div>
        <div class="company-contact" style="text-align: center;">Email: ${(company?.emails || ['rubenbasil24@gmail.com']).join(' - ')}</div>
      </td>
    </tr>
  </table>

  <!-- Metadatos de la Cotización -->
  <table class="meta-table">
    <tr>
      <td class="meta-label">Nº Cotización</td>
      <td class="meta-val font-bold">${quote.quoteNumber}</td>
      <td class="meta-label">Fecha Alta</td>
      <td class="meta-val">${fechaAlta}</td>
    </tr>
    <tr>
      <td class="meta-label">Referencia</td>
      <td class="meta-val">${referencia}</td>
      <td class="meta-label">Fecha Validez</td>
      <td class="meta-val">${fechaValidez}</td>
    </tr>
    <tr>
      <td class="meta-label">Tipo Pedido</td>
      <td class="meta-val">${quote.orderType || 'Taller de Servicios'}</td>
      <td class="meta-label">Plazo Entrega</td>
      <td class="meta-val">${plazoEntrega}</td>
    </tr>
    <tr>
      <td class="meta-label">Cliente</td>
      <td class="meta-val font-bold">${quote.clientName}</td>
      <td class="meta-label">DNI / RUC</td>
      <td class="meta-val font-bold font-mono" style="color: #0f294a;">${quote.clientDoc || '---'}</td>
    </tr>
    <tr>
      <td class="meta-label">Teléfono</td>
      <td class="meta-val font-mono">${quote.clientPhone || ''}</td>
      <td class="meta-label">Asesor Técnico</td>
      <td class="meta-val font-bold" style="color: #000000;">${advisorClean}</td>
    </tr>
    <tr>
      <td class="meta-label">Dirección</td>
      <td class="meta-val">${quote.clientAddress || 'Lima, Perú'}</td>
      <td class="meta-label">Matrícula</td>
      <td class="meta-val font-bold font-mono" style="color: #000000;">${quote.plate || ''}</td>
    </tr>
    <tr>
      <td class="meta-label">VIN</td>
      <td class="meta-val font-mono">${quote.vin || ''}</td>
      <td class="meta-label">Modelo</td>
      <td class="meta-val">${quote.model || ''}</td>
    </tr>
  </table>

  <!-- Tabla 1: Servicios & Mano de Obra Especializada -->
  ${serviceItems.length > 0 ? `
  <div style="font-size: 10px; font-weight: bold; color: #0f294a; margin-top: 4px; margin-bottom: 3px; text-transform: uppercase; letter-spacing: 0.5px;">
    ⚡ 1. Servicios Técnicos & Mano de Obra Especializada
  </div>
  <table class="items-table">
    <thead>
      <tr>
        <th style="width: 14%;">Referencia</th>
        <th style="width: 50%; text-align: left; padding-left: 8px;">Descripción del Servicio</th>
        <th style="width: 10%;">Uds.</th>
        <th style="width: 13%; text-align: right;">Precio Unitario (S/)</th>
        <th style="width: 13%; text-align: right; padding-right: 8px;">Valor (S/)</th>
      </tr>
    </thead>
    <tbody>
      ${serviceItems.map((item, idx) => `
        <tr>
          <td class="text-left font-mono font-bold">${item.code || `MO${String(idx + 1).padStart(2, '0')}`}</td>
          <td class="text-left">${item.description}</td>
          <td class="text-center bg-yellow">${item.quantity}</td>
          <td class="text-right">${formatCurrency(item.unitPrice)}</td>
          <td class="text-right font-bold">${formatCurrency(item.value)}</td>
        </tr>
      `).join('')}
      ${partItems.length > 0 ? `
        <tr style="background-color: #f8fafc; font-weight: bold;">
          <td colspan="4" class="text-right" style="padding-right: 8px; color: #475569;">SUBTOTAL SERVICIOS (S/):</td>
          <td class="text-right font-mono" style="padding-right: 8px; color: #0f294a;">${formatCurrency(subtotalServices)}</td>
        </tr>
      ` : ''}
    </tbody>
  </table>
  ` : ''}

  <!-- Tabla 2: Repuestos, Accesorios & Insumos de Taller (Tabla paralela debajo de la tabla de servicios) -->
  ${partItems.length > 0 ? `
  <div style="font-size: 10px; font-weight: bold; color: #0f294a; margin-top: 6px; margin-bottom: 3px; text-transform: uppercase; letter-spacing: 0.5px;">
    🔩 2. Repuestos, Accesorios & Insumos de Taller
  </div>
  <table class="items-table">
    <thead>
      <tr>
        <th style="width: 14%;">Código / SKU</th>
        <th style="width: 50%; text-align: left; padding-left: 8px;">Descripción del Repuesto / Accesorio</th>
        <th style="width: 10%;">Cant.</th>
        <th style="width: 13%; text-align: right;">Precio Unitario (S/)</th>
        <th style="width: 13%; text-align: right; padding-right: 8px;">Valor (S/)</th>
      </tr>
    </thead>
    <tbody>
      ${partItems.map((item, idx) => `
        <tr>
          <td class="text-left font-mono font-bold">${item.code || `REP${String(idx + 1).padStart(2, '0')}`}</td>
          <td class="text-left">${item.description}</td>
          <td class="text-center bg-yellow">${item.quantity}</td>
          <td class="text-right">${formatCurrency(item.unitPrice)}</td>
          <td class="text-right font-bold">${formatCurrency(item.value)}</td>
        </tr>
      `).join('')}
      ${serviceItems.length > 0 ? `
        <tr style="background-color: #f8fafc; font-weight: bold;">
          <td colspan="4" class="text-right" style="padding-right: 8px; color: #475569;">SUBTOTAL REPUESTOS & ACCESORIOS (S/):</td>
          <td class="text-right font-mono" style="padding-right: 8px; color: #0f294a;">${formatCurrency(subtotalParts)}</td>
        </tr>
      ` : ''}
    </tbody>
  </table>
  ` : ''}

  <!-- Barra de Total General -->
  <div class="total-bar">
    TOTAL COTIZACIÓN (S/) <span class="total-amount">${formatCurrency(quote.total)}</span>
  </div>

  <!-- Cuentas Bancarias -->
  <table class="bank-table">
    <thead>
      <tr>
        <th style="width: 25%;">BANCO</th>
        <th style="width: 35%;">NºCTA CTE</th>
        <th style="width: 40%;">CTA INTERBANCARIO</th>
      </tr>
    </thead>
    <tbody>
      ${banksHtml}
    </tbody>
  </table>

  <!-- Observaciones y Términos Comerciales -->
  <div class="obs-section">
    <div class="obs-title">Condición de Pago & Observaciones:</div>
    <div class="obs-list">
      ${renderObservationsList(quote.paymentCondition, quote.commercialConditions, quote.notes)}
    </div>
  </div>

  <!-- Firmas -->
  <table class="signatures-table">
    <tr>
      <td>
        ${clientSignatureHtml}
        Firma del Cliente: <span class="sig-line"></span>
        <div style="font-size: 8px; color: #475569; margin-top: 2px;">${quote.clientDoc ? `Doc: ${quote.clientDoc} • ` : ''}${quote.clientName}</div>
      </td>
      <td>
        ${advisorSignatureHtml}
        Firma del Asesor: <span class="sig-line"></span>
        <div style="font-size: 8px; color: #475569; margin-top: 2px;">${advisorClean} - Asesor Técnico Responsable</div>
      </td>
    </tr>
  </table>

  <!-- Pie de página -->
  <div class="doc-type-bottom">Cotización</div>

</body>
</html>
  `;
}

const cachedVehicleDiagrams = {};
function getCarDiagramDataUri(vehicleType = 'SEDAN_AUTO') {
  const normType = String(vehicleType || 'SEDAN_AUTO').toUpperCase();
  let filename = 'car_views_diagram.png';
  let mimeType = 'image/png';

  if (normType.includes('PICKUP') || normType.includes('CAMIONETA')) {
    filename = 'PICKUP.jfif';
    mimeType = 'image/jpeg';
  } else if (normType.includes('TRACTO')) {
    filename = 'TRACTO.jfif';
    mimeType = 'image/jpeg';
  } else if (normType.includes('MIXER')) {
    filename = 'MIXER.jfif';
    mimeType = 'image/jpeg';
  }

  if (cachedVehicleDiagrams[filename]) return cachedVehicleDiagrams[filename];

  try {
    const assetPath = path.join(__dirname, '../../assets', filename);
    if (fs.existsSync(assetPath)) {
      const data = fs.readFileSync(assetPath).toString('base64');
      cachedVehicleDiagrams[filename] = `data:${mimeType};base64,${data}`;
      return cachedVehicleDiagrams[filename];
    }
  } catch (err) {
    console.warn(`Could not read ${filename}:`, err.message);
  }
  return '';
}

/**
 * Genera el HTML del Acta de Recepción / Orden de Trabajo (Checklist y Diagnóstico Oficial)
 * Siguiendo el diseño estructurado de OT.jpeg
 */
function renderWorkOrderHtml(order, company) {
  const logoSrc = getLogoDataUri();
  const carDiagramSrc = getCarDiagramDataUri(order.vehicleType || order.unitType);

  const fechaIngreso = formatDate(order.checkInDate || order.createdAt);
  const horaIngreso = order.checkInDate 
    ? new Date(order.checkInDate).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }) 
    : '';

  const advisorClean = (order.assignedMechanic && !order.assignedMechanic.includes('Basil'))
    ? order.assignedMechanic
    : 'Darios Bacilio';

  const chk = order.entryChecklist || {};

  const damagesHtml = (order.damageMap && order.damageMap.length > 0)
    ? order.damageMap.map((d, i) => `
      <div style="display: inline-block; width: 48%; margin-bottom: 4px; font-size: 8.5px; vertical-align: top;">
        <span style="display:inline-block; width: 15px; height: 15px; line-height: 15px; text-align:center; background:${d.damageType === 'CHOQUE' ? '#dc2626' : d.damageType === 'ABOLLADURA' ? '#d97706' : d.damageType === 'RAYON' ? '#ea580c' : '#7c3aed'}; color:#fff; border-radius:50%; font-weight:bold; font-size:8px;">${i+1}</span>
        <b>${d.label || d.part}</b>: <span style="font-weight:bold; color:${d.damageType === 'CHOQUE' ? '#b91c1c' : '#b45309'};">[${d.damageType}]</span> ${d.notes ? `(${d.notes})` : ''}
      </div>
    `).join('')
    : '<div style="font-size: 8.5px; color: #16a34a; font-weight: bold;">✓ Sin daños o abolladuras exteriores reportadas en carrocería</div>';

  const servicesHtml = (order.diagnosticServices || []).map((s, idx) => `
    <tr>
      <td class="text-center font-mono">${s.code || `SRV${String(idx + 1).padStart(2, '0')}`}</td>
      <td>${s.description}</td>
      <td class="text-center font-bold">${s.quantity || 1}</td>
      <td class="text-right">${formatCurrency(s.unitPrice)}</td>
      <td class="text-right font-bold">${formatCurrency(s.value || ((s.quantity || 1) * (s.unitPrice || 0)))}</td>
    </tr>
  `).join('');

  const partsHtml = (order.diagnosticParts || []).map((p, idx) => `
    <tr>
      <td class="text-center font-mono">${p.sku || `REP${String(idx + 1).padStart(2, '0')}`}</td>
      <td>${p.name}</td>
      <td class="text-center font-bold">${p.quantity || 1}</td>
      <td class="text-right">${formatCurrency(p.unitPrice)}</td>
      <td class="text-right font-bold">${formatCurrency(p.value || ((p.quantity || 1) * (p.unitPrice || 0)))}</td>
    </tr>
  `).join('');

  const totalServices = (order.diagnosticServices || []).reduce((acc, s) => acc + (s.value || ((s.quantity || 1) * (s.unitPrice || 0))), 0);
  const totalParts = (order.diagnosticParts || []).reduce((acc, p) => acc + (p.value || ((p.quantity || 1) * (p.unitPrice || 0))), 0);
  const totalPresupuesto = totalServices + totalParts + (order.travelCost || 0);

  const clientSignatureHtml = order.clientSignature 
    ? `<img src="${order.clientSignature}" style="max-height: 48px; display: block; margin: 0 auto 2px;" />` 
    : '<div style="height: 48px;"></div>';
  
  const advisorSignatureHtml = order.advisorSignature 
    ? `<img src="${order.advisorSignature}" style="max-height: 48px; display: block; margin: 0 auto 2px;" />` 
    : '<div style="height: 48px;"></div>';

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 9.5px;
      color: #0f172a;
      background: #fff;
      padding: 14px 22px;
      line-height: 1.25;
    }
    .header-table {
      width: 100%;
      margin-bottom: 6px;
      border-bottom: 2px solid #0f294a;
      padding-bottom: 6px;
    }
    .main-title-bar {
      background-color: #0f294a;
      color: #ffffff;
      text-align: center;
      font-size: 11px;
      font-weight: 900;
      padding: 4px;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
      border-radius: 2px;
    }
    .section-title {
      background-color: #f1f5f9;
      color: #1e293b;
      font-size: 9px;
      font-weight: 900;
      padding: 3px 6px;
      border-left: 3px solid #eab308;
      margin-top: 6px;
      margin-bottom: 4px;
      text-transform: uppercase;
    }
    .grid-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 6px;
    }
    .grid-table td {
      border: 1px solid #cbd5e1;
      padding: 3px 5px;
      font-size: 9px;
    }
    .lbl {
      background-color: #f8fafc;
      font-weight: bold;
      color: #334155;
      width: 15%;
    }
    .val {
      width: 35%;
      color: #0f172a;
    }
    .checklist-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 6px;
    }
    .checklist-table td {
      border: 1px solid #e2e8f0;
      padding: 2.5px 5px;
      font-size: 8.5px;
      width: 50%;
    }
    .chk-box {
      display: inline-block;
      width: 10px;
      height: 10px;
      border: 1px solid #475569;
      text-align: center;
      line-height: 9px;
      font-size: 8px;
      font-weight: bold;
      margin-right: 4px;
    }
    .chk-active {
      background-color: #0f294a;
      color: #fff;
      border-color: #0f294a;
    }
    .fuel-gauge-box {
      display: flex;
      align-items: center;
      justify-content: space-around;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      padding: 4px;
      margin-bottom: 6px;
      border-radius: 4px;
    }
    .fuel-pill {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 3px;
      font-weight: bold;
      font-size: 8.5px;
      border: 1px solid #cbd5e1;
      background: #fff;
    }
    .fuel-selected {
      background-color: #eab308 !important;
      color: #000 !important;
      border-color: #ca8a04 !important;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 6px;
    }
    .items-table th {
      background-color: #1e293b;
      color: #ffffff;
      border: 1px solid #1e293b;
      padding: 3px 5px;
      font-size: 8.5px;
      font-weight: bold;
    }
    .items-table td {
      border: 1px solid #cbd5e1;
      padding: 2.5px 5px;
      font-size: 8.5px;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .font-mono { font-family: monospace; }
    .font-bold { font-weight: bold; }
    .sig-table {
      width: 100%;
      margin-top: 10px;
      border-collapse: collapse;
    }
    .sig-table td {
      width: 50%;
      text-align: center;
      vertical-align: bottom;
      padding: 0 15px;
    }
    .sig-line {
      border-top: 1px solid #000;
      margin-top: 2px;
      padding-top: 2px;
      font-size: 8.5px;
      font-weight: bold;
    }
    /* Observaciones y Términos Comerciales en OT */
    .obs-section {
      margin-top: 6px;
      margin-bottom: 8px;
      padding: 6px 10px;
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-left: 3.5px solid #0f294a;
      border-radius: 4px;
    }
    .obs-title {
      font-weight: 800;
      color: #0f294a;
      margin-bottom: 4px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      font-size: 8px;
    }
    .obs-list {
      display: flex;
      flex-direction: column;
      gap: 2.5px;
    }
    .obs-item {
      display: flex;
      align-items: flex-start;
      color: #334155;
      line-height: 1.3;
      font-size: 8px;
    }
    .obs-bullet {
      color: #d97706;
      font-weight: 900;
      font-size: 10px;
      margin-right: 5px;
      line-height: 1;
    }
    .obs-item-text {
      font-weight: 600;
    }
  </style>
</head>
<body>

  <!-- Encabezado con Logo y Datos del Taller -->
  <table class="header-table">
    <tr>
      <td style="width: 32%; vertical-align: middle; text-align: left;">
        ${logoSrc ? `<img src="${logoSrc}" style="height: 50px; max-width: 170px; object-fit: contain;" />` : `
        <svg width="44" height="44" viewBox="0 0 100 100">
          <polygon points="10,5 50,5 30,50 60,50 15,95 35,45 10,45" fill="#eab308" stroke="#0f294a" stroke-width="4"/>
          <path d="M45 15 L70 15 C85 15 95 25 95 45 C95 65 85 75 70 75 L45 75 Z" fill="none" stroke="#0f294a" stroke-width="12" stroke-linejoin="round"/>
        </svg>`}
      </td>
      <td style="width: 68%; text-align: center; vertical-align: middle; font-size: 8.5px;">
        <div style="font-weight: 900; color: #0f294a; font-size: 11px; text-align: center; margin-bottom: 2px;">${company?.name || 'DARSIL AUTOMOTIVE SOLUTIONS'}</div>
        <div style="text-align: center;">RUC: ${company?.ruc || '20608779671'} | Telf: ${(company?.phones || ['934787006']).join(' - ')}</div>
        <div style="text-align: center;">Email: ${(company?.emails || ['rubenbasil24@gmail.com']).join(' - ')}</div>
        <div style="text-align: center;">Sede: ${company?.workshopAddress || 'Villa El Salvador, Lima, Lima'}</div>
      </td>
    </tr>
  </table>

  <!-- Título Oficial -->
  <div class="main-title-bar">
    CHECKLIST DE INSPECCIÓN VEHICULAR Y ORDEN DE TRABAJO: ${order.orderNumber}
  </div>

  <!-- Sección 1: Datos de la Unidad y Conductor -->
  <div class="section-title">1. Datos del Vehículo y Cliente / Conductor</div>
  <table class="grid-table">
    <tr>
      <td class="lbl">Vehículo / Modelo:</td>
      <td class="val font-bold">${order.model || 'N/A'}</td>
      <td class="lbl">Cliente / Empresa:</td>
      <td class="val font-bold">${order.clientName}</td>
    </tr>
    <tr>
      <td class="lbl">Placa / Matrícula:</td>
      <td class="val font-mono font-bold" style="color: #000000; font-size: 10px;">${order.plate}</td>
      <td class="lbl">RUC / DNI:</td>
      <td class="val font-mono">${order.clientDoc || 'N/A'}</td>
    </tr>
    <tr>
      <td class="lbl">Color / Año:</td>
      <td class="val">${order.color || 'Plata'} / ${order.year || '2023'}</td>
      <td class="lbl">Conductor / Chofer:</td>
      <td class="val">${order.driverName || order.clientName}</td>
    </tr>
    <tr>
      <td class="lbl">VIN / Chasis:</td>
      <td class="val font-mono">${order.vin || 'N/A'}</td>
      <td class="lbl">Teléfono Contacto:</td>
      <td class="val font-mono">${order.driverPhone || order.clientPhone || 'N/A'}</td>
    </tr>
    <tr>
      <td class="lbl">Tipo de Unidad:</td>
      <td class="val">${order.vehicleType || order.unitType}</td>
      <td class="lbl">Dirección / Sede:</td>
      <td class="val">${order.destinationLocation?.address || order.clientAddress || 'Lima, Perú'}</td>
    </tr>
  </table>

  <!-- Sección 2: Telemetría, Odómetro y Combustible -->
  <div class="section-title">2. REGISTRO DE INGRESO</div>
  <table class="grid-table" style="margin-bottom: 4px;">
    <tr>
      <td class="lbl">Fecha y Hora Ingreso:</td>
      <td class="val font-bold">${fechaIngreso} ${horaIngreso}</td>
      <td class="lbl">Asesor Técnico:</td>
      <td class="val font-bold" style="color: #000000;">${advisorClean}</td>
    </tr>
    <tr>
      <td class="lbl">Kilometraje (Odómetro):</td>
      <td class="val font-mono font-bold">${order.mileage || 'No registrado'}</td>
      <td class="lbl">Horómetro Maquinaria:</td>
      <td class="val font-mono font-bold">${order.hourmeter || 'No aplica'}</td>
    </tr>
  </table>

  <!-- Indicador Nivel Combustible -->
  <div style="background: #f8fafc; border: 1px solid #cbd5e1; padding: 3px 6px; margin-bottom: 6px; display: flex; align-items: center; justify-content: space-between; font-size: 8.5px;">
    <b>NIVEL DE COMBUSTIBLE AL INGRESO:</b>
    <div style="display: flex; gap: 8px;">
      <span class="fuel-pill ${order.fuelLevel === 'RESERVA' ? 'fuel-selected' : ''}">RESERVA</span>
      <span class="fuel-pill ${order.fuelLevel === '1/4' ? 'fuel-selected' : ''}">1/4 TANQUE</span>
      <span class="fuel-pill ${order.fuelLevel === '1/2' ? 'fuel-selected' : ''}">1/2 TANQUE</span>
      <span class="fuel-pill ${order.fuelLevel === '3/4' ? 'fuel-selected' : ''}">3/4 TANQUE</span>
      <span class="fuel-pill ${order.fuelLevel === 'LLENO' ? 'fuel-selected' : ''}">LLENO</span>
    </div>
  </div>

  <!-- Sección 3: Checklist Físico & Eléctrico y Diagrama de Daños -->
  <div class="section-title">3. Checklist de Componentes & Diagrama de Daños en Carrocería</div>
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 6px;">
    <tr>
      <!-- Checklist Columna Izquierda -->
      <td style="width: 52%; vertical-align: top; padding-right: 6px;">
        <table class="checklist-table">
          <tr>
            <td><span class="chk-box ${chk.bancoBaterias === 'BUENO' ? 'chk-active' : ''}">X</span> Baterías (${chk.bancoBaterias || 'BUENO'})</td>
            <td><span class="chk-box ${chk.arrancador === 'OPERATIVO' ? 'chk-active' : ''}">X</span> Arrancador (${chk.arrancador || 'OPERATIVO'})</td>
          </tr>
          <tr>
            <td><span class="chk-box ${chk.alternador === 'OPERATIVO' ? 'chk-active' : ''}">X</span> Alternador (${chk.alternador || 'OPERATIVO'})</td>
            <td><span class="chk-box ${chk.lucesYFaros === 'OPERATIVO' ? 'chk-active' : ''}">X</span> Luces & Faros (${chk.lucesYFaros || 'OPERATIVO'})</td>
          </tr>
          <tr>
            <td><span class="chk-box ${chk.ramalElectrico === 'INTEGRO' ? 'chk-active' : ''}">X</span> Ramal Eléctrico (${chk.ramalElectrico || 'INTEGRO'})</td>
            <td><span class="chk-box ${chk.computadoraEcu === 'SIN_ERRORES' ? 'chk-active' : ''}">X</span> ECU (${chk.computadoraEcu || 'SIN_ERRORES'})</td>
          </tr>
          <tr>
            <td><span class="chk-box ${chk.bocina === 'OPERATIVO' ? 'chk-active' : ''}">X</span> Bocina / Pito</td>
            <td><span class="chk-box ${chk.plumillas === 'OPERATIVO' ? 'chk-active' : ''}">X</span> Plumillas Limpiaparabrisas</td>
          </tr>
          <tr>
            <td><span class="chk-box ${chk.vidrios === 'OPERATIVO' ? 'chk-active' : ''}">X</span> Vidrios & Lunas</td>
            <td><span class="chk-box ${chk.llantaRepuesto ? 'chk-active' : ''}">X</span> Llanta de Repuesto</td>
          </tr>
          <tr>
            <td><span class="chk-box ${chk.extintor ? 'chk-active' : ''}">X</span> Extintor de Seguridad</td>
            <td><span class="chk-box ${chk.herramientas ? 'chk-active' : ''}">X</span> Kit de Herramientas / Gata</td>
          </tr>
        </table>

        <!-- Falla Reportada -->
        <div style="background: #fffbeb; border: 1px solid #fef08a; padding: 4px; border-radius: 3px; font-size: 8.5px; margin-top: 4px;">
          <b>Falla Reportada por Cliente:</b> ${order.reportedFault}
        </div>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 4px; border-radius: 3px; font-size: 8.5px; margin-top: 3px;">
          <b>Diagnóstico Técnico:</b> ${order.visualObservations}
        </div>
      </td>

      <!-- Diagrama de Carrocería 5 Vistas -->
      <td style="width: 48%; vertical-align: top; border: 1px solid #cbd5e1; padding: 4px; background: #fafafa; text-align: center;">
        <div style="font-size: 8px; font-weight: bold; color: #475569; margin-bottom: 2px;">VISTA PERICIAL DE CARROCERÍA (5 ÁNGULOS)</div>
        ${carDiagramSrc ? `<img src="${carDiagramSrc}" style="max-height: 110px; max-width: 95%; object-fit: contain; margin: 0 auto; display: block;" />` : ''}
        <div style="margin-top: 4px; text-align: left; padding: 2px 4px; background: #fff; border: 1px solid #e2e8f0; border-radius: 3px;">
          <div style="font-size: 7.5px; font-weight: bold; color: #334155; margin-bottom: 2px;">REGISTRO DE AVERÍAS PREEXISTENTES:</div>
          ${damagesHtml}
        </div>
      </td>
    </tr>
  </table>

  <!-- Sección 4: Diagnóstico Técnico y Repuestos Detectados -->
  ${((order.diagnosticServices && order.diagnosticServices.length > 0) || (order.diagnosticParts && order.diagnosticParts.length > 0)) ? `
  <div class="section-title">4. Diagnóstico Técnico y Repuestos Detectados</div>
  <table class="grid-table" style="margin-bottom: 4px;">
    ${(order.diagnosticServices || []).map(s => `
      <tr>
        <td class="lbl" style="width: 20%;">Servicio Técnico:</td>
        <td class="val font-bold" style="width: 60%;">${s.description}</td>
        <td class="val text-right font-mono" style="width: 20%;">S/ ${Number(s.unitPrice || 0).toFixed(2)}</td>
      </tr>
    `).join('')}
    ${(order.diagnosticParts || []).map(p => `
      <tr>
        <td class="lbl" style="width: 20%;">Repuesto Requerido:</td>
        <td class="val" style="width: 60%;">${p.name} (Cant: ${p.quantity || 1})</td>
        <td class="val text-right font-mono" style="width: 20%;">S/ ${Number(p.unitPrice || 0).toFixed(2)}</td>
      </tr>
    `).join('')}
  </table>
  ` : ''}

  <!-- Condiciones de Atención & Observaciones -->
  <div class="obs-section">
    <div class="obs-title">Condiciones de Atención & Observaciones:</div>
    <div class="obs-list">
      ${renderObservationsList(order.paymentCondition)}
    </div>
  </div>

  <!-- Sección 5: Firmas de Conformidad -->
  <div class="section-title">5. Acta de Conformidad y Entrega Técnica</div>
  <table class="sig-table">
    <tr>
      <td>
        ${clientSignatureHtml}
        <div class="sig-line">
          FIRMA DEL CLIENTE / CONDUCTOR<br>
          <span style="font-size: 7.5px; font-weight: normal; color: #64748b;">DNI / RUC: ${order.clientDoc || '____________________'}</span>
        </div>
      </td>
      <td>
        ${advisorSignatureHtml}
        <div class="sig-line">
          ASESOR / MECÁNICO RESPONSABLE DARSIL<br>
          <span style="font-size: 7.5px; font-weight: normal; color: #64748b;">${advisorClean} - Especialista Técnico</span>
        </div>
      </td>
    </tr>
  </table>

  <div style="margin-top: 8px; text-align: center; font-size: 7.5px; color: #94a3b8;">
    Documento oficial generado por DARSIL ERP AUTOMOTRIZ • Villa El Salvador, Lima, Lima • Tel: 934787006
  </div>

</body>
</html>
  `;
}

/**
 * Genera el documento PDF de Cotización usando Chrome Puppeteer
 */
async function generateQuotePdf(quote, company) {
  const uploadsDir = path.join(__dirname, '../../uploads/quotes');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Siempre se utiliza la plantilla oficial detallada de taller (Plantilla 1 eliminada)
  const html = renderTallerHtml(quote, company);
  const outputPath = path.join(uploadsDir, `${quote.quoteNumber}.pdf`);

  let browser;
  try {
    browser = await launchPuppeteerCore();

    const page = await browser.newPage();
    await page.setContent(html, { 
      waitUntil: 'domcontentloaded',
      timeout: 15000 
    });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '6mm',
        right: '8mm',
        bottom: '6mm',
        left: '8mm'
      }
    });

    fs.writeFileSync(outputPath, pdfBuffer);
    console.log(`PDF de Cotización generado exitosamente en: ${outputPath}`);

    return {
      filePath: outputPath,
      fileName: `${quote.quoteNumber}.pdf`,
      buffer: pdfBuffer,
      urlPath: `/uploads/quotes/${quote.quoteNumber}.pdf`
    };
  } catch (error) {
    console.error('Error al generar PDF de Cotización:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Genera el documento PDF de la Orden de Trabajo (Checklist y Diagnóstico Oficial)
 */
async function generateWorkOrderPdf(order, company) {
  const uploadsDir = path.join(__dirname, '../../uploads/work-orders');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const html = renderWorkOrderHtml(order, company);
  const outputPath = path.join(uploadsDir, `${order.orderNumber}.pdf`);

  let browser;
  try {
    browser = await launchPuppeteerCore();

    const page = await browser.newPage();
    await page.setContent(html, { 
      waitUntil: 'domcontentloaded',
      timeout: 15000 
    });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '5mm',
        right: '6mm',
        bottom: '5mm',
        left: '6mm'
      }
    });

    fs.writeFileSync(outputPath, pdfBuffer);
    console.log(`PDF de Orden de Trabajo generado exitosamente en: ${outputPath}`);

    return {
      filePath: outputPath,
      fileName: `${order.orderNumber}.pdf`,
      buffer: pdfBuffer,
      urlPath: `/uploads/work-orders/${order.orderNumber}.pdf`
    };
  } catch (error) {
    console.error('Error al generar PDF de Orden de Trabajo:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Renderiza el HTML para Factura o Boleta Electrónica SUNAT UBL 2.1
 */
function renderInvoiceHtml(invoice, company) {
  const logoSrc = getLogoDataUri();
  const docTitle = invoice.invoiceType === '01' ? 'FACTURA ELECTRÓNICA' : (invoice.invoiceType === '03' ? 'BOLETA DE VENTA ELECTRÓNICA' : 'NOTA DE CRÉDITO');
  const rucEmisor = company?.ruc || '20608765432';
  const razonEmisor = company?.companyName || 'DARSIL AUTOMOTIVE SOLUTIONS S.A.C.';
  const direccionEmisor = company?.address || 'Villa El Salvador, Lima, Lima';
  const telefonoEmisor = company?.phone || '934787006';

  const issueDateStr = formatDate(invoice.issueDate);
  const qrImageSrc = invoice.sunatResponse?.qrCode || '';
  const hashVal = invoice.sunatResponse?.hash || '';

  const rowsHtml = (invoice.items || []).map((it, idx) => `
    <tr style="border-bottom: 1px solid #e2e8f0; font-size: 9px;">
      <td style="padding: 6px; text-align: center; color: #64748b;">${idx + 1}</td>
      <td style="padding: 6px; text-align: center; font-weight: bold;">${it.quantity}</td>
      <td style="padding: 6px; text-align: center; color: #475569;">${it.unit || 'NIU'}</td>
      <td style="padding: 6px; font-family: monospace; font-weight: bold; color: #0f294a;">${it.code || '-'}</td>
      <td style="padding: 6px; text-align: left; font-weight: 600; color: #1e293b;">${it.description}</td>
      <td style="padding: 6px; text-align: right; font-family: monospace;">${formatCurrency(it.unitValue)}</td>
      <td style="padding: 6px; text-align: right; font-family: monospace;">${formatCurrency(it.unitPrice)}</td>
      <td style="padding: 6px; text-align: right; font-family: monospace; font-weight: bold; color: #0f294a;">${formatCurrency(it.total)}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 10px;
      color: #1e293b;
      background: #fff;
      padding: 15px 20px;
      line-height: 1.3;
    }
    table { width: 100%; border-collapse: collapse; }
    .header-box { width: 100%; margin-bottom: 12px; }
    .sunat-box {
      width: 260px;
      border: 2px solid #0f294a;
      border-radius: 8px;
      padding: 10px;
      text-align: center;
      background: #f8fafc;
    }
    .client-card {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 8px 12px;
      margin-bottom: 12px;
      background: #fcfcfc;
    }
    .items-table th {
      background: #0f294a;
      color: #ffffff;
      padding: 6px;
      font-size: 9px;
      text-align: center;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <!-- Encabezado Emisor vs Caja Tributaria SUNAT -->
  <table class="header-box">
    <tr>
      <td style="width: 58%; vertical-align: top;">
        <div style="display: flex; align-items: center; gap: 12px;">
          ${logoSrc ? `<img src="${logoSrc}" style="max-height: 55px; max-width: 140px; object-fit: contain;" />` : ''}
          <div>
            <div style="font-size: 14px; font-weight: 900; color: #0f294a; letter-spacing: 0.5px;">${razonEmisor}</div>
            <div style="font-size: 9px; font-weight: bold; color: #475569; margin-top: 2px;">ESPECIALISTAS EN ELECTRÓNICA PESADA & MECÁNICA INTEGRAL</div>
            <div style="font-size: 9px; color: #64748b; margin-top: 1px;">Dirección: ${direccionEmisor}</div>
            <div style="font-size: 9px; color: #64748b;">Central Telefónica: +51 ${telefonoEmisor} • contacto@darsil.com</div>
          </div>
        </div>
      </td>
      <td style="width: 42%; vertical-align: top; text-align: right;">
        <div class="sunat-box" style="display: inline-block;">
          <div style="font-size: 13px; font-weight: bold; color: #334155;">R.U.C. ${rucEmisor}</div>
          <div style="font-size: 12px; font-weight: 900; color: #0f294a; margin: 4px 0; letter-spacing: 0.5px;">${docTitle}</div>
          <div style="font-size: 14px; font-family: monospace; font-weight: 900; color: #e5a93c;">${invoice.fullNumber}</div>
        </div>
      </td>
    </tr>
  </table>

  <!-- Datos del Cliente y Operación -->
  <div class="client-card">
    <table style="width: 100%; font-size: 9.5px;">
      <tr>
        <td style="width: 18%; font-weight: bold; color: #475569;">Señor(es):</td>
        <td style="width: 48%; font-weight: 700; color: #0f294a;">${invoice.clientName}</td>
        <td style="width: 16%; font-weight: bold; color: #475569;">Fecha Emisión:</td>
        <td style="width: 18%; font-family: monospace; font-weight: bold;">${issueDateStr}</td>
      </tr>
      <tr>
        <td style="font-weight: bold; color: #475569;">${invoice.clientDocType === '6' ? 'R.U.C.:' : 'D.N.I.:'}</td>
        <td style="font-family: monospace; font-weight: bold;">${invoice.clientDoc}</td>
        <td style="font-weight: bold; color: #475569;">Moneda:</td>
        <td style="font-weight: bold;">SOLES (PEN)</td>
      </tr>
      <tr>
        <td style="font-weight: bold; color: #475569;">Dirección:</td>
        <td style="color: #334155;">${invoice.clientAddress || 'Villa El Salvador, Lima, Lima'}</td>
        <td style="font-weight: bold; color: #475569;">Forma de Pago:</td>
        <td style="font-weight: 600;">${invoice.paymentCondition || 'Contado'}</td>
      </tr>
      ${invoice.plate ? `
      <tr>
        <td style="font-weight: bold; color: #475569;">Placa / Vehículo:</td>
        <td style="color: #0f294a; font-weight: bold;">${invoice.plate} ${invoice.vehicleModel ? '• ' + invoice.vehicleModel : ''}</td>
        <td style="font-weight: bold; color: #475569;">Doc. Ref:</td>
        <td style="font-family: monospace; font-weight: bold; color: #0284c7;">${invoice.quoteNumber || invoice.workOrderNumber || 'TALLER DIRECTO'}</td>
      </tr>
      ` : ''}
    </table>
  </div>

  <!-- Tabla de Partidas -->
  <table class="items-table" style="margin-bottom: 12px; border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden;">
    <thead>
      <tr>
        <th style="width: 5%;">Ítem</th>
        <th style="width: 7%;">Cant.</th>
        <th style="width: 8%;">Unidad</th>
        <th style="width: 12%;">Código</th>
        <th style="width: 38%; text-align: left;">Descripción de Servicios / Repuestos</th>
        <th style="width: 10%; text-align: right;">Val. Unit.</th>
        <th style="width: 10%; text-align: right;">P. Venta</th>
        <th style="width: 10%; text-align: right;">Importe</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>

  <!-- Pie de Comprobante: Total Letras, QR y Totales Tributarios -->
  <table style="width: 100%; margin-top: 4px;">
    <tr>
      <td style="width: 60%; vertical-align: top; padding-right: 15px;">
        <div style="font-weight: bold; font-size: 9.5px; color: #0f294a; margin-bottom: 6px;">
          ${invoice.totals?.totalWords || ''}
        </div>
        
        <table style="width: 100%; margin-top: 4px;">
          <tr>
            <td style="width: 85px; vertical-align: middle;">
              ${qrImageSrc ? `<img src="${qrImageSrc}" style="width: 80px; height: 80px; border: 1px solid #cbd5e1; padding: 2px; border-radius: 4px;" />` : ''}
            </td>
            <td style="vertical-align: middle; padding-left: 8px; font-size: 8px; color: #64748b; line-height: 1.25;">
              <div><b>Código Hash:</b> <span style="font-family: monospace;">${hashVal || 'c3VuYXQtdWJsLTIuMS1kYXJzaWw='}</span></div>
              <div style="margin-top: 3px;">Representación impresa de la <b>${docTitle}</b> generada desde el sistema de facturación electrónica UBL 2.1 estándar SUNAT.</div>
              <div style="margin-top: 3px; font-weight: bold; color: #0f294a;">Ambiente: ${invoice.environment === 'BETA' ? 'BETA - HOMOLOGACIÓN SUNAT (PRUEBAS)' : 'PRODUCCIÓN OFICIAL SUNAT'}</div>
            </td>
          </tr>
        </table>
      </td>

      <td style="width: 40%; vertical-align: top;">
        <table style="width: 100%; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 9.5px; background: #f8fafc;">
          <tr>
            <td style="padding: 5px 8px; color: #475569;">Op. Gravadas:</td>
            <td style="padding: 5px 8px; text-align: right; font-family: monospace; font-weight: bold;">S/ ${formatCurrency(invoice.totals?.opGravadas)}</td>
          </tr>
          <tr>
            <td style="padding: 5px 8px; color: #475569;">I.G.V. (18%):</td>
            <td style="padding: 5px 8px; text-align: right; font-family: monospace; font-weight: bold;">S/ ${formatCurrency(invoice.totals?.igv)}</td>
          </tr>
          <tr style="background: #0f294a; color: #ffffff;">
            <td style="padding: 6px 8px; font-weight: 900; font-size: 11px;">TOTAL A PAGAR:</td>
            <td style="padding: 6px 8px; text-align: right; font-family: monospace; font-weight: 900; font-size: 12px; color: #fbbf24;">S/ ${formatCurrency(invoice.totals?.total)}</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

  <!-- Cuentas Bancarias del Taller -->
  <div style="margin-top: 14px; border-top: 1px dashed #cbd5e1; padding-top: 6px; font-size: 8px; color: #64748b;">
    <b>Cuentas Corrientes DARSIL S.A.C.:</b> SCOTIABANK Cta Cte Soles: 0747668929 (CCI: 00925120074766892907) • INTERBANK Cta Soles: 8983510612681 (CCI: 00389801351061268140)
  </div>
</body>
</html>
  `;
}

/**
 * Genera el archivo PDF de la Factura o Boleta Electrónica usando Puppeteer
 */
async function generateInvoicePdf(invoice, company) {
  let browser = null;
  try {
    const uploadDir = path.join(__dirname, '../../uploads/invoices');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const outputPath = path.join(uploadDir, `${invoice.fullNumber}.pdf`);
    const html = renderInvoiceHtml(invoice, company);

    const executablePath = fs.existsSync(CHROME_PATH)
      ? CHROME_PATH
      : (process.platform === 'win32'
          ? 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
          : '/usr/bin/google-chrome');

    browser = await launchPuppeteerCore();

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 15000 });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '6mm', right: '8mm', bottom: '6mm', left: '8mm' }
    });

    fs.writeFileSync(outputPath, pdfBuffer);

    return {
      filePath: outputPath,
      fileName: `${invoice.fullNumber}.pdf`,
      buffer: pdfBuffer,
      urlPath: `/uploads/invoices/${invoice.fullNumber}.pdf`
    };
  } catch (error) {
    console.error('Error al generar PDF de Factura Electrónica:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}


/**
 * Render HTML del Contrato de Servicios Técnicos y Convenio de Pago
 */
function renderContractHtml(schedule, company) {
  const logoSrc = getLogoDataUri();
  const fechaEmision = formatDate(schedule.createdAt || new Date());
  const advisorClean = schedule.advisorName || 'Darios Bacilio';

  const banksHtml = (company?.bankAccounts || []).map(b => `
    <tr>
      <td style="font-weight: bold; padding: 4px 6px; border: 1px solid #cbd5e1;">${b.bank}</td>
      <td style="font-family: monospace; font-weight: bold; padding: 4px 6px; border: 1px solid #cbd5e1;">${b.accountNumber}</td>
      <td style="font-family: monospace; font-weight: bold; padding: 4px 6px; border: 1px solid #cbd5e1;">${b.interbankAccount}</td>
    </tr>
  `).join('');

  const installmentsHtml = (schedule.installments || []).map((inst, idx) => `
    <tr style="background: ${idx % 2 === 0 ? '#f8fafc' : '#ffffff'};">
      <td style="padding: 5px 8px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold;">Cuota N° ${inst.installmentNumber}</td>
      <td style="padding: 5px 8px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold; color: #0284c7;">${formatDate(inst.dueDate)}</td>
      <td style="padding: 5px 8px; border: 1px solid #cbd5e1; text-align: right; font-weight: bold; font-family: monospace;">S/ ${formatCurrency(inst.amount)}</td>
      <td style="padding: 5px 8px; border: 1px solid #cbd5e1; text-align: center; font-size: 9px;">
        <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-weight: bold; background: ${inst.isPaid ? '#dcfce7; color: #166534;' : '#fef3c7; color: #92400e;'}">
          ${inst.isPaid ? 'CANCELADO' : 'PENDIENTE'}
        </span>
      </td>
    </tr>
  `).join('');

  const defaultClauses = [
    {
      title: 'PRIMERA: OBJETO DEL CONTRATO Y ALCANCE TÉCNICO',
      content: `El presente contrato regula los términos y condiciones para la prestación de servicios especializados automotrices y mecatrónicos ejecutados por DARSIL AUTOMOTIVE SOLUTIONS S.A.C. a favor de ${schedule.clientName} (R.U.C./D.N.I. ${schedule.clientDoc || 'S/N'}), sobre la unidad vehicular con placa ${schedule.plate || 'POR ASIGNAR'} (${schedule.model || 'Unidad de Flota'}), según lo detallado en la Cotización Oficial N° ${schedule.quoteNumber}.`
    },
    {
      title: 'SEGUNDA: CONTRAPRESTACIÓN Y CRONOGRAMA DE PAGOS ACORDADO',
      content: `El monto total por los servicios técnicos y repuestos asciende a la suma de S/ ${formatCurrency(schedule.totalAmount)} (${schedule.currency === 'PEN' ? 'Soles' : 'Dólares'}). Ambas partes pactan libre y expresamente que dicho importe será cancelado mediante la modalidad de ${schedule.paymentType === 'PAGO_UNICO' ? 'PAGO ÚNICO en la fecha establecida' : 'PAGO EN PARTES / FRACCIONADO conforme a la tabla de cuotas y fechas de vencimiento cronológicas'} indicada en el presente documento.`
    },
    {
      title: 'TERCERA: OBLIGACIÓN DE ABONO Y CUENTAS AUTORIZADAS',
      content: 'Los pagos deberán realizarse única y exclusivamente en las cuentas bancarias institucionales oficiales de DARSIL AUTOMOTIVE SOLUTIONS S.A.C. indicadas al pie del presente contrato. Todo pago se considerará formalmente acreditado una vez remitido el comprobante o voucher de transferencia al asesor asignado y validado en tesorería.'
    },
    {
      title: 'CUARTA: ENTREGA DE LA UNIDAD Y DERECHO DE RETENCIÓN',
      content: 'Conforme a las disposiciones legales del Código de Comercio y normas aplicables, la empresa se reserva el derecho de retención de la unidad vehicular en caso de incumplimiento de las cuotas pactadas para el retiro. Si se acordó entrega previa al pago total, el cliente asume formal compromiso de honorar las cuotas pendientes en las fechas estipuladas.'
    },
    {
      title: 'QUINTA: MORA, PENALIDADES E INTERESES',
      content: 'El incumplimiento o retraso injustificado superior a 3 (tres) días hábiles en cualquiera de las cuotas pactadas generará un interés moratorio legal y facultará a DARSIL a suspender beneficios de crédito, garantías comerciales o emitir aviso formal ante centrales de riesgo.'
    },
    {
      title: 'SEXTA: GARANTÍA TÉCNICA DARSIL',
      content: 'DARSIL otorga garantía técnica sobre la mano de obra y repuestos genuinos instalados, supeditada al estricto cumplimiento del cronograma de pagos pactado. Al cancelar el 100% de la obligación, DARSIL emitirá la constancia oficial de Paz y Salvo y la Factura Electrónica SUNAT UBL 2.1.'
    }
  ];

  const activeClauses = (schedule.clauses && schedule.clauses.length > 0) ? schedule.clauses : defaultClauses;

  const clausesHtml = activeClauses.map((c, i) => `
    <div style="margin-bottom: 7px; page-break-inside: avoid;">
      <div style="font-weight: bold; color: #0f172a; font-size: 9.5px; margin-bottom: 2px;">${c.title}</div>
      <p style="font-size: 8.5px; color: #334155; text-align: justify; line-height: 1.35;">${c.content}</p>
    </div>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 9.5px;
      color: #0f172a;
      background: #fff;
      padding: 18px 24px;
      line-height: 1.3;
    }
    .header-table { width: 100%; margin-bottom: 8px; }
    .logo-container { width: 30%; vertical-align: middle; }
    .company-info { width: 40%; text-align: center; vertical-align: middle; font-size: 8.5px; color: #334155; line-height: 1.25; }
    .doc-box {
      width: 30%;
      border: 2px solid #0284c7;
      border-radius: 6px;
      text-align: center;
      padding: 8px 4px;
      background: #f0f9ff;
    }
    .client-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 10px;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
    }
    .client-table td {
      padding: 4px 6px;
      font-size: 9px;
      border: 1px solid #e2e8f0;
    }
    .section-title {
      background: #0f172a;
      color: #ffffff;
      padding: 4px 8px;
      font-size: 9.5px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 8px;
      margin-bottom: 4px;
      border-radius: 3px;
    }
    .signature-table {
      width: 100%;
      margin-top: 15px;
      page-break-inside: avoid;
    }
    .signature-box {
      width: 45%;
      border-top: 1px solid #64748b;
      text-align: center;
      padding-top: 5px;
      font-size: 8.5px;
    }
  </style>
</head>
<body>

  <!-- CABECERA PRINCIPAL IDÉNTICA A COTIZACIÓN -->
  <table class="header-table">
    <tr>
      <td class="logo-container">
        ${logoSrc ? `<img src="${logoSrc}" style="max-width: 160px; height: auto;" />` : `<strong style="font-size: 16px; color: #0284c7;">DARSIL</strong>`}
      </td>
      <td class="company-info">
        <strong style="font-size: 11px; color: #0f172a;">DARSIL AUTOMOTIVE SOLUTIONS S.A.C.</strong><br/>
        <strong>R.U.C. 20608765432</strong><br/>
        Tecnología • Diagnóstico • Mecatrónica Pesada<br/>
        Villa El Salvador, Lima - Perú • Central: (01) 934 787 006<br/>
        <span style="color: #0284c7;">operaciones@darsil.pe</span>
      </td>
      <td class="doc-box">
        <div style="font-size: 8.5px; font-weight: bold; color: #0369a1; text-transform: uppercase;">CONTRATO & CONVENIO DE PAGO</div>
        <div style="font-size: 11px; font-weight: 900; color: #0f172a; margin: 2px 0;">${schedule.contractNumber}</div>
        <div style="font-size: 8px; color: #475569;">Cotización: <strong>${schedule.quoteNumber}</strong></div>
        <div style="font-size: 8px; color: #475569;">Fecha: <strong>${fechaEmision}</strong></div>
      </td>
    </tr>
  </table>

  <!-- CUADRO DE CLIENTE Y VEHÍCULO -->
  <table class="client-table">
    <tr>
      <td style="width: 15%; background: #f8fafc; font-weight: bold;">SEÑOR(ES):</td>
      <td style="width: 45%; font-weight: bold; color: #0f172a;">${schedule.clientName}</td>
      <td style="width: 15%; background: #f8fafc; font-weight: bold;">R.U.C. / D.N.I.:</td>
      <td style="width: 25%; font-family: monospace; font-weight: bold;">${schedule.clientDoc || 'S/N'}</td>
    </tr>
    <tr>
      <td style="background: #f8fafc; font-weight: bold;">DIRECCIÓN:</td>
      <td>${schedule.clientAddress || 'Villa El Salvador, Lima'}</td>
      <td style="background: #f8fafc; font-weight: bold;">TELÉFONO:</td>
      <td style="font-family: monospace;">${schedule.clientPhone || '934787006'}</td>
    </tr>
    <tr>
      <td style="background: #f8fafc; font-weight: bold;">VEHÍCULO / PLACA:</td>
      <td style="font-weight: bold; color: #0369a1;">${schedule.plate || 'POR ASIGNAR'} - ${schedule.model || 'Unidad de Transporte'}</td>
      <td style="background: #f8fafc; font-weight: bold;">ASESOR TÉCNICO:</td>
      <td style="font-weight: bold;">${advisorClean} (${schedule.advisorPhone || '934787006'})</td>
    </tr>
  </table>

  <!-- CRONOGRAMA DE CUOTAS Y VENCIMIENTO -->
  <div class="section-title">CRONOGRAMA DE CUOTAS Y VENCIMIENTOS ACORDADOS</div>
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 8px;">
    <thead>
      <tr style="background: #e2e8f0; font-size: 9px;">
        <th style="padding: 4px 8px; border: 1px solid #cbd5e1; text-align: center;">N° CUOTA / CONCEPTO</th>
        <th style="padding: 4px 8px; border: 1px solid #cbd5e1; text-align: center;">FECHA DE VENCIMIENTO</th>
        <th style="padding: 4px 8px; border: 1px solid #cbd5e1; text-align: right;">IMPORTE DE CUOTA</th>
        <th style="padding: 4px 8px; border: 1px solid #cbd5e1; text-align: center;">ESTADO</th>
      </tr>
    </thead>
    <tbody>
      ${installmentsHtml}
      <tr style="background: #f1f5f9; font-weight: bold;">
        <td colspan="2" style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: right; text-transform: uppercase;">MONTO TOTAL DEL SERVICIO ACORDADO:</td>
        <td style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: right; font-family: monospace; font-size: 11px; color: #0f172a;">S/ ${formatCurrency(schedule.totalAmount)}</td>
        <td style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: center; color: #0284c7;">${schedule.paymentType === 'PAGO_UNICO' ? 'PAGO ÚNICO' : 'FRACCIONADO'}</td>
      </tr>
    </tbody>
  </table>

  <!-- CUENTAS BANCARIAS OFICIALES -->
  <div style="margin-bottom: 8px;">
    <div style="font-size: 8.5px; font-weight: bold; color: #334155; margin-bottom: 3px; text-transform: uppercase;">CUENTAS BANCARIAS OFICIALES AUTORIZADAS PARA ABONOS (DARSIL AUTOMOTIVE SOLUTIONS S.A.C.):</div>
    <table style="width: 100%; border-collapse: collapse; font-size: 8.5px;">
      <thead>
        <tr style="background: #f1f5f9;">
          <th style="padding: 3px 6px; border: 1px solid #cbd5e1; text-align: left;">Entidad Financiera</th>
          <th style="padding: 3px 6px; border: 1px solid #cbd5e1; text-align: left;">Cuenta Corriente Soles</th>
          <th style="padding: 3px 6px; border: 1px solid #cbd5e1; text-align: left;">Código Interbancario (CCI)</th>
        </tr>
      </thead>
      <tbody>
        ${banksHtml}
      </tbody>
    </table>
  </div>

  <!-- CLÁUSULAS CONTRACTUALES -->
  <div class="section-title">CLÁUSULAS CONTRACTUALES Y ESTIPULACIONES DEL SERVICIO</div>
  <div style="margin-top: 5px;">
    ${clausesHtml}
  </div>

  <!-- FIRMAS DIGITALES / CONFORMIDAD -->
  <table class="signature-table">
    <tr>
      <td style="width: 45%; text-align: center; vertical-align: bottom;">
        ${schedule.advisorSignature ? `<img src="${schedule.advisorSignature}" style="max-height: 45px; margin-bottom: 2px;" />` : '<div style="height: 35px;"></div>'}
        <div class="signature-box" style="margin: 0 auto;">
          <strong>DARSIL AUTOMOTIVE SOLUTIONS S.A.C.</strong><br/>
          Asesor Técnico / Representante Autorizado<br/>
          D.N.I. / R.U.C. 20608765432
        </div>
      </td>
      <td style="width: 10%;"></td>
      <td style="width: 45%; text-align: center; vertical-align: bottom;">
        ${schedule.clientSignature ? `<img src="${schedule.clientSignature}" style="max-height: 45px; margin-bottom: 2px;" />` : '<div style="height: 35px;"></div>'}
        <div class="signature-box" style="margin: 0 auto;">
          <strong>${schedule.clientName}</strong><br/>
          Firma y Sello de Conformidad del Cliente<br/>
          R.U.C. / D.N.I.: ${schedule.clientDoc || '.........................'}
        </div>
      </td>
    </tr>
  </table>

  <div style="margin-top: 15px; text-align: center; font-size: 7.5px; color: #94a3b8; border-top: 1px dashed #cbd5e1; padding-top: 4px;">
    Documento emitido electrónicamente por el Sistema ERP DARSIL • Villa El Salvador, Lima • Conforme a Ley de Títulos Valores y Código Civil del Perú
  </div>

</body>
</html>
  `;
}

/**
 * Render HTML del Recibo de Caja Digital Oficial
 */
function renderCashReceiptHtml(schedule, payment, company) {
  const logoSrc = getLogoDataUri();
  const fechaPago = formatDate(payment.paymentDate || new Date());

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 10px;
      color: #0f172a;
      background: #fff;
      padding: 25px 35px;
      line-height: 1.35;
    }
    .header-table { width: 100%; margin-bottom: 12px; }
    .box { border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px; margin-bottom: 12px; }
  </style>
</head>
<body>
  <table class="header-table">
    <tr>
      <td style="width: 35%;">
        ${logoSrc ? `<img src="${logoSrc}" style="max-width: 160px; height: auto;" />` : `<strong style="font-size: 16px; color: #0284c7;">DARSIL</strong>`}
      </td>
      <td style="width: 35%; text-align: center; font-size: 9px; color: #475569;">
        <strong style="font-size: 11px; color: #0f172a;">DARSIL AUTOMOTIVE SOLUTIONS S.A.C.</strong><br/>
        R.U.C. 20608765432 • Villa El Salvador, Lima<br/>
        Central: 934 787 006 • operaciones@darsil.pe
      </td>
      <td style="width: 30%; border: 2px solid #16a34a; background: #f0fdf4; text-align: center; padding: 8px; border-radius: 6px;">
        <div style="font-size: 9px; font-weight: bold; color: #166534; text-transform: uppercase;">RECIBO DE CAJA DIGITAL</div>
        <div style="font-size: 13px; font-weight: 900; color: #0f172a; margin: 2px 0;">${payment.receiptNumber}</div>
        <div style="font-size: 8.5px; color: #475569;">Fecha: <strong>${fechaPago}</strong></div>
      </td>
    </tr>
  </table>

  <div class="box" style="background: #f8fafc;">
    <table style="width: 100%; border-collapse: collapse; font-size: 9.5px;">
      <tr>
        <td style="width: 25%; font-weight: bold; padding: 3px 0;">RECIBIMOS DE:</td>
        <td style="width: 75%; font-weight: bold; color: #0f172a; font-size: 11px;">${schedule.clientName}</td>
      </tr>
      <tr>
        <td style="font-weight: bold; padding: 3px 0;">R.U.C. / D.N.I.:</td>
        <td style="font-family: monospace; font-weight: bold;">${schedule.clientDoc || 'S/N'}</td>
      </tr>
      <tr>
        <td style="font-weight: bold; padding: 3px 0;">UNIDAD / PLACA:</td>
        <td style="color: #0284c7; font-weight: bold;">${schedule.plate || 'POR ASIGNAR'} - ${schedule.model || 'Vehículo'}</td>
      </tr>
      <tr>
        <td style="font-weight: bold; padding: 3px 0;">CONCEPTO:</td>
        <td>Abono a cuenta según Contrato <strong>${schedule.contractNumber}</strong> (Cotización ${schedule.quoteNumber})</td>
      </tr>
    </table>
  </div>

  <div style="background: #ecfdf5; border: 2px solid #059669; border-radius: 8px; padding: 14px; text-align: center; margin-bottom: 15px;">
    <div style="font-size: 11px; text-transform: uppercase; font-weight: bold; color: #047857;">IMPORTE RECIBIDO Y ACREDITADO</div>
    <div style="font-size: 26px; font-weight: 900; font-family: monospace; color: #065f46; margin: 4px 0;">S/ ${formatCurrency(payment.amount)}</div>
    <div style="font-size: 9.5px; color: #047857;">Método: <strong>${payment.paymentMethod}</strong> • N° Operación: <strong>${payment.operationNumber || 'VOUCHER VERIFICADO'}</strong></div>
  </div>

  <!-- ESTADO DE CUENTA POST-ABONO -->
  <div class="box">
    <div style="font-weight: bold; font-size: 10px; margin-bottom: 6px; color: #0f172a; text-transform: uppercase;">ESTADO DE CUENTA ACTUALIZADO TRAS EL ABONO:</div>
    <table style="width: 100%; border-collapse: collapse; font-size: 9.5px;">
      <tr>
        <td style="padding: 4px; border: 1px solid #cbd5e1;">Monto Total del Contrato:</td>
        <td style="padding: 4px; border: 1px solid #cbd5e1; text-align: right; font-family: monospace; font-weight: bold;">S/ ${formatCurrency(schedule.totalAmount)}</td>
      </tr>
      <tr>
        <td style="padding: 4px; border: 1px solid #cbd5e1; color: #166534;">Total Abonado Acumulado:</td>
        <td style="padding: 4px; border: 1px solid #cbd5e1; text-align: right; font-family: monospace; font-weight: bold; color: #166534;">S/ ${formatCurrency(schedule.paidAmount)}</td>
      </tr>
      <tr style="background: #fef2f2; font-weight: bold;">
        <td style="padding: 6px 4px; border: 1px solid #cbd5e1; color: #b91c1c; font-size: 11px;">SALDO RESTANTE PENDIENTE POR COBRAR:</td>
        <td style="padding: 6px 4px; border: 1px solid #cbd5e1; text-align: right; font-family: monospace; font-size: 13px; color: #b91c1c;">S/ ${formatCurrency(schedule.balance)}</td>
      </tr>
    </table>
  </div>

  <table style="width: 100%; margin-top: 30px;">
    <tr>
      <td style="width: 50%; text-align: center;">
        <div style="width: 80%; border-top: 1px solid #64748b; margin: 0 auto; padding-top: 4px; font-size: 8.5px;">
          <strong>DARSIL AUTOMOTIVE SOLUTIONS S.A.C.</strong><br/>
          Caja Central & Tesorería
        </div>
      </td>
      <td style="width: 50%; text-align: center;">
        <div style="width: 80%; border-top: 1px solid #64748b; margin: 0 auto; padding-top: 4px; font-size: 8.5px;">
          <strong>${schedule.clientName}</strong><br/>
          Recibí Conforme / Cliente
        </div>
      </td>
    </tr>
  </table>

  <div style="margin-top: 25px; text-align: center; font-size: 8px; color: #94a3b8;">
    Comprobante digital de control interno emitido por DARSIL ERP • No válido como comprobante tributario SUNAT
  </div>
</body>
</html>
  `;
}

/**
 * Render HTML del Certificado de Paz y Salvo Oficial
 */
function renderPazYSalvoHtml(schedule, company) {
  const logoSrc = getLogoDataUri();
  const fechaPazYSalvo = formatDate(new Date());

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 11px;
      color: #0f172a;
      background: #fff;
      padding: 30px 45px;
      line-height: 1.5;
    }
    .header-table { width: 100%; margin-bottom: 25px; }
    .gold-box {
      border: 3px double #d97706;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      background: #fffbeb;
      margin-bottom: 25px;
    }
  </style>
</head>
<body>
  <table class="header-table">
    <tr>
      <td style="width: 40%;">
        ${logoSrc ? `<img src="${logoSrc}" style="max-width: 180px; height: auto;" />` : `<strong style="font-size: 20px; color: #0284c7;">DARSIL</strong>`}
      </td>
      <td style="width: 60%; text-align: right; font-size: 9px; color: #475569;">
        <strong style="font-size: 12px; color: #0f172a;">DARSIL AUTOMOTIVE SOLUTIONS S.A.C.</strong><br/>
        R.U.C. 20608765432 • Villa El Salvador, Lima<br/>
        Tecnología • Diagnóstico • Mecatrónica Pesada
      </td>
    </tr>
  </table>

  <div class="gold-box">
    <div style="font-size: 11px; font-weight: bold; color: #b45309; letter-spacing: 2px; text-transform: uppercase;">CERTIFICADO OFICIAL DE NO ADEUDO</div>
    <div style="font-size: 22px; font-weight: 900; color: #0f172a; margin: 6px 0;">CONSTANCIA DE PAZ Y SALVO</div>
    <div style="font-size: 10px; color: #64748b;">N° PYS-${schedule.contractNumber.replace(/[^0-9]/g, '') || '2026-001'}</div>
  </div>

  <div style="text-align: justify; margin-bottom: 20px; font-size: 11.5px; line-height: 1.6;">
    <p style="margin-bottom: 14px;">
      Por medio del presente documento, la empresa <strong>DARSIL AUTOMOTIVE SOLUTIONS S.A.C.</strong> (R.U.C. 20608765432), con domicilio legal y taller central en el distrito de Villa El Salvador, Lima:
    </p>
    <p style="margin-bottom: 14px; background: #f8fafc; padding: 12px; border-left: 4px solid #16a34a; border-radius: 4px;">
      <strong>CERTIFICA Y HACE CONSTAR QUE:</strong><br/>
      El cliente <strong>${schedule.clientName}</strong>, con R.U.C./D.N.I. <strong>${schedule.clientDoc || 'S/N'}</strong>, ha cumplido satisfactoriamente y en su totalidad con el pago del presupuesto correspondiente al Contrato <strong>${schedule.contractNumber}</strong> (Cotización Oficial N° ${schedule.quoteNumber}), por un importe total cancelado de <strong>S/ ${formatCurrency(schedule.totalAmount)} Soles</strong>.
    </p>
    <p style="margin-bottom: 14px;">
      Dicho servicio técnico fue ejecutado a entera conformidad sobre la unidad vehicular:
    </p>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 14px; font-size: 11px;">
      <tr>
        <td style="padding: 6px; border: 1px solid #cbd5e1; background: #f1f5f9; width: 30%; font-weight: bold;">PLACA DEL VEHÍCULO:</td>
        <td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold; color: #0369a1;">${schedule.plate || 'POR ASIGNAR'}</td>
      </tr>
      <tr>
        <td style="padding: 6px; border: 1px solid #cbd5e1; background: #f1f5f9; font-weight: bold;">MODELO / CARROCERÍA:</td>
        <td style="padding: 6px; border: 1px solid #cbd5e1;">${schedule.model || 'Unidad de Transporte'}</td>
      </tr>
      <tr>
        <td style="padding: 6px; border: 1px solid #cbd5e1; background: #f1f5f9; font-weight: bold;">ESTADO FINANCIERO:</td>
        <td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: 900; color: #166534;">100% CANCELADO (SALDO S/ 0.00)</td>
      </tr>
    </table>
    <p>
      En virtud de lo anterior, se declara a la mencionada persona y a la unidad automotriz <strong>COMPLETAMENTE LIBRES DE TODO ADEUDO, GRAVAMEN O RETENCIÓN</strong> por concepto de dichos trabajos, autorizándose la vigencia irrestricta de las garantías técnicas otorgadas y la expedición del comprobante de pago SUNAT correspondiente.
    </p>
  </div>

  <div style="margin-top: 15px; font-size: 10px; color: #475569;">
    Se expide la presente certificación a solicitud de la parte interesada en la ciudad de Lima, a los ${new Date().getDate()} días del mes de ${new Date().toLocaleString('es-PE', { month: 'long' })} del ${new Date().getFullYear()}.
  </div>

  <table style="width: 100%; margin-top: 45px;">
    <tr>
      <td style="width: 50%; text-align: center;">
        <div style="width: 75%; border-top: 2px solid #0f172a; margin: 0 auto; padding-top: 6px;">
          <strong>DARIOS BACILIO</strong><br/>
          Gerencia General / Asesoría Técnica<br/>
          DARSIL AUTOMOTIVE SOLUTIONS S.A.C.
        </div>
      </td>
      <td style="width: 50%; text-align: center;">
        <div style="width: 75%; border-top: 2px solid #0f172a; margin: 0 auto; padding-top: 6px;">
          <strong>TESORERÍA Y CRÉDITOS</strong><br/>
          Dpto. de Gestión Financiera<br/>
          R.U.C. 20608765432
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Generador de PDF de Contrato & Convenio de Pago
 */
async function generateContractPdf(schedule, company) {
  const uploadsDir = path.join(__dirname, '../../uploads/contracts');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const safeNumber = (schedule.contractNumber || 'CONTRATO').replace(/[^a-zA-Z0-9_-]/g, '_');
  const outputPath = path.join(uploadsDir, `${safeNumber}.pdf`);
  const html = renderContractHtml(schedule, company);

  let browser = null;
  try {
    const executablePath = process.env.CHROME_PATH || 
      (fs.existsSync('/usr/bin/chromium') 
        ? '/usr/bin/chromium' 
        : fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe') 
          ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' 
          : '/usr/bin/google-chrome');

    browser = await launchPuppeteerCore();

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 15000 });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '8mm', right: '8mm', bottom: '8mm', left: '8mm' }
    });

    fs.writeFileSync(outputPath, pdfBuffer);

    return {
      filePath: outputPath,
      fileName: `${safeNumber}.pdf`,
      buffer: pdfBuffer,
      urlPath: `/uploads/contracts/${safeNumber}.pdf`
    };
  } finally {
    if (browser) await browser.close();
  }
}

/**
 * Generador de PDF de Recibo de Caja Digital
 */
async function generateCashReceiptPdf(schedule, payment, company) {
  const uploadsDir = path.join(__dirname, '../../uploads/receipts');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const safeNumber = (payment.receiptNumber || 'RECIBO').replace(/[^a-zA-Z0-9_-]/g, '_');
  const outputPath = path.join(uploadsDir, `${safeNumber}.pdf`);
  const html = renderCashReceiptHtml(schedule, payment, company);

  let browser = null;
  try {
    const executablePath = process.env.CHROME_PATH || 
      (fs.existsSync('/usr/bin/chromium') 
        ? '/usr/bin/chromium' 
        : fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe') 
          ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' 
          : '/usr/bin/google-chrome');

    browser = await launchPuppeteerCore();

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 15000 });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' }
    });

    fs.writeFileSync(outputPath, pdfBuffer);

    return {
      filePath: outputPath,
      fileName: `${safeNumber}.pdf`,
      buffer: pdfBuffer,
      urlPath: `/uploads/receipts/${safeNumber}.pdf`
    };
  } finally {
    if (browser) await browser.close();
  }
}

/**
 * Generador de PDF de Constancia de Paz y Salvo
 */
async function generatePazYSalvoPdf(schedule, company) {
  const uploadsDir = path.join(__dirname, '../../uploads/paz-y-salvo');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const safeNumber = (schedule.contractNumber || 'PYS').replace(/[^a-zA-Z0-9_-]/g, '_');
  const outputPath = path.join(uploadsDir, `PazYSalvo_${safeNumber}.pdf`);
  const html = renderPazYSalvoHtml(schedule, company);

  let browser = null;
  try {
    const executablePath = process.env.CHROME_PATH || 
      (fs.existsSync('/usr/bin/chromium') 
        ? '/usr/bin/chromium' 
        : fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe') 
          ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' 
          : '/usr/bin/google-chrome');

    browser = await launchPuppeteerCore();

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 15000 });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' }
    });

    fs.writeFileSync(outputPath, pdfBuffer);

    return {
      filePath: outputPath,
      fileName: `PazYSalvo_${safeNumber}.pdf`,
      buffer: pdfBuffer,
      urlPath: `/uploads/paz-y-salvo/PazYSalvo_${safeNumber}.pdf`
    };
  } finally {
    if (browser) await browser.close();
  }
}

module.exports = {
  generateQuotePdf,
  generateWorkOrderPdf,
  generateInvoicePdf,
  generateContractPdf,
  generateCashReceiptPdf,
  generatePazYSalvoPdf,
  renderTallerHtml,
  renderWorkOrderHtml,
  renderInvoiceHtml,
  renderContractHtml,
  renderCashReceiptHtml,
  renderPazYSalvoHtml
};

