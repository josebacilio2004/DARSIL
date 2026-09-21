import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  AlertTriangle, 
  Search, 
  Filter, 
  Clock, 
  RefreshCw, 
  Boxes, 
  Sparkles, 
  DollarSign, 
  FileText, 
  Edit3, 
  Trash2, 
  X, 
  Check, 
  History,
  Tag
} from 'lucide-react';
import { api } from '../services/api';

export default function InventoryView() {
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [onlyLowStock, setOnlyLowStock] = useState(false);

  // Modales
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [selectedItemForMove, setSelectedItemForMove] = useState(null);
  const [showKardexModal, setShowKardexModal] = useState(false);
  const [kardexHistory, setKardexHistory] = useState([]);
  const [kardexItem, setKardexItem] = useState(null);

  // CRUD Categorías & Unidades
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newUnitName, setNewUnitName] = useState('');
  const [newUnitAbbr, setNewUnitAbbr] = useState('');

  // Formulario Ítem
  const [formSku, setFormSku] = useState('');
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('REPUESTO_ELECTRICO');
  const [formUnit, setFormUnit] = useState('Uds.');
  const [formStock, setFormStock] = useState(0);
  const [formMinStock, setFormMinStock] = useState(5);
  const [formUnitCost, setFormUnitCost] = useState(0);
  const [formSalePrice, setFormSalePrice] = useState(0);
  const [formLocation, setFormLocation] = useState('Almacén Central - Estante A');
  const [formSupplier, setFormSupplier] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Formulario Movimiento Kardex
  const [moveType, setMoveType] = useState('ENTRADA');
  const [moveQuantity, setMoveQuantity] = useState(1);
  const [moveRefDoc, setMoveRefDoc] = useState('');
  const [moveUnitCost, setMoveUnitCost] = useState('');
  const [moveNotes, setMoveNotes] = useState('');

  const fetchCategoriesAndUnits = async () => {
    try {
      const [resCat, resUnit] = await Promise.allSettled([
        api.getInventoryCategories(),
        api.getInventoryUnits()
      ]);
      if (resCat.status === 'fulfilled' && resCat.value?.success && resCat.value.data) {
        setCategories(resCat.value.data);
      }
      if (resUnit.status === 'fulfilled' && resUnit.value?.success && resUnit.value.data) {
        setUnits(resUnit.value.data);
      }
    } catch (err) {
      console.warn('Error cargando categorías o unidades:', err);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      const res = await api.createInventoryCategory({
        name: newCatName.trim(),
        description: newCatDesc.trim()
      });
      if (res?.success) {
        setNewCatName('');
        setNewCatDesc('');
        fetchCategoriesAndUnits();
        alert('Categoría creada exitosamente.');
      }
    } catch (err) {
      alert('Error creando categoría: ' + err.message);
    }
  };

  const handleDeleteCategory = async (id, name) => {
    if (!window.confirm(`¿Deseas eliminar la categoría "${name}"?`)) return;
    try {
      const res = await api.deleteInventoryCategory(id);
      if (res?.success) {
        fetchCategoriesAndUnits();
      }
    } catch (err) {
      alert('Error eliminando categoría: ' + err.message);
    }
  };

  const handleCreateUnit = async (e) => {
    e.preventDefault();
    if (!newUnitName.trim() || !newUnitAbbr.trim()) return;
    try {
      const res = await api.createInventoryUnit({
        name: newUnitName.trim(),
        abbreviation: newUnitAbbr.trim()
      });
      if (res?.success) {
        setNewUnitName('');
        setNewUnitAbbr('');
        fetchCategoriesAndUnits();
        alert('Unidad de medida creada exitosamente.');
      }
    } catch (err) {
      alert('Error creando unidad de medida: ' + err.message);
    }
  };

  const handleDeleteUnit = async (id, name) => {
    if (!window.confirm(`¿Deseas eliminar la unidad de medida "${name}"?`)) return;
    try {
      const res = await api.deleteInventoryUnit(id);
      if (res?.success) {
        fetchCategoriesAndUnits();
      }
    } catch (err) {
      alert('Error eliminando unidad de medida: ' + err.message);
    }
  };

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedCategory !== 'ALL') params.category = selectedCategory;
      if (search) params.search = search;
      if (onlyLowStock) params.lowStock = 'true';

      const [resItems, resSummary] = await Promise.all([
        api.getInventory(params),
        api.getInventorySummary()
      ]);

      if (resItems?.success && resItems.data) setItems(resItems.data);
      if (resSummary?.success && resSummary.data) setSummary(resSummary.data);
    } catch (err) {
      console.error('Error fetching inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
    fetchCategoriesAndUnits();
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [selectedCategory, onlyLowStock]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchInventory();
  };

  const handleOpenNewItem = () => {
    setEditingItem(null);
    setFormSku('');
    setFormName('');
    setFormCategory('REPUESTO_ELECTRICO');
    setFormUnit('Uds.');
    setFormStock(0);
    setFormMinStock(5);
    setFormUnitCost(0);
    setFormSalePrice(0);
    setFormLocation('Almacén Central - Estante A');
    setFormSupplier('');
    setFormNotes('');
    setShowItemModal(true);
  };

  const handleOpenEditItem = (item) => {
    setEditingItem(item);
    setFormSku(item.sku);
    setFormName(item.name);
    setFormCategory(item.category);
    setFormUnit(item.unit);
    setFormStock(item.currentStock);
    setFormMinStock(item.minStock);
    setFormUnitCost(item.unitCost);
    setFormSalePrice(item.salePrice);
    setFormLocation(item.location);
    setFormSupplier(item.supplier || '');
    setFormNotes(item.notes || '');
    setShowItemModal(true);
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        sku: formSku,
        name: formName,
        category: formCategory,
        unit: formUnit,
        currentStock: Number(formStock),
        minStock: Number(formMinStock),
        unitCost: Number(formUnitCost),
        salePrice: Number(formSalePrice),
        location: formLocation,
        supplier: formSupplier,
        notes: formNotes
      };

      if (editingItem) {
        await api.updateInventoryItem(editingItem._id, payload);
      } else {
        await api.createInventoryItem(payload);
      }
      setShowItemModal(false);
      fetchInventory();
    } catch (err) {
      alert('Error al guardar ítem: ' + err.message);
    }
  };

  const handleOpenMovement = (item) => {
    setSelectedItemForMove(item);
    setMoveType('ENTRADA');
    setMoveQuantity(1);
    setMoveRefDoc('');
    setMoveUnitCost(item ? String(item.unitCost) : '');
    setMoveNotes('');
    setShowMovementModal(true);
  };

  const handleSaveMovement = async (e) => {
    e.preventDefault();
    if (!selectedItemForMove) return;

    try {
      const payload = {
        itemId: selectedItemForMove._id,
        type: moveType,
        quantity: Number(moveQuantity),
        unitCost: moveUnitCost ? Number(moveUnitCost) : selectedItemForMove.unitCost,
        referenceDoc: moveRefDoc.trim() || (moveType === 'ENTRADA' ? 'Factura Compra' : 'Consumo Taller'),
        notes: moveNotes.trim(),
        performedBy: 'darios'
      };

      const res = await api.registerKardexMovement(payload);
      if (!res.success) {
        alert(res.message || 'Error al registrar movimiento');
        return;
      }

      setShowMovementModal(false);
      fetchInventory();
    } catch (err) {
      alert('Error en movimiento de Kardex: ' + err.message);
    }
  };

  const handleViewKardex = async (item) => {
    try {
      setKardexItem(item);
      const res = await api.getKardexByItem(item._id);
      if (res?.success) {
        setKardexHistory(res.data || []);
        setShowKardexModal(true);
      }
    } catch (err) {
      console.error('Error al obtener kardex:', err);
    }
  };

  const formatMoney = (val) => {
    return 'S/ ' + Number(val || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* Encabezado y KPIs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest block">
            LOGÍSTICA & ALMACÉN
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Control de Inventario & Kardex
          </h1>
          <p className="text-xs text-slate-400">
            Existencias de repuestos eléctricos pesados de 24V, cableado ignífugo y filamentos 3D de alta resistencia.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => setShowCategoryModal(true)}
            className="flex items-center justify-center space-x-1.5 px-3 py-2 sm:py-2.5 rounded-xl text-xs font-bold bg-darsil-card hover:bg-slate-800 text-amber-400 border border-amber-500/30 transition active:scale-95 shadow-sm"
            title="Administrar Categorías de Inventario"
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Categorías</span>
          </button>

          <button
            onClick={() => setShowUnitModal(true)}
            className="flex items-center justify-center space-x-1.5 px-3 py-2 sm:py-2.5 rounded-xl text-xs font-bold bg-darsil-card hover:bg-slate-800 text-emerald-400 border border-emerald-500/30 transition active:scale-95 shadow-sm"
            title="Administrar Unidades de Medida"
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>Unidades</span>
          </button>

          <button
            onClick={() => handleOpenMovement(items[0] || null)}
            className="flex items-center justify-center space-x-1.5 px-3 py-2 sm:py-2.5 rounded-xl text-xs font-bold bg-darsil-card hover:bg-slate-800 text-slate-200 border border-darsil-border transition active:scale-95"
          >
            <History className="w-3.5 h-3.5 text-cyan-400" />
            <span>Kardex</span>
          </button>

          <button
            onClick={handleOpenNewItem}
            className="flex items-center justify-center space-x-1.5 px-3.5 py-2 sm:py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-gold-glow hover:brightness-110 active:scale-95 transition"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            <span>+ Nuevo</span>
          </button>
        </div>
      </div>

      {/* Tarjetas KPI: 2 columnas en iPhone 15 Pro, 4 en desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-darsil-card border border-darsil-border flex items-center justify-between">
          <div className="min-w-0">
            <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-wider block truncate">Valor Almacén</span>
            <span className="text-base sm:text-2xl font-black text-amber-400 block truncate">{formatMoney(summary?.totalStockValue)}</span>
            <span className="text-[9px] sm:text-[10px] text-slate-500 block truncate">Costo inmovilizado</span>
          </div>
          <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-amber-500/10 text-amber-400 shrink-0 ml-1">
            <DollarSign className="w-4 sm:w-5 h-4 sm:h-5" />
          </div>
        </div>

        <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-darsil-card border border-darsil-border flex items-center justify-between">
          <div className="min-w-0">
            <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-wider block truncate">Referencias</span>
            <span className="text-base sm:text-2xl font-black text-white block truncate">{summary?.totalItems || items.length}</span>
            <span className="text-[9px] sm:text-[10px] text-slate-500 block truncate">SKUs en almacén</span>
          </div>
          <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-cyan-500/10 text-cyan-400 shrink-0 ml-1">
            <Boxes className="w-4 sm:w-5 h-4 sm:h-5" />
          </div>
        </div>

        <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-darsil-card border border-darsil-border flex items-center justify-between">
          <div className="min-w-0">
            <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-wider block truncate">Stock Bajo</span>
            <span className={`text-base sm:text-2xl font-black block truncate ${summary?.lowStockCount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              {summary?.lowStockCount || 0}
            </span>
            <span className="text-[9px] sm:text-[10px] text-slate-500 block truncate">Bajo el mínimo</span>
          </div>
          <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl shrink-0 ml-1 ${summary?.lowStockCount > 0 ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
            <AlertTriangle className="w-4 sm:w-5 h-4 sm:h-5" />
          </div>
        </div>

        <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-darsil-card border border-darsil-border flex items-center justify-between">
          <div className="min-w-0">
            <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-wider block truncate">Kardex</span>
            <span className="text-base sm:text-2xl font-black text-purple-400 block truncate">Auditoría</span>
            <span className="text-[9px] sm:text-[10px] text-slate-500 block truncate">Inmutable</span>
          </div>
          <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-purple-500/10 text-purple-400 shrink-0 ml-1">
            <History className="w-4 sm:w-5 h-4 sm:h-5" />
          </div>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="p-4 rounded-2xl bg-darsil-card border border-darsil-border flex flex-col md:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por SKU o descripción..."
            className="w-full bg-darsil-obsidian border border-darsil-border rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-400"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs bg-darsil-obsidian border border-darsil-border text-slate-200 rounded-xl px-3 py-2 outline-none focus:border-amber-400 font-semibold"
          >
            <option value="ALL">Todas las Categorías</option>
            {categories && categories.length > 0 ? (
              categories.map(c => (
                <option key={c._id || c.code} value={c.code || c.name}>{c.name}</option>
              ))
            ) : (
              <>
                <option value="REPUESTO_ELECTRICO">Repuestos Eléctricos</option>
                <option value="CABLEADO_CONECTORES">Cableado & Conectores</option>
                <option value="FILAMENTO_3D">Filamento Impresión 3D</option>
                <option value="ILUMINACION_FAROS">Iluminación & Faros</option>
                <option value="SENSORES_ACTUADORES">Sensores & CAN Bus</option>
                <option value="CONSUMIBLES_TALLER">Consumibles Taller</option>
              </>
            )}
          </select>

          <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer select-none bg-darsil-obsidian px-3 py-2 rounded-xl border border-darsil-border">
            <input
              type="checkbox"
              checked={onlyLowStock}
              onChange={(e) => setOnlyLowStock(e.target.checked)}
              className="rounded accent-amber-500"
            />
            <span>Solo Stock Crítico</span>
          </label>

          <button
            onClick={fetchInventory}
            className="p-2 rounded-xl bg-darsil-obsidian border border-darsil-border text-slate-400 hover:text-white transition"
            title="Refrescar inventario"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Vista Móvil: Tarjetas Táctiles para iPhone 15 Pro */}
      <div className="md:hidden space-y-3">
        {items.length === 0 ? (
          <div className="p-8 text-center text-slate-500 bg-darsil-card border border-darsil-border rounded-2xl text-xs">
            No se encontraron ítems en inventario.
          </div>
        ) : (
          items.map((item) => {
            const isCritical = item.currentStock <= item.minStock;
            const isWarning = item.currentStock <= item.minStock * 1.5;

            return (
              <div
                key={item._id}
                className="bg-darsil-card border border-darsil-border hover:border-amber-500/40 rounded-2xl p-3.5 space-y-2.5 shadow-card-dark transition"
              >
                {/* Cabecera de la Tarjeta */}
                <div className="flex items-center justify-between">
                  <span className="font-mono bg-slate-900 border border-slate-800 text-amber-400 font-black px-2 py-0.5 rounded text-xs">
                    {item.sku}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 truncate max-w-[150px]">
                    {item.category.replace(/_/g, ' ')}
                  </span>
                </div>

                {/* Nombre y Proveedor */}
                <div>
                  <div className="font-bold text-white text-xs">{item.name}</div>
                  <div className="text-[10px] text-slate-400 flex items-center justify-between mt-0.5">
                    <span>Ubicación: <b className="text-slate-300">{item.location || 'Taller'}</b></span>
                    {item.supplier && <span>Prov: {item.supplier}</span>}
                  </div>
                </div>

                {/* Existencias y Precios */}
                <div className="pt-2 border-t border-darsil-border/60 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] text-slate-400">Stock:</span>
                    <span className={`inline-flex items-center space-x-1 font-mono font-black text-xs px-2 py-0.5 rounded-lg ${
                      isCritical 
                        ? 'bg-red-500/20 text-red-400 border border-red-500/40' 
                        : isWarning
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    }`}>
                      <span>{item.currentStock}</span>
                      <span className="text-[9px] font-normal opacity-80">{item.unit}</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">(mín: {item.minStock})</span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block leading-none">P. Venta</span>
                    <span className="font-mono font-black text-amber-400 text-xs">
                      {formatMoney(item.salePrice)}
                    </span>
                  </div>
                </div>

                {/* Botones de Acción Táctiles */}
                <div className="pt-2 border-t border-darsil-border/60 flex items-center justify-end space-x-2">
                  <button
                    onClick={() => handleOpenMovement(item)}
                    className="flex-1 flex items-center justify-center space-x-1 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold transition"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>Movimiento</span>
                  </button>
                  <button
                    onClick={() => handleViewKardex(item)}
                    className="p-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition"
                    title="Ver Historial de Kardex"
                  >
                    <History className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleOpenEditItem(item)}
                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
                    title="Editar Ficha"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Tabla de Inventario (Solo Pantallas Medianas y Grandes) */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-darsil-border bg-darsil-card">
        <table className="w-full text-xs text-left min-w-[760px]">
          <thead className="bg-slate-900/80 text-slate-300 font-black border-b border-darsil-border">
            <tr>
              <th className="p-3.5">SKU / Código</th>
              <th className="p-3.5">Descripción del Repuesto / Filamento</th>
              <th className="p-3.5">Categoría</th>
              <th className="p-3.5">Ubicación</th>
              <th className="p-3.5 text-right">Existencias</th>
              <th className="p-3.5 text-right">Stock Mínimo</th>
              <th className="p-3.5 text-right">Costo Unit.</th>
              <th className="p-3.5 text-right">Precio Venta</th>
              <th className="p-3.5 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-darsil-border/60">
            {items.length === 0 ? (
              <tr>
                <td colSpan="9" className="text-center py-10 text-slate-500">
                  No se encontraron ítems en inventario.
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const isCritical = item.currentStock <= item.minStock;
                const isWarning = item.currentStock <= item.minStock * 1.5;
                return (
                  <tr key={item._id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3.5 font-mono font-bold text-amber-400">
                      {item.sku}
                    </td>
                    <td className="p-3.5 font-bold text-white">
                      <div>{item.name}</div>
                      {item.supplier && <div className="text-[10px] text-slate-400">Prov: {item.supplier}</div>}
                    </td>
                    <td className="p-3.5">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        {item.category.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-300">
                      {item.location || 'Taller'}
                    </td>
                    <td className="p-3.5 text-right">
                      <span className={`inline-flex items-center space-x-1 font-mono font-black text-sm px-2.5 py-0.5 rounded-lg ${
                        isCritical 
                          ? 'bg-red-500/20 text-red-400 border border-red-500/40' 
                        : isWarning
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      }`}>
                        <span>{item.currentStock}</span>
                        <span className="text-[10px] font-normal opacity-80">{item.unit}</span>
                      </span>
                    </td>
                    <td className="p-3.5 text-right font-mono text-slate-400">
                      {item.minStock} {item.unit}
                    </td>
                    <td className="p-3.5 text-right font-mono text-slate-300">
                      {formatMoney(item.unitCost)}
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-amber-400">
                      {formatMoney(item.salePrice)}
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => handleOpenMovement(item)}
                          className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 transition"
                          title="Registrar Entrada/Salida en Kardex"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleViewKardex(item)}
                          className="p-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/40 transition"
                          title="Ver Historial de Kardex"
                        >
                          <History className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEditItem(item)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
                          title="Editar Ficha"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Nuevo / Editar Ítem */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto p-2 sm:p-4 flex min-h-full items-start sm:items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-darsil-card border border-darsil-border rounded-2xl sm:rounded-3xl w-full max-w-lg p-4 sm:p-6 shadow-2xl space-y-4 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-darsil-border pb-3">
              <div className="flex items-center space-x-2 text-amber-400">
                <Package className="w-5 h-5" />
                <h3 className="font-bold text-sm text-white">
                  {editingItem ? `Editar Ítem: ${editingItem.sku}` : 'Nuevo Repuesto / Filamento en Almacén'}
                </h3>
              </div>
              <button onClick={() => setShowItemModal(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-bold">Código SKU (*):</label>
                  <input
                    type="text"
                    required
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    placeholder="ej. REP-ALT-24V"
                    className="w-full bg-darsil-obsidian border border-darsil-border rounded-xl px-3 py-2 text-white font-mono uppercase focus:border-amber-400 outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-bold">Categoría:</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-darsil-obsidian border border-darsil-border rounded-xl px-3 py-2 text-white focus:border-amber-400 outline-none"
                  >
                    {categories && categories.length > 0 ? (
                      categories.map(c => (
                        <option key={c._id || c.code} value={c.code || c.name}>{c.name}</option>
                      ))
                    ) : (
                      <>
                        <option value="REPUESTO_ELECTRICO">Repuestos Eléctricos</option>
                        <option value="CABLEADO_CONECTORES">Cableado & Conectores</option>
                        <option value="FILAMENTO_3D">Filamento Impresión 3D</option>
                        <option value="ILUMINACION_FAROS">Iluminación & Faros</option>
                        <option value="SENSORES_ACTUADORES">Sensores & CAN Bus</option>
                        <option value="CONSUMIBLES_TALLER">Consumibles Taller</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-bold">Nombre / Descripción Técnica (*):</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="ej. Alternador 24V 80A con Polea Doble"
                  className="w-full bg-darsil-obsidian border border-darsil-border rounded-xl px-3 py-2 text-white focus:border-amber-400 outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-bold">Unidad:</label>
                  <select
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full bg-darsil-obsidian border border-darsil-border rounded-xl px-3 py-2 text-white focus:border-amber-400 outline-none"
                  >
                    {units && units.length > 0 ? (
                      units.map(u => (
                        <option key={u._id || u.abbreviation} value={u.abbreviation || u.name}>
                          {u.name} ({u.abbreviation})
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="Uds.">Unidades (Uds.)</option>
                        <option value="Gramos (g)">Gramos (g)</option>
                        <option value="Metros">Metros</option>
                        <option value="Kits">Kits</option>
                        <option value="Rollos">Rollos</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-bold">Stock Inicial:</label>
                  <input
                    type="number"
                    min="0"
                    disabled={!!editingItem}
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    className="w-full bg-darsil-obsidian border border-darsil-border rounded-xl px-3 py-2 text-white font-mono focus:border-amber-400 outline-none disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-bold">Stock Mínimo:</label>
                  <input
                    type="number"
                    min="0"
                    value={formMinStock}
                    onChange={(e) => setFormMinStock(e.target.value)}
                    className="w-full bg-darsil-obsidian border border-darsil-border rounded-xl px-3 py-2 text-white font-mono focus:border-amber-400 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-bold">Costo Unit. Compra (S/):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formUnitCost}
                    onChange={(e) => setFormUnitCost(e.target.value)}
                    className="w-full bg-darsil-obsidian border border-darsil-border rounded-xl px-3 py-2 text-white font-mono focus:border-amber-400 outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-bold">Precio Venta Sugerido (S/):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formSalePrice}
                    onChange={(e) => setFormSalePrice(e.target.value)}
                    className="w-full bg-darsil-obsidian border border-darsil-border rounded-xl px-3 py-2 text-white font-mono focus:border-amber-400 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-bold">Ubicación en Taller:</label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="Estante A - Nivel 2"
                    className="w-full bg-darsil-obsidian border border-darsil-border rounded-xl px-3 py-2 text-white focus:border-amber-400 outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-bold">Proveedor Habitual:</label>
                  <input
                    type="text"
                    value={formSupplier}
                    onChange={(e) => setFormSupplier(e.target.value)}
                    placeholder="Bosch / Prestolite / 3D Hub"
                    className="w-full bg-darsil-obsidian border border-darsil-border rounded-xl px-3 py-2 text-white focus:border-amber-400 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-darsil-border">
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black shadow-gold-glow"
                >
                  Guardar en Inventario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Registrar Movimiento Kardex */}
      {showMovementModal && selectedItemForMove && (
        <div className="fixed inset-0 z-50 overflow-y-auto p-2 sm:p-4 flex min-h-full items-start sm:items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-darsil-card border border-darsil-border rounded-2xl sm:rounded-3xl w-full max-w-md p-4 sm:p-6 shadow-2xl space-y-4 my-auto">
            <div className="flex items-center justify-between border-b border-darsil-border pb-3">
              <div className="flex items-center space-x-2 text-cyan-400">
                <History className="w-5 h-5" />
                <h3 className="font-bold text-sm text-white">Registrar Movimiento en Kardex</h3>
              </div>
              <button onClick={() => setShowMovementModal(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMovement} className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-black/40 border border-darsil-border">
                <div className="text-slate-400 text-[10px] uppercase font-bold">Ítem Seleccionado:</div>
                <div className="text-sm font-black text-amber-400">{selectedItemForMove.sku} - {selectedItemForMove.name}</div>
                <div className="text-xs text-slate-300 mt-1">
                  Existencias actuales: <strong>{selectedItemForMove.currentStock} {selectedItemForMove.unit}</strong>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-bold">Tipo de Transacción:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMoveType('ENTRADA')}
                    className={`p-2.5 rounded-xl border text-center font-bold flex items-center justify-center space-x-1.5 transition ${
                      moveType === 'ENTRADA'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-darsil-obsidian border-darsil-border text-slate-400'
                    }`}
                  >
                    <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
                    <span>Entrada (Compra)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMoveType('SALIDA')}
                    className={`p-2.5 rounded-xl border text-center font-bold flex items-center justify-center space-x-1.5 transition ${
                      moveType === 'SALIDA'
                        ? 'bg-red-500/20 border-red-500 text-red-300'
                        : 'bg-darsil-obsidian border-darsil-border text-slate-400'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4 text-red-400" />
                    <span>Salida (Taller/OT)</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-bold">Cantidad ({selectedItemForMove.unit}):</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={moveQuantity}
                    onChange={(e) => setMoveQuantity(e.target.value)}
                    className="w-full bg-darsil-obsidian border border-darsil-border rounded-xl px-3 py-2 text-white font-mono focus:border-amber-400 outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-bold">Doc. de Referencia:</label>
                  <input
                    type="text"
                    required
                    value={moveRefDoc}
                    onChange={(e) => setMoveRefDoc(e.target.value)}
                    placeholder="Factura / OT-2026-001"
                    className="w-full bg-darsil-obsidian border border-darsil-border rounded-xl px-3 py-2 text-white uppercase focus:border-amber-400 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-bold">Notas u Observaciones:</label>
                <textarea
                  rows="2"
                  value={moveNotes}
                  onChange={(e) => setMoveNotes(e.target.value)}
                  placeholder="Detalles del movimiento o destino..."
                  className="w-full bg-darsil-obsidian border border-darsil-border rounded-xl p-2.5 text-white focus:border-amber-400 outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-darsil-border">
                <button
                  type="button"
                  onClick={() => setShowMovementModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-gold-glow"
                >
                  Confirmar Kardex
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Historial de Kardex */}
      {showKardexModal && kardexItem && (
        <div className="fixed inset-0 z-50 overflow-y-auto p-2 sm:p-4 flex min-h-full items-start sm:items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-darsil-card border border-darsil-border rounded-2xl sm:rounded-3xl w-full max-w-3xl p-4 sm:p-6 shadow-2xl space-y-4 my-auto max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-darsil-border pb-3">
              <div className="flex items-center space-x-2 text-cyan-400">
                <History className="w-5 h-5" />
                <div>
                  <h3 className="font-bold text-sm text-white">Libro de Kardex: {kardexItem.sku}</h3>
                  <span className="text-[10px] text-slate-400">{kardexItem.name}</span>
                </div>
              </div>
              <button onClick={() => setShowKardexModal(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-darsil-border border border-darsil-border rounded-2xl bg-black/40">
              {kardexHistory.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">No hay movimientos registrados para este ítem.</div>
              ) : (
                kardexHistory.map(m => {
                  const isEntry = m.type === 'ENTRADA' || m.type === 'AJUSTE_POSITIVO';
                  return (
                    <div key={m._id} className="p-3.5 flex items-center justify-between hover:bg-slate-900/50 transition">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-xl ${isEntry ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                          {isEntry ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                        </div>
                        <div className="text-left">
                          <div className="text-xs font-bold text-white flex items-center space-x-2">
                            <span>{m.type}</span>
                            <span className="text-[10px] text-amber-400 font-mono">Doc: {m.referenceDoc}</span>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {new Date(m.createdAt).toLocaleString('es-PE')} • Resp: {m.performedBy}
                          </div>
                          {m.notes && <div className="text-[10px] text-slate-300 italic">{m.notes}</div>}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className={`text-xs font-black font-mono ${isEntry ? 'text-emerald-400' : 'text-red-400'}`}>
                          {isEntry ? '+' : '-'}{m.quantity} {kardexItem.unit}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">
                          Saldo: <strong>{m.newStock} {kardexItem.unit}</strong>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowKardexModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Administración de Categorías */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto p-2 sm:p-4 flex min-h-full items-start sm:items-center justify-center bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="bg-darsil-card border border-darsil-border rounded-2xl sm:rounded-3xl w-full max-w-xl p-4 sm:p-6 shadow-2xl space-y-4 my-auto max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-darsil-border pb-3">
              <div className="flex items-center space-x-2 text-amber-400">
                <Tag className="w-5 h-5" />
                <div>
                  <h3 className="font-bold text-sm text-white">Categorías de Inventario</h3>
                  <span className="text-[10px] text-slate-400">Administra familias de repuestos, insumos y filamentos 3D</span>
                </div>
              </div>
              <button onClick={() => setShowCategoryModal(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formulario Crear Nueva Categoría */}
            <form onSubmit={handleCreateCategory} className="bg-darsil-obsidian border border-darsil-border rounded-2xl p-3.5 space-y-2 text-xs">
              <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                + Nueva Categoría de Almacén
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold text-[10px]">Nombre de Categoría (*):</label>
                  <input
                    type="text"
                    required
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="Ej. Baterías & Acumuladores"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white text-xs outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold text-[10px]">Descripción / Uso:</label>
                  <input
                    type="text"
                    value={newCatDesc}
                    onChange={(e) => setNewCatDesc(e.target.value)}
                    placeholder="Ej. Acumuladores 12V/24V ciclo pesado"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white text-xs outline-none focus:border-amber-400"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
                >
                  + Agregar Categoría
                </button>
              </div>
            </form>

            {/* Lista de Categorías Existentes */}
            <div className="flex-1 overflow-y-auto divide-y divide-darsil-border border border-darsil-border rounded-2xl bg-black/40 text-xs">
              {categories.length === 0 ? (
                <div className="p-6 text-center text-slate-500 italic">No hay categorías registradas.</div>
              ) : (
                categories.map((cat) => (
                  <div key={cat._id} className="p-3 flex items-center justify-between hover:bg-slate-900/40 transition">
                    <div>
                      <div className="font-bold text-white flex items-center space-x-2">
                        <span>{cat.name}</span>
                        {cat.code && (
                          <span className="text-[10px] text-amber-400 font-mono bg-amber-500/10 px-1.5 py-0.5 rounded">
                            {cat.code}
                          </span>
                        )}
                      </div>
                      {cat.description && (
                        <div className="text-[11px] text-slate-400 mt-0.5">{cat.description}</div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(cat._id, cat.name)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                      title="Eliminar categoría"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setShowCategoryModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold"
              >
                Listo / Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Administración de Unidades de Medida */}
      {showUnitModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto p-2 sm:p-4 flex min-h-full items-start sm:items-center justify-center bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="bg-darsil-card border border-darsil-border rounded-2xl sm:rounded-3xl w-full max-w-xl p-4 sm:p-6 shadow-2xl space-y-4 my-auto max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-darsil-border pb-3">
              <div className="flex items-center space-x-2 text-emerald-400">
                <Boxes className="w-5 h-5" />
                <div>
                  <h3 className="font-bold text-sm text-white">Unidades de Medida</h3>
                  <span className="text-[10px] text-slate-400">Define unidades de despacho, fraccionamiento y conteo físico</span>
                </div>
              </div>
              <button onClick={() => setShowUnitModal(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formulario Crear Nueva Unidad */}
            <form onSubmit={handleCreateUnit} className="bg-darsil-obsidian border border-darsil-border rounded-2xl p-3.5 space-y-2 text-xs">
              <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                + Nueva Unidad de Medida
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold text-[10px]">Nombre Completo (*):</label>
                  <input
                    type="text"
                    required
                    value={newUnitName}
                    onChange={(e) => setNewUnitName(e.target.value)}
                    placeholder="Ej. Galones / Paquetes / Bobinas"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white text-xs outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold text-[10px]">Abreviatura / Símbolo (*):</label>
                  <input
                    type="text"
                    required
                    value={newUnitAbbr}
                    onChange={(e) => setNewUnitAbbr(e.target.value)}
                    placeholder="Ej. Gal. / Pqt. / Bob."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white text-xs outline-none focus:border-emerald-400 font-mono font-bold"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition"
                >
                  + Agregar Unidad
                </button>
              </div>
            </form>

            {/* Lista de Unidades Existentes */}
            <div className="flex-1 overflow-y-auto divide-y divide-darsil-border border border-darsil-border rounded-2xl bg-black/40 text-xs">
              {units.length === 0 ? (
                <div className="p-6 text-center text-slate-500 italic">No hay unidades registradas.</div>
              ) : (
                units.map((unit) => (
                  <div key={unit._id} className="p-3 flex items-center justify-between hover:bg-slate-900/40 transition">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                        {unit.abbreviation}
                      </span>
                      <span className="font-bold text-white">{unit.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteUnit(unit._id, unit.name)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                      title="Eliminar unidad"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setShowUnitModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold"
              >
                Listo / Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
