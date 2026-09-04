// ============================================================================
// OrgTask · Función de administración de personas (Vercel)
//
// Es la única pieza del proyecto que usa la clave secreta de Supabase. Esa clave
// se salta todas las políticas RLS, así que nunca puede viajar al navegador:
// vive solo acá, en el servidor de Vercel, como variable de entorno SIN el
// prefijo VITE_. Ese prefijo es justamente lo que Vite usa para entregar
// variables al navegador, así que su ausencia es la que garantiza que se queda
// del lado del servidor.
//
// Variables que necesita, en Vercel > Settings > Environment Variables:
//   SUPABASE_URL                 la misma URL del proyecto
//   SUPABASE_SERVICE_ROLE_KEY    la clave secreta (sb_secret_... o service_role)
//
// Qué hace cada acción:
//   create       Crea la cuenta de una persona nueva con una contraseña que
//                define quien administra usuarios, y que le comunica aparte.
//                No hay envío de correo: nadie queda esperando un mail.
//   setActive    Activa o desactiva una cuenta. Nunca se borra a nadie, igual
//                que las tareas: se archivan, no desaparecen.
//   setPassword  Le asigna una contraseña nueva a una persona.
//   loginAs      Devuelve un token de un solo uso para iniciar sesión como esa
//                persona, y así probar el sistema con cada rol. Es la acción más
//                delicada del proyecto, por eso solo funciona con cuentas
//                activas y nunca para uno mismo.
//
// Antes de tocar la base de datos comprueba que quien llama tenga is_admin en su
// perfil. Esconder el botón en la interfaz no alcanza: la comprobación real está
// acá, del lado del servidor.
// ============================================================================

import { createClient } from '@supabase/supabase-js';

const ROLES_VALIDOS = ['director', 'lider', 'colaborador'];
const AREAS_VALIDAS = ['CPYG', 'RYVE', 'DEPORTES'];
const COLORES_VALIDOS = [
  'amarillo', 'rosado', 'azul', 'verde', 'lila',
  'magenta', 'cafe', 'gris', 'calipso', 'naranjo',
];

/** Responde JSON usando solo la interfaz estándar de Node, para que el mismo
 * archivo sirva en Vercel y en el servidor de desarrollo de Vite. */
function responder(res, cuerpo, status = 200) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(cuerpo));
}

/** Vercel entrega el cuerpo ya interpretado; el servidor de Vite, no. */
async function leerCuerpo(req) {
  if (req.body && typeof req.body === 'object') return req.body;

  const trozos = [];
  for await (const trozo of req) trozos.push(trozo);
  const texto = Buffer.concat(trozos).toString('utf8');
  if (!texto) return {};
  return JSON.parse(texto);
}

function traducirError(error, porDefecto) {
  const mensaje = error?.message ?? '';
  if (/already been registered|already exists|duplicate key/i.test(mensaje)) {
    return 'Ya existe una cuenta con ese correo.';
  }
  if (/Password should be/i.test(mensaje)) {
    return 'La contraseña no cumple los requisitos mínimos de Supabase (al menos 6 caracteres).';
  }
  return mensaje || porDefecto;
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Allow', 'POST, OPTIONS');
    res.end();
    return;
  }
  if (req.method !== 'POST') {
    responder(res, { error: 'Método no permitido.' }, 405);
    return;
  }

  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    responder(
      res,
      {
        error:
          'El servidor no tiene configuradas SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY. ' +
          'Se agregan en Vercel, en Settings > Environment Variables, sin el prefijo VITE_.',
      },
      500
    );
    return;
  }

  const encabezado = req.headers.authorization ?? '';
  const token = encabezado.startsWith('Bearer ') ? encabezado.slice(7) : null;
  if (!token) {
    responder(res, { error: 'Necesitas iniciar sesión.' }, 401);
    return;
  }

  // Cliente con la clave secreta: todo lo que sigue pasa por acá.
  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // El token solo sirve para saber quién llama; los permisos se revisan abajo.
  const { data: sesion, error: errorSesion } = await admin.auth.getUser(token);
  if (errorSesion || !sesion?.user) {
    responder(res, { error: 'Tu sesión expiró. Vuelve a iniciar sesión.' }, 401);
    return;
  }

  const { data: perfilLlamante, error: errorPerfil } = await admin
    .from('profiles')
    .select('is_admin')
    .eq('id', sesion.user.id)
    .maybeSingle();

  if (errorPerfil || !perfilLlamante?.is_admin) {
    responder(res, { error: 'Solo quien administra usuarios puede hacer esto.' }, 403);
    return;
  }

  let body;
  try {
    body = await leerCuerpo(req);
  } catch {
    responder(res, { error: 'La solicitud no trae datos válidos.' }, 400);
    return;
  }

  try {
    if (body.action === 'create') return await crearPersona(res, admin, body);
    if (body.action === 'setActive') return await cambiarActivo(res, admin, body);
    if (body.action === 'setPassword') return await asignarClave(res, admin, body);
    if (body.action === 'loginAs') {
      return await tokenParaEntrarComo(res, admin, body, sesion.user.id);
    }
    responder(res, { error: 'Acción no reconocida.' }, 400);
  } catch (error) {
    responder(res, { error: traducirError(error, 'No se pudo completar la acción.') }, 500);
  }
}

async function crearPersona(res, admin, body) {
  const email = String(body.email ?? '').trim().toLowerCase();
  const fullName = String(body.fullName ?? '').trim();
  const password = String(body.password ?? '');
  const role = String(body.role ?? '');
  const areaCode = body.areaCode ? String(body.areaCode) : null;
  const colorToken = String(body.colorToken ?? '');
  const isAdmin = Boolean(body.isAdmin);

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return responder(res, { error: 'El correo no tiene un formato válido.' }, 400);
  }
  if (fullName.length < 3) {
    return responder(res, { error: 'El nombre debe tener al menos 3 caracteres.' }, 400);
  }
  if (password.length < 8) {
    return responder(res, { error: 'La contraseña debe tener al menos 8 caracteres.' }, 400);
  }
  if (!ROLES_VALIDOS.includes(role)) {
    return responder(res, { error: 'El rol no es válido.' }, 400);
  }
  if (role === 'director' && areaCode) {
    return responder(res, { error: 'El Director no pertenece a un área.' }, 400);
  }
  if (role !== 'director' && !areaCode) {
    return responder(res, { error: 'Elige un área para este rol.' }, 400);
  }
  if (areaCode && !AREAS_VALIDAS.includes(areaCode)) {
    return responder(res, { error: 'El área no es válida.' }, 400);
  }
  if (!COLORES_VALIDOS.includes(colorToken)) {
    return responder(res, { error: 'El color no es válido.' }, 400);
  }

  let areaId = null;
  if (areaCode) {
    const { data: area, error: errorArea } = await admin
      .from('areas')
      .select('id')
      .eq('code', areaCode)
      .single();
    if (errorArea || !area) {
      return responder(res, { error: 'No se encontró el área elegida.' }, 400);
    }
    areaId = area.id;
  }

  const { data: creado, error: errorCrear } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (errorCrear || !creado?.user) {
    return responder(res, { error: traducirError(errorCrear, 'No se pudo crear la cuenta.') }, 400);
  }

  const { error: errorPerfilNuevo } = await admin.from('profiles').insert({
    id: creado.user.id,
    full_name: fullName,
    email,
    area_id: areaId,
    role,
    color_token: colorToken,
    is_admin: isAdmin,
  });

  if (errorPerfilNuevo) {
    // Sin perfil la cuenta queda inservible: se revierte para no dejar un
    // usuario fantasma que ocupe el correo sin que nadie pueda usarlo.
    await admin.auth.admin.deleteUser(creado.user.id);
    return responder(
      res,
      { error: traducirError(errorPerfilNuevo, 'No se pudo guardar el perfil.') },
      400
    );
  }

  return responder(res, { id: creado.user.id });
}

async function cambiarActivo(res, admin, body) {
  const userId = String(body.userId ?? '');
  const isActive = Boolean(body.isActive);
  if (!userId) return responder(res, { error: 'Falta indicar la persona.' }, 400);

  const { error } = await admin.from('profiles').update({ is_active: isActive }).eq('id', userId);
  if (error) {
    return responder(res, { error: traducirError(error, 'No se pudo actualizar la cuenta.') }, 400);
  }

  return responder(res, { ok: true });
}

/**
 * Le asigna una contraseña nueva a una persona. La escribe Supabase Auth en su
 * propia tabla, cifrada: acá solo pasa de largo y no queda guardada en ningún
 * lado de la aplicación.
 */
async function asignarClave(res, admin, body) {
  const userId = String(body.userId ?? '');
  const password = String(body.password ?? '');

  if (!userId) return responder(res, { error: 'Falta indicar la persona.' }, 400);
  if (password.length < 8) {
    return responder(res, { error: 'La contraseña debe tener al menos 8 caracteres.' }, 400);
  }

  const { error } = await admin.auth.admin.updateUserById(userId, { password });
  if (error) {
    return responder(res, { error: traducirError(error, 'No se pudo asignar la contraseña.') }, 400);
  }

  return responder(res, { ok: true });
}

/**
 * Devuelve un token de un solo uso para iniciar sesión como otra persona.
 *
 * El correo se busca acá y no se recibe del navegador: así quien llama no puede
 * pedir un token para una dirección que no esté registrada como perfil.
 *
 * La sesión que se abre es real, no una simulación: las políticas RLS responden
 * con la identidad de esa persona, que es lo que hace útil la prueba.
 */
async function tokenParaEntrarComo(res, admin, body, quienLoPide) {
  const userId = String(body.userId ?? '');
  if (!userId) return responder(res, { error: 'Falta indicar la persona.' }, 400);
  if (userId === quienLoPide) {
    return responder(res, { error: 'Ya estás usando tu propia cuenta.' }, 400);
  }

  const { data: destino, error: errorPerfil } = await admin
    .from('profiles')
    .select('email, full_name, is_active')
    .eq('id', userId)
    .maybeSingle();

  if (errorPerfil || !destino) {
    return responder(res, { error: 'Esa persona no tiene perfil en la plataforma.' }, 404);
  }
  if (!destino.is_active) {
    return responder(
      res,
      { error: 'La cuenta está desactivada. Actívala antes de probar con ella.' },
      400
    );
  }

  const { data, error } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: destino.email,
  });

  if (error || !data?.properties?.hashed_token) {
    return responder(
      res,
      { error: traducirError(error, 'No se pudo generar el acceso de prueba.') },
      400
    );
  }

  return responder(res, {
    tokenHash: data.properties.hashed_token,
    email: destino.email,
    fullName: destino.full_name,
  });
}
