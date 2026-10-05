import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AccountsService } from './accounts.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ConflictException } from '@nestjs/common';
import { AccountType, Currency, Prisma } from '@prisma/client';

describe('AccountsService', () => {
  let service: AccountsService;
  let prisma: PrismaService;

  beforeEach(() => {
    prisma = {
      account: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
    } as unknown as PrismaService;

    service = new AccountsService(prisma);
  });

  describe('findAll', () => {
    it('debe listar cuentas calculando saldo reservado en metas y saldo disponible', async () => {
      const mockAccounts = [
        {
          id: 'acc-1',
          userId: 'user-1',
          name: 'Cuenta Corriente',
          type: AccountType.CHECKING,
          currency: Currency.CLP,
          balance: new Prisma.Decimal(1000000),
          creditLimit: null,
          color: '#3B82F6',
          icon: 'wallet',
          isActive: true,
          savingGoals: [
            {
              id: 'goal-1',
              name: 'Vacaciones',
              currentAmount: new Prisma.Decimal(250000),
              targetAmount: new Prisma.Decimal(1000000),
              color: '#10B981',
              icon: 'plane',
            },
          ],
        },
      ];

      vi.spyOn(prisma.account, 'findMany').mockResolvedValue(mockAccounts as any);

      const result = await service.findAll('user-1');

      expect(result).toHaveLength(1);
      expect(result[0].balance).toBe(1000000);
      expect(result[0].reservedInSavings).toBe(250000);
      expect(result[0].availableBalance).toBe(750000);
    });
  });

  describe('create', () => {
    it('debe crear una cuenta correctamente si no está duplicada', async () => {
      vi.spyOn(prisma.account, 'findFirst').mockResolvedValue(null);

      const mockCreated = {
        id: 'acc-new',
        userId: 'user-1',
        name: 'Cuenta Dólares',
        institution: 'Banco Santander',
        accountNumber: '1234',
        type: AccountType.CHECKING,
        currency: Currency.USD,
        balance: new Prisma.Decimal(500),
        creditLimit: null,
        billingCloseDay: null,
        paymentDueDay: null,
        color: '#4F46E5',
        icon: 'dollar-sign',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(prisma.account, 'create').mockResolvedValue(mockCreated as any);

      const result = await service.create('user-1', {
        name: 'Cuenta Dólares',
        institution: 'Banco Santander',
        accountNumber: '1234',
        type: AccountType.CHECKING,
        currency: Currency.USD,
        balance: 500,
      });

      expect(result.id).toBe('acc-new');
      expect(result.balance).toBe(500);
    });

    it('debe lanzar ConflictException si ya existe una cuenta activa con el mismo nombre', async () => {
      vi.spyOn(prisma.account, 'findFirst').mockResolvedValue({
        id: 'existing-acc',
        name: 'Cuenta Corriente',
      } as any);

      await expect(
        service.create('user-1', {
          name: 'Cuenta Corriente',
          type: AccountType.CHECKING,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('debe crear una CuentaRUT (SIGHT_ACCOUNT) persistiendo institutionCode y description (v2)', async () => {
      vi.spyOn(prisma.account, 'findFirst').mockResolvedValue(null);
      const createSpy = vi.spyOn(prisma.account, 'create').mockResolvedValue({
        id: 'acc-rut',
        userId: 'user-1',
        name: 'CuentaRUT',
        institution: 'BancoEstado',
        institutionCode: 'banco_estado',
        description: 'Fondo para imprevistos',
        type: AccountType.SIGHT_ACCOUNT,
        currency: Currency.CLP,
        balance: new Prisma.Decimal(0),
        creditLimit: null,
      } as any);

      const result = await service.create('user-1', {
        name: '  CuentaRUT ',
        institution: 'BancoEstado',
        institutionCode: 'banco_estado',
        description: '  Fondo para imprevistos  ',
        type: AccountType.SIGHT_ACCOUNT,
      });

      expect(createSpy).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'CuentaRUT',
          institutionCode: 'banco_estado',
          description: 'Fondo para imprevistos',
          type: AccountType.SIGHT_ACCOUNT,
        }),
      });
      expect(result.type).toBe(AccountType.SIGHT_ACCOUNT);
    });
  });

  describe('update', () => {
    const existing = {
      id: 'acc-1',
      userId: 'user-1',
      name: 'Cuenta Corriente',
      isActive: true,
      savingGoals: [],
      balance: new Prisma.Decimal(1000),
      creditLimit: null,
    };

    it('debe actualizar descripción e institución y limpiar valores vacíos (v2)', async () => {
      vi.spyOn(prisma.account, 'findFirst').mockResolvedValue(existing as any);
      const updateSpy = vi.spyOn(prisma.account, 'update').mockResolvedValue({
        ...existing,
        institutionCode: null,
        description: 'Gastos del hogar',
      } as any);

      await service.update('user-1', 'acc-1', {
        institutionCode: '',
        description: 'Gastos del hogar',
      });

      expect(updateSpy).toHaveBeenCalledWith({
        where: { id: 'acc-1' },
        data: { institutionCode: null, description: 'Gastos del hogar' },
      });
    });

    it('debe lanzar ConflictException al renombrar con el nombre de otra cuenta activa', async () => {
      vi.spyOn(prisma.account, 'findFirst')
        .mockResolvedValueOnce(existing as any)
        .mockResolvedValueOnce({ id: 'acc-2', name: 'Visa' } as any);

      await expect(service.update('user-1', 'acc-1', { name: 'Visa' })).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('toggleActive', () => {
    it('debe alternar el estado activo/inactivo de la cuenta', async () => {
      vi.spyOn(prisma.account, 'findFirst').mockResolvedValue({
        id: 'acc-1',
        userId: 'user-1',
        name: 'Cuenta a Cerrar',
        isActive: true,
        savingGoals: [],
        balance: new Prisma.Decimal(0),
        creditLimit: null,
      } as any);

      vi.spyOn(prisma.account, 'update').mockResolvedValue({
        id: 'acc-1',
        name: 'Cuenta a Cerrar',
        isActive: false,
        balance: new Prisma.Decimal(0),
        creditLimit: null,
      } as any);

      const result = await service.toggleActive('user-1', 'acc-1');
      expect(result.isActive).toBe(false);
    });
  });
});
