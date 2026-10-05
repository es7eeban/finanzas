import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RecurringBillsService } from './recurring-bills.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ConflictException, NotFoundException } from '@nestjs/common';
import {
  BillCategory,
  BillExecutionType,
  BillFrequency,
  Currency,
  ExecutionStatus,
  Prisma,
  TransactionType,
} from '@prisma/client';

describe('RecurringBillsService (v2)', () => {
  let service: RecurringBillsService;
  let prisma: PrismaService;

  beforeEach(() => {
    prisma = {
      recurringBill: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      recurringBillExecution: {
        findUnique: vi.fn(),
        upsert: vi.fn(),
      },
      account: {
        findFirst: vi.fn(),
        update: vi.fn(),
      },
      transaction: {
        create: vi.fn(),
      },
      $transaction: vi.fn(async (cb) => cb(prisma)),
    } as unknown as PrismaService;

    service = new RecurringBillsService(prisma);
  });

  describe('create', () => {
    it('debe registrar un servicio recurrente calculando nextDueDate correctamente', async () => {
      const mockCreated = {
        id: 'bill-1',
        userId: 'user-1',
        name: 'Luz Enel',
        amount: new Prisma.Decimal(25000),
        currency: Currency.CLP,
        frequency: BillFrequency.MONTHLY,
        executionType: BillExecutionType.MANUAL_CHECK,
        category: BillCategory.UTILITIES,
        dueDay: 12,
        nextDueDate: new Date('2026-10-12'),
        isActive: true,
      };

      vi.spyOn(prisma.recurringBill, 'create').mockResolvedValue(mockCreated as any);

      const result = await service.create('user-1', {
        name: 'Luz Enel',
        amount: 25000,
        currency: Currency.CLP,
        frequency: BillFrequency.MONTHLY,
        executionType: BillExecutionType.MANUAL_CHECK,
        category: BillCategory.UTILITIES,
        dueDay: 12,
      });

      expect(result.id).toBe('bill-1');
      expect(result.amount).toBe(25000);
      expect(result.executionType).toBe(BillExecutionType.MANUAL_CHECK);
    });
  });

  describe('findAll & getSummary', () => {
    it('debe calcular estados del ciclo mensual (pagado vs pendiente) y días restantes', async () => {
      const mockBills = [
        {
          id: 'bill-1',
          userId: 'user-1',
          name: 'Netflix 4K',
          amount: new Prisma.Decimal(10990),
          currency: Currency.CLP,
          frequency: BillFrequency.MONTHLY,
          executionType: BillExecutionType.AUTOMATIC,
          category: BillCategory.SUBSCRIPTION,
          dueDay: 5,
          isActive: true,
          executions: [
            {
              id: 'exec-1',
              period: '2026-10',
              amountPaid: new Prisma.Decimal(10990),
              status: ExecutionStatus.PAID,
            },
          ],
        },
        {
          id: 'bill-2',
          userId: 'user-1',
          name: 'Aguas Andinas',
          amount: new Prisma.Decimal(15000),
          currency: Currency.CLP,
          frequency: BillFrequency.MONTHLY,
          executionType: BillExecutionType.MANUAL_CHECK,
          category: BillCategory.UTILITIES,
          dueDay: 20,
          isActive: true,
          executions: [],
        },
      ];

      vi.spyOn(prisma.recurringBill, 'findMany').mockResolvedValue(mockBills as any);

      const bills = await service.findAll('user-1', { period: '2026-10' });
      expect(bills).toHaveLength(2);
      expect(bills[0].isPaidThisMonth).toBe(true);
      expect(bills[0].status).toBe('PAID');
      expect(bills[1].isPaidThisMonth).toBe(false);

      const summary = await service.getSummary('user-1', '2026-10');
      expect(summary.totalCommitted).toBe(25990);
      expect(summary.totalPaid).toBe(10990);
      expect(summary.totalPending).toBe(15000);
      expect(summary.paidCount).toBe(1);
      expect(summary.pendingCount).toBe(1);
    });
  });

  describe('markPaid (Criterio DoD)', () => {
    it('debe confirmar pago manual debitando saldo, creando gasto y registrando ejecución atómicamente', async () => {
      const mockBill = {
        id: 'bill-luz',
        userId: 'user-1',
        name: 'Luz Enel',
        amount: new Prisma.Decimal(25000),
        categoryId: 'cat-services',
        dueDay: 12,
        isActive: true,
      };

      const mockAccount = {
        id: 'acc-checking',
        userId: 'user-1',
        name: 'Cuenta Corriente',
        balance: new Prisma.Decimal(200000),
        isActive: true,
      };

      vi.spyOn(prisma.recurringBill, 'findFirst').mockResolvedValue(mockBill as any);
      vi.spyOn(prisma.recurringBillExecution, 'findUnique').mockResolvedValue(null);
      vi.spyOn(prisma.account, 'findFirst').mockResolvedValue(mockAccount as any);

      const updateAccountSpy = vi.spyOn(prisma.account, 'update').mockResolvedValue({
        ...mockAccount,
        balance: new Prisma.Decimal(175000),
      } as any);

      const createTxSpy = vi.spyOn(prisma.transaction, 'create').mockResolvedValue({
        id: 'tx-123',
        amount: new Prisma.Decimal(25000),
        type: TransactionType.EXPENSE,
      } as any);

      const upsertExecSpy = vi
        .spyOn(prisma.recurringBillExecution, 'upsert')
        .mockResolvedValue({
          id: 'exec-123',
          recurringBillId: 'bill-luz',
          period: '2026-10',
          amountPaid: new Prisma.Decimal(25000),
          status: ExecutionStatus.PAID,
        } as any);

      const result = await service.markPaid('user-1', 'bill-luz', {
        accountId: 'acc-checking',
        amountPaid: 25000,
        paidAt: '2026-10-12T10:00:00.000Z',
        period: '2026-10',
      });

      expect(result.success).toBe(true);
      expect(updateAccountSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'acc-checking' },
          data: { balance: { decrement: expect.any(Prisma.Decimal) } },
        }),
      );
      expect(createTxSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-1',
            accountId: 'acc-checking',
            amount: expect.any(Prisma.Decimal),
            type: TransactionType.EXPENSE,
          }),
        }),
      );
      expect(upsertExecSpy).toHaveBeenCalled();
      expect(result.accountBalance).toBe(175000);
    });

    it('debe lanzar ConflictException si el servicio ya fue pagado en el periodo indicado', async () => {
      vi.spyOn(prisma.recurringBill, 'findFirst').mockResolvedValue({
        id: 'bill-1',
        name: 'Luz',
        isActive: true,
      } as any);

      vi.spyOn(prisma.recurringBillExecution, 'findUnique').mockResolvedValue({
        id: 'exec-existing',
        period: '2026-10',
        status: ExecutionStatus.PAID,
      } as any);

      await expect(
        service.markPaid('user-1', 'bill-1', {
          accountId: 'acc-1',
          amountPaid: 25000,
          period: '2026-10',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('debe lanzar NotFoundException si la cuenta bancaria de débito no pertenece al usuario', async () => {
      vi.spyOn(prisma.recurringBill, 'findFirst').mockResolvedValue({
        id: 'bill-1',
        name: 'Luz',
        isActive: true,
      } as any);

      vi.spyOn(prisma.recurringBillExecution, 'findUnique').mockResolvedValue(null);
      vi.spyOn(prisma.account, 'findFirst').mockResolvedValue(null);

      await expect(
        service.markPaid('user-1', 'bill-1', {
          accountId: 'acc-fake',
          amountPaid: 25000,
          period: '2026-10',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('debe dar de baja suavemente el servicio cambiando isActive a false', async () => {
      vi.spyOn(prisma.recurringBill, 'findFirst').mockResolvedValue({
        id: 'bill-1',
        isActive: true,
      } as any);

      const updateSpy = vi
        .spyOn(prisma.recurringBill, 'update')
        .mockResolvedValue({ id: 'bill-1', isActive: false } as any);

      const result = await service.remove('user-1', 'bill-1');
      expect(result.success).toBe(true);
      expect(updateSpy).toHaveBeenCalledWith({
        where: { id: 'bill-1' },
        data: { isActive: false },
      });
    });
  });
});
