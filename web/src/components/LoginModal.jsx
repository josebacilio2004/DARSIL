import React, { useState } from 'react';
import { Lock, User, KeyRound, ShieldAlert, CheckCircle2, ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import { api } from '../services/api';

export default function LoginModal({ onLoginSuccess, onCancel }) {
  const [username, setUsername] = useState('darios');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!username.trim() || !password.trim()) {
      setErrorMsg('Por favor ingrese su usuario y contraseña.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.login({ username, password });
      if (res.success && res.user) {
        localStorage.setItem('darsil_auth_user', JSON.stringify(res.user));
        if (res.token) localStorage.setItem('darsil_auth_token', res.token);
        onLoginSuccess(res.user);
      } else {
        setErrorMsg(res.message || 'Credenciales inválidas. Verifique sus datos.');
      }
    } catch (err) {
      setErrorMsg('Error al conectar con el servicio de autenticación.');
    } finally {
      setLoading(false);
    }
  };

  const handleUseDemoCreds = () => {
    setUsername('darios');
    setPassword('Darsil#2026*Titanium');
    setErrorMsg('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-darsil-card/95 border border-amber-500/50 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(229,169,60,0.15)] overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Glow de fondo */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Encabezado y Logo */}
        <div className="text-center space-y-3 mb-6">
          <div className="inline-block p-3 rounded-2xl bg-black/50 border border-slate-700/80 shadow-inner">
            <img 
              src="./logo_transparente.png" 
              alt="DARSIL" 
              className="h-12 w-auto mx-auto filter drop-shadow-[0_0_12px_rgba(229,169,60,0.4)]"
            />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-wide text-white uppercase flex items-center justify-center gap-2">
              <Lock className="w-4 h-4 text-amber-400" />
              Acceso a ERP Taller
            </h2>
            <p className="text-xs text-slate-400 font-medium mt-1">
              Plataforma de Cotizaciones, Flotas & Operaciones
            </p>
          </div>
        </div>

        {/* Mensaje de Error */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/70 border border-red-500/50 text-red-300 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5 text-left">
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-amber-400" />
              Usuario o Correo
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="darios o darios@darsil.com"
              className="w-full bg-black/50 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
              autoFocus
            />
          </div>

          <div className="space-y-1.5 text-left">
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              Contraseña Segura
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••••••"
              className="w-full bg-black/50 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl font-black text-sm uppercase tracking-wider bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 shadow-gold-glow hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                <span>Autenticando...</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 text-slate-950" />
                <span>Iniciar Sesión en ERP</span>
              </>
            )}
          </button>
        </form>

        {/* Credenciales Rápidas para el Dueño */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 text-center space-y-2">
          <div className="text-[11px] text-slate-400">
            Cuenta configurada para el dueño: <strong className="text-amber-300">Darios Bacilio</strong>
          </div>
          <button
            type="button"
            onClick={handleUseDemoCreds}
            className="text-[11px] text-amber-400 hover:text-amber-300 hover:underline flex items-center justify-center gap-1 mx-auto transition"
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            Autocompletar credenciales maestras
          </button>
        </div>

        {/* Botón para volver a la Landing Pública */}
        {onCancel && (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={onCancel}
              className="text-xs text-slate-500 hover:text-slate-300 flex items-center justify-center gap-1.5 mx-auto transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver al Portal de Clientes</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
