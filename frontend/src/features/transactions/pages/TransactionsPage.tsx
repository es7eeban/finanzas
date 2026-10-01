import { useState, useEffect, useCallback } from 'react';
import { api } from '../../../services/api';
import { formatCurrency } from '../../../utils/currency';
import { Card } from '../../../components/common/Card';
import { Badge } from '../../../components/common/Badge';
import {
  ArrowLeftRight,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Trash2,
  Calendar,
} from 'lucide-react';
import type { Transaction, TransactionType } from '../../../types';

export const TransactionsPage = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (typeFilter !== 'ALL') {
        params.type = typeFilter;
      }
      if (search.trim()) {
        params.search = search.trim();
      }

      const { data } = await api.get('/transactions', { params });
      setTransactions(data.data || []);
    } catch (err: any) {
      console.error('Error al cargar transacciones', err);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, search]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Seguro que deseas eliminar este movimiento? El saldo de la cuenta será revertido automáticamente.')) {
      return;
    }

    try {
      await api.delete(`/transactions/${id}`);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al eliminar la transacción');
    }
  };

  const getTransactionIcon = (type: TransactionType) => {
    switch (type) {
      case 'INCOME':
        return <ArrowUpRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'EXPENSE':
        return <ArrowDownLeft className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
      case 'TRANSFER':
        return <ArrowLeftRight className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
      default:
        return <ArrowLeftRight className="w-4 h-4 text-teal-600 dark:text-teal-400" />;
    }
  };

  const getBadgeVariant = (type: TransactionType) => {
    switch (type) {
      case 'INCOME':
        return 'emerald';
      case 'EXPENSE':
        return 'rose';
      case 'TRANSFER':
        return 'indigo';
      default:
        return 'teal';
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Historial de Transacciones
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Registro cronológico y trazabilidad de ingresos, gastos y transferencias
          </p>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col md:flex-row gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por descripción o comercio..."
            className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { label: 'Todos', value: 'ALL' },
            { label: 'Gastos', value: 'EXPENSE' },
            { label: 'Ingresos', value: 'INCOME' },
            { label: 'Transferencias', value: 'TRANSFER' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setTypeFilter(tab.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                typeFilter === tab.value
                  ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Movimientos */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span>Cargando movimientos...</span>
        </div>
      ) : transactions.length === 0 ? (
        <Card className="p-12 text-center">
          <ArrowLeftRight className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No se encontraron transacciones
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
            {search || typeFilter !== 'ALL'
              ? 'Prueba ajustando los filtros de búsqueda.'
              : 'Registra tu primer gasto, ingreso o transferencia para empezar a ver el historial.'}
          </p>
        </Card>
      ) : (
        <Card className="divide-y divide-slate-100 dark:divide-slate-800/80 overflow-hidden">
          {transactions.map((tx) => {
            const isExpense = tx.type === 'EXPENSE' || tx.type === 'DEBT_PAYMENT';
            const isIncome = tx.type === 'INCOME';

            return (
              <div
                key={tx.id}
                className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                    {getTransactionIcon(tx.type)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {tx.description}
                      </span>
                      <Badge variant={getBadgeVariant(tx.type)} size="sm">
                        {tx.type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <span>{tx.account?.name || 'Cuenta'}</span>
                      {tx.destinationAccount && (
                        <span>➔ {tx.destinationAccount.name}</span>
                      )}
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(tx.date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div
                    className={`text-sm sm:text-base font-bold tabular-nums text-right ${
                      isIncome
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : isExpense
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-indigo-600 dark:text-indigo-400'
                    }`}
                  >
                    {isIncome ? '+' : isExpense ? '-' : ''}
                    {formatCurrency(tx.amount, tx.account?.currency || 'CLP')}
                  </div>

                  <button
                    onClick={() => handleDelete(tx.id)}
                    title="Eliminar movimiento y revertir saldo"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
};
