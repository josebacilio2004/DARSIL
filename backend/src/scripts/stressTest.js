/**
 * DARSIL ERP AUTOMOTRIZ - Script de Pruebas de Estrés & Validación de Reglas Vehiculares (Perú)
 * 
 * Evalúa:
 * 1. Concurrencia masiva sin caídas de servidor (Resiliencia & Zero-Crash)
 * 2. Generación atómica secuencial de OT y Cotizaciones sin colisión E11000
 * 3. Regla peruana de placa única: 1 Placa = 1 Único Vehículo / Modelo
 * 4. Bloqueo de modelos discordantes y compatibilidad con retornos de taller
 */

const BASE_URL = process.env.API_URL || 'http://localhost:4000/api';
const HEALTH_URL = (process.env.API_URL || 'http://localhost:4000').replace('/api', '') + '/health';

async function fetchJson(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

async function runStressAndValidationSuite() {
  console.log('================================================================');
  console.log('  DARSIL ERP - SUITE DE ESTRÉS Y VALIDACIÓN VEHICULAR (PERÚ)   ');
  console.log('================================================================');
  console.log(`Target API: ${BASE_URL}`);
  console.log(`Timestamp: ${new Date().toISOString()}\n`);

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  // -------------------------------------------------------------
  // PASO 1: VERIFICACIÓN DE ESTADO INICIAL DEL SERVIDOR
  // -------------------------------------------------------------
  console.log('▶ [FASE 1] Verificando salud inicial del servidor...');
  totalTests++;
  try {
    const health = await fetchJson(HEALTH_URL);
    if (health.ok && health.data?.status === 'ok') {
      console.log('  ✔ Servidor DARSIL en línea y saludable (200 OK)');
      passedTests++;
    } else {
      console.error('  ✖ Servidor no respondió en /health:', health);
      failedTests++;
    }
  } catch (err) {
    console.error('  ✖ Error conectando al servidor:', err.message);
    failedTests++;
  }

  // -------------------------------------------------------------
  // PASO 2: PRUEBA DE ESTRÉS - 50 ÓRDENES DE TRABAJO CONCURRENTES
  // -------------------------------------------------------------
  console.log('\n▶ [FASE 2] Prueba de Estrés: Creación masiva concurrente de 50 Órdenes de Trabajo...');
  const burstOtCount = 50;
  const otBatchId = Date.now().toString().slice(-5);
  const otPromises = [];

  for (let i = 1; i <= burstOtCount; i++) {
    const plateNum = String(100 + i);
    const payload = {
      clientDoc: `2060${otBatchId}${String(i).padStart(2, '0')}`,
      clientName: `Empresa de Transporte Estrés S.A.C. #${i}`,
      clientPhone: `999${otBatchId}`,
      clientAddress: 'Villa El Salvador, Lima, Lima',
      plate: `EST-${plateNum}`,
      model: `Volvo FH 540 Concurrente #${i}`,
      vehicleType: 'TRACTOCAMION',
      reportedFault: 'Inspección de sobrecarga y pruebas de alta presión',
      status: 'DESPACHADO',
      travelCost: 150 + i
    };
    otPromises.push(
      fetchJson(`${BASE_URL}/work-orders`, {
        method: 'POST',
        body: JSON.stringify(payload)
      }).then(res => ({ index: i, ...res }))
    );
  }

  totalTests++;
  const otResults = await Promise.all(otPromises);
  const otSuccesses = otResults.filter(r => r.ok && r.data?.success);
  const otOrderNumbers = otSuccesses.map(r => r.data?.data?.orderNumber).filter(Boolean);
  const uniqueOtNumbers = new Set(otOrderNumbers);

  if (otSuccesses.length === burstOtCount && uniqueOtNumbers.size === burstOtCount) {
    console.log(`  ✔ ÉXITO TOTAL: ${otSuccesses.length}/${burstOtCount} OTs generadas concurrentemente sin colisiones.`);
    console.log(`  ✔ Números de OT atómicos generados (Rango: ${otOrderNumbers[0]} ... ${otOrderNumbers[otOrderNumbers.length - 1]})`);
    passedTests++;
  } else {
    console.error(`  ✖ Fallo en concurrencia OT: ${otSuccesses.length}/${burstOtCount} exitosas. Duplicados: ${burstOtCount - uniqueOtNumbers.size}`);
    failedTests++;
  }

  // -------------------------------------------------------------
  // PASO 3: PRUEBA DE ESTRÉS - 50 COTIZACIONES CONCURRENTES
  // -------------------------------------------------------------
  console.log('\n▶ [FASE 3] Prueba de Estrés: Creación masiva concurrente de 50 Cotizaciones...');
  const burstQuoteCount = 50;
  const quotePromises = [];

  for (let i = 1; i <= burstQuoteCount; i++) {
    const plateNum = String(300 + i);
    const payload = {
      templateType: 'TALLER_DETALLADO',
      clientDoc: `2070${otBatchId}${String(i).padStart(2, '0')}`,
      clientName: `Cliente Corporativo Minero #${i}`,
      clientAddress: 'Villa El Salvador, Lima, Lima',
      plate: `COT-${plateNum}`,
      model: `Scania R500 V8 Heavy #${i}`,
      advisorName: 'Darios Bacilio',
      items: [
        { code: 'SRV-01', description: 'Mantenimiento Preventivo 50,000 KM', quantity: 1, unitPrice: 850.00, value: 850.00 },
        { code: 'REP-01', description: 'Juego de Filtros Diésel Heavy Duty', quantity: 2, unitPrice: 320.00, value: 640.00 }
      ]
    };
    quotePromises.push(
      fetchJson(`${BASE_URL}/quotes`, {
        method: 'POST',
        body: JSON.stringify(payload)
      }).then(res => ({ index: i, ...res }))
    );
  }

  totalTests++;
  const quoteResults = await Promise.all(quotePromises);
  const quoteSuccesses = quoteResults.filter(r => r.ok && r.data?.success);
  const quoteNumbers = quoteSuccesses.map(r => r.data?.data?.quoteNumber).filter(Boolean);
  const uniqueQuoteNumbers = new Set(quoteNumbers);

  if (quoteSuccesses.length === burstQuoteCount && uniqueQuoteNumbers.size === burstQuoteCount) {
    console.log(`  ✔ ÉXITO TOTAL: ${quoteSuccesses.length}/${burstQuoteCount} Cotizaciones creadas concurrentemente.`);
    console.log(`  ✔ Números de Cotización atómicos generados (Rango: ${quoteNumbers[0]} ... ${quoteNumbers[quoteNumbers.length - 1]})`);
    passedTests++;
  } else {
    console.error(`  ✖ Fallo en concurrencia Cotizaciones: ${quoteSuccesses.length}/${burstQuoteCount} exitosas.`);
    failedTests++;
  }

  // -------------------------------------------------------------
  // PASO 4: VALIDACIÓN DE REGLA PERUANA DE PLACA ÚNICA
  // -------------------------------------------------------------
  console.log('\n▶ [FASE 4] Pruebas de Integridad Vehicular (1 Placa = 1 Solo Auto en Perú)...');
  const testPlate = `ABC-${Date.now().toString().slice(-3)}`;
  const registeredModel = 'Toyota Hilux 4x4 Doble Cabina';
  const conflictingModel = 'Nissan Sentra 2.0 Advance';

  // 4.1 Crear vehículo legítimo
  totalTests++;
  console.log(`  • Registrando unidad vehicular oficial con Placa ${testPlate} y Modelo "${registeredModel}"...`);
  const regRes = await fetchJson(`${BASE_URL}/work-orders`, {
    method: 'POST',
    body: JSON.stringify({
      clientDoc: '20601234567',
      clientName: 'Transportes TransMar S.A.C.',
      plate: testPlate,
      model: registeredModel,
      vehicleType: 'CAMIONETA_PICKUP',
      status: 'DESPACHADO'
    })
  });

  if (regRes.ok && regRes.data?.success) {
    console.log('    ✔ Vehículo y OT registrados correctamente.');
    passedTests++;
  } else {
    console.error('    ✖ Error registrando vehículo base:', regRes);
    failedTests++;
  }

  // 4.2 Intentar registrar la MISMA placa pero con OTRO modelo
  totalTests++;
  console.log(`  • Intentando registrar la misma Placa ${testPlate} con un MODELO DISTINTO ("${conflictingModel}")...`);
  const conflictRes = await fetchJson(`${BASE_URL}/work-orders`, {
    method: 'POST',
    body: JSON.stringify({
      clientDoc: '20609999999',
      clientName: 'Otro Cliente Distinto',
      plate: testPlate,
      model: conflictingModel,
      vehicleType: 'SEDAN_AUTO'
    })
  });

  if (!conflictRes.ok && conflictRes.status === 400 && conflictRes.data?.code === 'PLATE_MODEL_MISMATCH') {
    console.log(`    ✔ BLOQUEO EXITOSO (HTTP 400): ${conflictRes.data.message}`);
    passedTests++;
  } else {
    console.error('    ✖ FALLA DE SEGURIDAD: El sistema permitió guardar un modelo falso para la placa:', conflictRes);
    failedTests++;
  }

  // 4.3 Intentar en Cotizaciones registrar la MISMA placa con modelo discordante
  totalTests++;
  console.log(`  • Intentando crear Cotización con la misma Placa ${testPlate} y MODELO DISTINTO ("Hyundai Elantra GLS")...`);
  const quoteConflictRes = await fetchJson(`${BASE_URL}/quotes`, {
    method: 'POST',
    body: JSON.stringify({
      clientName: 'Cliente Intento Invalido',
      plate: testPlate,
      model: 'Hyundai Elantra GLS',
      items: [{ code: 'MO-01', description: 'Servicio', quantity: 1, unitPrice: 100, value: 100 }]
    })
  });

  if (!quoteConflictRes.ok && quoteConflictRes.status === 400 && quoteConflictRes.data?.code === 'PLATE_MODEL_MISMATCH') {
    console.log(`    ✔ BLOQUEO EN COTIZACIONES EXITOSO (HTTP 400): ${quoteConflictRes.data.message}`);
    passedTests++;
  } else {
    console.error('    ✖ FALLA EN COTIZACIÓN: Se permitió modelo discordante:', quoteConflictRes);
    failedTests++;
  }

  // 4.4 Registrar la MISMA placa con el MISMO modelo (Vehículo que regresa a mantenimiento)
  totalTests++;
  console.log(`  • Registrando segundo servicio para el mismo auto legítimo (Placa ${testPlate}, Modelo "${registeredModel.toUpperCase()}")...`);
  const legitimateReturnRes = await fetchJson(`${BASE_URL}/work-orders`, {
    method: 'POST',
    body: JSON.stringify({
      clientDoc: '20601234567',
      clientName: 'Transportes TransMar S.A.C.',
      plate: testPlate,
      model: registeredModel.toUpperCase(),
      vehicleType: 'CAMIONETA_PICKUP',
      reportedFault: 'Cambio de pastillas de freno en segundo mantenimiento'
    })
  });

  if (legitimateReturnRes.ok && legitimateReturnRes.data?.success) {
    console.log('    ✔ Retorno legítimo aceptado sin falsos positivos.');
    passedTests++;
  } else {
    console.error('    ✖ Error en retorno de vehículo legítimo:', legitimateReturnRes);
    failedTests++;
  }

  // 4.5 Endpoint de Validación en Vivo (GET /api/vehicles/validate-plate)
  totalTests++;
  console.log('  • Comprobando endpoint de validación en tiempo real para el frontend...');
  const liveCheck = await fetchJson(`${BASE_URL}/vehicles/validate-plate?plate=${encodeURIComponent(testPlate)}&model=${encodeURIComponent('Modelo Incorrecto')}`);
  if (liveCheck.ok && liveCheck.data?.success && liveCheck.data?.valid === false) {
    console.log(`    ✔ Endpoint de validación en tiempo real funcionando: detectó conflicto para "${testPlate}".`);
    passedTests++;
  } else {
    console.error('    ✖ Falla en endpoint de validación:', liveCheck);
    failedTests++;
  }

  // -------------------------------------------------------------
  // PASO 5: VERIFICACIÓN FINAL DE INTEGRIDAD Y CERO CAÍDAS
  // -------------------------------------------------------------
  console.log('\n▶ [FASE 5] Verificando estabilidad final del servidor (Zero-Crash Guarantee)...');
  totalTests++;
  try {
    const finalHealth = await fetchJson(HEALTH_URL);
    if (finalHealth.ok && finalHealth.data?.status === 'ok') {
      console.log('  ✔ Servidor DARSIL sigue 100% operativo tras 100+ peticiones concurrentes y pruebas de fallo inducido.');
      passedTests++;
    } else {
      console.error('  ✖ Servidor no respondió al final de las pruebas:', finalHealth);
      failedTests++;
    }
  } catch (err) {
    console.error('  ✖ Servidor caído o inaccesible tras las pruebas:', err.message);
    failedTests++;
  }

  // -------------------------------------------------------------
  // RESUMEN FINAL
  // -------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`  RESUMEN: ${passedTests}/${totalTests} Pruebas Aprobadas (${((passedTests / totalTests) * 100).toFixed(1)}%)`);
  if (failedTests === 0) {
    console.log('  ESTADO: SISTEMA RESILIENTE Y TOTALMENTE VALIDADO CONFORME A PERÚ');
  } else {
    console.log(`  ESTADO: ${failedTests} PRUEBAS REQUIRIERON ATENCIÓN`);
  }
  console.log('================================================================\n');

  if (failedTests > 0) process.exit(1);
}

runStressAndValidationSuite().catch(err => {
  console.error('Error fatal durante la ejecución de la suite:', err);
  process.exit(1);
});
