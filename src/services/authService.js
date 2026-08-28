/**
 * Sesión. Es la única puerta de entrada a la autenticación: las pantallas no
 * saben si detrás hay Supabase o el almacén local.
 *
 * Hoy valida contra las cuentas de ejemplo. Cuando lleguen las credenciales de
 * Supabase, este archivo pasa a llamar a supabase.auth.signInWithPassword y
 * ninguna pantalla cambia.
 */
import { DEMO_PASSWORD } from '../data/seedData';
import { readState, updateState } from './localStore';

const espera = (ms = 220) => new Promise((r) => setTimeout(r, ms));

export async function signInWithPassword({ email, password }) {
  await espera();

  const correo = String(email ?? '').trim().toLowerCase();
  const perfil = readState().profiles.find((p) => p.email.toLowerCase() === correo);

  if (!perfil || password !== DEMO_PASSWORD) {
    throw new Error('Correo o contraseña incorrectos. Revisa e inténtalo de nuevo.');
  }

  updateState({ session: { profileId: perfil.id, startedAt: new Date().toISOString() } });
  return perfil;
}

export async function getSession() {
  const { session, profiles } = readState();
  if (!session) return null;
  return profiles.find((p) => p.id === session.profileId) ?? null;
}

export async function signOut() {
  updateState({ session: null });
}

export async function updateProfileName(profileId, fullName) {
  await espera(150);
  const nombre = String(fullName ?? '').trim();
  if (nombre.length < 3) {
    throw new Error('El nombre debe tener al menos 3 caracteres.');
  }

  const estado = readState();
  const profiles = estado.profiles.map((p) =>
    p.id === profileId ? { ...p, fullName: nombre } : p
  );
  // El nombre también aparece en la cronología ya registrada
  const events = estado.events.map((e) =>
    e.actorId === profileId ? { ...e, actorName: nombre } : e
  );

  updateState({ profiles, events });
  return profiles.find((p) => p.id === profileId);
}

export async function listProfiles() {
  return readState().profiles;
}

/** Solo para la pantalla de ingreso mientras usamos cuentas de ejemplo. */
export function demoAccounts() {
  return readState().profiles.map((p) => ({
    email: p.email,
    fullName: p.fullName,
    role: p.role,
    areaCode: p.areaCode,
    isAdmin: p.isAdmin,
  }));
}

/**
 * Cambio de contraseña. Sin Supabase no hay dónde guardarla de forma segura, así
 * que se valida y se avisa con claridad en vez de fingir que funcionó.
 */
export async function updatePassword(newPassword) {
  await espera(150);
  if (String(newPassword).length < 8) {
    throw new Error('La contraseña debe tener al menos 8 caracteres.');
  }
  throw new Error(
    'El cambio de contraseña necesita la conexión con Supabase. Mientras se usan cuentas de prueba, la contraseña es fija.'
  );
}
