import React, { useState } from 'react';
import { 
  CreditCard, 
  RotateCw, 
  Copy, 
  Check, 
  Wifi, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Sparkles 
} from 'lucide-react';

export default function InteractiveVisaCard({ bankAccounts = [], onEditAccount, onAddAccount }) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showFullNumber, setShowFullNumber] = useState(true);
  const [copiedType, setCopiedType] = useState(null); // 'account' | 'cci'

  const activeAccount = bankAccounts[selectedIdx] || bankAccounts[0] || {
    bank: 'BCP',
    accountType: 'CTA CTE',
    accountNumber: '191-2345678-0-12',
    interbankAccount: '00219100234567801234'
  };

  const handleCopy = (text, type) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  // Formateador visual para tarjeta VISA (grupos de 4 dígitos o caracteres)
  const formatCardNumber = (accNum) => {
    if (!accNum) return '•••• •••• •••• ••••';
    const clean = accNum.replace(/[^a-zA-Z0-9]/g, '');
    if (!showFullNumber) {
      const last4 = clean.slice(-4);
      return `•••• •••• •••• ${last4 || '8888'}`;
    }
    // Si tiene al menos 12 caracteres, agrupar en bloques de 4
    if (clean.length >= 10) {
      return clean.match(/.{1,4}/g)?.join(' ') || accNum;
    }
    return accNum;
  };

  // Colores o temas por banco para darle más realismo al logotipo
  const getBankStyle = (bankName = '') => {
    const b = bankName.toUpperCase();
    if (b.includes('BCP')) return { badge: 'bg-orange-500/20 text-orange-400 border-orange-500/30', glow: 'from-orange-500/20 to-blue-600/20' };
    if (b.includes('BBVA')) return { badge: 'bg-blue-600/20 text-blue-400 border-blue-500/30', glow: 'from-blue-600/20 to-cyan-500/20' };
    if (b.includes('SCOTIA')) return { badge: 'bg-red-600/20 text-red-400 border-red-500/30', glow: 'from-red-600/20 to-rose-500/20' };
    if (b.includes('INTERBANK')) return { badge: 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30', glow: 'from-emerald-600/20 to-teal-500/20' };
    if (b.includes('NACION') || b.includes('NACIÓN')) return { badge: 'bg-amber-600/20 text-amber-300 border-amber-500/30', glow: 'from-amber-600/20 to-yellow-500/20' };
    return { badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30', glow: 'from-amber-500/20 to-yellow-500/20' };
  };

  const bankStyle = getBankStyle(activeAccount.bank);

  return (
    <div className="space-y-4">
      
      {/* Selector Rápido de Banco en Pestañas */}
      {bankAccounts.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-darsil-border pb-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Cuentas Disponibles:</span>
            <div className="flex flex-wrap gap-1.5">
              {bankAccounts.map((acc, idx) => (
                <button
                  key={acc._id || idx}
                  onClick={() => {
                    setSelectedIdx(idx);
                    setIsFlipped(false);
                  }}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 border ${
                    selectedIdx === idx
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-gold-glow scale-105'
                      : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:border-amber-500/40 hover:text-white'
                  }`}
                >
                  <CreditCard className="w-3 h-3" />
                  <span>{acc.bank}</span>
                  <span className="text-[10px] opacity-75">({acc.accountType || 'CTA CTE'})</span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setIsFlipped(!isFlipped)}
            className="flex items-center space-x-1.5 text-xs text-amber-400 hover:text-amber-300 font-bold bg-slate-800/80 px-3 py-1 rounded-xl border border-slate-700 hover:border-amber-500/50 transition"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>{isFlipped ? 'Ver Anverso' : 'Ver Reverso (CCI)'}</span>
          </button>
        </div>
      )}

      {/* Contenedor de Tarjeta VISA con Efecto 3D y Giro */}
      <div className="flex flex-col lg:flex-row items-center gap-6 justify-center">
        
        {/* Tarjeta VISA Interactiva */}
        <div 
          className="relative w-full max-w-[430px] h-[250px] cursor-pointer select-none perspective group"
          onClick={() => setIsFlipped(!isFlipped)}
          title="Haz clic para girar la tarjeta"
        >
          {/* Sombra y Resplandor Ambiental */}
          <div className={`absolute -inset-1 rounded-3xl bg-gradient-to-r ${bankStyle.glow} blur-xl opacity-75 group-hover:opacity-100 transition duration-500`}></div>

          <div 
            className={`relative w-full h-full duration-700 rounded-3xl p-6 shadow-2xl border border-amber-500/40 transition-transform transform-gpu ${
              isFlipped ? '[transform:rotateY(180deg)]' : ''
            }`}
            style={{ 
              transformStyle: 'preserve-3d',
              background: 'linear-gradient(135deg, #111115 0%, #1a1a24 45%, #0d0d11 100%)'
            }}
          >
            
            {/* ==================== ANVERSO (FRONT) ==================== */}
            <div 
              className={`absolute inset-0 p-6 flex flex-col justify-between rounded-3xl ${
                isFlipped ? 'pointer-events-none opacity-0' : 'opacity-100'
              } transition-opacity duration-300`}
              style={{ backfaceVisibility: 'hidden' }}
            >
              {/* Textura de fondo metálico sutil */}
              <div className="absolute inset-0 rounded-3xl bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.12),transparent_60%)] pointer-events-none"></div>

              {/* Fila Superior: Banco + Chip EMV + Contactless */}
              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase block">
                    CUENTA EMPRESARIAL
                  </span>
                  <div className="flex items-center space-x-2 mt-0.5">
                    <span className="text-base font-black text-white font-mono tracking-wider">
                      {activeAccount.bank}
                    </span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${bankStyle.badge}`}>
                      {activeAccount.accountType || 'CTA CTE'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {/* Símbolo Contactless */}
                  <div className="text-amber-300/80 -rotate-90">
                    <Wifi className="w-5 h-5" />
                  </div>

                  {/* Logo VISA Oficial con Efecto Metálico */}
                  <div className="text-right">
                    <span className="text-2xl font-black italic tracking-tighter text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] font-sans">
                      VISA
                    </span>
                    <span className="text-[8px] font-bold text-amber-400 block -mt-1 tracking-widest">
                      PLATINUM
                    </span>
                  </div>
                </div>
              </div>

              {/* Centro: Chip EMV Metálico Realista */}
              <div className="relative z-10 flex items-center space-x-4 my-auto">
                <div className="w-12 h-9 rounded-md bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-600 p-[1px] shadow-inner border border-yellow-200/60 relative overflow-hidden flex items-center justify-center">
                  {/* Líneas de microcircuito del chip */}
                  <div className="w-full h-full bg-gradient-to-tr from-amber-400 to-yellow-300 relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-6 h-4 border border-amber-700/60 rounded-sm"></div>
                    </div>
                    <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-amber-700/60"></div>
                    <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-amber-700/60"></div>
                  </div>
                </div>

                {/* Sello de Seguridad */}
                <div className="flex items-center space-x-1 text-[10px] text-slate-400 font-mono">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>DARSIL SECURE PAY</span>
                </div>
              </div>

              {/* Fila Inferior: Número de Cuenta Formateado + Titular + Vencimiento */}
              <div className="relative z-10 space-y-2">
                <div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5 font-mono">
                    <span>N° DE CUENTA BANCARIA</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowFullNumber(!showFullNumber);
                      }}
                      className="hover:text-amber-400 transition"
                      title={showFullNumber ? "Ocultar dígitos" : "Mostrar dígitos"}
                    >
                      {showFullNumber ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </button>
                  </div>
                  <div className="font-mono text-lg sm:text-xl font-bold tracking-widest text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                    {formatCardNumber(activeAccount.accountNumber)}
                  </div>
                </div>

                <div className="flex items-end justify-between pt-1 border-t border-slate-700/50">
                  <div>
                    <span className="text-[8px] uppercase tracking-wider text-slate-400 block font-mono">
                      TITULAR / CARDHOLDER
                    </span>
                    <span className="text-xs font-black text-amber-400 tracking-wide block uppercase">
                      DARSIL AUTOMOTIVE SOLUTIONS
                    </span>
                    <span className="text-[10px] font-semibold text-slate-300 block">
                      RUBEN DARIO BACILIO DE LA CRUZ
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[8px] uppercase tracking-wider text-slate-400 block font-mono">
                      VÁLIDA HASTA
                    </span>
                    <span className="text-xs font-mono font-bold text-white">
                      12 / 29
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* ==================== REVERSO (BACK) ==================== */}
            <div 
              className={`absolute inset-0 py-5 px-6 flex flex-col justify-between rounded-3xl [transform:rotateY(180deg)] ${
                !isFlipped ? 'pointer-events-none opacity-0' : 'opacity-100'
              } transition-opacity duration-300`}
              style={{ backfaceVisibility: 'hidden' }}
            >
              {/* Banda Magnética */}
              <div className="-mx-6 -mt-2 h-11 bg-black border-y border-slate-800 flex items-center px-6">
                <span className="text-[8px] font-mono text-slate-600 tracking-widest">
                  ||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||
                </span>
              </div>

              {/* Panel de Firma y CVV */}
              <div className="space-y-2 mt-2">
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>FIRMA AUTORIZADA</span>
                  <span>CVV / CVC</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-8 bg-slate-200 rounded flex items-center px-3 text-slate-800 font-serif italic text-xs font-bold tracking-wide select-none">
                    Ruben Dario Bacilio De La Cruz
                  </div>
                  <div className="w-14 h-8 bg-white rounded flex items-center justify-center font-mono font-black text-slate-900 text-xs border border-slate-300 shadow-inner">
                    824
                  </div>
                </div>
              </div>

              {/* Bloque CCI Interbancario */}
              <div className="bg-slate-900/90 rounded-2xl p-3 border border-amber-500/30 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold text-slate-400 uppercase font-mono">
                    CÓDIGO DE CUENTA INTERBANCARIO (CCI)
                  </span>
                  <span className="text-[9px] font-bold text-amber-400 font-mono">
                    {activeAccount.bank}
                  </span>
                </div>
                <div className="font-mono text-sm sm:text-base font-black text-amber-300 tracking-wider">
                  {activeAccount.interbankAccount}
                </div>
              </div>

              {/* Soporte Oficial DARSIL */}
              <div className="flex items-center justify-between text-[9px] text-slate-400 pt-1 font-mono">
                <span>Central: +51 934 787 006</span>
                <span className="italic">darsil.com • Lima - Perú</span>
              </div>

            </div>

          </div>
        </div>

        {/* Panel Lateral: Botones de Acción Rápida para la Cuenta Activa */}
        <div className="w-full lg:w-80 bg-darsil-obsidian border border-darsil-border p-5 rounded-3xl space-y-4 shadow-card-dark">
          <div className="flex items-center justify-between border-b border-darsil-border pb-3">
            <div>
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                Cuenta Seleccionada
              </span>
              <h3 className="text-base font-black text-white">
                {activeAccount.bank}
              </h3>
            </div>
            <span className="text-xs bg-slate-800 text-slate-300 font-bold px-2.5 py-1 rounded-xl border border-slate-700">
              {activeAccount.accountType || 'CTA CTE'}
            </span>
          </div>

          <div className="space-y-2.5">
            {/* Copiar Número de Cuenta */}
            <button
              onClick={() => handleCopy(activeAccount.accountNumber, 'account')}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/40 transition text-left group"
            >
              <div>
                <div className="text-[10px] text-slate-400 font-medium">N° de Cuenta:</div>
                <div className="font-mono font-bold text-xs text-white group-hover:text-amber-400 transition">
                  {activeAccount.accountNumber}
                </div>
              </div>
              <div className="p-2 rounded-xl bg-slate-800 text-slate-300 group-hover:bg-amber-500 group-hover:text-slate-950 transition">
                {copiedType === 'account' ? <Check className="w-4 h-4 text-emerald-400 group-hover:text-slate-950" /> : <Copy className="w-4 h-4" />}
              </div>
            </button>

            {/* Copiar CCI */}
            <button
              onClick={() => handleCopy(activeAccount.interbankAccount, 'cci')}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/40 transition text-left group"
            >
              <div>
                <div className="text-[10px] text-slate-400 font-medium">CCI Interbancario:</div>
                <div className="font-mono font-bold text-xs text-amber-300 group-hover:text-amber-200 transition">
                  {activeAccount.interbankAccount}
                </div>
              </div>
              <div className="p-2 rounded-xl bg-slate-800 text-slate-300 group-hover:bg-amber-500 group-hover:text-slate-950 transition">
                {copiedType === 'cci' ? <Check className="w-4 h-4 text-emerald-400 group-hover:text-slate-950" /> : <Copy className="w-4 h-4" />}
              </div>
            </button>
          </div>

          {/* Feedback de Copia */}
          {copiedType && (
            <div className="text-center py-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 rounded-xl border border-emerald-500/30 animate-pulse">
              ¡{copiedType === 'account' ? 'N° de Cuenta' : 'CCI Interbancario'} copiado con éxito!
            </div>
          )}

          {/* Botones de Editar y Nueva Cuenta */}
          <div className="flex items-center gap-2 pt-2 border-t border-darsil-border">
            {onEditAccount && (
              <button
                onClick={() => onEditAccount(activeAccount)}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition text-center"
              >
                Editar Datos
              </button>
            )}
            {onAddAccount && (
              <button
                onClick={onAddAccount}
                className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 text-slate-950 text-xs font-black transition text-center shadow-gold-glow"
              >
                + Nueva Cuenta
              </button>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
