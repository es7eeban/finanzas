import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma, TransactionType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateTransactionDto } from './dto/create-transaction.dto.js';
import { QueryTransactionsDto } from './dto/query-transactions.dto.js';

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateTransactionDto) {
    // 1. Validar cuenta de origen
    const sourceAccount = await this.prisma.account.findFirst({
      where: { id: dto.accountId, userId, isActive: true },
    });

    if (!sourceAccount) {
      throw new NotFoundException(
        'La cuenta de origen no existe, está inactiva o no pertenece al usuario.',
      );
    }

    // 2. Si es transferencia, validar cuenta destino
    let destinationAccount = null;
    if (dto.type === TransactionType.TRANSFER) {
      if (!dto.destinationAccountId) {
        throw new BadRequestException(
          'Para una transferencia, la cuenta destino es obligatoria.',
        );
      }

      if (dto.destinationAccountId === dto.accountId) {
        throw new BadRequestException(
          'La cuenta destino no puede ser igual a la cuenta origen.',
        );
      }

      destinationAccount = await this.prisma.account.findFirst({
        where: { id: dto.destinationAccountId, userId, isActive: true },
      });

      if (!destinationAccount) {
        throw new NotFoundException(
          'La cuenta de destino no existe, está inactiva o no pertenece al usuario.',
        );
      }
    }

    // 3. Si tiene categoría, validar que pertenezca al usuario o sea del sistema
    if (dto.categoryId) {
      const category = await this.prisma.category.findFirst({
        where: {
          id: dto.categoryId,
          OR: [{ userId: null }, { userId }],
        },
      });

      if (!category) {
        throw new NotFoundException('La categoría especificada no existe.');
      }
    }

    const decimalAmount = new Prisma.Decimal(dto.amount);
    const transactionDate = dto.date ? new Date(dto.date) : new Date();

    // 4. Ejecutar creación y actualización de balances de forma atómica
    return this.prisma.$transaction(async (tx) => {
      // Registrar la transacción
      const createdTx = await tx.transaction.create({
        data: {
          userId,
          accountId: dto.accountId,
          destinationAccountId: dto.destinationAccountId ?? null,
          categoryId: dto.categoryId ?? null,
          type: dto.type,
          amount: decimalAmount,
          date: transactionDate,
          description: dto.description.trim(),
          isRecurring: dto.isRecurring ?? false,
          recurrenceRule: dto.recurrenceRule ?? null,
        },
        include: {
          account: {
            select: {
              id: true,
              name: true,
              currency: true,
              color: true,
              icon: true,
              balance: true,
            },
          },
          destinationAccount: {
            select: {
              id: true,
              name: true,
              currency: true,
              color: true,
              icon: true,
              balance: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              type: true,
              color: true,
              icon: true,
            },
          },
        },
      });

      // Actualizar balances según tipo
      switch (dto.type) {
        case TransactionType.EXPENSE:
          await tx.account.update({
            where: { id: dto.accountId },
            data: { balance: { decrement: decimalAmount } },
          });
          break;

        case TransactionType.INCOME:
          await tx.account.update({
            where: { id: dto.accountId },
            data: { balance: { increment: decimalAmount } },
          });
          break;

        case TransactionType.TRANSFER:
          await tx.account.update({
            where: { id: dto.accountId },
            data: { balance: { decrement: decimalAmount } },
          });
          if (dto.destinationAccountId) {
            await tx.account.update({
              where: { id: dto.destinationAccountId },
              data: { balance: { increment: decimalAmount } },
            });
          }
          break;

        case TransactionType.SAVING_CONTRIBUTION:
          await tx.account.update({
            where: { id: dto.accountId },
            data: { balance: { decrement: decimalAmount } },
          });
          if (dto.destinationAccountId && dto.destinationAccountId !== dto.accountId) {
            await tx.account.update({
              where: { id: dto.destinationAccountId },
              data: { balance: { increment: decimalAmount } },
            });
          }
          break;

        case TransactionType.SAVING_WITHDRAWAL:
          await tx.account.update({
            where: { id: dto.accountId },
            data: { balance: { increment: decimalAmount } },
          });
          break;

        case TransactionType.DEBT_PAYMENT:
          await tx.account.update({
            where: { id: dto.accountId },
            data: { balance: { decrement: decimalAmount } },
          });
          break;
      }

      // Obtener saldo actualizado de la cuenta origen
      const updatedAccount = await tx.account.findUnique({
        where: { id: dto.accountId },
        select: { balance: true },
      });

      return {
        ...createdTx,
        amount: Number(createdTx.amount),
        account: {
          ...createdTx.account,
          balance: updatedAccount ? Number(updatedAccount.balance) : Number(createdTx.account.balance),
        },
        destinationAccount: createdTx.destinationAccount
          ? {
              ...createdTx.destinationAccount,
              balance: Number(createdTx.destinationAccount.balance),
            }
          : null,
      };
    });
  }

  async findAll(userId: string, query: QueryTransactionsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.TransactionWhereInput = {
      userId,
      ...(query.startDate || query.endDate
        ? {
            date: {
              ...(query.startDate ? { gte: new Date(query.startDate) } : {}),
              ...(query.endDate ? { lte: new Date(query.endDate) } : {}),
            },
          }
        : {}),
      ...(query.accountId
        ? {
            OR: [
              { accountId: query.accountId },
              { destinationAccountId: query.accountId },
            ],
          }
        : {}),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.type ? { type: query.type } : {}),
      ...(query.search
        ? {
            description: {
              contains: query.search.trim(),
              mode: 'insensitive',
            },
          }
        : {}),
    };

    const [total, transactions] = await Promise.all([
      this.prisma.transaction.count({ where }),
      this.prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        include: {
          account: {
            select: {
              id: true,
              name: true,
              currency: true,
              color: true,
              icon: true,
              balance: true,
            },
          },
          destinationAccount: {
            select: {
              id: true,
              name: true,
              currency: true,
              color: true,
              icon: true,
              balance: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              type: true,
              color: true,
              icon: true,
            },
          },
        },
      }),
    ]);

    const data = transactions.map((t) => ({
      ...t,
      amount: Number(t.amount),
      account: {
        ...t.account,
        balance: Number(t.account.balance),
      },
      destinationAccount: t.destinationAccount
        ? {
            ...t.destinationAccount,
            balance: Number(t.destinationAccount.balance),
          }
        : null,
    }));

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(userId: string, id: string) {
    const transaction = await this.prisma.transaction.findFirst({
      where: { id, userId },
      include: {
        account: true,
        destinationAccount: true,
        category: true,
        goalContributions: true,
        debtPayments: true,
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transacción no encontrada.');
    }

    return {
      ...transaction,
      amount: Number(transaction.amount),
      account: {
        ...transaction.account,
        balance: Number(transaction.account.balance),
      },
      destinationAccount: transaction.destinationAccount
        ? {
            ...transaction.destinationAccount,
            balance: Number(transaction.destinationAccount.balance),
          }
        : null,
    };
  }

  async remove(userId: string, id: string) {
    const transaction = await this.prisma.transaction.findFirst({
      where: { id, userId },
      include: {
        goalContributions: true,
        debtPayments: true,
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transacción no encontrada.');
    }

    const decimalAmount = transaction.amount;

    return this.prisma.$transaction(async (tx) => {
      // Revertir balances según tipo original
      switch (transaction.type) {
        case TransactionType.EXPENSE:
        case TransactionType.DEBT_PAYMENT:
          await tx.account.update({
            where: { id: transaction.accountId },
            data: { balance: { increment: decimalAmount } },
          });
          break;

        case TransactionType.INCOME:
          await tx.account.update({
            where: { id: transaction.accountId },
            data: { balance: { decrement: decimalAmount } },
          });
          break;

        case TransactionType.TRANSFER:
          await tx.account.update({
            where: { id: transaction.accountId },
            data: { balance: { increment: decimalAmount } },
          });
          if (transaction.destinationAccountId) {
            await tx.account.update({
              where: { id: transaction.destinationAccountId },
              data: { balance: { decrement: decimalAmount } },
            });
          }
          break;

        case TransactionType.SAVING_CONTRIBUTION:
          await tx.account.update({
            where: { id: transaction.accountId },
            data: { balance: { increment: decimalAmount } },
          });
          if (transaction.destinationAccountId && transaction.destinationAccountId !== transaction.accountId) {
            await tx.account.update({
              where: { id: transaction.destinationAccountId },
              data: { balance: { decrement: decimalAmount } },
            });
          }
          // Revertir acumulado en la meta si estaba ligada
          for (const contrib of transaction.goalContributions) {
            await tx.savingGoal.update({
              where: { id: contrib.goalId },
              data: { currentAmount: { decrement: contrib.amount } },
            });
          }
          break;

        case TransactionType.SAVING_WITHDRAWAL:
          await tx.account.update({
            where: { id: transaction.accountId },
            data: { balance: { decrement: decimalAmount } },
          });
          for (const contrib of transaction.goalContributions) {
            await tx.savingGoal.update({
              where: { id: contrib.goalId },
              data: { currentAmount: { increment: contrib.amount } },
            });
          }
          break;
      }

      // Revertir abonos de deuda si aplica
      for (const debtPayment of transaction.debtPayments) {
        await tx.debtLoan.update({
          where: { id: debtPayment.debtLoanId },
          data: {
            pendingAmount: { increment: debtPayment.amount },
            status: 'PARTIALLY_PAID',
          },
        });
      }

      await tx.transaction.delete({
        where: { id },
      });

      return {
        success: true,
        message: 'Transacción eliminada y saldos revertidos correctamente.',
      };
    });
  }
}
