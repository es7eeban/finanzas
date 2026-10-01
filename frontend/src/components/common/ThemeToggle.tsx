import { Sun, Moon } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle = ({ className = '', showLabel = false }: ThemeToggleProps) => {
  const { isDark, toggleTheme } = useThemeStore();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      aria-label="Cambiar tema claro / oscuro"
      className={`flex items-center gap-2 p-2 rounded-xl transition-all duration-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 ${className}`}
    >
      {isDark ? (
        <Sun className="w-5 h-5 text-amber-400 transition-transform duration-300 rotate-0 hover:rotate-45" />
      ) : (
        <Moon className="w-5 h-5 text-slate-600 transition-transform duration-300 hover:-rotate-12" />
      )}
      {showLabel && (
        <span className="text-xs font-medium">
          {isDark ? 'Modo Claro' : 'Modo Oscuro'}
        </span>
      )}
    </button>
  );
};
