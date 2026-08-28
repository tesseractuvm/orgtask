import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Input from '../Input';

describe('Input', () => {
  it('asocia la etiqueta con el campo', async () => {
    render(<Input label="Título de la tarea" />);

    const field = screen.getByLabelText('Título de la tarea');
    await userEvent.type(field, 'Feria Laboral Primavera');

    expect(field).toHaveValue('Feria Laboral Primavera');
  });

  it('marca el campo como inválido y describe el error', () => {
    render(<Input label="Fecha límite" error="Elige una fecha posterior a hoy." />);

    const field = screen.getByLabelText('Fecha límite');
    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(field).toHaveAccessibleDescription('Elige una fecha posterior a hoy.');
  });

  it('oculta la ayuda cuando hay un error, para no dar dos mensajes a la vez', () => {
    render(
      <Input label="Responsable" hint="Solo personas del área." error="Falta elegir." />
    );

    expect(screen.queryByText('Solo personas del área.')).not.toBeInTheDocument();
    expect(screen.getByText('Falta elegir.')).toBeInTheDocument();
  });
});
