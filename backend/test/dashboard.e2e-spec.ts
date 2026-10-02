import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Dashboard E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let testUserId: string;

  const timestamp = Date.now();
  const testUserEmail = `dashboard_e2e_${timestamp}@finanzas.com`;
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

    // Registrar usuario de prueba
    const registerRes = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: testUserEmail,
        password: testPassword,
        fullName: 'Usuario Test Dashboard E2E',
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

  describe('GET /api/v1/dashboard/summary', () => {
    it('debe retornar 401 si no se envía token de autenticación', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/dashboard/summary')
        .expect(401);
    });

    it('debe retornar estructura completa con kpis, expensesByCategory, historicalTrend y upcomingDues', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/dashboard/summary')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('kpis');
      expect(res.body).toHaveProperty('expensesByCategory');
      expect(res.body).toHaveProperty('historicalTrend');
      expect(res.body).toHaveProperty('upcomingDues');
      expect(res.body).toHaveProperty('priorityGoals');

      expect(res.body.kpis).toHaveProperty('liquidAvailable');
      expect(res.body.kpis).toHaveProperty('netWorth');
      expect(res.body.kpis).toHaveProperty('savingsRate');
      expect(Array.isArray(res.body.historicalTrend)).toBe(true);
      expect(res.body.historicalTrend).toHaveLength(6);
    });
  });

  describe('GET /api/v1/dashboard/historical-trend', () => {
    it('debe responder con los últimos meses configurados', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/dashboard/historical-trend?months=4')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(4);
    });
  });

  describe('GET /api/v1/dashboard/expenses-by-category', () => {
    it('debe responder con categorías y totalExpenses', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/dashboard/expenses-by-category')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('totalExpenses');
      expect(res.body).toHaveProperty('categories');
      expect(Array.isArray(res.body.categories)).toBe(true);
    });
  });
});
