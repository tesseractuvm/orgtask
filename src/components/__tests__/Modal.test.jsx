import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Modal from '../Modal';

function abrirModal(props = {}) {
  const onClose = vi.fn();
  render(
    <Modal open onClose={onClose} title="Archivar tarea" {...props}>
      <button type="button">Confirmar</button>
    </Modal>
  );
  return onClose;
}

describe('Modal', () => {
  it('no renderiza nada cuando está cerrado', () => {
    render(
      <Modal open={false} onClose={() => {}} title="Archivar tarea">
        contenido
      </Modal>
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('se anuncia como diálogo con su título', () => {
    abrirModal();

    expect(screen.getByRole('dialog')).toHaveAccessibleName('Archivar tarea');
  });

  it('se cierra con la tecla Escape', async () => {
    const onClose = abrirModal();

    await userEvent.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('se cierra con el botón de cerrar', async () => {
    const onClose = abrirModal();

    await userEvent.click(screen.getByRole('button', { name: 'Cerrar' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('mueve el foco al primer elemento interactivo del diálogo', () => {
    abrirModal();

    expect(screen.getByRole('button', { name: 'Cerrar' })).toHaveFocus();
  });
});

describe('Modal y el foco del teclado', () => {
  it('no reinicia el foco cuando el componente se vuelve a renderizar', () => {
    const dialogo = (
      <Modal open onClose={() => {}} title="Archivar tarea">
        <button type="button">Confirmar</button>
      </Modal>
    );
    const { rerender } = render(dialogo);

    const confirmar = screen.getByRole('button', { name: 'Confirmar' });
    confirmar.focus();
    expect(confirmar).toHaveFocus();

    // Cada render entrega un onClose nuevo. Si la trampa de foco dependiera de
    // esa función, el foco saltaría fuera del elemento que la persona eligió.
    rerender(
      <Modal open onClose={() => {}} title="Archivar tarea">
        <button type="button">Confirmar</button>
      </Modal>
    );

    expect(confirmar).toHaveFocus();
  });

  it('cicla el foco con Tab sin salir del diálogo', async () => {
    render(
      <Modal open onClose={() => {}} title="Archivar tarea">
        <button type="button">Confirmar</button>
      </Modal>
    );

    const cerrar = screen.getByRole('button', { name: 'Cerrar' });
    const confirmar = screen.getByRole('button', { name: 'Confirmar' });

    expect(cerrar).toHaveFocus();
    await userEvent.tab();
    expect(confirmar).toHaveFocus();
    await userEvent.tab();
    expect(cerrar).toHaveFocus();
  });
});
