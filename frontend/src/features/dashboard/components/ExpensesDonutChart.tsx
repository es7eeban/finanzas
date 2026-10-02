import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatCurrency } from '../../../utils/currency';
import { Card } from '../../../components/common/Card';
import { PieChart as PieIcon, ShoppingBag } from 'lucide-react';
import type { CategoryExpense, Currency } from '../../../types';

interface ExpensesDonutChartProps {
  categories: CategoryExpense[];
  totalExpenses: number;
  currency: Currency;
  monthLabel?: string;
}

export const ExpensesDonutChart: React.FC<ExpensesDonutChartProps> = ({
  categories,
  totalExpenses,
  currency,
  monthLabel = 'Este Mes',
}) => {
  if (!categories || categories.length === 0 || totalExpenses === 0) {
    return (
      <Card className="p-5 flex flex-col justify-between h-full">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-rose-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Gastos por Categoría
            </h3>
          </div>
          <span className="text-[11px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
            {monthLabel}
          </span>
        </div>

        <div className="py-12 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Sin gastos registrados
          </p>
          <p className="text-xs text-slate-400 max-w-xs mt-1">
            Los gastos categorizados de este periodo se reflejarán en este gráfico circular.
          </p>
        </div>
      </Card>
    );
  }

  // Preparamos datos para Recharts
  const data = categories.map((cat) => ({
    name: cat.name,
    value: cat.amount,
    color: cat.color || '#6366F1',
    percentage: cat.percentage,
  }));

  interface DonutTooltipPayloadItem {
    payload: {
      name: string;
      value: number;
      color: string;
      percentage: number;
    };
  }

  interface CustomDonutTooltipProps {
    active?: boolean;
    payload?: DonutTooltipPayloadItem[];
  }

  const CustomTooltip: React.FC<CustomDonutTooltipProps> = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-slate-900/95 text-white p-2.5 rounded-xl shadow-xl text-xs border border-slate-700 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="font-semibold">{item.name}</span>
          </div>
          <div className="text-slate-200 tabular-nums">
            {formatCurrency(item.value, currency)}
            <span className="text-slate-400 ml-1.5 font-bold">({item.percentage}%)</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="p-5 flex flex-col justify-between h-full" hoverEffect>
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-rose-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Gastos por Categoría
            </h3>
          </div>
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
            {monthLabel}
          </span>
        </div>

        {/* Gráfico Donut */}
        <div className="relative h-56 w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={88}
                paddingAngle={3}
                dataKey="value"
                stroke="transparent"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Texto Central */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              Total Egresos
            </span>
            <span className="text-sm font-extrabold text-slate-900 dark:text-white tabular-nums">
              {formatCurrency(totalExpenses, currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Leyenda interactiva con porcentajes */}
      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2 max-h-40 overflow-y-auto">
        {categories.slice(0, 5).map((cat) => (
          <div
            key={cat.name}
            className="flex items-center justify-between text-xs py-0.5 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 px-1 rounded-md transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: cat.color }}
              />
              <span className="text-slate-700 dark:text-slate-300 font-medium truncate">
                {cat.name}
              </span>
            </div>
            <div className="flex items-center gap-2 tabular-nums shrink-0">
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {formatCurrency(cat.amount, currency)}
              </span>
              <span className="text-[11px] font-semibold text-slate-400 w-8 text-right">
                {cat.percentage}%
              </span>
            </div>
          </div>
        ))}
        {categories.length > 5 && (
          <p className="text-[10px] text-slate-400 text-center pt-1">
            + {categories.length - 5} categorías adicionales
          </p>
        )}
      </div>
    </Card>
  );
};
