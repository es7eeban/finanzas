import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DebtsService } from './debts.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { BadRequestException } from '@nestjs/common';
import { DebtType, DebtStatus, Prisma } from '@prisma/client';

describe('DebtsService', () => {
  let service: DebtsService;
  let prisma: PrismaService;

  beforeEach(() => {
    prisma = {
      account: {
        findFirst: vi.fn(),
        update: vi.fn(),
      },
      debtLoan: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      debtPayment: {
        create: vi.fn(),
      },
      transaction: {
        create: vi.fn(),
      },
      $transaction: vi.fn(async (cb: (tx: any) => Promise<any>) => {
        return cb(prisma);
      }),
    } as unknown as PrismaService;

    service = new DebtsService(prisma);
  });

  describe('create', () => {
    it('debe registrar un préstamo con sus métricas iniciales calculadas', async () => {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 5);

      vi.spyOn(prisma.debtLoan, 'create').mockResolvedValue({
        id: 'debt-1',
        userId: 'user-1',
        contactName: 'Carlos Morales',
        type: DebtType.LENT,
        totalAmount: new Prisma.Decimal(100000),
        pendingAmount: new Prisma.Decimal(100000),
        dueDate,
        status: DebtStatus.PENDING,
        notes: 'Préstamo amigo',
      } as any);

      const result = await service.create('user-1', {
        contactName: 'Carlos Morales',
        type: DebtType.LENT,
        totalAmount: 100000,
        dueDate: dueDate.toISOString(),
      });

      expect(result.id).toBe('debt-1');
      expect(result.totalAmount).toBe(100000);
      expect(result.pendingAmount).toBe(100000);
      expect(result.paidAmount).toBe(0);
      expect(result.progressPercentage).toBe(0);
      expect(result.urgency).toBe('due_soon');
      expect(result.isOverdue).toBe(false);
    });

    it('debe debitar de la cuenta si se indica accountId al prestar dinero (LENT)', async () => {
      vi.spyOn(prisma.account, 'findFirst').mockResolvedValue({
        id: 'acc-1',
        userId: 'user-1',
        balance: new Prisma.Decimal(500000),
        isActive: true,
      } as any);

      vi.spyOn(prisma.account, 'update').mockResolvedValue({} as any);
      vi.spyOn(prisma.transaction, 'create').mockResolvedValue({ id: 'tx-disburse' } as any);

      vi.spyOn(prisma.debtLoan, 'create').mockResolvedValue({
        id: 'debt-2',
        userId: 'user-1',
        contactName: 'Pedro Pascal',
        type: DebtType.LENT,
        totalAmount: new Prisma.Decimal(50000),
        pendingAmount: new Prisma.Decimal(50000),
        dueDate: null,
        status: DebtStatus.PENDING,
      } as any);

      const result = await service.create('user-1', {
        contactName: 'Pedro Pascal',
        type: DebtType.LENT,
        totalAmount: 50000,
        accountId: 'acc-1',
      });

      expect(prisma.account.update).toHaveBeenCalledWith({
        where: { id: 'acc-1' },
        data: { balance: { decrement: new Prisma.Decimal(50000) } },
      });
      expect(result.disbursementTransactionId).toBe('tx-disburse');
    });
  });

  describe('addPayment', () => {
    it('debe registrar un abono parcial y actualizar pendingAmount y estado', async () => {
      vi.spyOn(prisma.debtLoan, 'findFirst').mockResolvedValue({
        id: 'debt-1',
        userId: 'user-1',
        contactName: 'Carlos Morales',
        type: DebtType.LENT,
        totalAmount: new Prisma.Decimal(100000),
        pendingAmount: new Prisma.Decimal(100000),
        status: DebtStatus.PENDING,
        dueDate: null,
      } as any);

      vi.spyOn(prisma.debtLoan, 'update').mockResolvedValue({
        id: 'debt-1',
        totalAmount: new Prisma.Decimal(100000),
        pendingAmount: new Prisma.Decimal(60000),
        status: DebtStatus.PARTIALLY_PAID,
        dueDate: null,
      } as any);

      vi.spyOn(prisma.debtPayment, 'create').mockResolvedValue({
        id: 'pay-1',
        amount: new Prisma.Decimal(40000),
        note: 'Primer pago',
      } as any);

      const result = await service.addPayment('user-1', 'debt-1', {
        amount: 40000,
        note: 'Primer pago',
      });

      expect(result.pendingAmount).toBe(60000);
      expect(result.paidAmount).toBe(40000);
      expect(result.progressPercentage).toBe(40);
      expect(result.status).toBe(DebtStatus.PARTIALLY_PAID);
    });

    it('debe marcar como PAID cuando el abono cubre la totalidad de la deuda', async () => {
      vi.spyOn(prisma.debtLoan, 'findFirst').mockResolvedValue({
        id: 'debt-1',
        userId: 'user-1',
        contactName: 'Carlos Morales',
        type: DebtType.LENT,
        totalAmount: new Prisma.Decimal(50000),
        pendingAmount: new Prisma.Decimal(50000),
        status: DebtStatus.PENDING,
        dueDate: null,
      } as any);

      vi.spyOn(prisma.debtLoan, 'update').mockResolvedValue({
        id: 'debt-1',
        totalAmount: new Prisma.Decimal(50000),
        pendingAmount: new Prisma.Decimal(0),
        status: DebtStatus.PAID,
        dueDate: null,
      } as any);

      vi.spyOn(prisma.debtPayment, 'create').mockResolvedValue({
        id: 'pay-2',
        amount: new Prisma.Decimal(50000),
      } as any);

      const result = await service.addPayment('user-1', 'debt-1', {
        amount: 50000,
      });

      expect(result.pendingAmount).toBe(0);
      expect(result.status).toBe(DebtStatus.PAID);
      expect(result.progressPercentage).toBe(100);
    });

    it('debe lanzar BadRequestException si la deuda ya estaba completamente pagada', async () => {
      vi.spyOn(prisma.debtLoan, 'findFirst').mockResolvedValue({
        id: 'debt-paid',
        userId: 'user-1',
        status: DebtStatus.PAID,
      } as any);

      await expect(
        service.addPayment('user-1', 'debt-paid', {
          amount: 10000,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
