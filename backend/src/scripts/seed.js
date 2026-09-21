require('dotenv').config();
const mongoose = require('mongoose');
const CompanyConfig = require('../models/CompanyConfig');
const CatalogItem = require('../models/CatalogItem');
const Client = require('../models/Client');
const Vehicle = require('../models/Vehicle');
const Quote = require('../models/Quote');

async function seed() {
  try {
    console.log('Conectando a MongoDB para poblar datos...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Conexión exitosa. Limpiando colecciones previas...');

    await Promise.all([
      CompanyConfig.deleteMany({}),
      CatalogItem.deleteMany({}),
      Client.deleteMany({}),
      Vehicle.deleteMany({}),
      Quote.deleteMany({})
    ]);

    // 1. Configuración de Empresa
    console.log('Creando configuración de DARSIL...');
    const company = await CompanyConfig.create({
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

    // 2. Catálogo de Mano de Obra oficial de Darsil
    console.log('Creando catálogo de ítems y mano de obra...');
    const catalogData = [
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
      // Pilares adicionales: Diagnóstico y Fabricación 3D
      { code: 'DG01', description: 'DIAGNÓSTICO ELECTRÓNICO CON SCANNER Y ATENCIÓN A DOMICILIO', category: 'MANO_OBRA', defaultPrice: 150.00 },
      { code: 'DG02', description: 'PROGRAMACIÓN Y CALIBRACIÓN DE MÓDULO ELECTRÓNICO', category: 'MANO_OBRA', defaultPrice: 250.00 },
      { code: '3D01', description: 'DISEÑO CAD E IMPRESIÓN 3D DE SOPORTE / CARCASA PERSONALIZADA', category: 'FABRICACION_3D', defaultPrice: 180.00 },
      { code: '3D02', description: 'FABRICACIÓN DE CLIPS Y PIEZA DESCONTINUADA EN POLÍMERO TÉCNICO', category: 'FABRICACION_3D', defaultPrice: 90.00 }
    ];

    await CatalogItem.insertMany(catalogData);

    // 3. Cliente y Vehículo de la plantilla
    console.log('Creando cliente y vehículo demo...');
    const client = await Client.create({
      docType: 'RUC',
      docNumber: '20608765432',
      name: 'FR & Cars Maquinarias S.A.C',
      contactPerson: 'Joel Cordova',
      phone: '970830502',
      address: 'Av Los Forestales MZ I1, Villa EL Salvador 15842',
      city: 'Lima'
    });

    const vehicle = await Vehicle.create({
      clientId: client._id,
      plate: 'ABG890',
      vin: 'unidad 1056',
      brand: 'CAMC',
      model: 'Camc Mixer'
    });

    // 4. Cotización Oficial DA-2026-018 (Plantilla 2)
    console.log('Creando cotización DA-2026-018 (Taller Detallado)...');
    const itemsDA018 = [
      { code: 'MO01', description: 'INSTALACIÓN DE RELÉ DE ARRANQUE', quantity: 1, unitPrice: 50.00, value: 50.00 },
      { code: 'MO02', description: 'INSTALACIÓN DE BLOQUE ELECTROVÁLVULAS', quantity: 1, unitPrice: 100.00, value: 100.00 },
      { code: 'MO03', description: 'INSTALACIÓN DE CORTACORRIENTE', quantity: 1, unitPrice: 70.00, value: 70.00 },
      { code: 'MO04', description: 'INSTALACIÓN DE MANGUERA CORRUGADA', quantity: 1, unitPrice: 40.00, value: 40.00 },
      { code: 'MO05', description: 'INSTALACIÓN DE BASE CAJA DE FUSIBLES', quantity: 1, unitPrice: 250.00, value: 250.00 },
      { code: 'MO06', description: 'INSTALACIÓN DE FUSIBLES DE 10-515-20', quantity: 1, unitPrice: 20.00, value: 20.00 },
      { code: 'MO07', description: 'INSTALACIÓN DE PORTA RELÉ', quantity: 1, unitPrice: 30.00, value: 30.00 },
      { code: 'MO08', description: 'INSTLACIÓN DE PORTA FUSIBLE', quantity: 1, unitPrice: 30.00, value: 30.00 },
      { code: 'MO09', description: 'INSTALACIÓN DE RELÉ', quantity: 1, unitPrice: 20.00, value: 20.00 },
      { code: 'MO10', description: 'INSTALACION DE TERMINAL DE OJO', quantity: 1, unitPrice: 10.00, value: 10.00 },
      { code: 'MO11', description: 'INSTALACIÓN DE INTERRUPTOR DE PUERTA ON/OFF', quantity: 1, unitPrice: 30.00, value: 30.00 },
      { code: 'MO12', description: 'INSTALACIÓN DE HORÓMETRO', quantity: 1, unitPrice: 200.00, value: 200.00 },
      { code: 'MO13', description: 'INSTALACIÓN DE FAROS LED LATERALES', quantity: 2, unitPrice: 20.00, value: 40.00 },
      { code: 'MO14', description: 'INSTALACIÓN DE FAROS POSTERIORES REDONDOS LH Y RH', quantity: 6, unitPrice: 20.00, value: 120.00 },
      { code: 'MO15', description: 'INSTALACIÓN DE FARO PIRATA', quantity: 1, unitPrice: 50.00, value: 50.00 },
      { code: 'MO16', description: 'INSTALACIÓN DE FARO DE CABINA + CONECTOR', quantity: 1, unitPrice: 40.00, value: 40.00 },
      { code: 'MO17', description: 'INSTALACIÓN DE CLAXON DE AIRE', quantity: 1, unitPrice: 70.00, value: 70.00 },
      { code: 'MO18', description: 'INSTALACIÓN DE CLAXON ELÉCTRICO', quantity: 1, unitPrice: 30.00, value: 30.00 },
      { code: 'MO19', description: 'INSTALACIÓN DE BOTON DE CLAXON', quantity: 1, unitPrice: 20.00, value: 20.00 },
      { code: 'MO20', description: 'INSTALACIÓN DE BOTONERA ELEVALUNAS RH/LH', quantity: 1, unitPrice: 60.00, value: 60.00 },
      { code: 'MO21', description: 'INSTALACION DE ROCIADOR DE AGUA', quantity: 1, unitPrice: 20.00, value: 20.00 }
    ];

    const totalDA018 = itemsDA018.reduce((acc, item) => acc + item.value, 0); // 1300.00

    await Quote.create({
      quoteNumber: 'DA-2026-018',
      templateType: 'TALLER_DETALLADO',
      status: 'APROBADA',
      clientId: client._id,
      clientName: client.name,
      clientDoc: client.docNumber,
      clientAddress: client.address,
      clientPhone: client.phone,
      vehicleId: vehicle._id,
      plate: vehicle.plate,
      vin: vehicle.vin,
      model: vehicle.model,
      orderType: 'Taller de Servicios',
      referencePerson: 'Joel Cordova',
      advisorName: 'Darios Bacilio',
      advisorPhone: '934787006',
      issueDate: new Date('2026-09-16'),
      validUntil: new Date('2026-10-01'),
      items: itemsDA018,
      subtotal: totalDA018,
      total: totalDA018,
      currency: 'PEN',
      bankAccountsSnapshot: company.bankAccounts,
      paymentCondition: 'Condición de pago 07 días despues de realizar el servicio.',
      notes: 'Nota: Cotización válida por 15 días hábiles desde su emisión.'
    });

    // 5. Cotización DA-2026-017 (Plantilla 1: Proyecto / Flota Trujillo)
    console.log('Creando cotización DA-2026-017 (Proyecto Especial)...');
    await Quote.create({
      quoteNumber: 'DA-2026-017',
      templateType: 'PROYECTO_ESPECIAL',
      status: 'ENVIADA',
      clientId: client._id,
      clientName: client.name,
      clientDoc: client.docNumber,
      clientAddress: 'Trujillo',
      location: 'Trujillo',
      commissionDays: '4 días',
      referencePerson: 'Joel Cordova',
      advisorName: 'Darios Bacilio',
      advisorPhone: '934787006',
      issueDate: new Date('2026-09-16'),
      validUntil: new Date('2026-10-01'),
      projectObject: 'Instalación de sesnores y validación de funcionamiento.',
      fleetUnits: [
        { unitType: 'Bus 12 m', quantity: 9, itemsPerUnit: 7, totalItems: 63 },
        { unitType: 'Bus 9 m', quantity: 7, itemsPerUnit: 5, totalItems: 35 }
      ],
      items: [
        { description: 'Instalación 7 sensores – bus 12 m', quantity: 1, unitPrice: 3900.00, value: 3900.00 },
        { description: 'Instalación 5 sensores – bus 9 m', quantity: 1, unitPrice: 2200.00, value: 2200.00 },
        { description: 'Servicio de campo', quantity: 1, unitPrice: 1150.00, value: 1150.00 }
      ],
      executionTime: 'Se considera una comisión de 4 días de trabajo en Trujillo. Como referencia de programación: 4 días para atender las 16 unidades, sujeto a disponibilidad de los buses, acceso a los puntos de instalación y condiciones del ramal.',
      includes: [
        'Mano de obra especializada para instalación y prueba de los sensores.',
        'Los sensores y accesorios de instalación serán proporcionados por el cliente.'
      ],
      notIncludes: [
        'No incluye reparación o fabricación de ramales, conectores dañados ni diagnóstico de fallas preexistentes.',
        'No incluye trabajos adicionales no contemplados en el instructivo técnico.',
        'El cliente deberá garantizar disponibilidad y acceso a las unidades durante la jornada.'
      ],
      commercialConditions: [
        'Validez de la cotización: 15 días calendario.',
        'Forma de pago propuesta: 50% de adelanto para programación y traslado; 50% contra culminación.',
        'Los trabajos adicionales serán previamente informados y cotizados.',
        'Importes expresados en soles (S/).'
      ],
      subtotal: 7250.00,
      total: 7250.00,
      currency: 'PEN',
      bankAccountsSnapshot: company.bankAccounts
    });

    console.log('¡Seeding completado con éxito en darsil_db!');
    process.exit(0);
  } catch (error) {
    console.error('Error durante el seed:', error);
    process.exit(1);
  }
}

seed();
