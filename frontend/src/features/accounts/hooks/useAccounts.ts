import { useState, useEffect, useCallback } from 'react';
import { api } from '../../../services/api';
import type { Account, AccountType, Currency } from '../../../types';

export interface AccountWithSavings extends Account {
  reservedInSavings: number;
  availableBalance: number;
  savingGoals?: Array<{
    id: string;
    name: string;
    currentAmount: number;
    targetAmount: number;
    color: string;
    icon: string;
  }>;
}

export interface CreateAccountInput {
  name: string;
  institution?: string;
  accountNumber?: string;
  type: AccountType;
  currency: Currency;
  balance: number;
  creditLimit?: number;
  billingCloseDay?: number;
  paymentDueDay?: number;
  color?: string;
  icon?: string;
}

export function useAccounts() {
  const [accounts, setAccounts] = useState<AccountWithSavings[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAccounts = useCallback(async (includeInactive: boolean = true) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<AccountWithSavings[]>('/accounts', {
        params: { includeInactive: includeInactive ? 'true' : 'false' },
      });
      setAccounts(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar cuentas';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const createAccount = async (input: CreateAccountInput) => {
    try {
      const { data } = await api.post<AccountWithSavings>('/accounts', input);
      setAccounts((prev) => [data, ...prev]);
      return data;
    } catch (err: unknown) {
      // Si Axios devuelve mensaje de error del backend (ej. 409 Conflict)
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        const backendMessage = axiosErr.response?.data?.message;
        if (backendMessage) {
          throw new Error(backendMessage);
        }
      }
      throw err;
    }
  };

  const toggleAccountStatus = async (id: string) => {
    try {
      const { data } = await api.patch<AccountWithSavings>(`/accounts/${id}/toggle-status`);
      setAccounts((prev) =>
        prev.map((acc) => (acc.id === id ? { ...acc, isActive: data.isActive } : acc)),
      );
      return data;
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        const backendMessage = axiosErr.response?.data?.message;
        if (backendMessage) {
          throw new Error(backendMessage);
        }
      }
      throw err;
    }
  };

  return {
    accounts,
    loading,
    error,
    refetch: fetchAccounts,
    createAccount,
    toggleAccountStatus,
  };
}
