import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AccountCard } from './AccountCard';
import type { AccountWithSavings } from '../hooks/useAccounts';

const buildAccount = (overrides: Partial<AccountWithSavings> = {}): AccountWithSavings => ({
  id: 'acc-1',
  name: 'CuentaRUT',
  institution: 'BancoEstado',
  institutionCode: 'banco_estado',
  description: 'Fondo para imprevistos médicos',
  accountNumber: '1234',
  type: 'SIGHT_ACCOUNT',
  currency: 'CLP',
  balance: 150000,
  color: '#F26822',
  icon: 'wallet',
  isActive: true,
  reservedInSavings: 0,
  availableBalance: 150000,
  ...overrides,
});

describe('AccountCard (v2)', () => {
  it('debe mostrar badge de banco, insignia CuentaRUT y descripción', () => {
    render(<AccountCard account={buildAccount()} />);

    expect(screen.getByTestId('institution-badge')).toHaveTextContent('BancoEstado');
    expect(screen.getByTestId('institution-badge')).toHaveClass('text-orange-700');
    expect(screen.getByTestId('sight-account-badge')).toHaveTextContent('CuentaRUT');
    expect(screen.getByText('Fondo para imprevistos médicos')).toBeInTheDocument();
    expect(screen.getByTestId('institution-logo-banco_estado')).toBeInTheDocument();
  });

  it('debe mostrar "Cuenta Vista" para bancos distintos de BancoEstado', () => {
    render(
      <AccountCard
        account={buildAccount({ institution: 'Tenpo', institutionCode: 'tenpo', name: 'Tenpo' })}
      />,
    );
    expect(screen.getByTestId('sight-account-badge')).toHaveTextContent('Cuenta Vista');
  });

  it('debe mantener compatibilidad con cuentas v1 sin institutionCode', () => {
    render(
      <AccountCard
        account={buildAccount({
          type: 'CHECKING',
          institution: 'Caja Los Andes',
          institutionCode: null,
          description: null,
        })}
      />,
    );
    expect(screen.queryByTestId('institution-badge')).not.toBeInTheDocument();
    expect(screen.queryByTestId('sight-account-badge')).not.toBeInTheDocument();
    expect(screen.getByText('Caja Los Andes')).toBeInTheDocument();
  });

  it('debe invocar onEdit con la cuenta al presionar Editar', () => {
    const onEdit = vi.fn();
    const account = buildAccount();
    render(<AccountCard account={account} onEdit={onEdit} />);

    fireEvent.click(screen.getByRole('button', { name: /editar/i }));
    expect(onEdit).toHaveBeenCalledWith(account);
  });

  it('debe renderizar CurrencyToggle con opción de alternar a CLP si la cuenta es en USD', () => {
    const usdAccount = buildAccount({
      currency: 'USD',
      balance: 1500,
    });
    render(<AccountCard account={usdAccount} />);

    expect(screen.getByTestId('currency-toggle-amount')).toHaveTextContent('1,500.00');
    expect(screen.getByRole('button', { name: /ver en clp/i })).toBeInTheDocument();
  });
});
