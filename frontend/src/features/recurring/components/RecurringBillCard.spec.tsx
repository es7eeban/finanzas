import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RecurringBillCard } from './RecurringBillCard';
import type { RecurringBill } from '../../../types';

const buildBill = (overrides: Partial<RecurringBill> = {}): RecurringBill => ({
  id: 'bill-1',
  userId: 'user-1',
  name: 'Luz Enel',
  amount: 25000,
  currency: 'CLP',
  frequency: 'MONTHLY',
  executionType: 'MANUAL_CHECK',
  category: 'UTILITIES',
  dueDay: 12,
  nextDueDate: '2026-10-12T00:00:00.000Z',
  isActive: true,
  notes: 'Medidor departamento',
  isPaidThisMonth: false,
  daysRemaining: 8,
  isOverdue: false,
  status: 'PENDING',
  account: {
    id: 'acc-1',
    name: 'Cuenta Corriente Santander',
  },
  ...overrides,
});

describe('RecurringBillCard', () => {
  it('debe mostrar el nombre, categoría, monto y cuenta asignada', () => {
    render(
      <RecurringBillCard
        bill={buildBill()}
        onMarkPaid={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText('Luz Enel')).toBeInTheDocument();
    expect(screen.getByText('Servicios Básicos (Luz/Agua/Gas)')).toBeInTheDocument();
    expect(screen.getByText('$25.000')).toBeInTheDocument();
    expect(screen.getByText('Cuenta Corriente Santander')).toBeInTheDocument();
    expect(screen.getByText('Pago Manual')).toBeInTheDocument();
  });

  it('debe mostrar badge de PAT / Débito Automático para servicios automáticos', () => {
    render(
      <RecurringBillCard
        bill={buildBill({
          name: 'Netflix Premium',
          executionType: 'AUTOMATIC',
          category: 'SUBSCRIPTION',
        })}
        onMarkPaid={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText('PAT / Débito Automático')).toBeInTheDocument();
  });

  it('debe renderizar CurrencyToggle cuando la divisa es USD', () => {
    render(
      <RecurringBillCard
        bill={buildBill({
          name: 'AWS Cloud Services',
          currency: 'USD',
          amount: 45,
          category: 'TELECOM',
        })}
        onMarkPaid={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByTestId('currency-toggle-amount')).toHaveTextContent('45.00');
    expect(screen.getByRole('button', { name: /ver en clp/i })).toBeInTheDocument();
  });

  it('debe mostrar badge de estado vencido si isOverdue es true', () => {
    render(
      <RecurringBillCard
        bill={buildBill({
          isOverdue: true,
          status: 'OVERDUE',
          daysRemaining: -4,
        })}
        onMarkPaid={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByTestId('status-badge-overdue')).toBeInTheDocument();
    expect(screen.getByText(/vencido hace 4 d/i)).toBeInTheDocument();
  });

  it('debe mostrar badge de estado pagado e indicador de ciclo al día cuando isPaidThisMonth es true', () => {
    render(
      <RecurringBillCard
        bill={buildBill({
          isPaidThisMonth: true,
          status: 'PAID',
          currentExecution: {
            id: 'exec-1',
            recurringBillId: 'bill-1',
            amountPaid: 25000,
            period: '2026-10',
            paidAt: '2026-10-04T12:00:00.000Z',
            status: 'PAID',
          },
        })}
        onMarkPaid={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByTestId('status-badge-paid')).toBeInTheDocument();
    expect(screen.getByText(/al día este mes/i)).toBeInTheDocument();
    expect(screen.queryByTestId('mark-paid-button')).not.toBeInTheDocument();
  });

  it('debe invocar onMarkPaid al hacer clic en el botón Marcar como Pagado', () => {
    const onMarkPaid = vi.fn();
    const bill = buildBill();
    render(
      <RecurringBillCard
        bill={bill}
        onMarkPaid={onMarkPaid}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    const button = screen.getByTestId('mark-paid-button');
    fireEvent.click(button);

    expect(onMarkPaid).toHaveBeenCalledWith(bill);
  });

  it('debe invocar onEdit al hacer clic en el botón de edición', () => {
    const onEdit = vi.fn();
    const bill = buildBill();
    render(
      <RecurringBillCard
        bill={bill}
        onMarkPaid={vi.fn()}
        onEdit={onEdit}
        onDelete={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /editar luz enel/i }));
    expect(onEdit).toHaveBeenCalledWith(bill);
  });

  it('debe mostrar confirmación de eliminación y llamar onDelete al confirmar', async () => {
    const onDelete = vi.fn();
    const bill = buildBill();
    render(
      <RecurringBillCard
        bill={bill}
        onMarkPaid={vi.fn()}
        onEdit={vi.fn()}
        onDelete={onDelete}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /eliminar luz enel/i }));
    expect(screen.getByText(/¿eliminar "luz enel" y su programación\?/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    expect(onDelete).toHaveBeenCalledWith('bill-1');
  });
});
