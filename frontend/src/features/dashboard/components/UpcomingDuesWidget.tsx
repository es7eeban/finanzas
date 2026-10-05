import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../../components/common/Card';
import { Badge } from '../../../components/common/Badge';
import { formatCurrency } from '../../../utils/currency';
import {
  CalendarClock,
  ChevronRight,
  CreditCard,
  HandCoins,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  Zap,
  Receipt,
  AlertCircle,
} from 'lucide-react';
import type { UpcomingDueItem, Currency } from '../../../types';

interface UpcomingDuesWidgetProps {
  items: UpcomingDueItem[];
  currency: Currency;
}

type DuesFilter = 'ALL' | 'RECURRING' | 'DEBTS' | 'CARDS';

export const UpcomingDuesWidget: React.FC<UpcomingDuesWidgetProps> = ({
  items,
  currency,
}) => {
  const [filter, setFilter] = useState<DuesFilter>('ALL');

  const overdueCount = items.filter((i) => i.urgency === 'overdue').length;
  const recurringCount = items.filter(
    (i) => i.category === 'RECURRING_BILL' || i.category === 'RECURRING_AUTOMATIC',
  ).length;
  const debtsCount = items.filter(
    (i) => i.category === 'DEBT_PAYABLE' || i.category === 'DEBT_RECEIVABLE',
  ).length;
  const cardsCount = items.filter(
    (i) => i.category === 'CREDIT_CARD_DUE' || i.category === 'CREDIT_CARD_CUTOFF',
  ).length;

  const filteredItems = items.filter((item) => {
    if (filter === 'RECURRING') {
      return item.category === 'RECURRING_BILL' || item.category === 'RECURRING_AUTOMATIC';
    }
    if (filter === 'DEBTS') {
      return item.category === 'DEBT_PAYABLE' || item.category === 'DEBT_RECEIVABLE';
    }
    if (filter === 'CARDS') {
      return item.category === 'CREDIT_CARD_DUE' || item.category === 'CREDIT_CARD_CUTOFF';
    }
    return true;
  });

  const getUrgencyBadge = (item: UpcomingDueItem) => {
    switch (item.urgency) {
      case 'overdue': {
        const days = Math.abs(item.daysRemaining);
        return (
          <Badge variant="rose">
            Vencida{days > 0 ? ` (${days}d)` : ''}
          </Badge>
        );
      }
      case 'today':
        return <Badge variant="amber">Vence Hoy</Badge>;
      case 'urgent':
        return <Badge variant="amber">{item.daysRemaining} días</Badge>;
      case 'upcoming':
      default:
        return <Badge variant="slate">{item.daysRemaining} días</Badge>;
    }
  };

  const getItemIcon = (category: UpcomingDueItem['category']) => {
    switch (category) {
      case 'RECURRING_AUTOMATIC':
        return <Zap className="w-4 h-4 text-blue-500" />;
      case 'RECURRING_BILL':
        return <Receipt className="w-4 h-4 text-amber-500" />;
      case 'CREDIT_CARD_DUE':
        return <CreditCard className="w-4 h-4 text-rose-500" />;
      case 'CREDIT_CARD_CUTOFF':
        return <CalendarClock className="w-4 h-4 text-indigo-500" />;
      case 'DEBT_PAYABLE':
        return <ArrowDownLeft className="w-4 h-4 text-rose-500" />;
      case 'DEBT_RECEIVABLE':
        return <ArrowUpRight className="w-4 h-4 text-emerald-500" />;
      default:
        return <HandCoins className="w-4 h-4 text-slate-500" />;
    }
  };

  const getItemLink = (category: UpcomingDueItem['category']) => {
    switch (category) {
      case 'RECURRING_BILL':
      case 'RECURRING_AUTOMATIC':
        return '/recurring';
      case 'CREDIT_CARD_DUE':
      case 'CREDIT_CARD_CUTOFF':
        return '/accounts';
      case 'DEBT_PAYABLE':
      case 'DEBT_RECEIVABLE':
      default:
        return '/debts';
    }
  };

  const getHeaderLink = () => {
    if (filter === 'RECURRING') return { path: '/recurring', label: 'Ver gastos fijos' };
    if (filter === 'CARDS') return { path: '/accounts', label: 'Ver tarjetas' };
    return { path: '/recurring', label: 'Ver gastos fijos' };
  };

  const headerLink = getHeaderLink();

  return (
    <Card className="p-5 flex flex-col justify-between" hoverEffect>
      <div>
        {/* Cabecera del Widget con Alerta y Enlace */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-indigo-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Próximos Compromisos
            </h3>
            {overdueCount > 0 && (
              <span
                data-testid="overdue-counter-badge"
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 animate-pulse"
              >
                <AlertCircle className="w-3 h-3" />
                {overdueCount} vencido{overdueCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <Link
            to={headerLink.path}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            <span>{headerLink.label}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Pestañas de filtrado rápido si hay compromisos */}
        {items.length > 0 && (recurringCount > 0 || debtsCount > 0 || cardsCount > 0) && (
          <div className="flex items-center gap-1 pb-3 mb-3 border-b border-slate-100 dark:border-slate-800/80 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors shrink-0 ${
                filter === 'ALL'
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Todos ({items.length})
            </button>
            {recurringCount > 0 && (
              <button
                type="button"
                onClick={() => setFilter('RECURRING')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors shrink-0 ${
                  filter === 'RECURRING'
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Servicios ({recurringCount})
              </button>
            )}
            {debtsCount > 0 && (
              <button
                type="button"
                onClick={() => setFilter('DEBTS')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors shrink-0 ${
                  filter === 'DEBTS'
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Deudas ({debtsCount})
              </button>
            )}
            {cardsCount > 0 && (
              <button
                type="button"
                onClick={() => setFilter('CARDS')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors shrink-0 ${
                  filter === 'CARDS'
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Tarjetas ({cardsCount})
              </button>
            )}
          </div>
        )}

        {/* Estado Vacío */}
        {filteredItems.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <p className="font-semibold text-slate-600 dark:text-slate-300">
              ¡Todo al día!
            </p>
            <p className="mt-0.5">
              {filter === 'ALL'
                ? 'No tienes deudas, servicios ni vencimientos pendientes en este ciclo.'
                : 'No hay compromisos pendientes en esta categoría.'}
            </p>
          </div>
        ) : (
          /* Lista de Compromisos */
          <div className="space-y-2">
            {filteredItems.slice(0, 5).map((item) => (
              <Link
                key={item.id}
                to={getItemLink(item.category)}
                className={`group flex items-center justify-between p-2.5 rounded-xl border transition-all hover:scale-[1.01] active:scale-[0.99] ${
                  item.urgency === 'overdue'
                    ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60 hover:border-rose-300'
                    : item.urgency === 'today'
                    ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60 hover:border-amber-300'
                    : 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-2xs ${
                      item.urgency === 'overdue'
                        ? 'bg-rose-100 dark:bg-rose-900/50'
                        : 'bg-white dark:bg-slate-700/60'
                    }`}
                  >
                    {getItemIcon(item.category)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {item.title}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {new Date(item.dueDate).toLocaleDateString('es-CL', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {item.amount !== undefined && item.amount > 0 && (
                    <span className="text-xs font-bold text-slate-900 dark:text-white tabular-nums">
                      {formatCurrency(item.amount, item.currency || currency)}
                    </span>
                  )}
                  {getUrgencyBadge(item)}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {filteredItems.length > 5 && (
        <div className="pt-2 text-center text-[11px] text-slate-400">
          + {filteredItems.length - 5} compromisos adicionales
        </div>
      )}
    </Card>
  );
};
