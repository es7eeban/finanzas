import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { formatCurrency } from '../../../utils/currency';
import { Card } from '../../../components/common/Card';
import { BarChart3 } from 'lucide-react';
import type { MonthlyTrend, Currency } from '../../../types';

interface MonthlyTrendBarChartProps {
  data: MonthlyTrend[];
  currency: Currency;
}

export const MonthlyTrendBarChart: React.FC<MonthlyTrendBarChartProps> = ({
  data,
  currency,
}) => {
  const formatYAxis = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
    return `${val}`;
  };

  interface BarTooltipPayloadItem {
    name: string;
    value: number;
    color: string;
  }

  interface CustomBarTooltipProps {
    active?: boolean;
    payload?: BarTooltipPayloadItem[];
    label?: string;
  }

  const CustomTooltip: React.FC<CustomBarTooltipProps> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 text-white p-3 rounded-xl shadow-xl text-xs border border-slate-700 backdrop-blur-sm space-y-1.5 min-w-[160px]">
          <div className="font-bold text-slate-300 pb-1 border-b border-slate-800">
            Mes de {label}
          </div>
          {payload.map((entry: BarTooltipPayloadItem, index: number) => (
            <div key={`item-${index}`} className="flex justify-between items-center gap-3">
              <span className="flex items-center gap-1.5 font-medium" style={{ color: entry.color }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span>{entry.name}:</span>
              </span>
              <span className="font-bold tabular-nums">
                {formatCurrency(entry.value, currency)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="p-5 flex flex-col justify-between h-full" hoverEffect>
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Tendencia Comparativa (Últimos 6 Meses)
            </h3>
          </div>
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
            Ingresos vs Gastos vs Ahorro
          </span>
        </div>

        <div className="h-64 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              barGap={3}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#94a3b8"
                opacity={0.15}
              />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
              />
              <YAxis
                tickFormatter={formatYAxis}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={32}
                iconType="circle"
                wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                formatter={(value) => (
                  <span className="text-slate-600 dark:text-slate-400 font-medium">
                    {value}
                  </span>
                )}
              />
              <Bar
                name="Ingresos"
                dataKey="income"
                fill="#10B981"
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
              />
              <Bar
                name="Gastos"
                dataKey="expense"
                fill="#F43F5E"
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
              />
              <Bar
                name="Ahorro"
                dataKey="savings"
                fill="#14B8A6"
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  );
};
