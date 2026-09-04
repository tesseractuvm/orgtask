import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import handler from '../admin-users';

/**
 * Comprueba lo que la función decide ANTES de hablar con Supabase: qué nombres de
 * variable acepta y cómo avisa cuando falta algo o llega la clave equivocada.
 * Nada de esto sale a la red.
 */

const NOMBRES = [
  'SUPABASE_URL',
  'VITE_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_SECRET_KEY',
  'SUPABASE_SERVICE_KEY',
];

let guardadas;

beforeEach(() => {
  guardadas = Object.fromEntries(NOMBRES.map((n) => [n, process.env[n]]));
  for (const n of NOMBRES) delete process.env[n];
});

afterEach(() => {
  for (const [n, v] of Object.entries(guardadas)) {
    if (v === undefined) delete process.env[n];
    else process.env[n] = v;
  }
});

/** Imita el par req/res de Node con lo mínimo que usa la función. */
function peticion({ method = 'POST', authorization = 'Bearer token', body = {} } = {}) {
  const req = { method, headers: authorization ? { authorization } : {}, body };
  const res = {
    statusCode: 200,
    cuerpo: null,
    setHeader() {},
    end(texto) {
      this.cuerpo = JSON.parse(texto);
    },
  };
  return { req, res };
}

describe('Variables de entorno de la función', () => {
  it('avisa cuáles faltan, nombrando las dos', async () => {
    const { req, res } = peticion();
    await handler(req, res);

    expect(res.statusCode).toBe(500);
    expect(res.cuerpo.error).toMatch(/URL del proyecto/i);
    expect(res.cuerpo.error).toMatch(/clave secreta/i);
    expect(res.cuerpo.error).toMatch(/env:pull/);
  });

  it('avisa solo de la clave si la URL ya está como VITE_SUPABASE_URL', async () => {
    process.env.VITE_SUPABASE_URL = 'https://proyecto.supabase.co';

    const { req, res } = peticion();
    await handler(req, res);

    expect(res.statusCode).toBe(500);
    expect(res.cuerpo.error).toMatch(/clave secreta/i);
    expect(res.cuerpo.error).not.toMatch(/URL del proyecto/i);
  });

  it('rechaza la clave publishable puesta donde va la secreta', async () => {
    process.env.SUPABASE_URL = 'https://proyecto.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_publishable_abc123';

    const { req, res } = peticion();
    await handler(req, res);

    expect(res.statusCode).toBe(500);
    expect(res.cuerpo.error).toMatch(/publishable/i);
    expect(res.cuerpo.error).toMatch(/sb_secret_/);
  });

  it('acepta la clave secreta con el nombre alternativo SUPABASE_SECRET_KEY', async () => {
    process.env.VITE_SUPABASE_URL = 'https://proyecto.supabase.co';
    process.env.SUPABASE_SECRET_KEY = 'sb_secret_abc123';

    // Ya pasó la revisión de variables: ahora pide sesión, que es el paso siguiente
    const { req, res } = peticion({ authorization: null });
    await handler(req, res);

    expect(res.statusCode).toBe(401);
    expect(res.cuerpo.error).toMatch(/iniciar sesión/i);
  });

  it('no acepta métodos distintos de POST', async () => {
    const { req, res } = peticion({ method: 'GET' });
    await handler(req, res);

    expect(res.statusCode).toBe(405);
  });
});
