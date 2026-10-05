-- CreateEnum
CREATE TYPE "BillFrequency" AS ENUM ('MONTHLY', 'WEEKLY', 'BIWEEKLY', 'ANNUAL');

-- CreateEnum
CREATE TYPE "BillExecutionType" AS ENUM ('AUTOMATIC', 'MANUAL_CHECK');

-- CreateEnum
CREATE TYPE "BillCategory" AS ENUM ('SUBSCRIPTION', 'UTILITIES', 'TELECOM', 'HOUSING', 'EDUCATION', 'INSURANCE', 'OTHER');

-- CreateEnum
CREATE TYPE "ExecutionStatus" AS ENUM ('PAID', 'SKIPPED');

-- CreateTable
CREATE TABLE "recurring_bills" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountId" TEXT,
    "categoryId" TEXT,
    "name" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'CLP',
    "frequency" "BillFrequency" NOT NULL DEFAULT 'MONTHLY',
    "executionType" "BillExecutionType" NOT NULL DEFAULT 'MANUAL_CHECK',
    "category" "BillCategory" NOT NULL DEFAULT 'UTILITIES',
    "dueDay" INTEGER NOT NULL,
    "nextDueDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recurring_bills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recurring_bill_executions" (
    "id" TEXT NOT NULL,
    "recurringBillId" TEXT NOT NULL,
    "transactionId" TEXT,
    "period" TEXT NOT NULL,
    "amountPaid" DECIMAL(14,2) NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "ExecutionStatus" NOT NULL DEFAULT 'PAID',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recurring_bill_executions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "recurring_bills_userId_isActive_idx" ON "recurring_bills"("userId", "isActive");

-- CreateIndex
CREATE INDEX "recurring_bill_executions_period_idx" ON "recurring_bill_executions"("period");

-- CreateIndex
CREATE UNIQUE INDEX "recurring_bill_executions_recurringBillId_period_key" ON "recurring_bill_executions"("recurringBillId", "period");

-- AddForeignKey
ALTER TABLE "recurring_bills" ADD CONSTRAINT "recurring_bills_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_bills" ADD CONSTRAINT "recurring_bills_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_bills" ADD CONSTRAINT "recurring_bills_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_bill_executions" ADD CONSTRAINT "recurring_bill_executions_recurringBillId_fkey" FOREIGN KEY ("recurringBillId") REFERENCES "recurring_bills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_bill_executions" ADD CONSTRAINT "recurring_bill_executions_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
