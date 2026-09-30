import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateAccountDto } from './dto/create-account.dto.js';
import { UpdateAccountDto } from './dto/update-account.dto.js';

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    const accounts = await this.prisma.account.findMany({
      where: { userId, isActive: true },
      include: {
        savingGoals: {
          where: { status: 'ACTIVE' },
          select: {
            id: true,
            name: true,
            currentAmount: true,
            targetAmount: true,
            color: true,
            icon: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return accounts.map((acc) => {
      const balanceNum = Number(acc.balance);
      const reservedInSavings = acc.savingGoals.reduce(
        (sum, goal) => sum + Number(goal.currentAmount),
        0,
      );
      const availableBalance = balanceNum - reservedInSavings;

      return {
        ...acc,
        balance: balanceNum,
        creditLimit: acc.creditLimit ? Number(acc.creditLimit) : null,
        reservedInSavings,
        availableBalance,
      };
    });
  }

  async findOne(userId: string, id: string) {
    const account = await this.prisma.account.findFirst({
      where: { id, userId, isActive: true },
      include: {
        savingGoals: {
          select: {
            id: true,
            name: true,
            currentAmount: true,
            targetAmount: true,
            status: true,
          },
        },
      },
    });

    if (!account) {
      throw new NotFoundException('Cuenta no encontrada o no pertenece al usuario');
    }

    const balanceNum = Number(account.balance);
    const reservedInSavings = account.savingGoals.reduce(
      (sum, goal) => sum + Number(goal.currentAmount),
      0,
    );

    return {
      ...account,
      balance: balanceNum,
      creditLimit: account.creditLimit ? Number(account.creditLimit) : null,
      reservedInSavings,
      availableBalance: balanceNum - reservedInSavings,
    };
  }

  async create(userId: string, dto: CreateAccountDto) {
    const account = await this.prisma.account.create({
      data: {
        userId,
        name: dto.name,
        type: dto.type,
        currency: dto.currency ?? 'CLP',
        balance: new Prisma.Decimal(dto.balance ?? 0),
        creditLimit: dto.creditLimit !== undefined ? new Prisma.Decimal(dto.creditLimit) : null,
        billingCloseDay: dto.billingCloseDay ?? null,
        paymentDueDay: dto.paymentDueDay ?? null,
        color: dto.color ?? '#3B82F6',
        icon: dto.icon ?? 'wallet',
      },
    });

    return {
      ...account,
      balance: Number(account.balance),
      creditLimit: account.creditLimit ? Number(account.creditLimit) : null,
      reservedInSavings: 0,
      availableBalance: Number(account.balance),
    };
  }

  async update(userId: string, id: string, dto: UpdateAccountDto) {
    await this.findOne(userId, id);

    const updateData: Prisma.AccountUpdateInput = {
      ...(dto.name && { name: dto.name }),
      ...(dto.type && { type: dto.type }),
      ...(dto.currency && { currency: dto.currency }),
      ...(dto.balance !== undefined && { balance: new Prisma.Decimal(dto.balance) }),
      ...(dto.creditLimit !== undefined && {
        creditLimit: dto.creditLimit !== null ? new Prisma.Decimal(dto.creditLimit) : null,
      }),
      ...(dto.billingCloseDay !== undefined && { billingCloseDay: dto.billingCloseDay }),
      ...(dto.paymentDueDay !== undefined && { paymentDueDay: dto.paymentDueDay }),
      ...(dto.color && { color: dto.color }),
      ...(dto.icon && { icon: dto.icon }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
    };

    const updated = await this.prisma.account.update({
      where: { id },
      data: updateData,
    });

    return {
      ...updated,
      balance: Number(updated.balance),
      creditLimit: updated.creditLimit ? Number(updated.creditLimit) : null,
    };
  }

  async remove(userId: string, id: string) {
    const account = await this.findOne(userId, id);

    const activeGoalsCount = account.savingGoals.filter((g) => g.status === 'ACTIVE').length;
    if (activeGoalsCount > 0) {
      throw new BadRequestException(
        'No se puede eliminar la cuenta porque tiene metas de ahorro activas asociadas. Reubique o complete las metas primero.',
      );
    }

    // Soft-delete para preservar consistencia histórica de movimientos
    await this.prisma.account.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Cuenta desactivada exitosamente' };
  }
}
