const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = process.env.CHROME_PATH || '/usr/bin/chromium';

function formatCurrency(amount) {
  return Number(amount || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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

    /* Observaciones */
    .obs-section {
      margin-bottom: 18px;
      font-size: 9.5px;
    }
    .obs-title {
      font-style: italic;
      font-weight: bold;
      margin-bottom: 2px;
    }
    .obs-text {
      font-style: italic;
      color: #2d3748;
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

  <!-- Observaciones -->
  <div class="obs-section">
    <div class="obs-title">Condición de Pago & Observaciones:</div>
    <div class="obs-text">${quote.paymentCondition || 'Condición de pago 07 días despues de realizar el servicio.'}</div>
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
  <div class="footer-note">${quote.notes || `Nota: Cotización válida por ${validityDays} días calendario desde su emisión.`}</div>
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

  <!-- Sección 4: Firmas de Conformidad -->
  <div class="section-title">4. Acta de Conformidad y Entrega Técnica</div>
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
    browser = await puppeteer.launch({
      executablePath: process.env.CHROME_PATH || '/usr/bin/chromium',
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-extensions',
        '--font-render-hinting=none'
      ]
    });

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
    browser = await puppeteer.launch({
      executablePath: process.env.CHROME_PATH || '/usr/bin/chromium',
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-extensions',
        '--font-render-hinting=none'
      ]
    });

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

module.exports = {
  generateQuotePdf,
  generateWorkOrderPdf,
  renderTallerHtml,
  renderWorkOrderHtml
};
