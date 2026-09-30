import React, { useState } from 'react';
import type { AccountWithSavings } from '../hooks/useAccounts';
import { formatCurrency } from '../../../utils/currency';
import {
  CreditCard,
  Wallet,
  Landmark,
  PiggyBank,
  DollarSign,
  Power,
  CheckCircle2,
} from 'lucide-react';

interface AccountCardProps {
  account: AccountWithSavings;
  onToggleStatus?: (id: string) => Promise<unknown>;
}

export const AccountCard: React.FC<AccountCardProps> = ({ account, onToggleStatus }) => {
  const [isToggling, setIsToggling] = useState(false);
  const [toggleError, setToggleError] = useState<string | null>(null);

  const getIcon = () => {
    switch (account.type) {
      case 'CHECKING':
        return account.currency === 'USD' ? (
          <DollarSign className="w-5 h-5" />
        ) : (
          <Landmark className="w-5 h-5" />
        );
      case 'CREDIT_CARD':
        return <CreditCard className="w-5 h-5" />;
      case 'SAVINGS':
        return <PiggyBank className="w-5 h-5" />;
      case 'CASH':
      default:
        return <Wallet className="w-5 h-5" />;
    }
  };

  const isCreditCard = account.type === 'CREDIT_CARD';
  const isInactive = !account.isActive;

  const handleToggle = async () => {
    if (!onToggleStatus) return;
    setToggleError(null);
    setIsToggling(true);
    try {
      await onToggleStatus(account.id);
    } catch (err: unknown) {
      setToggleError(err instanceof Error ? err.message : 'Error al cambiar estado');
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div
      className={`p-5 rounded-3xl bg-white dark:bg-slate-900 border transition-all space-y-4 shadow-xs relative overflow-hidden ${
        isInactive
          ? 'border-slate-200/50 dark:border-slate-800/50 opacity-65 bg-slate-50/50 dark:bg-slate-900/40'
          : 'border-slate-200/80 dark:border-slate-800 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-sm transition-opacity ${
              isInactive ? 'opacity-50 grayscale' : ''
            }`}
            style={{ backgroundColor: account.color }}
          >
            {getIcon()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-slate-900 dark:text-white leading-tight text-sm">
                {account.name}
              </h4>
              {isInactive && (
                <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-md">
                  Cerrada
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
              {account.institution && (
                <span className="font-medium text-slate-600 dark:text-slate-300">
                  {account.institution}
                </span>
              )}
              {account.institution && account.accountNumber && <span>•</span>}
              {account.accountNumber && (
                <span className="tabular-nums font-mono text-[11px]">
                  •••• {account.accountNumber}
                </span>
              )}
              {!account.institution && !account.accountNumber && (
                <span className="capitalize">
                  {account.type === 'CHECKING'
                    ? 'Cuenta Corriente'
                    : account.type === 'CREDIT_CARD'
                    ? 'Tarjeta de Crédito'
                    : account.type === 'SAVINGS'
                    ? 'Cuenta de Ahorro'
                    : 'Efectivo'}
                </span>
              )}
            </div>
          </div>
        </div>

        <span
          className={`px-2 py-0.5 text-[11px] font-bold rounded-lg border ${
            account.currency === 'USD'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
              : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800'
          }`}
        >
          {account.currency}
        </span>
      </div>

      {/* Balance display */}
      <div>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {isCreditCard ? 'Saldo Utilizado' : 'Saldo Total en Cuenta'}
        </span>
        <div
          className={`text-2xl font-extrabold tabular-nums tracking-tight ${
            isCreditCard && account.balance < 0
              ? 'text-rose-600 dark:text-rose-400'
              : 'text-slate-900 dark:text-white'
          }`}
        >
          {formatCurrency(account.balance, account.currency)}
        </div>
      </div>

      {/* Breakdown for savings or credit cards */}
      {account.reservedInSavings > 0 && (
        <div className="p-2.5 rounded-2xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-100 dark:border-teal-900/50 space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-teal-700 dark:text-teal-300 font-medium">Reservado en Metas:</span>
            <span className="font-bold text-teal-800 dark:text-teal-200 tabular-nums">
              {formatCurrency(account.reservedInSavings, account.currency)}
            </span>
          </div>
          <div className="flex justify-between text-xs pt-1 border-t border-teal-200/50 dark:border-teal-800/40">
            <span className="text-teal-900 dark:text-teal-100 font-semibold">Líquido Gastable:</span>
            <span className="font-extrabold text-teal-900 dark:text-teal-100 tabular-nums">
              {formatCurrency(account.availableBalance, account.currency)}
            </span>
          </div>
        </div>
      )}

      {isCreditCard && account.creditLimit && (
        <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex justify-between">
            <span>Cupo de Crédito:</span>
            <span className="font-semibold tabular-nums text-slate-700 dark:text-slate-300">
              {formatCurrency(account.creditLimit, account.currency)}
            </span>
          </div>
          <div className="flex justify-between text-slate-400">
            {account.billingCloseDay && <span>Corte: Día {account.billingCloseDay}</span>}
            {account.paymentDueDay && (
              <span className="text-amber-600 dark:text-amber-400 font-medium">
                Pago: Día {account.paymentDueDay}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Error message on toggle */}
      {toggleError && (
        <div className="p-2 text-[11px] bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 rounded-xl border border-rose-200 dark:border-rose-800">
          {toggleError}
        </div>
      )}

      {/* Footer Actions: Activar / Desactivar */}
      {onToggleStatus && (
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={handleToggle}
            disabled={isToggling}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 ${
              isInactive
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
                : 'text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30'
            }`}
            title={isInactive ? 'Reactivar cuenta' : 'Desactivar o cerrar cuenta'}
          >
            {isInactive ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isToggling ? 'Activando...' : 'Reactivar'}</span>
              </>
            ) : (
              <>
                <Power className="w-3.5 h-3.5" />
                <span>{isToggling ? 'Procesando...' : 'Cerrar Cuenta'}</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
