import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  Layers, 
  Plus, 
  Pencil, 
  Trash2, 
  X, 
  Save, 
  AlertCircle,
  Tag
} from 'lucide-react';
import { api } from '../services/api';

export default function CatalogView() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');

  // Estados de CRUD
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null); // null = cerrado, { ... } = crear/editar
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');

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

  const handleOpenNew = () => {
    const nextNum = items.length + 1;
    const defaultCode = `MO${String(nextNum).padStart(2, '0')}`;
    setEditingItem({
      code: defaultCode,
      description: '',
      category: 'MANO_OBRA',
      defaultPrice: '',
      unit: 'Uds.'
    });
    setModalError('');
    setModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem({ ...item });
    setModalError('');
    setModalOpen(true);
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`¿Estás seguro de eliminar el servicio "${item.code} - ${item.description}"?`)) {
      return;
    }
    try {
      await api.deleteCatalogItem(item._id);
      setSyncMsg(`Servicio ${item.code} eliminado.`);
      setTimeout(() => setSyncMsg(''), 3000);
      fetchCatalog();
    } catch (err) {
      alert('Error al eliminar ítem: ' + err.message);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editingItem.code?.trim() || !editingItem.description?.trim()) {
      setModalError('El código y la descripción son obligatorios.');
      return;
    }
    if (editingItem.defaultPrice === '' || Number(editingItem.defaultPrice) < 0) {
      setModalError('Ingrese un precio base válido.');
      return;
    }

    setSaving(true);
    setModalError('');
    try {
      const payload = {
        code: editingItem.code.trim().toUpperCase(),
        description: editingItem.description.trim().toUpperCase(),
        category: editingItem.category,
        defaultPrice: Number(editingItem.defaultPrice),
        unit: editingItem.unit || 'Uds.'
      };

      if (editingItem._id) {
        // Actualizar
        const res = await api.updateCatalogItem(editingItem._id, payload);
        if (res.success) {
          setSyncMsg(`Servicio ${payload.code} actualizado con éxito.`);
          setModalOpen(false);
          fetchCatalog();
        } else {
          setModalError(res.message || 'Error al actualizar el servicio.');
        }
      } else {
        // Crear nuevo
        const res = await api.createCatalogItem(payload);
        if (res.success) {
          setSyncMsg(`Servicio ${payload.code} creado con éxito.`);
          setModalOpen(false);
          fetchCatalog();
        } else {
          setModalError(res.message || 'Error al crear el servicio.');
        }
      }
      setTimeout(() => setSyncMsg(''), 3500);
    } catch (err) {
      setModalError('Error al guardar: ' + err.message);
    } finally {
      setSaving(false);
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
            Gestión completa (CRUD) de servicios oficiales, códigos MO01-MO21, diagnóstico digital y fabricación 3D.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          <div className="relative w-full sm:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por código o nombre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-xs bg-darsil-obsidian border border-darsil-border text-white rounded-xl pl-10 pr-3 py-2 w-full outline-none focus:border-amber-400"
            />
          </div>

          <button
            onClick={handleOpenNew}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-gold-glow hover:brightness-110 transition shrink-0 active:scale-95"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            <span>Nuevo Servicio</span>
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
              Presiona el botón para cargar automáticamente los 25 servicios oficiales de DARSIL o crea un servicio nuevo.
            </p>
          </div>
          <div className="flex justify-center gap-3">
            <button
              onClick={handleSeedCatalog}
              className="px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-gold-glow hover:brightness-110 active:scale-95 transition"
            >
              Cargar 25 Servicios Oficiales
            </button>
            <button
              onClick={handleOpenNew}
              className="px-4 py-2.5 rounded-xl font-bold text-xs uppercase bg-slate-800 text-white border border-slate-700 hover:bg-slate-700 transition"
            >
              Crear Nuevo Ítem
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-darsil-card rounded-2xl border border-darsil-border shadow-card-dark overflow-hidden">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-darsil-obsidian border-b border-darsil-border text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3.5 w-24">Código</th>
                <th className="p-3.5">Descripción Oficial del Servicio</th>
                <th className="p-3.5 w-36">Categoría</th>
                <th className="p-3.5 w-28 text-right">Precio Base</th>
                <th className="p-3.5 w-24 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-darsil-border font-medium">
              {filtered.map((item) => (
                <tr key={item._id || item.code} className="hover:bg-darsil-cardHover/60 transition group">
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
                        ? 'bg-purple-950/50 text-purple-300 border-purple-800/40' :
                      item.category === 'REPUESTO'
                        ? 'bg-emerald-950/50 text-emerald-300 border-emerald-800/40' :
                      item.category === 'SOLUCION_ESPECIAL'
                        ? 'bg-amber-950/50 text-amber-300 border-amber-800/40'
                        : 'bg-blue-950/50 text-blue-300 border-blue-800/40'
                    }`}>
                      {item.category === 'FABRICACION_3D' ? 'Fabricación 3D' :
                       item.category === 'REPUESTO' ? 'Repuesto' :
                       item.category === 'SOLUCION_ESPECIAL' ? 'Especial' : 'Mano de Obra'}
                    </span>
                  </td>
                  <td className="p-3.5 text-right font-mono font-black text-amber-300 text-sm">
                    S/ {Number(item.defaultPrice).toFixed(2)}
                  </td>
                  <td className="p-3.5 text-center">
                    <div className="flex items-center justify-center space-x-1.5">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        title="Editar servicio"
                        className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-amber-500/20 text-slate-300 hover:text-amber-400 border border-slate-700/80 transition"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item)}
                        title="Eliminar servicio"
                        className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-red-500/20 text-slate-300 hover:text-red-400 border border-slate-700/80 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal CRUD: Crear / Editar Servicio */}
      {modalOpen && editingItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-darsil-card border border-amber-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Tag className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-sm">
                  {editingItem._id ? 'Editar Servicio del Catálogo' : 'Nuevo Servicio / Ítem DARSIL'}
                </h3>
              </div>
              <button 
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl text-xs bg-red-950/70 border border-red-500/50 text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Código Ref.:</label>
                  <input
                    type="text"
                    required
                    value={editingItem.code || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, code: e.target.value.toUpperCase() })}
                    placeholder="Ej. MO22"
                    className="w-full bg-black/50 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold uppercase outline-none focus:border-amber-400"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-slate-400 font-semibold mb-1">Categoría del Servicio:</label>
                  <select
                    value={editingItem.category || 'MANO_OBRA'}
                    onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                    className="w-full bg-black/50 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-400"
                  >
                    <option value="MANO_OBRA">Mano de Obra Oficial</option>
                    <option value="FABRICACION_3D">Manufactura / Impresión 3D</option>
                    <option value="REPUESTO">Repuesto / Suministro</option>
                    <option value="SOLUCION_ESPECIAL">Solución Especial / Campo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Descripción Oficial:</label>
                <textarea
                  required
                  rows={3}
                  value={editingItem.description || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  placeholder="Ej. INSTALACIÓN DE CÁMARA DE RETROCESO Y PANTALLA TÁCTIL"
                  className="w-full bg-black/50 border border-slate-700 rounded-xl px-3 py-2 text-white uppercase outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Precio Base Sugerido (S/):</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={editingItem.defaultPrice || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, defaultPrice: e.target.value })}
                    placeholder="Ej. 120.00"
                    className="w-full bg-black/50 border border-slate-700 rounded-xl px-3 py-2 text-amber-300 font-mono font-bold outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Unidad de Medida:</label>
                  <input
                    type="text"
                    value={editingItem.unit || 'Uds.'}
                    onChange={(e) => setEditingItem({ ...editingItem, unit: e.target.value })}
                    placeholder="Uds. / Global / Horas"
                    className="w-full bg-black/50 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl font-semibold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center space-x-1.5 px-5 py-2 rounded-xl font-black bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-gold-glow hover:brightness-110 active:scale-95 transition"
                >
                  <Save className="w-4 h-4 text-slate-950" />
                  <span>{saving ? 'Guardando...' : 'Guardar Servicio'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
