import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TransactionsService } from './transactions.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { TransactionType, Prisma } from '@prisma/client';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let prisma: PrismaService;

  beforeEach(() => {
    prisma = {
      account: {
        findFirst: vi.fn(),
        update: vi.fn(),
        findUnique: vi.fn(),
      },
      category: {
        findFirst: vi.fn(),
      },
      transaction: {
        create: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
        count: vi.fn(),
        delete: vi.fn(),
      },
      $transaction: vi.fn(async (cb: (tx: any) => Promise<any>) => {
        return cb(prisma);
      }),
    } as unknown as PrismaService;

    service = new TransactionsService(prisma);
  });

  describe('create - EXPENSE', () => {
    it('debe registrar un gasto y decrementar el saldo de la cuenta', async () => {
      vi.spyOn(prisma.account, 'findFirst').mockResolvedValue({
        id: 'acc-1',
        userId: 'user-1',
        balance: new Prisma.Decimal(50000),
        isActive: true,
      } as any);

      vi.spyOn(prisma.transaction, 'create').mockResolvedValue({
        id: 'tx-1',
        userId: 'user-1',
        accountId: 'acc-1',
        destinationAccountId: null,
        categoryId: null,
        type: TransactionType.EXPENSE,
        amount: new Prisma.Decimal(10000),
        date: new Date(),
        description: 'Supermercado',
        isRecurring: false,
        recurrenceRule: null,
        account: {
          id: 'acc-1',
          name: 'Cuenta Corriente',
          currency: 'CLP',
          color: '#3B82F6',
          icon: 'wallet',
          balance: new Prisma.Decimal(40000),
        },
        destinationAccount: null,
        category: null,
      } as any);

      vi.spyOn(prisma.account, 'findUnique').mockResolvedValue({
        balance: new Prisma.Decimal(40000),
      } as any);

      const result = await service.create('user-1', {
        accountId: 'acc-1',
        type: TransactionType.EXPENSE,
        amount: 10000,
        description: 'Supermercado',
      });

      expect(prisma.account.update).toHaveBeenCalledWith({
        where: { id: 'acc-1' },
        data: { balance: { decrement: new Prisma.Decimal(10000) } },
      });
      expect(result.amount).toBe(10000);
      expect(result.account.balance).toBe(40000);
    });

    it('debe lanzar NotFoundException si la cuenta no existe o no pertenece al usuario', async () => {
      vi.spyOn(prisma.account, 'findFirst').mockResolvedValue(null);

      await expect(
        service.create('user-1', {
          accountId: 'acc-inexistente',
          type: TransactionType.EXPENSE,
          amount: 5000,
          description: 'Café',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('create - TRANSFER', () => {
    it('debe registrar transferencia debitando origen y acreditando destino', async () => {
      vi.spyOn(prisma.account, 'findFirst')
        .mockResolvedValueOnce({
          id: 'acc-orig',
          userId: 'user-1',
          balance: new Prisma.Decimal(100000),
          isActive: true,
        } as any)
        .mockResolvedValueOnce({
          id: 'acc-dest',
          userId: 'user-1',
          balance: new Prisma.Decimal(20000),
          isActive: true,
        } as any);

      vi.spyOn(prisma.transaction, 'create').mockResolvedValue({
        id: 'tx-2',
        userId: 'user-1',
        accountId: 'acc-orig',
        destinationAccountId: 'acc-dest',
        type: TransactionType.TRANSFER,
        amount: new Prisma.Decimal(30000),
        date: new Date(),
        description: 'Traspaso a ahorro',
        isRecurring: false,
        recurrenceRule: null,
        account: { id: 'acc-orig', name: 'Origen', balance: new Prisma.Decimal(70000) },
        destinationAccount: { id: 'acc-dest', name: 'Destino', balance: new Prisma.Decimal(50000) },
        category: null,
      } as any);

      vi.spyOn(prisma.account, 'findUnique').mockResolvedValue({
        balance: new Prisma.Decimal(70000),
      } as any);

      const result = await service.create('user-1', {
        accountId: 'acc-orig',
        destinationAccountId: 'acc-dest',
        type: TransactionType.TRANSFER,
        amount: 30000,
        description: 'Traspaso a ahorro',
      });

      expect(prisma.account.update).toHaveBeenCalledWith({
        where: { id: 'acc-orig' },
        data: { balance: { decrement: new Prisma.Decimal(30000) } },
      });
      expect(prisma.account.update).toHaveBeenCalledWith({
        where: { id: 'acc-dest' },
        data: { balance: { increment: new Prisma.Decimal(30000) } },
      });
      expect(result.amount).toBe(30000);
    });

    it('debe lanzar BadRequestException si la cuenta destino es igual a la cuenta origen', async () => {
      vi.spyOn(prisma.account, 'findFirst').mockResolvedValue({
        id: 'acc-same',
        userId: 'user-1',
        isActive: true,
      } as any);

      await expect(
        service.create('user-1', {
          accountId: 'acc-same',
          destinationAccountId: 'acc-same',
          type: TransactionType.TRANSFER,
          amount: 15000,
          description: 'Transferencia inválida',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('debe revertir el saldo de la cuenta al eliminar un gasto', async () => {
      vi.spyOn(prisma.transaction, 'findFirst').mockResolvedValue({
        id: 'tx-1',
        userId: 'user-1',
        accountId: 'acc-1',
        type: TransactionType.EXPENSE,
        amount: new Prisma.Decimal(10000),
        goalContributions: [],
        debtPayments: [],
      } as any);

      vi.spyOn(prisma.transaction, 'delete').mockResolvedValue({} as any);

      const result = await service.remove('user-1', 'tx-1');

      expect(prisma.account.update).toHaveBeenCalledWith({
        where: { id: 'acc-1' },
        data: { balance: { increment: new Prisma.Decimal(10000) } },
      });
      expect(result.success).toBe(true);
    });
  });
});
