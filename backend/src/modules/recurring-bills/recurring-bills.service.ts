import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Prisma, TransactionType, ExecutionStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateRecurringBillDto } from './dto/create-recurring-bill.dto.js';
import { UpdateRecurringBillDto } from './dto/update-recurring-bill.dto.js';
import { MarkRecurringPaidDto } from './dto/mark-recurring-paid.dto.js';
import { QueryRecurringBillsDto } from './dto/query-recurring-bills.dto.js';

export type RecurringBillStatus = 'PAID' | 'DUE_SOON' | 'PENDING' | 'OVERDUE';

@Injectable()
export class RecurringBillsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Genera el periodo por defecto en formato YYYY-MM */
  getPeriodString(date: Date = new Date()): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  /** Calcula la próxima fecha de vencimiento según el día del mes */
  calculateNextDueDate(dueDay: number, fromDate: Date = new Date()): Date {
    const year = fromDate.getFullYear();
    const month = fromDate.getMonth();
    const currentDay = fromDate.getDate();

    // Días que tiene el mes en curso
    const lastDayCurrentMonth = new Date(year, month + 1, 0).getDate();
    const clampedDayCurrentMonth = Math.min(dueDay, lastDayCurrentMonth);

    if (currentDay <= clampedDayCurrentMonth) {
      return new Date(year, month, clampedDayCurrentMonth, 23, 59, 59);
    }

    // Si ya pasó en este mes, el próximo vencimiento es el siguiente mes
    const nextMonthYear = month === 11 ? year + 1 : year;
    const nextMonth = month === 11 ? 0 : month + 1;
    const lastDayNextMonth = new Date(nextMonthYear, nextMonth + 1, 0).getDate();
    const clampedDayNextMonth = Math.min(dueDay, lastDayNextMonth);

    return new Date(nextMonthYear, nextMonth, clampedDayNextMonth, 23, 59, 59);
  }

  async create(userId: string, dto: CreateRecurringBillDto) {
    if (dto.accountId) {
      const account = await this.prisma.account.findFirst({
        where: { id: dto.accountId, userId, isActive: true },
      });
      if (!account) {
        throw new NotFoundException('La cuenta seleccionada no existe o está inactiva');
      }
    }

    const nextDueDate = this.calculateNextDueDate(dto.dueDay);

    const bill = await this.prisma.recurringBill.create({
      data: {
        userId,
        name: dto.name.trim(),
        amount: new Prisma.Decimal(dto.amount),
        currency: dto.currency ?? 'CLP',
        frequency: dto.frequency ?? 'MONTHLY',
        executionType: dto.executionType,
        category: dto.category,
        dueDay: dto.dueDay,
        nextDueDate,
        accountId: dto.accountId || null,
        categoryId: dto.categoryId || null,
        notes: dto.notes?.trim() || null,
      },
      include: {
        account: {
          select: {
            id: true,
            name: true,
            institution: true,
            institutionCode: true,
            accountNumber: true,
            color: true,
            type: true,
          },
        },
        categoryRel: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true,
          },
        },
      },
    });

    return {
      ...bill,
      amount: Number(bill.amount),
    };
  }

  async findAll(userId: string, query?: QueryRecurringBillsDto) {
    const targetPeriod = query?.period || this.getPeriodString();
    const [periodYearStr, periodMonthStr] = targetPeriod.split('-');
    const periodYear = parseInt(periodYearStr, 10);
    const periodMonth = parseInt(periodMonthStr, 10) - 1; // 0-indexed

    const bills = await this.prisma.recurringBill.findMany({
      where: {
        userId,
        isActive: true,
        ...(query?.category ? { category: query.category } : {}),
        ...(query?.executionType ? { executionType: query.executionType } : {}),
      },
      include: {
        account: {
          select: {
            id: true,
            name: true,
            institution: true,
            institutionCode: true,
            accountNumber: true,
            color: true,
            type: true,
          },
        },
        categoryRel: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true,
          },
        },
        executions: {
          where: { period: targetPeriod },
        },
      },
      orderBy: [{ dueDay: 'asc' }, { name: 'asc' }],
    });

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return bills.map((bill) => {
      const execution = bill.executions[0] || null;
      const isPaidThisMonth = !!execution && execution.status === ExecutionStatus.PAID;

      // Calcular fecha exacta de vencimiento para este ciclo
      const lastDayMonth = new Date(periodYear, periodMonth + 1, 0).getDate();
      const clampedDueDay = Math.min(bill.dueDay, lastDayMonth);
      const cycleDueDate = new Date(periodYear, periodMonth, clampedDueDay);

      // Días restantes respecto a hoy
      const diffMs = cycleDueDate.getTime() - today.getTime();
      const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      const isOverdue = !isPaidThisMonth && daysRemaining < 0;

      let status: RecurringBillStatus = 'PENDING';
      if (isPaidThisMonth) {
        status = 'PAID';
      } else if (isOverdue) {
        status = 'OVERDUE';
      } else if (daysRemaining <= 3) {
        status = 'DUE_SOON';
      }

      return {
        ...bill,
        amount: Number(bill.amount),
        targetPeriod,
        cycleDueDate: cycleDueDate.toISOString(),
        isPaidThisMonth,
        daysRemaining,
        isOverdue,
        status,
        currentExecution: execution
          ? {
              ...execution,
              amountPaid: Number(execution.amountPaid),
            }
          : null,
      };
    });
  }

  async findOne(userId: string, id: string) {
    const bill = await this.prisma.recurringBill.findFirst({
      where: { id, userId, isActive: true },
      include: {
        account: true,
        categoryRel: true,
        executions: {
          orderBy: { period: 'desc' },
          take: 12,
        },
      },
    });

    if (!bill) {
      throw new NotFoundException('Servicio o suscripción no encontrado');
    }

    return {
      ...bill,
      amount: Number(bill.amount),
      executions: bill.executions.map((e) => ({
        ...e,
        amountPaid: Number(e.amountPaid),
      })),
    };
  }

  async getSummary(userId: string, period?: string) {
    const targetPeriod = period || this.getPeriodString();
    const bills = await this.findAll(userId, { period: targetPeriod });

    const totalCommitted = bills.reduce((sum, b) => sum + b.amount, 0);
    const paidBills = bills.filter((b) => b.isPaidThisMonth);
    const totalPaid = paidBills.reduce(
      (sum, b) => sum + (b.currentExecution?.amountPaid ?? b.amount),
      0,
    );
    const totalPending = bills
      .filter((b) => !b.isPaidThisMonth)
      .reduce((sum, b) => sum + b.amount, 0);

    return {
      period: targetPeriod,
      totalCommitted,
      totalPaid,
      totalPending,
      totalBills: bills.length,
      paidCount: paidBills.length,
      pendingCount: bills.length - paidBills.length,
    };
  }

  async markPaid(userId: string, id: string, dto: MarkRecurringPaidDto) {
    const bill = await this.prisma.recurringBill.findFirst({
      where: { id, userId, isActive: true },
    });

    if (!bill) {
      throw new NotFoundException('Servicio o suscripción no encontrado');
    }

    const paidAtDate = dto.paidAt ? new Date(dto.paidAt) : new Date();
    const period = dto.period || this.getPeriodString(paidAtDate);

    // Verificar si ya fue pagado en este periodo
    const existingExecution = await this.prisma.recurringBillExecution.findUnique({
      where: {
        recurringBillId_period: {
          recurringBillId: id,
          period,
        },
      },
    });

    if (existingExecution && existingExecution.status === ExecutionStatus.PAID) {
      throw new ConflictException(
        `El servicio "${bill.name}" ya cuenta con un pago registrado para el ciclo ${period}`,
      );
    }

    // Verificar cuenta bancaria origen
    const account = await this.prisma.account.findFirst({
      where: { id: dto.accountId, userId, isActive: true },
    });

    if (!account) {
      throw new NotFoundException('La cuenta seleccionada para el pago no existe o está inactiva');
    }

    // Transacción contable atómica
    return this.prisma.$transaction(async (tx) => {
      // 1. Debitar saldo de la cuenta origen
      const updatedAccount = await tx.account.update({
        where: { id: dto.accountId },
        data: {
          balance: {
            decrement: new Prisma.Decimal(dto.amountPaid),
          },
        },
      });

      // 2. Crear transacción en el historial de movimientos
      const transaction = await tx.transaction.create({
        data: {
          userId,
          accountId: dto.accountId,
          categoryId: bill.categoryId,
          type: TransactionType.EXPENSE,
          amount: new Prisma.Decimal(dto.amountPaid),
          date: paidAtDate,
          description: dto.notes?.trim() || `Pago recurrente: ${bill.name}`,
          isRecurring: true,
        },
      });

      // 3. Crear o actualizar la ejecución del ciclo
      const execution = await tx.recurringBillExecution.upsert({
        where: {
          recurringBillId_period: {
            recurringBillId: bill.id,
            period,
          },
        },
        create: {
          recurringBillId: bill.id,
          transactionId: transaction.id,
          period,
          amountPaid: new Prisma.Decimal(dto.amountPaid),
          paidAt: paidAtDate,
          status: ExecutionStatus.PAID,
          notes: dto.notes?.trim() || null,
        },
        update: {
          transactionId: transaction.id,
          amountPaid: new Prisma.Decimal(dto.amountPaid),
          paidAt: paidAtDate,
          status: ExecutionStatus.PAID,
          notes: dto.notes?.trim() || null,
        },
      });

      // 4. Actualizar la próxima fecha de vencimiento del servicio
      const nextDueDate = this.calculateNextDueDate(bill.dueDay, new Date());
      await tx.recurringBill.update({
        where: { id: bill.id },
        data: { nextDueDate },
      });

      return {
        success: true,
        billId: bill.id,
        period,
        execution: {
          ...execution,
          amountPaid: Number(execution.amountPaid),
        },
        transaction: {
          ...transaction,
          amount: Number(transaction.amount),
        },
        accountBalance: Number(updatedAccount.balance),
      };
    });
  }

  async update(userId: string, id: string, dto: UpdateRecurringBillDto) {
    const bill = await this.prisma.recurringBill.findFirst({
      where: { id, userId, isActive: true },
    });

    if (!bill) {
      throw new NotFoundException('Servicio o suscripción no encontrado');
    }

    if (dto.accountId) {
      const account = await this.prisma.account.findFirst({
        where: { id: dto.accountId, userId, isActive: true },
      });
      if (!account) {
        throw new NotFoundException('La cuenta seleccionada no existe o está inactiva');
      }
    }

    const dueDayChanged = dto.dueDay !== undefined && dto.dueDay !== bill.dueDay;
    const nextDueDate = dueDayChanged
      ? this.calculateNextDueDate(dto.dueDay!)
      : undefined;

    const updated = await this.prisma.recurringBill.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name.trim() }),
        ...(dto.amount !== undefined && { amount: new Prisma.Decimal(dto.amount) }),
        ...(dto.currency && { currency: dto.currency }),
        ...(dto.frequency && { frequency: dto.frequency }),
        ...(dto.executionType && { executionType: dto.executionType }),
        ...(dto.category && { category: dto.category }),
        ...(dto.dueDay !== undefined && { dueDay: dto.dueDay, nextDueDate }),
        ...(dto.accountId !== undefined && { accountId: dto.accountId }),
        ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.notes !== undefined && { notes: dto.notes?.trim() || null }),
      },
    });

    return {
      ...updated,
      amount: Number(updated.amount),
    };
  }

  async remove(userId: string, id: string) {
    const bill = await this.prisma.recurringBill.findFirst({
      where: { id, userId, isActive: true },
    });

    if (!bill) {
      throw new NotFoundException('Servicio o suscripción no encontrado');
    }

    await this.prisma.recurringBill.update({
      where: { id },
      data: { isActive: false },
    });

    return { success: true, message: 'Servicio dado de baja correctamente' };
  }
}
