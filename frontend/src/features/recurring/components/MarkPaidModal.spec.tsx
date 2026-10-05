import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MarkPaidModal } from './MarkPaidModal';
import type { RecurringBill } from '../../../types';

vi.mock('../../accounts/hooks/useAccounts', () => ({
  useAccounts: () => ({
    accounts: [
      {
        id: 'acc-1',
        name: 'Cuenta Corriente Santander',
        type: 'CHECKING',
        currency: 'CLP',
        balance: 500000,
        isActive: true,
      },
      {
        id: 'acc-2',
        name: 'CuentaRUT BancoEstado',
        type: 'SIGHT_ACCOUNT',
        currency: 'CLP',
        balance: 100000,
        isActive: true,
      },
    ],
  }),
}));

const mockBill: RecurringBill = {
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
  accountId: 'acc-1',
};

describe('MarkPaidModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('no debe renderizar nada si isOpen es false', () => {
    const { container } = render(
      <MarkPaidModal
        isOpen={false}
        onClose={vi.fn()}
        bill={mockBill}
        onConfirm={vi.fn()}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('debe renderizar el formulario con los datos sugeridos de la boleta', () => {
    render(
      <MarkPaidModal
        isOpen={true}
        onClose={vi.fn()}
        bill={mockBill}
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.getByText('Confirmar Pago de Servicio')).toBeInTheDocument();
    expect(screen.getByText('Luz Enel')).toBeInTheDocument();

    const amountInput = screen.getByLabelText(/monto pagado/i) as HTMLInputElement;
    expect(amountInput.value).toBe('25000');

    const accountSelect = screen.getByLabelText(/cuenta de débito/i) as HTMLSelectElement;
    expect(accountSelect.value).toBe('acc-1');
  });

  it('debe invocar onConfirm con los datos completados al enviar el formulario', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    render(
      <MarkPaidModal
        isOpen={true}
        onClose={onClose}
        bill={mockBill}
        onConfirm={onConfirm}
      />,
    );

    const amountInput = screen.getByLabelText(/monto pagado/i);
    fireEvent.change(amountInput, { target: { value: '26500' } });

    const form = screen.getByRole('dialog').querySelector('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledWith(
        expect.objectContaining({
          accountId: 'acc-1',
          amountPaid: 26500,
        }),
      );
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('debe mostrar error si el monto ingresado es inválido o menor a 0', async () => {
    const onConfirm = vi.fn();

    render(
      <MarkPaidModal
        isOpen={true}
        onClose={vi.fn()}
        bill={mockBill}
        onConfirm={onConfirm}
      />,
    );

    const amountInput = screen.getByLabelText(/monto pagado/i);
    fireEvent.change(amountInput, { target: { value: '0' } });

    const form = screen.getByRole('dialog').querySelector('form')!;
    fireEvent.submit(form);

    expect(await screen.findByText(/por favor ingresa un monto válido mayor a 0/i)).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
