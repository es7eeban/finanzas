import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Pencil,
  Trash2,
  Zap,
  CheckSquare,
  Check,
  Building2,
  Loader2,
} from 'lucide-react';
import type { RecurringBill } from '../../../types';
import { BILL_CATEGORIES, BILL_FREQUENCIES } from '../constants';
import { formatCurrency } from '../../../utils/currency';
import { CurrencyToggle } from '../../exchange-rate';

interface RecurringBillCardProps {
  bill: RecurringBill;
  onMarkPaid: (bill: RecurringBill) => void;
  onEdit: (bill: RecurringBill) => void;
  onDelete: (id: string) => Promise<void> | void;
}

export const RecurringBillCard: React.FC<RecurringBillCardProps> = ({
  bill,
  onMarkPaid,
  onEdit,
  onDelete,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const categoryMeta = BILL_CATEGORIES[bill.category] || BILL_CATEGORIES.OTHER;
  const CategoryIcon = categoryMeta.icon;

  const isPaid = !!bill.isPaidThisMonth;
  const isAutomatic = bill.executionType === 'AUTOMATIC';

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(bill.id);
    } catch {
      setIsDeleting(false);
      setShowConfirmDelete(false);
    }
  };

  // Determinar status badge visual
  const renderStatusBadge = () => {
    if (isPaid) {
      const paidDate = bill.currentExecution?.paidAt
        ? new Date(bill.currentExecution.paidAt).toLocaleDateString('es-CL', {
            day: 'numeric',
            month: 'short',
          })
        : null;

      return (
        <span
          data-testid="status-badge-paid"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Pagado este mes {paidDate ? `(${paidDate})` : '✓'}</span>
        </span>
      );
    }

    if (bill.isOverdue || bill.status === 'OVERDUE') {
      const days = Math.abs(bill.daysRemaining ?? 0);
      return (
        <span
          data-testid="status-badge-overdue"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 animate-pulse"
        >
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Vencido {days > 0 ? `hace ${days} d` : 'este ciclo'}</span>
        </span>
      );
    }

    if (bill.status === 'DUE_SOON' || (bill.daysRemaining !== undefined && bill.daysRemaining <= 3 && bill.daysRemaining >= 0)) {
      const days = bill.daysRemaining ?? 0;
      return (
        <span
          data-testid="status-badge-due-soon"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
        >
          <Clock className="w-3.5 h-3.5" />
          <span>{days === 0 ? '¡Vence hoy!' : `Vence en ${days} día${days > 1 ? 's' : ''}`}</span>
        </span>
      );
    }

    return (
      <span
        data-testid="status-badge-pending"
        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
      >
        <Calendar className="w-3.5 h-3.5" />
        <span>Vence el día {bill.dueDay}</span>
      </span>
    );
  };

  return (
    <div
      data-testid={`recurring-bill-card-${bill.id}`}
      className={`group relative flex flex-col justify-between p-5 rounded-2xl border transition-all duration-200 ${
        isPaid
          ? 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/80 opacity-95'
          : bill.isOverdue
          ? 'bg-white dark:bg-slate-900 border-rose-300 dark:border-rose-900 shadow-sm shadow-rose-100 dark:shadow-none'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800/80 shadow-xs hover:shadow-md'
      }`}
    >
      <div>
        {/* Cabecera: Icono de categoría, datos principales y menú de acciones */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${categoryMeta.bgLight} ${categoryMeta.textLight} ${categoryMeta.bgDark} ${categoryMeta.textDark}`}
            >
              <CategoryIcon className="w-5 h-5" />
            </div>

            <div className="min-w-0">
              <h4
                className="font-bold text-slate-900 dark:text-white text-base leading-tight truncate"
                title={bill.name}
              >
                {bill.name}
              </h4>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {categoryMeta.label}
                </span>
                {bill.frequency !== 'MONTHLY' && (
                  <>
                    <span className="text-slate-300 dark:text-slate-700 text-xs">•</span>
                    <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      {BILL_FREQUENCIES[bill.frequency]}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Acciones de edición y eliminación */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => onEdit(bill)}
              aria-label={`Editar ${bill.name}`}
              className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setShowConfirmDelete(true)}
              aria-label={`Eliminar ${bill.name}`}
              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal/Prompt de confirmación de borrado inline */}
        {showConfirmDelete && (
          <div className="mb-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 animate-in fade-in duration-150">
            <p className="text-xs text-rose-800 dark:text-rose-200 font-medium mb-2">
              ¿Eliminar &quot;{bill.name}&quot; y su programación?
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowConfirmDelete(false)}
                disabled={isDeleting}
                className="px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-lg"
              >
                {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Eliminar'}
              </button>
            </div>
          </div>
        )}

        {/* Tipo de débito / PAT badge + Cuenta sugerida */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-md border ${
              isAutomatic
                ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900'
                : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
            }`}
          >
            {isAutomatic ? (
              <>
                <Zap className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                <span>PAT / Débito Automático</span>
              </>
            ) : (
              <>
                <CheckSquare className="w-3 h-3 text-slate-500" />
                <span>Pago Manual</span>
              </>
            )}
          </span>

          {bill.account && (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 rounded-md border border-slate-200 dark:border-slate-700/80 truncate max-w-[200px]"
              title={bill.account.name}
            >
              <Building2 className="w-3 h-3 shrink-0 text-slate-400" />
              <span className="truncate">{bill.account.name}</span>
            </span>
          )}
        </div>

        {/* Monto y Estado */}
        <div className="space-y-2 mb-4">
          <div>
            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500 block mb-0.5">
              Monto Estimado
            </span>
            {bill.currency === 'USD' ? (
              <CurrencyToggle
                amount={bill.amount}
                currency="USD"
                amountClassName="text-xl font-extrabold text-slate-900 dark:text-white"
              />
            ) : (
              <div className="text-xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
                {formatCurrency(bill.amount, bill.currency)}
              </div>
            )}
          </div>

          <div>{renderStatusBadge()}</div>
        </div>

        {/* Notas adicionales */}
        {bill.notes && (
          <p
            className="text-xs text-slate-500 dark:text-slate-400 italic line-clamp-1 mb-4"
            title={bill.notes}
          >
            &quot;{bill.notes}&quot;
          </p>
        )}
      </div>

      {/* Botón de Acción Principal */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 mt-auto">
        {isPaid ? (
          <div className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200/50 dark:border-emerald-800/40 cursor-default">
            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Al día este mes</span>
          </div>
        ) : (
          <button
            type="button"
            data-testid="mark-paid-button"
            onClick={() => onMarkPaid(bill)}
            className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-[0.98] ${
              isAutomatic
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200 dark:shadow-none'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200 dark:shadow-none'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {isAutomatic ? 'Registrar Cargo PAT' : 'Marcar como Pagado'}
            </span>
          </button>
        )}
      </div>
    </div>
  );
};
