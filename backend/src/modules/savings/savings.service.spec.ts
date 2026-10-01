import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SavingsService } from './savings.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { GoalStatus, Prisma } from '@prisma/client';

describe('SavingsService', () => {
  let service: SavingsService;
  let prisma: PrismaService;

  beforeEach(() => {
    prisma = {
      account: {
        findFirst: vi.fn(),
        update: vi.fn(),
      },
      savingGoal: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      goalContribution: {
        create: vi.fn(),
      },
      transaction: {
        create: vi.fn(),
      },
      $transaction: vi.fn(async (cb: (tx: any) => Promise<any>) => {
        return cb(prisma);
      }),
    } as unknown as PrismaService;

    service = new SavingsService(prisma);
  });

  describe('create', () => {
    it('debe crear una meta de ahorro con cálculo de pacing y progreso', async () => {
      vi.spyOn(prisma.account, 'findFirst').mockResolvedValue({
        id: 'acc-save',
        userId: 'user-1',
        name: 'Ahorro Banco Estado',
        balance: new Prisma.Decimal(500000),
        isActive: true,
      } as any);

      vi.spyOn(prisma.savingGoal, 'findFirst').mockResolvedValue(null);

      const targetDate = new Date();
      targetDate.setMonth(targetDate.getMonth() + 10);

      vi.spyOn(prisma.savingGoal, 'create').mockResolvedValue({
        id: 'goal-1',
        userId: 'user-1',
        targetAccountId: 'acc-save',
        name: 'Viaje a Brasil',
        targetAmount: new Prisma.Decimal(1000000),
        currentAmount: new Prisma.Decimal(200000),
        targetDate,
        color: '#10B981',
        icon: 'plane',
        status: GoalStatus.ACTIVE,
        createdAt: new Date(),
        targetAccount: {
          id: 'acc-save',
          name: 'Ahorro Banco Estado',
          currency: 'CLP',
          color: '#10B981',
          icon: 'piggy-bank',
          balance: new Prisma.Decimal(500000),
        },
      } as any);

      const result = await service.create('user-1', {
        name: 'Viaje a Brasil',
        targetAmount: 1000000,
        targetAccountId: 'acc-save',
        targetDate: targetDate.toISOString(),
        initialAmount: 200000,
      });

      expect(result.id).toBe('goal-1');
      expect(result.targetAmount).toBe(1000000);
      expect(result.currentAmount).toBe(200000);
      expect(result.progressPercentage).toBe(20);
      expect(result.remainingAmount).toBe(800000);
      expect(result.monthsRemaining).toBeGreaterThan(0);
    });

    it('debe lanzar ConflictException si ya existe una meta con el mismo nombre', async () => {
      vi.spyOn(prisma.account, 'findFirst').mockResolvedValue({
        id: 'acc-1',
        userId: 'user-1',
        isActive: true,
      } as any);

      vi.spyOn(prisma.savingGoal, 'findFirst').mockResolvedValue({
        id: 'existing-goal',
        name: 'Viaje a Brasil',
      } as any);

      await expect(
        service.create('user-1', {
          name: 'Viaje a Brasil',
          targetAmount: 1000000,
          targetAccountId: 'acc-1',
          targetDate: new Date().toISOString(),
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('contribute', () => {
    it('debe abonar a la meta y marcarla como COMPLETED si alcanza el objetivo', async () => {
      const targetDate = new Date();
      targetDate.setMonth(targetDate.getMonth() + 3);

      vi.spyOn(prisma.savingGoal, 'findFirst').mockResolvedValue({
        id: 'goal-1',
        userId: 'user-1',
        name: 'Fondo de Emergencia',
        targetAccountId: 'acc-save',
        targetAmount: new Prisma.Decimal(100000),
        currentAmount: new Prisma.Decimal(80000),
        targetDate,
        createdAt: new Date(),
        status: GoalStatus.ACTIVE,
      } as any);

      vi.spyOn(prisma.account, 'findFirst').mockResolvedValue({
        id: 'acc-main',
        userId: 'user-1',
        balance: new Prisma.Decimal(200000),
        isActive: true,
      } as any);

      vi.spyOn(prisma.account, 'update').mockResolvedValue({} as any);
      vi.spyOn(prisma.transaction, 'create').mockResolvedValue({ id: 'tx-save-1' } as any);

      vi.spyOn(prisma.savingGoal, 'update').mockResolvedValue({
        id: 'goal-1',
        targetAmount: new Prisma.Decimal(100000),
        currentAmount: new Prisma.Decimal(100000),
        status: GoalStatus.COMPLETED,
        targetDate,
        createdAt: new Date(),
        targetAccount: {
          id: 'acc-save',
          name: 'Ahorro',
          balance: new Prisma.Decimal(100000),
        },
      } as any);

      vi.spyOn(prisma.goalContribution, 'create').mockResolvedValue({
        id: 'gc-1',
        amount: new Prisma.Decimal(20000),
        date: new Date(),
      } as any);

      const result = await service.contribute('user-1', 'goal-1', {
        amount: 20000,
        sourceAccountId: 'acc-main',
        note: 'Último aporte para completar',
      });

      expect(result.currentAmount).toBe(100000);
      expect(result.pacingStatus).toBe('completed');
      expect(result.progressPercentage).toBe(100);
    });
  });

  describe('withdraw', () => {
    it('debe lanzar BadRequestException si el retiro supera el monto acumulado', async () => {
      vi.spyOn(prisma.savingGoal, 'findFirst').mockResolvedValue({
        id: 'goal-1',
        userId: 'user-1',
        currentAmount: new Prisma.Decimal(50000),
      } as any);

      await expect(
        service.withdraw('user-1', 'goal-1', {
          amount: 60000,
          reason: 'Urgencia médica',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
