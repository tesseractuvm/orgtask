/**
 * Sesión contra Supabase Auth. Mismas funciones que la versión local, así que
 * las pantallas no notan la diferencia.
 */
import { supabase, traducirError } from './client';
import { guardarAreas, perfilDesdeFila } from './mappers';

/** Las áreas se necesitan para traducir llaves a códigos, así que se cargan primero. */
async function asegurarAreas() {
  const { data, error } = await supabase.from('areas').select('*').order('display_order');
  if (error) throw new Error(traducirError(error, 'No se pudieron cargar las áreas.'));

  // Las tres áreas son datos fijos: siempre están. Que la consulta vuelva vacía
  // sin error significa que las políticas RLS no dejaron leer ni una fila, que
  // es lo que pasa cuando la sesión no llega como `authenticated` o cuando la
  // migración de seguridad no se aplicó completa. Sin este aviso el problema
  // aparecía más adelante disfrazado de "tu cuenta no tiene perfil asignado".
  if (!data || data.length === 0) {
    throw new Error(
      'La base de datos no devolvió ninguna área. Suele ser que las políticas de seguridad (RLS) no dejan leer las tablas: revisa que la migración 0002_politicas_seguridad.sql esté aplicada.'
    );
  }

  guardarAreas(data);
}

async function perfilDeUsuario(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw new Error(traducirError(error, 'No se pudo cargar tu perfil.'));
  if (!data) {
    throw new Error(
      'Tu cuenta existe pero no tiene perfil asignado. Pídele a quien administra usuarios que te asigne rol y área.'
    );
  }
  if (!data.is_active) {
    await supabase.auth.signOut();
    throw new Error('Tu cuenta está desactivada. Contacta a quien administra usuarios.');
  }
  return perfilDesdeFila(data);
}

export async function signInWithPassword({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: String(email ?? '').trim().toLowerCase(),
    password,
  });

  if (error) {
    if (/Invalid login credentials/i.test(error.message)) {
      throw new Error('Correo o contraseña incorrectos. Revisa e inténtalo de nuevo.');
    }
    if (/Email not confirmed/i.test(error.message)) {
      throw new Error('Tu correo aún no está confirmado. Revisa el enlace de invitación.');
    }
    throw new Error(traducirError(error, 'No se pudo iniciar sesión.'));
  }

  await asegurarAreas();
  return perfilDeUsuario(data.user.id);
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  if (!data.session) return null;

  await asegurarAreas();
  try {
    return await perfilDeUsuario(data.session.user.id);
  } catch {
    // Sesión válida pero sin perfil usable: se cierra para no dejar la app a medias
    await supabase.auth.signOut();
    return null;
  }
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function updateProfileName(profileId, fullName) {
  const nombre = String(fullName ?? '').trim();
  if (nombre.length < 3) {
    throw new Error('El nombre debe tener al menos 3 caracteres.');
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({ full_name: nombre })
    .eq('id', profileId)
    .select()
    .single();

  if (error) throw new Error(traducirError(error, 'No se pudo guardar tu nombre.'));
  return perfilDesdeFila(data);
}

export async function updatePassword(newPassword) {
  if (String(newPassword).length < 8) {
    throw new Error('La contraseña debe tener al menos 8 caracteres.');
  }
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new Error(traducirError(error, 'No se pudo cambiar la contraseña.'));
}

export async function listProfiles() {
  const { data, error } = await supabase.from('profiles').select('*').order('full_name');
  if (error) throw new Error(traducirError(error, 'No se pudo cargar el equipo.'));
  return data.map(perfilDesdeFila);
}

/** Con Supabase conectado no hay cuentas de ejemplo que ofrecer. */
export function demoAccounts() {
  return [];
}

/**
 * Las acciones que necesitan la clave secreta de Supabase: crear cuentas,
 * activarlas, asignar contraseñas y generar el acceso de prueba.
 *
 * Corren en una función serverless de Vercel, en `api/admin-users.js`, no en el
 * navegador. Se manda el token de la sesión actual solo para que el servidor
 * sepa quién pide la acción; el permiso de verdad se comprueba allá.
 */
async function llamarAdminUsers(action, payload) {
  const { data: sesion } = await supabase.auth.getSession();
  const token = sesion?.session?.access_token;
  if (!token) throw new Error('Tu sesión expiró. Vuelve a iniciar sesión.');

  let respuesta;
  try {
    respuesta = await fetch('/api/admin-users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action, ...payload }),
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor. Revisa tu conexión.');
  }

  // Si la ruta no existe, el servidor devuelve el index.html de la aplicación:
  // pasa cuando se levanta el proyecto sin la función, y conviene decirlo claro
  // en vez de mostrar un error de formato incomprensible.
  const tipo = respuesta.headers.get('content-type') ?? '';
  if (!tipo.includes('application/json')) {
    throw new Error(
      'La función de administración no está disponible en este entorno. ' +
        'Falta desplegar api/admin-users.js o configurar sus variables de entorno.'
    );
  }

  const cuerpo = await respuesta.json();
  if (!respuesta.ok || cuerpo?.error) {
    throw new Error(cuerpo?.error ?? 'No se pudo completar la acción.');
  }
  return cuerpo;
}

/** Alta de una persona nueva. La contraseña la define quien administra
 * usuarios y se la comunica aparte: no hay envío de correo. */
export async function createProfile({
  fullName,
  email,
  areaCode,
  role,
  colorToken,
  isAdmin,
  password,
}) {
  return llamarAdminUsers('create', {
    fullName,
    email,
    areaCode: role === 'director' ? null : areaCode,
    role,
    colorToken,
    isAdmin: Boolean(isAdmin),
    password,
  });
}

/** Activar o desactivar una cuenta. Nunca se borra a nadie. */
export async function setProfileActive({ profileId, isActive }) {
  return llamarAdminUsers('setActive', { userId: profileId, isActive: Boolean(isActive) });
}

/**
 * Le asigna una contraseña nueva a otra persona. La escribe Supabase Auth
 * cifrada; la aplicación no la guarda en ninguna parte, así que hay que
 * comunicarla en el momento.
 */
export async function setProfilePassword({ profileId, password }) {
  if (String(password ?? '').length < 8) {
    throw new Error('La contraseña debe tener al menos 8 caracteres.');
  }
  return llamarAdminUsers('setPassword', { userId: profileId, password });
}

/**
 * Abre una sesión real como otra persona, para probar el sistema con su rol.
 *
 * No es una simulación de la interfaz: se canjea un token de un solo uso por una
 * sesión de verdad, así que las políticas RLS responden con la identidad de esa
 * persona. Es la única forma de comprobar que los permisos funcionan.
 *
 * Efecto que hay que tener presente: la sesión de quien administra se reemplaza.
 * Para volver a la propia cuenta hay que iniciar sesión de nuevo.
 */
export async function startImpersonation({ profileId }) {
  const respuesta = await llamarAdminUsers('loginAs', { userId: profileId });
  if (!respuesta?.tokenHash) {
    throw new Error('No se pudo generar el acceso de prueba.');
  }

  const { error } = await supabase.auth.verifyOtp({
    token_hash: respuesta.tokenHash,
    type: 'magiclink',
  });

  if (error) {
    throw new Error(
      traducirError(error, 'No se pudo entrar como esa persona. Vuelve a intentarlo.')
    );
  }

  await asegurarAreas();
  const { data } = await supabase.auth.getSession();
  return perfilDeUsuario(data.session.user.id);
}
