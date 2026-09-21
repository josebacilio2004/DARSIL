import React, { useState, useEffect } from 'react';
import { AlertCircle, Trash2, Plus, Check, ShieldAlert, Sparkles, X, Car, Truck, Boxes } from 'lucide-react';

const DAMAGE_TYPES = [
  { id: 'CHOQUE', label: 'Choque / Colisión', color: 'bg-red-500', text: 'text-red-400', border: 'border-red-500', hex: '#ef4444' },
  { id: 'ABOLLADURA', label: 'Abolladura / Hundimiento', color: 'bg-amber-500', text: 'text-amber-400', border: 'border-amber-500', hex: '#f59e0b' },
  { id: 'RAYON', label: 'Rayón / Raspón', color: 'bg-orange-500', text: 'text-orange-400', border: 'border-orange-500', hex: '#f97316' },
  { id: 'ROTURA', label: 'Fisura / Roto', color: 'bg-purple-500', text: 'text-purple-400', border: 'border-purple-500', hex: '#a855f7' },
];

const VEHICLE_TEMPLATES = [
  { id: 'SEDAN_AUTO', label: 'Sedán / Auto Liviano', icon: '🚗' },
  { id: 'CAMIONETA_SUV', label: 'Camioneta / SUV / Pick-up', icon: '🛻' },
  { id: 'TRACTO_CAMION', label: 'Tractocamión / Volquete', icon: '🚛' },
  { id: 'BUS', label: 'Bus Pasajeros / Urbano', icon: '🚌' },
  { id: 'MAQUINARIA', label: 'Maquinaria / Línea Amarilla', icon: '🚜' }
];

const VEHICLE_PRESETS = {
  SEDAN_AUTO: [
    { part: 'puerta_conductor', label: 'Puerta Conductor (Izq)', view: 'left', x: 42, y: 72 },
    { part: 'puerta_pasajero_izq', label: 'Puerta Pasajero Izq', view: 'left', x: 62, y: 72 },
    { part: 'parachoques_delantero', label: 'Parachoques Delantero', view: 'front', x: 22, y: 22 },
    { part: 'capo', label: 'Capó / Capot', view: 'front', x: 22, y: 15 },
    { part: 'parabrisas_delantero', label: 'Parabrisas Delantero', view: 'front', x: 22, y: 8 },
    { part: 'parachoques_posterior', label: 'Parachoques Posterior', view: 'rear', x: 74, y: 22 },
    { part: 'maletera', label: 'Maletera / Compuerta', view: 'rear', x: 74, y: 14 },
    { part: 'techo', label: 'Techo / Cabina', view: 'top', x: 19, y: 55 },
    { part: 'guardabarro_del_izq', label: 'Guardabarro Del. Izq', view: 'left', x: 25, y: 70 },
    { part: 'guardabarro_post_izq', label: 'Guardabarro Post. Izq', view: 'left', x: 80, y: 70 },
    { part: 'puerta_copiloto', label: 'Puerta Copiloto (Der)', view: 'right', x: 62, y: 86 },
    { part: 'puerta_pasajero_der', label: 'Puerta Pasajero Der', view: 'right', x: 42, y: 86 },
    { part: 'faros_delanteros', label: 'Faros Delanteros', view: 'front', x: 15, y: 18 },
    { part: 'faros_posteriores', label: 'Faros Posteriores', view: 'rear', x: 83, y: 16 },
    { part: 'espejos_retrovisores', label: 'Espejos Retrovisores', view: 'top', x: 19, y: 48 },
    { part: 'lunas_vidrios', label: 'Lunas / Vidrios', view: 'left', x: 50, y: 65 }
  ],
  CAMIONETA_SUV: [
    { part: 'parachoques_delantero_suv', label: 'Parachoques Delantero / Barra', view: 'front', x: 22, y: 22 },
    { part: 'capo_suv', label: 'Capó Reforzado', view: 'front', x: 22, y: 15 },
    { part: 'parabrisas_suv', label: 'Parabrisas Frontal', view: 'front', x: 22, y: 8 },
    { part: 'puerta_delantera_izq', label: 'Puerta Delantera Conductor', view: 'left', x: 40, y: 72 },
    { part: 'puerta_trasera_izq', label: 'Puerta Trasera Izq', view: 'left', x: 60, y: 72 },
    { part: 'tolva_cajon', label: 'Tolva / Platón / Cajón', view: 'left', x: 80, y: 70 },
    { part: 'compuerta_tolva', label: 'Compuerta de Tolva / Portón', view: 'rear', x: 74, y: 18 },
    { part: 'estribos_laterales', label: 'Estribo Lateral Izq/Der', view: 'left', x: 50, y: 82 },
    { part: 'barra_antivuelco', label: 'Rollbar / Barra Antivuelco', view: 'top', x: 25, y: 62 },
    { part: 'techo_suv', label: 'Techo / Rieles de Carga', view: 'top', x: 19, y: 55 },
    { part: 'faros_neblineros', label: 'Faros y Neblineros Delanteros', view: 'front', x: 15, y: 18 },
    { part: 'espejos_suv', label: 'Espejos Retrovisores Eléctricos', view: 'top', x: 19, y: 48 }
  ],
  TRACTO_CAMION: [
    { part: 'cabina_frontal', label: 'Máscara / Calandra Frontal', view: 'front', x: 22, y: 20 },
    { part: 'parachoques_metalico', label: 'Parachoques Metálico Pesado', view: 'front', x: 22, y: 26 },
    { part: 'parabrisas_dividido', label: 'Parabrisas Panorámico Tracto', view: 'front', x: 22, y: 10 },
    { part: 'deflector_rompevientos', label: 'Deflector de Techo / Aerodinámico', view: 'top', x: 19, y: 48 },
    { part: 'puerta_conductor_tracto', label: 'Puerta Conductor & Peldaños', view: 'left', x: 38, y: 70 },
    { part: 'litera_dormitorio', label: 'Sector Litera / Dormitorio', view: 'left', x: 55, y: 70 },
    { part: 'tanque_combustible_izq', label: 'Tanque Petróleo Diésel Izq', view: 'left', x: 55, y: 82 },
    { part: 'tanque_combustible_der', label: 'Tanque Petróleo Diésel Der', view: 'right', x: 55, y: 82 },
    { part: 'quinta_rueda', label: 'Quinta Rueda / Enganche Plato', view: 'rear', x: 74, y: 20 },
    { part: 'caja_baterias_tracto', label: 'Caja de Baterías 24V Tracto', view: 'left', x: 70, y: 80 },
    { part: 'guardabarros_metalicos', label: 'Guardabarros Metálicos Ejes', view: 'rear', x: 74, y: 14 },
    { part: 'faros_faena_techo', label: 'Faros Pirata / Faena Trasera', view: 'rear', x: 80, y: 10 }
  ],
  BUS: [
    { part: 'parabrisas_panoramico_bus', label: 'Parabrisas Panorámico Doble', view: 'front', x: 22, y: 10 },
    { part: 'mascara_bus', label: 'Máscara Delantera & Logo Bus', view: 'front', x: 22, y: 20 },
    { part: 'puerta_pasajeros', label: 'Puerta Principal de Pasajeros', view: 'right', x: 32, y: 85 },
    { part: 'puerta_conductor_bus', label: 'Puerta / Ventana Conductor', view: 'left', x: 30, y: 70 },
    { part: 'bodegas_laterales_izq', label: 'Bodegas / Maleteros Izq', view: 'left', x: 55, y: 80 },
    { part: 'bodegas_laterales_der', label: 'Bodegas / Maleteros Der', view: 'right', x: 55, y: 80 },
    { part: 'ventanales_laterales', label: 'Ventanales Panorámicos Salón', view: 'left', x: 55, y: 65 },
    { part: 'parachoques_delantero_bus', label: 'Parachoques Delantero Bus', view: 'front', x: 22, y: 25 },
    { part: 'tapa_compartimiento_motor', label: 'Tapa Compartimiento Motor Posterior', view: 'rear', x: 74, y: 20 },
    { part: 'parachoques_posterior_bus', label: 'Parachoques Posterior Bus', view: 'rear', x: 74, y: 25 },
    { part: 'espejos_cuerno_bus', label: 'Espejos Panorámicos Tipo Cuerno', view: 'front', x: 15, y: 12 },
    { part: 'techo_acondicionado_bus', label: 'Techo / Equipo Aire Acondicionado', view: 'top', x: 19, y: 52 }
  ],
  MAQUINARIA: [
    { part: 'cucharon_pala', label: 'Cucharón / Pala Frontal / Lampón', view: 'front', x: 15, y: 24 },
    { part: 'brazo_pluma', label: 'Pluma / Brazo / Cilindros Levante', view: 'front', x: 22, y: 15 },
    { part: 'cabina_rops', label: 'Cabina Blindada ROP/FOPS', view: 'top', x: 22, y: 50 },
    { part: 'orugas_rodado', label: 'Orugas Metálicas / Rodado OTR', view: 'left', x: 50, y: 82 },
    { part: 'contrapeso_posterior', label: 'Contrapeso Posterior Maquinaria', view: 'rear', x: 74, y: 20 },
    { part: 'capot_compartimiento_motor', label: 'Capot Motor Diésel / Enfriador', view: 'rear', x: 74, y: 12 },
    { part: 'cilindros_hidraulicos', label: 'Cilindros Hidráulicos y Sellos', view: 'front', x: 28, y: 18 },
    { part: 'faros_faena_cabina', label: 'Faros LED de Faena / Girofaro', view: 'top', x: 19, y: 45 },
    { part: 'tanque_hidraulico', label: 'Tanque de Aceite Hidráulico', view: 'left', x: 65, y: 72 }
  ]
};

export default function InteractiveCarDamage({ damages = [], onChange, readOnly = false, vehicleType = 'SEDAN_AUTO' }) {
  const [currentType, setCurrentType] = useState(vehicleType || 'SEDAN_AUTO');
  const [selectedPart, setSelectedPart] = useState('');
  const [damageType, setDamageType] = useState('RAYON');
  const [damageNotes, setDamageNotes] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [clickCoords, setClickCoords] = useState(null);

  useEffect(() => {
    if (vehicleType && VEHICLE_PRESETS[vehicleType]) {
      setCurrentType(vehicleType);
    }
  }, [vehicleType]);

  const activePresets = VEHICLE_PRESETS[currentType] || VEHICLE_PRESETS.SEDAN_AUTO;

  const handleContainerClick = (e) => {
    if (readOnly) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);

    // Deducir zona aproximada según coordenadas relativas
    let inferredPart = 'Zona de Carrocería';
    let inferredView = 'top';

    if (x < 45 && y < 35) {
      inferredPart = 'Sector Frontal / Delantero';
      inferredView = 'front';
    } else if (x > 55 && y < 35) {
      inferredPart = 'Sector Posterior / Trasero';
      inferredView = 'rear';
    } else if (x < 40 && y >= 35) {
      inferredPart = 'Vista Superior / Techo / Cabina';
      inferredView = 'top';
    } else if (y >= 45 && y < 75) {
      inferredPart = 'Lateral Izquierdo (Conductor)';
      inferredView = 'left';
    } else {
      inferredPart = 'Lateral Derecho (Copiloto)';
      inferredView = 'right';
    }

    setClickCoords({ x, y, view: inferredView });
    setSelectedPart(inferredPart);
    setShowAddModal(true);
  };

  const handleAddPreset = (preset) => {
    if (readOnly) return;
    setClickCoords({ x: preset.x, y: preset.y, view: preset.view });
    setSelectedPart(preset.label);
    setShowAddModal(true);
  };

  const handleConfirmDamage = () => {
    if (!selectedPart) return;

    const newDamage = {
      id: 'DMG-' + Date.now().toString().slice(-5),
      part: selectedPart,
      label: selectedPart,
      damageType,
      view: clickCoords?.view || 'top',
      x: clickCoords?.x || 50,
      y: clickCoords?.y || 50,
      notes: damageNotes.trim()
    };

    const updated = [...damages, newDamage];
    onChange && onChange(updated);

    setShowAddModal(false);
    setSelectedPart('');
    setDamageNotes('');
    setClickCoords(null);
  };

  const handleRemoveDamage = (id) => {
    if (readOnly) return;
    const updated = damages.filter(d => d.id !== id);
    onChange && onChange(updated);
  };

  const currentTemplate = VEHICLE_TEMPLATES.find(t => t.id === currentType) || VEHICLE_TEMPLATES[0];

  return (
    <div className="space-y-4">
      {/* Barra Superior con Selector de Tipo de Vehículo y Resumen */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <span className="font-bold text-slate-200">
            Peritaje Visual de Daños
          </span>
          <span className="bg-amber-500/20 text-amber-300 font-mono px-2 py-0.5 rounded-full font-bold">
            {damages.length} {damages.length === 1 ? 'avería' : 'averías'}
          </span>
        </div>

        {/* Selector de plantilla de vehículo interactuable */}
        <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 overflow-x-auto">
          {VEHICLE_TEMPLATES.map(vt => (
            <button
              key={vt.id}
              type="button"
              onClick={() => setCurrentType(vt.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center space-x-1 transition ${
                currentType === vt.id
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
              title={vt.label}
            >
              <span>{vt.icon}</span>
              <span className="hidden sm:inline">{vt.label.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        {/* Leyenda de Daños */}
        <div className="flex flex-wrap items-center gap-1.5">
          {DAMAGE_TYPES.map(t => (
            <div key={t.id} className="flex items-center space-x-1.5 bg-black/40 px-2 py-0.5 rounded-lg border border-slate-800">
              <span className={`w-2 h-2 rounded-full ${t.color}`}></span>
              <span className="text-[10px] font-semibold text-slate-300">{t.label.split(' ')[0]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Contenedor Interactivo según el Tipo de Vehículo */}
      <div className="relative bg-slate-950 border border-slate-800 rounded-2xl p-4 overflow-hidden shadow-2xl">
        <div className="text-[11px] text-slate-400 mb-2 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-amber-400 font-black text-sm">{currentTemplate.icon}</span>
            <span>Plantilla activa: <b className="text-white">{currentTemplate.label}</b> (Haz clic para fijar pin de avería)</span>
          </div>
          {!readOnly && (
            <span className="text-amber-400 font-semibold text-[10px]">Puntos interactivos habilitados</span>
          )}
        </div>

        {/* Área Visual con la plantilla correspondiente */}
        <div 
          onClick={handleContainerClick}
          className="relative w-full max-w-2xl mx-auto rounded-xl overflow-hidden bg-slate-900/90 cursor-crosshair border-2 border-dashed border-amber-500/30 hover:border-amber-500 transition select-none flex items-center justify-center"
          style={{ minHeight: '330px' }}
        >
          {/* Si es SEDAN_AUTO, muestra la imagen de 5 vistas */}
          {currentType === 'SEDAN_AUTO' ? (
            <img 
              src="./car_views_diagram.png" 
              alt="5 Vistas de Carrocería Sedán" 
              className="w-full h-auto object-contain mx-auto pointer-events-none filter contrast-125 bg-white/95 rounded-lg"
            />
          ) : (
            /* Plantilla vectorial / blueprint para Camioneta, Tractocamión, Bus o Maquinaria */
            <div className="w-full h-full p-4 flex flex-col items-center justify-center relative bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-400">
              {/* Cuadrícula de ingeniería */}
              <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:20px_20px] opacity-15 pointer-events-none"></div>

              <div className="text-center z-10 space-y-2 pointer-events-none py-6">
                <div className="text-6xl drop-shadow-[0_0_20px_rgba(245,158,11,0.5)]">
                  {currentTemplate.icon}
                </div>
                <div className="font-mono font-black text-white text-base tracking-wider uppercase">
                  ESQUEMA TÉCNICO • {currentTemplate.label}
                </div>
                <p className="text-[11px] text-amber-300 max-w-md mx-auto">
                  Haz clic en cualquier sector del diagrama o selecciona un componente rápido abajo para registrar el peritaje.
                </p>

                <div className="grid grid-cols-3 gap-3 text-[10px] font-mono text-slate-400 pt-3">
                  <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2">
                    <span className="text-amber-400 block font-bold">ZONA FRONTAL</span>
                    <span>Capó / Parachoques / Luces</span>
                  </div>
                  <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2">
                    <span className="text-cyan-400 block font-bold">CABINA Y LATERALES</span>
                    <span>Puertas / Tolva / Tanques</span>
                  </div>
                  <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2">
                    <span className="text-purple-400 block font-bold">ZONA POSTERIOR</span>
                    <span>Compuerta / Ejes / 5ta Rueda</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Pines de Daño Registrados */}
          {damages.map((d, index) => {
            const typeConfig = DAMAGE_TYPES.find(t => t.id === d.damageType) || DAMAGE_TYPES[2];
            return (
              <div
                key={d.id || index}
                style={{ left: `${d.x}%`, top: `${d.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-20 group"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!readOnly && window.confirm(`¿Eliminar avería #${index + 1}: ${d.label}?`)) {
                    handleRemoveDamage(d.id);
                  }
                }}
              >
                <div className={`w-6 h-6 rounded-full ${typeConfig.color} text-white font-black text-xs flex items-center justify-center shadow-lg ring-2 ring-white cursor-pointer transform hover:scale-125 transition active:scale-90 animate-bounce-short`}>
                  {index + 1}
                </div>

                {/* Tooltip con detalle del daño */}
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 hidden group-hover:block bg-slate-950/95 text-white text-[10px] font-semibold px-2 py-1 rounded shadow-xl whitespace-nowrap border border-slate-700 z-30 pointer-events-none">
                  <span className={typeConfig.text}>[{typeConfig.label}]</span> {d.label}
                  {d.notes && <span className="block text-slate-400 font-normal italic">{d.notes}</span>}
                  {!readOnly && <span className="block text-rose-400 text-[9px] mt-0.5 font-bold">Clic para eliminar</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Botones de Selección Rápida de Piezas según Tipo de Vehículo */}
      {!readOnly && (
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3">
          <div className="text-xs font-bold text-slate-300 mb-2 flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Piezas y Componentes Rápidos ({currentTemplate.label}):</span>
            </div>
            <span className="text-[10px] text-slate-400">Clic en cualquier pieza para marcar de inmediato</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {activePresets.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleAddPreset(p)}
                className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-slate-800 hover:bg-amber-500/20 hover:text-amber-300 hover:border-amber-500/50 border border-slate-700 text-slate-200 transition active:scale-95"
              >
                + {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Lista / Tabla de Daños Registrados */}
      {damages.length > 0 && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3">
          <div className="text-xs font-bold text-slate-300 mb-2">
            Detalle de Averías Inspeccionadas ({damages.length}):
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {damages.map((d, index) => {
              const typeConfig = DAMAGE_TYPES.find(t => t.id === d.damageType) || DAMAGE_TYPES[2];
              return (
                <div 
                  key={d.id || index}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs"
                >
                  <div className="flex items-center space-x-2">
                    <span className={`w-5 h-5 rounded-full ${typeConfig.color} text-white font-bold text-[10px] flex items-center justify-center`}>
                      {index + 1}
                    </span>
                    <div>
                      <div className="font-bold text-slate-200">{d.label}</div>
                      <div className="text-[10px] text-slate-400">
                        <span className={`font-semibold ${typeConfig.text}`}>[{typeConfig.label}]</span>
                        {d.notes && ` • ${d.notes}`}
                      </div>
                    </div>
                  </div>

                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => handleRemoveDamage(d.id)}
                      className="text-slate-500 hover:text-rose-400 p-1 transition"
                      title="Eliminar registro de daño"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal para Seleccionar Tipo de Daño tras hacer Clic */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Registrar Avería en Carrocería</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Sector / Pieza del Vehículo:</label>
              <input
                type="text"
                value={selectedPart}
                onChange={(e) => setSelectedPart(e.target.value)}
                placeholder="Ej. Puerta Conductor, Parachoques Delantero"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-medium outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Clasificación del Daño:</label>
              <div className="grid grid-cols-2 gap-2">
                {DAMAGE_TYPES.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setDamageType(t.id)}
                    className={`flex items-center space-x-2 p-2 rounded-xl text-xs font-bold border transition ${
                      damageType === t.id 
                        ? `${t.border} bg-slate-800/90 text-white shadow-md` 
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className={`w-3 h-3 rounded-full ${t.color}`}></span>
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Observación / Severidad (Opcional):</label>
              <input
                type="text"
                value={damageNotes}
                onChange={(e) => setDamageNotes(e.target.value)}
                placeholder="Ej. Hundimiento de 5cm sin afectar pintura, raspón leve"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-amber-400"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDamage}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-gold-glow hover:brightness-110 active:scale-95 transition"
              >
                + Registrar Daño
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
