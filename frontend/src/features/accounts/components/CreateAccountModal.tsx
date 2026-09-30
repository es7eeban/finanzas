import React, { useState } from 'react';
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
  const [type, setType] = useState<AccountType>('CHECKING');
  const [currency, setCurrency] = useState<Currency>('CLP');
  const [balance, setBalance] = useState<string>('0');
  const [creditLimit, setCreditLimit] = useState<string>('');
  const [billingCloseDay, setBillingCloseDay] = useState<string>('');
  const [paymentDueDay, setPaymentDueDay] = useState<string>('');
  const [color, setColor] = useState<string>('#3B82F6');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Por favor indica un nombre para la cuenta');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        name,
        type,
        currency,
        balance: parseFloat(balance) || 0,
        creditLimit: creditLimit ? parseFloat(creditLimit) : undefined,
        billingCloseDay: billingCloseDay ? parseInt(billingCloseDay, 10) : undefined,
        paymentDueDay: paymentDueDay ? parseInt(paymentDueDay, 10) : undefined,
        color,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al crear cuenta');
    } finally {
      setSubmitting(false);
    }
  };

  const colors = ['#2563EB', '#4F46E5', '#10B981', '#F59E0B', '#DC2626', '#8B5CF6', '#0D9488'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Nueva Cuenta o Tarjeta</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 rounded-xl border border-rose-200 dark:border-rose-800">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Nombre de la Cuenta
            </label>
            <input
              type="text"
              placeholder="Ej. Banco de Chile, Ahorro, Efectivo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Tipo
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as AccountType)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="CHECKING">Cuenta Corriente</option>
                <option value="CREDIT_CARD">Tarjeta de Crédito</option>
                <option value="SAVINGS">Cuenta de Ahorro</option>
                <option value="CASH">Efectivo</option>
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
                  className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                    currency === 'CLP'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  CLP
                </button>
                <button
                  type="button"
                  onClick={() => setCurrency('USD')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                    currency === 'USD'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  USD ($)
                </button>
              </div>
            </div>
          </div>

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

          {type === 'CREDIT_CARD' && (
            <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Cupo Total</label>
                <input
                  type="number"
                  placeholder="2500000"
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Día de Corte</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  placeholder="20"
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
                  placeholder="5"
                  value={paymentDueDay}
                  onChange={(e) => setPaymentDueDay(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs tabular-nums"
                />
              </div>
            </div>
          )}

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

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition-all disabled:opacity-50"
            >
              {submitting ? 'Guardando...' : 'Crear Cuenta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
