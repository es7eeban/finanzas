import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DatePicker } from './DatePicker';

describe('DatePicker Component', () => {
  it('debe renderizar el placeholder cuando el valor está vacío', () => {
    render(<DatePicker value="" onChange={vi.fn()} placeholder="Seleccionar fecha..." />);
    expect(screen.getByPlaceholderText('Seleccionar fecha...')).toBeInTheDocument();
  });

  it('debe abrir el calendario al hacer clic en el input de texto', () => {
    render(<DatePicker value="2026-10-02" onChange={vi.fn()} />);
    const input = screen.getByDisplayValue(/oct/i);
    expect(input).toBeInTheDocument();

    // El diálogo no debe estar abierto inicialmente
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // Al hacer clic, se despliega el diálogo del calendario
    fireEvent.click(input);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('debe llamar a onChange al seleccionar un día', () => {
    const handleChange = vi.fn();
    render(<DatePicker value="2026-10-02" onChange={handleChange} />);

    const input = screen.getByDisplayValue(/oct/i);
    fireEvent.click(input);

    // Seleccionar día 15
    const day15Button = screen.getByRole('button', { name: '15' });
    fireEvent.click(day15Button);

    expect(handleChange).toHaveBeenCalledWith('2026-10-15');
  });

  it('debe seleccionar la fecha de hoy al pulsar el botón "Hoy"', () => {
    const handleChange = vi.fn();
    render(<DatePicker value="" onChange={handleChange} />);

    const input = screen.getByPlaceholderText('Selecciona una fecha');
    fireEvent.click(input);

    const todayButton = screen.getByRole('button', { name: /hoy/i });
    fireEvent.click(todayButton);

    const today = new Date();
    const expectedStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    expect(handleChange).toHaveBeenCalledWith(expectedStr);
  });
});
