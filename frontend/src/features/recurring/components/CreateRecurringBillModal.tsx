import React, { useState, useEffect, useMemo } from 'react';
import { X, AlertCircle, Loader2 } from 'lucide-react';
import type {
  BillCategory,
  BillExecutionType,
  BillFrequency,
  Currency,
  RecurringBill,
} from '../../../types';
import type {
  CreateRecurringBillInput,
  UpdateRecurringBillInput,
} from '../hooks/useRecurringBills';
import { useAccounts } from '../../accounts/hooks/useAccounts';
import {
  BILL_CATEGORIES,
  BILL_EXECUTION_TYPES,
  BILL_FREQUENCIES,
} from '../constants';

interface CreateRecurringBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  bill?: RecurringBill | null;
  onSubmit: (input: CreateRecurringBillInput) => Promise<void>;
  onUpdate?: (id: string, input: UpdateRecurringBillInput) => Promise<void>;
}

export const CreateRecurringBillModal: React.FC<CreateRecurringBillModalProps> = ({
  isOpen,
  onClose,
  bill = null,
  onSubmit,
  onUpdate,
}) => {
  const isEditMode = bill !== null;
  const { accounts } = useAccounts();
  const activeAccounts = useMemo(() => accounts.filter((a) => a.isActive), [accounts]);

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<Currency>('CLP');
  const [executionType, setExecutionType] = useState<BillExecutionType>('MANUAL_CHECK');
  const [category, setCategory] = useState<BillCategory>('UTILITIES');
  const [dueDay, setDueDay] = useState<number>(10);
  const [frequency, setFrequency] = useState<BillFrequency>('MONTHLY');
  const [accountId, setAccountId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    if (bill) {
      setName(bill.name);
      setAmount(String(bill.amount));
      setCurrency(bill.currency);
      setExecutionType(bill.executionType);
      setCategory(bill.category);
      setDueDay(bill.dueDay);
      setFrequency(bill.frequency);
      setAccountId(bill.accountId || '');
      setNotes(bill.notes || '');
    } else {
      const defaultAcc = activeAccounts[0]?.id || '';
      setName('');
      setAmount('');
      setCurrency('CLP');
      setExecutionType('MANUAL_CHECK');
      setCategory('UTILITIES');
      setDueDay(10);
      setFrequency('MONTHLY');
      setAccountId(defaultAcc);
      setNotes('');
    }
    setError(null);
  }, [isOpen, bill, activeAccounts]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Por favor indica el nombre del servicio o suscripción');
      return;
    }

    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      setError('Por favor ingresa un monto válido mayor a 0');
      return;
    }

    if (dueDay < 1 || dueDay > 31) {
      setError('El día de vencimiento debe estar entre 1 y 31');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      if (isEditMode && bill && onUpdate) {
        await onUpdate(bill.id, {
          name: name.trim(),
          amount: numAmount,
          currency,
          frequency,
          executionType,
          category,
          dueDay,
          accountId: accountId || null,
          notes: notes.trim() || null,
        });
      } else {
        await onSubmit({
          name: name.trim(),
          amount: numAmount,
          currency,
          frequency,
          executionType,
          category,
          dueDay,
          accountId: accountId || undefined,
          notes: notes.trim() || undefined,
        });
      }
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar el servicio');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-bill-title"
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div>
            <h3 id="create-bill-title" className="text-base font-bold text-slate-900 dark:text-white">
              {isEditMode ? 'Editar Servicio o Suscripción' : 'Nuevo Pago Recurrente'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isEditMode
                ? 'Actualiza el monto, fecha o modalidad de cobro'
                : 'Controla cuentas básicas, suscripciones y arriendos'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 text-xs bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 rounded-xl border border-rose-200 dark:border-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Modalidad de Cobro (Automático vs Manual) */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Modalidad de Ejecución *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['MANUAL_CHECK', 'AUTOMATIC'] as const).map((type) => {
                const meta = BILL_EXECUTION_TYPES[type];
                const isSelected = executionType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setExecutionType(type)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-600 dark:border-indigo-500 text-indigo-900 dark:text-indigo-200 ring-1 ring-indigo-600 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-xs font-bold">{meta.shortLabel}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {type === 'MANUAL_CHECK'
                        ? 'Luz, Agua, Gas, Gastos Comunes'
                        : 'Netflix, Spotify, PAT domiciliado'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Nombre del Servicio */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Nombre del Servicio o Suscripción *
            </label>
            <input
              type="text"
              required
              maxLength={100}
              placeholder="Ej. Luz Enel, Aguas Andinas, Netflix 4K, Arriendo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Monto & Moneda */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Monto Estimado o Fijo *
              </label>
              <input
                type="number"
                step={currency === 'USD' ? '0.01' : '1'}
                required
                placeholder="Ej. 25000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-semibold tabular-nums focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Moneda
              </label>
              <div className="flex gap-1 h-[42px]">
                {(['CLP', 'USD'] as const).map((curr) => (
                  <button
                    key={curr}
                    type="button"
                    onClick={() => setCurrency(curr)}
                    className={`flex-1 text-xs font-bold rounded-xl border transition-all ${
                      currency === curr
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {curr}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Categoría & Día de Vencimiento */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Categoría *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as BillCategory)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {(Object.keys(BILL_CATEGORIES) as BillCategory[]).map((cat) => (
                  <option key={cat} value={cat}>
                    {BILL_CATEGORIES[cat].label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Día de Vencimiento (1 - 31) *
              </label>
              <input
                type="number"
                min="1"
                max="31"
                required
                value={dueDay}
                onChange={(e) => setDueDay(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs tabular-nums focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Frecuencia & Cuenta Sugerida */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Frecuencia
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as BillFrequency)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {(Object.keys(BILL_FREQUENCIES) as BillFrequency[]).map((f) => (
                  <option key={f} value={f}>
                    {BILL_FREQUENCIES[f]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Cuenta Sugerida / PAT
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Ninguna seleccionada</option>
                {activeAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.institution || acc.type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Notas adicionales (opcional)
            </label>
            <input
              type="text"
              maxLength={255}
              placeholder="Ej. Número de cliente 1234567, portal de pago municipal"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <span>{isEditMode ? 'Guardar Cambios' : 'Crear Servicio'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
