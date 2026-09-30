/**
 * Formateador de moneda adaptable para Finanzas Personales.
 * Soporta CLP (Pesos Chilenos sin decimales) y USD (Dólares con 2 decimales).
 */

export type Currency = 'CLP' | 'USD';

export function formatCurrency(amount: number | string, currency: Currency = 'CLP'): string {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numericAmount)) {
    return '$ 0';
  }

  if (currency === 'CLP') {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
    }).format(numericAmount);
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericAmount);
}
