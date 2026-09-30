import { useEffect, useState } from 'react';
import { useThemeStore } from './store/themeStore';
import { useAuthStore } from './store/authStore';
import { useAccounts } from './features/accounts/hooks/useAccounts';
import { AccountCard } from './features/accounts/components/AccountCard';
import { CreateAccountModal } from './features/accounts/components/CreateAccountModal';
import { AuthModal } from './features/auth/components/AuthModal';
import { formatCurrency } from './utils/currency';
import {
  Wallet,
  Target,
  Sun,
  Moon,
  PlusCircle,
  ArrowUpRight,
  LogIn,
  LogOut,
  Landmark,
  CreditCard,
  RefreshCw,
} from 'lucide-react';

export default function App() {
  const { isDark, toggleTheme } = useThemeStore();
  const { user, token, checkAuth, logout } = useAuthStore();
  const { accounts, loading, refetch, createAccount } = useAccounts();

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCreateAccountOpen, setIsCreateAccountOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'accounts'>('dashboard');

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Si hay token o cambia el usuario, refrescar cuentas
  useEffect(() => {
    if (token) {
      refetch();
    }
  }, [token, refetch]);

  // Totales calculados en tiempo real desde las cuentas reales
  const totalBalanceCLP = accounts
    .filter((a) => a.currency === 'CLP' && a.type !== 'CREDIT_CARD')
    .reduce((sum, a) => sum + a.balance, 0);

  const totalReservedCLP = accounts
    .filter((a) => a.currency === 'CLP')
    .reduce((sum, a) => sum + (a.reservedInSavings || 0), 0);

  const totalUSD = accounts
    .filter((a) => a.currency === 'USD')
    .reduce((sum, a) => sum + a.balance, 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight">Finanzas Personales</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {user ? `Hola, ${user.fullName}` : 'Control Inteligente & Metas de Ahorro'}
            </p>
          </div>
        </div>

        {/* Navigation tabs */}
        <div className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'dashboard'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('accounts')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'accounts'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Cuentas ({accounts.length})
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            title="Cambiar tema claro/oscuro"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {user ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsCreateAccountOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs shadow-sm transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Nueva Cuenta</span>
              </button>
              <button
                onClick={logout}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-500 border border-slate-200 dark:border-slate-800 transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition-all"
            >
              <LogIn className="w-4 h-4" />
              <span>Iniciar Sesión (Demo)</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {/* Banner if not logged in */}
        {!user && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-teal-500/10 border border-indigo-200/60 dark:border-indigo-900/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                <Landmark className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Conexión con PostgreSQL Activa
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Inicia sesión con la cuenta de prueba (`demo@finanzas.com`) para ver tus cuentas reales en vivo.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-indigo-600 text-white shadow-sm hover:bg-indigo-700"
            >
              Acceder Ahora
            </button>
          </div>
        )}

        {/* Top KPI Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Líquido Gastable (CLP)</span>
              <Wallet className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
              {formatCurrency(totalBalanceCLP - totalReservedCLP, 'CLP')}
            </div>
            <div className="text-xs text-emerald-500 flex items-center gap-1 mt-1 font-medium">
              <ArrowUpRight className="w-3.5 h-3.5" /> Libre de metas
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Ahorro en Metas (CLP)</span>
              <Target className="w-4 h-4 text-teal-500" />
            </div>
            <div className="text-2xl font-bold tabular-nums text-teal-600 dark:text-teal-400">
              {formatCurrency(totalReservedCLP, 'CLP')}
            </div>
            <span className="text-xs text-slate-400">Protegido en alcancías</span>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Saldo en Dólares (USD)</span>
              <Landmark className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
              {formatCurrency(totalUSD, 'USD')}
            </div>
            <span className="text-xs text-slate-400">Cuentas internacionales</span>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Cuentas Activas</span>
              <CreditCard className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
              {accounts.length}
            </div>
            <span className="text-xs text-slate-400">Banco, Ahorro, TC y Cash</span>
          </div>
        </div>

        {/* Accounts Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Mis Métodos de Pago y Cuentas</span>
                <button
                  onClick={() => refetch()}
                  className="p-1 text-slate-400 hover:text-indigo-500 transition-colors"
                  title="Recargar"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </h2>
              <p className="text-xs text-slate-500">
                Balances sincronizados en vivo con PostgreSQL (Fase 1 completada)
              </p>
            </div>

            {user && (
              <button
                onClick={() => setIsCreateAccountOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Agregar Cuenta</span>
              </button>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-44 rounded-2xl bg-slate-200/60 dark:bg-slate-800/50 animate-pulse"
                />
              ))}
            </div>
          ) : accounts.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <p className="text-sm text-slate-400">
                {user
                  ? 'No tienes cuentas creadas aún. ¡Crea la primera!'
                  : 'Inicia sesión para visualizar tus cuentas.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {accounts.map((account) => (
                <AccountCard key={account.id} account={account} />
              ))}
            </div>
          )}
        </section>

        {/* Feature Highlights: Saving Goal Spotlight (Viaje a Brasil) */}
        <section className="p-6 rounded-3xl bg-gradient-to-br from-teal-500/10 via-emerald-500/5 to-transparent border border-teal-200/60 dark:border-teal-900/40 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🌴</span>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">
                  Meta Destacada: Viaje a Brasil
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Asociada a: <span className="font-semibold text-teal-600 dark:text-teal-400">Bolsillo Ahorro Banco Estado</span>
                </p>
              </div>
            </div>
            <span className="px-3 py-1 text-xs font-bold bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 rounded-full">
              Meta: $2.000.000 CLP
            </span>
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold mb-1.5">
              <span className="text-slate-500">Progreso Actual: {formatCurrency(650000, 'CLP')}</span>
              <span className="text-teal-600 dark:text-teal-400">32.5% alcanzado</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-teal-500 to-emerald-500 h-full rounded-full w-[32.5%]"></div>
            </div>
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between pt-1">
            <span>⏱️ Ritmo sugerido: $112.500 / mes</span>
            <span className="text-emerald-500 font-medium">✓ Al día para Febrero 2027</span>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-4 px-6 text-center text-xs text-slate-400">
        Plataforma de Finanzas Personales • Backend NestJS + PostgreSQL + Vite React
      </footer>

      {/* Modales */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
          refetch();
        }}
      />

      <CreateAccountModal
        isOpen={isCreateAccountOpen}
        onClose={() => setIsCreateAccountOpen(false)}
        onSubmit={async (input) => {
          await createAccount(input);
        }}
      />
    </div>
  );
}
