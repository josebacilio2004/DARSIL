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
  const itemsHtml = (quote.items || []).map((item, idx) => `
    <tr>
      <td class="text-left font-mono">${item.code || `MO${String(idx + 1).padStart(2, '0')}`}</td>
      <td class="text-left">${item.description}</td>
      <td class="text-center bg-yellow">${item.quantity}</td>
      <td class="text-center">${item.stockDisp || 'DISPONIBLE'}</td>
      <td class="text-right">${formatCurrency(item.unitPrice)}</td>
      <td class="text-right">${formatCurrency(item.value)}</td>
    </tr>
  `).join('');

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
  const fechaAlta = formatDate(quote.issueDate);
  const fechaValidez = formatDate(quote.validUntil, 15);
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
      width: 45%;
      vertical-align: middle;
    }
    .company-title-container {
      width: 55%;
      text-align: center;
      vertical-align: middle;
    }
    .company-main-title {
      font-size: 14px;
      font-weight: 900;
      color: #0f294a;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }
    .company-contact {
      font-size: 10px;
      font-weight: bold;
      color: #333;
    }
    .logo-text-title {
      font-weight: 900;
      font-size: 16px;
      color: #0f294a;
      letter-spacing: 1px;
    }
    .logo-text-sub {
      font-size: 6.5px;
      color: #4a5568;
      letter-spacing: 0.5px;
      font-weight: 600;
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
        <div style="display: flex; align-items: center; gap: 10px;">
          ${logoSrc ? `<img src="${logoSrc}" style="height: 52px; width: auto; object-fit: contain;" />` : `
          <svg width="42" height="42" viewBox="0 0 100 100">
            <polygon points="10,5 50,5 30,50 60,50 15,95 35,45 10,45" fill="#eab308" stroke="#0f294a" stroke-width="4"/>
            <path d="M45 15 L70 15 C85 15 95 25 95 45 C95 65 85 75 70 75 L45 75 Z" fill="none" stroke="#0f294a" stroke-width="12" stroke-linejoin="round"/>
          </svg>`}
          <div>
            <div class="logo-text-title">DARSIL</div>
            <div style="font-size: 7.5px; font-weight: bold; color: #64748b; letter-spacing: 0.5px;">AUTOMOTIVE SOLUTIONS</div>
            <div class="logo-text-sub">TECNOLOGÍA • DIAGNÓSTICO • INGENIERÍA • INNOVACIÓN</div>
          </div>
        </div>
      </td>
      <td class="company-title-container">
        <div class="company-main-title">${company?.name || 'DARSIL AUTOMOTIVE SOLUTIONS'}</div>
        <div class="company-contact">Telefonos: ${(company?.phones || ['934787006']).join(' - ')}</div>
        <div class="company-contact">Email: ${(company?.emails || ['rubenbasil24@gmail.com']).join(' - ')}</div>
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
      <td class="meta-label">Teléfono</td>
      <td class="meta-val font-mono">${quote.clientPhone || ''}</td>
    </tr>
    <tr>
      <td class="meta-label">Dirección</td>
      <td class="meta-val">${quote.clientAddress || 'Lima, Perú'}</td>
      <td class="meta-label">Matrícula</td>
      <td class="meta-val font-bold font-mono">${quote.plate || ''}</td>
    </tr>
    <tr>
      <td class="meta-label">VIN</td>
      <td class="meta-val font-mono">${quote.vin || ''}</td>
      <td class="meta-label">Modelo</td>
      <td class="meta-val">${quote.model || ''}</td>
    </tr>
  </table>

  <!-- Tabla de Ítems / Mano de Obra -->
  <table class="items-table">
    <thead>
      <tr>
        <th style="width: 12%;">Referencia</th>
        <th style="width: 48%; text-align: left; padding-left: 8px;">Descripción</th>
        <th style="width: 8%;">Uds.</th>
        <th style="width: 10%;">Stock Disp.</th>
        <th style="width: 11%; text-align: right;">Precio Unitario (S/)</th>
        <th style="width: 11%; text-align: right; padding-right: 8px;">Valor (S/)</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHtml}
    </tbody>
  </table>

  <!-- Barra de Total -->
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
    <div class="obs-title">Observaciones:</div>
    <div class="obs-text">${quote.paymentCondition || 'Condición de pago 07 días despues de realizar el servicio.'}</div>
  </div>

  <!-- Firmas -->
  <table class="signatures-table">
    <tr>
      <td>
        ${clientSignatureHtml}
        Firma del Cliente: <span class="sig-line"></span>
      </td>
      <td>
        ${advisorSignatureHtml}
        Firma del Asesor: <span class="sig-line"></span>
      </td>
    </tr>
  </table>

  <!-- Pie de página -->
  <div class="footer-note">${quote.notes || 'Nota: Cotización válida por 15 días hábiles desde su emisión.'}</div>
  <div class="doc-type-bottom">Cotización</div>

</body>
</html>
  `;
}

/**
 * Genera el HTML de la plantilla de Proyectos / Flota (Plantilla 1)
 */
function renderProyectoHtml(quote, company) {
  const logoSrc = getLogoDataUri();
  const fleetRows = (quote.fleetUnits || []).map(u => `
    <tr>
      <td>${u.unitType}</td>
      <td class="text-center font-bold" style="color: blue;">${u.quantity}</td>
      <td class="text-center font-bold" style="color: blue;">${u.itemsPerUnit}</td>
      <td class="text-center font-bold">${u.totalItems}</td>
      <td></td>
    </tr>
  `).join('');

  const econRows = (quote.items || []).map(i => `
    <tr>
      <td>${i.description}</td>
      <td class="text-center ${i.quantity ? 'font-bold' : ''}">${i.quantity}</td>
      <td class="text-right">S/ ${formatCurrency(i.value)}</td>
      <td></td>
    </tr>
  `).join('');

  const includesList = (quote.includes || []).map(inc => `<li>• ${inc}</li>`).join('');
  const notIncludesList = (quote.notIncludes || []).map(ninc => `<li>• ${ninc}</li>`).join('');
  const commConditions = (quote.commercialConditions || []).map(cc => `<li>• ${cc}</li>`).join('');

  const fechaAlta = formatDate(quote.issueDate);
  const fechaValidez = formatDate(quote.validUntil, 15);

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
      color: #111;
      padding: 18px 30px;
      line-height: 1.3;
    }
    .header-center {
      text-align: center;
      margin-bottom: 12px;
    }
    .title-main {
      font-size: 16px;
      font-weight: 900;
      color: #1b3f6e;
      letter-spacing: 0.5px;
    }
    .title-sub {
      font-size: 9.5px;
      font-style: italic;
      color: #4b5563;
      margin-top: 2px;
    }
    .meta-box {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
    }
    .meta-box td {
      border: 1px solid #cbd5e1;
      padding: 3px 6px;
      font-size: 9.5px;
    }
    .meta-box .lbl {
      font-weight: bold;
      width: 20%;
    }
    .meta-box .val-highlight {
      background-color: #ffff00;
      color: #1d4ed8;
      font-weight: bold;
    }
    .sec-banner {
      background-color: #1e3a5f;
      color: #fff;
      font-size: 11px;
      font-weight: bold;
      padding: 3px 8px;
      margin-top: 10px;
      margin-bottom: 6px;
    }
    .sec-content {
      padding: 3px 4px 6px 4px;
      font-size: 9.5px;
    }
    .tbl {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 6px;
    }
    .tbl th {
      background-color: #cbd5e1;
      border: 1px solid #94a3b8;
      padding: 4px;
      font-size: 9.5px;
    }
    .tbl td {
      border: 1px solid #cbd5e1;
      padding: 3px 6px;
      font-size: 9.5px;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .font-bold { font-weight: bold; }
    ul { list-style: none; padding-left: 0; }
    li { margin-bottom: 2px; }
  </style>
</head>
<body>
  <div class="header-center" style="display: flex; align-items: center; justify-content: center; gap: 15px; margin-bottom: 8px;">
    ${logoSrc ? `<img src="${logoSrc}" style="height: 48px; object-fit: contain;" />` : ''}
    <div>
      <div class="title-main">DARSIL AUTOMOTIVE - COTIZACIÓN</div>
      <div class="title-sub">Servicio técnico especializado — Diagnóstico • Electricidad • Electrónica • Mantenimiento Automotriz</div>
    </div>
  </div>

  <table class="meta-box">
    <tr>
      <td class="lbl">N.º Cotización:</td>
      <td class="val-highlight">${quote.quoteNumber}</td>
    </tr>
    <tr>
      <td class="lbl">Fecha:</td>
      <td class="val-highlight">${fechaAlta}</td>
    </tr>
    <tr>
      <td class="lbl">Cliente:</td>
      <td class="val-highlight">${quote.clientName}</td>
    </tr>
    <tr>
      <td class="lbl">Lugar:</td>
      <td class="val-highlight">${quote.location || 'Lima'}</td>
    </tr>
    <tr>
      <td class="lbl">Servicio:</td>
      <td class="val-highlight">${quote.orderType || 'Instalacion de sensores'}</td>
    </tr>
    <tr>
      <td class="lbl">Comisión:</td>
      <td class="val-highlight">${quote.commissionDays || '4 días'}</td>
    </tr>
  </table>

  <div class="sec-banner">1. OBJETO</div>
  <div class="sec-content">${quote.projectObject || 'Instalación de sensores y validación de funcionamiento.'}</div>

  <div class="sec-banner">2. ALCANCE Y CANTIDAD DE UNIDADES</div>
  <table class="tbl">
    <thead>
      <tr>
        <th style="width: 35%;">Tipo de unidad</th>
        <th style="width: 15%;">Cantidad</th>
        <th style="width: 25%;">Sensores / bus</th>
        <th style="width: 25%;">Total sensores</th>
      </tr>
    </thead>
    <tbody>
      ${fleetRows}
    </tbody>
  </table>

  <div class="sec-banner">3. PROPUESTA ECONOMICA</div>
  <table class="tbl">
    <thead>
      <tr>
        <th style="width: 50%;">Concepto</th>
        <th style="width: 20%;">Cantidad</th>
        <th style="width: 30%; text-align: right;">Importe (S/)</th>
      </tr>
    </thead>
    <tbody>
      ${econRows}
      <tr style="background-color: #cbd5e1; font-weight: bold;">
        <td>TOTAL GENERAL</td>
        <td></td>
        <td class="text-right">S/ ${formatCurrency(quote.total)}</td>
      </tr>
    </tbody>
  </table>

  <div class="sec-banner">4. TIEMPO DE EJECUCIÓN</div>
  <div class="sec-content">${quote.executionTime || ''}</div>

  <div class="sec-banner">5. INCLUYE / NO INCLUYE</div>
  <div class="sec-content">
    <ul>
      ${includesList}
      ${notIncludesList}
    </ul>
  </div>

  <div class="sec-banner">6. CONDICIONES COMERCIALES</div>
  <div class="sec-content">
    <ul>
      ${commConditions}
    </ul>
  </div>

  <div style="margin-top: 30px; text-align: center;">
    <div style="font-weight: bold; color: #1e3a5f;">DARSIL AUTOMOTIVE</div>
    <div style="font-style: italic; font-size: 8.5px; color: #64748b;">Diagnóstico • Electricidad • Electrónica • Mantenimiento Automotriz</div>
    <div style="margin-top: 25px; text-align: left; font-size: 9.5px;">
      Firma y sello: _________________________________________
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Genera el documento PDF usando Chrome Puppeteer
 */
async function generateQuotePdf(quote, company) {
  const uploadsDir = path.join(__dirname, '../../uploads/quotes');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const html = quote.templateType === 'PROYECTO_ESPECIAL'
    ? renderProyectoHtml(quote, company)
    : renderTallerHtml(quote, company);

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
    console.log(`PDF generado exitosamente en: ${outputPath}`);

    return {
      filePath: outputPath,
      fileName: `${quote.quoteNumber}.pdf`,
      buffer: pdfBuffer,
      urlPath: `/uploads/quotes/${quote.quoteNumber}.pdf`
    };
  } catch (error) {
    console.error('Error al generar PDF con Puppeteer:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

module.exports = {
  generateQuotePdf,
  renderTallerHtml,
  renderProyectoHtml
};
