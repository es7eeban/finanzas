import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from './auth.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { Currency } from '@prisma/client';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwtService: JwtService;

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
    } as unknown as PrismaService;

    jwtService = {
      signAsync: vi.fn().mockResolvedValue('fake_jwt_token'),
    } as unknown as JwtService;

    service = new AuthService(prisma, jwtService);
  });

  describe('register', () => {
    it('debe registrar un nuevo usuario exitosamente y retornar token', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);
      vi.spyOn(prisma.user, 'create').mockResolvedValue({
        id: 'user-1',
        email: 'test@finanzas.com',
        fullName: 'Test User',
        baseCurrency: Currency.CLP,
        passwordHash: 'hashed_pw',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.register({
        email: 'test@finanzas.com',
        password: 'Password123!',
        fullName: 'Test User',
      });

      expect(result.accessToken).toBe('fake_jwt_token');
      expect(result.user.email).toBe('test@finanzas.com');
      expect(result.user.fullName).toBe('Test User');
    });

    it('debe lanzar ConflictException si el email ya existe', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        id: 'user-1',
        email: 'test@finanzas.com',
      } as any);

      await expect(
        service.register({
          email: 'test@finanzas.com',
          password: 'Password123!',
          fullName: 'Test User',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('debe iniciar sesión con credenciales válidas', async () => {
      const passwordHash = await bcrypt.hash('Secret123!', 10);
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        id: 'user-1',
        email: 'test@finanzas.com',
        fullName: 'Test User',
        baseCurrency: Currency.CLP,
        passwordHash,
      } as any);

      const result = await service.login({
        email: 'test@finanzas.com',
        password: 'Secret123!',
      });

      expect(result.accessToken).toBe('fake_jwt_token');
      expect(result.user.id).toBe('user-1');
    });

    it('debe lanzar UnauthorizedException si la contraseña es incorrecta', async () => {
      const passwordHash = await bcrypt.hash('CorrectPass!', 10);
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        id: 'user-1',
        email: 'test@finanzas.com',
        passwordHash,
      } as any);

      await expect(
        service.login({
          email: 'test@finanzas.com',
          password: 'WrongPassword!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
