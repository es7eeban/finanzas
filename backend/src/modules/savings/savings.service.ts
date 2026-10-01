import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Prisma, GoalStatus, TransactionType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateSavingGoalDto } from './dto/create-saving-goal.dto.js';
import { UpdateSavingGoalDto } from './dto/update-saving-goal.dto.js';
import { ContributeSavingGoalDto } from './dto/contribute-saving-goal.dto.js';
import { WithdrawSavingGoalDto } from './dto/withdraw-saving-goal.dto.js';

export interface PacingMetrics {
  progressPercentage: number;
  remainingAmount: number;
  daysRemaining: number;
  monthsRemaining: number;
  recommendedMonthlyPacing: number;
  pacingStatus: 'on_track' | 'ahead' | 'behind' | 'completed';
}

@Injectable()
export class SavingsService {
  constructor(private readonly prisma: PrismaService) {}

  private calculatePacing(
    targetAmount: number,
    currentAmount: number,
    targetDate: Date,
    createdAt: Date,
    status: GoalStatus,
  ): PacingMetrics {
    const remainingAmount = Math.max(0, targetAmount - currentAmount);
    const progressPercentage =
      targetAmount > 0
        ? Math.min(100, Math.round((currentAmount / targetAmount) * 1000) / 10)
        : 100;

    if (status === GoalStatus.COMPLETED || currentAmount >= targetAmount) {
      return {
        progressPercentage: 100,
        remainingAmount: 0,
        daysRemaining: 0,
        monthsRemaining: 0,
        recommendedMonthlyPacing: 0,
        pacingStatus: 'completed',
      };
    }

    const now = new Date();
    const diffTime = targetDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const monthsRemaining = Math.max(1, Math.ceil(diffDays / 30.44));

    const recommendedMonthlyPacing =
      monthsRemaining > 0
        ? Math.round(remainingAmount / monthsRemaining)
        : remainingAmount;

    const totalDuration = targetDate.getTime() - createdAt.getTime();
    const elapsed = now.getTime() - createdAt.getTime();
    let pacingStatus: 'on_track' | 'ahead' | 'behind' = 'on_track';

    if (totalDuration > 0 && elapsed > 0) {
      const expectedRatio = Math.min(1, elapsed / totalDuration);
      const actualRatio = currentAmount / targetAmount;

      if (actualRatio >= expectedRatio * 1.05) {
        pacingStatus = 'ahead';
      } else if (actualRatio < expectedRatio * 0.9) {
        pacingStatus = 'behind';
      }
    }

    return {
      progressPercentage,
      remainingAmount,
      daysRemaining: diffDays,
      monthsRemaining,
      recommendedMonthlyPacing,
      pacingStatus,
    };
  }

  async create(userId: string, dto: CreateSavingGoalDto) {
    const targetAccount = await this.prisma.account.findFirst({
      where: { id: dto.targetAccountId, userId, isActive: true },
    });

    if (!targetAccount) {
      throw new NotFoundException(
        'La cuenta de resguardo no existe, está inactiva o no pertenece al usuario.',
      );
    }

    const trimmedName = dto.name.trim();
    const duplicate = await this.prisma.savingGoal.findFirst({
      where: {
        userId,
        name: { equals: trimmedName, mode: 'insensitive' },
        status: { in: [GoalStatus.ACTIVE, GoalStatus.PAUSED] },
      },
    });

    if (duplicate) {
      throw new ConflictException(
        `Ya tienes una meta de ahorro activa con el nombre "${trimmedName}".`,
      );
    }

    const initialAmount = dto.initialAmount ?? 0;
    const initialStatus =
      initialAmount >= dto.targetAmount ? GoalStatus.COMPLETED : GoalStatus.ACTIVE;

    return this.prisma.$transaction(async (tx) => {
      const goal = await tx.savingGoal.create({
        data: {
          userId,
          targetAccountId: dto.targetAccountId,
          name: trimmedName,
          targetAmount: new Prisma.Decimal(dto.targetAmount),
          currentAmount: new Prisma.Decimal(initialAmount),
          targetDate: new Date(dto.targetDate),
          color: dto.color ?? '#10B981',
          icon: dto.icon ?? 'target',
          status: initialStatus,
        },
        include: {
          targetAccount: {
            select: {
              id: true,
              name: true,
              currency: true,
              color: true,
              icon: true,
              balance: true,
            },
          },
        },
      });

      if (initialAmount > 0) {
        await tx.goalContribution.create({
          data: {
            goalId: goal.id,
            amount: new Prisma.Decimal(initialAmount),
            date: new Date(),
            note: 'Aporte inicial al crear la meta',
          },
        });
      }

      const targetAmountNum = Number(goal.targetAmount);
      const currentAmountNum = Number(goal.currentAmount);
      const pacing = this.calculatePacing(
        targetAmountNum,
        currentAmountNum,
        goal.targetDate,
        goal.createdAt,
        goal.status,
      );

      return {
        ...goal,
        targetAmount: targetAmountNum,
        currentAmount: currentAmountNum,
        targetAccount: {
          ...goal.targetAccount,
          balance: Number(goal.targetAccount.balance),
        },
        ...pacing,
      };
    });
  }

  async findAll(userId: string, status?: GoalStatus) {
    const goals = await this.prisma.savingGoal.findMany({
      where: {
        userId,
        ...(status ? { status } : {}),
      },
      include: {
        targetAccount: {
          select: {
            id: true,
            name: true,
            currency: true,
            color: true,
            icon: true,
            balance: true,
          },
        },
        _count: {
          select: { contributions: true },
        },
      },
      orderBy: [{ status: 'asc' }, { targetDate: 'asc' }],
    });

    return goals.map((goal) => {
      const targetAmountNum = Number(goal.targetAmount);
      const currentAmountNum = Number(goal.currentAmount);
      const pacing = this.calculatePacing(
        targetAmountNum,
        currentAmountNum,
        goal.targetDate,
        goal.createdAt,
        goal.status,
      );

      return {
        ...goal,
        targetAmount: targetAmountNum,
        currentAmount: currentAmountNum,
        contributionsCount: goal._count.contributions,
        targetAccount: {
          ...goal.targetAccount,
          balance: Number(goal.targetAccount.balance),
        },
        ...pacing,
      };
    });
  }

  async findOne(userId: string, id: string) {
    const goal = await this.prisma.savingGoal.findFirst({
      where: { id, userId },
      include: {
        targetAccount: {
          select: {
            id: true,
            name: true,
            currency: true,
            color: true,
            icon: true,
            balance: true,
          },
        },
        contributions: {
          orderBy: { date: 'desc' },
          include: {
            transaction: {
              select: {
                id: true,
                type: true,
                date: true,
                description: true,
              },
            },
          },
        },
      },
    });

    if (!goal) {
      throw new NotFoundException('Meta de ahorro no encontrada.');
    }

    const targetAmountNum = Number(goal.targetAmount);
    const currentAmountNum = Number(goal.currentAmount);
    const pacing = this.calculatePacing(
      targetAmountNum,
      currentAmountNum,
      goal.targetDate,
      goal.createdAt,
      goal.status,
    );

    return {
      ...goal,
      targetAmount: targetAmountNum,
      currentAmount: currentAmountNum,
      targetAccount: {
        ...goal.targetAccount,
        balance: Number(goal.targetAccount.balance),
      },
      contributions: goal.contributions.map((c) => ({
        ...c,
        amount: Number(c.amount),
      })),
      ...pacing,
    };
  }

  async update(userId: string, id: string, dto: UpdateSavingGoalDto) {
    await this.findOne(userId, id);

    if (dto.targetAccountId) {
      const acc = await this.prisma.account.findFirst({
        where: { id: dto.targetAccountId, userId, isActive: true },
      });
      if (!acc) {
        throw new NotFoundException('La cuenta de resguardo destino no es válida.');
      }
    }

    const updated = await this.prisma.savingGoal.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name.trim() }),
        ...(dto.targetAmount !== undefined && {
          targetAmount: new Prisma.Decimal(dto.targetAmount),
        }),
        ...(dto.targetAccountId && { targetAccountId: dto.targetAccountId }),
        ...(dto.targetDate && { targetDate: new Date(dto.targetDate) }),
        ...(dto.color && { color: dto.color }),
        ...(dto.icon && { icon: dto.icon }),
        ...(dto.status && { status: dto.status }),
      },
      include: {
        targetAccount: {
          select: {
            id: true,
            name: true,
            currency: true,
            color: true,
            icon: true,
            balance: true,
          },
        },
      },
    });

    const targetAmountNum = Number(updated.targetAmount);
    const currentAmountNum = Number(updated.currentAmount);
    const pacing = this.calculatePacing(
      targetAmountNum,
      currentAmountNum,
      updated.targetDate,
      updated.createdAt,
      updated.status,
    );

    return {
      ...updated,
      targetAmount: targetAmountNum,
      currentAmount: currentAmountNum,
      targetAccount: {
        ...updated.targetAccount,
        balance: Number(updated.targetAccount.balance),
      },
      ...pacing,
    };
  }

  async contribute(userId: string, id: string, dto: ContributeSavingGoalDto) {
    const goal = await this.prisma.savingGoal.findFirst({
      where: { id, userId },
      include: { targetAccount: true },
    });

    if (!goal) {
      throw new NotFoundException('Meta de ahorro no encontrada.');
    }

    const decimalAmount = new Prisma.Decimal(dto.amount);
    const contributionDate = dto.date ? new Date(dto.date) : new Date();

    return this.prisma.$transaction(async (tx) => {
      let createdTxId: string | null = null;

      // Si se indicó cuenta de origen, debitar de origen e incrementar cuenta de resguardo si son distintas
      if (dto.sourceAccountId) {
        const sourceAcc = await tx.account.findFirst({
          where: { id: dto.sourceAccountId, userId, isActive: true },
        });

        if (!sourceAcc) {
          throw new NotFoundException('La cuenta de origen no existe o está inactiva.');
        }

        const isDifferentAccount = dto.sourceAccountId !== goal.targetAccountId;

        // Descontar saldo de la cuenta de origen
        await tx.account.update({
          where: { id: dto.sourceAccountId },
          data: { balance: { decrement: decimalAmount } },
        });

        // Si es distinta a la cuenta de resguardo, acreditar en la cuenta de resguardo
        if (isDifferentAccount) {
          await tx.account.update({
            where: { id: goal.targetAccountId },
            data: { balance: { increment: decimalAmount } },
          });
        }

        // Crear transacción contable
        const createdTx = await tx.transaction.create({
          data: {
            userId,
            accountId: dto.sourceAccountId,
            destinationAccountId: isDifferentAccount ? goal.targetAccountId : null,
            type: TransactionType.SAVING_CONTRIBUTION,
            amount: decimalAmount,
            date: contributionDate,
            description: dto.note?.trim() || `Aporte a meta: ${goal.name}`,
          },
        });
        createdTxId = createdTx.id;
      }

      // Actualizar monto actual en la meta
      const newCurrentAmount = new Prisma.Decimal(goal.currentAmount).add(decimalAmount);
      const isCompleted = newCurrentAmount.greaterThanOrEqualTo(goal.targetAmount);

      const updatedGoal = await tx.savingGoal.update({
        where: { id },
        data: {
          currentAmount: newCurrentAmount,
          ...(isCompleted ? { status: GoalStatus.COMPLETED } : {}),
        },
        include: {
          targetAccount: {
            select: {
              id: true,
              name: true,
              currency: true,
              color: true,
              icon: true,
              balance: true,
            },
          },
        },
      });

      // Crear aporte histórico
      const contribution = await tx.goalContribution.create({
        data: {
          goalId: id,
          transactionId: createdTxId,
          amount: decimalAmount,
          date: contributionDate,
          note: dto.note?.trim() || 'Aporte a meta de ahorro',
        },
      });

      const targetAmountNum = Number(updatedGoal.targetAmount);
      const currentAmountNum = Number(updatedGoal.currentAmount);
      const pacing = this.calculatePacing(
        targetAmountNum,
        currentAmountNum,
        updatedGoal.targetDate,
        updatedGoal.createdAt,
        updatedGoal.status,
      );

      return {
        ...updatedGoal,
        targetAmount: targetAmountNum,
        currentAmount: currentAmountNum,
        targetAccount: {
          ...updatedGoal.targetAccount,
          balance: Number(updatedGoal.targetAccount.balance),
        },
        lastContribution: {
          ...contribution,
          amount: Number(contribution.amount),
        },
        ...pacing,
      };
    });
  }

  async withdraw(userId: string, id: string, dto: WithdrawSavingGoalDto) {
    const goal = await this.prisma.savingGoal.findFirst({
      where: { id, userId },
      include: { targetAccount: true },
    });

    if (!goal) {
      throw new NotFoundException('Meta de ahorro no encontrada.');
    }

    const currentAmountNum = Number(goal.currentAmount);
    if (dto.amount > currentAmountNum) {
      throw new BadRequestException(
        `El monto a retirar ($${dto.amount}) excede el fondo acumulado en la meta ($${currentAmountNum}).`,
      );
    }

    const decimalAmount = new Prisma.Decimal(dto.amount);
    const withdrawDate = dto.date ? new Date(dto.date) : new Date();

    return this.prisma.$transaction(async (tx) => {
      let destinationAccountId = goal.targetAccountId;
      const isTransfer =
        dto.destinationAccountId && dto.destinationAccountId !== goal.targetAccountId;

      if (isTransfer && dto.destinationAccountId) {
        const destAcc = await tx.account.findFirst({
          where: { id: dto.destinationAccountId, userId, isActive: true },
        });

        if (!destAcc) {
          throw new NotFoundException('La cuenta destino de retiro no existe o está inactiva.');
        }

        // Descontar de cuenta de resguardo y transferir a cuenta de libre uso
        await tx.account.update({
          where: { id: goal.targetAccountId },
          data: { balance: { decrement: decimalAmount } },
        });

        await tx.account.update({
          where: { id: dto.destinationAccountId },
          data: { balance: { increment: decimalAmount } },
        });

        destinationAccountId = dto.destinationAccountId;
      }

      // Crear transacción contable de retiro
      const createdTx = await tx.transaction.create({
        data: {
          userId,
          accountId: goal.targetAccountId,
          destinationAccountId: isTransfer ? destinationAccountId : null,
          type: TransactionType.SAVING_WITHDRAWAL,
          amount: decimalAmount,
          date: withdrawDate,
          description: `Retiro de ahorro (${goal.name}): ${dto.reason.trim()}`,
        },
      });

      // Actualizar monto acumulado en la meta
      const newCurrentAmount = new Prisma.Decimal(goal.currentAmount).sub(decimalAmount);
      const updatedGoal = await tx.savingGoal.update({
        where: { id },
        data: {
          currentAmount: newCurrentAmount,
          // Si estaba completada pero se retira dinero, vuelve a activa
          ...(goal.status === GoalStatus.COMPLETED ? { status: GoalStatus.ACTIVE } : {}),
        },
        include: {
          targetAccount: {
            select: {
              id: true,
              name: true,
              currency: true,
              color: true,
              icon: true,
              balance: true,
            },
          },
        },
      });

      // Registrar movimiento de retiro en aportes (con nota)
      const contribution = await tx.goalContribution.create({
        data: {
          goalId: id,
          transactionId: createdTx.id,
          amount: decimalAmount.mul(-1), // Negativo para reflejar retiro
          date: withdrawDate,
          note: `Retiro de emergencia: ${dto.reason.trim()}`,
        },
      });

      const targetAmountNum = Number(updatedGoal.targetAmount);
      const newCurrentAmountNum = Number(updatedGoal.currentAmount);
      const pacing = this.calculatePacing(
        targetAmountNum,
        newCurrentAmountNum,
        updatedGoal.targetDate,
        updatedGoal.createdAt,
        updatedGoal.status,
      );

      return {
        ...updatedGoal,
        targetAmount: targetAmountNum,
        currentAmount: newCurrentAmountNum,
        targetAccount: {
          ...updatedGoal.targetAccount,
          balance: Number(updatedGoal.targetAccount.balance),
        },
        withdrawal: {
          ...contribution,
          amount: Number(contribution.amount),
        },
        ...pacing,
      };
    });
  }

  async remove(userId: string, id: string) {
    const goal = await this.prisma.savingGoal.findFirst({
      where: { id, userId },
    });

    if (!goal) {
      throw new NotFoundException('Meta de ahorro no encontrada.');
    }

    await this.prisma.savingGoal.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Meta de ahorro eliminada exitosamente.',
    };
  }
}
