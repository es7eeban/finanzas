import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from './Badge';

describe('Badge Component', () => {
  it('debe renderizar el texto hijo correctamente', () => {
    render(<Badge>Activo</Badge>);
    expect(screen.getByText('Activo')).toBeInTheDocument();
  });

  it('debe aplicar la clase correspondiente según la variante', () => {
    const { container } = render(<Badge variant="emerald">Completado</Badge>);
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('bg-emerald-50');
  });

  it('debe aplicar tamaño sm por defecto y md cuando se indique', () => {
    const { rerender, container } = render(<Badge size="sm">Pequeño</Badge>);
    expect(container.querySelector('span')).toHaveClass('text-[11px]');

    rerender(<Badge size="md">Mediano</Badge>);
    expect(container.querySelector('span')).toHaveClass('text-xs');
  });
});
