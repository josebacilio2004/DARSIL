import React, { useState, useEffect, useRef, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { 
  ClipboardList, 
  Plus, 
  Minus,
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
  Boxes,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import InteractiveCarDamage from './InteractiveCarDamage';

const MAPBOX_TOKEN = (import.meta.env && import.meta.env.VITE_MAPBOX_TOKEN) || (typeof atob !== 'undefined' ? atob('cGsuZXlKMUlqb2lhbTl6WldKaFl5SXNJbUVpT2lKamJXOXBZVFUwTVc4d01HTTRNbk52WjNOaE9IbzFOV000SW4wLjVHdzNFLWg2MkR3STRrczVZNzBjRHc=') : '');
mapboxgl.accessToken = MAPBOX_TOKEN;

const DEFAULT_ORIGIN = {
  name: 'Taller Central DARSIL (VES)',
  address: 'Av. Los Forestales MZ I1, Villa El Salvador, Lima, Lima',
  coords: [-76.9535, -12.2085]
};

const DEFAULT_CLIENT_DEST = [-76.9385, -12.1960]; // Ubicación inicial sugerida (~2.2 km del taller en Villa El Salvador)

const VEHICLE_TYPES = [
  { id: 'SEDAN_AUTO', label: 'Sedán' },
  { id: 'CAMIONETA_PICKUP', label: 'Camioneta o Pick-up' },
  { id: 'TRACTO_CAMION', label: 'Tractocamión' },
  { id: 'MIXER', label: 'Mixer' }
];

const FALLBACK_CATALOG = [
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

const FALLBACK_INVENTORY = [
  { _id: 'seed-1', sku: 'REP-REL-24V', name: 'Relé de Arranque Reforzado 24V 70A', category: 'REPUESTO_ELECTRICO', unit: 'Uds.', currentStock: 18, salePrice: 50.00 },
  { _id: 'seed-2', sku: 'REP-FUS-10-50A', name: 'Kit Fusibles Automotrices Alta Potencia 10A a 50A', category: 'REPUESTO_ELECTRICO', unit: 'Kits', currentStock: 45, salePrice: 20.00 },
  { _id: 'seed-3', sku: 'CAB-IGN-16MM', name: 'Cable Automotriz Ignífugo Grado Marino 16mm²', category: 'CABLEADO_CONECTORES', unit: 'Metros', currentStock: 120, salePrice: 25.00 },
  { _id: 'seed-4', sku: 'CON-TER-OJO-M8', name: 'Terminal de Ojo Cobre Estañado M8 / M10', category: 'CABLEADO_CONECTORES', unit: 'Uds.', currentStock: 150, salePrice: 10.00 },
  { _id: 'seed-5', sku: 'FIL-NYLON-CF', name: 'Filamento Técnico Nylon PA12 reforzado con Fibra de Carbono', category: 'FILAMENTO_3D', unit: 'Gramos (g)', currentStock: 3200, salePrice: 0.65 },
  { _id: 'seed-6', sku: 'FIL-PETG-CF', name: 'Filamento PETG-CF Alta Resistencia Térmica 120°C', category: 'FILAMENTO_3D', unit: 'Gramos (g)', currentStock: 4500, salePrice: 0.45 },
  { _id: 'seed-7', sku: 'FAR-LED-LAT-24V', name: 'Faro LED Lateral Señalizador Ámbar 24V IP68', category: 'ILUMINACION_FAROS', unit: 'Uds.', currentStock: 32, salePrice: 20.00 },
  { _id: 'seed-8', sku: 'SEN-NOX-CAN-24V', name: 'Sensor NOx Digital Entrada/Salida Bus CAN 24V', category: 'SENSORES_ACTUADORES', unit: 'Uds.', currentStock: 4, salePrice: 1150.00 }
];

export default function WorkOrdersView({ onSelectQuote, triggerNewOrder, onRefreshQuotes }) {
  const [orders, setOrders] = useState([]);
  const [catalog, setCatalog] = useState(FALLBACK_CATALOG);
  const [inventoryItems, setInventoryItems] = useState(FALLBACK_INVENTORY);
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
  const [searchingSunarp, setSearchingSunarp] = useState(false);
  const [sunarpToast, setSunarpToast] = useState(null);

  // Placa, color y año opcionales en despacho
  const [dispPlate, setDispPlate] = useState('');
  const [dispModel, setDispModel] = useState('');
  const [dispVehicleType, setDispVehicleType] = useState('SEDAN_AUTO');
  const [dispColor, setDispColor] = useState('');
  const [dispYear, setDispYear] = useState('');
  const [dispVin, setDispVin] = useState('');
  const [dispValidityDays, setDispValidityDays] = useState(15);
  const [dispPaymentCondition, setDispPaymentCondition] = useState('Condición de pago 07 días despues de realizar el servicio.');
  const [dispReportedFault, setDispReportedFault] = useState('Auxilio técnico / Diagnóstico general de unidad');
  const [dispAssignedMechanic, setDispAssignedMechanic] = useState('Darios Bacilio');

  // Logística Mapbox
  const [originType, setOriginType] = useState('workshop'); // workshop, gps
  const [originCoords, setOriginCoords] = useState(DEFAULT_ORIGIN.coords);
  const [originLabel, setOriginLabel] = useState(DEFAULT_ORIGIN.name);
  const [destCoords, setDestCoords] = useState(DEFAULT_CLIENT_DEST);
  const [routeDistanceKm, setRouteDistanceKm] = useState(0);
  const [routeDurationMin, setRouteDurationMin] = useState(0);
  const [travelCost, setTravelCost] = useState(0);
  const [routingLoading, setRoutingLoading] = useState(false);
  const [routingError, setRoutingError] = useState('');

  const mapContainerRef = useRef(null);
  const mapInstance = useRef(null);
  const originMarkerRef = useRef(null);
  const destMarkerRef = useRef(null);
  const originCoordsRef = useRef(DEFAULT_ORIGIN.coords);
  const destCoordsRef = useRef(DEFAULT_CLIENT_DEST);

  // ==========================================
  // ESTADOS FORMULARIO PASO 2: DIAGNÓSTICO EN SITIO
  // ==========================================
  // Datos del vehículo confirmados/editados en sitio
  const [diagPlate, setDiagPlate] = useState('');
  const [diagModel, setDiagModel] = useState('');
  const [diagVehicleType, setDiagVehicleType] = useState('SEDAN_AUTO');
  const [diagColor, setDiagColor] = useState('');
  const [diagYear, setDiagYear] = useState('');
  const [diagVin, setDiagVin] = useState('');
  const [diagDamages, setDiagDamages] = useState([]);
  const [diagMileage, setDiagMileage] = useState('');
  const [diagHourmeter, setDiagHourmeter] = useState('');
  const [diagFuelLevel, setDiagFuelLevel] = useState('1/2');
  const [diagBatteryVoltage, setDiagBatteryVoltage] = useState('');
  const [diagChecklist, setDiagChecklist] = useState({
    lucesYFaros: 'OPERATIVO',
    plumillasYParabrisas: 'OPERATIVO',
    lunasYVidrios: 'OPERATIVO',
    espejosRetrovisores: 'OPERATIVO',
    carroceriaGeneral: 'BUENO',
    llantaRepuesto: 'PRESENTE',
    gataYHerramientas: 'PRESENTE',
    extintorEmergencia: 'VIGENTE',
    documentosUnidad: 'ENTREGADO'
  });
  const [diagReportedFault, setDiagReportedFault] = useState('');
  const [diagVisualObs, setDiagVisualObs] = useState('');
  const [diagServices, setDiagServices] = useState([]);
  const [diagParts, setDiagParts] = useState([]);
  const [diagStatus, setDiagStatus] = useState('EN_DIAGNOSTICO');
  const [diagClientPhone, setDiagClientPhone] = useState('');
  const [diagClientDoc, setDiagClientDoc] = useState('');
  const [diagAssignedMechanic, setDiagAssignedMechanic] = useState('Darios Bacilio');

  // Firma Táctil
  const signatureCanvasRef = useRef(null);
  const [isSigning, setIsSigning] = useState(false);
  const [hasSignatureData, setHasSignatureData] = useState(false);

  // Buscadores de Catálogo y Repuestos en Diagnóstico
  const [serviceSearchTerm, setServiceSearchTerm] = useState('');
  const [partSearchTerm, setPartSearchTerm] = useState('');

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

      const [resOrders, resCatalog, resInv, resComp] = await Promise.allSettled([
        api.getWorkOrders(params),
        api.getCatalog(),
        api.getInventory(),
        api.getCompany()
      ]);

      if (resOrders.status === 'fulfilled' && resOrders.value?.data) {
        setOrders(resOrders.value.data);
      }
      if (resCatalog.status === 'fulfilled') {
        const catData = resCatalog.value?.data || (Array.isArray(resCatalog.value) ? resCatalog.value : []);
        if (catData && catData.length > 0) {
          setCatalog(catData);
        } else {
          try {
            const seed = await api.seedCatalog();
            if (seed?.data && seed.data.length > 0) {
              setCatalog(seed.data);
            } else {
              setCatalog(FALLBACK_CATALOG);
            }
          } catch (e) {
            setCatalog(FALLBACK_CATALOG);
          }
        }
      } else {
        setCatalog(FALLBACK_CATALOG);
      }

      if (resInv.status === 'fulfilled') {
        const invData = resInv.value?.data || (Array.isArray(resInv.value) ? resInv.value : []);
        if (invData && invData.length > 0) {
          setInventoryItems(invData);
        } else {
          try {
            const seedInv = await api.seedInventory();
            if (seedInv?.data && seedInv.data.length > 0) {
              setInventoryItems(seedInv.data);
            } else {
              setInventoryItems(FALLBACK_INVENTORY);
            }
          } catch (e) {
            setInventoryItems(FALLBACK_INVENTORY);
          }
        }
      } else {
        setInventoryItems(FALLBACK_INVENTORY);
      }

      if (resComp.status === 'fulfilled' && resComp.value?.data) {
        setCompany(resComp.value.data);
      }
    } catch (err) {
      console.error('Error fetching work orders data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [statusFilter]);

  useEffect(() => {
    if (triggerNewOrder) {
      handleOpenDispatch();
    }
  }, [triggerNewOrder]);

  // Inicializar mapa interactivo al abrir el modal de Despacho (Paso 1)
  useEffect(() => {
    if (!showDispatchModal) {
      if (mapInstance.current) {
        try { mapInstance.current.remove(); } catch (e) {}
        mapInstance.current = null;
      }
      destMarkerRef.current = null;
      originMarkerRef.current = null;
      return;
    }

    const timer = setTimeout(() => {
      initDispatchMap();
    }, 150);

    return () => clearTimeout(timer);
  }, [showDispatchModal]);

  const initDispatchMap = () => {
    if (!mapContainerRef.current) return;
    if (mapInstance.current) {
      try { mapInstance.current.remove(); } catch (e) {}
      mapInstance.current = null;
    }
    destMarkerRef.current = null;
    originMarkerRef.current = null;

    const currentOrigin = originCoordsRef.current || originCoords || DEFAULT_ORIGIN.coords;
    const currentDest = destCoordsRef.current || destCoords || DEFAULT_CLIENT_DEST;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/navigation-night-v1',
      center: currentOrigin,
      zoom: 12
    });

    mapInstance.current = map;

    map.on('load', () => {
      try { map.resize(); } catch (e) {}

      // 1. Marcador Origen (⚡ Taller VES / GPS) - Contenedor neutro para evitar conflictos con Mapbox transform
      const origWrapper = document.createElement('div');
      origWrapper.className = 'darsil-marker-origin';
      origWrapper.style.width = '38px';
      origWrapper.style.height = '38px';
      origWrapper.style.cursor = 'grab';
      origWrapper.style.touchAction = 'none';
      origWrapper.style.userSelect = 'none';
      origWrapper.title = 'Punto de Salida DARSIL (Haz clic o arrastra para mover)';

      const origInner = document.createElement('div');
      origInner.className = 'w-9 h-9 rounded-full bg-amber-500 border-2 border-white shadow-[0_4px_16px_rgba(245,158,11,0.85)] flex items-center justify-center text-sm font-black text-slate-950 select-none pointer-events-none transition-transform hover:scale-110';
      origInner.innerHTML = '⚡';
      origWrapper.appendChild(origInner);

      const origMarker = new mapboxgl.Marker({ 
        element: origWrapper, 
        draggable: true,
        anchor: 'center' 
      })
        .setLngLat(currentOrigin)
        .addTo(map);

      origMarker.on('dragstart', () => {
        origWrapper.style.cursor = 'grabbing';
        origInner.style.transform = 'scale(1.2)';
      });

      origMarker.on('dragend', async () => {
        origWrapper.style.cursor = 'grab';
        origInner.style.transform = 'scale(1)';
        const pos = origMarker.getLngLat();
        const newCoords = [pos.lng, pos.lat];
        setOriginCoords(newCoords);
        originCoordsRef.current = newCoords;
        setOriginType('custom');
        setOriginLabel(`Origen Personalizado (${newCoords[1].toFixed(4)}, ${newCoords[0].toFixed(4)})`);
        if (destCoordsRef.current) {
          await updateRouteFromCoords(newCoords, destCoordsRef.current, mapInstance.current);
        }
      });

      originMarkerRef.current = origMarker;

      // 2. Colocar el marcador Destino del cliente inmediatamente (para que siempre figure y sea movible)
      placeDestMarker(currentDest, map);
      updateRouteFromCoords(currentOrigin, currentDest, map);

      // 3. Listener interactivo: El asesor hace clic en cualquier lugar del mapa para fijar el pin exacto del auxilio
      map.on('click', async (e) => {
        const coords = [e.lngLat.lng, e.lngLat.lat];
        setDestCoords(coords);
        destCoordsRef.current = coords;
        placeDestMarker(coords, map);
        await updateRouteFromCoords(originCoordsRef.current || DEFAULT_ORIGIN.coords, coords, map);
      });
    });
  };

  const placeDestMarker = (coords, map = mapInstance.current) => {
    if (!map) return;
    
    // Si ya existe en este mapa, actualizamos posición
    if (destMarkerRef.current) {
      destMarkerRef.current.setLngLat(coords);
      return;
    }

    // Contenedor neutro para Mapbox GL JS (¡SIN transform ni animate-bounce en elemento raíz!)
    const wrapper = document.createElement('div');
    wrapper.className = 'darsil-marker-dest';
    wrapper.style.width = '42px';
    wrapper.style.height = '42px';
    wrapper.style.cursor = 'grab';
    wrapper.style.touchAction = 'none';
    wrapper.style.userSelect = 'none';
    wrapper.title = 'Ubicación del vehículo / cliente (Haz clic o arrastra para mover)';

    // Elemento interno para apariencia visual
    const inner = document.createElement('div');
    inner.className = 'w-10 h-10 rounded-full bg-blue-600 border-2 border-white shadow-[0_4px_16px_rgba(37,99,235,0.85)] flex items-center justify-center text-base font-bold text-white select-none pointer-events-none transition-transform hover:scale-110';
    inner.innerHTML = '🚗';
    wrapper.appendChild(inner);

    const marker = new mapboxgl.Marker({ 
      element: wrapper, 
      draggable: true,
      anchor: 'center' 
    })
      .setLngLat(coords)
      .addTo(map);

    marker.on('dragstart', () => {
      wrapper.style.cursor = 'grabbing';
      inner.style.transform = 'scale(1.25)';
    });

    marker.on('drag', () => {
      const pos = marker.getLngLat();
      setDestCoords([pos.lng, pos.lat]);
      destCoordsRef.current = [pos.lng, pos.lat];
    });

    // Al arrastrar el pin se actualiza la posición y se recalcula la ruta
    marker.on('dragend', async () => {
      wrapper.style.cursor = 'grab';
      inner.style.transform = 'scale(1)';
      const pos = marker.getLngLat();
      const newCoords = [pos.lng, pos.lat];
      setDestCoords(newCoords);
      destCoordsRef.current = newCoords;
      await updateRouteFromCoords(originCoordsRef.current || DEFAULT_ORIGIN.coords, newCoords, mapInstance.current);
    });

    destMarkerRef.current = marker;
  };

  const updateRouteFromCoords = async (origin, dest, map = mapInstance.current) => {
    setRoutingLoading(true);
    setRoutingError('');
    try {
      // 1. Reverse geocoding para obtener la dirección legible automáticamente
      try {
        const revRes = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${dest[0]},${dest[1]}.json?access_token=${MAPBOX_TOKEN}&country=PE`
        );
        const revData = await revRes.json();
        if (revData.features && revData.features.length > 0) {
          const place = revData.features[0];
          setDispClientAddress(place.place_name || place.text || '');
        }
      } catch (e) {
        console.warn('Reverse geocoding error:', e);
      }

      // 2. Directions API para trazado y distancia
      const dirRes = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${origin[0]},${origin[1]};${dest[0]},${dest[1]}?geometries=geojson&access_token=${MAPBOX_TOKEN}`
      );
      const dirData = await dirRes.json();

      if (!dirData.routes || dirData.routes.length === 0) {
        throw new Error('No se encontró ruta de conducción hacia ese punto.');
      }

      const route = dirData.routes[0];
      const dist = route.distance / 1000;
      const duration = Math.round(route.duration / 60);
      const cost = Math.round((35 + (dist * 2.5)) * 10) / 10;

      setRouteDistanceKm(dist);
      setRouteDurationMin(duration);
      setTravelCost(cost);

      // 3. Pintar en el mapa
      if (map && map.isStyleLoaded()) {
        if (map.getSource('route')) {
          map.getSource('route').setData({
            type: 'Feature',
            properties: {},
            geometry: route.geometry
          });
        } else {
          map.addSource('route', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: route.geometry
            }
          });

          map.addLayer({
            id: 'route',
            type: 'line',
            source: 'route',
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: { 'line-color': '#f59e0b', 'line-width': 4.5, 'line-opacity': 0.85 }
          });
        }

        try { map.resize(); } catch (e) {}

        const bounds = new mapboxgl.LngLatBounds();
        bounds.extend(origin);
        bounds.extend(dest);
        map.fitBounds(bounds, { 
          padding: { top: 35, bottom: 35, left: 35, right: 35 }, 
          maxZoom: 15,
          duration: 600
        });
      }
    } catch (err) {
      setRoutingError(err.message);
    } finally {
      setRoutingLoading(false);
    }
  };

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

  // ==========================================
  // CONSULTA VEHICULAR SUNARP (PERÚ)
  // ==========================================
  const handleLookupSunarp = async (mode = 'disp') => {
    const rawPlate = (mode === 'disp' ? dispPlate : diagPlate).trim();
    if (!rawPlate) {
      alert('Por favor, ingresa el número de placa a consultar en SUNARP (ej. ABC-123, D1X-789, V6Y-900).');
      return;
    }

    setSearchingSunarp(true);
    try {
      const res = await api.lookupSunarp(rawPlate);
      if (res && res.success && res.data) {
        const d = res.data;
        if (mode === 'disp') {
          setDispPlate(d.placa || rawPlate.toUpperCase());
          setDispModel(`${d.marca ? d.marca + ' ' : ''}${d.modelo || ''}`.trim());
          if (d.vehicleType) setDispVehicleType(d.vehicleType);
          if (d.color) setDispColor(d.color);
          if (d.year) setDispYear(String(d.year));
          if (d.vin) setDispVin(d.vin);
          if (d.titular && (!dispClientName || dispClientName.toLowerCase().includes('particular') || dispClientName.toLowerCase().includes('cliente'))) {
            setDispClientName(d.titular);
          }
        } else {
          setDiagPlate(d.placa || rawPlate.toUpperCase());
          setDiagModel(`${d.marca ? d.marca + ' ' : ''}${d.modelo || ''}`.trim());
          if (d.vehicleType) setDiagVehicleType(d.vehicleType);
          if (d.color) setDiagColor(d.color);
          if (d.year) setDiagYear(String(d.year));
          if (d.vin) setDiagVin(d.vin);
        }

        const vTypeLabel = VEHICLE_TYPES.find(v => v.id === d.vehicleType)?.label || d.vehicleType;
        setSunarpToast({
          title: `Consulta SUNARP Exitosa • Placa ${d.placa}`,
          details: `${d.marca} ${d.modelo} | Tipo: ${vTypeLabel} | Color: ${d.color} | Año: ${d.year} | Chasis/VIN: ${d.vin} | Titular: ${d.titular} (${d.sede})`
        });
        setTimeout(() => setSunarpToast(null), 12000);
      } else {
        alert(res?.message || 'No se obtuvieron registros de SUNARP para esta placa.');
      }
    } catch (err) {
      console.error('Error en lookup SUNARP:', err);
      alert('Error en consulta vehicular SUNARP: ' + (err.message || 'Error de conexión'));
    } finally {
      setSearchingSunarp(false);
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
        if (originMarkerRef.current) originMarkerRef.current.setLngLat(coords);
        if (destCoords && mapInstance.current) {
          updateRouteFromCoords(coords, destCoords, mapInstance.current);
        } else if (dispClientAddress) {
          calculateMapboxRoute(dispClientAddress, coords);
        }
      },
      (err) => {
        alert('No se pudo obtener GPS: ' + err.message + '. Se usará taller VES.');
        setOriginType('workshop');
        setOriginCoords(DEFAULT_ORIGIN.coords);
        setOriginLabel(DEFAULT_ORIGIN.name);
        if (originMarkerRef.current) originMarkerRef.current.setLngLat(DEFAULT_ORIGIN.coords);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Cálculo de Ruta con Mapbox desde texto
  const calculateMapboxRoute = async (destinationAddress, currentOrigin = originCoordsRef.current || originCoords) => {
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
        throw new Error(`No se ubicó: "${destinationAddress}". Puedes hacer clic en el mapa para colocar el pin.`);
      }

      const dest = geoData.features[0].center; // [lng, lat]
      setDestCoords(dest);
      destCoordsRef.current = dest;

      if (mapInstance.current) {
        placeDestMarker(dest, mapInstance.current);
        await updateRouteFromCoords(currentOrigin, dest, mapInstance.current);
      }
    } catch (err) {
      setRoutingError(err.message);
    } finally {
      setRoutingLoading(false);
    }
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
    setDispColor('');
    setDispYear('');
    setDispVin('');
    setDispAssignedMechanic('Darios Bacilio');
    setDispValidityDays(15);
    setDispPaymentCondition('Condición de pago 07 días despues de realizar el servicio.');
    setDispReportedFault('Auxilio técnico / Diagnóstico general de unidad');
    setOriginType('workshop');
    setOriginCoords(DEFAULT_ORIGIN.coords);
    originCoordsRef.current = DEFAULT_ORIGIN.coords;
    setOriginLabel(DEFAULT_ORIGIN.name);
    setDestCoords(DEFAULT_CLIENT_DEST);
    destCoordsRef.current = DEFAULT_CLIENT_DEST;
    setRouteDistanceKm(0);
    setRouteDurationMin(0);
    setTravelCost(0);
    setShowDispatchModal(true);
  };

  // Guardar Paso 1 (Despacho): Placa, color y año son opcionales
  const handleSaveDispatch = async (e) => {
    e.preventDefault();
    if (!dispClientName || !dispClientName.trim()) {
      alert('Por favor ingresa el nombre o razón social del cliente.');
      return;
    }

    try {
      const payload = {
        clientDoc: dispClientDoc.trim(),
        clientName: dispClientName.trim(),
        clientPhone: dispClientPhone.trim(),
        clientAddress: dispClientAddress.trim() || 'Ubicación seleccionada en mapa',
        driverName: dispDriverName.trim(),
        driverPhone: dispDriverPhone.trim(),
        plate: dispPlate.trim() ? dispPlate.toUpperCase().trim() : 'POR ASIGNAR',
        model: dispModel.trim() || 'No especificado',
        vehicleType: dispVehicleType,
        color: dispColor.trim() || 'No especificado',
        year: dispYear.trim() || '',
        vin: dispVin.trim(),
        assignedMechanic: dispAssignedMechanic || 'Darios Bacilio',
        validityDays: dispValidityDays ? Number(dispValidityDays) : 15,
        paymentCondition: dispPaymentCondition || 'Condición de pago 07 días despues de realizar el servicio.',
        reportedFault: dispReportedFault.trim() || 'Auxilio técnico / Diagnóstico general de unidad',
        status: 'DESPACHADO',
        originLocation: {
          name: originLabel,
          address: originLabel,
          coords: originCoords
        },
        destinationLocation: {
          address: dispClientAddress.trim() || 'Ubicación seleccionada en mapa',
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
        // Abrir directamente en modo diagnóstico
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
    setDiagPlate(order.plate === 'POR ASIGNAR' ? '' : (order.plate || ''));
    setDiagModel(order.model === 'No especificado' ? '' : (order.model || ''));
    setDiagVehicleType(order.vehicleType || 'SEDAN_AUTO');
    setDiagColor(order.color === 'No especificado' ? '' : (order.color || ''));
    setDiagYear(order.year || '');
    setDiagVin(order.vin || '');
    setDiagClientPhone(order.clientPhone || order.driverPhone || '');
    setDiagClientDoc(order.clientDoc || '');
    setDiagAssignedMechanic(
      (order.assignedMechanic && !order.assignedMechanic.includes('Basil'))
        ? order.assignedMechanic
        : 'Darios Bacilio'
    );
    setDiagDamages(order.damageMap || []);
    setDiagMileage(order.mileage || '');
    setDiagHourmeter(order.hourmeter || '');
    setDiagFuelLevel(order.fuelLevel || '1/2');
    setDiagBatteryVoltage('');
    setDiagChecklist(order.entryChecklist || {
      lucesYFaros: 'OPERATIVO',
      plumillasYParabrisas: 'OPERATIVO',
      lunasYVidrios: 'OPERATIVO',
      espejosRetrovisores: 'OPERATIVO',
      carroceriaGeneral: 'BUENO',
      llantaRepuesto: 'PRESENTE',
      gataYHerramientas: 'PRESENTE',
      extintorEmergencia: 'VIGENTE',
      documentosUnidad: 'ENTREGADO'
    });
    setDiagReportedFault(order.reportedFault || '');
    setDiagVisualObs(order.visualObservations || 'Inspección técnica de recepción completada sin novedades.');
    setDiagServices(order.diagnosticServices || []);
    setDiagParts(order.diagnosticParts || []);
    setDiagStatus(order.status || 'EN_DIAGNOSTICO');
    setQuoteValidityDays(order.validityDays || 15);
    setQuotePaymentCondition(order.paymentCondition || 'Condición de pago 07 días despues de realizar el servicio.');
    setHasSignatureData(!!order.clientSignature);
    setActiveDiagnosticTab('damage');
    setShowDiagnosticModal(true);
  };

  // Guardar Diagnóstico (incluyendo datos de la unidad confirmados en sitio)
  const handleSaveDiagnostic = async () => {
    if (!selectedOrder) return;
    try {
      const payload = {
        plate: (diagPlate || selectedOrder.plate || 'POR ASIGNAR').toUpperCase().trim(),
        model: diagModel || selectedOrder.model || '',
        vehicleType: diagVehicleType || selectedOrder.vehicleType || 'SEDAN_AUTO',
        color: diagColor || selectedOrder.color || '',
        year: diagYear || selectedOrder.year || '',
        vin: diagVin || selectedOrder.vin || '',
        clientPhone: diagClientPhone || selectedOrder.clientPhone || '',
        clientDoc: diagClientDoc || selectedOrder.clientDoc || '',
        assignedMechanic: diagAssignedMechanic || 'Darios Bacilio',
        validityDays: Number(quoteValidityDays) || 15,
        paymentCondition: quotePaymentCondition,
        damageMap: diagDamages,
        mileage: diagMileage,
        hourmeter: diagHourmeter,
        fuelLevel: diagFuelLevel,
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
      // Guardar primero el diagnóstico actual y datos del vehículo confirmados
      await api.updateWorkOrder(selectedOrder._id, {
        plate: (diagPlate || selectedOrder.plate || 'POR ASIGNAR').toUpperCase().trim(),
        model: diagModel || selectedOrder.model || '',
        vehicleType: diagVehicleType || selectedOrder.vehicleType || 'SEDAN_AUTO',
        color: diagColor || selectedOrder.color || '',
        year: diagYear || selectedOrder.year || '',
        vin: diagVin || selectedOrder.vin || '',
        clientPhone: diagClientPhone || selectedOrder.clientPhone || '',
        clientDoc: diagClientDoc || selectedOrder.clientDoc || '',
        assignedMechanic: diagAssignedMechanic || 'Darios Bacilio',
        validityDays: Number(quoteValidityDays) || 15,
        paymentCondition: quotePaymentCondition,
        damageMap: diagDamages,
        mileage: diagMileage,
        hourmeter: diagHourmeter,
        fuelLevel: diagFuelLevel,
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
        if (onRefreshQuotes) {
          onRefreshQuotes();
        }
        setShowDiagnosticModal(false);
        if (onSelectQuote) {
          onSelectQuote(createdQuote);
        }
      }
    } catch (err) {
      alert('Error generando cotización automática: ' + err.message);
    } finally {
      setAutoQuoteLoading(false);
    }
  };

  // Métodos de Firma Táctil con Sincronización 1:1 entre Cursor y Trazo
  const getCanvasCoordinates = (e) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches && e.touches[0] ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches && e.touches[0] ? e.touches[0].clientY : e.clientY;
    const scaleX = rect.width > 0 ? (canvas.width / rect.width) : 1;
    const scaleY = rect.height > 0 ? (canvas.height / rect.height) : 1;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const handleStartDraw = (e) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCanvasCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsSigning(true);
  };

  const handleDraw = (e) => {
    if (!isSigning) return;
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCanvasCoordinates(e);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0f294a';
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

  // CRUD: Eliminar Orden de Trabajo
  const handleDeleteOrder = async (order) => {
    if (!order) return;
    const confirmMsg = `¿Estás seguro de que deseas eliminar permanentemente la Orden de Trabajo ${order.orderNumber} del cliente "${order.clientName}"?\n\nEsta acción quitará el registro del módulo de taller.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await api.deleteWorkOrder(order._id);
      if (res?.success) {
        alert(`Orden de Trabajo ${order.orderNumber} eliminada con éxito.`);
        if (selectedOrder?._id === order._id) {
          setShowDiagnosticModal(false);
          setSelectedOrder(null);
        }
        fetchInitialData();
      } else {
        alert(res?.message || 'Error al eliminar la Orden de Trabajo');
      }
    } catch (err) {
      alert('Error al eliminar: ' + err.message);
    }
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
    if (!item) return;
    const existingIndex = diagServices.findIndex(s => s.code === item.code);
    if (existingIndex >= 0) {
      const updated = [...diagServices];
      updated[existingIndex].quantity = (Number(updated[existingIndex].quantity) || 1) + 1;
      setDiagServices(updated);
    } else {
      const newSrv = {
        code: item.code,
        description: item.description,
        quantity: 1,
        unitPrice: Number(item.defaultPrice) || 0,
        category: item.category || 'MANO_OBRA'
      };
      setDiagServices([...diagServices, newSrv]);
    }
  };

  const handleUpdateServiceQuantity = (index, delta) => {
    const updated = [...diagServices];
    const newQty = (Number(updated[index].quantity) || 1) + delta;
    if (newQty <= 0) {
      setDiagServices(updated.filter((_, i) => i !== index));
    } else {
      updated[index].quantity = newQty;
      setDiagServices(updated);
    }
  };

  // Agregar Repuesto a Diagnóstico
  const handleAddDiagnosticPart = (item) => {
    if (!item) return;
    const existingIndex = diagParts.findIndex(p => p.sku === item.sku);
    if (existingIndex >= 0) {
      const updated = [...diagParts];
      updated[existingIndex].quantity = (Number(updated[existingIndex].quantity) || 1) + 1;
      setDiagParts(updated);
    } else {
      const newPart = {
        inventoryItemId: item._id,
        sku: item.sku,
        name: item.name,
        quantity: 1,
        unitPrice: Number(item.salePrice) || 0,
        currentStock: item.currentStock || 0
      };
      setDiagParts([...diagParts, newPart]);
    }
  };

  const handleUpdatePartQuantity = (index, delta) => {
    const updated = [...diagParts];
    const newQty = (Number(updated[index].quantity) || 1) + delta;
    if (newQty <= 0) {
      setDiagParts(updated.filter((_, i) => i !== index));
    } else {
      updated[index].quantity = newQty;
      setDiagParts(updated);
    }
  };

  const handleUpdateServicePrice = (index, newPrice) => {
    const updated = [...diagServices];
    updated[index].unitPrice = parseFloat(newPrice) || 0;
    setDiagServices(updated);
  };

  const handleUpdateServiceDescription = (index, newDesc) => {
    const updated = [...diagServices];
    updated[index].description = newDesc;
    setDiagServices(updated);
  };

  const handleAddCustomService = () => {
    const nextNum = diagServices.length + 1;
    const newSrv = {
      code: `MO-CUST-${String(nextNum).padStart(2, '0')}`,
      description: 'SERVICIO ADICIONAL PERSONALIZADO',
      quantity: 1,
      unitPrice: 150.00,
      category: 'MANO_OBRA'
    };
    setDiagServices([...diagServices, newSrv]);
  };

  const handleUpdatePartPrice = (index, newPrice) => {
    const updated = [...diagParts];
    updated[index].unitPrice = parseFloat(newPrice) || 0;
    setDiagParts(updated);
  };

  const handleUpdatePartName = (index, newName) => {
    const updated = [...diagParts];
    updated[index].name = newName;
    setDiagParts(updated);
  };

  const handleAddCustomPart = () => {
    const nextNum = diagParts.length + 1;
    const newPart = {
      sku: `REP-CUST-${String(nextNum).padStart(2, '0')}`,
      name: 'REPUESTO O ACCESORIO PERSONALIZADO',
      quantity: 1,
      unitPrice: 80.00,
      currentStock: 10
    };
    setDiagParts([...diagParts, newPart]);
  };

  // Filtrado de servicios de catálogo (Mano de Obra)
  const filteredCatalog = useMemo(() => {
    const items = catalog && catalog.length > 0 ? catalog : FALLBACK_CATALOG;
    if (!serviceSearchTerm.trim()) return items;
    const term = serviceSearchTerm.toLowerCase().trim();
    return items.filter(c => 
      (c.code || '').toLowerCase().includes(term) ||
      (c.description || '').toLowerCase().includes(term) ||
      (c.category || '').toLowerCase().includes(term)
    );
  }, [catalog, serviceSearchTerm]);

  // Lista de autocompletado en vivo para búsqueda de servicios
  const searchMatchingServices = useMemo(() => {
    const items = catalog && catalog.length > 0 ? catalog : FALLBACK_CATALOG;
    if (!serviceSearchTerm.trim()) return [];
    const term = serviceSearchTerm.toLowerCase().trim();
    return items.filter(c => 
      (c.code || '').toLowerCase().includes(term) ||
      (c.description || '').toLowerCase().includes(term)
    ).slice(0, 10);
  }, [catalog, serviceSearchTerm]);

  // Filtrado de repuestos de inventario de almacén
  const filteredParts = useMemo(() => {
    const items = inventoryItems && inventoryItems.length > 0 ? inventoryItems : FALLBACK_INVENTORY;
    if (!partSearchTerm.trim()) return items;
    const term = partSearchTerm.toLowerCase().trim();
    return items.filter(p => 
      (p.sku || '').toLowerCase().includes(term) ||
      (p.name || '').toLowerCase().includes(term) ||
      (p.category || '').toLowerCase().includes(term) ||
      (p.location || '').toLowerCase().includes(term)
    );
  }, [inventoryItems, partSearchTerm]);

  // Lista de autocompletado en vivo para búsqueda de repuestos
  const searchMatchingParts = useMemo(() => {
    const items = inventoryItems && inventoryItems.length > 0 ? inventoryItems : FALLBACK_INVENTORY;
    if (!partSearchTerm.trim()) return [];
    const term = partSearchTerm.toLowerCase().trim();
    return items.filter(p => 
      (p.sku || '').toLowerCase().includes(term) ||
      (p.name || '').toLowerCase().includes(term)
    ).slice(0, 10);
  }, [inventoryItems, partSearchTerm]);

  // Totales estimados
  const totalServicesAmount = diagServices.reduce((acc, s) => acc + ((Number(s.quantity) || 1) * (Number(s.unitPrice) || 0)), 0);
  const totalPartsAmount = diagParts.reduce((acc, p) => acc + ((Number(p.quantity) || 1) * (Number(p.unitPrice) || 0)), 0);
  const totalEstimatedAmount = totalServicesAmount + totalPartsAmount;


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
          <span>Iniciar Orden de Trabajo (Despacho)</span>
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
          No se encontraron órdenes de trabajo activas. Inicia una con el botón "Iniciar Orden de Trabajo".
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
                    <div className="text-[11px] text-slate-400 flex items-center justify-between pt-0.5">
                      <span>Asesor: <b className="text-amber-300 font-semibold">{(!order.assignedMechanic || order.assignedMechanic.includes('Basil')) ? 'Darios Bacilio' : order.assignedMechanic}</b></span>
                    </div>
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
                        onClick={async () => {
                          if (onSelectQuote) {
                            try {
                              const qRes = await api.getQuoteById(order.generatedQuoteId || order.quoteId);
                              if (qRes?.success && qRes.data) {
                                onSelectQuote(qRes.data);
                                return;
                              }
                            } catch (e) {}
                            onSelectQuote({ _id: order.generatedQuoteId || order.quoteId, quoteNumber: quoteNum });
                          }
                        }}
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

                  <button
                    type="button"
                    onClick={() => onSelectQuote && onSelectQuote({ ...order, isWorkOrder: true })}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
                    title="Ver Acta Oficial de OT en el Sistema"
                  >
                    <FileText className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteOrder(order)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500/40 transition"
                    title="Eliminar Orden de Trabajo (CRUD)"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
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
                  <span>1. Identificación del Cliente</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">RUC o DNI (Opcional):</label>
                    <div className="flex space-x-1">
                      <input
                        type="text"
                        value={dispClientDoc}
                        onChange={(e) => setDispClientDoc(e.target.value)}
                        placeholder="8 dígitos DNI / 11 RUC (Opcional)"
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
                    <label className="block text-slate-400 font-semibold mb-1">Teléfono Contacto (Opcional):</label>
                    <input
                      type="text"
                      value={dispClientPhone}
                      onChange={(e) => setDispClientPhone(e.target.value)}
                      placeholder="Ej. 934787006 (Opcional)"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-mono outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              </div>

              {/* Bloque 2: Datos del Vehículo */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <Car className="w-3.5 h-3.5" />
                    <span>2. Datos de la Unidad Vehicular (Opcional para completar en sitio)</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">SUNARP Consulta Vehicular</span>
                </div>

                {sunarpToast && (
                  <div className="bg-emerald-950/90 border border-emerald-500/40 text-emerald-200 p-2.5 rounded-xl text-xs flex items-start justify-between gap-2 shadow-lg animate-fade-in">
                    <div>
                      <div className="font-bold flex items-center gap-1.5 text-emerald-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>{sunarpToast.title}</span>
                      </div>
                      <p className="text-[11px] text-emerald-200/90 mt-1 font-mono leading-relaxed">{sunarpToast.details}</p>
                    </div>
                    <button type="button" onClick={() => setSunarpToast(null)} className="text-emerald-400 hover:text-white p-1">✕</button>
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-slate-400 font-semibold text-[11px]">Placa (Opcional):</label>
                      <button
                        type="button"
                        onClick={() => handleLookupSunarp('disp')}
                        disabled={searchingSunarp}
                        className="text-[10px] font-bold text-amber-400 hover:text-amber-300 flex items-center space-x-1 bg-amber-500/10 hover:bg-amber-500/20 px-1.5 py-0.5 rounded-lg border border-amber-500/30 transition disabled:opacity-50"
                        title="Consultar datos vehiculares oficiales en SUNARP"
                      >
                        {searchingSunarp ? (
                          <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
                        ) : (
                          <Search className="w-3 h-3 text-amber-400" />
                        )}
                        <span>SUNARP</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      value={dispPlate}
                      onChange={(e) => setDispPlate(e.target.value.toUpperCase())}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleLookupSunarp('disp'); } }}
                      placeholder="Ej. ABC-123"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-amber-300 font-mono font-black outline-none focus:border-amber-400 uppercase tracking-wider"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Modelo (Opcional):</label>
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
                    <label className="block text-slate-400 font-semibold mb-1">Color / Año (Opcional):</label>
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

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">VIN / N° Chasis (Opcional):</label>
                    <input
                      type="text"
                      value={dispVin}
                      onChange={(e) => setDispVin(e.target.value.toUpperCase())}
                      placeholder="17 dígitos VIN"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-amber-300 font-mono text-[11px] outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-400 font-semibold mb-1">Motivo de Solicitud / Falla Declarada:</label>
                    <input
                      type="text"
                      value={dispReportedFault}
                      onChange={(e) => setDispReportedFault(e.target.value)}
                      placeholder="Ej. Unidad no arranca en frío, testigo de alternador encendido"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-400 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Asesor Técnico Responsable:</label>
                    <input
                      type="text"
                      value={dispAssignedMechanic}
                      onChange={(e) => setDispAssignedMechanic(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-amber-300 font-bold outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              </div>

              {/* Bloque 3: Condiciones Comerciales para la Cotización (Opcional) */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    <span>3. Parámetros Comerciales para Futura Cotización</span>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-900 text-amber-300 border border-amber-500/40">
                    Opcional • Se puede completar después
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Puedes omitir esta sección ahora; se podrá configurar o modificar directamente durante el diagnóstico en sitio o al generar la cotización oficial.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Días de Validez (Opcional):</label>
                    <div className="flex items-center space-x-1.5">
                      <input
                        type="number"
                        min="1"
                        max="90"
                        value={dispValidityDays}
                        onChange={(e) => setDispValidityDays(e.target.value)}
                        className="w-20 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-mono font-bold text-xs outline-none focus:border-amber-400"
                      />
                      <div className="flex space-x-1">
                        {[7, 15, 30].map(d => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => setDispValidityDays(d)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition ${
                              Number(dispValidityDays) === d
                                ? 'bg-amber-500 text-slate-950 border-amber-400'
                                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                            }`}
                          >
                            {d}d
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-400 font-semibold mb-1">Condición de Pago (Opcional):</label>
                    <input
                      type="text"
                      value={dispPaymentCondition}
                      onChange={(e) => setDispPaymentCondition(e.target.value)}
                      placeholder="Ej. Condición de pago 07 días despues de realizar el servicio."
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white text-xs outline-none focus:border-amber-400 mb-1.5"
                    />
                    <div className="flex flex-wrap gap-1">
                      {[
                        'Contado contra entrega',
                        'Condición de pago 07 días despues de realizar el servicio.',
                        'Crédito 15 días factura',
                        'Crédito 30 días',
                        '50% adelanto / 50% saldo contra entrega'
                      ].map(cond => (
                        <button
                          key={cond}
                          type="button"
                          onClick={() => setDispPaymentCondition(cond)}
                          className="px-2 py-0.5 rounded-md text-[10px] bg-slate-900 border border-slate-800 text-slate-300 hover:border-amber-400 hover:text-amber-300 transition"
                        >
                          {cond.length > 28 ? cond.slice(0, 28) + '...' : cond}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bloque 4: Trazado de Ruta y Viáticos (Mapbox) */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
                    <Navigation className="w-3.5 h-3.5" />
                    <span>4. Logística y Trazado de Ruta con Mapbox</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        setOriginType('workshop');
                        setOriginCoords(DEFAULT_ORIGIN.coords);
                        setOriginLabel(DEFAULT_ORIGIN.name);
                        if (originMarkerRef.current) originMarkerRef.current.setLngLat(DEFAULT_ORIGIN.coords);
                        if (destCoords && mapInstance.current) {
                          updateRouteFromCoords(DEFAULT_ORIGIN.coords, destCoords, mapInstance.current);
                        } else if (dispClientAddress) {
                          calculateMapboxRoute(dispClientAddress, DEFAULT_ORIGIN.coords);
                        }
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

                {/* Guía Interactiva para Colocar Pines */}
                <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/30 px-3 py-2 rounded-xl text-[11px] text-amber-300">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-amber-400 shrink-0 animate-bounce" />
                    <span><b>Fijar Ubicación Exacta:</b> Haz clic en cualquier lugar del mapa o arrastra el marcador 🚗 para colocar el pin del auxilio.</span>
                  </div>
                  {destCoords && (
                    <span className="font-mono text-[10px] text-slate-400 hidden sm:inline">
                      [{destCoords[1].toFixed(4)}, {destCoords[0].toFixed(4)}]
                    </span>
                  )}
                </div>

                {routingError && (
                  <div className="text-[11px] text-rose-400 bg-rose-500/10 p-2 rounded-lg border border-rose-500/30">
                    ⚠️ {routingError}
                  </div>
                )}

                {/* Visor de Mapa Mapbox */}
                <div 
                  ref={mapContainerRef} 
                  className="w-full h-52 rounded-xl overflow-hidden border border-slate-800 bg-slate-900"
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
                <span className={`font-mono font-black px-2.5 py-1 rounded-xl border text-sm ${
                  !diagPlate || diagPlate === 'POR ASIGNAR'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                    : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                }`}>
                  {diagPlate && diagPlate !== 'POR ASIGNAR' ? diagPlate : '⚠️ PLACA PENDIENTE'}
                </span>
                <span className="text-xs text-slate-400 hidden sm:inline">
                  {selectedOrder.clientName}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowDiagnosticModal(false);
                    onSelectQuote && onSelectQuote({ ...selectedOrder, isWorkOrder: true });
                  }}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                  title="Ver Acta de OT en PDF dentro del sistema"
                >
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  <span>Ver Acta de OT</span>
                </button>

                <button 
                  type="button" 
                  onClick={() => setShowDiagnosticModal(false)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Ficha de la Unidad en Sitio (Placa, Modelo, Color, Año editables presencialmente) */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 sm:p-4 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <Car className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Ficha del Vehículo en Sitio (Confirmación Presencial)
                  </span>
                  {(!diagPlate || diagPlate === 'POR ASIGNAR') && (
                    <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/40 animate-pulse">
                      ⚠️ Placa por Asignar
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-400">
                  * Registra o actualiza la placa y características reales observadas en la unidad
                </span>
              </div>

              {sunarpToast && (
                <div className="bg-emerald-950/90 border border-emerald-500/40 text-emerald-200 p-2.5 rounded-xl text-xs flex items-start justify-between gap-2 shadow-lg animate-fade-in mb-2">
                  <div>
                    <div className="font-bold flex items-center gap-1.5 text-emerald-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{sunarpToast.title}</span>
                    </div>
                    <p className="text-[11px] text-emerald-200/90 mt-1 font-mono leading-relaxed">{sunarpToast.details}</p>
                  </div>
                  <button type="button" onClick={() => setSunarpToast(null)} className="text-emerald-400 hover:text-white p-1">✕</button>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-semibold text-slate-400">
                      Placa:
                    </label>
                    <button
                      type="button"
                      onClick={() => handleLookupSunarp('diag')}
                      disabled={searchingSunarp}
                      className="text-[10px] font-bold text-amber-400 hover:text-amber-300 flex items-center space-x-1 bg-amber-500/10 hover:bg-amber-500/20 px-1.5 py-0.5 rounded-lg border border-amber-500/30 transition disabled:opacity-50"
                      title="Consultar datos vehiculares oficiales en SUNARP"
                    >
                      {searchingSunarp ? (
                        <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
                      ) : (
                        <Search className="w-3 h-3 text-amber-400" />
                      )}
                      <span>SUNARP</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Ej. ABC-123"
                    value={diagPlate}
                    onChange={(e) => setDiagPlate(e.target.value.toUpperCase())}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleLookupSunarp('diag'); } }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-amber-300 font-mono font-bold outline-none focus:border-amber-400 uppercase tracking-wider"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Modelo / Marca:
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Volvo FH 540 / Hilux"
                    value={diagModel}
                    onChange={(e) => setDiagModel(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Tipo de Unidad:
                  </label>
                  <select
                    value={diagVehicleType}
                    onChange={(e) => setDiagVehicleType(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2 py-1.5 text-xs text-white outline-none focus:border-amber-400"
                  >
                    {VEHICLE_TYPES.map(vt => (
                      <option key={vt.id} value={vt.id}>{vt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Color:
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Blanco / Rojo"
                    value={diagColor}
                    onChange={(e) => setDiagColor(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Año Fab.:
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. 2023"
                    value={diagYear}
                    onChange={(e) => setDiagYear(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    VIN / N° Chasis:
                  </label>
                  <input
                    type="text"
                    placeholder="17 caracteres VIN"
                    value={diagVin}
                    onChange={(e) => setDiagVin(e.target.value.toUpperCase())}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-amber-300 font-mono outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-800/60 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Teléfono Contacto (WhatsApp):
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. 934787006"
                    value={diagClientPhone}
                    onChange={(e) => setDiagClientPhone(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    DNI / RUC Cliente:
                  </label>
                  <input
                    type="text"
                    placeholder="DNI o RUC"
                    value={diagClientDoc}
                    onChange={(e) => setDiagClientDoc(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Asesor Técnico Responsable:
                  </label>
                  <input
                    type="text"
                    value={diagAssignedMechanic}
                    onChange={(e) => setDiagAssignedMechanic(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-amber-300 font-bold outline-none focus:border-amber-400"
                  />
                </div>
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

              {/* TAB 1: CARROCERÍA Y DAÑOS SEGÚN TIPO DE VEHÍCULO */}
              {activeDiagnosticTab === 'damage' && (
                <InteractiveCarDamage 
                  damages={diagDamages} 
                  onChange={setDiagDamages}
                  vehicleType={diagVehicleType || selectedOrder?.vehicleType || 'SEDAN_AUTO'}
                />
              )}

              {/* TAB 2: ODOMETRÍA, COMBUSTIBLE Y CHECKLIST SUPERFICIAL */}
              {activeDiagnosticTab === 'telemetry' && (
                <div className="space-y-4 text-xs">
                  {/* Odometría Dual al Ingreso (Sin Voltaje Batería) */}
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                    <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                      Mediciones de Odometría al Ingreso
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                        <label className="block text-slate-400 font-semibold mb-1">Horómetro (Maquinaria / Tracto):</label>
                        <input
                          type="text"
                          value={diagHourmeter}
                          onChange={(e) => setDiagHourmeter(e.target.value)}
                          placeholder="Ej. 3,500 hrs"
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold outline-none focus:border-amber-400"
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

                  {/* Checklist de Recepción Superficial */}
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                    <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center justify-between">
                      <span>Lista de Verificación Superficial al Ingreso (Recepción Física)</span>
                      <span className="text-[10px] text-slate-400 font-normal">* Estado exterior con el que llega la unidad</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-slate-400 font-medium mb-1">Luces & Faros:</label>
                        <select
                          value={diagChecklist.lucesYFaros}
                          onChange={(e) => setDiagChecklist({ ...diagChecklist, lucesYFaros: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white"
                        >
                          <option value="OPERATIVO">OPERATIVO</option>
                          <option value="PARCIAL">PARCIAL</option>
                          <option value="DEFICIENTE">DEFICIENTE / ROTO</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-400 font-medium mb-1">Plumillas & Parabrisas:</label>
                        <select
                          value={diagChecklist.plumillasYParabrisas || 'OPERATIVO'}
                          onChange={(e) => setDiagChecklist({ ...diagChecklist, plumillasYParabrisas: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white"
                        >
                          <option value="OPERATIVO">OPERATIVO</option>
                          <option value="DESGASTADO">DESGASTADO</option>
                          <option value="CON_FISURA">CON FISURA / RAJADURA</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-400 font-medium mb-1">Lunas & Vidrios:</label>
                        <select
                          value={diagChecklist.lunasYVidrios || 'OPERATIVO'}
                          onChange={(e) => setDiagChecklist({ ...diagChecklist, lunasYVidrios: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white"
                        >
                          <option value="OPERATIVO">OPERATIVO</option>
                          <option value="TRABADO">TRABADO / INOPERATIVO</option>
                          <option value="RAJADO">RAJADO</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-400 font-medium mb-1">Espejos Retrovisores:</label>
                        <select
                          value={diagChecklist.espejosRetrovisores || 'OPERATIVO'}
                          onChange={(e) => setDiagChecklist({ ...diagChecklist, espejosRetrovisores: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white"
                        >
                          <option value="OPERATIVO">COMPLETOS / OPERATIVO</option>
                          <option value="CON_ROTURA">CON ROTURA</option>
                          <option value="INCOMPLETO">INCOMPLETO / FALTA</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-400 font-medium mb-1">Carrocería General:</label>
                        <select
                          value={diagChecklist.carroceriaGeneral || 'BUENO'}
                          onChange={(e) => setDiagChecklist({ ...diagChecklist, carroceriaGeneral: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white"
                        >
                          <option value="BUENO">BUENO (SIN GOLPES)</option>
                          <option value="RAYONES">CON RAYONES LEVES</option>
                          <option value="ABOLLADURAS">CON ABOLLADURAS</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-400 font-medium mb-1">Llanta de Repuesto:</label>
                        <select
                          value={diagChecklist.llantaRepuesto || 'PRESENTE'}
                          onChange={(e) => setDiagChecklist({ ...diagChecklist, llantaRepuesto: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white"
                        >
                          <option value="PRESENTE">PRESENTE</option>
                          <option value="AUSENTE">AUSENTE</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-400 font-medium mb-1">Gata & Herramientas:</label>
                        <select
                          value={diagChecklist.gataYHerramientas || 'PRESENTE'}
                          onChange={(e) => setDiagChecklist({ ...diagChecklist, gataYHerramientas: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white"
                        >
                          <option value="PRESENTE">PRESENTE</option>
                          <option value="AUSENTE">AUSENTE</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-400 font-medium mb-1">Extintor de Emergencia:</label>
                        <select
                          value={diagChecklist.extintorEmergencia || 'VIGENTE'}
                          onChange={(e) => setDiagChecklist({ ...diagChecklist, extintorEmergencia: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white"
                        >
                          <option value="VIGENTE">VIGENTE</option>
                          <option value="VENCIDO">VENCIDO</option>
                          <option value="AUSENTE">AUSENTE</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-400 font-medium mb-1">Documentos de la Unidad:</label>
                        <select
                          value={diagChecklist.documentosUnidad || 'ENTREGADO'}
                          onChange={(e) => setDiagChecklist({ ...diagChecklist, documentosUnidad: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white"
                        >
                          <option value="ENTREGADO">ENTREGADO</option>
                          <option value="NO_ENTREGADO">NO ENTREGADO</option>
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
                        {/* Buscador en Vivo por texto o código */}
                        <div className="relative w-56 sm:w-64">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                          <input
                            type="text"
                            placeholder="Buscar servicio (ej. rele, MO01)..."
                            value={serviceSearchTerm}
                            onChange={(e) => setServiceSearchTerm(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-7 py-1.5 text-[11px] text-white outline-none focus:border-amber-400"
                          />
                          {serviceSearchTerm && (
                            <button
                              type="button"
                              onClick={() => setServiceSearchTerm('')}
                              className="absolute right-2 top-2 text-slate-400 hover:text-white"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Desplegable rápido alternativo */}
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              const found = (catalog && catalog.length > 0 ? catalog : FALLBACK_CATALOG).find(c => c.code === e.target.value);
                              if (found) handleAddDiagnosticService(found);
                              e.target.value = '';
                            }
                          }}
                          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-2.5 py-1.5 rounded-xl text-[11px] outline-none transition cursor-pointer"
                        >
                          <option value="">⚡ + Catálogo Completo...</option>
                          {filteredCatalog.map(c => (
                            <option key={c.code} value={c.code}>
                              {c.code} - {c.description} (S/ {Number(c.defaultPrice).toFixed(2)})
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          onClick={handleAddCustomService}
                          className="bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center space-x-1 transition shrink-0"
                          title="Agregar servicio personalizado fuera de catálogo"
                        >
                          <Plus className="w-3 h-3" />
                          <span>+ Fila Personalizada</span>
                        </button>
                      </div>
                    </div>

                    {/* Panel de Resultados Coincidentes en Tiempo Real */}
                    {serviceSearchTerm.trim() && (
                      <div className="bg-slate-900/95 border border-amber-500/40 rounded-xl p-3 space-y-2 animate-fadeIn shadow-xl">
                        <div className="flex items-center justify-between text-[11px] text-amber-300 font-semibold border-b border-slate-800 pb-1.5">
                          <span>Resultados en catálogo para "{serviceSearchTerm}" ({searchMatchingServices.length}):</span>
                          <span className="text-slate-400 text-[10px]">Haz clic en "+ Agregar" para incluir en el diagnóstico</span>
                        </div>

                        {searchMatchingServices.length === 0 ? (
                          <div className="text-slate-400 italic py-2 text-center text-[11px]">
                            No se encontraron servicios que coincidan con "{serviceSearchTerm}".
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                            {searchMatchingServices.map((srv) => (
                              <div
                                key={srv.code}
                                className="bg-slate-950 border border-slate-800 hover:border-amber-500/50 p-2.5 rounded-xl flex items-center justify-between gap-2 transition"
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center space-x-1.5">
                                    <span className="bg-amber-500/20 text-amber-400 font-mono font-bold px-1.5 py-0.5 rounded text-[10px]">
                                      {srv.code}
                                    </span>
                                    <span className="text-[10px] text-slate-400 truncate">
                                      {srv.category}
                                    </span>
                                  </div>
                                  <div className="text-white font-medium text-[11px] truncate mt-0.5" title={srv.description}>
                                    {srv.description}
                                  </div>
                                  <div className="text-amber-300 font-mono font-bold text-[11px]">
                                    S/ {Number(srv.defaultPrice).toFixed(2)}
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleAddDiagnosticService(srv)}
                                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-2.5 py-1.5 rounded-lg text-[11px] flex items-center space-x-1 shrink-0 transition active:scale-95 shadow"
                                >
                                  <Plus className="w-3 h-3 stroke-[3]" />
                                  <span>Agregar</span>
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tabla de Servicios Agregados */}
                    {diagServices.length === 0 ? (
                      <div className="p-3 text-center text-slate-500 italic bg-slate-900/50 rounded-xl">
                        No has agregado servicios de mano de obra. Escribe en el buscador, usa el selector "+ Catálogo Completo" o "+ Fila Personalizada".
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden">
                        {diagServices.map((srv, idx) => (
                          <div key={idx} className="p-2.5 flex flex-col sm:flex-row sm:items-center justify-between bg-slate-900/80 gap-2 hover:bg-slate-900 transition">
                            <div className="flex items-center space-x-2 min-w-0 flex-1">
                              <span className="font-mono font-bold text-amber-400 text-xs shrink-0">{srv.code}</span>
                              <input
                                type="text"
                                value={srv.description}
                                onChange={(e) => handleUpdateServiceDescription(idx, e.target.value)}
                                className="w-full bg-slate-950/60 border border-slate-800 focus:border-amber-400 rounded-lg px-2 py-1 text-white font-medium text-[11px] outline-none transition"
                                title="Editar descripción de servicio"
                              />
                            </div>
                            <div className="flex items-center space-x-2.5 shrink-0 self-end sm:self-auto">
                              {/* Ajustador de Cantidad */}
                              <div className="flex items-center bg-slate-950 border border-slate-700 rounded-lg overflow-hidden">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateServiceQuantity(idx, -1)}
                                  className="px-2 py-0.5 text-slate-400 hover:text-white hover:bg-slate-800 transition"
                                  title="Disminuir"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="px-2 text-amber-300 font-mono font-bold text-xs">
                                  {srv.quantity || 1}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateServiceQuantity(idx, 1)}
                                  className="px-2 py-0.5 text-slate-400 hover:text-white hover:bg-slate-800 transition"
                                  title="Aumentar"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>

                              {/* Precio Unitario Editable */}
                              <div className="flex items-center space-x-1">
                                <span className="text-slate-400 text-[10px]">c/u S/</span>
                                <input
                                  type="number"
                                  step="any"
                                  min="0"
                                  value={srv.unitPrice}
                                  onChange={(e) => handleUpdateServicePrice(idx, e.target.value)}
                                  className="w-20 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-right text-amber-300 font-mono font-bold text-xs outline-none focus:border-amber-400"
                                  title="Modificar precio unitario (ej. cambiar 100 a 150)"
                                />
                              </div>

                              <span className="font-mono font-bold text-amber-300 text-xs w-20 text-right">
                                S/ {((Number(srv.quantity) || 1) * (Number(srv.unitPrice) || 0)).toFixed(2)}
                              </span>

                              <button
                                type="button"
                                onClick={() => setDiagServices(diagServices.filter((_, i) => i !== idx))}
                                className="text-slate-500 hover:text-rose-400 p-1 transition"
                                title="Eliminar servicio"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}

                        <div className="p-2.5 bg-slate-950/80 flex items-center justify-between text-xs">
                          <span className="text-slate-400 font-semibold">Subtotal Mano de Obra:</span>
                          <span className="font-mono font-black text-amber-400 text-sm">
                            S/ {totalServicesAmount.toFixed(2)}
                          </span>
                        </div>
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

                      <div className="flex items-center space-x-2">
                        {/* Buscador en Vivo por SKU o nombre */}
                        <div className="relative w-56 sm:w-64">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                          <input
                            type="text"
                            placeholder="Buscar repuesto (ej. relé, fusible, cable)..."
                            value={partSearchTerm}
                            onChange={(e) => setPartSearchTerm(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-7 py-1.5 text-[11px] text-white outline-none focus:border-blue-400"
                          />
                          {partSearchTerm && (
                            <button
                              type="button"
                              onClick={() => setPartSearchTerm('')}
                              className="absolute right-2 top-2 text-slate-400 hover:text-white"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Desplegable rápido alternativo */}
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              const found = (inventoryItems && inventoryItems.length > 0 ? inventoryItems : FALLBACK_INVENTORY).find(i => i._id === e.target.value || i.sku === e.target.value);
                              if (found) handleAddDiagnosticPart(found);
                              e.target.value = '';
                            }
                          }}
                          className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-2.5 py-1.5 rounded-xl text-[11px] outline-none transition cursor-pointer"
                        >
                          <option value="">⚙️ + Ver Todo el Almacén...</option>
                          {filteredParts.map(item => (
                            <option key={item._id || item.sku} value={item._id || item.sku}>
                              {item.sku} - {item.name} (S/ {Number(item.salePrice).toFixed(2)})
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          onClick={handleAddCustomPart}
                          className="bg-slate-800 hover:bg-slate-700 text-blue-400 border border-blue-500/30 px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center space-x-1 transition shrink-0"
                          title="Agregar repuesto o accesorio personalizado"
                        >
                          <Plus className="w-3 h-3" />
                          <span>+ Fila Personalizada</span>
                        </button>
                      </div>
                    </div>

                    {/* Panel de Resultados Coincidentes en Tiempo Real */}
                    {partSearchTerm.trim() && (
                      <div className="bg-slate-900/95 border border-blue-500/40 rounded-xl p-3 space-y-2 animate-fadeIn shadow-xl">
                        <div className="flex items-center justify-between text-[11px] text-blue-300 font-semibold border-b border-slate-800 pb-1.5">
                          <span>Repuestos coincidentes en almacén para "{partSearchTerm}" ({searchMatchingParts.length}):</span>
                          <span className="text-slate-400 text-[10px]">Haz clic en "+ Agregar" para incluir en el diagnóstico</span>
                        </div>

                        {searchMatchingParts.length === 0 ? (
                          <div className="text-slate-400 italic py-2 text-center text-[11px]">
                            No se encontraron repuestos que coincidan con "{partSearchTerm}".
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                            {searchMatchingParts.map((part) => (
                              <div
                                key={part.sku}
                                className="bg-slate-950 border border-slate-800 hover:border-blue-500/50 p-2.5 rounded-xl flex items-center justify-between gap-2 transition"
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center space-x-1.5">
                                    <span className="bg-blue-500/20 text-blue-400 font-mono font-bold px-1.5 py-0.5 rounded text-[10px]">
                                      {part.sku}
                                    </span>
                                    <span className="text-[10px] text-emerald-400">
                                      Stock: {part.currentStock} {part.unit || 'Uds.'}
                                    </span>
                                  </div>
                                  <div className="text-white font-medium text-[11px] truncate mt-0.5" title={part.name}>
                                    {part.name}
                                  </div>
                                  <div className="text-amber-300 font-mono font-bold text-[11px]">
                                    S/ {Number(part.salePrice).toFixed(2)}
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleAddDiagnosticPart(part)}
                                  className="bg-blue-600 hover:bg-blue-500 text-white font-black px-2.5 py-1.5 rounded-lg text-[11px] flex items-center space-x-1 shrink-0 transition active:scale-95 shadow"
                                >
                                  <Plus className="w-3 h-3 stroke-[3]" />
                                  <span>Agregar</span>
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tabla de Repuestos Agregados */}
                    {diagParts.length === 0 ? (
                      <div className="p-3 text-center text-slate-500 italic bg-slate-900/50 rounded-xl">
                        No has agregado repuestos. Escribe en el buscador, usa el selector "+ Ver Todo el Almacén" o "+ Fila Personalizada".
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden">
                        {diagParts.map((part, idx) => (
                          <div key={idx} className="p-2.5 flex flex-col sm:flex-row sm:items-center justify-between bg-slate-900/80 gap-2 hover:bg-slate-900 transition">
                            <div className="flex items-center space-x-2 min-w-0 flex-1">
                              <span className="font-mono font-bold text-blue-400 text-xs shrink-0">{part.sku}</span>
                              <input
                                type="text"
                                value={part.name}
                                onChange={(e) => handleUpdatePartName(idx, e.target.value)}
                                className="w-full bg-slate-950/60 border border-slate-800 focus:border-blue-400 rounded-lg px-2 py-1 text-white font-medium text-[11px] outline-none transition"
                                title="Editar nombre de repuesto"
                              />
                            </div>
                            <div className="flex items-center space-x-2.5 shrink-0 self-end sm:self-auto">
                              {/* Ajustador de Cantidad */}
                              <div className="flex items-center bg-slate-950 border border-slate-700 rounded-lg overflow-hidden">
                                <button
                                  type="button"
                                  onClick={() => handleUpdatePartQuantity(idx, -1)}
                                  className="px-2 py-0.5 text-slate-400 hover:text-white hover:bg-slate-800 transition"
                                  title="Disminuir"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="px-2 text-blue-300 font-mono font-bold text-xs">
                                  {part.quantity || 1}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleUpdatePartQuantity(idx, 1)}
                                  className="px-2 py-0.5 text-slate-400 hover:text-white hover:bg-slate-800 transition"
                                  title="Aumentar"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>

                              {/* Precio Unitario Editable */}
                              <div className="flex items-center space-x-1">
                                <span className="text-slate-400 text-[10px]">c/u S/</span>
                                <input
                                  type="number"
                                  step="any"
                                  min="0"
                                  value={part.unitPrice}
                                  onChange={(e) => handleUpdatePartPrice(idx, e.target.value)}
                                  className="w-20 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-right text-blue-300 font-mono font-bold text-xs outline-none focus:border-blue-400"
                                  title="Modificar precio unitario del repuesto"
                                />
                              </div>

                              <span className="font-mono font-bold text-amber-300 text-xs w-20 text-right">
                                S/ {((Number(part.quantity) || 1) * (Number(part.unitPrice) || 0)).toFixed(2)}
                              </span>

                              <button
                                type="button"
                                onClick={() => setDiagParts(diagParts.filter((_, i) => i !== idx))}
                                className="text-slate-500 hover:text-rose-400 p-1 transition"
                                title="Eliminar repuesto"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}

                        <div className="p-2.5 bg-slate-950/80 flex items-center justify-between text-xs">
                          <span className="text-slate-400 font-semibold">Subtotal Repuestos de Taller:</span>
                          <span className="font-mono font-black text-blue-400 text-sm">
                            S/ {totalPartsAmount.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Términos Comerciales para la Cotización Oficial */}
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
                        <FileText className="w-3.5 h-3.5" />
                        <span>Términos Comerciales para la Cotización Oficial</span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        Configura aquí la validez y forma de pago acordada en sitio
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1">Días de Validez de Cotización:</label>
                        <div className="flex items-center space-x-1.5">
                          <input
                            type="number"
                            min="1"
                            max="90"
                            value={quoteValidityDays}
                            onChange={(e) => setQuoteValidityDays(e.target.value)}
                            className="w-20 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-mono font-bold text-xs outline-none focus:border-amber-400"
                          />
                          <div className="flex space-x-1">
                            {[7, 15, 30].map(d => (
                              <button
                                key={d}
                                type="button"
                                onClick={() => setQuoteValidityDays(d)}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition ${
                                  Number(quoteValidityDays) === d
                                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                                }`}
                              >
                                {d}d
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-slate-400 font-semibold mb-1">Condición de Pago Acordada:</label>
                        <input
                          type="text"
                          value={quotePaymentCondition}
                          onChange={(e) => setQuotePaymentCondition(e.target.value)}
                          placeholder="Ej. Condición de pago 07 días despues de realizar el servicio."
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white text-xs outline-none focus:border-amber-400 mb-1.5"
                        />
                        <div className="flex flex-wrap gap-1">
                          {[
                            'Contado contra entrega',
                            'Condición de pago 07 días despues de realizar el servicio.',
                            'Crédito 15 días factura',
                            'Crédito 30 días',
                            '50% adelanto / 50% saldo contra entrega'
                          ].map(cond => (
                            <button
                              key={cond}
                              type="button"
                              onClick={() => setQuotePaymentCondition(cond)}
                              className="px-2 py-0.5 rounded-md text-[10px] bg-slate-900 border border-slate-800 text-slate-300 hover:border-amber-400 hover:text-amber-300 transition"
                            >
                              {cond.length > 28 ? cond.slice(0, 28) + '...' : cond}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Resumen Total Estimado */}
                  <div className="p-3 bg-gradient-to-r from-amber-500/10 via-slate-950 to-blue-500/10 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center space-x-4 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Mano de Obra ({diagServices.length}):</span>
                        <span className="font-mono font-bold text-amber-400">S/ {totalServicesAmount.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Repuestos ({diagParts.length}):</span>
                        <span className="font-mono font-bold text-blue-400">S/ {totalPartsAmount.toFixed(2)}</span>
                      </div>
                      <div className="border-l border-slate-700 pl-4">
                        <span className="text-slate-400 block text-[10px]">Total Estimado Diagnóstico:</span>
                        <span className="font-mono font-black text-emerald-400 text-base">S/ {totalEstimatedAmount.toFixed(2)}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveDiagnosticTab('signature')}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition flex items-center space-x-1.5 shadow cursor-pointer"
                    >
                      <span>Continuar a Firma & Cierre</span>
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
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
