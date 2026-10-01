export type Currency = 'CLP' | 'USD';

export type AccountType =
  | 'CHECKING'
  | 'SAVINGS'
  | 'CREDIT_CARD'
  | 'CASH'
  | 'INVESTMENT';

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
