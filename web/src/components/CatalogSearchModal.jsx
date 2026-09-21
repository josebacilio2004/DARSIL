import React, { useState, useMemo } from 'react';
import { Search, X, Plus, Wrench, Cpu, Printer, Check, Tag } from 'lucide-react';

export default function CatalogSearchModal({ catalog = [], isOpen, onClose, onSelectItem, onAddBlankRow }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('ALL'); // ALL, MO, DG, 3D

  const filteredItems = useMemo(() => {
    return catalog.filter(item => {
      const term = searchTerm.toLowerCase().trim();
      const codeMatch = (item.code || '').toLowerCase().includes(term);
      const descMatch = (item.description || '').toLowerCase().includes(term);
      const categoryMatch = (item.category || '').toLowerCase().includes(term);
      const textMatches = !term || codeMatch || descMatch || categoryMatch;

      if (!textMatches) return false;

      if (selectedFilter === 'ALL') return true;
      if (selectedFilter === 'MO') return (item.code || '').startsWith('MO') || item.category === 'MANO_DE_OBRA';
      if (selectedFilter === 'DG') return (item.code || '').startsWith('DG') || item.category === 'DIAGNOSTICO';
      if (selectedFilter === '3D') return (item.code || '').startsWith('3D') || item.category === 'IMPRESION_3D';
      return true;
    });
  }, [catalog, searchTerm, selectedFilter]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-2 sm:p-4 flex min-h-full items-start sm:items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-darsil-card border border-darsil-border rounded-2xl sm:rounded-3xl w-full max-w-2xl max-h-[85vh] my-auto flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95">
        
        {/* Cabecera del Buscador */}
        <div className="p-4 sm:p-5 border-b border-darsil-border flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Buscador Oficial de Servicios</h3>
              <p className="text-[10px] text-slate-400">Filtra por código (ej. MO05, 3D01) o palabra clave (relé, sensor, faro, claxon)</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Input de Búsqueda y Filtros de Categoría */}
        <div className="p-4 border-b border-darsil-border space-y-3 bg-darsil-obsidian">
          <div className="relative">
            <Search className="w-4 h-4 text-amber-400 absolute left-3.5 top-3" />
            <input
              type="text"
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Escribe código (MO01...) o descripción (sensor, fusible, arranque)..."
              className="w-full bg-black/60 border border-darsil-border focus:border-amber-400 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-400 outline-none transition"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-white text-xs px-1.5 py-0.5 rounded bg-slate-800"
              >
                Limpiar
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 mr-1 flex items-center gap-1">
              <Tag className="w-3 h-3 text-amber-400" /> Categoría:
            </span>
            {[
              { id: 'ALL', label: `Todos (${catalog.length})` },
              { id: 'MO', label: 'Mano de Obra (MO)' },
              { id: 'DG', label: 'Diagnóstico (DG)' },
              { id: '3D', label: 'Manufactura 3D' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedFilter(tab.id)}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-xl transition ${
                  selectedFilter === tab.id
                    ? 'bg-amber-500 text-slate-950 shadow-gold-glow'
                    : 'bg-darsil-card text-slate-400 hover:text-white border border-darsil-border'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de Resultados del Catálogo */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-3">
              <p className="text-xs">No se encontraron servicios que coincidan con "{searchTerm}".</p>
              {onAddBlankRow && (
                <button
                  type="button"
                  onClick={() => {
                    onAddBlankRow();
                    onClose();
                  }}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 text-xs font-bold transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Insertar Fila Personalizada en Blanco</span>
                </button>
              )}
            </div>
          ) : (
            filteredItems.map(item => (
              <div
                key={item.code || item._id}
                onClick={() => {
                  onSelectItem(item);
                  onClose();
                }}
                className="p-3 rounded-2xl bg-black/40 hover:bg-slate-800/80 border border-darsil-border hover:border-amber-400/60 cursor-pointer transition flex items-center justify-between group"
              >
                <div className="flex items-center space-x-3 overflow-hidden">
                  <span className="text-[11px] font-mono font-black px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30 shrink-0">
                    {item.code}
                  </span>
                  <div className="truncate text-left">
                    <h4 className="text-xs font-bold text-white group-hover:text-amber-300 transition truncate">
                      {item.description}
                    </h4>
                    <span className="text-[10px] text-slate-400">
                      {item.category === 'IMPRESION_3D' ? 'Manufactura 3D Aditiva' :
                       item.category === 'DIAGNOSTICO' ? 'Diagnóstico Digital CAN' :
                       'Mano de Obra Oficial'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-3 shrink-0 ml-2">
                  <span className="text-xs font-black text-amber-400 font-mono">
                    S/ {Number(item.defaultPrice || 0).toFixed(2)}
                  </span>
                  <button
                    type="button"
                    className="p-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold group-hover:scale-110 transition shadow-sm"
                    title="Agregar ítem"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer del Modal */}
        <div className="p-3 sm:p-4 border-t border-darsil-border bg-slate-900/60 flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-400">
            Mostrando <strong>{filteredItems.length}</strong> de <strong>{catalog.length}</strong> servicios
          </span>
          <div className="flex items-center space-x-2">
            {onAddBlankRow && (
              <button
                type="button"
                onClick={() => {
                  onAddBlankRow();
                  onClose();
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-darsil-border transition"
              >
                + Fila en Blanco
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-darsil-card hover:bg-slate-700 text-white text-xs font-bold transition"
            >
              Cerrar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
