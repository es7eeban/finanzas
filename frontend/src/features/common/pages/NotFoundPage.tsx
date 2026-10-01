import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export const NotFoundPage = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
        <span className="text-2xl font-black">404</span>
      </div>
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
        Página no encontrada
      </h2>
      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-6">
        La ruta que intentas visitar no existe o fue movida.
      </p>
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition-all"
      >
        <Home className="w-4 h-4" />
        <span>Volver al Dashboard</span>
      </Link>
    </div>
  );
};
