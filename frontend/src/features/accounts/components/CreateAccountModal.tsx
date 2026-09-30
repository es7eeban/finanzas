import React, { useState, useEffect } from 'react';
import type { CreateAccountInput } from '../hooks/useAccounts';
import type { AccountType, Currency } from '../../../types';
import { X } from 'lucide-react';

interface CreateAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateAccountInput) => Promise<void>;
}

export const CreateAccountModal: React.FC<CreateAccountModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [institution, setInstitution] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [type, setType] = useState<AccountType>('CHECKING');
  const [currency, setCurrency] = useState<Currency>('CLP');
  const [balance, setBalance] = useState<string>('0');
  const [creditLimit, setCreditLimit] = useState<string>('');
  const [billingCloseDay, setBillingCloseDay] = useState<string>('');
  const [paymentDueDay, setPaymentDueDay] = useState<string>('');
  const [color, setColor] = useState<string>('#2563EB');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setName('');
    setInstitution('');
    setAccountNumber('');
    setType('CHECKING');
    setCurrency('CLP');
    setBalance('0');
    setCreditLimit('');
    setBillingCloseDay('');
    setPaymentDueDay('');
    setColor('#2563EB');
    setError(null);
  };

  // Limpiar el formulario cada vez que se abra el modal
  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Por favor indica un nombre para la cuenta o tarjeta');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        name: name.trim(),
        institution: institution.trim() || undefined,
        accountNumber: accountNumber.trim() || undefined,
        type,
        currency,
        balance: parseFloat(balance) || 0,
        creditLimit: creditLimit ? parseFloat(creditLimit) : undefined,
        billingCloseDay: billingCloseDay ? parseInt(billingCloseDay, 10) : undefined,
        paymentDueDay: paymentDueDay ? parseInt(paymentDueDay, 10) : undefined,
        color,
      });
      resetForm();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al crear cuenta');
    } finally {
      setSubmitting(false);
    }
  };

  const colors = ['#2563EB', '#4F46E5', '#10B981', '#F59E0B', '#DC2626', '#8B5CF6', '#0D9488'];

  const commonInstitutions = [
    'Banco de Chile',
    'Banco Santander',
    'BancoEstado',
    'BCI',
    'Scotiabank',
    'Itaú',
    'Banco Falabella',
    'Mercado Pago',
    'Tenpo',
    'Efectivo / Billetera',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Nueva Cuenta o Tarjeta</h3>
            <p className="text-xs text-slate-400">Registra un nuevo método de pago</p>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 text-xs bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 rounded-xl border border-rose-200 dark:border-rose-800 font-medium">
              ⚠️ {error}
            </div>
          )}

          {/* Nombre */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Nombre de la Cuenta *
            </label>
            <input
              type="text"
              placeholder="Ej. Cuenta Corriente Principal, Visa Signature"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          {/* Banco / Institución & Últimos 4 dígitos */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Banco / Institución
              </label>
              <input
                type="text"
                list="institutions-list"
                placeholder="Ej. Santander, BCI"
                value={institution}
                onChange={(e) => {
                  setInstitution(e.target.value);
                  if (error) setError(null);
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <datalist id="institutions-list">
                {commonInstitutions.map((inst) => (
                  <option key={inst} value={inst} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Últimos 4 Dígitos
              </label>
              <input
                type="text"
                maxLength={8}
                placeholder="Ej. 4589"
                value={accountNumber}
                onChange={(e) => {
                  setAccountNumber(e.target.value);
                  if (error) setError(null);
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs tabular-nums focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Tipo & Moneda */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Tipo
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as AccountType)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="CHECKING">Cuenta Corriente</option>
                <option value="CREDIT_CARD">Tarjeta de Crédito</option>
                <option value="SAVINGS">Cuenta de Ahorro</option>
                <option value="CASH">Efectivo / Billetera</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Moneda
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCurrency('CLP')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-xl border transition-all ${
                    currency === 'CLP'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  CLP
                </button>
                <button
                  type="button"
                  onClick={() => setCurrency('USD')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-xl border transition-all ${
                    currency === 'USD'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  USD ($)
                </button>
              </div>
            </div>
          </div>

          {/* Saldo Inicial */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Saldo Inicial ({currency})
            </label>
            <input
              type="number"
              step={currency === 'USD' ? '0.01' : '1'}
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Campos específicos de Tarjeta de Crédito */}
          {type === 'CREDIT_CARD' && (
            <div className="space-y-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Cupo Total de Crédito</label>
                <input
                  type="number"
                  placeholder="Ej. 2500000"
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs tabular-nums"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Día de Corte</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    placeholder="Ej. 20"
                    value={billingCloseDay}
                    onChange={(e) => setBillingCloseDay(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Día de Pago</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    placeholder="Ej. 5"
                    value={paymentDueDay}
                    onChange={(e) => setPaymentDueDay(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs tabular-nums"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Color Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Color Distintivo
            </label>
            <div className="flex gap-2">
              {colors.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    color === c ? 'scale-125 ring-2 ring-indigo-500' : 'opacity-80'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50"
            >
              {submitting ? 'Guardando...' : 'Crear Cuenta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
