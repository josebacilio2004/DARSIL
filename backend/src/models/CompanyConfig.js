const mongoose = require('mongoose');

const CompanyConfigSchema = new mongoose.Schema({
  name: { type: String, default: 'DARSIL AUTOMOTIVE SOLUTIONS' },
  slogan: { type: String, default: 'TECNOLOGÍA • DIAGNÓSTICO • INGENIERÍA • INNOVACIÓN' },
  tagline: { type: String, default: 'Soluciones Tecnológicas para la Industria Automotriz' },
  phones: [{ type: String, default: ['934787006'] }],
  emails: [{ type: String, default: ['rubenbasil24@gmail.com'] }],
  coverage: { type: String, default: 'Lima y alrededores / Cobertura nacional para comisiones' },
  workshopAddress: { type: String, default: 'Av. Los Forestales MZ I1, Villa El Salvador, Lima, Lima' },
  workshopCity: { type: String, default: 'Lima' },
  workshopCoords: {
    lng: { type: Number, default: -76.9535 },
    lat: { type: Number, default: -12.2085 }
  },
  transportRatePerKm: { type: Number, default: 2.50 }, // Tarifa por km en Soles
  baseTransportFee: { type: Number, default: 35.00 },   // Tarifa base técnica en Soles
  bankAccounts: [
    {
      bank: { type: String, required: true },
      accountType: { type: String, default: 'CTA CTE' },
      accountNumber: { type: String, required: true },
      interbankAccount: { type: String, required: true }
    }
  ],
  logoBase64: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('CompanyConfig', CompanyConfigSchema);
