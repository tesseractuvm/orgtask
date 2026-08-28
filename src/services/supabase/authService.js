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
