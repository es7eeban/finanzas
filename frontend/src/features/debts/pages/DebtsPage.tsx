import { useState, useEffect, useCallback } from 'react';
import { api } from '../../../services/api';
import { formatCurrency } from '../../../utils/currency';
import { Card } from '../../../components/common/Card';
import { Badge } from '../../../components/common/Badge';
import {
  HandCoins,
  PlusCircle,
  ArrowUpRight,
  ArrowDownLeft,
  X,
} from 'lucide-react';
import type { DebtLoan, Account } from '../../../types';

export const DebtsPage = () => {
  const [debts, setDebts] = useState<DebtLoan[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'ALL' | 'LENT' | 'BORROWED'>('ALL');

  // Modales
  const [selectedDebt, setSelectedDebt] = useState<DebtLoan | null>(null);
  const [modalType, setModalType] = useState<'payment' | 'create' | null>(null);

  // Form states
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentAccount, setPaymentAccount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');

  const [newContact, setNewContact] = useState('');
  const [newType, setNewType] = useState<'LENT' | 'BORROWED'>('LENT');
  const [newAmount, setNewAmount] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newAccount, setNewAccount] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [debtsRes, accsRes] = await Promise.all([
        api.get('/debts'),
        api.get('/accounts'),
      ]);
      setDebts(debtsRes.data || []);
      setAccounts((accsRes.data || []).filter((a: Account) => a.isActive));
    } catch (e) {
      console.error('Error al cargar deudas', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const displayedDebts =
    filterType === 'ALL' ? debts : debts.filter((d) => d.type === filterType);

  const totalLentPending = debts
    .filter((d) => d.type === 'LENT' && d.status !== 'PAID')
    .reduce((sum, d) => sum + d.pendingAmount, 0);

  const totalBorrowedPending = debts
    .filter((d) => d.type === 'BORROWED' && d.status !== 'PAID')
    .reduce((sum, d) => sum + d.pendingAmount, 0);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebt || !paymentAmount) return;
    setSubmitting(true);
    try {
      await api.post(`/debts/${selectedDebt.id}/payments`, {
        amount: Number(paymentAmount),
        accountId: paymentAccount || undefined,
        note: paymentNote || undefined,
      });
      setModalType(null);
      setPaymentAmount('');
      setPaymentNote('');
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al registrar abono');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContact || !newAmount) return;
    setSubmitting(true);
    try {
      await api.post('/debts', {
        contactName: newContact,
        type: newType,
        totalAmount: Number(newAmount),
        dueDate: newDueDate || undefined,
        accountId: newAccount || undefined,
        notes: newNotes || undefined,
      });
      setModalType(null);
      setNewContact('');
      setNewAmount('');
      setNewDueDate('');
      setNewNotes('');
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al registrar compromiso');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Deudas & Préstamos P2P
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Control de dinero prestado por cobrar y deudas adquiridas con alertas de vencimiento
          </p>
        </div>

        <button
          onClick={() => setModalType('create')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-md shadow-amber-600/20 active:scale-95 transition-all self-start sm:self-auto cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Nuevo Registro</span>
        </button>
      </div>

      {/* Tarjetas de Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-5" hoverEffect>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Por Cobrar (Prestado a otros)
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2 tabular-nums">
            {formatCurrency(totalLentPending, 'CLP')}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Dinero que te deben</p>
        </Card>

        <Card className="p-5" hoverEffect>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Por Pagar (Deudas asumidas)
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-2 tabular-nums">
            {formatCurrency(totalBorrowedPending, 'CLP')}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Compromisos pendientes por saldar</p>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
        {[
          { label: 'Todos', value: 'ALL' },
          { label: 'Por Cobrar', value: 'LENT' },
          { label: 'Por Pagar', value: 'BORROWED' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilterType(tab.value as any)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filterType === tab.value
                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grid de Registros */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin" />
          <span>Cargando deudas y préstamos...</span>
        </div>
      ) : displayedDebts.length === 0 ? (
        <Card className="p-12 text-center">
          <HandCoins className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No tienes registros de deudas o préstamos
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-4">
            Registra dinero que hayas prestado a amigos o deudas contraídas para no perder el rastro.
          </p>
          <button
            onClick={() => setModalType('create')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Crear registro ahora</span>
          </button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayedDebts.map((debt) => {
            const isLent = debt.type === 'LENT';
            const isPaid = debt.status === 'PAID';

            return (
              <Card key={debt.id} className="p-5 flex flex-col justify-between" hoverEffect>
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {debt.contactName}
                        </span>
                        <Badge variant={isLent ? 'emerald' : 'rose'}>
                          {isLent ? 'Por Cobrar' : 'Por Pagar'}
                        </Badge>
                      </div>
                      {debt.notes && (
                        <p className="text-xs text-slate-400 mt-1 italic">
                          "{debt.notes}"
                        </p>
                      )}
                    </div>

                    <Badge
                      variant={
                        debt.status === 'PAID'
                          ? 'emerald'
                          : debt.urgency === 'overdue'
                          ? 'rose'
                          : debt.urgency === 'due_soon'
                          ? 'amber'
                          : 'slate'
                      }
                    >
                      {debt.status === 'PAID'
                        ? 'Saldada'
                        : debt.urgency === 'overdue'
                        ? 'Vencida'
                        : debt.urgency === 'due_soon'
                        ? `Vence en ${debt.daysUntilDue}d`
                        : debt.status === 'PARTIALLY_PAID'
                        ? 'Abonada'
                        : 'Pendiente'}
                    </Badge>
                  </div>

                  <div className="mt-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">Saldo Pendiente:</span>
                      <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                        {formatCurrency(debt.pendingAmount, 'CLP')}
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Monto Total:</span>
                      <span className="tabular-nums">{formatCurrency(debt.totalAmount, 'CLP')}</span>
                    </div>
                  </div>
                </div>

                {!isPaid && (
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-end">
                    <button
                      onClick={() => {
                        setSelectedDebt(debt);
                        setModalType('payment');
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Registrar Abono</span>
                    </button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal Abono */}
      {modalType === 'payment' && selectedDebt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Registrar Abono: {selectedDebt.contactName}
              </h3>
              <button onClick={() => setModalType(null)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handlePayment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Monto a Abonar ($ CLP) - Pendiente: {formatCurrency(selectedDebt.pendingAmount, 'CLP')}
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={selectedDebt.pendingAmount}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Ej. 20000"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {selectedDebt.type === 'LENT' ? 'Depositar en Cuenta (Opcional)' : 'Pagar desde Cuenta (Opcional)'}
                </label>
                <select
                  value={paymentAccount}
                  onChange={(e) => setPaymentAccount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs"
                >
                  <option value="">No vincular a cuenta bancaria...</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({formatCurrency(acc.balance, acc.currency)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nota (Opcional)
                </label>
                <input
                  type="text"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  placeholder="Ej. Transferencia primera cuota"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Procesando...' : 'Confirmar Abono'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Crear Deuda */}
      {modalType === 'create' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Nuevo Préstamo o Deuda
              </h3>
              <button onClick={() => setModalType(null)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tipo de Compromiso
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewType('LENT')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                      newType === 'LENT'
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Por Cobrar (Presté)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewType('BORROWED')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                      newType === 'BORROWED'
                        ? 'border-rose-600 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Por Pagar (Me prestaron)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Contacto (Persona o Entidad)
                </label>
                <input
                  type="text"
                  required
                  value={newContact}
                  onChange={(e) => setNewContact(e.target.value)}
                  placeholder="Ej. Carlos Morales"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Monto Total ($ CLP)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  placeholder="Ej. 100000"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Fecha de Vencimiento (Opcional)
                </label>
                <input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Vincular a Cuenta (Opcional para impactar balance)
                </label>
                <select
                  value={newAccount}
                  onChange={(e) => setNewAccount(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs"
                >
                  <option value="">No registrar movimiento bancario...</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.currency})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notas
                </label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Ej. Préstamo para repuesto de auto"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Guardando...' : 'Crear Registro'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
