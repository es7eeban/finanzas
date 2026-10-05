import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DashboardService } from './dashboard.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AccountType, Currency, GoalStatus, DebtStatus, DebtType, TransactionType } from '@prisma/client';

describe('DashboardService', () => {
  let service: DashboardService;
  let prisma: PrismaService;

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: vi.fn(),
      },
      account: {
        findMany: vi.fn(),
      },
      savingGoal: {
        findMany: vi.fn(),
      },
      debtLoan: {
        findMany: vi.fn(),
      },
      transaction: {
        findMany: vi.fn(),
      },
      recurringBill: {
        findMany: vi.fn(),
      },
    } as unknown as PrismaService;

    service = new DashboardService(prisma);
  });

  describe('getSummary', () => {
    it('debe calcular KPIs de patrimonio líquido, saldo reservado y tasa de ahorro correctamente', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        baseCurrency: Currency.CLP,
      } as any);

      vi.spyOn(prisma.account, 'findMany').mockResolvedValue([
        {
          id: 'acc-1',
          type: AccountType.CHECKING,
          balance: 1000000,
          isActive: true,
        },
        {
          id: 'acc-2',
          type: AccountType.CREDIT_CARD,
          balance: -200000,
          isActive: true,
        },
      ] as any);

      vi.spyOn(prisma.savingGoal, 'findMany').mockResolvedValue([
        {
          id: 'goal-1',
          currentAmount: 300000,
          status: GoalStatus.ACTIVE,
        },
      ] as any);

      vi.spyOn(prisma.debtLoan, 'findMany').mockResolvedValue([
        {
          id: 'debt-1',
          type: DebtType.BORROWED,
          pendingAmount: 150000,
          status: DebtStatus.PENDING,
        },
        {
          id: 'debt-2',
          type: DebtType.LENT,
          pendingAmount: 50000,
          status: DebtStatus.PENDING,
        },
      ] as any);

      vi.spyOn(prisma.transaction, 'findMany').mockResolvedValue([
        {
          type: TransactionType.INCOME,
          amount: 1500000,
        },
        {
          type: TransactionType.EXPENSE,
          amount: 500000,
        },
        {
          type: TransactionType.SAVING_CONTRIBUTION,
          amount: 300000,
        },
      ] as any);

      const summary = await service.getSummary('user-1');

      expect(summary.currency).toBe('CLP');
      expect(summary.totalAssets).toBe(1000000);
      expect(summary.reservedInSavings).toBe(300000);
      // liquidAvailable = totalAssets (1.000.000) - reservedInSavings (300.000) = 700.000
      expect(summary.liquidAvailable).toBe(700000);
      // totalLiabilities = borrowed (150.000) + creditCard debt (200.000) = 350.000
      expect(summary.totalLiabilities).toBe(350000);
      expect(summary.netWorth).toBe(650000); // 1.000.000 - 350.000
      expect(summary.currentMonthIncome).toBe(1500000);
      expect(summary.currentMonthExpense).toBe(500000);
      expect(summary.currentMonthSavings).toBe(300000);
      // savingsRate = 300.000 / 1.500.000 * 100 = 20%
      expect(summary.savingsRate).toBe(20);
    });
  });

  describe('getExpensesByCategory', () => {
    it('debe agrupar gastos por categoría y calcular porcentajes', async () => {
      vi.spyOn(prisma.transaction, 'findMany').mockResolvedValue([
        {
          amount: 60000,
          type: TransactionType.EXPENSE,
          category: { id: 'cat-1', name: 'Supermercado', color: '#E11D48', icon: 'shopping-cart' },
        },
        {
          amount: 40000,
          type: TransactionType.EXPENSE,
          category: { id: 'cat-2', name: 'Transporte', color: '#FB923C', icon: 'car' },
        },
      ] as any);

      const result = await service.getExpensesByCategory('user-1', '2026-10');

      expect(result.totalExpenses).toBe(100000);
      expect(result.categories).toHaveLength(2);
      expect(result.categories[0].name).toBe('Supermercado');
      expect(result.categories[0].amount).toBe(60000);
      expect(result.categories[0].percentage).toBe(60);
      expect(result.categories[1].name).toBe('Transporte');
      expect(result.categories[1].percentage).toBe(40);
    });
  });

  describe('getHistoricalTrend', () => {
    it('debe retornar arreglo con los meses solicitados', async () => {
      vi.spyOn(prisma.transaction, 'findMany').mockResolvedValue([]);

      const result = await service.getHistoricalTrend('user-1', 6);

      expect(result).toHaveLength(6);
      expect(result[0]).toHaveProperty('month');
      expect(result[0]).toHaveProperty('income');
      expect(result[0]).toHaveProperty('expense');
      expect(result[0]).toHaveProperty('savings');
      expect(result[0]).toHaveProperty('net');
    });
  });

  describe('getUpcomingDues', () => {
    it('debe consolidar deudas, tarjetas y pagos recurrentes activos no pagados', async () => {
      vi.spyOn(prisma.debtLoan, 'findMany').mockResolvedValue([
        {
          id: 'debt-1',
          contactName: 'Carlos',
          type: DebtType.BORROWED,
          pendingAmount: 75000,
          dueDate: new Date(2026, 9, 20),
          status: DebtStatus.PENDING,
        },
      ] as any);

      vi.spyOn(prisma.account, 'findMany').mockResolvedValue([
        {
          id: 'cc-1',
          name: 'Visa Signature',
          type: AccountType.CREDIT_CARD,
          balance: -120000,
          paymentDueDay: 25,
          billingCloseDay: 15,
          isActive: true,
        },
      ] as any);

      vi.spyOn(prisma.recurringBill, 'findMany').mockResolvedValue([
        {
          id: 'bill-1',
          name: 'Luz Enel',
          amount: 25000,
          currency: Currency.CLP,
          executionType: 'MANUAL_CHECK',
          category: 'UTILITIES',
          dueDay: 12,
          isActive: true,
          executions: [], // No pagado
        },
        {
          id: 'bill-2',
          name: 'Netflix',
          amount: 10990,
          currency: Currency.CLP,
          executionType: 'AUTOMATIC',
          category: 'SUBSCRIPTION',
          dueDay: 5,
          isActive: true,
          executions: [
            { id: 'exec-1', status: 'PAID' }, // Ya pagado este mes
          ],
        },
      ] as any);

      const dues = await service.getUpcomingDues('user-1');

      // Debe incluir deuda (Carlos), pago tarjeta, corte tarjeta, y Luz Enel
      // Debe excluir Netflix porque ya está pagado este mes
      expect(dues.some((d) => d.title === 'Pagar deuda a Carlos')).toBe(true);
      expect(dues.some((d) => d.id === 'rec-bill-1')).toBe(true);
      expect(dues.some((d) => d.id === 'rec-bill-2')).toBe(false);

      const enelDue = dues.find((d) => d.id === 'rec-bill-1');
      expect(enelDue?.category).toBe('RECURRING_BILL');
      expect(enelDue?.amount).toBe(25000);
      expect(enelDue?.title).toBe('Pagar: Luz Enel');
    });
  });
});
