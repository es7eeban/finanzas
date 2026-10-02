import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { api } from '../../../services/api';
import { formatCurrency } from '../../../utils/currency';
import {
  X,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Calendar,
  Tag,
  Wallet,
  Repeat,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import type { Account, Category, TransactionType } from '../../../types';

interface CreateTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialType?: TransactionType;
}

export const CreateTransactionModal: React.FC<CreateTransactionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialType = 'EXPENSE',
}) => {
  const [type, setType] = useState<TransactionType>(initialType);
  const [amount, setAmount] = useState<string>('');
  const [accountId, setAccountId] = useState<string>('');
  const [destinationAccountId, setDestinationAccountId] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [date, setDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [isRecurring, setIsRecurring] = useState<boolean>(false);

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Sincronizar initialType cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setType(initialType);
      setError(null);
    }
  }, [isOpen, initialType]);

  // Cargar cuentas y categorías al abrir
  useEffect(() => {
    if (!isOpen) return;

    const loadData = async () => {
      setLoadingData(true);
      setError(null);
      try {
        const [accRes, catRes] = await Promise.all([
          api.get('/accounts'),
          api.get('/categories'),
        ]);

        const activeAccounts: Account[] = (accRes.data || []).filter(
          (a: Account) => a.isActive
        );
        setAccounts(activeAccounts);
        setCategories(catRes.data || []);

        // Autoseleccionar primera cuenta si no hay ninguna seleccionada
        if (activeAccounts.length > 0 && !accountId) {
          setAccountId(activeAccounts[0].id);
        }
      } catch (err: unknown) {
        console.error('Error al cargar datos para transacción', err);
        setError('No fue posible cargar las cuentas o categorías.');
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, [isOpen, accountId]);

  // Cuenta origen seleccionada
  const selectedAccount = useMemo(() => {
    return accounts.find((a) => a.id === accountId) || null;
  }, [accounts, accountId]);

  // Categorías filtradas por tipo de transacción (EXPENSE o INCOME)
  const filteredCategories = useMemo(() => {
    if (type !== 'EXPENSE' && type !== 'INCOME') return [];
    return categories.filter((c) => c.type === type);
  }, [categories, type]);

  // Cuentas destino disponibles para transferencias (excluye origen)
  const availableDestinationAccounts = useMemo(() => {
    return accounts.filter((a) => a.id !== accountId);
  }, [accounts, accountId]);

  // Atajos de incremento de monto según moneda
  const quickIncrements = useMemo(() => {
    if (selectedAccount?.currency === 'USD') {
      return [10, 50, 100, 500];
    }
    return [1000, 5000, 10000, 50000];
  }, [selectedAccount?.currency]);

  const handleAddAmount = (inc: number) => {
    const current = Number(amount) || 0;
    setAmount(String(current + inc));
  };

  const handleClearAmount = () => {
    setAmount('');
  };

  const resetForm = () => {
    setAmount('');
    setDescription('');
    setDestinationAccountId('');
    setCategoryId('');
    setDate(new Date().toISOString().split('T')[0]);
    setIsRecurring(false);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      setError('Por favor ingresa un monto válido mayor a 0.');
      return;
    }

    if (!accountId) {
      setError('Por favor selecciona una cuenta de origen.');
      return;
    }

    if (type === 'TRANSFER') {
      if (!destinationAccountId) {
        setError('Para una transferencia debes seleccionar una cuenta destino.');
        return;
      }
      if (destinationAccountId === accountId) {
        setError('La cuenta origen y destino deben ser distintas.');
        return;
      }
    }

    if (!description.trim()) {
      setError('Por favor ingresa una breve descripción o comercio.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/transactions', {
        accountId,
        destinationAccountId: type === 'TRANSFER' ? destinationAccountId : undefined,
        categoryId: type !== 'TRANSFER' && categoryId ? categoryId : undefined,
        type,
        amount: numericAmount,
        date: date ? new Date(date).toISOString() : new Date().toISOString(),
        description: description.trim(),
        isRecurring,
      });

      resetForm();
      onSuccess();
      onClose();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.message;
        setError(
          Array.isArray(msg)
            ? msg.join(', ')
            : msg || 'Ocurrió un error al registrar la transacción.'
        );
      } else {
        setError('Ocurrió un error inesperado al registrar la transacción.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]"
        role="dialog"
      >
        {/* Cabecera */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Registrar Movimiento
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ingresa el gasto, ingreso o transferencia
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pestañas de Tipo (Gasto / Ingreso / Transferencia) */}
        <div className="p-3 bg-slate-50/70 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800/80 shrink-0">
          <div className="grid grid-cols-3 gap-1.5 bg-slate-200/60 dark:bg-slate-800/60 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setType('EXPENSE');
                setCategoryId('');
              }}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
                type === 'EXPENSE'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>Gasto</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setType('INCOME');
                setCategoryId('');
              }}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
                type === 'INCOME'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Ingreso</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setType('TRANSFER');
                setCategoryId('');
              }}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
                type === 'TRANSFER'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ArrowLeftRight className="w-4 h-4" />
              <span>Transferencia</span>
            </button>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-4 sm:p-5 space-y-4 flex-1">
          {error && (
            <div className="p-3 text-xs bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 rounded-xl border border-rose-200 dark:border-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Display Grande de Monto */}
          <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
              Monto ({selectedAccount?.currency || 'CLP'})
            </label>
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl font-bold text-slate-400">
                {selectedAccount?.currency === 'USD' ? 'US$' : '$'}
              </span>
              <input
                type="number"
                step="any"
                min="0.01"
                required
                autoFocus
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-48 sm:w-56 text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white bg-transparent text-center focus:outline-hidden tabular-nums placeholder:text-slate-300 dark:placeholder:text-slate-700"
              />
            </div>

            {/* Atajos de incremento rápido */}
            <div className="flex items-center justify-center gap-1.5 mt-3 flex-wrap">
              {quickIncrements.map((inc) => (
                <button
                  key={inc}
                  type="button"
                  onClick={() => handleAddAmount(inc)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 transition-all shadow-2xs"
                >
                  +{inc >= 1000 ? `${inc / 1000}k` : inc}
                </button>
              ))}
              <button
                type="button"
                onClick={handleClearAmount}
                title="Limpiar monto"
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-100 active:scale-95 transition-all"
              >
                C
              </button>
            </div>
          </div>

          {/* 2. Cuentas y Categoría */}
          <div className="space-y-3">
            {/* Cuenta Origen */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                <span className="flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-slate-400" />
                  <span>{type === 'TRANSFER' ? 'Cuenta Origen' : 'Cuenta'}</span>
                </span>
              </label>
              <select
                required
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                disabled={loadingData || accounts.length === 0}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              >
                {accounts.length === 0 && (
                  <option value="">Cargando cuentas...</option>
                )}
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} — Saldo: {formatCurrency(acc.balance, acc.currency)}
                  </option>
                ))}
              </select>
            </div>

            {/* Cuenta Destino (Solo si es Transferencia) */}
            {type === 'TRANSFER' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  <span className="flex items-center gap-1.5">
                    <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Cuenta Destino</span>
                  </span>
                </label>
                <select
                  required
                  value={destinationAccountId}
                  onChange={(e) => setDestinationAccountId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                >
                  <option value="">Selecciona cuenta de destino...</option>
                  {availableDestinationAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} — Saldo: {formatCurrency(acc.balance, acc.currency)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Categoría (Solo si es Gasto o Ingreso) */}
            {type !== 'TRANSFER' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  <span className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-slate-400" />
                    <span>Categoría (Opcional)</span>
                  </span>
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                >
                  <option value="">Sin categoría asignada</option>
                  {filteredCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* 3. Descripción, Fecha y Recurrencia */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Descripción / Comercio
              </label>
              <input
                type="text"
                required
                maxLength={255}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={
                  type === 'EXPENSE'
                    ? 'Ej. Supermercado Líder, Uber, Almuerzo'
                    : type === 'INCOME'
                    ? 'Ej. Sueldo mensual, Venta freelance'
                    : 'Ej. Traspaso a cuenta de ahorro'
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Fecha</span>
                  </span>
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30">
                <div className="flex items-center gap-2">
                  <Repeat className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Recurrente mensual
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded-md border-slate-300 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || !amount || !accountId}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold text-xs shadow-md active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none ${
                type === 'EXPENSE'
                  ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                  : type === 'INCOME'
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
              }`}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <span>Confirmar {type === 'EXPENSE' ? 'Gasto' : type === 'INCOME' ? 'Ingreso' : 'Transferencia'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
