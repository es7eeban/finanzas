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

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<AccountWithSavings[]>('/accounts');
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
    const { data } = await api.post<AccountWithSavings>('/accounts', input);
    setAccounts((prev) => [...prev, data]);
    return data;
  };

  return {
    accounts,
    loading,
    error,
    refetch: fetchAccounts,
    createAccount,
  };
}
