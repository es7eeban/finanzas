import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma, DebtType, DebtStatus, TransactionType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateDebtDto } from './dto/create-debt.dto.js';
import { UpdateDebtDto } from './dto/update-debt.dto.js';
import { CreateDebtPaymentDto } from './dto/create-debt-payment.dto.js';

export interface DebtCalculatedMetrics {
  totalAmount: number;
  pendingAmount: number;
  paidAmount: number;
  progressPercentage: number;
  daysUntilDue: number | null;
  isOverdue: boolean;
  urgency: 'overdue' | 'due_soon' | 'normal';
}

@Injectable()
export class DebtsService {
  constructor(private readonly prisma: PrismaService) {}

  private calculateMetrics(debt: {
    totalAmount: Prisma.Decimal;
    pendingAmount: Prisma.Decimal;
    dueDate: Date | null;
    status: DebtStatus;
  }): DebtCalculatedMetrics {
    const totalAmount = Number(debt.totalAmount);
    const pendingAmount = Number(debt.pendingAmount);
    const paidAmount = totalAmount - pendingAmount;
    const progressPercentage =
      totalAmount > 0 ? Math.min(100, Math.round((paidAmount / totalAmount) * 100)) : 100;

    let daysUntilDue: number | null = null;
    let isOverdue = false;
    let urgency: 'overdue' | 'due_soon' | 'normal' = 'normal';

    if (debt.dueDate && debt.status !== DebtStatus.PAID) {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const due = new Date(debt.dueDate);
      due.setHours(0, 0, 0, 0);

      const diffMs = due.getTime() - now.getTime();
      daysUntilDue = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      isOverdue = daysUntilDue < 0;

      if (isOverdue) {
        urgency = 'overdue';
      } else if (daysUntilDue <= 7) {
        urgency = 'due_soon';
      }
    }

    return {
      totalAmount,
      pendingAmount,
      paidAmount,
      progressPercentage,
      daysUntilDue,
      isOverdue,
      urgency,
    };
  }

  async create(userId: string, dto: CreateDebtDto) {
    const decimalAmount = new Prisma.Decimal(dto.totalAmount);

    return this.prisma.$transaction(async (tx) => {
      let createdTxId: string | null = null;

      // Si se vinculó una cuenta, registrar el impacto financiero del préstamo
      if (dto.accountId) {
        const account = await tx.account.findFirst({
          where: { id: dto.accountId, userId, isActive: true },
        });

        if (!account) {
          throw new NotFoundException('La cuenta bancaria vinculada no existe o está inactiva.');
        }

        if (dto.type === DebtType.LENT) {
          // Dinero prestado por el usuario: sale de su cuenta
          await tx.account.update({
            where: { id: dto.accountId },
            data: { balance: { decrement: decimalAmount } },
          });

          const createdTx = await tx.transaction.create({
            data: {
              userId,
              accountId: dto.accountId,
              type: TransactionType.EXPENSE,
              amount: decimalAmount,
              date: new Date(),
              description: `Préstamo otorgado a ${dto.contactName.trim()}`,
            },
          });
          createdTxId = createdTx.id;
        } else {
          // Dinero prestado al usuario: ingresa a su cuenta
          await tx.account.update({
            where: { id: dto.accountId },
            data: { balance: { increment: decimalAmount } },
          });

          const createdTx = await tx.transaction.create({
            data: {
              userId,
              accountId: dto.accountId,
              type: TransactionType.INCOME,
              amount: decimalAmount,
              date: new Date(),
              description: `Préstamo recibido de ${dto.contactName.trim()}`,
            },
          });
          createdTxId = createdTx.id;
        }
      }

      const debt = await tx.debtLoan.create({
        data: {
          userId,
          contactName: dto.contactName.trim(),
          type: dto.type,
          totalAmount: decimalAmount,
          pendingAmount: decimalAmount,
          dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
          status: DebtStatus.PENDING,
          notes: dto.notes?.trim() || null,
        },
      });

      const metrics = this.calculateMetrics(debt);

      return {
        ...debt,
        disbursementTransactionId: createdTxId,
        ...metrics,
      };
    });
  }

  async findAll(userId: string, type?: DebtType, status?: DebtStatus) {
    const debts = await this.prisma.debtLoan.findMany({
      where: {
        userId,
        ...(type ? { type } : {}),
        ...(status ? { status } : {}),
      },
      include: {
        _count: {
          select: { payments: true },
        },
      },
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
    });

    return debts.map((d) => ({
      ...d,
      paymentsCount: d._count.payments,
      ...this.calculateMetrics(d),
    }));
  }

  async findOne(userId: string, id: string) {
    const debt = await this.prisma.debtLoan.findFirst({
      where: { id, userId },
      include: {
        payments: {
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

    if (!debt) {
      throw new NotFoundException('Registro de deuda o préstamo no encontrado.');
    }

    return {
      ...debt,
      payments: debt.payments.map((p) => ({
        ...p,
        amount: Number(p.amount),
      })),
      ...this.calculateMetrics(debt),
    };
  }

  async update(userId: string, id: string, dto: UpdateDebtDto) {
    await this.findOne(userId, id);

    const updated = await this.prisma.debtLoan.update({
      where: { id },
      data: {
        ...(dto.contactName && { contactName: dto.contactName.trim() }),
        ...(dto.dueDate !== undefined && {
          dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        }),
        ...(dto.notes !== undefined && { notes: dto.notes?.trim() || null }),
        ...(dto.status && { status: dto.status }),
      },
    });

    return {
      ...updated,
      ...this.calculateMetrics(updated),
    };
  }

  async addPayment(userId: string, id: string, dto: CreateDebtPaymentDto) {
    const debt = await this.prisma.debtLoan.findFirst({
      where: { id, userId },
    });

    if (!debt) {
      throw new NotFoundException('Registro de deuda o préstamo no encontrado.');
    }

    if (debt.status === DebtStatus.PAID) {
      throw new BadRequestException('Esta deuda ya se encuentra completamente pagada.');
    }

    const currentPending = Number(debt.pendingAmount);
    if (dto.amount <= 0) {
      throw new BadRequestException('El monto del abono debe ser mayor a 0.');
    }

    const decimalPaymentAmount = new Prisma.Decimal(dto.amount);
    const paymentDate = dto.date ? new Date(dto.date) : new Date();

    return this.prisma.$transaction(async (tx) => {
      let createdTxId: string | null = null;

      // Si se vinculó una cuenta, registrar el movimiento de dinero del abono
      if (dto.accountId) {
        const account = await tx.account.findFirst({
          where: { id: dto.accountId, userId, isActive: true },
        });

        if (!account) {
          throw new NotFoundException('La cuenta bancaria vinculada no existe o está inactiva.');
        }

        if (debt.type === DebtType.LENT) {
          // El contacto devuelve dinero al usuario: incrementa cuenta
          await tx.account.update({
            where: { id: dto.accountId },
            data: { balance: { increment: decimalPaymentAmount } },
          });

          const createdTx = await tx.transaction.create({
            data: {
              userId,
              accountId: dto.accountId,
              type: TransactionType.INCOME,
              amount: decimalPaymentAmount,
              date: paymentDate,
              description: `Abono recibido de ${debt.contactName} (${dto.note?.trim() || 'Pago de deuda'})`,
            },
          });
          createdTxId = createdTx.id;
        } else {
          // El usuario paga al acreedor: disminuye cuenta
          await tx.account.update({
            where: { id: dto.accountId },
            data: { balance: { decrement: decimalPaymentAmount } },
          });

          const createdTx = await tx.transaction.create({
            data: {
              userId,
              accountId: dto.accountId,
              type: TransactionType.EXPENSE,
              amount: decimalPaymentAmount,
              date: paymentDate,
              description: `Abono pagado a ${debt.contactName} (${dto.note?.trim() || 'Pago de deuda'})`,
            },
          });
          createdTxId = createdTx.id;
        }
      }

      // Calcular nuevo saldo pendiente y nuevo estado
      const newPendingAmount = Math.max(0, currentPending - dto.amount);
      const newStatus =
        newPendingAmount <= 0 ? DebtStatus.PAID : DebtStatus.PARTIALLY_PAID;

      const updatedDebt = await tx.debtLoan.update({
        where: { id },
        data: {
          pendingAmount: new Prisma.Decimal(newPendingAmount),
          status: newStatus,
        },
      });

      const payment = await tx.debtPayment.create({
        data: {
          debtLoanId: id,
          transactionId: createdTxId,
          amount: decimalPaymentAmount,
          date: paymentDate,
          note: dto.note?.trim() || null,
        },
      });

      return {
        ...updatedDebt,
        lastPayment: {
          ...payment,
          amount: Number(payment.amount),
        },
        ...this.calculateMetrics(updatedDebt),
      };
    });
  }

  async remove(userId: string, id: string) {
    const debt = await this.prisma.debtLoan.findFirst({
      where: { id, userId },
    });

    if (!debt) {
      throw new NotFoundException('Registro de deuda o préstamo no encontrado.');
    }

    await this.prisma.debtLoan.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Registro de deuda eliminado exitosamente.',
    };
  }
}
