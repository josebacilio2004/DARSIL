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
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));
app.options('*', cors());
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

// Manejo global de errores de Express
app.use((err, req, res, next) => {
  console.error('Error en petición Express (Servidor protegido):', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Error interno del servidor DARSIL'
  });
});

// Protección contra caídas del proceso Node.js bajo estrés y ráfagas masivas
process.on('unhandledRejection', (reason) => {
  console.warn('Protección activa: Rechazo asíncrono capturado sin interrupción del servidor:', reason?.message || reason);
});

process.on('uncaughtException', (err) => {
  console.warn('Protección activa: Excepción capturada sin interrupción del servidor:', err?.message || err);
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
