import { describe, it, expect } from 'vitest';

/**
 * La deteccion de "hay Supabase configurado" decide en silencio si la
 * aplicacion habla con la base o se queda con los datos de ejemplo del
 * navegador. Cuando se equivoca, no hay error: simplemente rechaza a las
 * personas reales como si no existieran. Por eso conviene probarla.
 */

// Copia exacta de la limpieza que hace client.js. Se prueba aparte porque
// client.js lee import.meta.env al importarse y no se puede reconfigurar.
function limpiar(valor) {
  return String(valor ?? '')
    .trim()
    .replace(/^['"]|['"]$/g, '')
    .trim();
}

function configurado(url, key) {
  const u = limpiar(url);
  const k = limpiar(key);
  if (!u || !k) return false;
  if (u.includes('tu-proyecto') || k.includes('reemplaza')) return false;
  try {
    new URL(u);
    return true;
  } catch {
    return false;
  }
}

const CLAVE = 'sb_publishable_abc123';

describe('Deteccion de Supabase configurado', () => {
  it('acepta los valores tal como los entrega el panel', () => {
    expect(configurado('https://abc.supabase.co', CLAVE)).toBe(true);
  });

  it('acepta la URL aunque venga entre comillas, que es el error tipico al pegarla', () => {
    expect(configurado('"https://abc.supabase.co"', CLAVE)).toBe(true);
    expect(configurado("'https://abc.supabase.co'", CLAVE)).toBe(true);
  });

  it('acepta la URL con espacios o salto de linea de sobra', () => {
    expect(configurado('  https://abc.supabase.co\n', CLAVE)).toBe(true);
  });

  it('sigue rechazando la plantilla sin reemplazar', () => {
    expect(configurado('https://tu-proyecto.supabase.co', CLAVE)).toBe(false);
    expect(configurado('https://abc.supabase.co', 'sb_publishable_reemplaza_con_tu_clave')).toBe(false);
  });

  it('rechaza lo que no es una URL y lo que falta', () => {
    expect(configurado('esto-no-es-una-url', CLAVE)).toBe(false);
    expect(configurado('', CLAVE)).toBe(false);
    expect(configurado('https://abc.supabase.co', '')).toBe(false);
    expect(configurado(undefined, undefined)).toBe(false);
  });
});
