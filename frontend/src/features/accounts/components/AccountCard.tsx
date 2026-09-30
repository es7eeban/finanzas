import React from 'react';
import type { AccountWithSavings } from '../hooks/useAccounts';
import { formatCurrency } from '../../../utils/currency';
import { CreditCard, Wallet, Landmark, PiggyBank, DollarSign } from 'lucide-react';

interface AccountCardProps {
  account: AccountWithSavings;
}

export const AccountCard: React.FC<AccountCardProps> = ({ account }) => {
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

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm"
            style={{ backgroundColor: account.color }}
          >
            {getIcon()}
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white leading-tight">
              {account.name}
            </h4>
            <span className="text-xs text-slate-400 capitalize">
              {account.type === 'CHECKING'
                ? 'Cuenta Corriente'
                : account.type === 'CREDIT_CARD'
                ? 'Tarjeta de Crédito'
                : account.type === 'SAVINGS'
                ? 'Cuenta de Ahorro'
                : 'Efectivo'}
            </span>
          </div>
        </div>

        <span
          className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${
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
          className={`text-2xl font-bold tabular-nums tracking-tight ${
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
        <div className="p-2.5 rounded-xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-100 dark:border-teal-900/50 space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-teal-700 dark:text-teal-300">Reservado en Metas:</span>
            <span className="font-semibold text-teal-800 dark:text-teal-200 tabular-nums">
              {formatCurrency(account.reservedInSavings, account.currency)}
            </span>
          </div>
          <div className="flex justify-between text-xs pt-1 border-t border-teal-200/50 dark:border-teal-800/40">
            <span className="text-teal-900 dark:text-teal-100 font-medium">Líquido Gastable:</span>
            <span className="font-bold text-teal-900 dark:text-teal-100 tabular-nums">
              {formatCurrency(account.availableBalance, account.currency)}
            </span>
          </div>
        </div>
      )}

      {isCreditCard && account.creditLimit && (
        <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex justify-between">
            <span>Límite de Crédito:</span>
            <span className="font-semibold tabular-nums text-slate-700 dark:text-slate-300">
              {formatCurrency(account.creditLimit, account.currency)}
            </span>
          </div>
          {account.paymentDueDay && (
            <div className="flex justify-between text-amber-600 dark:text-amber-400">
              <span>Día de Pago:</span>
              <span>Día {account.paymentDueDay} del mes</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
