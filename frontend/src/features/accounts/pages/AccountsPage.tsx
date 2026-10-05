import { useState } from 'react';
import {
  useAccounts,
  type AccountWithSavings,
  type CreateAccountInput,
  type UpdateAccountInput,
} from '../hooks/useAccounts';
import { AccountCard } from '../components/AccountCard';
import { CreateAccountModal } from '../components/CreateAccountModal';
import { PlusCircle, Landmark, RefreshCw } from 'lucide-react';

export const AccountsPage = () => {
  const { accounts, loading, refetch, createAccount, updateAccount, toggleAccountStatus } =
    useAccounts();
  const [accountFilter, setAccountFilter] = useState<'active' | 'inactive' | 'all'>('active');
  const [isCreateAccountOpen, setIsCreateAccountOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountWithSavings | null>(null);

  const activeAccounts = accounts.filter((a) => a.isActive);
  const inactiveAccounts = accounts.filter((a) => !a.isActive);

  const displayedAccounts =
    accountFilter === 'active'
      ? activeAccounts
      : accountFilter === 'inactive'
      ? inactiveAccounts
      : accounts;

  const handleCreate = async (input: CreateAccountInput) => {
    await createAccount(input);
  };

  const handleUpdate = async (id: string, input: UpdateAccountInput) => {
    await updateAccount(id, input);
  };

  const openCreateModal = () => {
    setEditingAccount(null);
    setIsCreateAccountOpen(true);
  };

  const openEditModal = (account: AccountWithSavings) => {
    setEditingAccount(account);
    setIsCreateAccountOpen(true);
  };

  const closeModal = () => {
    setIsCreateAccountOpen(false);
    setEditingAccount(null);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Cuentas, Billeteras & Tarjetas
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Administra tus cuentas corrientes, de ahorro, efectivo y tarjetas de crédito
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 active:scale-95 transition-all self-start sm:self-auto cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Nueva Cuenta</span>
        </button>
      </div>

      {/* Barra de Filtro y Estado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setAccountFilter('active')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              accountFilter === 'active'
                ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Activas ({activeAccounts.length})
          </button>
          <button
            onClick={() => setAccountFilter('inactive')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              accountFilter === 'inactive'
                ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Inactivas ({inactiveAccounts.length})
          </button>
          <button
            onClick={() => setAccountFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              accountFilter === 'all'
                ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Todas ({accounts.length})
          </button>
        </div>

        <button
          onClick={() => refetch(true)}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors self-end sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Grid de Cuentas */}
      {displayedAccounts.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-12 text-center">
          <Landmark className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            {accountFilter === 'inactive'
              ? 'No tienes cuentas inactivas'
              : 'No se encontraron cuentas'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-4">
            {accountFilter === 'inactive'
              ? 'Las cuentas que desactives aparecerán aquí.'
              : 'Agrega tu primera cuenta bancaria o tarjeta para comenzar a gestionar tus fondos.'}
          </p>
          {accountFilter !== 'inactive' && (
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Crear cuenta ahora</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedAccounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              onToggleStatus={toggleAccountStatus}
              onEdit={openEditModal}
            />
          ))}
        </div>
      )}

      {/* Modal de Creación / Edición */}
      <CreateAccountModal
        isOpen={isCreateAccountOpen}
        onClose={closeModal}
        onSubmit={handleCreate}
        account={editingAccount}
        onUpdate={handleUpdate}
      />
    </div>
  );
};
