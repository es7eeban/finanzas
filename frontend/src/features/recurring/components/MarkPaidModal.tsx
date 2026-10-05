import React, { useState, useEffect, useMemo } from 'react';
import { X, AlertCircle, Loader2, Check } from 'lucide-react';
import type { RecurringBill } from '../../../types';
import type { MarkPaidInput } from '../hooks/useRecurringBills';
import { useAccounts } from '../../accounts/hooks/useAccounts';
import { DatePicker } from '../../../components/common/DatePicker';
import { formatCurrency } from '../../../utils/currency';

interface MarkPaidModalProps {
  isOpen: boolean;
  onClose: () => void;
  bill: RecurringBill | null;
  onConfirm: (data: MarkPaidInput) => Promise<void>;
}

export const MarkPaidModal: React.FC<MarkPaidModalProps> = ({
  isOpen,
  onClose,
  bill,
  onConfirm,
}) => {
  const { accounts } = useAccounts();
  const activeAccounts = useMemo(() => accounts.filter((a) => a.isActive), [accounts]);

  const [amountPaid, setAmountPaid] = useState<string>('');
  const [accountId, setAccountId] = useState<string>('');
  const [paidAt, setPaidAt] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const defaultAccountId = activeAccounts[0]?.id || '';
  const suggestedAccountId =
    bill?.accountId && activeAccounts.some((a) => a.id === bill.accountId)
      ? bill.accountId
      : defaultAccountId;

  useEffect(() => {
    if (bill && isOpen) {
      setAmountPaid(String(bill.amount));
      setAccountId(suggestedAccountId);
      setPaidAt(new Date().toISOString().split('T')[0]);
      setNotes(`Pago boleta: ${bill.name}`);
      setError(null);
    }
  }, [bill, isOpen, suggestedAccountId]);

  if (!isOpen || !bill) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amountPaid);
    if (!numAmount || numAmount <= 0) {
      setError('Por favor ingresa un monto válido mayor a 0');
      return;
    }

    if (!accountId) {
      setError('Por favor selecciona la cuenta donde se debitó el pago');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onConfirm({
        accountId,
        amountPaid: numAmount,
        paidAt: new Date(paidAt).toISOString(),
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al registrar el pago');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="mark-paid-title"
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col"
      >
        {/* Cabecera */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 id="mark-paid-title" className="text-base font-bold text-slate-900 dark:text-white">
              Confirmar Pago de Servicio
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Registra el gasto y descuenta el saldo de tu cuenta
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

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 rounded-xl border border-rose-200 dark:border-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Resumen del servicio */}
          <div className="p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Servicio a pagar
            </span>
            <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
              {bill.name}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Monto presupuestado: {formatCurrency(bill.amount, bill.currency)} • Vence el día {bill.dueDay}
            </div>
          </div>

          {/* Monto efectivamente pagado */}
          <div>
            <label
              htmlFor="mark-paid-amount"
              className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5"
            >
              Monto Pagado ({bill.currency}) *
            </label>
            <input
              id="mark-paid-amount"
              type="number"
              step={bill.currency === 'USD' ? '0.01' : '1'}
              required
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              placeholder="Ej. 25000"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-semibold tabular-nums focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Modifica este valor si la boleta real varió respecto al estimado
            </p>
          </div>

          {/* Cuenta de débito */}
          <div>
            <label
              htmlFor="mark-paid-account"
              className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5"
            >
              Cuenta de Débito *
            </label>
            <select
              id="mark-paid-account"
              required
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {activeAccounts.length === 0 && (
                <option value="">No tienes cuentas activas</option>
              )}
              {activeAccounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.institution || acc.type}) — Saldo: {formatCurrency(acc.balance, acc.currency)}
                </option>
              ))}
            </select>
          </div>

          {/* Fecha de pago */}
          <div>
            <DatePicker
              label="Fecha Efectiva de Pago *"
              value={paidAt}
              onChange={setPaidAt}
              required
            />
          </div>

          {/* Notas */}
          <div>
            <label
              htmlFor="mark-paid-notes"
              className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5"
            >
              Notas o Referencia
            </label>
            <input
              id="mark-paid-notes"
              type="text"
              maxLength={255}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Boleta pagada vía BancoEstado portal"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Botones de acción */}
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
              disabled={loading || activeAccounts.length === 0}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Procesando...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Confirmar Pago y Registrar Gasto</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
