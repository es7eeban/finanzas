import React from 'react';
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
} from 'lucide-react';
import type { UpcomingDueItem, Currency } from '../../../types';

interface UpcomingDuesWidgetProps {
  items: UpcomingDueItem[];
  currency: Currency;
}

export const UpcomingDuesWidget: React.FC<UpcomingDuesWidgetProps> = ({
  items,
  currency,
}) => {
  const getUrgencyBadge = (item: UpcomingDueItem) => {
    switch (item.urgency) {
      case 'overdue':
        return <Badge variant="rose">Vencida</Badge>;
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

  return (
    <Card className="p-5 flex flex-col justify-between" hoverEffect>
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-indigo-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Próximos Compromisos
            </h3>
          </div>
          <Link
            to="/debts"
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            <span>Ver deudas</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {items.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <p className="font-semibold text-slate-600 dark:text-slate-300">
              ¡Todo al día!
            </p>
            <p className="mt-0.5">No tienes deudas ni vencimientos en los próximos 15 días.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {items.slice(0, 4).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700/60 flex items-center justify-center shrink-0 shadow-2xs">
                    {getItemIcon(item.category)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {item.title}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {new Date(item.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {item.amount !== undefined && item.amount > 0 && (
                    <span className="text-xs font-bold text-slate-900 dark:text-white tabular-nums">
                      {formatCurrency(item.amount, currency)}
                    </span>
                  )}
                  {getUrgencyBadge(item)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {items.length > 4 && (
        <div className="pt-2 text-center text-[11px] text-slate-400">
          + {items.length - 4} compromisos adicionales
        </div>
      )}
    </Card>
  );
};
