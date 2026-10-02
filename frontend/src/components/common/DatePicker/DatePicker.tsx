import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  X,
  CalendarDays,
} from 'lucide-react';

export interface DatePickerProps {
  value: string; // Formato YYYY-MM-DD
  onChange: (date: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  minDate?: string;
  maxDate?: string;
  showClearButton?: boolean;
  className?: string;
  id?: string;
}

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const WEEK_DAYS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  label,
  placeholder = 'Selecciona una fecha',
  disabled = false,
  required = false,
  minDate,
  maxDate,
  showClearButton = false,
  className = '',
  id,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parsear fecha seleccionada
  const selectedDateObj = useMemo(() => {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const [y, m, d] = value.split('-').map(Number);
    return new Date(y, m - 1, d);
  }, [value]);

  // Mes y Año en vista del calendario
  const [viewDate, setViewDate] = useState<Date>(() => {
    if (selectedDateObj) return new Date(selectedDateObj);
    return new Date();
  });

  // Sincronizar viewDate al cambiar value exteriormente
  useEffect(() => {
    if (selectedDateObj) {
      setViewDate(new Date(selectedDateObj));
    }
  }, [selectedDateObj]);

  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();

  // Cerrar al presionar fuera o tecla Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Navegación de mes y año
  const handlePrevMonth = () => {
    setViewDate(new Date(viewYear, viewMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewYear, viewMonth + 1, 1));
  };

  const handleYearChange = (year: number) => {
    setViewDate(new Date(year, viewMonth, 1));
  };

  const handleMonthChange = (month: number) => {
    setViewDate(new Date(viewYear, month, 1));
  };

  // Calcular días del mes actual para la grilla
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
    const lastDayOfMonth = new Date(viewYear, viewMonth + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();

    // En JavaScript 0 es Domingo, 1 es Lunes. Ajustamos para que Lunes sea 0.
    const startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7;

    const days: Array<{
      day: number;
      dateString: string;
      isCurrentMonth: boolean;
      isSelected: boolean;
      isToday: boolean;
      isDisabled: boolean;
    }> = [];

    // Días del mes anterior (relleno)
    const prevMonthLastDay = new Date(viewYear, viewMonth, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const prevDate = new Date(viewYear, viewMonth - 1, dayNum);
      const str = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      days.push({
        day: dayNum,
        dateString: str,
        isCurrentMonth: false,
        isSelected: false,
        isToday: false,
        isDisabled: true,
      });
    }

    // Días del mes actual
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;

      let isDisabled = false;
      if (minDate && dateStr < minDate) isDisabled = true;
      if (maxDate && dateStr > maxDate) isDisabled = true;

      days.push({
        day: i,
        dateString: dateStr,
        isCurrentMonth: true,
        isSelected: value === dateStr,
        isToday: todayStr === dateStr,
        isDisabled,
      });
    }

    // Días del mes siguiente (para completar 42 celdas o múltiplos de 7)
    const remainingCells = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remainingCells; i++) {
      const nextDate = new Date(viewYear, viewMonth + 1, i);
      const str = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({
        day: i,
        dateString: str,
        isCurrentMonth: false,
        isSelected: false,
        isToday: false,
        isDisabled: true,
      });
    }

    return days;
  }, [viewYear, viewMonth, value, minDate, maxDate]);

  const handleSelectDate = (dateString: string) => {
    onChange(dateString);
    setIsOpen(false);
  };

  const handleSelectToday = () => {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    onChange(todayStr);
    setViewDate(now);
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange('');
    setIsOpen(false);
  };

  // Formato amigable de display
  const displayFormattedDate = useMemo(() => {
    if (!selectedDateObj) return '';
    return selectedDateObj.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }, [selectedDateObj]);

  // Lista de años disponibles (±10 años)
  const currentYear = new Date().getFullYear();
  const years = useMemo(() => {
    const list: number[] = [];
    for (let y = currentYear - 10; y <= currentYear + 10; y++) {
      list.push(y);
    }
    return list;
  }, [currentYear]);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
        >
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      {/* Input de visualización: Text ReadOnly para desactivar teclados y pickers nativos */}
      <div className="relative">
        <input
          id={id}
          type="text"
          readOnly
          disabled={disabled}
          value={displayFormattedDate}
          placeholder={placeholder}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`w-full pl-10 pr-9 py-2.5 rounded-xl border bg-white dark:bg-slate-950 text-xs font-medium cursor-pointer transition-colors focus:outline-hidden focus:ring-2 focus:ring-indigo-500 ${
            disabled
              ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800'
              : 'border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        />

        <CalendarIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />

        {value && showClearButton && !disabled && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
            title="Limpiar fecha"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 absolute right-2.5 top-1/2 -translate-y-1/2"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Popover en Desktop (≥768px) / Drawer Bottom Sheet en Mobile (<768px) */}
      {isOpen && (
        <>
          {/* Backdrop para mobile */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 md:hidden animate-in fade-in duration-150"
            onClick={() => setIsOpen(false)}
          />

          <div
            className="fixed inset-x-0 bottom-0 z-50 md:absolute md:inset-x-auto md:bottom-auto md:top-full md:left-0 md:mt-2 w-full md:w-80 bg-white dark:bg-slate-900 rounded-t-3xl md:rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 animate-in slide-in-from-bottom-6 md:slide-in-from-top-2 duration-200"
            role="dialog"
            aria-modal="true"
          >
            {/* Header del Calendario */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1.5">
                <select
                  value={viewMonth}
                  onChange={(e) => handleMonthChange(Number(e.target.value))}
                  className="bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 rounded-lg px-2 py-1 border border-slate-200 dark:border-slate-700 cursor-pointer focus:outline-hidden"
                >
                  {MONTH_NAMES.map((name, idx) => (
                    <option key={name} value={idx}>
                      {name}
                    </option>
                  ))}
                </select>

                <select
                  value={viewYear}
                  onChange={(e) => handleYearChange(Number(e.target.value))}
                  className="bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 rounded-lg px-2 py-1 border border-slate-200 dark:border-slate-700 cursor-pointer focus:outline-hidden"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  title="Mes anterior"
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  title="Mes siguiente"
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Días de la semana */}
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-slate-400 py-2">
              {WEEK_DAYS.map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>

            {/* Grilla de Días del Mes */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((item, index) => (
                <button
                  key={`${item.dateString}-${index}`}
                  type="button"
                  disabled={item.isDisabled}
                  onClick={() => handleSelectDate(item.dateString)}
                  className={`h-8 w-full text-xs font-medium rounded-lg flex items-center justify-center transition-all ${
                    item.isSelected
                      ? 'bg-indigo-600 text-white font-extrabold shadow-sm scale-105'
                      : item.isToday
                      ? 'border border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold hover:bg-indigo-50 dark:hover:bg-indigo-950/40'
                      : !item.isCurrentMonth
                      ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed opacity-40'
                      : item.isDisabled
                      ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {item.day}
                </button>
              ))}
            </div>

            {/* Acciones Rápidas Inferiores */}
            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleSelectToday}
                className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline px-2 py-1 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Hoy</span>
              </button>

              <div className="flex items-center gap-1.5">
                {showClearButton && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-2 py-1"
                  >
                    Limpiar
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors"
                >
                  Listo
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
