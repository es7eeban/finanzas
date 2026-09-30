import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateAccountDto } from './dto/create-account.dto.js';
import { UpdateAccountDto } from './dto/update-account.dto.js';

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, includeInactive: boolean = false) {
    const accounts = await this.prisma.account.findMany({
      where: {
        userId,
        ...(includeInactive ? {} : { isActive: true }),
      },
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
      orderBy: [{ isActive: 'desc' }, { createdAt: 'asc' }],
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

  async findOne(userId: string, id: string, allowInactive: boolean = false) {
    const account = await this.prisma.account.findFirst({
      where: {
        id,
        userId,
        ...(allowInactive ? {} : { isActive: true }),
      },
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
    const trimmedName = dto.name.trim();

    // 1. Validar que no exista ya una cuenta activa con el mismo nombre
    const duplicateByName = await this.prisma.account.findFirst({
      where: {
        userId,
        name: { equals: trimmedName, mode: 'insensitive' },
        isActive: true,
      },
    });

    if (duplicateByName) {
      throw new ConflictException(
        `Ya tienes una cuenta activa registrada con el nombre "${trimmedName}". Usa un nombre distintivo o agrega el banco o últimos 4 dígitos.`,
      );
    }

    // 2. Si se ingresa banco y últimos dígitos, validar que no se repita
    if (dto.accountNumber && dto.institution) {
      const duplicateByNumber = await this.prisma.account.findFirst({
        where: {
          userId,
          institution: { equals: dto.institution.trim(), mode: 'insensitive' },
          accountNumber: dto.accountNumber.trim(),
          isActive: true,
        },
      });

      if (duplicateByNumber) {
        throw new ConflictException(
          `Ya tienes registrada una cuenta en ${dto.institution} con el identificador ****${dto.accountNumber.trim()}.`,
        );
      }
    }

    const account = await this.prisma.account.create({
      data: {
        userId,
        name: trimmedName,
        institution: dto.institution?.trim() || null,
        accountNumber: dto.accountNumber?.trim() || null,
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
    await this.findOne(userId, id, true);

    const updateData: Prisma.AccountUpdateInput = {
      ...(dto.name && { name: dto.name.trim() }),
      ...(dto.institution !== undefined && { institution: dto.institution?.trim() || null }),
      ...(dto.accountNumber !== undefined && { accountNumber: dto.accountNumber?.trim() || null }),
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

  async toggleActive(userId: string, id: string) {
    const account = await this.findOne(userId, id, true);
    const newStatus = !account.isActive;

    // Si se va a desactivar, verificar si tiene metas de ahorro activas
    if (!newStatus) {
      const activeGoals = account.savingGoals.filter((g) => g.status === 'ACTIVE');
      if (activeGoals.length > 0) {
        throw new BadRequestException(
          `No puedes desactivar esta cuenta porque tiene ${activeGoals.length} meta(s) de ahorro activa(s) asociada(s). Reasigna los fondos primero.`,
        );
      }
    }

    const updated = await this.prisma.account.update({
      where: { id },
      data: { isActive: newStatus },
    });

    return {
      ...updated,
      balance: Number(updated.balance),
      creditLimit: updated.creditLimit ? Number(updated.creditLimit) : null,
    };
  }

  async remove(userId: string, id: string) {
    return this.toggleActive(userId, id);
  }
}
