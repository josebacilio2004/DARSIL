import React, { useState, useEffect } from 'react';
import { AlertTriangle, Trash2, X, Loader2, Check } from 'lucide-react';

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmar Eliminación',
  itemName = '',
  itemCode = '',
  targetType = 'registro', // 'producto', 'cotización', 'orden de trabajo', 'servicio'
  warningText = 'Esta acción es permanente y no se podrá recuperar la información.'
}) {
  const [typedValue, setTypedValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // La palabra requerida puede ser el nombre del producto, su código o simplemente "BORRAR"
  const expectedKeyword = (itemName || itemCode || 'BORRAR').trim();
  const fallbackKeyword = 'BORRAR';

  useEffect(() => {
    if (isOpen) {
      setTypedValue('');
      setError(null);
      setLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Validación: Coincide con el nombre del producto, con su código/SKU, o con la palabra clave "BORRAR"
  const isMatch =
    typedValue.trim().length > 0 &&
    (typedValue.trim().toLowerCase() === expectedKeyword.toLowerCase() ||
     (itemCode && typedValue.trim().toLowerCase() === itemCode.trim().toLowerCase()) ||
     typedValue.trim().toUpperCase() === fallbackKeyword);

  const handleConfirmClick = async () => {
    if (!isMatch || loading) return;
    try {
      setLoading(true);
      setError(null);
      await onConfirm();
      onClose();
    } catch (err) {
      console.error('Error al confirmar eliminación:', err);
      setError(err.message || 'Error al procesar la eliminación');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-3 sm:p-4 flex min-h-full items-start sm:items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-darsil-card border border-rose-500/40 w-full max-w-md rounded-2xl sm:rounded-3xl shadow-[0_0_50px_rgba(244,63,94,0.2)] p-5 sm:p-6 text-white space-y-4 my-auto relative overflow-hidden">
        
        {/* Barra decorativa superior */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-500 via-red-500 to-amber-500" />

        {/* Cabecera */}
        <div className="flex items-start justify-between gap-3 pt-1">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-white leading-tight">{title}</h3>
              <p className="text-[11px] text-slate-400">Confirmación de seguridad requerida</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Advertencia y Detalle del Ítem */}
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-3.5 space-y-2 text-xs">
          <p className="text-rose-300 font-semibold leading-relaxed">
            ¿Estás seguro de que deseas eliminar este {targetType}?
          </p>
          <div className="bg-black/50 p-2.5 rounded-xl border border-rose-500/30 space-y-1">
            {itemName && (
              <div className="font-bold text-white truncate text-sm">
                "{itemName}"
              </div>
            )}
            {itemCode && (
              <div className="text-[11px] font-mono text-amber-300">
                Código / SKU: <strong>{itemCode}</strong>
              </div>
            )}
          </div>
          <p className="text-[11px] text-slate-400">{warningText}</p>
        </div>

        {/* Instrucción de Confirmación por Palabra */}
        <div className="space-y-2">
          <label className="block text-slate-300 text-xs font-semibold">
            Para confirmar, escribe{' '}
            <strong className="text-amber-300 font-bold select-all">
              "{expectedKeyword}"
            </strong>{' '}
            o escribe{' '}
            <strong className="text-rose-400 font-bold select-all">BORRAR</strong>:
          </label>
          <input
            type="text"
            autoFocus
            disabled={loading}
            value={typedValue}
            onChange={(e) => setTypedValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && isMatch) handleConfirmClick();
            }}
            placeholder={`Escribe "${expectedKeyword}" o "BORRAR"`}
            className={`w-full bg-slate-950 border rounded-xl px-3.5 py-2.5 text-xs text-white outline-none font-medium transition ${
              isMatch
                ? 'border-emerald-500 ring-2 ring-emerald-500/30 text-emerald-300'
                : typedValue.length > 0
                ? 'border-rose-500 ring-2 ring-rose-500/30'
                : 'border-slate-700 focus:border-amber-400'
            }`}
          />
          {isMatch && (
            <div className="flex items-center space-x-1.5 text-emerald-400 text-[11px] font-semibold animate-in fade-in">
              <Check className="w-3.5 h-3.5" />
              <span>Confirmación correcta. Puedes proceder a eliminar.</span>
            </div>
          )}
        </div>

        {error && (
          <div className="p-2.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Botones de Acción */}
        <div className="flex items-center justify-end space-x-2 pt-2 border-t border-darsil-border">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirmClick}
            disabled={!isMatch || loading}
            className={`px-5 py-2 rounded-xl text-xs font-black flex items-center space-x-1.5 shadow-md transition ${
              isMatch && !loading
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_15px_rgba(225,29,72,0.4)] active:scale-95 cursor-pointer'
                : 'bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed opacity-60'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Eliminando...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar Definitivamente</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
