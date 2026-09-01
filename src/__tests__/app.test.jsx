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
      'daniel.tello@uvm.cl'
    );
    await usuario.type(screen.getByLabelText('Contraseña'), 'clave-equivocada');
    await usuario.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/incorrectos/i);
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument();
  });

  it('el Director entra y ve las tres áreas en la navegación', async () => {
    await entrarComo('daniel.tello@uvm.cl');

    expect(await screen.findByRole('heading', { name: 'Las tres áreas hoy' })).toBeInTheDocument();

    const navegacion = screen.getByRole('navigation', { name: 'Principal' });
    expect(within(navegacion).getByRole('link', { name: 'CPyG' })).toBeInTheDocument();
    expect(within(navegacion).getByRole('link', { name: 'RyVE' })).toBeInTheDocument();
    expect(within(navegacion).getByRole('link', { name: 'Deportes' })).toBeInTheDocument();
  });

  it('el líder de CPyG ve solo su área', async () => {
    await entrarComo('francisca.tapia@uvm.cl');

    const navegacion = await screen.findByRole('navigation', { name: 'Principal' });
    expect(within(navegacion).getByRole('link', { name: 'CPyG' })).toBeInTheDocument();
    expect(within(navegacion).queryByRole('link', { name: 'RyVE' })).not.toBeInTheDocument();
    expect(within(navegacion).queryByRole('link', { name: 'Deportes' })).not.toBeInTheDocument();
  });

  it('el tablero muestra las tres columnas con las tareas del área', async () => {
    const usuario = await entrarComo('francisca.tapia@uvm.cl');

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
    const usuario = await entrarComo('francisca.tapia@uvm.cl');
    const navegacion = await screen.findByRole('navigation', { name: 'Principal' });
    await usuario.click(within(navegacion).getByRole('link', { name: 'CPyG' }));

    expect(await screen.findByRole('button', { name: 'Crear tarea' })).toBeInTheDocument();
  });

  it('el colaborador no recibe el botón de crear tarea', async () => {
    const usuario = await entrarComo('catalina.tamayo@uvm.cl');
    const navegacion = await screen.findByRole('navigation', { name: 'Principal' });
    await usuario.click(within(navegacion).getByRole('link', { name: 'CPyG' }));

    await screen.findByRole('heading', { name: 'Por hacer' });
    expect(screen.queryByRole('button', { name: 'Crear tarea' })).not.toBeInTheDocument();
  });

  it('el colaborador avanza su propia tarea de columna', async () => {
    const usuario = await entrarComo('catalina.tamayo@uvm.cl');
    const navegacion = await screen.findByRole('navigation', { name: 'Principal' });
    await usuario.click(within(navegacion).getByRole('link', { name: 'CPyG' }));

    // "Boletín mensual" está asignado a Catalina Tamayo, la colaboradora
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
    const usuario = await entrarComo('catalina.tamayo@uvm.cl');
    const navegacion = await screen.findByRole('navigation', { name: 'Principal' });
    await usuario.click(within(navegacion).getByRole('link', { name: 'CPyG' }));

    // "Actualizar base de contactos" es de Javier Moya, el otro colaborador de CPyG
    const avanzar = await screen.findByRole('button', {
      name: 'Avanzar Actualizar base de contactos de graduados',
    });
    expect(avanzar).toBeDisabled();
  });

  it('el histórico agrupa lo archivado y muestra la cronología de una tarea', async () => {
    const usuario = await entrarComo('daniel.tello@uvm.cl');
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
    const usuario = await entrarComo('daniel.tello@uvm.cl');
    const navegacion = await screen.findByRole('navigation', { name: 'Principal' });
    await usuario.click(within(navegacion).getByRole('link', { name: 'Indicadores' }));

    expect(await screen.findByText('días en promedio')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Tareas cerradas por mes' })).toBeInTheDocument();
  });
  it('la tarjeta se identifica con el color de su responsable, no con el del área', async () => {
    const usuario = await entrarComo('francisca.tapia@uvm.cl');
    const navegacion = await screen.findByRole('navigation', { name: 'Principal' });
    await usuario.click(within(navegacion).getByRole('link', { name: 'CPyG' }));

    await screen.findByRole('heading', { name: 'Por hacer' });

    // Dos tareas de la misma área, de personas distintas. Si el color fuera del
    // área, ambas saldrían iguales; el brief pide que salgan distintas.
    const tarjetaDe = (titulo) =>
      screen.getByRole('heading', { name: titulo }).closest('article');

    const deCatalina = within(
      tarjetaDe('Boletín mensual de la comunidad de egresados')
    ).getByTitle('Catalina Tamayo');
    const deJavier = within(
      tarjetaDe('Actualizar base de contactos de graduados')
    ).getByTitle('Javier Moya');

    expect(deCatalina).toHaveClass('bg-person-rosado');
    expect(deJavier).toHaveClass('bg-person-azul');

    // El color nunca va solo: la tarjeta lleva además las iniciales y el nombre
    expect(deCatalina).toHaveTextContent('CT');
    expect(deJavier).toHaveTextContent('JM');
    expect(
      within(tarjetaDe('Boletín mensual de la comunidad de egresados')).getByText(
        'Catalina Tamayo'
      )
    ).toBeInTheDocument();
  });
  it('el Director crea una persona nueva y ella puede iniciar sesión', async () => {
    const usuario = await entrarComo('daniel.tello@uvm.cl');
    const navegacion = await screen.findByRole('navigation', { name: 'Principal' });
    await usuario.click(within(navegacion).getByRole('link', { name: 'Usuarios' }));

    await usuario.click(await screen.findByRole('button', { name: 'Agregar persona' }));

    const dialogo = await screen.findByRole('dialog');
    await usuario.type(within(dialogo).getByLabelText('Nombre completo'), 'Persona Nueva');
    await usuario.type(
      within(dialogo).getByLabelText('Correo institucional'),
      'persona.nueva@uvm.cl'
    );
    await usuario.selectOptions(within(dialogo).getByLabelText('Rol'), 'colaborador');
    await usuario.selectOptions(within(dialogo).getByLabelText('Área'), 'CPYG');
    await usuario.selectOptions(within(dialogo).getByLabelText('Color de identificación'), 'gris');

    const claveGenerada = within(dialogo).getByLabelText('Contraseña temporal').value;
    expect(claveGenerada.length).toBeGreaterThanOrEqual(8);

    await usuario.click(within(dialogo).getByRole('button', { name: 'Crear cuenta' }));

    // Tras crearla, la pantalla se queda mostrando el correo y la clave: es la
    // única vez que la contraseña se puede ver.
    const confirmacion = await screen.findByRole('dialog', { name: 'Cuenta creada' });
    expect(within(confirmacion).getByText('persona.nueva@uvm.cl')).toBeInTheDocument();
    expect(within(confirmacion).getByText(claveGenerada)).toBeInTheDocument();
    await usuario.click(within(confirmacion).getByRole('button', { name: 'Entendido, cerrar' }));

    expect(await screen.findByText('Persona Nueva')).toBeInTheDocument();

    // La cuenta recién creada ya puede entrar, con la clave que se generó
    await usuario.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
    await screen.findByLabelText('Correo institucional');
    await usuario.type(screen.getByLabelText('Correo institucional'), 'persona.nueva@uvm.cl');
    await usuario.type(screen.getByLabelText('Contraseña'), claveGenerada);
    await usuario.click(screen.getByRole('button', { name: 'Entrar' }));

    await screen.findByText(/Hola, Persona/);
  });

  it('una cuenta desactivada no puede volver a iniciar sesión', async () => {
    const usuario = await entrarComo('daniel.tello@uvm.cl');
    const navegacion = await screen.findByRole('navigation', { name: 'Principal' });
    await usuario.click(within(navegacion).getByRole('link', { name: 'Usuarios' }));

    const fila = (await screen.findByText('Francisca Tapia')).closest('tr');
    await usuario.click(within(fila).getByRole('button', { name: /Desactivar a Francisca Tapia/ }));

    await screen.findByText('Desactivada');

    await usuario.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
    await screen.findByLabelText('Correo institucional');
    await usuario.type(screen.getByLabelText('Correo institucional'), 'francisca.tapia@uvm.cl');
    await usuario.type(screen.getByLabelText('Contraseña'), DEMO_PASSWORD);
    await usuario.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/desactivada/i);
  });

  it('un colaborador no ve la sección de Usuarios', async () => {
    await entrarComo('catalina.tamayo@uvm.cl');
    const navegacion = await screen.findByRole('navigation', { name: 'Principal' });
    expect(within(navegacion).queryByRole('link', { name: 'Usuarios' })).not.toBeInTheDocument();
  });
});
