import { Outlet } from 'react-router-dom';
import { ThemeToggle } from '../components/common/ThemeToggle';
import { Wallet } from 'lucide-react';

export const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center p-4 relative transition-colors duration-200">
      {/* Botón flotante para alternar tema */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        {/* Cabecera / Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-teal-400 items-center justify-center text-white shadow-xl shadow-indigo-500/25 mb-4">
            <Wallet className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Finanzas Personales
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Control de cuentas, metas de ahorro y deudas
          </p>
        </div>

        {/* Contenido de la página de auth */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xl p-6 sm:p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
