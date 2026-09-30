import { useThemeStore } from './store/themeStore';
import { formatCurrency } from './utils/currency';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Target,
  Users,
  Sun,
  Moon,
  PlusCircle,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';

export default function App() {
  const { isDark, toggleTheme } = useThemeStore();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-teal-500 flex items-center justify-center text-white shadow-md">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Finanzas Personales</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Control Inteligente & Metas de Ahorro</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Cambiar tema"
          >
            {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm shadow-sm transition-all">
            <PlusCircle className="w-4 h-4" />
            <span>Nuevo Movimiento</span>
          </button>
        </div>
      </header>

      {/* Main Content Preview */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Patrimonio Neto</span>
              <Wallet className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
              {formatCurrency(3450000, 'CLP')}
            </div>
            <div className="text-xs text-emerald-500 flex items-center gap-1 mt-1 font-medium">
              <ArrowUpRight className="w-3.5 h-3.5" /> +12.4% este mes
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Ingresos del Mes</span>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
              {formatCurrency(1800000, 'CLP')}
            </div>
            <span className="text-xs text-slate-400">Sueldo & honorarios</span>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Gastos del Mes</span>
              <TrendingDown className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-2xl font-bold tabular-nums text-rose-600 dark:text-rose-400">
              {formatCurrency(920000, 'CLP')}
            </div>
            <span className="text-xs text-slate-400">51% del ingreso</span>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Metas de Ahorro</span>
              <Target className="w-4 h-4 text-teal-500" />
            </div>
            <div className="text-2xl font-bold tabular-nums text-teal-600 dark:text-teal-400">
              {formatCurrency(650000, 'CLP')}
            </div>
            <span className="text-xs text-teal-500 font-medium">Viaje a Brasil (32.5%)</span>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card: Meta de Ahorro Destacada */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🌴</span>
                <h3 className="font-semibold text-slate-900 dark:text-white">Viaje a Brasil</h3>
              </div>
              <span className="px-2.5 py-1 text-xs font-medium bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 rounded-full border border-teal-200 dark:border-teal-800">
                En curso
              </span>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-slate-500 dark:text-slate-400">Acumulado</span>
                <span className="font-semibold tabular-nums">
                  {formatCurrency(650000, 'CLP')} / {formatCurrency(2000000, 'CLP')}
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-teal-500 to-emerald-500 h-full rounded-full w-[32.5%] transition-all duration-500"></div>
              </div>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <span>Cuenta: Banco Estado Ahorro</span>
              <span className="font-medium text-teal-600 dark:text-teal-400">Ritmo: $112.500/mes</span>
            </div>
          </div>

          {/* Card: Cuenta en Dólares */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">💵</span>
                <h3 className="font-semibold text-slate-900 dark:text-white">Cuenta Dólares (USD)</h3>
              </div>
              <span className="px-2.5 py-1 text-xs font-medium bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-full border border-indigo-200 dark:border-indigo-800">
                USD
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400">Saldo Disponible</span>
              <div className="text-3xl font-bold tabular-nums text-slate-900 dark:text-white mt-1">
                {formatCurrency(1450.5, 'USD')}
              </div>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between">
              <span>Bimoneda Activa</span>
              <span className="text-emerald-500 font-medium">Activa</span>
            </div>
          </div>

          {/* Card: Deudas P2P */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-500" />
                <h3 className="font-semibold text-slate-900 dark:text-white">Préstamos & Deudas</h3>
              </div>
              <span className="px-2.5 py-1 text-xs font-medium bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-full border border-amber-200 dark:border-amber-800">
                1 por cobrar
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Préstamo a Carlos M.</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  +{formatCurrency(50000, 'CLP')}
                </span>
              </div>
              <div className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                ⏱️ Vence en 5 días (15 Octubre)
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-500" /> Aislamiento seguro multiusuario
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-4 px-6 text-center text-xs text-slate-400">
        Plataforma de Finanzas Personales • Fase 0 Completada con Éxito
      </footer>
    </div>
  );
}
