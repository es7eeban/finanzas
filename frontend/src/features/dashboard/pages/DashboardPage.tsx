import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../../store/authStore';
import { useAccounts } from '../../accounts/hooks/useAccounts';
import { api } from '../../../services/api';
import { formatCurrency } from '../../../utils/currency';
import { Card } from '../../../components/common/Card';
import { Badge } from '../../../components/common/Badge';
import { ExpensesDonutChart } from '../components/ExpensesDonutChart';
import { MonthlyTrendBarChart } from '../components/MonthlyTrendBarChart';
import { UpcomingDuesWidget } from '../components/UpcomingDuesWidget';
import {
  DashboardKpiSkeleton,
  DashboardChartsSkeleton,
} from '../components/DashboardSkeletons';
import {
  Wallet,
  PiggyBank,
  TrendingDown,
  ArrowUpRight,
  Plus,
  Landmark,
  Target,
  ChevronRight,
  ShieldCheck,
  Percent,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import type { DashboardData } from '../../../types';

export const DashboardPage = () => {
  const { user } = useAuthStore();
  const { accounts, refetch: refetchAccounts } = useAccounts();

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchDashboard = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const { data } = await api.get<DashboardData>('/dashboard/summary');
      setDashboardData(data);
    } catch (err: unknown) {
      console.error('Error al cargar datos del dashboard', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    refetchAccounts(true);
  }, [fetchDashboard, refetchAccounts]);

  const activeAccounts = accounts.filter((a) => a.isActive);
  const currency = dashboardData?.kpis.currency || 'CLP';
  const kpis = dashboardData?.kpis;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Saludo y Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Hola, {user?.fullName || 'Usuario'} 👋
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Aquí está el balance y analítica de tus finanzas hoy.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {kpis?.usdToClpRate && (
            <div
              title="Tipo de cambio oficial en vivo (mindicador.cl)"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                USD: $
                {new Intl.NumberFormat('es-CL', {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 2,
                }).format(kpis.usdToClpRate)}
              </span>
            </div>
          )}

          <button
            onClick={() => {
              fetchDashboard(true);
              refetchAccounts(true);
            }}
            title="Actualizar datos"
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-white dark:bg-slate-900 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <Link
            to="/transactions?action=new_expense"
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Operación</span>
          </Link>
        </div>
      </div>

      {/* Banner de Alerta de Vencimientos Críticos (Fase 2.5) */}
      {!loading && dashboardData && (() => {
        const urgentDues = dashboardData.upcomingDues.filter(
          (d) => d.urgency === 'overdue' || d.urgency === 'today',
        );
        if (urgentDues.length === 0) return null;

        const overdueCount = urgentDues.filter((d) => d.urgency === 'overdue').length;
        const todayCount = urgentDues.filter((d) => d.urgency === 'today').length;
        const totalAmount = urgentDues.reduce((sum, d) => sum + (d.amount || 0), 0);

        return (
          <div
            data-testid="urgent-dues-banner"
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-transparent border border-rose-200 dark:border-rose-900/60 animate-in fade-in duration-200 shadow-xs"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Atención con tus próximos pagos
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                  Tienes{' '}
                  {overdueCount > 0 && (
                    <strong className="text-rose-600 dark:text-rose-400 font-semibold">
                      {overdueCount} compromiso{overdueCount > 1 ? 's' : ''} vencido{overdueCount > 1 ? 's' : ''}
                    </strong>
                  )}
                  {overdueCount > 0 && todayCount > 0 && ' y '}
                  {todayCount > 0 && (
                    <strong className="text-amber-600 dark:text-amber-400 font-semibold">
                      {todayCount} por vencer hoy
                    </strong>
                  )}{' '}
                  {totalAmount > 0 && (
                    <span>
                      por un total de <span className="font-bold tabular-nums">{formatCurrency(totalAmount, currency)}</span>
                    </span>
                  )}
                  .
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <Link
                to="/recurring"
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 active:scale-95 transition-all"
              >
                Revisar Gastos Fijos
              </Link>
            </div>
          </div>
        );
      })()}

      {/* Grid de Métricas Principales (KPIs) */}
      {loading || !kpis ? (
        <DashboardKpiSkeleton />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* KPI 1: Patrimonio Líquido Gastable */}
          <Card className="p-5 relative overflow-hidden" hoverEffect>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Patrimonio Líquido
              </span>
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
                {formatCurrency(kpis.liquidAvailable, currency)}
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
                {formatCurrency(kpis.reservedInSavings, currency)}
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                <Target className="w-3.5 h-3.5 text-teal-500" />
                <span>{kpis.activeGoalsCount} metas activas</span>
              </div>
            </div>
          </Card>

          {/* KPI 3: Flujo del Mes (Ingresos vs Egresos) */}
          <Card className="p-5 relative overflow-hidden" hoverEffect>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Egresos del Mes
              </span>
              <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <TrendingDown className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400 tabular-nums">
                {formatCurrency(kpis.currentMonthExpense, currency)}
              </div>
              <div className="flex items-center justify-between gap-1.5 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                <span>Ingresos:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  +{formatCurrency(kpis.currentMonthIncome, currency)}
                </span>
              </div>
            </div>
          </Card>

          {/* KPI 4: Tasa de Ahorro Mensual */}
          <Card className="p-5 relative overflow-hidden" hoverEffect>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Tasa de Ahorro
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Percent className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {kpis.savingsRate}%
                </span>
                <span className="text-xs text-slate-400">este mes</span>
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
                <span>Aportado: {formatCurrency(kpis.currentMonthSavings, currency)}</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ============================================================== */}
      {/* 📊 SECCIÓN DE GRÁFICOS ANALÍTICOS (RECHARTS)                    */}
      {/* ============================================================== */}
      {loading || !dashboardData ? (
        <DashboardChartsSkeleton />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Donut Chart: Gastos por Categoría (5 columnas) */}
          <div className="lg:col-span-5">
            <ExpensesDonutChart
              categories={dashboardData.expensesByCategory.categories}
              totalExpenses={dashboardData.expensesByCategory.totalExpenses}
              currency={currency}
            />
          </div>

          {/* Bar Chart: Tendencia 6 Meses (7 columnas) */}
          <div className="lg:col-span-7">
            <MonthlyTrendBarChart
              data={dashboardData.historicalTrend}
              currency={currency}
            />
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 💳 SECCIONES INFERIORES: Cuentas, Metas y Vencimientos        */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna 1: Cuentas Bancarias */}
        <div className="space-y-4">
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

          <div className="space-y-3">
            {activeAccounts.slice(0, 3).map((acc) => (
              <Card key={acc.id} className="p-3.5 flex flex-col justify-between" hoverEffect>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                      {acc.name}
                    </span>
                    <Badge variant={acc.currency === 'USD' ? 'indigo' : 'slate'} size="sm">
                      {acc.currency}
                    </Badge>
                  </div>
                  <div className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">
                    {formatCurrency(acc.balance, acc.currency)}
                  </div>
                </div>

                {acc.reservedInSavings ? (
                  <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between text-[11px]">
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

        {/* Columna 2: Metas de Ahorro Prioritarias */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Metas Prioritarias
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
            {!dashboardData || dashboardData.priorityGoals.length === 0 ? (
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
              dashboardData.priorityGoals.map((goal) => (
                <Card key={goal.id} className="p-3.5" hoverEffect>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
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
                    <span>{formatCurrency(goal.currentAmount, currency)}</span>
                    <span>de {formatCurrency(goal.targetAmount, currency)}</span>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Columna 3: Próximos Vencimientos y Compromisos */}
        <div className="space-y-4">
          <UpcomingDuesWidget
            items={dashboardData?.upcomingDues || []}
            currency={currency}
          />
        </div>
      </div>
    </div>
  );
};
