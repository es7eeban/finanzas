import { useState, useEffect, useCallback } from 'react';
import { api } from '../../../services/api';
import type { ExchangeRateData } from '../../../types';

let cachedExchangeRate: ExchangeRateData | null = null;
let inflightPromise: Promise<ExchangeRateData> | null = null;

export function useExchangeRate() {
  const [data, setData] = useState<ExchangeRateData | null>(cachedExchangeRate);
  const [loading, setLoading] = useState<boolean>(!cachedExchangeRate);
  const [error, setError] = useState<string | null>(null);

  const fetchRate = useCallback(async (force: boolean = false) => {
    if (!force && cachedExchangeRate) {
      setData(cachedExchangeRate);
      setLoading(false);
      return cachedExchangeRate;
    }

    if (inflightPromise && !force) {
      try {
        const res = await inflightPromise;
        setData(res);
        setLoading(false);
        return res;
      } catch {
        // En caso de error se reintentará en el bloque inferior
      }
    }

    setLoading(true);
    setError(null);
    try {
      inflightPromise = api
        .get<ExchangeRateData>('/exchange-rate/current', {
          params: { from: 'USD', to: 'CLP' },
        })
        .then((res) => {
          cachedExchangeRate = res.data;
          return res.data;
        })
        .finally(() => {
          inflightPromise = null;
        });

      const result = await inflightPromise;
      setData(result);
      return result;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al obtener tipo de cambio';
      setError(msg);
      // Fallback prudente si falla la conexión
      const fallbackData: ExchangeRateData = {
        from: 'USD',
        to: 'CLP',
        rate: 950.0,
        source: 'default_fallback',
        fetchedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        isFallback: true,
      };
      cachedExchangeRate = fallbackData;
      setData(fallbackData);
      return fallbackData;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRate();
  }, [fetchRate]);

  const currentRate = data?.rate ?? 950.0;

  return {
    rate: currentRate,
    exchangeRateData: data,
    loading,
    error,
    refetch: () => fetchRate(true),
    convertToClp: (usdAmount: number) => Math.round(usdAmount * currentRate),
    convertToUsd: (clpAmount: number) => Number((clpAmount / currentRate).toFixed(2)),
  };
}
