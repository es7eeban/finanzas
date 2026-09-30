export type Currency = 'CLP' | 'USD';

export type AccountType = 'CHECKING' | 'SAVINGS' | 'CREDIT_CARD' | 'CASH' | 'INVESTMENT';

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

export interface Account {
  id: string;
  name: string;
  institution?: string;
  accountNumber?: string;
  type: AccountType;
  currency: Currency;
  balance: number;
  creditLimit?: number;
  billingCloseDay?: number;
  paymentDueDay?: number;
  color: string;
  icon: string;
  isActive: boolean;
}

export interface SavingGoal {
  id: string;
  targetAccountId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  color: string;
  icon: string;
  status: GoalStatus;
  monthlyPace?: number;
  progressPercentage?: number;
}

export interface Transaction {
  id: string;
  accountId: string;
  destinationAccountId?: string;
  categoryId?: string;
  type: TransactionType;
  amount: number;
  date: string;
  description: string;
  isRecurring: boolean;
}

export interface DebtLoan {
  id: string;
  contactName: string;
  type: DebtType;
  totalAmount: number;
  pendingAmount: number;
  dueDate?: string;
  status: DebtStatus;
  notes?: string;
  daysRemaining?: number;
}
