import React, { useState, useEffect } from 'react';
import { ShieldCheck, Phone, Mail, MapPin, Building, CreditCard, Plus, Trash2, Edit2, CheckCircle, Fuel, Save, Loader2 } from 'lucide-react';
import { api } from '../services/api';

export default function CompanyInfoView() {
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estados para formulario de Taller
  const [workshopAddress, setWorkshopAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [baseTransportFee, setBaseTransportFee] = useState(35.0);
  const [transportRatePerKm, setTransportRatePerKm] = useState(2.50);
  const [savingWorkshop, setSavingWorkshop] = useState(false);

  // Estados para CRUD de Cuentas Bancarias
  const [showAddBankModal, setShowAddBankModal] = useState(false);
  const [editingBank, setEditingBank] = useState(null);
  const [bankName, setBankName] = useState('SCOTIABANK');
  const [accountType, setAccountType] = useState('CTA CTE');
  const [accountNumber, setAccountNumber] = useState('');
  const [interbankAccount, setInterbankAccount] = useState('');
  const [savingBank, setSavingBank] = useState(false);

  const fetchCompanyData = async () => {
    try {
      setLoading(true);
      const res = await api.getCompany();
      if (res.success && res.data) {
        setCompany(res.data);
        setWorkshopAddress(res.data.workshopAddress || 'Av. Los Forestales MZ I1, Villa El Salvador, Lima');
        setPhone(res.data.phones?.[0] || '934787006');
        setEmail(res.data.emails?.[0] || 'rubenbasil24@gmail.com');
        setBaseTransportFee(res.data.baseTransportFee || 35.0);
        setTransportRatePerKm(res.data.transportRatePerKm || 2.50);
      }
    } catch (err) {
      console.error('Error fetching company:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanyData();
  }, []);

  // Guardar datos generales del taller
  const handleSaveWorkshop = async (e) => {
    e.preventDefault();
    setSavingWorkshop(true);
    try {
      const res = await api.updateCompany({
        workshopAddress,
        phones: [phone],
        emails: [email],
        baseTransportFee: Number(baseTransportFee),
        transportRatePerKm: Number(transportRatePerKm)
      });
      if (res.success) {
        alert('¡Datos del taller y tarifas de transporte actualizados con éxito!');
        fetchCompanyData();
      } else {
        alert('Error: ' + res.message);
      }
    } catch (err) {
      alert('Error al guardar: ' + err.message);
    } finally {
      setSavingWorkshop(false);
    }
  };

  // Guardar cuenta bancaria (Crear o Editar)
  const handleSaveBank = async (e) => {
    e.preventDefault();
    if (!accountNumber || !interbankAccount) {
      alert('Por favor ingresa N° de cuenta y CCI');
      return;
    }

    setSavingBank(true);
    try {
      let res;
      if (editingBank) {
        res = await api.updateBankAccount(editingBank._id, {
          bank: bankName,
          accountType,
          accountNumber,
          interbankAccount
        });
      } else {
        res = await api.addBankAccount({
          bank: bankName,
          accountType,
          accountNumber,
          interbankAccount
        });
      }

      if (res.success) {
        alert(editingBank ? '¡Cuenta bancaria actualizada!' : '¡Cuenta bancaria agregada!');
        setShowAddBankModal(false);
        setEditingBank(null);
        setAccountNumber('');
        setInterbankAccount('');
        fetchCompanyData();
      } else {
        alert('Error: ' + res.message);
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSavingBank(false);
    }
  };

  // Eliminar cuenta bancaria
  const handleDeleteBank = async (account) => {
    if (!window.confirm(`¿Eliminar la cuenta de ${account.bank} (${account.accountNumber})?`)) return;
    try {
      const res = await api.deleteBankAccount(account._id);
      if (res.success) {
        fetchCompanyData();
      } else {
        alert('Error: ' + res.message);
      }
    } catch (err) {
      alert('Error al eliminar: ' + err.message);
    }
  };

  const openEditBank = (acc) => {
    setEditingBank(acc);
    setBankName(acc.bank);
    setAccountType(acc.accountType || 'CTA CTE');
    setAccountNumber(acc.accountNumber);
    setInterbankAccount(acc.interbankAccount);
    setShowAddBankModal(true);
  };

  const openAddBank = () => {
    setEditingBank(null);
    setBankName('BCP');
    setAccountType('CTA CTE');
    setAccountNumber('');
    setInterbankAccount('');
    setShowAddBankModal(true);
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-darsil-gold mb-2" />
        <p className="text-xs font-semibold">Cargando datos del taller...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Banner Principal con Logo DARSIL */}
      <div className="bg-darsil-card border border-darsil-border p-6 rounded-3xl shadow-card-dark relative overflow-hidden flex flex-col md:flex-row items-center gap-6">
        <div className="w-full md:w-56 h-28 bg-black/60 rounded-2xl flex items-center justify-center p-2 border border-darsil-border overflow-hidden">
          <img
            src="./logo_transparente.png"
            alt="DARSIL Logo Oficial"
            className="w-full h-full object-contain filter drop-shadow-[0_0_10px_rgba(229,169,60,0.3)]"
          />
        </div>

        <div className="flex-1 text-center md:text-left space-y-1">
          <div className="inline-block bg-amber-500/10 text-amber-300 font-mono font-bold text-xs px-3 py-1 rounded-full border border-amber-500/30">
            GESTIÓN DE TALLER & FINANZAS
          </div>
          <h1 className="text-xl md:text-2xl font-black text-white tracking-wide">
            DARSIL AUTOMOTIVE SOLUTIONS
          </h1>
          <p className="text-xs text-slate-400">
            Configura las cuentas bancarias oficiales impresas en el PDF y los parámetros de logística para cálculo de rutas con Mapbox.
          </p>
        </div>
      </div>

      {/* CRUD de Cuentas Bancarias */}
      <div className="bg-darsil-card border border-darsil-border p-6 rounded-3xl shadow-card-dark space-y-4">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-white font-bold text-base">
            <CreditCard className="w-5 h-5 text-darsil-gold" />
            <span>Cuentas Bancarias Registradas (Impresas en PDF Oficial)</span>
          </div>

          <button
            type="button"
            onClick={openAddBank}
            className="bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 text-slate-950 px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 shadow-gold-glow active:scale-95 transition"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            <span>Nueva Cuenta Bancaria</span>
          </button>
        </div>

        {/* Grid de Cuentas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(company?.bankAccounts || []).map((acc) => (
            <div
              key={acc._id}
              className="bg-darsil-obsidian border border-darsil-border hover:border-amber-500/40 p-4 rounded-2xl space-y-3 transition group"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-black text-sm text-darsil-gold tracking-wide">
                  {acc.bank}
                </span>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] bg-slate-800 text-slate-300 font-bold px-2 py-0.5 rounded border border-slate-700">
                    {acc.accountType || 'CTA CTE'}
                  </span>
                  <button
                    onClick={() => openEditBank(acc)}
                    className="p-1 rounded text-slate-400 hover:text-amber-400 transition"
                    title="Editar cuenta"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteBank(acc)}
                    className="p-1 rounded text-slate-500 hover:text-rose-400 transition"
                    title="Eliminar cuenta"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex justify-between py-1 border-b border-darsil-border/60 text-slate-400">
                  <span>N° Cuenta:</span>
                  <span className="font-mono font-bold text-white">{acc.accountNumber}</span>
                </div>
                <div className="flex justify-between py-1 text-slate-400">
                  <span>CCI Interbancario:</span>
                  <span className="font-mono font-bold text-amber-300">{acc.interbankAccount}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Parámetros Operativos del Taller & Viáticos Mapbox */}
      <div className="bg-darsil-card border border-darsil-border p-6 rounded-3xl shadow-card-dark space-y-4">
        
        <div className="flex items-center space-x-2 text-white font-bold text-base">
          <Building className="w-5 h-5 text-darsil-gold" />
          <span>Dirección de Taller & Tarifas de Transporte (Mapbox)</span>
        </div>

        <form onSubmit={handleSaveWorkshop} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          
          <div className="sm:col-span-2">
            <label className="block text-slate-400 font-semibold mb-1">Dirección Base de Taller (Punto de Partida para Rutas):</label>
            <input
              type="text"
              required
              value={workshopAddress}
              onChange={(e) => setWorkshopAddress(e.target.value)}
              placeholder="Av. Los Forestales MZ I1, Villa El Salvador, Lima"
              className="w-full bg-darsil-obsidian border border-darsil-border rounded-xl px-3.5 py-2 text-white font-medium outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Teléfono Principal de Contacto:</label>
            <input
              type="text"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="934787006"
              className="w-full bg-darsil-obsidian border border-darsil-border rounded-xl px-3.5 py-2 text-white font-mono outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Email de Cotizaciones:</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="rubenbasil24@gmail.com"
              className="w-full bg-darsil-obsidian border border-darsil-border rounded-xl px-3.5 py-2 text-white outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Tarifa Base de Salida Técnica (S/):</label>
            <input
              type="number"
              step="1.0"
              required
              value={baseTransportFee}
              onChange={(e) => setBaseTransportFee(e.target.value)}
              className="w-full bg-darsil-obsidian border border-darsil-border rounded-xl px-3.5 py-2 text-amber-400 font-mono font-bold outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Costo por Kilómetro Recorrido (S/ / km):</label>
            <input
              type="number"
              step="0.10"
              required
              value={transportRatePerKm}
              onChange={(e) => setTransportRatePerKm(e.target.value)}
              className="w-full bg-darsil-obsidian border border-darsil-border rounded-xl px-3.5 py-2 text-amber-400 font-mono font-bold outline-none focus:border-amber-400"
            />
          </div>

          <div className="sm:col-span-2 flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingWorkshop}
              className="bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 text-slate-950 px-6 py-2.5 rounded-xl font-black text-xs flex items-center space-x-2 shadow-gold-glow active:scale-95 transition"
            >
              {savingWorkshop ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Guardar Parámetros de Taller</span>
            </button>
          </div>

        </form>

      </div>

      {/* Modal Agregar / Editar Cuenta Bancaria */}
      {showAddBankModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-darsil-card w-full max-w-md rounded-3xl shadow-2xl p-6 border border-darsil-border text-white space-y-4">
            
            <div className="flex items-center justify-between border-b border-darsil-border pb-3">
              <h3 className="font-bold text-base text-white">
                {editingBank ? 'Editar Cuenta Bancaria' : 'Agregar Nueva Cuenta Bancaria'}
              </h3>
              <button onClick={() => setShowAddBankModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBank} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Entidad Bancaria:</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. BCP, BBVA, SCOTIABANK, INTERBANK"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value.toUpperCase())}
                  className="w-full bg-darsil-obsidian border border-darsil-border rounded-xl px-3 py-2 text-white font-bold outline-none focus:border-amber-400 uppercase"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Tipo de Cuenta:</label>
                <select
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value)}
                  className="w-full bg-darsil-obsidian border border-darsil-border rounded-xl px-3 py-2 text-white outline-none focus:border-amber-400 font-semibold"
                >
                  <option value="CTA CTE">Cuenta Corriente (CTA CTE)</option>
                  <option value="AHORROS">Cuenta de Ahorros</option>
                  <option value="DETRACCIONES">Cuenta de Detracciones</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">N° de Cuenta:</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. 191-2345678-0-12"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full bg-darsil-obsidian border border-darsil-border rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Código de Cuenta Interbancario (CCI):</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. 00219100234567801234"
                  value={interbankAccount}
                  onChange={(e) => setInterbankAccount(e.target.value)}
                  className="w-full bg-darsil-obsidian border border-darsil-border rounded-xl px-3 py-2 text-amber-300 font-mono outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddBankModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingBank}
                  className="bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 px-5 py-2 rounded-xl font-bold shadow-gold-glow"
                >
                  {savingBank ? 'Guardando...' : (editingBank ? 'Actualizar Cuenta' : 'Guardar Cuenta')}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
