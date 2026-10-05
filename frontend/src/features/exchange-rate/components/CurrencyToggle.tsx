import React, { useState } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import type { Currency } from '../../../types';
import { formatCurrency } from '../../../utils/currency';
import { useExchangeRate } from '../hooks/useExchangeRate';

export interface CurrencyToggleProps {
  amount: number;
  currency: Currency;
  rate?: number;
  source?: string;
  className?: string;
  amountClassName?: string;
  size?: 'sm' | 'md' | 'lg';
  showBadge?: boolean;
}

export const CurrencyToggle: React.FC<CurrencyToggleProps> = ({
  amount,
  currency,
  rate: propRate,
  source: propSource,
  className = '',
  amountClassName = '',
  size = 'md',
  showBadge = true,
}) => {
  const [isConverted, setIsConverted] = useState(false);
  const { rate: hookRate, exchangeRateData } = useExchangeRate();

  const currentRate = propRate ?? hookRate;
  const currentSource = propSource ?? exchangeRateData?.source ?? 'mindicador.cl';

  const targetCurrency: Currency = currency === 'USD' ? 'CLP' : 'USD';

  const convertedAmount =
    currency === 'USD'
      ? Math.round(amount * currentRate)
      : Number((amount / currentRate).toFixed(2));

  const displayAmount = isConverted ? convertedAmount : amount;
  const displayCurrency = isConverted ? targetCurrency : currency;

  const formattedRate = new Intl.NumberFormat('es-CL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(currentRate);

  const sizeClasses = {
    sm: {
      text: 'text-lg font-bold',
      button: 'px-2 py-0.5 text-[10px]',
      icon: 'w-3 h-3',
      badge: 'text-[10px]',
    },
    md: {
      text: 'text-2xl font-extrabold',
      button: 'px-2.5 py-1 text-xs',
      icon: 'w-3.5 h-3.5',
      badge: 'text-[11px]',
    },
    lg: {
      text: 'text-3xl sm:text-4xl font-black',
      button: 'px-3 py-1.5 text-xs',
      icon: 'w-4 h-4',
      badge: 'text-xs',
    },
  }[size];

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex items-center gap-2.5 flex-wrap">
        <span
          data-testid="currency-toggle-amount"
          className={`tabular-nums tracking-tight text-slate-900 dark:text-white ${sizeClasses.text} ${amountClassName}`}
        >
          {formatCurrency(displayAmount, displayCurrency)}
        </span>

        <button
          type="button"
          onClick={() => setIsConverted((prev) => !prev)}
          title={`Alternar visualización a ${isConverted ? currency : targetCurrency}`}
          className={`inline-flex items-center gap-1.5 rounded-full font-semibold border transition-all active:scale-95 cursor-pointer shadow-2xs ${sizeClasses.button} ${
            isConverted
              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <ArrowLeftRight className={sizeClasses.icon} />
          <span>{isConverted ? `Ver en ${currency}` : `Ver en ${targetCurrency}`}</span>
        </button>
      </div>

      {showBadge && isConverted && (
        <div
          data-testid="currency-toggle-badge"
          className={`text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1 animate-in fade-in duration-150 ${sizeClasses.badge}`}
        >
          <span>(Tasa: ${formattedRate} {currentSource})</span>
        </div>
      )}
    </div>
  );
};
