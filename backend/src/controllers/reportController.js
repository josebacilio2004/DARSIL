const Quote = require('../models/Quote');

// GET /api/reports/executive
exports.getExecutiveStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = {};

    if (startDate || endDate) {
      filter.issueDate = {};
      if (startDate) filter.issueDate.$gte = new Date(startDate);
      if (endDate) filter.issueDate.$lte = new Date(endDate);
    }

    const quotes = await Quote.find(filter).sort({ issueDate: -1 });

    let totalQuoted = 0;
    let totalApproved = 0;
    let totalIgv = 0;
    let approvedCount = 0;
    let draftCount = 0;
    let inWorkshopCount = 0;

    const clientTotals = {};
    const serviceDemand = {};
    const monthlyStats = {};

    quotes.forEach(q => {
      const tot = Number(q.total) || 0;
      const sub = Number(q.subtotal) || 0;
      const igv = Number(q.igv) || 0;

      totalQuoted += tot;
      totalIgv += igv;

      if (q.status === 'APROBADA' || q.status === 'FACTURADA') {
        totalApproved += tot;
        approvedCount++;
      } else if (q.status === 'EN_TALLER') {
        totalApproved += tot;
        inWorkshopCount++;
      } else if (q.status === 'BORRADOR') {
        draftCount++;
      }

      // Cliente
      const cName = q.clientName || 'Cliente Particular';
      clientTotals[cName] = (clientTotals[cName] || 0) + tot;

      // Servicios
      (q.items || []).forEach(item => {
        const desc = item.description || item.code || 'Servicio';
        serviceDemand[desc] = (serviceDemand[desc] || 0) + (Number(item.quantity) || 1);
      });

      // Mes
      const d = q.issueDate ? new Date(q.issueDate) : new Date(q.createdAt);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyStats[monthKey]) {
        monthlyStats[monthKey] = { month: monthKey, total: 0, count: 0 };
      }
      monthlyStats[monthKey].total += tot;
      monthlyStats[monthKey].count += 1;
    });

    // Top 5 Clientes
    const topClients = Object.entries(clientTotals)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    // Top 5 Servicios
    const topServices = Object.entries(serviceDemand)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Tendencia mensual ordenada
    const monthlyTrend = Object.values(monthlyStats).sort((a, b) => a.month.localeCompare(b.month));

    const totalCount = quotes.length;
    const approvalRate = totalCount > 0 ? ((approvedCount + inWorkshopCount) / totalCount) * 100 : 0;
    const averageTicket = totalCount > 0 ? totalQuoted / totalCount : 0;

    res.json({
      success: true,
      data: {
        summary: {
          totalQuoted,
          totalApproved,
          totalIgv,
          totalCount,
          approvedCount,
          draftCount,
          inWorkshopCount,
          approvalRate: Number(approvalRate.toFixed(1)),
          averageTicket: Number(averageTicket.toFixed(2))
        },
        topClients,
        topServices,
        monthlyTrend
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/reports/export-csv
exports.exportQuotesCsv = async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;
    const filter = {};

    if (startDate || endDate) {
      filter.issueDate = {};
      if (startDate) filter.issueDate.$gte = new Date(startDate);
      if (endDate) filter.issueDate.$lte = new Date(endDate);
    }
    if (status) filter.status = status;

    const quotes = await Quote.find(filter).sort({ issueDate: -1 });

    // Cabecera CSV Contable para Sunat / Excel
    const headers = [
      'Fecha Emision',
      'N° Cotizacion',
      'Estado',
      'RUC / DNI',
      'Cliente / Razon Social',
      'Placa Vehicular',
      'Modelo / Unidad',
      'Subtotal (S/)',
      'IGV 18% (S/)',
      'Total Cotizado (S/)',
      'Plazo Entrega',
      'Asesor Responsable'
    ];

    const rows = quotes.map(q => {
      const issueDateStr = q.issueDate ? new Date(q.issueDate).toISOString().split('T')[0] : '';
      const clientDoc = `"${(q.clientDoc || '').replace(/"/g, '""')}"`;
      const clientName = `"${(q.clientName || '').replace(/"/g, '""')}"`;
      const plate = `"${(q.plate || '').replace(/"/g, '""')}"`;
      const model = `"${(q.model || '').replace(/"/g, '""')}"`;
      const deliveryTerm = `"${(q.deliveryTerm || '').replace(/"/g, '""')}"`;
      const advisor = `"${(q.advisorName || 'Darios Bacilio').replace(/"/g, '""')}"`;

      return [
        issueDateStr,
        q.quoteNumber,
        q.status,
        clientDoc,
        clientName,
        plate,
        model,
        Number(q.subtotal || 0).toFixed(2),
        Number(q.igv || 0).toFixed(2),
        Number(q.total || 0).toFixed(2),
        deliveryTerm,
        advisor
      ].join(';');
    });

    // Añadir BOM UTF-8 (\uFEFF) para compatibilidad total con Excel en Windows
    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="DARSIL_Reporte_Contable_${Date.now()}.csv"`);
    res.send(csvContent);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
