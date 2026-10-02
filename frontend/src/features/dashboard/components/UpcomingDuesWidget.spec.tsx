import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { UpcomingDuesWidget } from './UpcomingDuesWidget';
import type { UpcomingDueItem } from '../../../types';

describe('UpcomingDuesWidget Component', () => {
  it('debe mostrar mensaje amigable de "¡Todo al día!" cuando no hay compromisos pendientes', () => {
    render(
      <MemoryRouter>
        <UpcomingDuesWidget items={[]} currency="CLP" />
      </MemoryRouter>
    );

    expect(screen.getByText('¡Todo al día!')).toBeInTheDocument();
  });

  it('debe listar los compromisos con sus títulos y badges de urgencia', () => {
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
    ];

    render(
      <MemoryRouter>
        <UpcomingDuesWidget items={mockItems} currency="CLP" />
      </MemoryRouter>
    );

    expect(screen.getByText('Cobrar préstamo a Juan')).toBeInTheDocument();
    expect(screen.getByText('Pagar deuda a Banco')).toBeInTheDocument();
    expect(screen.getByText('Vencida')).toBeInTheDocument();
    expect(screen.getByText('3 días')).toBeInTheDocument();
  });
});
