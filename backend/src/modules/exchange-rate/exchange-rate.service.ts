import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';

export interface ExchangeRateResult {
  from: string;
  to: string;
  rate: number;
  source: string;
  fetchedAt: string;
  expiresAt: string;
  isFallback?: boolean;
}

interface MindicadorDolarResponse {
  version?: string;
  autor?: string;
  codigo?: string;
  nombre?: string;
  unidad_medida?: string;
  serie?: Array<{
    fecha: string;
    valor: number;
  }>;
}

export const DEFAULT_USD_CLP_RATE = 950.0;
export const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 horas

@Injectable()
export class ExchangeRateService {
  private readonly logger = new Logger(ExchangeRateService.name);
  private readonly apiUrl = 'https://mindicador.cl/api/dolar';

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Obtiene la tasa de cambio actual entre from y to con fallback resiliente.
   */
  async getCurrentRate(from: string = 'USD', to: string = 'CLP'): Promise<ExchangeRateResult> {
    const fromUpper = from.toUpperCase();
    const toUpper = to.toUpperCase();

    if (fromUpper === toUpper) {
      const now = new Date();
      return {
        from: fromUpper,
        to: toUpper,
        rate: 1.0,
        source: 'identity',
        fetchedAt: now.toISOString(),
        expiresAt: new Date(now.getTime() + CACHE_TTL_MS).toISOString(),
      };
    }

    if (fromUpper === 'USD' && toUpper === 'CLP') {
      return this.getUsdToClpRate();
    }

    if (fromUpper === 'CLP' && toUpper === 'USD') {
      const usdToClp = await this.getUsdToClpRate();
      return {
        from: 'CLP',
        to: 'USD',
        rate: Number((1 / usdToClp.rate).toFixed(6)),
        source: usdToClp.source,
        fetchedAt: usdToClp.fetchedAt,
        expiresAt: usdToClp.expiresAt,
        isFallback: usdToClp.isFallback,
      };
    }

    return this.getUsdToClpRate();
  }

  private async getUsdToClpRate(): Promise<ExchangeRateResult> {
    const now = new Date();

    // 1. Buscar en caché local de base de datos
    let cached = null;
    try {
      cached = await this.prisma.exchangeRateCache.findUnique({
        where: {
          fromCurrency_toCurrency: {
            fromCurrency: 'USD',
            toCurrency: 'CLP',
          },
        },
      });

      if (cached && new Date(cached.expiresAt) > now) {
        return {
          from: 'USD',
          to: 'CLP',
          rate: Number(cached.rate),
          source: cached.source,
          fetchedAt: cached.fetchedAt.toISOString(),
          expiresAt: cached.expiresAt.toISOString(),
        };
      }
    } catch (err: unknown) {
      this.logger.warn(
        `Error al consultar caché de tipo de cambio en BD: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }

    // 2. Intentar consultar servicio externo mindicador.cl
    try {
      const rateFromApi = await this.fetchRateFromExternalApi();
      if (rateFromApi && rateFromApi > 0) {
        const expiresAt = new Date(now.getTime() + CACHE_TTL_MS);

        try {
          const saved = await this.prisma.exchangeRateCache.upsert({
            where: {
              fromCurrency_toCurrency: {
                fromCurrency: 'USD',
                toCurrency: 'CLP',
              },
            },
            create: {
              fromCurrency: 'USD',
              toCurrency: 'CLP',
              rate: new Prisma.Decimal(rateFromApi),
              source: 'mindicador.cl',
              fetchedAt: now,
              expiresAt,
            },
            update: {
              rate: new Prisma.Decimal(rateFromApi),
              source: 'mindicador.cl',
              fetchedAt: now,
              expiresAt,
            },
          });

          return {
            from: 'USD',
            to: 'CLP',
            rate: Number(saved.rate),
            source: saved.source,
            fetchedAt: saved.fetchedAt.toISOString(),
            expiresAt: saved.expiresAt.toISOString(),
          };
        } catch {
          // Si falla el guardado en BD, devolvemos el valor fresco obtenido de la API
          return {
            from: 'USD',
            to: 'CLP',
            rate: rateFromApi,
            source: 'mindicador.cl',
            fetchedAt: now.toISOString(),
            expiresAt: expiresAt.toISOString(),
          };
        }
      }
    } catch (fetchErr: unknown) {
      this.logger.warn(
        `Fallo al consultar API mindicador.cl: ${
          fetchErr instanceof Error ? fetchErr.message : String(fetchErr)
        }`,
      );
    }

    // 3. Fallback: Si falló la API externa pero teníamos un valor previo en caché (aunque expirado)
    if (cached) {
      this.logger.log(`Usando tasa previa de caché en modo degradado (rate: ${cached.rate})`);
      return {
        from: 'USD',
        to: 'CLP',
        rate: Number(cached.rate),
        source: `${cached.source} (fallback_cache)`,
        fetchedAt: cached.fetchedAt.toISOString(),
        expiresAt: new Date(now.getTime() + 60 * 60 * 1000).toISOString(),
        isFallback: true,
      };
    }

    // 4. Fallback final por defecto si no hay conexión ni registros previos
    this.logger.warn(
      `Usando tasa por defecto estática (${DEFAULT_USD_CLP_RATE}) ante ausencia total de fuentes.`,
    );
    return {
      from: 'USD',
      to: 'CLP',
      rate: DEFAULT_USD_CLP_RATE,
      source: 'default_fallback',
      fetchedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + 60 * 60 * 1000).toISOString(),
      isFallback: true,
    };
  }

  private async fetchRateFromExternalApi(): Promise<number | null> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(this.apiUrl, {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          'User-Agent': 'AntigravityFinanzas/2.0',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = (await response.json()) as MindicadorDolarResponse;
      if (data.serie && data.serie.length > 0 && typeof data.serie[0].valor === 'number') {
        return data.serie[0].valor;
      }
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }
}
