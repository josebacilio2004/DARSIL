const Counter = require('../models/Counter');
const WorkOrder = require('../models/WorkOrder');
const Quote = require('../models/Quote');

/**
 * Obtiene el siguiente correlativo atómico para Órdenes de Trabajo (ej. OT-2026-001)
 * Seguro contra colisiones en peticiones simultáneas concurrentes (Pruebas de estrés).
 */
async function getNextAtomicOrderNumber() {
  const currentYear = new Date().getFullYear();
  const counterId = `workOrder_${currentYear}`;
  const prefix = `OT-${currentYear}-`;

  // Asegurar que el contador esté sincronizado al menos con el número más alto en la base de datos
  const existingCounter = await Counter.findById(counterId);
  if (!existingCounter) {
    const lastOrder = await WorkOrder.findOne({ orderNumber: new RegExp(`^${prefix}`) })
      .sort({ orderNumber: -1 });

    let initialSeq = 0;
    if (lastOrder && lastOrder.orderNumber) {
      const match = lastOrder.orderNumber.match(/(\d+)$/);
      if (match) initialSeq = parseInt(match[1], 10);
    }

    await Counter.findByIdAndUpdate(
      counterId,
      { $setOnInsert: { seq: initialSeq } },
      { upsert: true, new: true }
    );
  }

  // Incremento atómico MongoDB garantizado libre de colisiones concurrentes
  const counter = await Counter.findByIdAndUpdate(
    counterId,
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  );

  return `${prefix}${String(counter.seq).padStart(3, '0')}`;
}

/**
 * Obtiene el siguiente correlativo atómico para Cotizaciones (ej. DA-2026-001)
 * Seguro contra colisiones en peticiones simultáneas concurrentes (Pruebas de estrés).
 */
async function getNextAtomicQuoteNumber() {
  const currentYear = new Date().getFullYear();
  const counterId = `quote_${currentYear}`;
  const prefix = `DA-${currentYear}-`;

  const existingCounter = await Counter.findById(counterId);
  if (!existingCounter) {
    const lastQuote = await Quote.findOne({ quoteNumber: new RegExp(`^${prefix}`) })
      .sort({ quoteNumber: -1 });

    let initialSeq = 0;
    if (lastQuote && lastQuote.quoteNumber) {
      const match = lastQuote.quoteNumber.match(/(\d+)$/);
      if (match) initialSeq = parseInt(match[1], 10);
    }

    await Counter.findByIdAndUpdate(
      counterId,
      { $setOnInsert: { seq: initialSeq } },
      { upsert: true, new: true }
    );
  }

  const counter = await Counter.findByIdAndUpdate(
    counterId,
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  );

  return `${prefix}${String(counter.seq).padStart(3, '0')}`;
}

module.exports = {
  getNextAtomicOrderNumber,
  getNextAtomicQuoteNumber
};
