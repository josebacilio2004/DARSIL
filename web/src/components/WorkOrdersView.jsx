import React, { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { 
  ClipboardList, 
  Plus, 
  Search, 
  CheckCircle2, 
  Clock, 
  Wrench, 
  Truck, 
  BatteryCharging, 
  Fuel, 
  Gauge, 
  Check, 
  X, 
  User, 
  Phone, 
  ShieldAlert, 
  FileText, 
  ExternalLink,
  Edit2,
  Trash2,
  Navigation,
  MapPin,
  Calendar,
  AlertCircle,
  Zap,
  Sparkles,
  Download,
  Car,
  Boxes
} from 'lucide-react';
import { api } from '../services/api';
import InteractiveCarDamage from './InteractiveCarDamage';

const MAPBOX_TOKEN = (import.meta.env && import.meta.env.VITE_MAPBOX_TOKEN) || (typeof atob !== 'undefined' ? atob('cGsuZXlKMUlqb2lhbTl6WldKaFl5SXNJbUVpT2lKamJXOXBZVFUwTVc4d01HTTRNbk52WjNOaE9IbzFOV000SW4wLjVHdzNFLWg2MkR3STRrczVZNzBjRHc=') : '');
mapboxgl.accessToken = MAPBOX_TOKEN;

const DEFAULT_ORIGIN = {
  name: 'Taller Central DARSIL (VES)',
  address: 'Av. Los Forestales MZ I1, Villa El Salvador, Lima',
  coords: [-76.9535, -12.2085]
};

const VEHICLE_TYPES = [
  { id: 'SEDAN_AUTO', label: 'Sedán / Auto Liviano' },
  { id: 'CAMIONETA_SUV', label: 'Camioneta / SUV / Pick-up' },
  { id: 'TRACTO_CAMION', label: 'Tractocamión / Volquete' },
  { id: 'BUS', label: 'Bus Interprovincial / Urbano' },
  { id: 'MAQUINARIA', label: 'Línea Amarilla / Maquinaria' }
];

export default function WorkOrdersView({ onSelectQuote }) {
  const [orders, setOrders] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Modales principales
  const [showDispatchModal, setShowDispatchModal] = useState(false); // Paso 1
  const [showDiagnosticModal, setShowDiagnosticModal] = useState(false); // Paso 2
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeDiagnosticTab, setActiveDiagnosticTab] = useState('damage'); // damage, telemetry, requirements, signature

  // ==========================================
  // ESTADOS FORMULARIO PASO 1: DESPACHO INICIAL
  // ==========================================
  const [dispClientDoc, setDispClientDoc] = useState('');
  const [dispClientName, setDispClientName] = useState('');
  const [dispClientPhone, setDispClientPhone] = useState('');
  const [dispClientAddress, setDispClientAddress] = useState('');
  const [dispDriverName, setDispDriverName] = useState('');
  const [dispDriverPhone, setDispDriverPhone] = useState('');
  const [searchingDoc, setSearchingDoc] = useState(false);

  const [dispPlate, setDispPlate] = useState('');
  const [dispModel, setDispModel] = useState('');
  const [dispVehicleType, setDispVehicleType] = useState('SEDAN_AUTO');
  const [dispColor, setDispColor] = useState('Blanco');
  const [dispYear, setDispYear] = useState(new Date().getFullYear().toString());
  const [dispVin, setDispVin] = useState('');
  const [dispReportedFault, setDispReportedFault] = useState('');

  // Logística Mapbox
  const [originType, setOriginType] = useState('workshop'); // workshop, gps
  const [originCoords, setOriginCoords] = useState(DEFAULT_ORIGIN.coords);
  const [originLabel, setOriginLabel] = useState(DEFAULT_ORIGIN.name);
  const [destCoords, setDestCoords] = useState(null);
  const [routeDistanceKm, setRouteDistanceKm] = useState(0);
  const [routeDurationMin, setRouteDurationMin] = useState(0);
  const [travelCost, setTravelCost] = useState(0);
  const [routingLoading, setRoutingLoading] = useState(false);
  const [routingError, setRoutingError] = useState('');

  const mapContainerRef = useRef(null);
  const mapInstance = useRef(null);

  // ==========================================
  // ESTADOS FORMULARIO PASO 2: DIAGNÓSTICO
  // ==========================================
  const [diagDamages, setDiagDamages] = useState([]);
  const [diagMileage, setDiagMileage] = useState('');
  const [diagHourmeter, setDiagHourmeter] = useState('');
  const [diagFuelLevel, setDiagFuelLevel] = useState('1/2');
  const [diagBatteryVoltage, setDiagBatteryVoltage] = useState('25.4 V');
  const [diagChecklist, setDiagChecklist] = useState({
    bancoBaterias: 'BUENO',
    arrancador: 'OPERATIVO',
    alternador: 'OPERATIVO',
    lucesYFaros: 'OPERATIVO',
    ramalElectrico: 'INTEGRO',
    computadoraEcu: 'SIN_ERRORES',
    bocina: 'OPERATIVO',
    plumillas: 'OPERATIVO',
    vidrios: 'OPERATIVO',
    llantaRepuesto: true,
    extintor: true,
    herramientas: true
  });
  const [diagReportedFault, setDiagReportedFault] = useState('');
  const [diagVisualObs, setDiagVisualObs] = useState('');
  const [diagServices, setDiagServices] = useState([]);
  const [diagParts, setDiagParts] = useState([]);
  const [diagStatus, setDiagStatus] = useState('EN_DIAGNOSTICO');

  // Firma Táctil
  const signatureCanvasRef = useRef(null);
  const [isSigning, setIsSigning] = useState(false);
  const [hasSignatureData, setHasSignatureData] = useState(false);

  // Buscador de Catálogo rápido en Diagnóstico
  const [serviceSearchTerm, setServiceSearchTerm] = useState('');

  // Generación Automática de Cotización
  const [autoQuoteLoading, setAutoQuoteLoading] = useState(false);
  const [quoteValidityDays, setQuoteValidityDays] = useState(15);
  const [quotePaymentCondition, setQuotePaymentCondition] = useState('Condición de pago 07 días despues de realizar el servicio.');

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (search) params.search = search;

      const [resOrders, resCatalog, resInv, resComp] = await Promise.all([
        api.getWorkOrders(params),
        api.getCatalog(),
        api.getInventory(),
        api.getCompanyConfig()
      ]);

      if (resOrders?.success && resOrders.data) setOrders(resOrders.data);
      if (resCatalog?.data) setCatalog(resCatalog.data);
      if (resInv?.success && resInv.data) setInventoryItems(resInv.data);
      if (resComp?.data) setCompany(resComp.data);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [statusFilter]);

  // ==========================================
  // CONSULTA DNI / RUC EN DESPACHO
  // ==========================================
  const handleLookupDoc = async () => {
    const clean = dispClientDoc.trim();
    if (clean.length !== 8 && clean.length !== 11) {
      alert('Ingresa un DNI de 8 dígitos o un RUC de 11 dígitos');
      return;
    }

    setSearchingDoc(true);
    try {
      if (clean.length === 11) {
        const res = await api.lookupRuc(clean);
        if (res.success && res.data) {
          setDispClientName(res.data.razonSocial || '');
          if (res.data.direccion) {
            setDispClientAddress(res.data.direccion);
            // Calcular ruta hacia la dirección del RUC
            calculateMapboxRoute(res.data.direccion);
          }
        }
      } else {
        const res = await api.lookupDni(clean);
        if (res.success && res.data) {
          const fullName = res.data.nombreCompleto || `${res.data.nombres} ${res.data.apellidoPaterno || ''}`.trim();
          setDispClientName(fullName);
        }
      }
    } catch (err) {
      alert('Error en consulta APIsPerú: ' + err.message);
    } finally {
      setSearchingDoc(false);
    }
  };

  // Detectar GPS del Asesor
  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      alert('Geolocalización no soportada en este navegador');
      return;
    }
    setOriginType('gps');
    setOriginLabel('Buscando señal GPS...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = [pos.coords.longitude, pos.coords.latitude];
        setOriginCoords(coords);
        setOriginLabel(`📍 GPS Asesor (${coords[1].toFixed(4)}, ${coords[0].toFixed(4)})`);
        if (dispClientAddress) calculateMapboxRoute(dispClientAddress, coords);
      },
      (err) => {
        alert('No se pudo obtener GPS: ' + err.message + '. Se usará taller VES.');
        setOriginType('workshop');
        setOriginCoords(DEFAULT_ORIGIN.coords);
        setOriginLabel(DEFAULT_ORIGIN.name);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Cálculo de Ruta con Mapbox
  const calculateMapboxRoute = async (destinationAddress, currentOrigin = originCoords) => {
    if (!destinationAddress || !destinationAddress.trim()) return;
    setRoutingLoading(true);
    setRoutingError('');

    try {
      const cleanDest = destinationAddress.includes('Peru') || destinationAddress.includes('Perú') 
        ? destinationAddress 
        : `${destinationAddress}, Lima, Peru`;

      const geoRes = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(cleanDest)}.json?access_token=${MAPBOX_TOKEN}&country=PE&limit=1`
      );
      const geoData = await geoRes.json();

      if (!geoData.features || geoData.features.length === 0) {
        throw new Error(`No se ubicó: "${destinationAddress}". Se usará cálculo por defecto.`);
      }

      const dest = geoData.features[0].center; // [lng, lat]
      setDestCoords(dest);

      const dirRes = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${currentOrigin[0]},${currentOrigin[1]};${dest[0]},${dest[1]}?geometries=geojson&access_token=${MAPBOX_TOKEN}`
      );
      const dirData = await dirRes.json();

      if (!dirData.routes || dirData.routes.length === 0) {
        throw new Error('No se encontró ruta de conducción hacia ese destino.');
      }

      const route = dirData.routes[0];
      const dist = route.distance / 1000;
      const duration = Math.round(route.duration / 60);
      const cost = Math.round((35 + (dist * 2.5)) * 10) / 10;

      setRouteDistanceKm(dist);
      setRouteDurationMin(duration);
      setTravelCost(cost);

      // Dibujar en Mapbox si el contenedor está listo
      renderRouteOnMap(currentOrigin, dest, route.geometry);
    } catch (err) {
      setRoutingError(err.message);
    } finally {
      setRoutingLoading(false);
    }
  };

  const renderRouteOnMap = (origin, dest, geojson) => {
    if (!mapContainerRef.current) return;

    if (mapInstance.current) {
      mapInstance.current.remove();
    }

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/navigation-night-v1',
      center: origin,
      zoom: 12
    });

    mapInstance.current = map;

    map.on('load', () => {
      // Marcador Origen
      const elOrigin = document.createElement('div');
      elOrigin.className = 'w-8 h-8 rounded-full bg-amber-500 border-2 border-white shadow-lg flex items-center justify-center font-bold text-xs text-slate-950';
      elOrigin.innerHTML = '⚡';
      new mapboxgl.Marker(elOrigin).setLngLat(origin).addTo(map);

      // Marcador Destino
      const elDest = document.createElement('div');
      elDest.className = 'w-8 h-8 rounded-full bg-blue-500 border-2 border-white shadow-lg flex items-center justify-center font-bold text-xs text-white';
      elDest.innerHTML = '🚗';
      new mapboxgl.Marker(elDest).setLngLat(dest).addTo(map);

      // Línea de Ruta
      map.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: geojson
        }
      });

      map.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#f59e0b', 'line-width': 4.5, 'line-opacity': 0.85 }
      });

      // Centrar mapa abarcando ambos puntos
      const bounds = new mapboxgl.LngLatBounds();
      bounds.extend(origin);
      bounds.extend(dest);
      map.fitBounds(bounds, { padding: 40 });
    });
  };

  // ==========================================
  // ABRIR PASO 1: NUEVO DESPACHO INICIAL
  // ==========================================
  const handleOpenDispatch = () => {
    setDispClientDoc('');
    setDispClientName('');
    setDispClientPhone('');
    setDispClientAddress('');
    setDispDriverName('');
    setDispDriverPhone('');
    setDispPlate('');
    setDispModel('');
    setDispVehicleType('SEDAN_AUTO');
    setDispColor('Plata');
    setDispYear(new Date().getFullYear().toString());
    setDispVin('');
    setDispReportedFault('Auxilio técnico / Diagnóstico general de unidad');
    setOriginType('workshop');
    setOriginCoords(DEFAULT_ORIGIN.coords);
    setOriginLabel(DEFAULT_ORIGIN.name);
    setDestCoords(null);
    setRouteDistanceKm(0);
    setRouteDurationMin(0);
    setTravelCost(0);
    setShowDispatchModal(true);
  };

  // Guardar Paso 1 (Despacho)
  const handleSaveDispatch = async (e) => {
    e.preventDefault();
    if (!dispClientName || !dispPlate) {
      alert('Por favor completa el nombre del cliente y la placa del vehículo.');
      return;
    }

    try {
      const payload = {
        clientDoc: dispClientDoc.trim(),
        clientName: dispClientName.trim(),
        clientPhone: dispClientPhone.trim(),
        clientAddress: dispClientAddress.trim(),
        driverName: dispDriverName.trim(),
        driverPhone: dispDriverPhone.trim(),
        plate: dispPlate.toUpperCase().trim(),
        model: dispModel.trim(),
        vehicleType: dispVehicleType,
        color: dispColor.trim(),
        year: dispYear.trim(),
        vin: dispVin.trim(),
        reportedFault: dispReportedFault.trim(),
        status: 'DESPACHADO',
        originLocation: {
          name: originLabel,
          address: originLabel,
          coords: originCoords
        },
        destinationLocation: {
          address: dispClientAddress.trim(),
          coords: destCoords || []
        },
        routeDistanceKm,
        routeDurationMin,
        travelCost
      };

      const res = await api.createWorkOrder(payload);
      if (res?.success) {
        setShowDispatchModal(false);
        fetchInitialData();
        // Abrir directamente en modo diagnóstico si se desea
        handleOpenDiagnostic(res.data);
      }
    } catch (err) {
      alert('Error al generar Despacho: ' + err.message);
    }
  };

  // ==========================================
  // ABRIR PASO 2: DIAGNÓSTICO EN SITIO / TALLER
  // ==========================================
  const handleOpenDiagnostic = (order) => {
    setSelectedOrder(order);
    setDiagDamages(order.damageMap || []);
    setDiagMileage(order.mileage || '');
    setDiagHourmeter(order.hourmeter || '');
    setDiagFuelLevel(order.fuelLevel || '1/2');
    setDiagBatteryVoltage(order.batteryVoltage || '25.4 V');
    setDiagChecklist(order.entryChecklist || {
      bancoBaterias: 'BUENO',
      arrancador: 'OPERATIVO',
      alternador: 'OPERATIVO',
      lucesYFaros: 'OPERATIVO',
      ramalElectrico: 'INTEGRO',
      computadoraEcu: 'SIN_ERRORES',
      bocina: 'OPERATIVO',
      plumillas: 'OPERATIVO',
      vidrios: 'OPERATIVO',
      llantaRepuesto: true,
      extintor: true,
      herramientas: true
    });
    setDiagReportedFault(order.reportedFault || '');
    setDiagVisualObs(order.visualObservations || 'Inspección técnica completada sin novedades.');
    setDiagServices(order.diagnosticServices || []);
    setDiagParts(order.diagnosticParts || []);
    setDiagStatus(order.status || 'EN_DIAGNOSTICO');
    setHasSignatureData(!!order.clientSignature);
    setActiveDiagnosticTab('damage');
    setShowDiagnosticModal(true);
  };

  // Guardar Diagnóstico
  const handleSaveDiagnostic = async () => {
    if (!selectedOrder) return;
    try {
      const payload = {
        damageMap: diagDamages,
        mileage: diagMileage,
        hourmeter: diagHourmeter,
        fuelLevel: diagFuelLevel,
        batteryVoltage: diagBatteryVoltage,
        entryChecklist: diagChecklist,
        reportedFault: diagReportedFault,
        visualObservations: diagVisualObs,
        diagnosticServices: diagServices,
        diagnosticParts: diagParts,
        status: diagStatus
      };

      const res = await api.updateWorkOrder(selectedOrder._id, payload);
      if (res?.success) {
        setSelectedOrder(res.data);
        fetchInitialData();
        alert('Diagnóstico guardado exitosamente.');
      }
    } catch (err) {
      alert('Error al guardar diagnóstico: ' + err.message);
    }
  };

  // Generar Cotización Automática en 1 Clic
  const handleGenerateQuote = async () => {
    if (!selectedOrder) return;
    setAutoQuoteLoading(true);
    try {
      // Guardar primero el diagnóstico actual
      await api.updateWorkOrder(selectedOrder._id, {
        damageMap: diagDamages,
        mileage: diagMileage,
        hourmeter: diagHourmeter,
        fuelLevel: diagFuelLevel,
        batteryVoltage: diagBatteryVoltage,
        entryChecklist: diagChecklist,
        reportedFault: diagReportedFault,
        visualObservations: diagVisualObs,
        diagnosticServices: diagServices,
        diagnosticParts: diagParts,
        status: diagStatus
      });

      const res = await api.generateQuoteFromWorkOrder(selectedOrder._id, {
        validityDays: quoteValidityDays,
        paymentCondition: quotePaymentCondition
      });

      if (res?.success) {
        const createdQuote = res.data.quote;
        setSelectedOrder(res.data.workOrder);
        fetchInitialData();
        if (window.confirm(`¡Cotización ${createdQuote.quoteNumber} generada exitosamente!\n\n¿Deseas abrir la cotización en este momento?`)) {
          setShowDiagnosticModal(false);
          onSelectQuote && onSelectQuote(createdQuote);
        }
      }
    } catch (err) {
      alert('Error generando cotización automática: ' + err.message);
    } finally {
      setAutoQuoteLoading(false);
    }
  };

  // Métodos de Firma Táctil
  const handleStartDraw = (e) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsSigning(true);
  };

  const handleDraw = (e) => {
    if (!isSigning) return;
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignatureData(true);
  };

  const handleStopDraw = () => {
    setIsSigning(false);
  };

  const handleClearSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignatureData(false);
  };

  const handleSaveSignature = async () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas || !hasSignatureData) {
      alert('Por favor realiza la firma en pantalla antes de guardar.');
      return;
    }
    const signatureData = canvas.toDataURL('image/png');
    try {
      const res = await api.saveWorkOrderSignature(selectedOrder._id, {
        clientSignature: signatureData,
        deliveredTo: selectedOrder.driverName || selectedOrder.clientName
      });
      if (res?.success) {
        setSelectedOrder(res.data);
        fetchInitialData();
        alert('Firma digital registrada con éxito.');
      }
    } catch (err) {
      alert('Error guardando firma: ' + err.message);
    }
  };

  // Agregar Servicio MO a Diagnóstico
  const handleAddDiagnosticService = (item) => {
    const newSrv = {
      code: item.code,
      description: item.description,
      quantity: 1,
      unitPrice: Number(item.defaultPrice) || 0,
      value: Number(item.defaultPrice) || 0
    };
    setDiagServices([...diagServices, newSrv]);
  };

  // Agregar Repuesto a Diagnóstico
  const handleAddDiagnosticPart = (item) => {
    const newPart = {
      inventoryItemId: item._id,
      sku: item.sku,
      name: item.name,
      quantity: 1,
      unitPrice: Number(item.salePrice) || 0,
      value: Number(item.salePrice) || 0
    };
    setDiagParts([...diagParts, newPart]);
  };

  // Filtrado de servicios de catálogo
  const filteredCatalog = catalog.filter(c => 
    c.code.toLowerCase().includes(serviceSearchTerm.toLowerCase()) ||
    c.description.toLowerCase().includes(serviceSearchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header y Acciones Rápidas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-3xl border border-white/5 backdrop-blur-md">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Órdenes de Trabajo (OT) & Taller Digital
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Flujo Operativo Automatizado: Despacho con Mapbox ➡️ Diagnóstico con Diagrama de 5 Vistas ➡️ Cotización Oficial en 1 Clic
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenDispatch}
          className="flex items-center justify-center space-x-2 px-5 py-3 rounded-2xl text-xs font-black bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 text-slate-950 shadow-gold-glow hover:brightness-110 active:scale-95 transition"
        >
          <Plus className="w-4 h-4 text-slate-950" />
          <span>+ Iniciar Orden de Trabajo (Despacho)</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <div className="text-slate-400 font-semibold mb-1">Total OTs Registradas</div>
          <div className="text-2xl font-black text-white">{orders.length}</div>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <div className="text-amber-400 font-semibold mb-1">En Camino / Despacho</div>
          <div className="text-2xl font-black text-amber-400">
            {orders.filter(o => o.status === 'DESPACHADO' || o.status === 'EN_CAMINO').length}
          </div>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <div className="text-blue-400 font-semibold mb-1">En Diagnóstico / Taller</div>
          <div className="text-2xl font-black text-blue-400">
            {orders.filter(o => o.status === 'RECEPCIONADO' || o.status === 'EN_DIAGNOSTICO' || o.status === 'EN_PROCESO').length}
          </div>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <div className="text-emerald-400 font-semibold mb-1">Cotizaciones Generadas</div>
          <div className="text-2xl font-black text-emerald-400">
            {orders.filter(o => o.generatedQuoteNumber || o.quoteNumber).length}
          </div>
        </div>
      </div>

      {/* Filtros y Búsqueda */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/40 p-3 rounded-2xl border border-slate-800">
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          {['ALL', 'DESPACHADO', 'EN_DIAGNOSTICO', 'EN_PROCESO', 'ENTREGADO'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                statusFilter === st 
                  ? 'bg-amber-500 text-slate-950 shadow-md' 
                  : 'text-slate-400 hover:text-white bg-slate-800/60'
              }`}
            >
              {st === 'ALL' ? 'Todas' : st.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por placa, OT, cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* Lista de Órdenes de Trabajo */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 font-semibold animate-pulse">
          Cargando órdenes de trabajo y telemetría de taller...
        </div>
      ) : orders.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl text-slate-400">
          No se encontraron órdenes de trabajo activas. Inicia una con el botón "+ Iniciar Orden de Trabajo".
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map(order => {
            const hasQuote = !!(order.generatedQuoteNumber || order.quoteNumber);
            const quoteNum = order.generatedQuoteNumber || order.quoteNumber;

            return (
              <div 
                key={order._id}
                className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-4 flex flex-col justify-between shadow-xl transition group"
              >
                <div>
                  {/* Cabecera Tarjeta */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-black text-amber-400 text-sm">
                        {order.orderNumber}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        {order.status}
                      </span>
                    </div>

                    <span className="font-mono font-black text-base text-white px-2.5 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300">
                      {order.plate}
                    </span>
                  </div>

                  {/* Datos del Cliente y Vehículo */}
                  <div className="space-y-1 mb-3 text-xs">
                    <div className="font-bold text-white truncate">{order.clientName}</div>
                    <div className="text-slate-400 text-[11px] truncate">
                      {order.model} • {order.vehicleType || 'Unidad Móvil'} {order.year ? `(${order.year})` : ''}
                    </div>
                    {order.destinationLocation?.address && (
                      <div className="text-[11px] text-slate-400 flex items-center space-x-1 truncate">
                        <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                        <span className="truncate">{order.destinationLocation.address}</span>
                      </div>
                    )}
                  </div>

                  {/* Telemetría y Daños */}
                  <div className="grid grid-cols-3 gap-1.5 p-2 rounded-xl bg-slate-950 border border-slate-800/80 text-[10px] text-center mb-3">
                    <div>
                      <span className="text-slate-500 block">KM</span>
                      <span className="font-bold text-slate-200">{order.mileage || '---'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Combustible</span>
                      <span className="font-bold text-amber-400">{order.fuelLevel || '1/2'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Daños</span>
                      <span className={`font-bold ${order.damageMap?.length > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {order.damageMap?.length || 0} pts
                      </span>
                    </div>
                  </div>

                  {/* Vínculo de Cotización */}
                  {hasQuote && (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-2.5 py-1.5 flex items-center justify-between text-xs text-emerald-300 mb-3">
                      <span className="flex items-center space-x-1 font-bold">
                        <Zap className="w-3 h-3 text-emerald-400" />
                        <span>Cotización: {quoteNum}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => onSelectQuote && onSelectQuote({ _id: order.generatedQuoteId || order.quoteId, quoteNumber: quoteNum })}
                        className="text-[10px] underline font-semibold hover:text-white"
                      >
                        Ver Propuesta
                      </button>
                    </div>
                  )}
                </div>

                {/* Acciones */}
                <div className="flex items-center space-x-2 pt-2 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => handleOpenDiagnostic(order)}
                    className="flex-1 flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 hover:brightness-110 active:scale-95 transition shadow-sm"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Diagnóstico / Check-In</span>
                  </button>

                  <a
                    href={api.getWorkOrderPdfUrl(order._id)}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
                    title="Descargar Acta de OT Oficial en PDF"
                  >
                    <FileText className="w-4 h-4" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL PASO 1: NUEVO DESPACHO INICIAL (CLIENTE, AUTO, MAPA) */}
      {/* ======================================================== */}
      {showDispatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-3xl w-full shadow-2xl p-5 sm:p-6 space-y-4 my-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Truck className="w-5 h-5 text-amber-400" />
                <h2 className="text-base sm:text-lg font-black text-white">
                  Paso 1: Apertura & Despacho de Orden de Trabajo
                </h2>
              </div>
              <button 
                type="button" 
                onClick={() => setShowDispatchModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDispatch} className="space-y-4">
              {/* Bloque 1: Cliente & Consulta APIsPerú */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <User className="w-3.5 h-3.5" />
                  <span>1. Identificación del Cliente (DNI / RUC)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">RUC o DNI:</label>
                    <div className="flex space-x-1">
                      <input
                        type="text"
                        required
                        value={dispClientDoc}
                        onChange={(e) => setDispClientDoc(e.target.value)}
                        placeholder="8 dígitos DNI / 11 RUC"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white font-mono font-bold outline-none focus:border-amber-400"
                      />
                      <button
                        type="button"
                        onClick={handleLookupDoc}
                        disabled={searchingDoc}
                        className="px-2.5 py-1.5 bg-amber-500 text-slate-950 font-bold rounded-xl hover:brightness-110 shrink-0 text-xs"
                      >
                        {searchingDoc ? '...' : '🔍'}
                      </button>
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-400 font-semibold mb-1">Razón Social / Nombre Completo:</label>
                    <input
                      type="text"
                      required
                      value={dispClientName}
                      onChange={(e) => setDispClientName(e.target.value)}
                      placeholder="Nombre del cliente o empresa"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-semibold outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-400 font-semibold mb-1">Dirección del Cliente / Destino:</label>
                    <input
                      type="text"
                      value={dispClientAddress}
                      onChange={(e) => {
                        setDispClientAddress(e.target.value);
                      }}
                      onBlur={() => calculateMapboxRoute(dispClientAddress)}
                      placeholder="Ej. Av. Nicolás de Piérola 1234, Lima"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Teléfono Contacto:</label>
                    <input
                      type="text"
                      value={dispClientPhone}
                      onChange={(e) => setDispClientPhone(e.target.value)}
                      placeholder="934787006"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-mono outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              </div>

              {/* Bloque 2: Datos del Vehículo */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <Car className="w-3.5 h-3.5" />
                  <span>2. Datos de la Unidad Vehicular</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Placa / Matrícula:</label>
                    <input
                      type="text"
                      required
                      value={dispPlate}
                      onChange={(e) => setDispPlate(e.target.value.toUpperCase())}
                      placeholder="Ej. ABG890"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-amber-300 font-mono font-black outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Modelo:</label>
                    <input
                      type="text"
                      value={dispModel}
                      onChange={(e) => setDispModel(e.target.value)}
                      placeholder="Ej. Toyota Yaris / Volvo FH"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Tipo de Unidad:</label>
                    <select
                      value={dispVehicleType}
                      onChange={(e) => setDispVehicleType(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white outline-none focus:border-amber-400"
                    >
                      {VEHICLE_TYPES.map(vt => (
                        <option key={vt.id} value={vt.id}>{vt.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Color / Año:</label>
                    <div className="flex space-x-1">
                      <input
                        type="text"
                        value={dispColor}
                        onChange={(e) => setDispColor(e.target.value)}
                        placeholder="Color"
                        className="w-1/2 bg-slate-900 border border-slate-700 rounded-xl px-2 py-1.5 text-white outline-none"
                      />
                      <input
                        type="text"
                        value={dispYear}
                        onChange={(e) => setDispYear(e.target.value)}
                        placeholder="Año"
                        className="w-1/2 bg-slate-900 border border-slate-700 rounded-xl px-2 py-1.5 text-white font-mono outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="text-xs">
                  <label className="block text-slate-400 font-semibold mb-1">Motivo de Solicitud / Falla Declarada:</label>
                  <input
                    type="text"
                    required
                    value={dispReportedFault}
                    onChange={(e) => setDispReportedFault(e.target.value)}
                    placeholder="Ej. Unidad no arranca en frío, testigo de alternador encendido"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-400 font-medium"
                  />
                </div>
              </div>

              {/* Bloque 3: Trazado de Ruta y Viáticos (Mapbox) */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
                    <Navigation className="w-3.5 h-3.5" />
                    <span>3. Logística y Trazado de Ruta con Mapbox</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        setOriginType('workshop');
                        setOriginCoords(DEFAULT_ORIGIN.coords);
                        setOriginLabel(DEFAULT_ORIGIN.name);
                        if (dispClientAddress) calculateMapboxRoute(dispClientAddress, DEFAULT_ORIGIN.coords);
                      }}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition ${
                        originType === 'workshop' 
                          ? 'bg-amber-500 text-slate-950 border-amber-400' 
                          : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      🏭 Taller Central VES
                    </button>

                    <button
                      type="button"
                      onClick={handleDetectGps}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition ${
                        originType === 'gps' 
                          ? 'bg-blue-500 text-white border-blue-400' 
                          : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      📍 Mi Ubicación GPS
                    </button>
                  </div>
                </div>

                {/* Métricas de Ruta Calculada */}
                <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-center text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Distancia Estimada</span>
                    <span className="font-mono font-black text-white text-sm">
                      {routeDistanceKm > 0 ? `${routeDistanceKm.toFixed(1)} km` : '---'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Tiempo de Llegada</span>
                    <span className="font-mono font-black text-amber-400 text-sm">
                      {routeDurationMin > 0 ? `${routeDurationMin} min` : '---'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Viáticos Sugeridos</span>
                    <span className="font-mono font-black text-emerald-400 text-sm">
                      {travelCost > 0 ? `S/ ${travelCost.toFixed(2)}` : 'S/ 0.00'}
                    </span>
                  </div>
                </div>

                {routingError && (
                  <div className="text-[11px] text-rose-400 bg-rose-500/10 p-2 rounded-lg border border-rose-500/30">
                    ⚠️ {routingError}
                  </div>
                )}

                {/* Visor de Mapa Mapbox */}
                <div 
                  ref={mapContainerRef} 
                  className="w-full h-44 rounded-xl overflow-hidden border border-slate-800 bg-slate-900"
                />
              </div>

              {/* Botón Guardar Paso 1 */}
              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDispatchModal(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 text-slate-950 shadow-gold-glow hover:brightness-110 active:scale-95 transition"
                >
                  Guardar y Despachar OT ➡️
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL PASO 2: DIAGNÓSTICO EN SITIO / TALLER (EDICIÓN OT)  */}
      {/* ======================================================== */}
      {showDiagnosticModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md overflow-y-auto animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-5xl w-full shadow-2xl p-4 sm:p-6 space-y-4 my-auto max-h-[94vh] flex flex-col">
            
            {/* Header del Diagnóstico */}
            <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-3">
              <div className="flex items-center space-x-3">
                <span className="font-mono font-black text-amber-400 text-lg sm:text-xl">
                  {selectedOrder.orderNumber}
                </span>
                <span className="bg-amber-500/10 text-amber-300 font-mono font-black px-2.5 py-1 rounded-xl border border-amber-500/30 text-sm">
                  {selectedOrder.plate}
                </span>
                <span className="text-xs text-slate-400 hidden sm:inline">
                  {selectedOrder.clientName}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <a
                  href={api.getWorkOrderPdfUrl(selectedOrder._id)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>PDF OT</span>
                </a>

                <button 
                  type="button" 
                  onClick={() => setShowDiagnosticModal(false)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Pestañas de Navegación del Diagnóstico */}
            <div className="flex space-x-2 border-b border-slate-800 pb-2 text-xs font-bold overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveDiagnosticTab('damage')}
                className={`px-3.5 py-2 rounded-xl transition flex items-center space-x-1.5 shrink-0 ${
                  activeDiagnosticTab === 'damage'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>1. Carrocería & Daños ({diagDamages.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveDiagnosticTab('telemetry')}
                className={`px-3.5 py-2 rounded-xl transition flex items-center space-x-1.5 shrink-0 ${
                  activeDiagnosticTab === 'telemetry'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                <Gauge className="w-3.5 h-3.5" />
                <span>2. Odometría & Checklist</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveDiagnosticTab('requirements')}
                className={`px-3.5 py-2 rounded-xl transition flex items-center space-x-1.5 shrink-0 ${
                  activeDiagnosticTab === 'requirements'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>3. Servicios MO & Repuestos ({diagServices.length + diagParts.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveDiagnosticTab('signature')}
                className={`px-3.5 py-2 rounded-xl transition flex items-center space-x-1.5 shrink-0 ${
                  activeDiagnosticTab === 'signature'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>4. Firma & Cierre</span>
              </button>
            </div>

            {/* Contenido Dinámico de la Pestaña */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">

              {/* TAB 1: CARROCERÍA Y DAÑOS */}
              {activeDiagnosticTab === 'damage' && (
                <InteractiveCarDamage 
                  damages={diagDamages} 
                  onChange={setDiagDamages} 
                />
              )}

              {/* TAB 2: ODOMETRÍA, COMBUSTIBLE Y CHECKLIST */}
              {activeDiagnosticTab === 'telemetry' && (
                <div className="space-y-4 text-xs">
                  {/* Odometría Dual & Batería */}
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                    <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                      Mediciones de Odometría y Batería
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1">Kilometraje (Odómetro):</label>
                        <input
                          type="text"
                          value={diagMileage}
                          onChange={(e) => setDiagMileage(e.target.value)}
                          placeholder="Ej. 145,000 km"
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold outline-none focus:border-amber-400"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1">Horómetro (Maquinaria/Tracto):</label>
                        <input
                          type="text"
                          value={diagHourmeter}
                          onChange={(e) => setDiagHourmeter(e.target.value)}
                          placeholder="Ej. 3,500 hrs"
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold outline-none focus:border-amber-400"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1">Voltaje Batería (Reposo):</label>
                        <input
                          type="text"
                          value={diagBatteryVoltage}
                          onChange={(e) => setDiagBatteryVoltage(e.target.value)}
                          placeholder="Ej. 25.4 V"
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sky-400 font-mono font-bold outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Nivel de Combustible */}
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
                    <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
                      <Fuel className="w-3.5 h-3.5" />
                      <span>Nivel de Combustible al Ingreso:</span>
                    </div>

                    <div className="grid grid-cols-5 gap-2">
                      {['RESERVA', '1/4', '1/2', '3/4', 'LLENO'].map(lvl => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setDiagFuelLevel(lvl)}
                          className={`p-2.5 rounded-xl font-bold text-xs border transition ${
                            diagFuelLevel === lvl
                              ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md scale-105'
                              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Checklist Físico & Eléctrico */}
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                    <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                      Checklist de Inspección Físico-Eléctrico
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-slate-400 font-medium mb-1">Baterías:</label>
                        <select
                          value={diagChecklist.bancoBaterias}
                          onChange={(e) => setDiagChecklist({ ...diagChecklist, bancoBaterias: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white"
                        >
                          <option value="BUENO">BUENO</option>
                          <option value="REGULAR">REGULAR</option>
                          <option value="DEFICIENTE">DEFICIENTE</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-400 font-medium mb-1">Arrancador:</label>
                        <select
                          value={diagChecklist.arrancador}
                          onChange={(e) => setDiagChecklist({ ...diagChecklist, arrancador: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white"
                        >
                          <option value="OPERATIVO">OPERATIVO</option>
                          <option value="FALLA">CON FALLA</option>
                          <option value="NO_GIRA">NO GIRA</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-400 font-medium mb-1">Alternador:</label>
                        <select
                          value={diagChecklist.alternador}
                          onChange={(e) => setDiagChecklist({ ...diagChecklist, alternador: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white"
                        >
                          <option value="OPERATIVO">OPERATIVO</option>
                          <option value="NO_CARGA">NO CARGA</option>
                          <option value="DEFICIENTE">DEFICIENTE</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-400 font-medium mb-1">Luces & Faros:</label>
                        <select
                          value={diagChecklist.lucesYFaros}
                          onChange={(e) => setDiagChecklist({ ...diagChecklist, lucesYFaros: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white"
                        >
                          <option value="OPERATIVO">OPERATIVO</option>
                          <option value="PARCIAL">PARCIAL</option>
                          <option value="DEFICIENTE">DEFICIENTE</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-400 font-medium mb-1">Ramal Eléctrico:</label>
                        <select
                          value={diagChecklist.ramalElectrico}
                          onChange={(e) => setDiagChecklist({ ...diagChecklist, ramalElectrico: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white"
                        >
                          <option value="INTEGRO">INTEGRO</option>
                          <option value="CORTADO">CORTADO</option>
                          <option value="REPARADO">REPARADO</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-400 font-medium mb-1">Computadora ECU:</label>
                        <select
                          value={diagChecklist.computadoraEcu}
                          onChange={(e) => setDiagChecklist({ ...diagChecklist, computadoraEcu: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white"
                        >
                          <option value="SIN_ERRORES">SIN ERRORES</option>
                          <option value="CHECK_ACTIVO">CHECK ACTIVO</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Falla y Diagnóstico Técnico */}
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
                    <label className="block text-slate-400 font-semibold">Informe / Diagnóstico Técnico Oficial:</label>
                    <textarea
                      rows="3"
                      value={diagVisualObs}
                      onChange={(e) => setDiagVisualObs(e.target.value)}
                      placeholder="Detalle técnico de la falla encontrada tras el escaneo y pruebas de banco..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-xs outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: SERVICIOS MO Y REPUESTOS */}
              {activeDiagnosticTab === 'requirements' && (
                <div className="space-y-4 text-xs">
                  {/* Servicios de Mano de Obra */}
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
                        <Wrench className="w-3.5 h-3.5" />
                        <span>Mano de Obra & Servicios Presupuestados ({diagServices.length})</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <div className="relative w-48">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                          <input
                            type="text"
                            placeholder="Buscar en catálogo..."
                            value={serviceSearchTerm}
                            onChange={(e) => setServiceSearchTerm(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-2 py-1 text-[11px] text-white outline-none focus:border-amber-400"
                          />
                        </div>

                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              const found = catalog.find(c => c.code === e.target.value);
                              if (found) handleAddDiagnosticService(found);
                              e.target.value = '';
                            }
                          }}
                          className="bg-amber-500 text-slate-950 font-bold px-2 py-1 rounded-lg text-[11px] outline-none"
                        >
                          <option value="">⚡ + Catálogo MO...</option>
                          {filteredCatalog.map(c => (
                            <option key={c.code} value={c.code}>
                              {c.code} - {c.description} (S/ {c.defaultPrice})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Tabla de Servicios */}
                    {diagServices.length === 0 ? (
                      <div className="p-3 text-center text-slate-500 italic bg-slate-900/50 rounded-xl">
                        No has agregado servicios de mano de obra. Usa el selector "+ Catálogo MO".
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden">
                        {diagServices.map((srv, idx) => (
                          <div key={idx} className="p-2.5 flex items-center justify-between bg-slate-900/80 gap-2">
                            <div className="flex items-center space-x-2">
                              <span className="font-mono font-bold text-amber-400">{srv.code}</span>
                              <span className="text-white font-medium">{srv.description}</span>
                            </div>
                            <div className="flex items-center space-x-3 shrink-0">
                              <span className="text-slate-400">Cant: <b>{srv.quantity}</b></span>
                              <span className="font-mono font-bold text-amber-300">S/ {srv.unitPrice.toFixed(2)}</span>
                              <button
                                type="button"
                                onClick={() => setDiagServices(diagServices.filter((_, i) => i !== idx))}
                                className="text-slate-500 hover:text-rose-400 p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Repuestos e Insumos */}
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
                        <Boxes className="w-3.5 h-3.5" />
                        <span>Repuestos & Insumos de Taller Requeridos ({diagParts.length})</span>
                      </div>

                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            const found = inventoryItems.find(i => i._id === e.target.value);
                            if (found) handleAddDiagnosticPart(found);
                            e.target.value = '';
                          }
                        }}
                        className="bg-blue-500 text-white font-bold px-2 py-1 rounded-lg text-[11px] outline-none"
                      >
                        <option value="">⚙️ + Repuesto Almacén...</option>
                        {inventoryItems.map(item => (
                          <option key={item._id} value={item._id}>
                            {item.sku} - {item.name} (S/ {item.salePrice})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Tabla de Repuestos */}
                    {diagParts.length === 0 ? (
                      <div className="p-3 text-center text-slate-500 italic bg-slate-900/50 rounded-xl">
                        No has agregado repuestos. Selecciona del inventario de almacén.
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden">
                        {diagParts.map((part, idx) => (
                          <div key={idx} className="p-2.5 flex items-center justify-between bg-slate-900/80 gap-2">
                            <div className="flex items-center space-x-2">
                              <span className="font-mono font-bold text-blue-400">{part.sku}</span>
                              <span className="text-white font-medium">{part.name}</span>
                            </div>
                            <div className="flex items-center space-x-3 shrink-0">
                              <span className="text-slate-400">Cant: <b>{part.quantity}</b></span>
                              <span className="font-mono font-bold text-amber-300">S/ {part.unitPrice.toFixed(2)}</span>
                              <button
                                type="button"
                                onClick={() => setDiagParts(diagParts.filter((_, i) => i !== idx))}
                                className="text-slate-500 hover:text-rose-400 p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: FIRMA DIGITAL Y CIERRE */}
              {activeDiagnosticTab === 'signature' && (
                <div className="space-y-4 text-xs">
                  {/* Estado de la OT */}
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
                    <label className="block text-slate-400 font-semibold">Estado Actual de la Orden de Trabajo:</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['RECEPCIONADO', 'EN_DIAGNOSTICO', 'EN_PROCESO', 'FINALIZADO', 'ENTREGADO'].map(st => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setDiagStatus(st)}
                          className={`p-2 rounded-xl font-bold text-xs border transition ${
                            diagStatus === st
                              ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                              : 'bg-slate-900 text-slate-400 border-slate-800'
                          }`}
                        >
                          {st.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Canvas de Firma Táctil */}
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-400">Firma Digital del Cliente / Conductor:</span>
                      {hasSignatureData && (
                        <button
                          type="button"
                          onClick={handleClearSignature}
                          className="text-rose-400 hover:underline text-[11px]"
                        >
                          Limpiar Firma
                        </button>
                      )}
                    </div>

                    <div className="border border-slate-700 rounded-xl overflow-hidden bg-white/95">
                      <canvas
                        ref={signatureCanvasRef}
                        width={460}
                        height={160}
                        onMouseDown={handleStartDraw}
                        onMouseMove={handleDraw}
                        onMouseUp={handleStopDraw}
                        onMouseLeave={handleStopDraw}
                        onTouchStart={handleStartDraw}
                        onTouchMove={handleDraw}
                        onTouchEnd={handleStopDraw}
                        className="w-full touch-none cursor-crosshair"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleSaveSignature}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition"
                    >
                      ✓ Guardar Firma de Conformidad
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* BARRA INFERIOR DE ACCIONES CRÍTICAS */}
            <div className="border-t border-slate-800 pt-3 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center space-x-2 text-xs text-slate-400">
                <span>Total Estimado:</span>
                <span className="font-mono font-black text-amber-400 text-base">
                  S/ {(
                    diagServices.reduce((acc, s) => acc + (s.quantity * s.unitPrice), 0) +
                    diagParts.reduce((acc, p) => acc + (p.quantity * p.unitPrice), 0) +
                    (selectedOrder.travelCost || 0)
                  ).toFixed(2)}
                </span>
              </div>

              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleSaveDiagnostic}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white transition border border-slate-700"
                >
                  💾 Guardar Diagnóstico
                </button>

                <button
                  type="button"
                  onClick={handleGenerateQuote}
                  disabled={autoQuoteLoading}
                  className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 text-slate-950 shadow-gold-glow hover:brightness-110 active:scale-95 transition"
                >
                  <Zap className="w-4 h-4 text-slate-950" />
                  <span>{autoQuoteLoading ? 'Generando...' : '⚡ Generar Cotización Automática'}</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
