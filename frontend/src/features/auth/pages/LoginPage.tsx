import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../../store/authStore';
import { Mail, Lock, LogIn, AlertCircle, Sparkles } from 'lucide-react';

export const LoginPage = () => {
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Error al iniciar sesión. Revisa tus credenciales.',
      );
    }
  };

  const handleDemoLogin = async () => {
    setError(null);
    try {
      await login('demo@finanzas.com', 'Password123!');
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'No se pudo iniciar sesión con la cuenta demo.',
      );
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Bienvenido de vuelta
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Ingresa tus credenciales para acceder a tus finanzas
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Correo Electrónico
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Contraseña
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
        >
          <LogIn className="w-4 h-4" />
          <span>{isLoading ? 'Iniciando sesión...' : 'Entrar a mi cuenta'}</span>
        </button>
      </form>

      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
        {/* Acceso 1-clic con Usuario Demo */}
        <button
          type="button"
          onClick={handleDemoLogin}
          disabled={isLoading}
          className="w-full py-2 px-3 rounded-xl border border-teal-200 dark:border-teal-800/80 bg-teal-50/60 dark:bg-teal-950/30 text-teal-700 dark:text-teal-400 text-xs font-semibold hover:bg-teal-100/60 dark:hover:bg-teal-900/40 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Ingresar con Usuario Demo</span>
        </button>

        <p className="text-center text-xs text-slate-500 dark:text-slate-400">
          ¿No tienes una cuenta aún?{' '}
          <Link
            to="/register"
            className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
          >
            Regístrate aquí
          </Link>
        </p>
      </div>
    </div>
  );
};
