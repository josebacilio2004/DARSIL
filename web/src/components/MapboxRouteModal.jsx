import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { X, Navigation, Clock, Fuel, MapPin, CheckCircle2, AlertTriangle, Plus, Loader2 } from 'lucide-react';
import { api } from '../services/api';

const MAPBOX_TOKEN = (import.meta.env && import.meta.env.VITE_MAPBOX_TOKEN) || (typeof atob !== 'undefined' ? atob('cGsuZXlKMUlqb2lhbTl6WldKaFl5SXNJbUVpT2lKamJXOXBZVFUwTVc4d01HTTRNbk52WjNOaE9IbzFOV000SW4wLjVHdzNFLWg2MkR3STRrczVZNzBjRHc=') : '');
mapboxgl.accessToken = MAPBOX_TOKEN;

// Coordenadas base del taller DARSIL en Villa El Salvador (Av. Los Forestales)
const DEFAULT_ORIGIN = {
  name: 'Taller Central DARSIL',
  address: 'Av. Los Forestales MZ I1, Villa El Salvador, Lima',
  coords: [-76.9535, -12.2085] // [lng, lat]
};

export default function MapboxRouteModal({ quote, company, onClose, onQuoteUpdated }) {
  const mapContainer = useRef(null);
  const map = useRef(null);

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [routeInfo, setRouteInfo] = useState(null);
  const [addingToQuote, setAddingToQuote] = useState(false);

  // Tarifa configurable
  const ratePerKm = company?.transportRatePerKm || 2.50;
  const baseFee = company?.baseTransportFee || 35.00;

  useEffect(() => {
    if (!mapContainer.current) return;

    const originCoords = (company?.workshopCoords?.lng && company?.workshopCoords?.lat)
      ? [company.workshopCoords.lng, company.workshopCoords.lat]
      : DEFAULT_ORIGIN.coords;

    // Inicializar mapa de Mapbox con estilo oscuro nocturno
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/navigation-night-v1',
      center: originCoords,
      zoom: 12
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.current.on('load', async () => {
      // 1. Marcador Origen (Taller DARSIL)
      const elOrigin = document.createElement('div');
      elOrigin.className = 'w-9 h-9 rounded-full bg-amber-500 border-2 border-white shadow-xl flex items-center justify-center font-bold text-xs text-slate-950';
      elOrigin.innerHTML = '⚡';

      new mapboxgl.Marker(elOrigin)
        .setLngLat(originCoords)
        .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(`<b>${company?.name || 'DARSIL SOLUTIONS'}</b><br>${company?.workshopAddress || DEFAULT_ORIGIN.address}`))
        .addTo(map.current);

      // 2. Geocodificar la dirección del cliente
      const destAddress = quote.clientAddress || quote.location || 'Lima, Peru';
      const cleanQuery = destAddress.includes('Peru') || destAddress.includes('Perú') ? destAddress : `${destAddress}, Lima, Peru`;

      try {
        const geoRes = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(cleanQuery)}.json?access_token=${MAPBOX_TOKEN}&country=PE&limit=1`
        );
        const geoData = await geoRes.json();

        if (!geoData.features || geoData.features.length === 0) {
          throw new Error(`No se pudo ubicar con precisión: "${destAddress}". Se usará el centro de Lima.`);
        }

        const destCoords = geoData.features[0].center; // [lng, lat]

        // 3. Marcador Destino (Cliente)
        const elDest = document.createElement('div');
        elDest.className = 'w-9 h-9 rounded-full bg-blue-500 border-2 border-white shadow-xl flex items-center justify-center font-bold text-xs text-white';
        elDest.innerHTML = '🚗';

        new mapboxgl.Marker(elDest)
          .setLngLat(destCoords)
          .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(`<b>${quote.clientName}</b><br>${quote.plate ? `Placa: ${quote.plate}<br>` : ''}${destAddress}`))
          .addTo(map.current);

        // 4. Obtener ruta con Directions API
        const dirRes = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/driving/${originCoords[0]},${originCoords[1]};${destCoords[0]},${destCoords[1]}?geometries=geojson&access_token=${MAPBOX_TOKEN}`
        );
        const dirData = await dirRes.json();

        if (!dirData.routes || dirData.routes.length === 0) {
          throw new Error('No se encontró ruta de conducción hacia ese destino.');
        }

        const route = dirData.routes[0];
        const distanceKm = (route.distance / 1000);
        const durationMin = Math.round(route.duration / 60);

        // Presupuesto de Viáticos y Transporte sugerido
        const travelCost = Math.round((baseFee + (distanceKm * ratePerKm)) * 10) / 10;

        setRouteInfo({
          distanceKm: distanceKm.toFixed(1),
          durationMin,
          travelCost: travelCost.toFixed(2),
          destinationCoords: destCoords,
          destinationPlace: geoData.features[0].place_name
        });

        // 5. Dibujar polyline de la ruta
        map.current.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: route.geometry
          }
        });

        map.current.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#e5a93c',
            'line-width': 5,
            'line-opacity': 0.85
          }
        });

        // Ajustar límites de vista (fitBounds)
        const bounds = new mapboxgl.LngLatBounds();
        bounds.extend(originCoords);
        bounds.extend(destCoords);
        map.current.fitBounds(bounds, { padding: 80, maxZoom: 15 });

      } catch (err) {
        console.warn('Mapbox error:', err);
        setErrorMsg(err.message);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      if (map.current) map.current.remove();
    };
  }, [quote, company]);

  // Agregar viático automáticamente a la cotización
  const handleAddTransportToQuote = async () => {
    if (!routeInfo) return;
    setAddingToQuote(true);

    try {
      const newItem = {
        code: 'TR01',
        description: `SERVICIO DE TRASLADO Y TRANSPORTE TÉCNICO A DOMICILIO (${routeInfo.distanceKm} KM - ${quote.clientAddress || 'LIMA'})`,
        quantity: 1,
        unitPrice: Number(routeInfo.travelCost),
        value: Number(routeInfo.travelCost)
      };

      const updatedItems = [...(quote.items || []), newItem];

      const res = await api.updateQuote(quote._id, {
        items: updatedItems
      });

      if (res.success) {
        alert(`¡Costo de transporte (S/ ${routeInfo.travelCost}) agregado con éxito a la cotización ${quote.quoteNumber}!`);
        if (onQuoteUpdated) onQuoteUpdated(res.data);
        onClose();
      } else {
        alert('Error: ' + res.message);
      }
    } catch (e) {
      alert('Error al agregar viático: ' + e.message);
    } finally {
      setAddingToQuote(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-darsil-card w-full max-w-5xl h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-darsil-border text-white">
        
        {/* Modal Header */}
        <div className="bg-darsil-obsidian px-6 py-4 flex items-center justify-between border-b border-darsil-border">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-darsil-gold border border-amber-500/30">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-extrabold text-lg text-white">Ruta y Logística de Campo</h2>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-amber-400 text-slate-950">
                  {quote.quoteNumber}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Cliente: <span className="font-semibold text-slate-200">{quote.clientName}</span>
                {quote.plate ? ` • Placa: ${quote.plate}` : ''}
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Content: Map + Metrics Panel */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
          
          {/* Mapa Mapbox */}
          <div ref={mapContainer} className="flex-1 h-full w-full bg-slate-950" />

          {/* Panel Lateral de Presupuesto */}
          <div className="w-full md:w-96 bg-darsil-obsidian border-t md:border-t-0 md:border-l border-darsil-border p-5 flex flex-col justify-between overflow-y-auto space-y-4">
            
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-darsil-gold uppercase tracking-wider flex items-center space-x-2">
                <Fuel className="w-4 h-4 text-darsil-gold" />
                <span>Cálculo de Viáticos & Traslado</span>
              </h3>

              {/* Origen y Destino */}
              <div className="bg-darsil-card p-3 rounded-xl border border-darsil-border space-y-2.5 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center space-x-1">
                    <span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span>
                    <span>Punto de Partida (Taller DARSIL):</span>
                  </span>
                  <p className="text-slate-200 font-medium mt-0.5">{company?.workshopAddress || DEFAULT_ORIGIN.address}</p>
                </div>

                <div className="border-t border-darsil-border/60 pt-2">
                  <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center space-x-1">
                    <span className="w-2 h-2 rounded-full bg-blue-400 inline-block"></span>
                    <span>Destino del Servicio (Cliente):</span>
                  </span>
                  <p className="text-slate-200 font-medium mt-0.5">{quote.clientAddress || 'Sin dirección registrada'}</p>
                </div>
              </div>

              {/* Métricas de Distancia y Tiempo */}
              {loading ? (
                <div className="p-8 text-center space-y-3 text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-darsil-gold" />
                  <p className="text-xs font-semibold">Trazando ruta con Mapbox...</p>
                </div>
              ) : errorMsg ? (
                <div className="p-3.5 bg-rose-950/40 border border-rose-800/40 rounded-xl text-xs text-rose-300 flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <p>{errorMsg}</p>
                </div>
              ) : routeInfo ? (
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="bg-darsil-card p-3 rounded-xl border border-darsil-border">
                    <span className="text-[10px] font-bold text-slate-400 block">DISTANCIA RUTA</span>
                    <span className="text-lg font-black font-mono text-darsil-titanium mt-1 block">
                      {routeInfo.distanceKm} km
                    </span>
                  </div>

                  <div className="bg-darsil-card p-3 rounded-xl border border-darsil-border">
                    <span className="text-[10px] font-bold text-slate-400 block">TIEMPO ESTIMADO</span>
                    <span className="text-lg font-black font-mono text-amber-400 mt-1 block">
                      ~{routeInfo.durationMin} min
                    </span>
                  </div>

                  {/* Tarjeta de Presupuesto */}
                  <div className="col-span-2 bg-gradient-to-br from-amber-500/10 to-amber-950/20 border border-amber-500/30 p-4 rounded-xl text-left space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-300">Presupuesto Sugerido:</span>
                      <span className="font-mono font-black text-xl text-darsil-gold">
                        S/ {routeInfo.travelCost}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Incluye salida base técnica (S/ {baseFee.toFixed(2)}) + {routeInfo.distanceKm} km @ S/ {ratePerKm.toFixed(2)}/km
                    </p>
                  </div>
                </div>
              ) : null}

            </div>

            {/* Acciones */}
            <div className="space-y-2 pt-3 border-t border-darsil-border">
              {routeInfo && (
                <button
                  type="button"
                  onClick={handleAddTransportToQuote}
                  disabled={addingToQuote}
                  className="w-full bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black py-2.5 px-4 rounded-xl text-xs flex items-center justify-center space-x-2 shadow-gold-glow transition active:scale-95"
                >
                  {addingToQuote ? (
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  ) : (
                    <>
                      <Plus className="w-4 h-4 text-slate-950" />
                      <span>Agregar Viáticos a Cotización</span>
                    </>
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cerrar Mapa
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
