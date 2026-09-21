const CatalogItem = require('../models/CatalogItem');
const CompanyConfig = require('../models/CompanyConfig');
const User = require('../models/User');
const WorkOrder = require('../models/WorkOrder');
const Quote = require('../models/Quote');

const OFFICIAL_CATALOG = [
  { code: 'MO01', description: 'INSTALACIÓN DE RELÉ DE ARRANQUE', category: 'MANO_OBRA', defaultPrice: 50.00 },
  { code: 'MO02', description: 'INSTALACIÓN DE BLOQUE ELECTROVÁLVULAS', category: 'MANO_OBRA', defaultPrice: 100.00 },
  { code: 'MO03', description: 'INSTALACIÓN DE CORTACORRIENTE', category: 'MANO_OBRA', defaultPrice: 70.00 },
  { code: 'MO04', description: 'INSTALACIÓN DE MANGUERA CORRUGADA', category: 'MANO_OBRA', defaultPrice: 40.00 },
  { code: 'MO05', description: 'INSTALACIÓN DE BASE CAJA DE FUSIBLES', category: 'MANO_OBRA', defaultPrice: 250.00 },
  { code: 'MO06', description: 'INSTALACIÓN DE FUSIBLES DE 10-515-20', category: 'MANO_OBRA', defaultPrice: 20.00 },
  { code: 'MO07', description: 'INSTALACIÓN DE PORTA RELÉ', category: 'MANO_OBRA', defaultPrice: 30.00 },
  { code: 'MO08', description: 'INSTLACIÓN DE PORTA FUSIBLE', category: 'MANO_OBRA', defaultPrice: 30.00 },
  { code: 'MO09', description: 'INSTALACIÓN DE RELÉ', category: 'MANO_OBRA', defaultPrice: 20.00 },
  { code: 'MO10', description: 'INSTALACION DE TERMINAL DE OJO', category: 'MANO_OBRA', defaultPrice: 10.00 },
  { code: 'MO11', description: 'INSTALACIÓN DE INTERRUPTOR DE PUERTA ON/OFF', category: 'MANO_OBRA', defaultPrice: 30.00 },
  { code: 'MO12', description: 'INSTALACIÓN DE HORÓMETRO', category: 'MANO_OBRA', defaultPrice: 200.00 },
  { code: 'MO13', description: 'INSTALACIÓN DE FAROS LED LATERALES', category: 'MANO_OBRA', defaultPrice: 20.00 },
  { code: 'MO14', description: 'INSTALACIÓN DE FAROS POSTERIORES REDONDOS LH Y RH', category: 'MANO_OBRA', defaultPrice: 20.00 },
  { code: 'MO15', description: 'INSTALACIÓN DE FARO PIRATA', category: 'MANO_OBRA', defaultPrice: 50.00 },
  { code: 'MO16', description: 'INSTALACIÓN DE FARO DE CABINA + CONECTOR', category: 'MANO_OBRA', defaultPrice: 40.00 },
  { code: 'MO17', description: 'INSTALACIÓN DE CLAXON DE AIRE', category: 'MANO_OBRA', defaultPrice: 70.00 },
  { code: 'MO18', description: 'INSTALACIÓN DE CLAXON ELÉCTRICO', category: 'MANO_OBRA', defaultPrice: 30.00 },
  { code: 'MO19', description: 'INSTALACIÓN DE BOTON DE CLAXON', category: 'MANO_OBRA', defaultPrice: 20.00 },
  { code: 'MO20', description: 'INSTALACIÓN DE BOTONERA ELEVALUNAS RH/LH', category: 'MANO_OBRA', defaultPrice: 60.00 },
  { code: 'MO21', description: 'INSTALACION DE ROCIADOR DE AGUA', category: 'MANO_OBRA', defaultPrice: 20.00 },
  { code: 'DG01', description: 'DIAGNÓSTICO ELECTRÓNICO CON SCANNER Y ATENCIÓN A DOMICILIO', category: 'MANO_OBRA', defaultPrice: 150.00 },
  { code: 'DG02', description: 'PROGRAMACIÓN Y CALIBRACIÓN DE MÓDULO ELECTRÓNICO', category: 'MANO_OBRA', defaultPrice: 250.00 },
  { code: '3D01', description: 'DISEÑO CAD E IMPRESIÓN 3D DE SOPORTE / CARCASA PERSONALIZADA', category: 'FABRICACION_3D', defaultPrice: 180.00 },
  { code: '3D02', description: 'FABRICACIÓN DE CLIPS Y PIEZA DESCONTINUADA EN POLÍMERO TÉCNICO', category: 'FABRICACION_3D', defaultPrice: 90.00 }
];

async function initializeSystemDefaults() {
  try {
    console.log('🔄 Verificando datos iniciales del sistema DARSIL...');

    // 1. Catálogo de Mano de Obra
    const catalogCount = await CatalogItem.countDocuments();
    if (catalogCount === 0) {
      console.log('📦 Poblando catálogo oficial de servicios (MO01-MO21, DG, 3D)...');
      await CatalogItem.insertMany(OFFICIAL_CATALOG);
      console.log('✅ Catálogo poblado con éxito.');
    }

    // 2. Configuración de Empresa y Cuentas Bancarias
    const companyCount = await CompanyConfig.countDocuments();
    if (companyCount === 0) {
      console.log('🏢 Creando configuración inicial de la empresa DARSIL...');
      await CompanyConfig.create({
        name: 'DARSIL AUTOMOTIVE SOLUTIONS',
        slogan: 'TECNOLOGÍA • DIAGNÓSTICO • INGENIERÍA • INNOVACIÓN',
        tagline: 'Soluciones Tecnológicas para la Industria Automotriz',
        phones: ['934787006'],
        emails: ['rubenbasil24@gmail.com'],
        coverage: 'Lima y alrededores / Cobertura a nivel nacional',
        bankAccounts: [
          {
            bank: 'SCOTIABANK',
            accountType: 'CTA CTE',
            accountNumber: '0747668929',
            interbankAccount: '925120074766892000'
          },
          {
            bank: 'INTERBANK',
            accountType: 'CTA CTE',
            accountNumber: '8983510612681',
            interbankAccount: '389801351061268000'
          }
        ]
      });
      console.log('✅ Configuración de empresa creada.');
    }

    // 3. Usuario Administrador: Darios Bacilio
    let admin = await User.findOne({ username: 'darios' });
    if (!admin) {
      console.log('👤 Creando cuenta de administrador para Darios Bacilio...');
      admin = new User({
        name: 'Darios Bacilio',
        username: 'darios',
        email: 'darios.bacilio@darsil.com',
        role: 'ADMIN'
      });
    }
    admin.setPassword('DarioBacilio#2026*Darsil');
    await admin.save();
    console.log('✅ Usuario Darios Bacilio sincronizado con contraseña segura.');

    // 4. Normalización automática de Asesor Técnico a Darios Bacilio en BD
    try {
      await WorkOrder.updateMany(
        { assignedMechanic: { $regex: /Basil/i } },
        { $set: { assignedMechanic: 'Darios Bacilio' } }
      );
      await WorkOrder.updateMany(
        { 'tasks.mechanic': { $regex: /Basil/i } },
        { $set: { 'tasks.$[elem].mechanic': 'Darios Bacilio' } },
        { arrayFilters: [{ 'elem.mechanic': { $regex: /Basil/i } }] }
      );
      await Quote.updateMany(
        { advisorName: { $regex: /Basil/i } },
        { $set: { advisorName: 'Darios Bacilio' } }
      );
      console.log('✅ Asesor técnico normalizado a Darios Bacilio en órdenes y cotizaciones.');
    } catch (migErr) {
      console.log('Nota normalización asesor:', migErr.message);
    }


  } catch (err) {
    console.error('⚠️ Advertencia en initializeSystemDefaults:', err.message);
  }
}

module.exports = {
  initializeSystemDefaults,
  OFFICIAL_CATALOG
};
