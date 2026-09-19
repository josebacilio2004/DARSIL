require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const connectDB = require('./config');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 4000;

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(morgan('dev'));

// Static uploads (PDFs generados e imágenes)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/public', express.static(path.join(__dirname, '../public')));

// Rutas de API
app.use('/api', apiRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'DARSIL Automotive Solutions API', time: new Date() });
});

const { initializeSystemDefaults } = require('./services/initService');

// Iniciar servidor
connectDB().then(async () => {
  await initializeSystemDefaults();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`====================================================`);
    console.log(`⚡ DARSIL API corriendo en: http://localhost:${PORT}`);
    console.log(`⚡ Health Check: http://localhost:${PORT}/health`);
    console.log(`⚡ API Cotizaciones: http://localhost:${PORT}/api/quotes`);
    console.log(`====================================================`);
  });
}).catch(err => {
  console.error('No se pudo inicializar la aplicación:', err);
});
