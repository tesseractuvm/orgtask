const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

/**
 * Genera una contraseña temporal legible: sin 0/O ni 1/l/I, para que
 * transcribirla a mano (por chat, en persona) no dé lugar a dudas.
 */
export function generarClave(longitud = 10) {
  const valores = new Uint32Array(longitud);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(valores);
  } else {
    for (let i = 0; i < longitud; i += 1) valores[i] = Math.floor(Math.random() * 4294967296);
  }
  return Array.from(valores, (v) => ALFABETO[v % ALFABETO.length]).join('');
}

/** Mínimo que exigimos en la aplicación, por encima del de Supabase (6). */
export const LARGO_MINIMO_CLAVE = 8;
