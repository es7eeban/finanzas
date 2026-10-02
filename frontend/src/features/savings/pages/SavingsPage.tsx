import { useState, useEffect, useCallback } from 'react';
import { api } from '../../../services/api';
import { formatCurrency } from '../../../utils/currency';
import { Card } from '../../../components/common/Card';
import { Badge } from '../../../components/common/Badge';
import { DatePicker } from '../../../components/common/DatePicker';
import {
  Target,
  PlusCircle,
  Clock,
  AlertTriangle,
  X,
} from 'lucide-react';
import type { SavingGoal, Account } from '../../../types';

export const SavingsPage = () => {
  const [goals, setGoals] = useState<SavingGoal[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  // Modales
  const [selectedGoal, setSelectedGoal] = useState<SavingGoal | null>(null);
  const [modalType, setModalType] = useState<'contribute' | 'withdraw' | 'create' | null>(null);

  // Form states
  const [amount, setAmount] = useState('');
  const [noteOrReason, setNoteOrReason] = useState('');
  const [sourceAccountId, setSourceAccountId] = useState('');
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');
  const [newGoalTargetAccount, setNewGoalTargetAccount] = useState('');
  const [newGoalDate, setNewGoalDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [goalsRes, accsRes] = await Promise.all([
        api.get('/savings'),
        api.get('/accounts'),
      ]);
      setGoals(goalsRes.data || []);
      setAccounts((accsRes.data || []).filter((a: Account) => a.isActive));
    } catch (e) {
      console.error('Error al cargar metas', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Totales
  const totalSaved = goals.reduce((sum, g) => sum + g.currentAmount, 0);
  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
  const overallProgress = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

  const handleContribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal || !amount) return;
    setSubmitting(true);
    try {
      await api.post(`/savings/${selectedGoal.id}/contribute`, {
        amount: Number(amount),
        sourceAccountId: sourceAccountId || undefined,
        note: noteOrReason || undefined,
      });
      setModalType(null);
      setAmount('');
      setNoteOrReason('');
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al abonar a la meta');
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal || !amount || !noteOrReason) return;
    setSubmitting(true);
    try {
      await api.post(`/savings/${selectedGoal.id}/withdraw`, {
        amount: Number(amount),
        reason: noteOrReason,
      });
      setModalType(null);
      setAmount('');
      setNoteOrReason('');
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al retirar fondos de la meta');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalName || !newGoalTarget || !newGoalTargetAccount || !newGoalDate) return;
    setSubmitting(true);
    try {
      await api.post('/savings', {
        name: newGoalName,
        targetAmount: Number(newGoalTarget),
        targetAccountId: newGoalTargetAccount,
        targetDate: newGoalDate,
      });
      setModalType(null);
      setNewGoalName('');
      setNewGoalTarget('');
      setNewGoalDate('');
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al crear la meta');
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
            Metas de Ahorro
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Planifica objetivos financieros con cálculo inteligente de ritmo mensual
          </p>
        </div>

        <button
          onClick={() => setModalType('create')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-md shadow-teal-600/20 active:scale-95 transition-all self-start sm:self-auto cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Nueva Meta</span>
        </button>
      </div>

      {/* Resumen General de Ahorro */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5" hoverEffect>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Total Acumulado
          </span>
          <div className="text-2xl font-bold text-teal-600 dark:text-teal-400 mt-2 tabular-nums">
            {formatCurrency(totalSaved, 'CLP')}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            En {goals.length} meta(s) registradas
          </p>
        </Card>

        <Card className="p-5" hoverEffect>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Monto Objetivo Total
          </span>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2 tabular-nums">
            {formatCurrency(totalTarget, 'CLP')}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Falta {formatCurrency(Math.max(0, totalTarget - totalSaved), 'CLP')}
          </p>
        </Card>

        <Card className="p-5" hoverEffect>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Progreso Global
          </span>
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-2 tabular-nums">
            {overallProgress}%
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
            <div
              className="bg-gradient-to-r from-teal-500 to-indigo-500 h-full rounded-full transition-all"
              style={{ width: `${Math.min(100, overallProgress)}%` }}
            />
          </div>
        </Card>
      </div>

      {/* Grid de Metas */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <span>Cargando metas...</span>
        </div>
      ) : goals.length === 0 ? (
        <Card className="p-12 text-center">
          <Target className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No tienes metas de ahorro activas
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-4">
            Crea metas como "Viaje a Brasil", "Fondo de Emergencia" o "Pie para Auto".
          </p>
          <button
            onClick={() => setModalType('create')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Crear meta ahora</span>
          </button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((goal) => {
            const isCompleted = goal.status === 'COMPLETED' || goal.currentAmount >= goal.targetAmount;

            return (
              <Card key={goal.id} className="p-5 flex flex-col justify-between" hoverEffect>
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white">
                        {goal.name}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Resguardado en: <span className="font-medium text-slate-600 dark:text-slate-300">{goal.targetAccount?.name}</span>
                      </p>
                    </div>

                    <Badge variant={isCompleted ? 'emerald' : 'teal'}>
                      {isCompleted ? 'Completada 🎉' : `${goal.progressPercentage || 0}%`}
                    </Badge>
                  </div>

                  {/* Barra de Progreso */}
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden mb-2">
                    <div
                      className="bg-gradient-to-r from-teal-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, goal.progressPercentage || 0)}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-300 font-semibold tabular-nums">
                    <span>{formatCurrency(goal.currentAmount, 'CLP')}</span>
                    <span className="text-slate-400 font-normal">
                      Meta: {formatCurrency(goal.targetAmount, 'CLP')}
                    </span>
                  </div>

                  {/* Pacing Badge / Mensual sugerido */}
                  {!isCompleted && goal.recommendedMonthlyPacing ? (
                    <div className="mt-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs flex items-center justify-between text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-teal-500" />
                        <span>Faltan {goal.monthsRemaining} meses</span>
                      </div>
                      <div className="font-semibold text-teal-600 dark:text-teal-400 tabular-nums">
                        {formatCurrency(goal.recommendedMonthlyPacing, 'CLP')} / mes
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* Acciones Rápidas */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-end gap-2">
                  <button
                    onClick={() => {
                      setSelectedGoal(goal);
                      setModalType('withdraw');
                    }}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Retiro Urgente
                  </button>

                  <button
                    onClick={() => {
                      setSelectedGoal(goal);
                      setModalType('contribute');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>+ Aportar</span>
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal Aporte */}
      {modalType === 'contribute' && selectedGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Aportar a: {selectedGoal.name}
              </h3>
              <button onClick={() => setModalType(null)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleContribute} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Monto a Aportar ($ CLP)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Ej. 50000"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Debitar desde Cuenta (Opcional)
                </label>
                <select
                  value={sourceAccountId}
                  onChange={(e) => setSourceAccountId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs"
                >
                  <option value="">Selecciona cuenta de origen...</option>
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
                  value={noteOrReason}
                  onChange={(e) => setNoteOrReason(e.target.value)}
                  placeholder="Ej. Aporte con bono freelance"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Procesando...' : 'Confirmar Aporte'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Retiro de Emergencia */}
      {modalType === 'withdraw' && selectedGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>Retiro de Emergencia: {selectedGoal.name}</span>
              </h3>
              <button onClick={() => setModalType(null)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Monto a Retirar ($ CLP) - Máx: {formatCurrency(selectedGoal.currentAmount, 'CLP')}
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={selectedGoal.currentAmount}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Ej. 30000"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Motivo o Justificación Obligatoria
                </label>
                <textarea
                  required
                  rows={2}
                  value={noteOrReason}
                  onChange={(e) => setNoteOrReason(e.target.value)}
                  placeholder="Ej. Arreglo urgente de auto o consulta médica"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Procesando retiro...' : 'Confirmar Retiro'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Crear Meta */}
      {modalType === 'create' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Nueva Meta de Ahorro
              </h3>
              <button onClick={() => setModalType(null)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre de la Meta
                </label>
                <input
                  type="text"
                  required
                  value={newGoalName}
                  onChange={(e) => setNewGoalName(e.target.value)}
                  placeholder="Ej. Vacaciones Brasil 2027"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Monto Objetivo ($ CLP)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={newGoalTarget}
                  onChange={(e) => setNewGoalTarget(e.target.value)}
                  placeholder="Ej. 1500000"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Cuenta de Resguardo (Donde residirá el dinero)
                </label>
                <select
                  required
                  value={newGoalTargetAccount}
                  onChange={(e) => setNewGoalTargetAccount(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs"
                >
                  <option value="">Selecciona cuenta...</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.currency})
                    </option>
                  ))}
                </select>
              </div>

              <DatePicker
                label="Fecha Límite"
                required
                value={newGoalDate}
                onChange={setNewGoalDate}
              />

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Creando meta...' : 'Crear Meta'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
