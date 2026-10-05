import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CurrencyToggle } from './CurrencyToggle';

describe('CurrencyToggle Component (v2)', () => {
  it('debe renderizar el monto original en USD inicialmente', () => {
    render(
      <CurrencyToggle
        amount={1500}
        currency="USD"
        rate={955.3}
        source="mindicador.cl"
      />,
    );

    const amountEl = screen.getByTestId('currency-toggle-amount');
    expect(amountEl.textContent).toContain('1,500.00');
    expect(screen.getByRole('button', { name: /ver en clp/i })).toBeInTheDocument();
  });

  it('debe alternar a CLP calculando el monto con la tasa en tiempo real (DoD)', () => {
    render(
      <CurrencyToggle
        amount={1500}
        currency="USD"
        rate={955.3}
        source="mindicador.cl"
      />,
    );

    const toggleButton = screen.getByRole('button', { name: /ver en clp/i });
    fireEvent.click(toggleButton);

    // 1500 * 955.3 = 1432950
    const amountEl = screen.getByTestId('currency-toggle-amount');
    expect(amountEl.textContent).toContain('1.432.950');

    // Debe mostrar la tasa en vivo aplicada en la insignia
    const badgeEl = screen.getByTestId('currency-toggle-badge');
    expect(badgeEl.textContent).toContain('955,30');
    expect(badgeEl.textContent).toContain('mindicador.cl');

    // El botón debe indicar la opción de regresar a USD
    expect(screen.getByRole('button', { name: /ver en usd/i })).toBeInTheDocument();
  });

  it('debe regresar al monto original en USD al presionar nuevamente', () => {
    render(
      <CurrencyToggle
        amount={1500}
        currency="USD"
        rate={955.3}
        source="mindicador.cl"
      />,
    );

    const toggleBtn = screen.getByRole('button', { name: /ver en clp/i });
    fireEvent.click(toggleBtn);
    expect(screen.getByTestId('currency-toggle-amount').textContent).toContain('1.432.950');

    const backBtn = screen.getByRole('button', { name: /ver en usd/i });
    fireEvent.click(backBtn);
    expect(screen.getByTestId('currency-toggle-amount').textContent).toContain('1,500.00');
    expect(screen.queryByTestId('currency-toggle-badge')).not.toBeInTheDocument();
  });
});
