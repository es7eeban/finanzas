import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { ThemeToggle } from '../components/common/ThemeToggle';
import { QuickActionModal } from '../features/common/components/QuickActionModal';
import {
  Wallet,
  LayoutDashboard,
  Landmark,
  ArrowLeftRight,
  Target,
  HandCoins,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Plus,
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Cuentas', path: '/accounts', icon: Landmark },
  { label: 'Transacciones', path: '/transactions', icon: ArrowLeftRight },
  { label: 'Metas Ahorro', path: '/savings', icon: Target },
  { label: 'Deudas P2P', path: '/debts', icon: HandCoins },
];

export const AppLayout = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);

  // Atajo de teclado: Tecla 'N' para abrir el modal de acción rápida
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar si el usuario está escribiendo en un input, textarea o select
      if (
        ['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)
      ) {
        return;
      }

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setIsQuickActionOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row transition-colors duration-200">
      {/* ============================================================== */}
      {/* 📱 TOPBAR MÓVIL (< 768px)                                      */}
      {/* ============================================================== */}
      <header className="md:hidden sticky top-0 z-30 border-b border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-teal-400 flex items-center justify-center text-white shadow-xs">
            <Wallet className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight">Finanzas</h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-none">
              {user?.fullName?.split(' ')[0] || 'Mi Espacio'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <button
            onClick={handleLogout}
            title="Cerrar Sesión"
            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ============================================================== */}
      {/* 💻 SIDEBAR ESCRITORIO (>= 768px)                               */}
      {/* ============================================================== */}
      <aside
        className={`hidden md:flex flex-col sticky top-0 h-screen border-r border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-300 z-30 shrink-0 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Cabecera Sidebar con Logo */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
            {!isCollapsed && (
              <div className="truncate">
                <h1 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white truncate">
                  Finanzas
                </h1>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Control Financiero
                </p>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={isCollapsed ? 'Expandir barra lateral' : 'Colapsar barra lateral'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Botón de Acción Rápida (Desktop) con atajo 'N' */}
        <div className="p-3">
          <button
            onClick={() => setIsQuickActionOpen(true)}
            className={`w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs shadow-md shadow-indigo-600/20 transition-all active:scale-[0.98] ${
              isCollapsed ? 'px-0' : ''
            }`}
            title="Nuevo movimiento (Atajo: N)"
          >
            <Plus className="w-4 h-4 shrink-0" />
            {!isCollapsed && (
              <>
                <span>Nuevo Movimiento</span>
                <kbd className="ml-auto hidden xl:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-indigo-700/60 rounded-md border border-indigo-400/30 text-indigo-100">
                  N
                </kbd>
              </>
            )}
          </button>
        </div>

        {/* Menú de Navegación */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.path}
                to={item.path}
                title={item.label}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                } ${isCollapsed ? 'justify-center px-0' : ''}`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : ''}`} />
                {!isCollapsed && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Sección Inferior de Usuario & Tema */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
          {/* Perfil */}
          <div
            className={`flex items-center gap-3 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 ${
              isCollapsed ? 'justify-center p-1.5' : ''
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
              {user?.fullName?.charAt(0).toUpperCase() || 'U'}
            </div>
            {!isCollapsed && (
              <div className="truncate flex-1">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                  {user?.fullName || 'Usuario'}
                </p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
              </div>
            )}
          </div>

          {/* Acciones Rápidas Inferiores */}
          <div className={`flex items-center gap-1 ${isCollapsed ? 'flex-col' : 'justify-between'}`}>
            <ThemeToggle showLabel={!isCollapsed} />
            <button
              onClick={handleLogout}
              title="Cerrar sesión"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span className="text-xs font-medium">Salir</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* ============================================================== */}
      {/* 📄 CONTENIDO PRINCIPAL (OUTLET)                                */}
      {/* ============================================================== */}
      <main className="flex-1 min-w-0 overflow-y-auto pb-24 md:pb-8">
        <Outlet />
      </main>

      {/* ============================================================== */}
      {/* 📱 BOTTOM NAVIGATION BAR MÓVIL (< 768px)                       */}
      {/* ============================================================== */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-t border-slate-200/80 dark:border-slate-800 px-3 py-2 flex items-center justify-around shadow-lg">
        {/* Item 1: Dashboard */}
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-[10px] font-medium transition-colors ${
              isActive
                ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                : 'text-slate-500 dark:text-slate-400'
            }`
          }
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>Inicio</span>
        </NavLink>

        {/* Item 2: Cuentas */}
        <NavLink
          to="/accounts"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-[10px] font-medium transition-colors ${
              isActive
                ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                : 'text-slate-500 dark:text-slate-400'
            }`
          }
        >
          <Landmark className="w-5 h-5" />
          <span>Cuentas</span>
        </NavLink>

        {/* 🌟 FAB CENTRAL ELEVADO (+) */}
        <div className="-mt-7">
          <button
            onClick={() => setIsQuickActionOpen(true)}
            className="w-13 h-13 rounded-full bg-gradient-to-tr from-indigo-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/40 hover:scale-105 active:scale-95 transition-transform"
            aria-label="Registrar nueva operación"
          >
            <Plus className="w-7 h-7" />
          </button>
        </div>

        {/* Item 4: Metas de Ahorro */}
        <NavLink
          to="/savings"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-[10px] font-medium transition-colors ${
              isActive
                ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                : 'text-slate-500 dark:text-slate-400'
            }`
          }
        >
          <Target className="w-5 h-5" />
          <span>Metas</span>
        </NavLink>

        {/* Item 5: Deudas P2P */}
        <NavLink
          to="/debts"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-[10px] font-medium transition-colors ${
              isActive
                ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                : 'text-slate-500 dark:text-slate-400'
            }`
          }
        >
          <HandCoins className="w-5 h-5" />
          <span>Deudas</span>
        </NavLink>
      </div>

      {/* Modal de Acción Rápida */}
      <QuickActionModal
        isOpen={isQuickActionOpen}
        onClose={() => setIsQuickActionOpen(false)}
      />
    </div>
  );
};
