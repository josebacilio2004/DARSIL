import React, { useState } from 'react';
import { AlertCircle, Trash2, Plus, Check, ShieldAlert, Sparkles, X } from 'lucide-react';

const DAMAGE_TYPES = [
  { id: 'CHOQUE', label: 'Choque / Colisión', color: 'bg-red-500', text: 'text-red-400', border: 'border-red-500', hex: '#ef4444' },
  { id: 'ABOLLADURA', label: 'Abolladura / Hundimiento', color: 'bg-amber-500', text: 'text-amber-400', border: 'border-amber-500', hex: '#f59e0b' },
  { id: 'RAYON', label: 'Rayón / Raspón', color: 'bg-orange-500', text: 'text-orange-400', border: 'border-orange-500', hex: '#f97316' },
  { id: 'ROTURA', label: 'Fisura / Roto', color: 'bg-purple-500', text: 'text-purple-400', border: 'border-purple-500', hex: '#a855f7' },
];

const PRESET_PARTS = [
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
  { part: 'guardabarro_del_der', label: 'Guardabarro Del. Der', view: 'right', x: 80, y: 86 },
  { part: 'guardabarro_post_der', label: 'Guardabarro Post. Der', view: 'right', x: 25, y: 86 },
  { part: 'faros_delanteros', label: 'Faros Delanteros', view: 'front', x: 15, y: 18 },
  { part: 'faros_posteriores', label: 'Faros Posteriores', view: 'rear', x: 83, y: 16 },
  { part: 'espejos_retrovisores', label: 'Espejos Retrovisores', view: 'top', x: 19, y: 48 },
  { part: 'lunas_vidrios', label: 'Lunas / Vidrios', view: 'left', x: 50, y: 65 }
];

export default function InteractiveCarDamage({ damages = [], onChange, readOnly = false }) {
  const [selectedPart, setSelectedPart] = useState('');
  const [damageType, setDamageType] = useState('RAYON');
  const [damageNotes, setDamageNotes] = useState('');
  const [activeView, setActiveView] = useState('all'); // all, front, rear, top, left, right
  const [showAddModal, setShowAddModal] = useState(false);
  const [clickCoords, setClickCoords] = useState(null);

  const handleContainerClick = (e) => {
    if (readOnly) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);

    // Deducir zona aproximada según coordenadas relativas
    let inferredPart = 'Zona de Carrocería';
    let inferredView = 'top';

    if (x < 45 && y < 35) {
      inferredPart = 'Frontal / Parachoques Delantero';
      inferredView = 'front';
    } else if (x > 55 && y < 35) {
      inferredPart = 'Posterior / Maletera / Parachoques';
      inferredView = 'rear';
    } else if (x < 40 && y >= 35) {
      inferredPart = 'Vista Superior / Techo';
      inferredView = 'top';
    } else if (y >= 45 && y < 75) {
      inferredPart = 'Lateral Izquierdo (Lado Conductor)';
      inferredView = 'left';
    } else {
      inferredPart = 'Lateral Derecho (Lado Copiloto)';
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

  return (
    <div className="space-y-4">
      {/* Barra Superior con Resumen y Leyenda */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <span className="font-bold text-slate-200">
            Peritaje Visual de Carrocería (5 Ángulos)
          </span>
          <span className="bg-amber-500/20 text-amber-300 font-mono px-2 py-0.5 rounded-full font-bold">
            {damages.length} {damages.length === 1 ? 'avería' : 'averías'}
          </span>
        </div>

        {/* Leyenda de Daños */}
        <div className="flex flex-wrap items-center gap-2">
          {DAMAGE_TYPES.map(t => (
            <div key={t.id} className="flex items-center space-x-1.5 bg-black/40 px-2 py-1 rounded-lg border border-slate-800">
              <span className={`w-2.5 h-2.5 rounded-full ${t.color}`}></span>
              <span className="text-[11px] font-semibold text-slate-300">{t.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Contenedor Interactivo de las 5 Vistas del Auto */}
      <div className="relative bg-slate-950 border border-slate-800 rounded-2xl p-4 overflow-hidden shadow-2xl">
        <div className="text-[11px] text-slate-400 mb-2 flex items-center justify-between">
          <span>👆 <b>Haz clic en cualquier sector del auto</b> o selecciona un botón rápido para registrar un daño:</span>
          {!readOnly && (
            <span className="text-amber-400 font-medium">Toque / Clic directo habilitado</span>
          )}
        </div>

        {/* Área Visual con la imagen de 5 vistas y pines interactivos */}
        <div 
          onClick={handleContainerClick}
          className="relative w-full max-w-2xl mx-auto rounded-xl overflow-hidden bg-white/95 cursor-crosshair border-2 border-dashed border-amber-500/30 hover:border-amber-500 transition select-none"
          style={{ minHeight: '320px' }}
        >
          {/* Imagen de base con las 5 vistas */}
          <img 
            src="./car_views_diagram.png" 
            alt="5 Vistas de Carrocería" 
            className="w-full h-auto object-contain mx-auto pointer-events-none filter contrast-125"
          />

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

      {/* Botones de Selección Rápida de Piezas (Ideal para Móvil y Táctil) */}
      {!readOnly && (
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3">
          <div className="text-xs font-bold text-slate-300 mb-2 flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Marcado Rápido por Pieza / Componente de Carrocería:</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {PRESET_PARTS.map((p, idx) => (
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
            Detalle de Averías Preexistentes Inspeccionadas ({damages.length}):
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
