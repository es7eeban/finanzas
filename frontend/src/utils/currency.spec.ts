import { describe, it, expect } from 'vitest';
import { formatCurrency } from './currency';

describe('formatCurrency', () => {
  it('debe formatear CLP sin decimales', () => {
    const formatted = formatCurrency(50000, 'CLP');
    // Normalizar espacios no separables de Intl
    const clean = formatted.replace(/\s+/g, ' ');
    expect(clean).toContain('50.000');
  });

  it('debe formatear USD con dos decimales', () => {
    const formatted = formatCurrency(1250.5, 'USD');
    expect(formatted).toContain('1,250.50');
  });

  it('debe manejar entradas inválidas o NaN retornando un valor por defecto', () => {
    expect(formatCurrency('abc' as any)).toBe('$ 0');
    expect(formatCurrency(NaN)).toBe('$ 0');
  });
});
