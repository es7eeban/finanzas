import React, { useState, useMemo } from 'react';
import {
  CalendarClock,
  PlusCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Search,
  CheckCircle2,
  Clock,
  SlidersHorizontal,
} from 'lucide-react';
import { useRecurringBills } from '../hooks/useRecurringBills';
import { RecurringBillCard } from '../components/RecurringBillCard';
import { MarkPaidModal } from '../components/MarkPaidModal';
import { CreateRecurringBillModal } from '../components/CreateRecurringBillModal';
import type { RecurringBill, BillExecutionType, BillCategory } from '../../../types';
import { BILL_CATEGORIES } from '../constants';
import { formatCurrency } from '../../../utils/currency';

// Helper para formatear YYYY-MM en "Mes YYYY" en español
function formatPeriodDisplay(periodStr: string): string {
  if (!periodStr || !periodStr.includes('-')) return periodStr;
  const [yearStr, monthStr] = periodStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  const date = new Date(year, month, 1);
  const formatted = date.toLocaleDateString('es-CL', {
    month: 'long',
    year: 'numeric',
  });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

// Helpers para navegar meses
function addMonthsToPeriod(periodStr: string, delta: number): string {
  const [yearStr, monthStr] = periodStr.split('-');
  let year = parseInt(yearStr, 10);
  let month = parseInt(monthStr, 10) + delta;

  while (month > 12) {
    month -= 12;
    year += 1;
  }
  while (month < 1) {
    month += 12;
    year -= 1;
  }

  return `${year}-${String(month).padStart(2, '0')}`;
}

function getRealPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export const RecurringBillsPage: React.FC = () => {
  const {
    period,
    setPeriod,
    bills,
    summary,
    loading,
    refetch,
    createBill,
    updateBill,
    markPaid,
    deleteBill,
  } = useRecurringBills();

  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'PAID' | 'OVERDUE'>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | BillExecutionType>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | BillCategory>('ALL');

  // Estados de modales
  const [billToPay, setBillToPay] = useState<RecurringBill | null>(null);
  const [isMarkPaidOpen, setIsMarkPaidOpen] = useState(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [billToEdit, setBillToEdit] = useState<RecurringBill | null>(null);

  // Período actual en tiempo real para saber si el usuario está viendo el mes presente
  const [currentRealPeriod] = useState<string>(getRealPeriod);

  const isCurrentPeriod = period === currentRealPeriod;

  // Filtrado de servicios
  const filteredBills = useMemo(() => {
    return bills.filter((b) => {
      // Filtro de búsqueda por texto
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesName = b.name.toLowerCase().includes(term);
        const matchesNotes = b.notes?.toLowerCase().includes(term);
        const matchesCategory = BILL_CATEGORIES[b.category]?.label.toLowerCase().includes(term);
        if (!matchesName && !matchesNotes && !matchesCategory) return false;
      }

      // Filtro de estado
      if (statusFilter === 'PAID' && !b.isPaidThisMonth) return false;
      if (statusFilter === 'PENDING' && (b.isPaidThisMonth || b.isOverdue)) return false;
      if (statusFilter === 'OVERDUE' && (!b.isOverdue || b.isPaidThisMonth)) return false;

      // Filtro de tipo de ejecución
      if (typeFilter !== 'ALL' && b.executionType !== typeFilter) return false;

      // Filtro de categoría
      if (categoryFilter !== 'ALL' && b.category !== categoryFilter) return false;

      return true;
    });
  }, [bills, searchTerm, statusFilter, typeFilter, categoryFilter]);

  // Manejadores de modales
  const handleOpenMarkPaid = (bill: RecurringBill) => {
    setBillToPay(bill);
    setIsMarkPaidOpen(true);
  };

  const handleOpenCreate = () => {
    setBillToEdit(null);
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (bill: RecurringBill) => {
    setBillToEdit(bill);
    setIsCreateModalOpen(true);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setTypeFilter('ALL');
    setCategoryFilter('ALL');
  };

  // Porcentaje pagado
  const percentPaid =
    summary && summary.totalCommitted > 0
      ? Math.round((summary.totalPaid / summary.totalCommitted) * 100)
      : 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Cabecera Principal y Navegador de Período */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <CalendarClock className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Gastos Fijos & Cuentas Recurrentes
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Control de boletas manuales (Luz/Agua/Gas) y cargos automáticos (PAT/Suscripciones)
              </p>
            </div>
          </div>
        </div>

        {/* Controles de Acción: Selector de mes y botón Nuevo Servicio */}
        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
          {/* Navegador de Mes */}
          <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-xs">
            <button
              type="button"
              onClick={() => setPeriod(addMonthsToPeriod(period, -1))}
              aria-label="Mes anterior"
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 text-xs font-bold text-slate-800 dark:text-slate-200 select-none min-w-[130px] text-center">
              {formatPeriodDisplay(period)}
            </span>

            <button
              type="button"
              onClick={() => setPeriod(addMonthsToPeriod(period, 1))}
              aria-label="Mes siguiente"
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {!isCurrentPeriod && (
              <button
                type="button"
                onClick={() => setPeriod(currentRealPeriod)}
                className="ml-1 px-2 py-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-md transition-colors"
              >
                Hoy
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => refetch()}
            disabled={loading}
            aria-label="Actualizar datos"
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 shadow-xs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            data-testid="new-recurring-bill-button"
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 active:scale-95 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Nuevo Servicio</span>
          </button>
        </div>
      </div>

      {/* Tarjetas KPI de Resumen Mensual */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Comprometido */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
            <span>Total Gastos Fijos</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
              {summary?.totalBills ?? 0} servicios
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
            {formatCurrency(summary?.totalCommitted ?? 0, 'CLP')}
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Presupuesto estimado para {formatPeriodDisplay(period)}
          </p>
        </div>

        {/* Pagado este mes */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-2">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              Pagado Este Mes
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-mono text-[11px]">
              {summary?.paidCount ?? 0} al día
            </span>
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums tracking-tight">
            {formatCurrency(summary?.totalPaid ?? 0, 'CLP')}
          </div>
          {/* Barra de progreso */}
          <div className="mt-3">
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, percentPaid)}%` }}
              />
            </div>
            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mt-1 block text-right">
              {percentPaid}% cubierto
            </span>
          </div>
        </div>

        {/* Pendiente por Pagar */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-amber-600 dark:text-amber-400 mb-2">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              Pendiente por Pagar
            </span>
            <span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-mono text-[11px]">
              {summary?.pendingCount ?? 0} pendientes
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
            {formatCurrency(summary?.totalPending ?? 0, 'CLP')}
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Por debitar o pagar antes de fin de mes
          </p>
        </div>
      </div>

      {/* Barra de Filtros, Búsqueda y Pestañas de Estado */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Pestañas de Estado */}
          <div className="flex flex-wrap items-center gap-1">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                statusFilter === 'ALL'
                  ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Todos ({bills.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('PENDING')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                statusFilter === 'PENDING'
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Pendientes ({bills.filter((b) => !b.isPaidThisMonth && !b.isOverdue).length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('OVERDUE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                statusFilter === 'OVERDUE'
                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Vencidos ({bills.filter((b) => b.isOverdue && !b.isPaidThisMonth).length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('PAID')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                statusFilter === 'PAID'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Pagados ({bills.filter((b) => b.isPaidThisMonth).length})
            </button>
          </div>

          {/* Buscador */}
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar servicio..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Filtros secundarios: Tipo de Ejecución & Categoría */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filtrar por:</span>
          </div>

          {/* Filtro de Tipo de Pago */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as 'ALL' | BillExecutionType)}
            className="px-2.5 py-1 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
          >
            <option value="ALL">Todos los tipos de cobro</option>
            <option value="MANUAL_CHECK">Pago Manual (Check)</option>
            <option value="AUTOMATIC">Automático (PAT / TC)</option>
          </select>

          {/* Filtro de Categoría */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as 'ALL' | BillCategory)}
            className="px-2.5 py-1 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
          >
            <option value="ALL">Todas las categorías</option>
            {Object.entries(BILL_CATEGORIES).map(([catKey, meta]) => (
              <option key={catKey} value={catKey}>
                {meta.label}
              </option>
            ))}
          </select>

          {(searchTerm || statusFilter !== 'ALL' || typeFilter !== 'ALL' || categoryFilter !== 'ALL') && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline ml-auto"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Grilla de Servicios */}
      {loading && bills.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-center">
          <RefreshCw className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin mb-3" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Cargando gastos fijos...
          </p>
        </div>
      ) : filteredBills.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBills.map((bill) => (
            <RecurringBillCard
              key={bill.id}
              bill={bill}
              onMarkPaid={handleOpenMarkPaid}
              onEdit={handleOpenEdit}
              onDelete={deleteBill}
            />
          ))}
        </div>
      ) : bills.length === 0 ? (
        /* Empty State inicial sin servicios registrados */
        <div className="py-16 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-center flex flex-col items-center justify-center max-w-lg mx-auto shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4">
            <CalendarClock className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
            No tienes pagos recurrentes registrados
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6">
            Lleva el control de tus cuentas de luz, agua, arriendo, Netflix, Spotify y suscripciones. Sabrás exactamente qué falta por pagar cada mes.
          </p>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 active:scale-95 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Agregar Primer Servicio</span>
          </button>
        </div>
      ) : (
        /* Empty State por filtros sin coincidencias */
        <div className="py-12 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center flex flex-col items-center justify-center max-w-md mx-auto shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
            <Search className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
            No se encontraron servicios
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            No hay boletas ni suscripciones que coincidan con los filtros seleccionados.
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors"
          >
            Restablecer Filtros
          </button>
        </div>
      )}

      {/* Modales */}
      <MarkPaidModal
        isOpen={isMarkPaidOpen}
        onClose={() => {
          setIsMarkPaidOpen(false);
          setBillToPay(null);
        }}
        bill={billToPay}
        onConfirm={async (data) => {
          if (!billToPay) return;
          await markPaid(billToPay.id, data);
        }}
      />

      <CreateRecurringBillModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setBillToEdit(null);
        }}
        bill={billToEdit}
        onSubmit={async (input) => {
          await createBill(input);
        }}
        onUpdate={async (id, input) => {
          await updateBill(id, input);
        }}
      />
    </div>
  );
};
