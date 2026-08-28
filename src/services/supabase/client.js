import { createClient } from '@supabase/supabase-js';

/**
 * Cliente de Supabase. Se crea una sola vez.
 *
 * Las dos variables viven en .env y llevan el prefijo VITE_ porque el navegador
 * las necesita. La clave publishable está diseñada para ser pública: por sí sola
 * no da acceso a nada, lo que protege los datos son las políticas RLS.
 */
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

/** Detecta si las variables están puestas de verdad o siguen con el texto de ejemplo. */
export function supabaseConfigurado() {
  if (!url || !key) return false;
  if (url.includes('tu-proyecto') || key.includes('reemplaza')) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export const supabase = supabaseConfigurado()
  ? createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

/**
 * Traduce los errores de Postgres a algo que una persona entienda. Los mensajes
 * que lanzan las funciones de la base de datos ya vienen en español, así que
 * esos se muestran tal cual.
 */
export function traducirError(error, porDefecto = 'No se pudo completar la acción.') {
  if (!error) return porDefecto;

  const mensaje = error.message ?? '';

  // Los raise exception de nuestras funciones RPC llegan aquí sin cambios
  if (/Solo |No tienes|Necesitas|Esta tarea|La tarea|El rol/i.test(mensaje)) {
    return mensaje;
  }
  if (error.code === 'PGRST301' || /JWT/i.test(mensaje)) {
    return 'Tu sesión expiró. Vuelve a iniciar sesión.';
  }
  if (error.code === '42501' || /row-level security/i.test(mensaje)) {
    return 'No tienes permiso para esta acción.';
  }
  if (error.code === '23514') {
    return 'Alguno de los datos no cumple las reglas del tablero.';
  }
  if (/Failed to fetch|NetworkError/i.test(mensaje)) {
    return 'No se pudo conectar con el servidor. Revisa tu conexión.';
  }
  return mensaje || porDefecto;
}
