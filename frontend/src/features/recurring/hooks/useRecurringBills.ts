import { useState, useEffect, useCallback } from 'react';
import { api } from '../../../services/api';
import type {
  RecurringBill,
  RecurringBillsSummary,
  BillCategory,
  BillExecutionType,
  BillFrequency,
  Currency,
} from '../../../types';

export interface CreateRecurringBillInput {
  name: string;
  amount: number;
  currency?: Currency;
  frequency?: BillFrequency;
  executionType: BillExecutionType;
  category: BillCategory;
  dueDay: number;
  accountId?: string;
  categoryId?: string;
  notes?: string;
}

export interface UpdateRecurringBillInput {
  name?: string;
  amount?: number;
  currency?: Currency;
  frequency?: BillFrequency;
  executionType?: BillExecutionType;
  category?: BillCategory;
  dueDay?: number;
  accountId?: string | null;
  categoryId?: string | null;
  notes?: string | null;
}

export interface MarkPaidInput {
  accountId: string;
  amountPaid: number;
  paidAt?: string;
  period?: string;
  notes?: string;
}

const getCurrentPeriod = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

export function useRecurringBills(initialPeriod?: string) {
  const [period, setPeriod] = useState<string>(initialPeriod || getCurrentPeriod());
  const [bills, setBills] = useState<RecurringBill[]>([]);
  const [summary, setSummary] = useState<RecurringBillsSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBillsAndSummary = useCallback(async (targetPeriod?: string) => {
    const p = targetPeriod || period;
    setLoading(true);
    setError(null);
    try {
      const [billsRes, summaryRes] = await Promise.all([
        api.get<RecurringBill[]>('/recurring-bills', { params: { period: p } }),
        api.get<RecurringBillsSummary>('/recurring-bills/summary', { params: { period: p } }),
      ]);
      setBills(billsRes.data);
      setSummary(summaryRes.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar servicios recurrentes';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchBillsAndSummary(period);
  }, [fetchBillsAndSummary, period]);

  const createBill = async (input: CreateRecurringBillInput) => {
    try {
      const { data } = await api.post<RecurringBill>('/recurring-bills', input);
      await fetchBillsAndSummary(period);
      return data;
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        const backendMessage = axiosErr.response?.data?.message;
        if (backendMessage) throw new Error(backendMessage);
      }
      throw err;
    }
  };

  const updateBill = async (id: string, input: UpdateRecurringBillInput) => {
    try {
      const { data } = await api.patch<RecurringBill>(`/recurring-bills/${id}`, input);
      await fetchBillsAndSummary(period);
      return data;
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        const backendMessage = axiosErr.response?.data?.message;
        if (backendMessage) throw new Error(backendMessage);
      }
      throw err;
    }
  };

  const markPaid = async (id: string, input: MarkPaidInput) => {
    try {
      await api.post(`/recurring-bills/${id}/mark-paid`, {
        ...input,
        period: input.period || period,
      });
      await fetchBillsAndSummary(period);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        const backendMessage = axiosErr.response?.data?.message;
        if (backendMessage) throw new Error(backendMessage);
      }
      throw err;
    }
  };

  const deleteBill = async (id: string) => {
    try {
      await api.delete(`/recurring-bills/${id}`);
      setBills((prev) => prev.filter((b) => b.id !== id));
      if (summary) {
        setSummary({
          ...summary,
          totalBills: Math.max(0, summary.totalBills - 1),
        });
      }
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        const backendMessage = axiosErr.response?.data?.message;
        if (backendMessage) throw new Error(backendMessage);
      }
      throw err;
    }
  };

  return {
    period,
    setPeriod,
    bills,
    summary,
    loading,
    error,
    refetch: () => fetchBillsAndSummary(period),
    createBill,
    updateBill,
    markPaid,
    deleteBill,
  };
}
