import { Injectable, Optional } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { TransactionType, GoalStatus, DebtStatus, DebtType, AccountType, Currency } from '@prisma/client';
import { ExchangeRateService } from '../exchange-rate/exchange-rate.service.js';

export interface CategoryExpense {
  categoryId: string | null;
  name: string;
  color: string;
  icon: string;
  amount: number;
  percentage: number;
}

export interface MonthlyTrend {
  month: string;
  yearMonth: string;
  income: number;
  expense: number;
  savings: number;
  net: number;
}

export interface UpcomingDueItem {
  id: string;
  title: string;
  category:
    | 'DEBT_PAYABLE'
    | 'DEBT_RECEIVABLE'
    | 'CREDIT_CARD_CUTOFF'
    | 'CREDIT_CARD_DUE'
    | 'RECURRING_BILL'
    | 'RECURRING_AUTOMATIC';
  amount?: number;
  dueDate: string;
  daysRemaining: number;
  urgency: 'overdue' | 'today' | 'urgent' | 'upcoming';
  status: string;
  currency?: Currency;
  executionType?: 'AUTOMATIC' | 'MANUAL_CHECK';
  billCategory?: string;
}

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly exchangeRateService?: ExchangeRateService,
  ) {}

  /**
   * Resumen de KPIs financieros principales
   */
  async getSummary(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { baseCurrency: true },
    });

    const currency = user?.baseCurrency || 'CLP';

    let usdRate = 1;
    if (this.exchangeRateService) {
      try {
        const rateData = await this.exchangeRateService.getCurrentRate('USD', 'CLP');
        usdRate = rateData.rate;
      } catch {
        usdRate = 950;
      }
    }

    const toBaseCurrency = (amount: number, accountCurrency: Currency) => {
      if (accountCurrency === currency) return amount;
      if (currency === Currency.CLP && accountCurrency === Currency.USD) {
        return Math.round(amount * usdRate);
      }
      if (currency === Currency.USD && accountCurrency === Currency.CLP) {
        return Number((amount / usdRate).toFixed(2));
      }
      return amount;
    };

    // 1. Cuentas activas
    const accounts = await this.prisma.account.findMany({
      where: { userId, isActive: true },
    });

    // 2. Metas de ahorro activas
    const activeGoals = await this.prisma.savingGoal.findMany({
      where: { userId, status: GoalStatus.ACTIVE },
    });

    const reservedInSavings = activeGoals.reduce(
      (sum, g) => sum + Number(g.currentAmount),
      0,
    );

    // Cuentas de pasivo: tarjetas de crédito y cuentas de préstamo (v2)
    const liabilityTypes: AccountType[] = [AccountType.CREDIT_CARD, AccountType.LOAN_ACCOUNT];
    const isLiabilityAccount = (type: AccountType) => liabilityTypes.includes(type);

    // Activos no de crédito (cuentas corrientes, vista, ahorros, efectivo)
    const assetAccounts = accounts.filter((a) => !isLiabilityAccount(a.type));
    const totalAssets = assetAccounts.reduce(
      (sum, a) => sum + toBaseCurrency(Number(a.balance), a.currency),
      0,
    );
    const liquidAvailable = Math.max(0, totalAssets - reservedInSavings);

    // Deudas por pagar (Pasivos)
    const pendingDebts = await this.prisma.debtLoan.findMany({
      where: {
        userId,
        status: { in: [DebtStatus.PENDING, DebtStatus.PARTIALLY_PAID] },
      },
    });

    const totalBorrowedPending = pendingDebts
      .filter((d) => d.type === DebtType.BORROWED)
      .reduce((sum, d) => sum + Number(d.pendingAmount), 0);

    const totalLentPending = pendingDebts
      .filter((d) => d.type === DebtType.LENT)
      .reduce((sum, d) => sum + Number(d.pendingAmount), 0);

    // Saldo adeudado en tarjetas de crédito y préstamos (balance negativo)
    const creditCards = accounts.filter((a) => isLiabilityAccount(a.type));
    const creditDebt = creditCards.reduce((sum, a) => {
      const bal = Number(a.balance);
      const positiveDebt = bal < 0 ? Math.abs(bal) : 0;
      return sum + toBaseCurrency(positiveDebt, a.currency);
    }, 0);

    const totalLiabilities = totalBorrowedPending + creditDebt;
    const netWorth = totalAssets - totalLiabilities;

    // 3. Métricas del mes en curso
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const monthTransactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: startOfMonth, lte: endOfMonth },
      },
    });

    let currentMonthIncome = 0;
    let currentMonthExpense = 0;
    let currentMonthSavings = 0;

    for (const tx of monthTransactions) {
      const amt = Number(tx.amount);
      if (tx.type === TransactionType.INCOME) {
        currentMonthIncome += amt;
      } else if (
        tx.type === TransactionType.EXPENSE ||
        tx.type === TransactionType.DEBT_PAYMENT
      ) {
        currentMonthExpense += amt;
      } else if (tx.type === TransactionType.SAVING_CONTRIBUTION) {
        currentMonthSavings += amt;
      }
    }

    const savingsRate =
      currentMonthIncome > 0
        ? Math.round((currentMonthSavings / currentMonthIncome) * 100)
        : 0;

    return {
      currency,
      netWorth,
      liquidAvailable,
      reservedInSavings,
      totalAssets,
      totalLiabilities,
      creditDebt,
      totalBorrowedPending,
      totalLentPending,
      currentMonthIncome,
      currentMonthExpense,
      currentMonthSavings,
      savingsRate,
      activeAccountsCount: accounts.length,
      activeGoalsCount: activeGoals.length,
      usdToClpRate: usdRate,
    };
  }

  /**
   * Desglose de gastos por categoría (Donut Chart)
   */
  async getExpensesByCategory(userId: string, monthStr?: string) {
    let startOfMonth: Date;
    let endOfMonth: Date;
    let targetYear: number;
    let targetMonth: number;

    if (monthStr && /^\d{4}-\d{2}$/.test(monthStr)) {
      const [y, m] = monthStr.split('-').map(Number);
      targetYear = y;
      targetMonth = m - 1;
    } else {
      const now = new Date();
      targetYear = now.getFullYear();
      targetMonth = now.getMonth();
    }

    startOfMonth = new Date(targetYear, targetMonth, 1, 0, 0, 0, 0);
    endOfMonth = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

    const expenseTransactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        type: { in: [TransactionType.EXPENSE, TransactionType.DEBT_PAYMENT] },
        date: { gte: startOfMonth, lte: endOfMonth },
      },
      include: {
        category: true,
      },
    });

    const categoryMap = new Map<string, { name: string; color: string; icon: string; amount: number }>();
    let totalExpenses = 0;

    for (const tx of expenseTransactions) {
      const amt = Number(tx.amount);
      totalExpenses += amt;

      const catKey = tx.category?.id || 'sin_categoria';
      const catName = tx.category?.name || 'Sin categoría';
      const catColor = tx.category?.color || '#94A3B8';
      const catIcon = tx.category?.icon || 'tag';

      if (!categoryMap.has(catKey)) {
        categoryMap.set(catKey, {
          name: catName,
          color: catColor,
          icon: catIcon,
          amount: 0,
        });
      }

      const item = categoryMap.get(catKey)!;
      item.amount += amt;
    }

    const categories: CategoryExpense[] = Array.from(categoryMap.entries())
      .map(([id, data]) => ({
        categoryId: id === 'sin_categoria' ? null : id,
        name: data.name,
        color: data.color,
        icon: data.icon,
        amount: data.amount,
        percentage: totalExpenses > 0 ? Math.round((data.amount / totalExpenses) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    const monthFormatted = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}`;

    return {
      month: monthFormatted,
      totalExpenses,
      categories,
    };
  }

  /**
   * Tendencia histórica comparativa de los últimos N meses (Bar Chart)
   */
  async getHistoricalTrend(userId: string, monthsCount = 6): Promise<MonthlyTrend[]> {
    const months = Math.min(Math.max(monthsCount, 1), 12);
    const now = new Date();
    const result: MonthlyTrend[] = [];

    const monthNames = [
      'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
    ];

    // Iterar desde (months - 1) meses atrás hasta el mes actual
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth();

      const start = new Date(year, month, 1, 0, 0, 0, 0);
      const end = new Date(year, month + 1, 0, 23, 59, 59, 999);

      const txs = await this.prisma.transaction.findMany({
        where: {
          userId,
          date: { gte: start, lte: end },
        },
      });

      let income = 0;
      let expense = 0;
      let savings = 0;

      for (const t of txs) {
        const amt = Number(t.amount);
        if (t.type === TransactionType.INCOME) {
          income += amt;
        } else if (
          t.type === TransactionType.EXPENSE ||
          t.type === TransactionType.DEBT_PAYMENT
        ) {
          expense += amt;
        } else if (t.type === TransactionType.SAVING_CONTRIBUTION) {
          savings += amt;
        }
      }

      result.push({
        month: monthNames[month],
        yearMonth: `${year}-${String(month + 1).padStart(2, '0')}`,
        income,
        expense,
        savings,
        net: income - expense,
      });
    }

    return result;
  }

  /**
   * Próximos compromisos y vencimientos (Deudas y Tarjetas)
   */
  async getUpcomingDues(userId: string): Promise<UpcomingDueItem[]> {
    const items: UpcomingDueItem[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Deudas con fecha de vencimiento
    const debts = await this.prisma.debtLoan.findMany({
      where: {
        userId,
        status: { in: [DebtStatus.PENDING, DebtStatus.PARTIALLY_PAID] },
        dueDate: { not: null },
      },
      orderBy: { dueDate: 'asc' },
      take: 10,
    });

    for (const d of debts) {
      if (!d.dueDate) continue;

      const due = new Date(d.dueDate);
      due.setHours(0, 0, 0, 0);
      const diffMs = due.getTime() - today.getTime();
      const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      let urgency: UpcomingDueItem['urgency'] = 'upcoming';
      if (daysRemaining < 0) urgency = 'overdue';
      else if (daysRemaining === 0) urgency = 'today';
      else if (daysRemaining <= 7) urgency = 'urgent';

      items.push({
        id: d.id,
        title:
          d.type === DebtType.BORROWED
            ? `Pagar deuda a ${d.contactName}`
            : `Cobrar préstamo a ${d.contactName}`,
        category:
          d.type === DebtType.BORROWED
            ? 'DEBT_PAYABLE'
            : 'DEBT_RECEIVABLE',
        amount: Number(d.pendingAmount),
        dueDate: d.dueDate.toISOString(),
        daysRemaining,
        urgency,
        status: d.status,
      });
    }

    // 2. Tarjetas de crédito con días de corte y pago en el mes
    const creditCards = await this.prisma.account.findMany({
      where: {
        userId,
        type: AccountType.CREDIT_CARD,
        isActive: true,
      },
    });

    const currentDay = today.getDate();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    for (const cc of creditCards) {
      // Día de pago
      if (cc.paymentDueDay) {
        const dueDate = new Date(currentYear, currentMonth, cc.paymentDueDay);
        // Si el día de pago ya pasó este mes, calcular para el próximo
        if (cc.paymentDueDay < currentDay) {
          dueDate.setMonth(currentMonth + 1);
        }
        const diffMs = dueDate.getTime() - today.getTime();
        const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (daysRemaining <= 20) {
          items.push({
            id: `cc-pay-${cc.id}`,
            title: `Pago Tarjeta: ${cc.name}`,
            category: 'CREDIT_CARD_DUE',
            amount: Number(cc.balance) < 0 ? Math.abs(Number(cc.balance)) : 0,
            dueDate: dueDate.toISOString(),
            daysRemaining,
            urgency:
              daysRemaining === 0
                ? 'today'
                : daysRemaining <= 5
                ? 'urgent'
                : 'upcoming',
            status: 'PENDING',
          });
        }
      }

      // Día de corte
      if (cc.billingCloseDay) {
        const cutoffDate = new Date(currentYear, currentMonth, cc.billingCloseDay);
        if (cc.billingCloseDay < currentDay) {
          cutoffDate.setMonth(currentMonth + 1);
        }
        const diffMs = cutoffDate.getTime() - today.getTime();
        const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (daysRemaining <= 15) {
          items.push({
            id: `cc-cut-${cc.id}`,
            title: `Corte de Facturación: ${cc.name}`,
            category: 'CREDIT_CARD_CUTOFF',
            dueDate: cutoffDate.toISOString(),
            daysRemaining,
            urgency:
              daysRemaining === 0
                ? 'today'
                : daysRemaining <= 3
                ? 'urgent'
                : 'upcoming',
            status: 'PENDING',
          });
        }
      }
    }

    // 3. Pagos recurrentes activos (Fase 2.5)
    const currentPeriod = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    const recurringBills = await this.prisma.recurringBill.findMany({
      where: {
        userId,
        isActive: true,
      },
      include: {
        executions: {
          where: {
            period: currentPeriod,
          },
        },
      },
    });

    for (const bill of recurringBills) {
      // Si ya fue pagado en este ciclo mensual, no debe alertar como pendiente
      const isPaidThisMonth = bill.executions.some(
        (exec) => exec.status === 'PAID',
      );
      if (isPaidThisMonth) continue;

      // Calcular fecha de vencimiento para el ciclo actual
      const cycleDueDate = new Date(currentYear, currentMonth, bill.dueDay);
      cycleDueDate.setHours(0, 0, 0, 0);

      const diffMs = cycleDueDate.getTime() - today.getTime();
      const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      let urgency: UpcomingDueItem['urgency'] = 'upcoming';
      if (daysRemaining < 0) urgency = 'overdue';
      else if (daysRemaining === 0) urgency = 'today';
      else if (daysRemaining <= 5) urgency = 'urgent';

      const isAuto = bill.executionType === 'AUTOMATIC';
      const category: UpcomingDueItem['category'] = isAuto
        ? 'RECURRING_AUTOMATIC'
        : 'RECURRING_BILL';

      items.push({
        id: `rec-${bill.id}`,
        title: isAuto ? `Cargo PAT: ${bill.name}` : `Pagar: ${bill.name}`,
        category,
        amount: Number(bill.amount),
        currency: bill.currency,
        dueDate: cycleDueDate.toISOString(),
        daysRemaining,
        urgency,
        status:
          daysRemaining < 0
            ? 'OVERDUE'
            : daysRemaining === 0
            ? 'DUE_TODAY'
            : 'PENDING',
        executionType: bill.executionType,
        billCategory: bill.category,
      });
    }

    return items.sort((a, b) => a.daysRemaining - b.daysRemaining);
  }

  /**
   * Endpoint agregado consolidado para el Dashboard
   */
  async getAggregatedDashboard(userId: string) {
    const [summary, expensesByCategory, historicalTrend, upcomingDues, priorityGoals] =
      await Promise.all([
        this.getSummary(userId),
        this.getExpensesByCategory(userId),
        this.getHistoricalTrend(userId, 6),
        this.getUpcomingDues(userId),
        this.prisma.savingGoal.findMany({
          where: { userId, status: GoalStatus.ACTIVE },
          orderBy: { targetDate: 'asc' },
          take: 3,
          include: {
            targetAccount: {
              select: { id: true, name: true, currency: true },
            },
          },
        }),
      ]);

    const formattedPriorityGoals = priorityGoals.map((g) => {
      const cur = Number(g.currentAmount);
      const tar = Number(g.targetAmount);
      return {
        ...g,
        currentAmount: cur,
        targetAmount: tar,
        progressPercentage: tar > 0 ? Math.min(100, Math.round((cur / tar) * 100)) : 0,
      };
    });

    return {
      kpis: summary,
      expensesByCategory,
      historicalTrend,
      upcomingDues,
      priorityGoals: formattedPriorityGoals,
    };
  }
}
