import React, { useState, useEffect } from 'react';
import { Wrench, Search, RefreshCw, CheckCircle2, Sparkles, Layers } from 'lucide-react';
import { api } from '../services/api';

export default function CatalogView() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');

  const fetchCatalog = async () => {
    setLoading(true);
    try {
      const res = await api.getCatalog(category);
      if (res?.data) {
        setItems(res.data);
      }
    } catch (err) {
      console.error('Error fetching catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, [category]);

  const handleSeedCatalog = async () => {
    setLoading(true);
    setSyncMsg('');
    try {
      const res = await api.seedCatalog();
      if (res?.data) {
        setItems(res.data);
        setSyncMsg('¡Catálogo maestro sincronizado con éxito (25 servicios oficiales)!');
        setTimeout(() => setSyncMsg(''), 4000);
      }
    } catch (err) {
      console.error('Error seeding catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = items.filter(i => 
    i.code.toLowerCase().includes(search.toLowerCase()) ||
    i.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-darsil-card p-5 rounded-2xl border border-darsil-border shadow-card-dark flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-white flex items-center space-x-2">
            <Wrench className="w-5 h-5 text-darsil-gold" />
            <span>Catálogo Maestro de Mano de Obra y Servicios (DARSIL)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Incluye los códigos oficiales MO01 al MO21 de la plantilla del dueño, servicios de diagnóstico electrónico y fabricación 3D.
          </p>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por código o descripción..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-xs bg-darsil-obsidian border border-darsil-border text-white rounded-xl pl-10 pr-3 py-2 w-full outline-none focus:border-amber-400"
            />
          </div>

          <button
            onClick={handleSeedCatalog}
            disabled={loading}
            title="Sincronizar y cargar los 25 servicios oficiales en la base de datos"
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition shrink-0 active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">Cargar Catálogo Oficial</span>
          </button>
        </div>
      </div>

      {syncMsg && (
        <div className="p-3 bg-emerald-950/70 border border-emerald-500/60 rounded-xl text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{syncMsg}</span>
        </div>
      )}

      {/* Grid o Lista de ítems */}
      {filtered.length === 0 ? (
        <div className="bg-darsil-card p-12 rounded-2xl border border-darsil-border text-center space-y-4 shadow-card-dark">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
            <Layers className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">No hay servicios en el catálogo</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Presiona el botón para cargar inmediatamente los 25 servicios oficiales de DARSIL (MO01-MO21, Diagnóstico CAN-Bus y Manufactura 3D).
            </p>
          </div>
          <button
            onClick={handleSeedCatalog}
            className="px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-gold-glow hover:brightness-110 active:scale-95 transition"
          >
            Cargar 25 Servicios Oficiales Ahora
          </button>
        </div>
      ) : (
        <div className="bg-darsil-card rounded-2xl border border-darsil-border shadow-card-dark overflow-hidden">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-darsil-obsidian border-b border-darsil-border text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3.5 w-28">Código Ref.</th>
                <th className="p-3.5">Descripción Oficial del Servicio</th>
                <th className="p-3.5 w-40">Categoría</th>
                <th className="p-3.5 w-32 text-right">Precio Base (S/)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-darsil-border font-medium">
              {filtered.map((item) => (
                <tr key={item._id || item.code} className="hover:bg-darsil-cardHover/60 transition">
                  <td className="p-3.5 font-mono font-black text-darsil-gold">
                    <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                      {item.code}
                    </span>
                  </td>
                  <td className="p-3.5 font-semibold text-white uppercase">
                    {item.description}
                  </td>
                  <td className="p-3.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      item.category === 'FABRICACION_3D' 
                        ? 'bg-purple-950/50 text-purple-300 border-purple-800/40' 
                        : 'bg-blue-950/50 text-blue-300 border-blue-800/40'
                    }`}>
                      {item.category === 'FABRICACION_3D' ? 'Fabricación 3D' : 'Mano de Obra'}
                    </span>
                  </td>
                  <td className="p-3.5 text-right font-mono font-black text-amber-300 pr-5 text-sm">
                    S/ {Number(item.defaultPrice).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
