import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../../store/authStore';
import { useAccounts } from '../../accounts/hooks/useAccounts';
import { api } from '../../../services/api';
import { formatCurrency } from '../../../utils/currency';
import { Card } from '../../../components/common/Card';
import { Badge } from '../../../components/common/Badge';
import {
  Wallet,
  PiggyBank,
  TrendingDown,
  ArrowUpRight,
  Plus,
  Landmark,
  Target,
  HandCoins,
  ChevronRight,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import type { SavingGoal, DebtLoan } from '../../../types';

export const DashboardPage = () => {
  const { user } = useAuthStore();
  const { accounts, refetch } = useAccounts();

  const [savings, setSavings] = useState<SavingGoal[]>([]);
  const [debts, setDebts] = useState<DebtLoan[]>([]);

  useEffect(() => {
    refetch(true);

    const loadExtraData = async () => {
      try {
        const [savingsRes, debtsRes] = await Promise.all([
          api.get('/savings'),
          api.get('/debts'),
        ]);
        setSavings(savingsRes.data);
        setDebts(debtsRes.data);
      } catch (e) {
        console.error('Error al cargar datos del dashboard', e);
      }
    };

    loadExtraData();
  }, [refetch]);

  const activeAccounts = accounts.filter((a) => a.isActive);

  // Cálculos en tiempo real
  const totalBalanceCLP = activeAccounts
    .filter((a) => a.currency === 'CLP' && a.type !== 'CREDIT_CARD')
    .reduce((sum, a) => sum + a.balance, 0);

  const totalReservedSavingsCLP = activeAccounts
    .filter((a) => a.currency === 'CLP')
    .reduce((sum, a) => sum + (a.reservedInSavings || 0), 0);

  const availableLiquidCLP = totalBalanceCLP - totalReservedSavingsCLP;

  // Total deudas por pagar (BORROWED)
  const totalDebtBorrowed = debts
    .filter((d) => d.type === 'BORROWED' && d.status !== 'PAID')
    .reduce((sum, d) => sum + d.pendingAmount, 0);

  // Total préstamos por cobrar (LENT)
  const totalLentPending = debts
    .filter((d) => d.type === 'LENT' && d.status !== 'PAID')
    .reduce((sum, d) => sum + d.pendingAmount, 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Saludo y Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Hola, {user?.fullName || 'Usuario'} 👋
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Aquí está el estado general de tus finanzas hoy.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/transactions?action=new_expense"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs shadow-md shadow-indigo-600/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Operación</span>
          </Link>
        </div>
      </div>

      {/* Grid de Métricas Principales (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Patrimonio Líquido Gastable */}
        <Card className="p-5 relative overflow-hidden" hoverEffect>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Patrimonio Disponible
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
              {formatCurrency(availableLiquidCLP, 'CLP')}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
              <span>Libre de fondos comprometidos</span>
            </div>
          </div>
        </Card>

        {/* KPI 2: Ahorros Comprometidos */}
        <Card className="p-5 relative overflow-hidden" hoverEffect>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Reservado en Metas
            </span>
            <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <PiggyBank className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-teal-600 dark:text-teal-400 tabular-nums">
              {formatCurrency(totalReservedSavingsCLP, 'CLP')}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              <Target className="w-3.5 h-3.5 text-teal-500" />
              <span>{savings.filter((s) => s.status === 'ACTIVE').length} metas activas</span>
            </div>
          </div>
        </Card>

        {/* KPI 3: Deudas por Pagar */}
        <Card className="p-5 relative overflow-hidden" hoverEffect>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Deudas por Pagar
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400 tabular-nums">
              {formatCurrency(totalDebtBorrowed, 'CLP')}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              <Clock className="w-3.5 h-3.5 text-rose-500" />
              <span>Compromisos pendientes</span>
            </div>
          </div>
        </Card>

        {/* KPI 4: Préstamos por Cobrar */}
        <Card className="p-5 relative overflow-hidden" hoverEffect>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Dinero por Cobrar
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <HandCoins className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 tabular-nums">
              {formatCurrency(totalLentPending, 'CLP')}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
              <span>Préstamos otorgados P2P</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Secciones de Contenido: Cuentas y Metas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda (2 spans): Cuentas Bancarias */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Landmark className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Tus Cuentas Bancarias
              </h3>
            </div>
            <Link
              to="/accounts"
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <span>Ver todas ({activeAccounts.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {activeAccounts.slice(0, 4).map((acc) => (
              <Card key={acc.id} className="p-4 flex flex-col justify-between" hoverEffect>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                      {acc.name}
                    </span>
                    <Badge variant={acc.currency === 'USD' ? 'indigo' : 'slate'} size="sm">
                      {acc.currency}
                    </Badge>
                  </div>
                  <div className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">
                    {formatCurrency(acc.balance, acc.currency)}
                  </div>
                </div>

                {acc.reservedInSavings ? (
                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex justify-between text-[11px]">
                    <span className="text-slate-400">Libre:</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {formatCurrency(acc.availableBalance || 0, acc.currency)}
                    </span>
                  </div>
                ) : null}
              </Card>
            ))}
          </div>
        </div>

        {/* Columna Derecha (1 span): Metas Prioritarias */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Metas de Ahorro
              </h3>
            </div>
            <Link
              to="/savings"
              className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
            >
              <span>Ver metas</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {savings.length === 0 ? (
              <Card className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                <Target className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                <p>Aún no has creado metas de ahorro.</p>
                <Link
                  to="/savings"
                  className="mt-2 inline-block text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline"
                >
                  + Crear primera meta
                </Link>
              </Card>
            ) : (
              savings.slice(0, 3).map((goal) => (
                <Card key={goal.id} className="p-3.5" hoverEffect>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                      {goal.name}
                    </span>
                    <Badge variant={goal.status === 'COMPLETED' ? 'emerald' : 'teal'}>
                      {goal.progressPercentage || 0}%
                    </Badge>
                  </div>

                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden my-2">
                    <div
                      className="bg-gradient-to-r from-teal-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, goal.progressPercentage || 0)}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                    <span>{formatCurrency(goal.currentAmount, 'CLP')}</span>
                    <span>de {formatCurrency(goal.targetAmount, 'CLP')}</span>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
