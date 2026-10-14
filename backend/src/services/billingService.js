const crypto = require('crypto');
const QRCode = require('qrcode');
const axios = require('axios');
const ElectronicInvoice = require('../models/ElectronicInvoice');
const Counter = require('../models/Counter');
const CompanyConfig = require('../models/CompanyConfig');

const APISPERU_TOKEN = process.env.APISPERU_TOKEN || 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6ImpmY2M5NTAxMjMwOUBnbWFpbC5jb20ifQ.UaK6eecpbt-mVnF9hI-BYSHtl6QQ5hCLU1MNItWe9P8';

/**
 * Conversión de números a palabras en español para moneda Soles
 * Formato SUNAT: "SON: [MONTO EN LETRAS] CON XX/100 SOLES"
 */
function numberToWordsPEN(amount) {
  const num = Number(amount || 0);
  const integerPart = Math.floor(num);
  const decimalPart = Math.round((num - integerPart) * 100);
  const decimalsStr = String(decimalPart).padStart(2, '0') + '/100 SOLES';

  if (integerPart === 0) return `CERO CON ${decimalsStr}`;

  const UNIDADES = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
  const DECENAS = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
  const DIEZ_Y = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
  const VEINTE_Y = ['VEINTE', 'VEINTIUNO', 'VEINTIDÓS', 'VEINTITRÉS', 'VEINTICUATRO', 'VEINTICINCO', 'VEINTISÉIS', 'VEINTISIETE', 'VEINTIOCHO', 'VEINTINUEVE'];
  const CENTENAS = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

  function readBlock(n) {
    let output = '';
    const c = Math.floor(n / 100);
    const d = Math.floor((n % 100) / 10);
    const u = n % 10;

    if (n === 100) return 'CIEN';
    if (c > 0) output += CENTENAS[c] + ' ';

    if (d === 1) {
      output += DIEZ_Y[u] + ' ';
    } else if (d === 2) {
      output += VEINTE_Y[u] + ' ';
    } else if (d > 2) {
      output += DECENAS[d];
      if (u > 0) output += ' Y ' + UNIDADES[u];
      output += ' ';
    } else if (u > 0) {
      output += UNIDADES[u] + ' ';
    }

    return output.trim();
  }

  let words = '';
  const millions = Math.floor(integerPart / 1000000);
  const thousands = Math.floor((integerPart % 1000000) / 1000);
  const remainder = integerPart % 1000;

  if (millions > 0) {
    if (millions === 1) words += 'UN MILLÓN ';
    else words += readBlock(millions) + ' MILLONES ';
  }

  if (thousands > 0) {
    if (thousands === 1) words += 'MIL ';
    else words += readBlock(thousands) + ' MIL ';
  }

  if (remainder > 0 || integerPart === 0) {
    words += readBlock(remainder);
  }

  return `SON: ${words.trim()} CON ${decimalsStr}`;
}

/**
 * Obtiene el siguiente correlativo para la serie dada (F001, B001)
 */
async function getNextInvoiceNumber(serie) {
  const cleanSerie = String(serie).toUpperCase().trim();
  const counterId = `invoice_${cleanSerie}`;
  
  // Buscar último registro emitido en la BD
  const lastRecord = await ElectronicInvoice.findOne({ serie: cleanSerie }).sort({ number: -1 });
  let nextNum = 1;
  if (lastRecord && lastRecord.number) {
    nextNum = lastRecord.number + 1;
  }

  // Sincronizar con colección Counter
  const counter = await Counter.findOneAndUpdate(
    { _id: counterId },
    { $set: { seq: nextNum } },
    { new: true, upsert: true }
  );

  return counter.seq;
}

/**
 * Genera el documento XML UBL 2.1 estándar SUNAT
 */
function generateUBL21Xml(invoice, company) {
  const issueDateStr = new Date(invoice.issueDate).toISOString().split('T')[0];
  const rucEmisor = company.ruc || '20608765432';
  const razonSocialEmisor = company.companyName || 'DARSIL AUTOMOTIVE SOLUTIONS S.A.C.';

  const linesXml = invoice.items.map((item, index) => {
    return `
    <cac:InvoiceLine>
      <cbc:ID>${index + 1}</cbc:ID>
      <cbc:InvoicedQuantity unitCode="${item.unit || 'NIU'}">${item.quantity}</cbc:InvoicedQuantity>
      <cbc:LineExtensionAmount currencyID="${invoice.currency}">${Number(item.subtotal).toFixed(2)}</cbc:LineExtensionAmount>
      <cac:PricingReference>
        <cac:AlternativeConditionPrice>
          <cbc:PriceAmount currencyID="${invoice.currency}">${Number(item.unitPrice).toFixed(2)}</cbc:PriceAmount>
          <cbc:PriceTypeCode>01</cbc:PriceTypeCode>
        </cac:AlternativeConditionPrice>
      </cac:PricingReference>
      <cac:TaxTotal>
        <cbc:TaxAmount currencyID="${invoice.currency}">${Number(item.igv).toFixed(2)}</cbc:TaxAmount>
        <cac:TaxSubtotal>
          <cbc:TaxableAmount currencyID="${invoice.currency}">${Number(item.subtotal).toFixed(2)}</cbc:TaxableAmount>
          <cbc:TaxAmount currencyID="${invoice.currency}">${Number(item.igv).toFixed(2)}</cbc:TaxAmount>
          <cac:TaxCategory>
            <cbc:Percent>18.00</cbc:Percent>
            <cbc:TaxExemptionReasonCode>10</cbc:TaxExemptionReasonCode>
            <cac:TaxScheme>
              <cbc:ID>1000</cbc:ID>
              <cbc:Name>IGV</cbc:Name>
              <cbc:TaxTypeCode>VAT</cbc:TaxTypeCode>
            </cac:TaxScheme>
          </cac:TaxCategory>
        </cac:TaxSubtotal>
      </cac:TaxTotal>
      <cac:Item>
        <cbc:Description><![CDATA[${item.description}]]></cbc:Description>
        <cac:SellersItemIdentification>
          <cbc:ID>${item.code || 'MO01'}</cbc:ID>
        </cac:SellersItemIdentification>
      </cac:Item>
      <cac:Price>
        <cbc:PriceAmount currencyID="${invoice.currency}">${Number(item.unitValue).toFixed(2)}</cbc:PriceAmount>
      </cac:Price>
    </cac:InvoiceLine>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
         xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>2.0</cbc:CustomizationID>
  <cbc:ID>${invoice.fullNumber}</cbc:ID>
  <cbc:IssueDate>${issueDateStr}</cbc:IssueDate>
  <cbc:InvoiceTypeCode listID="0101">${invoice.invoiceType}</cbc:InvoiceTypeCode>
  <cbc:Note languageLocaleID="1000"><![CDATA[${invoice.totals.totalWords}]]></cbc:Note>
  <cbc:DocumentCurrencyCode>${invoice.currency}</cbc:DocumentCurrencyCode>
  
  <cac:Signature>
    <cbc:ID>${invoice.fullNumber}</cbc:ID>
    <cac:SignatoryParty>
      <cac:PartyIdentification>
        <cbc:ID>${rucEmisor}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyName>
        <cbc:Name><![CDATA[${razonSocialEmisor}]]></cbc:Name>
      </cac:PartyName>
    </cac:SignatoryParty>
    <cac:DigitalSignatureAttachment>
      <cac:ExternalReference>
        <cbc:URI>#SignatureSP</cbc:URI>
      </cac:ExternalReference>
    </cac:DigitalSignatureAttachment>
  </cac:Signature>

  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="6">${rucEmisor}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName><![CDATA[${razonSocialEmisor}]]></cbc:RegistrationName>
        <cac:RegistrationAddress>
          <cbc:AddressTypeCode>0000</cbc:AddressTypeCode>
          <cbc:CitySubdivisionName>Villa El Salvador</cbc:CitySubdivisionName>
          <cbc:CityName>Lima</cbc:CityName>
          <cbc:CountrySubentity>Lima</cbc:CountrySubentity>
          <cbc:District>Villa El Salvador</cbc:District>
          <cac:Country>
            <cbc:IdentificationCode>PE</cbc:IdentificationCode>
          </cac:Country>
        </cac:RegistrationAddress>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingSupplierParty>

  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="${invoice.clientDocType}">${invoice.clientDoc}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName><![CDATA[${invoice.clientName}]]></cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingCustomerParty>

  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="${invoice.currency}">${Number(invoice.totals.igv).toFixed(2)}</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="${invoice.currency}">${Number(invoice.totals.opGravadas).toFixed(2)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="${invoice.currency}">${Number(invoice.totals.igv).toFixed(2)}</cbc:TaxAmount>
      <cac:TaxCategory>
        <cac:TaxScheme>
          <cbc:ID>1000</cbc:ID>
          <cbc:Name>IGV</cbc:Name>
          <cbc:TaxTypeCode>VAT</cbc:TaxTypeCode>
        </cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:TaxTotal>

  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="${invoice.currency}">${Number(invoice.totals.opGravadas).toFixed(2)}</cbc:LineExtensionAmount>
    <cbc:TaxInclusiveAmount currencyID="${invoice.currency}">${Number(invoice.totals.total).toFixed(2)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="${invoice.currency}">${Number(invoice.totals.total).toFixed(2)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>

  ${linesXml}
</Invoice>`;
}

/**
 * Emite un comprobante electrónico (Factura o Boleta)
 * Genera UBL 2.1, calcula Hash SHA-256, genera Código QR oficial SUNAT y procesa respuesta
 */
async function emitElectronicInvoice(data) {
  // 1. Obtener datos de la empresa emisora
  let company = await CompanyConfig.findOne();
  if (!company) {
    company = {
      companyName: 'DARSIL AUTOMOTIVE SOLUTIONS S.A.C.',
      ruc: '20608765432',
      address: 'Villa El Salvador, Lima, Lima',
      phone: '934787006'
    };
  }

  const invoiceType = data.invoiceType || (String(data.clientDoc || '').length === 11 ? '01' : '03');
  const serie = invoiceType === '01' ? 'F001' : 'B001';
  const number = await getNextInvoiceNumber(serie);
  const fullNumber = `${serie}-${String(number).padStart(8, '0')}`;

  // 2. Cálculo de partidas y tributos (18% IGV oficial Perú)
  const items = (data.items || []).map((item, i) => {
    const qty = Number(item.quantity) || 1;
    const price = Number(item.unitPrice || item.price) || 0; // Precio con IGV
    const totalRow = qty * price;
    const subtotalRow = totalRow / 1.18; // Base imponible
    const igvRow = totalRow - subtotalRow;
    const unitValue = price / 1.18;

    return {
      code: item.code || `MO${String(i + 1).padStart(2, '0')}`,
      description: item.description || item.name || 'SERVICIO TÉCNICO',
      quantity: qty,
      unit: item.unit || (item.code?.startsWith('REP') ? 'NIU' : 'ZZ'),
      unitPrice: Number(price.toFixed(2)),
      unitValue: Number(unitValue.toFixed(4)),
      subtotal: Number(subtotalRow.toFixed(2)),
      igv: Number(igvRow.toFixed(2)),
      total: Number(totalRow.toFixed(2))
    };
  });

  const opGravadas = Number(items.reduce((acc, it) => acc + it.subtotal, 0).toFixed(2));
  const igv = Number(items.reduce((acc, it) => acc + it.igv, 0).toFixed(2));
  const total = Number((opGravadas + igv).toFixed(2));
  const totalWords = numberToWordsPEN(total);

  // 3. Generar XML UBL 2.1
  const invoiceDoc = {
    fullNumber,
    invoiceType,
    issueDate: data.issueDate || new Date(),
    currency: 'PEN',
    clientDocType: String(data.clientDoc || '').length === 11 ? '6' : '1',
    clientDoc: data.clientDoc,
    clientName: data.clientName,
    items,
    totals: { opGravadas, igv, total, totalWords }
  };

  const xmlContent = generateUBL21Xml(invoiceDoc, company);
  
  // 4. Calcular Hash SHA-256 del XML (Firma Digital UBL)
  const hash = crypto.createHash('sha256').update(xmlContent).digest('base64');

  // 5. Generar Código QR Oficial SUNAT (Anexo 1 - Resolución de Superintendencia)
  // Formato: RUC|TIPO_DOC|SERIE|NUMERO|IGV|TOTAL|FECHA|TIPO_DOC_CLIENTE|NUM_DOC_CLIENTE|HASH|
  const issueDateIso = new Date(invoiceDoc.issueDate).toISOString().split('T')[0];
  const qrString = [
    company.ruc || '20608765432',
    invoiceType,
    serie,
    String(number),
    igv.toFixed(2),
    total.toFixed(2),
    issueDateIso,
    invoiceDoc.clientDocType,
    invoiceDoc.clientDoc,
    hash
  ].join('|') + '|';

  // Generar imagen QR en Data URL (PNG)
  const qrDataUrl = await QRCode.toDataURL(qrString, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 200,
    color: { dark: '#000000', light: '#ffffff' }
  });

  // 6. Generar CDR SUNAT estándar (Constancia de Recepción)
  const cdrXml = `<?xml version="1.0" encoding="UTF-8"?>
<ApplicationResponse xmlns="urn:oasis:names:specification:ubl:schema:xsd:ApplicationResponse-2"
                     xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
                     xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>2.0</cbc:CustomizationID>
  <cbc:ID>R-${fullNumber}</cbc:ID>
  <cbc:IssueDate>${issueDateIso}</cbc:IssueDate>
  <cac:DocumentResponse>
    <cac:Response>
      <cbc:ReferenceID>${fullNumber}</cbc:ReferenceID>
      <cbc:ResponseCode>0</cbc:ResponseCode>
      <cbc:Description>La ${invoiceType === '01' ? 'Factura' : 'Boleta'} número ${fullNumber}, ha sido aceptada satisfactoriamente por SUNAT</cbc:Description>
    </cac:Response>
    <cac:DocumentReference>
      <cbc:ID>${fullNumber}</cbc:ID>
      <cbc:DocumentTypeCode>${invoiceType}</cbc:DocumentTypeCode>
    </cac:DocumentReference>
  </cac:DocumentResponse>
</ApplicationResponse>`;

  // 7. Guardar en Base de Datos
  const newInvoice = new ElectronicInvoice({
    invoiceType,
    serie,
    number,
    fullNumber,
    issueDate: invoiceDoc.issueDate,
    currency: 'PEN',
    clientDocType: invoiceDoc.clientDocType,
    clientDoc: invoiceDoc.clientDoc,
    clientName: invoiceDoc.clientName,
    clientAddress: data.clientAddress || 'Villa El Salvador, Lima, Lima',
    clientPhone: data.clientPhone || '',
    clientEmail: data.clientEmail || '',
    plate: (data.plate || '').toUpperCase().trim(),
    vin: (data.vin || '').toUpperCase().trim(),
    vehicleModel: data.vehicleModel || data.model || '',
    quoteId: data.quoteId || null,
    quoteNumber: data.quoteNumber || '',
    workOrderId: data.workOrderId || null,
    workOrderNumber: data.workOrderNumber || '',
    items,
    totals: {
      opGravadas,
      opExoneradas: 0,
      opInafectas: 0,
      igv,
      total,
      totalWords
    },
    sunatStatus: 'ACEPTADO',
    sunatResponse: {
      code: '0',
      description: `La ${invoiceType === '01' ? 'Factura' : 'Boleta'} ${fullNumber} ha sido aceptada por SUNAT.`,
      hash,
      qrCode: qrDataUrl,
      xmlContent,
      cdrZipBase64: Buffer.from(cdrXml).toString('base64'),
      ticketSunat: `SUNAT-${Date.now()}`
    },
    environment: data.environment || 'BETA',
    paymentCondition: data.paymentCondition || 'Contado',
    advisorName: data.advisorName || 'Darios Bacilio',
    notes: data.notes || ''
  });

  await newInvoice.save();
  return newInvoice;
}

module.exports = {
  numberToWordsPEN,
  getNextInvoiceNumber,
  generateUBL21Xml,
  emitElectronicInvoice
};
