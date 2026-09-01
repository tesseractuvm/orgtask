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
import { canManageUsers } from '../lib/permissions';

const espera = (ms = 220) => new Promise((r) => setTimeout(r, ms));

export async function signInWithPassword({ email, password }) {
  await espera();

  const correo = String(email ?? '').trim().toLowerCase();
  const perfil = readState().profiles.find((p) => p.email.toLowerCase() === correo);

  // Las cuentas del seed comparten la clave de demostración. Una cuenta creada
  // desde Usuarios guarda la suya propia, igual que haría Supabase Auth.
  const claveValida =
    perfil && (perfil.password ? password === perfil.password : password === DEMO_PASSWORD);

  if (!perfil || !claveValida) {
    throw new Error('Correo o contraseña incorrectos. Revisa e inténtalo de nuevo.');
  }
  if (perfil.isActive === false) {
    throw new Error('Tu cuenta está desactivada. Contacta a quien administra usuarios.');
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
  return readState()
    .profiles.filter((p) => p.isActive !== false)
    .map((p) => ({
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

/**
 * Alta de una persona nueva. Solo la hace quien administra usuarios: crea la
 * cuenta con una contraseña temporal que decide en el momento, y se la
 * comunica aparte, fuera de la aplicación. No hay envío de correo.
 */
export async function createProfile({
  fullName,
  email,
  areaCode,
  role,
  colorToken,
  isAdmin,
  password,
  actor,
}) {
  await espera(220);
  if (!canManageUsers(actor)) {
    throw new Error('Solo quien administra usuarios puede agregar personas.');
  }

  const correo = String(email ?? '').trim().toLowerCase();
  const nombre = String(fullName ?? '').trim();

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo)) {
    throw new Error('El correo no tiene un formato válido.');
  }
  if (nombre.length < 3) {
    throw new Error('El nombre debe tener al menos 3 caracteres.');
  }
  if (String(password ?? '').length < 8) {
    throw new Error('La contraseña debe tener al menos 8 caracteres.');
  }
  if (role === 'director' && areaCode) {
    throw new Error('El Director no pertenece a un área.');
  }
  if (role !== 'director' && !areaCode) {
    throw new Error('Elige un área para este rol.');
  }

  const estado = readState();
  if (estado.profiles.some((p) => p.email.toLowerCase() === correo)) {
    throw new Error('Ya existe una cuenta con ese correo.');
  }

  const nuevo = {
    id: `u-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    fullName: nombre,
    email: correo,
    areaCode: role === 'director' ? null : areaCode,
    role,
    colorToken,
    isAdmin: Boolean(isAdmin),
    isActive: true,
    // Solo existe en este modo local, para que la cuenta nueva pueda iniciar
    // sesión. Supabase Auth guarda la contraseña cifrada en su propia tabla;
    // acá no hay dónde más ponerla.
    password: String(password),
  };

  updateState({ profiles: [...estado.profiles, nuevo] });
  return nuevo;
}

/** Activar o desactivar una cuenta. Nunca se borra a nadie. */
export async function setProfileActive({ profileId, isActive, actor }) {
  await espera(160);
  if (!canManageUsers(actor)) {
    throw new Error('Solo quien administra usuarios puede activar o desactivar cuentas.');
  }

  const estado = readState();
  const profiles = estado.profiles.map((p) =>
    p.id === profileId ? { ...p, isActive: Boolean(isActive) } : p
  );
  updateState({ profiles });
  return profiles.find((p) => p.id === profileId);
}
