import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from '../Button';

describe('Button', () => {
  it('muestra el texto de la acción y responde al clic', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Crear tarea</Button>);

    await userEvent.click(screen.getByRole('button', { name: 'Crear tarea' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('no dispara la acción cuando está deshabilitado', async () => {
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} disabled>
        Eliminar tarea
      </Button>
    );

    await userEvent.click(screen.getByRole('button', { name: 'Eliminar tarea' }));

    expect(screen.getByRole('button')).toBeDisabled();
    expect(onClick).not.toHaveBeenCalled();
  });

  it('bloquea el botón y lo anuncia como ocupado mientras carga', () => {
    render(<Button loading>Guardando</Button>);

    const button = screen.getByRole('button', { name: 'Guardando' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });
});
