import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Financial Logic E2E (Fase 2 - DoD)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let testUserId: string;

  const timestamp = Date.now();
  const testUserEmail = `fase2_dod_${timestamp}@finanzas.com`;
  const testPassword = 'Password123!';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
    prisma = app.get(PrismaService);

    // 1. Registrar usuario de prueba
    const registerRes = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: testUserEmail,
        password: testPassword,
        fullName: 'Usuario Test E2E Fase 2',
      })
      .expect(201);

    authToken = registerRes.body.accessToken;
    testUserId = registerRes.body.user.id;
  });

  afterAll(async () => {
    if (testUserId) {
      await prisma.user.delete({
        where: { id: testUserId },
      });
    }
    await app.close();
  });

  describe('Criterio de Aceptación (DoD): Gasto atómico de $10.000 sobre saldo de $50.000', () => {
    it('debe crear cuenta con $50.000, registrar un gasto de $10.000 y dejar el saldo consistente en $40.000', async () => {
      // 1. Crear una cuenta con saldo inicial de $50.000
      const accountRes = await request(app.getHttpServer())
        .post('/api/v1/accounts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: `Cuenta Principal DoD ${timestamp}`,
          type: 'CHECKING',
          currency: 'CLP',
          balance: 50000,
        })
        .expect(201);

      const accountId = accountRes.body.id;
      expect(accountRes.body.balance).toBe(50000);

      // 2. Registrar un gasto (EXPENSE) de $10.000
      const txRes = await request(app.getHttpServer())
        .post('/api/v1/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          accountId,
          type: 'EXPENSE',
          amount: 10000,
          description: 'Compra supermercado - Prueba DoD',
        })
        .expect(201);

      expect(txRes.body.amount).toBe(10000);
      expect(txRes.body.type).toBe('EXPENSE');

      // 3. Consultar la cuenta y validar que el nuevo saldo sea $40.000 de forma consistente
      const updatedAccountRes = await request(app.getHttpServer())
        .get(`/api/v1/accounts/${accountId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(updatedAccountRes.body.balance).toBe(40000);
    });
  });

  describe('Flujo completo de Lógica Financiera: Ingresos, Transferencias, Metas y Deudas', () => {
    let mainAccountId: string;
    let savingsAccountId: string;

    it('debe registrar un ingreso de $25.000 incrementando el saldo', async () => {
      // Crear cuenta origen
      const acc1 = await request(app.getHttpServer())
        .post('/api/v1/accounts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: `Cuenta Ingresos ${timestamp}`,
          type: 'CHECKING',
          balance: 40000,
        })
        .expect(201);

      mainAccountId = acc1.body.id;

      // Registrar ingreso de $25.000
      await request(app.getHttpServer())
        .post('/api/v1/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          accountId: mainAccountId,
          type: 'INCOME',
          amount: 25000,
          description: 'Honorario freelance',
        })
        .expect(201);

      // Verificar que 40.000 + 25.000 = 65.000
      const checkRes = await request(app.getHttpServer())
        .get(`/api/v1/accounts/${mainAccountId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(checkRes.body.balance).toBe(65000);
    });

    it('debe transferir $15.000 debitando origen y acreditando destino', async () => {
      // Crear cuenta ahorro destino con $10.000
      const acc2 = await request(app.getHttpServer())
        .post('/api/v1/accounts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: `Cuenta Ahorro Destino ${timestamp}`,
          type: 'SAVINGS',
          balance: 10000,
        })
        .expect(201);

      savingsAccountId = acc2.body.id;

      // Transferir $15.000 de mainAccountId (65.000) a savingsAccountId (10.000)
      await request(app.getHttpServer())
        .post('/api/v1/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          accountId: mainAccountId,
          destinationAccountId: savingsAccountId,
          type: 'TRANSFER',
          amount: 15000,
          description: 'Aporte a cuenta de ahorro',
        })
        .expect(201);

      // Origen debe quedar en 50.000 (65.000 - 15.000)
      const originRes = await request(app.getHttpServer())
        .get(`/api/v1/accounts/${mainAccountId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(originRes.body.balance).toBe(50000);

      // Destino debe quedar en 25.000 (10.000 + 15.000)
      const destRes = await request(app.getHttpServer())
        .get(`/api/v1/accounts/${savingsAccountId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(destRes.body.balance).toBe(25000);
    });

    it('debe crear una meta de ahorro y aportar fondos actualizando el saldo reservado', async () => {
      const targetDate = new Date();
      targetDate.setMonth(targetDate.getMonth() + 6);

      // 1. Crear meta de ahorro de $100.000 vinculada a savingsAccountId
      const goalRes = await request(app.getHttpServer())
        .post('/api/v1/savings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: `Fondo de Vacaciones ${timestamp}`,
          targetAmount: 100000,
          targetAccountId: savingsAccountId,
          targetDate: targetDate.toISOString(),
        })
        .expect(201);

      const goalId = goalRes.body.id;
      expect(goalRes.body.currentAmount).toBe(0);
      expect(goalRes.body.progressPercentage).toBe(0);
      expect(goalRes.body.remainingAmount).toBe(100000);

      // 2. Aportar $5.000 a la meta desde mainAccountId
      const contributeRes = await request(app.getHttpServer())
        .post(`/api/v1/savings/${goalId}/contribute`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 5000,
          sourceAccountId: mainAccountId,
          note: 'Primer aporte quincenal',
        })
        .expect(201);

      expect(contributeRes.body.currentAmount).toBe(5000);
      expect(contributeRes.body.progressPercentage).toBe(5);

      // 3. Verificar que savingsAccountId ahora tiene $5.000 reservado en ahorro
      const accRes = await request(app.getHttpServer())
        .get(`/api/v1/accounts/${savingsAccountId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Balance total de savingsAccountId: 25.000 + 5.000 transferido = 30.000
      // Saldo reservado: 5.000
      // Saldo libre disponible: 25.000
      expect(accRes.body.balance).toBe(30000);
      expect(accRes.body.reservedInSavings).toBe(5000);
      expect(accRes.body.availableBalance).toBe(25000);
    });

    it('debe registrar un préstamo otorgado (LENT) debitando cuenta y recibir un abono parcial acreditando cuenta', async () => {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 10);

      // 1. Registrar préstamo de $20.000 prestados a un amigo desde mainAccountId (balance actual: 45.000)
      const debtRes = await request(app.getHttpServer())
        .post('/api/v1/debts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          contactName: 'Matías González',
          type: 'LENT',
          totalAmount: 20000,
          accountId: mainAccountId,
          dueDate: dueDate.toISOString(),
          notes: 'Préstamo para matrícula',
        })
        .expect(201);

      const debtId = debtRes.body.id;
      expect(debtRes.body.totalAmount).toBe(20000);
      expect(debtRes.body.pendingAmount).toBe(20000);
      expect(debtRes.body.status).toBe('PENDING');

      // Verificar que mainAccountId disminuyó de 45.000 a 25.000
      const originAccRes = await request(app.getHttpServer())
        .get(`/api/v1/accounts/${mainAccountId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(originAccRes.body.balance).toBe(25000);

      // 2. Registrar un abono de $8.000 hacia mainAccountId
      const paymentRes = await request(app.getHttpServer())
        .post(`/api/v1/debts/${debtId}/payments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 8000,
          accountId: mainAccountId,
          note: 'Transferencia primera cuota',
        })
        .expect(201);

      expect(paymentRes.body.pendingAmount).toBe(12000);
      expect(paymentRes.body.paidAmount).toBe(8000);
      expect(paymentRes.body.progressPercentage).toBe(40);
      expect(paymentRes.body.status).toBe('PARTIALLY_PAID');

      // Verificar que mainAccountId aumentó de 25.000 a 33.000 (25.000 + 8.000)
      const finalAccRes = await request(app.getHttpServer())
        .get(`/api/v1/accounts/${mainAccountId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(finalAccRes.body.balance).toBe(33000);
    });
  });
});
