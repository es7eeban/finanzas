export type Currency = 'CLP' | 'USD';

export type AccountType =
  | 'CHECKING'
  | 'SIGHT_ACCOUNT'
  | 'SAVINGS'
  | 'CREDIT_CARD'
  | 'CASH'
  | 'INVESTMENT'
  | 'LOAN_ACCOUNT';

export type TransactionType =
  | 'INCOME'
  | 'EXPENSE'
  | 'TRANSFER'
  | 'SAVING_CONTRIBUTION'
  | 'SAVING_WITHDRAWAL'
  | 'DEBT_PAYMENT';

export type GoalStatus = 'ACTIVE' | 'COMPLETED' | 'PAUSED';

export type DebtType = 'LENT' | 'BORROWED';

export type DebtStatus = 'PENDING' | 'PARTIALLY_PAID' | 'PAID';

export type BillFrequency = 'MONTHLY' | 'WEEKLY' | 'BIWEEKLY' | 'ANNUAL';

export type BillExecutionType = 'AUTOMATIC' | 'MANUAL_CHECK';

export type BillCategory =
  | 'SUBSCRIPTION'
  | 'UTILITIES'
  | 'TELECOM'
  | 'HOUSING'
  | 'EDUCATION'
  | 'INSURANCE'
  | 'OTHER';

export type ExecutionStatus = 'PAID' | 'SKIPPED';

export type RecurringBillStatus = 'PAID' | 'DUE_SOON' | 'PENDING' | 'OVERDUE';


export interface Category {
  id: string;
  userId?: string | null;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  icon: string;
  color: string;
}

export interface Account {
  id: string;
  name: string;
  institution?: string | null;
  institutionCode?: string | null;
  description?: string | null;
  accountNumber?: string | null;
  type: AccountType;
  currency: Currency;
  balance: number;
  creditLimit?: number | null;
  billingCloseDay?: number | null;
  paymentDueDay?: number | null;
  color: string;
  icon: string;
  isActive: boolean;
  reservedInSavings?: number;
  availableBalance?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface SavingGoal {
  id: string;
  userId?: string;
  targetAccountId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  color: string;
  icon: string;
  status: GoalStatus;
  targetAccount?: Account;
  progressPercentage?: number;
  remainingAmount?: number;
  daysRemaining?: number;
  monthsRemaining?: number;
  recommendedMonthlyPacing?: number;
  pacingStatus?: 'on_track' | 'ahead' | 'behind' | 'completed';
  contributionsCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Transaction {
  id: string;
  userId?: string;
  accountId: string;
  destinationAccountId?: string | null;
  categoryId?: string | null;
  type: TransactionType;
  amount: number;
  date: string;
  description: string;
  isRecurring: boolean;
  recurrenceRule?: string | null;
  account?: Account;
  destinationAccount?: Account | null;
  category?: Category | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface DebtLoan {
  id: string;
  userId?: string;
  contactName: string;
  type: DebtType;
  totalAmount: number;
  pendingAmount: number;
  dueDate?: string | null;
  status: DebtStatus;
  notes?: string | null;
  paidAmount?: number;
  progressPercentage?: number;
  daysUntilDue?: number | null;
  isOverdue?: boolean;
  urgency?: 'normal' | 'due_soon' | 'overdue';
  paymentsCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  baseCurrency: Currency;
}

export interface DashboardKPIs {
  currency: Currency;
  netWorth: number;
  liquidAvailable: number;
  reservedInSavings: number;
  totalAssets: number;
  totalLiabilities: number;
  creditDebt: number;
  totalBorrowedPending: number;
  totalLentPending: number;
  currentMonthIncome: number;
  currentMonthExpense: number;
  currentMonthSavings: number;
  savingsRate: number;
  activeAccountsCount: number;
  activeGoalsCount: number;
  usdToClpRate?: number;
}

export interface ExchangeRateData {
  from: string;
  to: string;
  rate: number;
  source: string;
  fetchedAt: string;
  expiresAt: string;
  isFallback?: boolean;
}

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
  executionType?: BillExecutionType;
  billCategory?: BillCategory;
}

export interface DashboardData {
  kpis: DashboardKPIs;
  expensesByCategory: {
    month: string;
    totalExpenses: number;
    categories: CategoryExpense[];
  };
  historicalTrend: MonthlyTrend[];
  upcomingDues: UpcomingDueItem[];
  priorityGoals: SavingGoal[];
}

export interface RecurringBillExecution {
  id: string;
  recurringBillId: string;
  transactionId?: string | null;
  period: string;
  amountPaid: number;
  paidAt: string;
  status: ExecutionStatus;
  notes?: string | null;
  createdAt?: string;
}

export interface RecurringBill {
  id: string;
  userId: string;
  accountId?: string | null;
  categoryId?: string | null;
  name: string;
  amount: number;
  currency: Currency;
  frequency: BillFrequency;
  executionType: BillExecutionType;
  category: BillCategory;
  dueDay: number;
  nextDueDate: string;
  isActive: boolean;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
  account?: Partial<Account> | null;
  categoryRel?: Partial<Category> | null;
  isPaidThisMonth?: boolean;
  daysRemaining?: number;
  isOverdue?: boolean;
  status?: RecurringBillStatus;
  targetPeriod?: string;
  cycleDueDate?: string;
  currentExecution?: RecurringBillExecution | null;
}

export interface RecurringBillsSummary {
  period: string;
  totalCommitted: number;
  totalPaid: number;
  totalPending: number;
  totalBills: number;
  paidCount: number;
  pendingCount: number;
}


