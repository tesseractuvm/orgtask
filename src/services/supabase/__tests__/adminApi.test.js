import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Las acciones privilegiadas ya no viven en una Edge Function de Supabase, sino
 * en una función serverless de Vercel en `api/admin-users.js`. Acá se comprueba
 * el lado del navegador: que llame a la ruta correcta, que mande el token de la
 * sesión y que traduzca los dos fallos que más confunden.
 *
 * No se habla con la red: `fetch` se reemplaza por uno de mentira.
 */

const authFalso = {
  getSession: vi.fn(),
  verifyOtp: vi.fn(),
};

vi.mock('../client', async () => {
  const real = await vi.importActual('../client');
  return {
    ...real,
    supabase: { auth: authFalso, from: vi.fn() },
    supabaseConfigurado: () => true,
  };
});

const { setProfilePassword, setProfileActive } = await import('../authService');

function respuestaJson(cuerpo, ok = true, status = 200) {
  return {
    ok,
    status,
    headers: { get: () => 'application/json; charset=utf-8' },
    json: async () => cuerpo,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  authFalso.getSession.mockResolvedValue({
    data: { session: { access_token: 'token-de-prueba' } },
  });
});

describe('Llamada a la función de administración', () => {
  it('va a /api/admin-users con el token de la sesión', async () => {
    global.fetch = vi.fn().mockResolvedValue(respuestaJson({ ok: true }));

    await setProfilePassword({ profileId: 'u-1', password: 'ClaveNueva123' });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [ruta, opciones] = global.fetch.mock.calls[0];

    expect(ruta).toBe('/api/admin-users');
    expect(opciones.method).toBe('POST');
    expect(opciones.headers.Authorization).toBe('Bearer token-de-prueba');
    expect(JSON.parse(opciones.body)).toEqual({
      action: 'setPassword',
      userId: 'u-1',
      password: 'ClaveNueva123',
    });
  });

  it('valida el largo de la contraseña antes de salir a la red', async () => {
    global.fetch = vi.fn();

    await expect(
      setProfilePassword({ profileId: 'u-1', password: 'corta' })
    ).rejects.toThrow(/8 caracteres/i);

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('muestra el mensaje que devuelve el servidor', async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValue(
        respuestaJson({ error: 'Solo quien administra usuarios puede hacer esto.' }, false, 403)
      );

    await expect(setProfileActive({ profileId: 'u-1', isActive: false })).rejects.toThrow(
      /administra usuarios/i
    );
  });

  it('explica que falta la función cuando la ruta devuelve el HTML de la aplicación', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'text/html' },
      json: async () => ({}),
    });

    await expect(setProfileActive({ profileId: 'u-1', isActive: true })).rejects.toThrow(
      /no está disponible en este entorno/i
    );
  });

  it('pide iniciar sesión de nuevo si no hay token', async () => {
    authFalso.getSession.mockResolvedValue({ data: { session: null } });
    global.fetch = vi.fn();

    await expect(setProfileActive({ profileId: 'u-1', isActive: true })).rejects.toThrow(
      /sesión expiró/i
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
