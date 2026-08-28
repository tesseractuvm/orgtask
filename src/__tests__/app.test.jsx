import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import { DEMO_PASSWORD } from '../data/seedData';
import { resetState } from '../services/localStore';

async function entrarComo(email) {
  render(<App />);

  const usuario = userEvent.setup();
  await usuario.type(await screen.findByLabelText('Correo institucional'), email);
  await usuario.type(screen.getByLabelText('Contraseña'), DEMO_PASSWORD);
  await usuario.click(screen.getByRole('button', { name: 'Entrar' }));

  return usuario;
}

describe('Recorrido de la aplicación', () => {
  beforeEach(() => {
    // resetState limpia también la copia en memoria del almacén, no solo
    // localStorage: sin eso la sesión se filtraría de una prueba a la siguiente.
    resetState();
    window.history.pushState({}, '', '/');
  });

  it('rechaza credenciales incorrectas sin dejar entrar', async () => {
    render(<App />);
    const usuario = userEvent.setup();

    await usuario.type(
      await screen.findByLabelText('Correo institucional'),
      'director@demo.orgtask.cl'
    );
    await usuario.type(screen.getByLabelText('Contraseña'), 'clave-equivocada');
    await usuario.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/incorrectos/i);
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument();
  });

  it('el Director entra y ve las tres áreas en la navegación', async () => {
    await entrarComo('director@demo.orgtask.cl');

    expect(await screen.findByRole('heading', { name: 'Las tres áreas hoy' })).toBeInTheDocument();

    const navegacion = screen.getByRole('navigation', { name: 'Principal' });
    expect(within(navegacion).getByRole('link', { name: 'CPyG' })).toBeInTheDocument();
    expect(within(navegacion).getByRole('link', { name: 'RyVE' })).toBeInTheDocument();
    expect(within(navegacion).getByRole('link', { name: 'Deportes' })).toBeInTheDocument();
  });

  it('el líder de CPyG ve solo su área', async () => {
    await entrarComo('lider.cpyg@demo.orgtask.cl');

    const navegacion = await screen.findByRole('navigation', { name: 'Principal' });
    expect(within(navegacion).getByRole('link', { name: 'CPyG' })).toBeInTheDocument();
    expect(within(navegacion).queryByRole('link', { name: 'RyVE' })).not.toBeInTheDocument();
    expect(within(navegacion).queryByRole('link', { name: 'Deportes' })).not.toBeInTheDocument();
  });

  it('el tablero muestra las tres columnas con las tareas del área', async () => {
    const usuario = await entrarComo('lider.cpyg@demo.orgtask.cl');

    const navegacion = await screen.findByRole('navigation', { name: 'Principal' });
    await usuario.click(within(navegacion).getByRole('link', { name: 'CPyG' }));

    expect(await screen.findByRole('heading', { name: 'Por hacer' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'En proceso' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Hecho' })).toBeInTheDocument();

    expect(
      await screen.findByRole('heading', { name: 'Convenio de prácticas con empresa aliada' })
    ).toBeInTheDocument();
  });

  it('el líder puede crear tareas y el colaborador no', async () => {
    const usuario = await entrarComo('lider.cpyg@demo.orgtask.cl');
    const navegacion = await screen.findByRole('navigation', { name: 'Principal' });
    await usuario.click(within(navegacion).getByRole('link', { name: 'CPyG' }));

    expect(await screen.findByRole('button', { name: 'Crear tarea' })).toBeInTheDocument();
  });

  it('el colaborador no recibe el botón de crear tarea', async () => {
    const usuario = await entrarComo('colab.cpyg@demo.orgtask.cl');
    const navegacion = await screen.findByRole('navigation', { name: 'Principal' });
    await usuario.click(within(navegacion).getByRole('link', { name: 'CPyG' }));

    await screen.findByRole('heading', { name: 'Por hacer' });
    expect(screen.queryByRole('button', { name: 'Crear tarea' })).not.toBeInTheDocument();
  });

  it('el colaborador avanza su propia tarea de columna', async () => {
    const usuario = await entrarComo('colab.cpyg@demo.orgtask.cl');
    const navegacion = await screen.findByRole('navigation', { name: 'Principal' });
    await usuario.click(within(navegacion).getByRole('link', { name: 'CPyG' }));

    // "Boletín mensual" está asignado a Paula Cárdenas, la colaboradora
    const avanzar = await screen.findByRole('button', {
      name: 'Avanzar Boletín mensual de la comunidad de egresados',
    });
    expect(avanzar).toBeEnabled();
    await usuario.click(avanzar);

    await waitFor(() => {
      const enProceso = screen
        .getByRole('heading', { name: 'En proceso' })
        .closest('section');
      expect(
        within(enProceso).getByRole('heading', {
          name: 'Boletín mensual de la comunidad de egresados',
        })
      ).toBeInTheDocument();
    });
  });

  it('el colaborador no puede mover la tarea de otra persona', async () => {
    const usuario = await entrarComo('colab.cpyg@demo.orgtask.cl');
    const navegacion = await screen.findByRole('navigation', { name: 'Principal' });
    await usuario.click(within(navegacion).getByRole('link', { name: 'CPyG' }));

    // "Actualizar base de contactos" es de Luis Herrera
    const avanzar = await screen.findByRole('button', {
      name: 'Avanzar Actualizar base de contactos de graduados',
    });
    expect(avanzar).toBeDisabled();
  });

  it('el histórico agrupa lo archivado y muestra la cronología de una tarea', async () => {
    const usuario = await entrarComo('director@demo.orgtask.cl');
    const navegacion = await screen.findByRole('navigation', { name: 'Principal' });
    await usuario.click(within(navegacion).getByRole('link', { name: 'Histórico' }));

    const archivada = await screen.findByRole('button', {
      name: /Encuentro de networking para profesionales/,
    });
    await usuario.click(archivada);

    // Cada paso se lee como "Nombre · Acción", así que se busca por fragmento
    const dialogo = await screen.findByRole('dialog');
    expect(within(dialogo).getByText(/Creó la tarea/)).toBeInTheDocument();
    // Pasó por dos columnas: a En proceso y luego a Hecho
    expect(within(dialogo).getAllByText(/Movió la tarea/)).toHaveLength(2);
    expect(within(dialogo).getByText(/Archivó la tarea/)).toBeInTheDocument();
    expect(within(dialogo).getByText('Por hacer a En proceso')).toBeInTheDocument();
    expect(within(dialogo).getByText('En proceso a Hecho')).toBeInTheDocument();
  });

  it('los indicadores muestran el tiempo promedio de cierre', async () => {
    const usuario = await entrarComo('director@demo.orgtask.cl');
    const navegacion = await screen.findByRole('navigation', { name: 'Principal' });
    await usuario.click(within(navegacion).getByRole('link', { name: 'Indicadores' }));

    expect(await screen.findByText('días en promedio')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Tareas cerradas por mes' })).toBeInTheDocument();
  });
});
