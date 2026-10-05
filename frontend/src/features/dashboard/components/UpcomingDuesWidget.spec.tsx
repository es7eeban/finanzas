import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { UpcomingDuesWidget } from './UpcomingDuesWidget';
import type { UpcomingDueItem } from '../../../types';

describe('UpcomingDuesWidget Component', () => {
  it('debe mostrar mensaje amigable de "¡Todo al día!" cuando no hay compromisos pendientes', () => {
    render(
      <MemoryRouter>
        <UpcomingDuesWidget items={[]} currency="CLP" />
      </MemoryRouter>,
    );

    expect(screen.getByText('¡Todo al día!')).toBeInTheDocument();
  });

  it('debe listar los compromisos con sus títulos, montos y badges de urgencia', () => {
    const mockItems: UpcomingDueItem[] = [
      {
        id: 'due-1',
        title: 'Cobrar préstamo a Juan',
        category: 'DEBT_RECEIVABLE',
        amount: 50000,
        dueDate: '2026-10-15T00:00:00.000Z',
        daysRemaining: 3,
        urgency: 'urgent',
        status: 'PENDING',
      },
      {
        id: 'due-2',
        title: 'Pagar deuda a Banco',
        category: 'DEBT_PAYABLE',
        amount: 80000,
        dueDate: '2026-10-10T00:00:00.000Z',
        daysRemaining: -2,
        urgency: 'overdue',
        status: 'PENDING',
      },
      {
        id: 'due-3',
        title: 'Pagar: Luz Enel',
        category: 'RECURRING_BILL',
        amount: 25000,
        dueDate: '2026-10-12T00:00:00.000Z',
        daysRemaining: 7,
        urgency: 'upcoming',
        status: 'PENDING',
        executionType: 'MANUAL_CHECK',
        billCategory: 'UTILITIES',
      },
    ];

    render(
      <MemoryRouter>
        <UpcomingDuesWidget items={mockItems} currency="CLP" />
      </MemoryRouter>,
    );

    expect(screen.getByText('Cobrar préstamo a Juan')).toBeInTheDocument();
    expect(screen.getByText('Pagar deuda a Banco')).toBeInTheDocument();
    expect(screen.getByText('Pagar: Luz Enel')).toBeInTheDocument();

    // Contador de vencidos en la cabecera
    expect(screen.getByTestId('overdue-counter-badge')).toHaveTextContent(/1 vencido/i);
  });

  it('debe filtrar por pestaña de servicios al hacer clic', () => {
    const mockItems: UpcomingDueItem[] = [
      {
        id: 'due-1',
        title: 'Cobrar a Carlos',
        category: 'DEBT_RECEIVABLE',
        amount: 30000,
        dueDate: '2026-10-15T00:00:00.000Z',
        daysRemaining: 4,
        urgency: 'urgent',
        status: 'PENDING',
      },
      {
        id: 'due-2',
        title: 'Cargo PAT: Netflix',
        category: 'RECURRING_AUTOMATIC',
        amount: 10990,
        dueDate: '2026-10-18T00:00:00.000Z',
        daysRemaining: 7,
        urgency: 'upcoming',
        status: 'PENDING',
        executionType: 'AUTOMATIC',
        billCategory: 'SUBSCRIPTION',
      },
    ];

    render(
      <MemoryRouter>
        <UpcomingDuesWidget items={mockItems} currency="CLP" />
      </MemoryRouter>,
    );

    // Inicialmente se ven ambos
    expect(screen.getByText('Cobrar a Carlos')).toBeInTheDocument();
    expect(screen.getByText('Cargo PAT: Netflix')).toBeInTheDocument();

    // Filtrar por Servicios
    const servicesTab = screen.getByRole('button', { name: /servicios \(1\)/i });
    fireEvent.click(servicesTab);

    expect(screen.queryByText('Cobrar a Carlos')).not.toBeInTheDocument();
    expect(screen.getByText('Cargo PAT: Netflix')).toBeInTheDocument();
  });
});
