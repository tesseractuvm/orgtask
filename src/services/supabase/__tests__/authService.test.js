import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * El camino de Supabase nunca se habia ejecutado en una prueba: todo lo demas
 * corre contra el almacen local. Un fallo aqui se ve en pantalla igual que una
 * contrasena equivocada, asi que conviene tenerlo cubierto.
 *
 * No se habla con Supabase de verdad. Se reemplaza el cliente por uno de
 * mentira que devuelve lo que devolveria la base, y se comprueba que el
 * servicio traduzca bien cada caso.
 */

const authFalso = {
  signInWithPassword: vi.fn(),
  signOut: vi.fn().mockResolvedValue({ error: null }),
  getSession: vi.fn(),
};
const fromFalso = vi.fn();

vi.mock('../client', async () => {
  const real = await vi.importActual('../client');
  return {
    ...real,
    supabase: { auth: authFalso, from: fromFalso },
    supabaseConfigurado: () => true,
  };
});

const { signInWithPassword } = await import('../authService');

/** Encadena select/eq/order como lo hace supabase-js y termina en un resultado. */
function consulta(resultado) {
  const eslabon = {
    select: () => eslabon,
    eq: () => eslabon,
    order: () => Promise.resolve(resultado),
    maybeSingle: () => Promise.resolve(resultado),
    single: () => Promise.resolve(resultado),
  };
  return eslabon;
}

const AREAS = [
  { id: 'area-cpyg', code: 'CPYG', name: 'Comunidad de Profesionales y Graduados', display_order: 1 },
  { id: 'area-ryve', code: 'RYVE', name: 'Relación y Vinculación Estudiantil', display_order: 2 },
];

const FILA_JAVIER = {
  id: 'u-javier',
  full_name: 'Javier Moya',
  email: 'javier.moya@uvm.cl',
  area_id: 'area-cpyg',
  role: 'colaborador',
  color_token: 'azul',
  is_admin: true,
  is_active: true,
};

function prepararBase({ perfil = FILA_JAVIER, errorPerfil = null } = {}) {
  fromFalso.mockImplementation((tabla) =>
    tabla === 'areas'
      ? consulta({ data: AREAS, error: null })
      : consulta({ data: perfil, error: errorPerfil })
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  authFalso.signOut.mockResolvedValue({ error: null });
});

describe('Ingreso contra Supabase', () => {
  it('con la contraseña correcta devuelve el perfil ya traducido', async () => {
    authFalso.signInWithPassword.mockResolvedValue({
      data: { user: { id: 'u-javier' } },
      error: null,
    });
    prepararBase();

    const perfil = await signInWithPassword({
      email: 'javier.moya@uvm.cl',
      password: 'OrgTaskDemo2026',
    });

    expect(perfil).toMatchObject({
      id: 'u-javier',
      fullName: 'Javier Moya',
      areaCode: 'CPYG',
      role: 'colaborador',
      colorToken: 'azul',
      isAdmin: true,
    });
  });

  it('normaliza el correo antes de mandarlo, porque el brief los trae con mayúsculas', async () => {
    authFalso.signInWithPassword.mockResolvedValue({
      data: { user: { id: 'u-javier' } },
      error: null,
    });
    prepararBase();

    await signInWithPassword({
      email: '  Javier.Moya@UVM.cl  ',
      password: 'OrgTaskDemo2026',
    });

    expect(authFalso.signInWithPassword).toHaveBeenCalledWith({
      email: 'javier.moya@uvm.cl',
      password: 'OrgTaskDemo2026',
    });
  });

  it('traduce el rechazo de Supabase al mensaje en español', async () => {
    authFalso.signInWithPassword.mockResolvedValue({
      data: null,
      error: { message: 'Invalid login credentials' },
    });

    await expect(
      signInWithPassword({ email: 'javier.moya@uvm.cl', password: 'mala' })
    ).rejects.toThrow(/Correo o contraseña incorrectos/);
  });

  it('una cuenta desactivada no entra y ademas se cierra la sesión', async () => {
    authFalso.signInWithPassword.mockResolvedValue({
      data: { user: { id: 'u-javier' } },
      error: null,
    });
    prepararBase({ perfil: { ...FILA_JAVIER, is_active: false } });

    await expect(
      signInWithPassword({ email: 'javier.moya@uvm.cl', password: 'OrgTaskDemo2026' })
    ).rejects.toThrow(/desactivada/i);

    expect(authFalso.signOut).toHaveBeenCalled();
  });

  it('avisa con claridad cuando la cuenta existe pero le falta el perfil', async () => {
    authFalso.signInWithPassword.mockResolvedValue({
      data: { user: { id: 'u-fantasma' } },
      error: null,
    });
    prepararBase({ perfil: null });

    await expect(
      signInWithPassword({ email: 'quien.sea@uvm.cl', password: 'OrgTaskDemo2026' })
    ).rejects.toThrow(/no tiene perfil asignado/i);
  });
});
