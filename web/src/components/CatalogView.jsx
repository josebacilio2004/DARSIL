import React, { useState, useEffect } from 'react';
import { Wrench, Plus, Tag, Layers, Search, Sparkles } from 'lucide-react';
import { api } from '../services/api';

export default function CatalogView() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    api.getCatalog(category).then(res => {
      if (res?.data) setItems(res.data);
    });
  }, [category]);

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
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por código o descripción..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-xs bg-darsil-obsidian border border-darsil-border text-white rounded-xl pl-10 pr-3 py-2 w-full outline-none focus:border-amber-400"
            />
          </div>
        </div>
      </div>

      {/* Grid de ítems */}
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
              <tr key={item._id} className="hover:bg-darsil-cardHover/60 transition">
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
    </div>
  );
}
