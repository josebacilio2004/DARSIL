import React, { useState, useEffect } from 'react';
import { AlertCircle, Trash2, Plus, Check, ShieldAlert, Sparkles, X, Car, Truck, Boxes } from 'lucide-react';

const DAMAGE_TYPES = [
  { id: 'CHOQUE', label: 'Choque / Colisión', color: 'bg-red-500', text: 'text-red-400', border: 'border-red-500', hex: '#ef4444' },
  { id: 'ABOLLADURA', label: 'Abolladura / Hundimiento', color: 'bg-amber-500', text: 'text-amber-400', border: 'border-amber-500', hex: '#f59e0b' },
  { id: 'RAYON', label: 'Rayón / Raspón', color: 'bg-orange-500', text: 'text-orange-400', border: 'border-orange-500', hex: '#f97316' },
  { id: 'ROTURA', label: 'Fisura / Roto', color: 'bg-purple-500', text: 'text-purple-400', border: 'border-purple-500', hex: '#a855f7' },
];

const VEHICLE_TEMPLATES = [
  { id: 'SEDAN_AUTO', label: 'Sedán', icon: '🚗', image: './car_views_diagram.png' },
  { id: 'CAMIONETA_PICKUP', label: 'Camioneta o Pick-up', icon: '🛻', image: './PICKUP.jfif' },
  { id: 'TRACTO_CAMION', label: 'Tractocamión', icon: '🚛', image: './TRACTO.jfif' },
  { id: 'MIXER', label: 'Mixer', icon: '🔄', image: './MIXER.jfif' }
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
  CAMIONETA_PICKUP: [
    { part: 'parachoques_delantero_pickup', label: 'Parachoques Delantero / Barra', view: 'front', x: 20, y: 25 },
    { part: 'capo_pickup', label: 'Capó / Máscara Frontal', view: 'front', x: 22, y: 18 },
    { part: 'parabrisas_pickup', label: 'Parabrisas Delantero', view: 'front', x: 25, y: 12 },
    { part: 'puerta_delantera_izq', label: 'Puerta Delantera Conductor', view: 'left', x: 42, y: 65 },
    { part: 'puerta_trasera_izq', label: 'Puerta Trasera Izq', view: 'left', x: 58, y: 65 },
    { part: 'tolva_cajon', label: 'Tolva / Balde / Cajón Pick-up', view: 'left', x: 78, y: 65 },
    { part: 'compuerta_tolva', label: 'Compuerta Posterior de Tolva', view: 'rear', x: 80, y: 25 },
    { part: 'estribos_laterales', label: 'Estribos Laterales Izq/Der', view: 'left', x: 50, y: 80 },
    { part: 'barra_antivuelco', label: 'Barra Antivuelco / Rollbar', view: 'top', x: 68, y: 55 },
    { part: 'techo_pickup', label: 'Techo / Rieles Superiores', view: 'top', x: 50, y: 45 },
    { part: 'faros_delanteros_pickup', label: 'Faros y Neblineros Delanteros', view: 'front', x: 18, y: 20 },
    { part: 'faros_posteriores_pickup', label: 'Faros Posteriores / Stop', view: 'rear', x: 82, y: 30 }
  ],
  TRACTO_CAMION: [
    { part: 'mascara_calandra', label: 'Máscara / Calandra Frontal', view: 'front', x: 22, y: 30 },
    { part: 'parachoques_pesado', label: 'Parachoques Metálico Pesado', view: 'front', x: 22, y: 40 },
    { part: 'parabrisas_tracto', label: 'Parabrisas Panorámico Tracto', view: 'front', x: 22, y: 18 },
    { part: 'deflector_techo', label: 'Deflector de Techo Aerodinámico', view: 'top', x: 30, y: 25 },
    { part: 'puerta_conductor_tracto', label: 'Puerta Conductor & Peldaños', view: 'left', x: 38, y: 65 },
    { part: 'dormitorio_litera', label: 'Sector Litera / Cabina Dormitorio', view: 'left', x: 52, y: 60 },
    { part: 'tanque_diesel_izq', label: 'Tanque Petróleo Diésel Izq', view: 'left', x: 52, y: 78 },
    { part: 'tanque_diesel_der', label: 'Tanque Petróleo Diésel Der', view: 'right', x: 52, y: 78 },
    { part: 'quinta_rueda', label: 'Quinta Rueda / Enganche de Remolque', view: 'rear', x: 75, y: 45 },
    { part: 'caja_baterias_24v', label: 'Caja Baterías 24V Tracto', view: 'left', x: 65, y: 75 },
    { part: 'guardabarros_tracto', label: 'Guardabarros Ejes Motrices', view: 'rear', x: 75, y: 35 },
    { part: 'faros_faena_tracto', label: 'Faros de Faena y Trocha', view: 'rear', x: 78, y: 20 }
  ],
  MIXER: [
    { part: 'trompo_tambor_mixer', label: 'Tambor / Trompo Mezclador Giratorio', view: 'left', x: 55, y: 45 },
    { part: 'tolva_carga_mixer', label: 'Tolva de Carga / Embudo Superior', view: 'rear', x: 78, y: 20 },
    { part: 'canaleta_descarga_mixer', label: 'Canaleta de Descarga y Extensiones', view: 'rear', x: 82, y: 50 },
    { part: 'cabina_operador_mixer', label: 'Cabina Operador y Espejos', view: 'left', x: 25, y: 55 },
    { part: 'tanque_agua_mixer', label: 'Tanque Presurizado de Agua', view: 'top', x: 38, y: 40 },
    { part: 'sistema_hidraulico_trompo', label: 'Bomba y Reductor Hidráulico Trompo', view: 'front', x: 36, y: 60 },
    { part: 'parachoques_frontal_mixer', label: 'Parachoques Frontal Pesado', view: 'front', x: 18, y: 35 },
    { part: 'guardabarros_posteriores', label: 'Guardabarros Ejes Posteriores', view: 'rear', x: 72, y: 70 },
    { part: 'mandos_posteriores_mixer', label: 'Mandos Posteriores de Mezcla/Giro', view: 'rear', x: 85, y: 65 },
    { part: 'escalera_inspeccion_mixer', label: 'Escalera / Plataforma Inspección', view: 'rear', x: 75, y: 35 }
  ]
};
// Compatibilidad previa
VEHICLE_PRESETS.CAMIONETA_SUV = VEHICLE_PRESETS.CAMIONETA_PICKUP;

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
          className="relative w-full max-w-2xl mx-auto rounded-xl overflow-hidden bg-slate-900/90 cursor-crosshair border-2 border-dashed border-amber-500/30 hover:border-amber-500 transition select-none flex items-center justify-center min-h-[220px] sm:min-h-[320px]"
        >
          {/* Muestra la plantilla técnica o blueprint del vehículo seleccionado (Sedán, Camioneta o Pick-up, Tractocamión, Mixer) */}
          {currentTemplate.image ? (
            <img 
              src={currentTemplate.image} 
              alt={`Esquema de ${currentTemplate.label}`} 
              className="w-full h-auto max-h-[440px] object-contain mx-auto pointer-events-none filter contrast-125 bg-white/95 rounded-lg shadow-inner"
            />
          ) : (
            <div className="w-full h-full p-4 flex flex-col items-center justify-center relative bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-400">
              <div className="text-6xl drop-shadow-[0_0_20px_rgba(245,158,11,0.5)]">
                {currentTemplate.icon}
              </div>
              <div className="font-mono font-black text-white text-base tracking-wider uppercase mt-2">
                ESQUEMA TÉCNICO • {currentTemplate.label}
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
        <div className="fixed inset-0 z-50 overflow-y-auto p-3 sm:p-4 flex min-h-full items-start sm:items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 sm:p-5 max-w-md w-full my-auto shadow-2xl space-y-4">
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
