import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ExchangeRateService, DEFAULT_USD_CLP_RATE } from './exchange-rate.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { Prisma } from '@prisma/client';

describe('ExchangeRateService (v2)', () => {
  let service: ExchangeRateService;
  let prisma: PrismaService;

  beforeEach(() => {
    prisma = {
      exchangeRateCache: {
        findUnique: vi.fn(),
        upsert: vi.fn(),
      },
    } as unknown as PrismaService;

    service = new ExchangeRateService(prisma);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('debe retornar tasa 1.0 si las monedas de origen y destino son iguales', async () => {
    const result = await service.getCurrentRate('USD', 'USD');
    expect(result.rate).toBe(1.0);
    expect(result.source).toBe('identity');
  });

  it('debe retornar la tasa de caché si está vigente en la BD sin consultar la API externa', async () => {
    const futureDate = new Date(Date.now() + 6 * 60 * 60 * 1000); // en 6 horas
    vi.spyOn(prisma.exchangeRateCache, 'findUnique').mockResolvedValue({
      id: 'cache-1',
      fromCurrency: 'USD',
      toCurrency: 'CLP',
      rate: new Prisma.Decimal(965.5),
      source: 'mindicador.cl',
      fetchedAt: new Date(),
      expiresAt: futureDate,
    } as any);

    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    const result = await service.getCurrentRate('USD', 'CLP');
    expect(result.rate).toBe(965.5);
    expect(result.from).toBe('USD');
    expect(result.to).toBe('CLP');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('debe consultar la API externa y guardar en caché si la caché expiró', async () => {
    const pastDate = new Date(Date.now() - 1000);
    vi.spyOn(prisma.exchangeRateCache, 'findUnique').mockResolvedValue({
      id: 'cache-expired',
      fromCurrency: 'USD',
      toCurrency: 'CLP',
      rate: new Prisma.Decimal(920),
      source: 'mindicador.cl',
      fetchedAt: pastDate,
      expiresAt: pastDate,
    } as any);

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        serie: [{ fecha: '2026-10-04T00:00:00.000Z', valor: 980.25 }],
      }),
    } as any);

    vi.spyOn(prisma.exchangeRateCache, 'upsert').mockResolvedValue({
      id: 'cache-new',
      fromCurrency: 'USD',
      toCurrency: 'CLP',
      rate: new Prisma.Decimal(980.25),
      source: 'mindicador.cl',
      fetchedAt: new Date(),
      expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
    } as any);

    const result = await service.getCurrentRate('USD', 'CLP');
    expect(result.rate).toBe(980.25);
    expect(prisma.exchangeRateCache.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          fromCurrency_toCurrency: { fromCurrency: 'USD', toCurrency: 'CLP' },
        },
      }),
    );
  });

  it('debe usar fallback de caché expirada si la API externa falla', async () => {
    const pastDate = new Date(Date.now() - 1000);
    vi.spyOn(prisma.exchangeRateCache, 'findUnique').mockResolvedValue({
      id: 'cache-prev',
      fromCurrency: 'USD',
      toCurrency: 'CLP',
      rate: new Prisma.Decimal(945.8),
      source: 'mindicador.cl',
      fetchedAt: pastDate,
      expiresAt: pastDate,
    } as any);

    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Timeout mindicador.cl'));

    const result = await service.getCurrentRate('USD', 'CLP');
    expect(result.rate).toBe(945.8);
    expect(result.isFallback).toBe(true);
    expect(result.source).toContain('fallback_cache');
  });

  it('debe usar fallback estático por defecto si la API falla y no existe caché previa', async () => {
    vi.spyOn(prisma.exchangeRateCache, 'findUnique').mockResolvedValue(null);
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));

    const result = await service.getCurrentRate('USD', 'CLP');
    expect(result.rate).toBe(DEFAULT_USD_CLP_RATE);
    expect(result.source).toBe('default_fallback');
    expect(result.isFallback).toBe(true);
  });

  it('debe calcular tasa inversa para CLP a USD', async () => {
    vi.spyOn(prisma.exchangeRateCache, 'findUnique').mockResolvedValue({
      id: 'cache-1',
      fromCurrency: 'USD',
      toCurrency: 'CLP',
      rate: new Prisma.Decimal(1000),
      source: 'mindicador.cl',
      fetchedAt: new Date(),
      expiresAt: new Date(Date.now() + 100000),
    } as any);

    const result = await service.getCurrentRate('CLP', 'USD');
    expect(result.from).toBe('CLP');
    expect(result.to).toBe('USD');
    expect(result.rate).toBe(0.001);
  });
});
