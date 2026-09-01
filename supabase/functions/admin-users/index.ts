// ============================================================================
// OrgTask · Función de administración de personas
//
// Es la única pieza de la aplicación que usa la clave privilegiada de
// Supabase (service role). Esa clave puede saltarse toda política RLS, así que
// nunca viaja al navegador: vive solo aquí, en el servidor, como variable de
// entorno que Supabase inyecta sola.
//
// Cómo se despliega: con el CLI de Supabase,
//   supabase functions deploy admin-users --project-ref TU_PROYECTO
// o pegando este archivo en el panel de Supabase, sección Edge Functions.
//
// Qué hace cada acción:
//   create     Crea la cuenta de una persona nueva con una contraseña que
//              define quien administra usuarios, y que le comunica aparte.
//              No hay envío de correo: nadie queda esperando un mail.
//   setActive  Activa o desactiva una cuenta. Nunca se borra a nadie, igual
//              que las tareas: se archivan, no desaparecen.
//
// Antes de tocar la base de datos, la función comprueba que quien llama tiene
// is_admin = true en su propio perfil. Ocultar el botón en la interfaz no
// alcanza: la comprobación real vive aquí.
// ============================================================================

import { createClient } from 'npm:@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ROLES_VALIDOS = ['director', 'lider', 'colaborador'];
const AREAS_VALIDAS = ['CPYG', 'RYVE', 'DEPORTES'];
const COLORES_VALIDOS = [
  'amarillo', 'rosado', 'azul', 'verde', 'lila',
  'magenta', 'cafe', 'gris', 'calipso', 'naranjo',
];

function json(cuerpo: unknown, status = 200) {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

function traducirError(error: { message?: string } | null, porDefecto: string) {
  const mensaje = error?.message ?? '';
  if (/already been registered|already exists|duplicate key/i.test(mensaje)) {
    return 'Ya existe una cuenta con ese correo.';
  }
  if (/Password should be/i.test(mensaje)) {
    return 'La contraseña no cumple los requisitos mínimos de Supabase (al menos 6 caracteres).';
  }
  return mensaje || porDefecto;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') {
    return json({ error: 'Método no permitido.' }, 405);
  }

  const url = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !anonKey || !serviceKey) {
    return json({ error: 'La función no tiene configuradas sus variables de entorno.' }, 500);
  }

  const encabezadoAuth = req.headers.get('Authorization');
  if (!encabezadoAuth) {
    return json({ error: 'Necesitas iniciar sesión.' }, 401);
  }

  // Cliente con el token de quien llama: solo sirve para saber quién es.
  const clienteLlamante = createClient(url, anonKey, {
    global: { headers: { Authorization: encabezadoAuth } },
  });
  const { data: sesion, error: errorSesion } = await clienteLlamante.auth.getUser();
  if (errorSesion || !sesion?.user) {
    return json({ error: 'Tu sesión expiró. Vuelve a iniciar sesión.' }, 401);
  }

  // Cliente con la clave privilegiada: todo lo que sigue pasa por acá.
  const admin = createClient(url, serviceKey);

  const { data: perfilLlamante, error: errorPerfil } = await admin
    .from('profiles')
    .select('is_admin')
    .eq('id', sesion.user.id)
    .maybeSingle();

  if (errorPerfil || !perfilLlamante?.is_admin) {
    return json({ error: 'Solo quien administra usuarios puede hacer esto.' }, 403);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'La solicitud no trae datos válidos.' }, 400);
  }

  if (body.action === 'create') return crearPersona(admin, body);
  if (body.action === 'setActive') return cambiarActivo(admin, body);
  return json({ error: 'Acción no reconocida.' }, 400);
});

async function crearPersona(admin: ReturnType<typeof createClient>, body: Record<string, unknown>) {
  const email = String(body.email ?? '').trim().toLowerCase();
  const fullName = String(body.fullName ?? '').trim();
  const password = String(body.password ?? '');
  const role = String(body.role ?? '');
  const areaCode = body.areaCode ? String(body.areaCode) : null;
  const colorToken = String(body.colorToken ?? '');
  const isAdmin = Boolean(body.isAdmin);

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return json({ error: 'El correo no tiene un formato válido.' }, 400);
  }
  if (fullName.length < 3) {
    return json({ error: 'El nombre debe tener al menos 3 caracteres.' }, 400);
  }
  if (password.length < 8) {
    return json({ error: 'La contraseña debe tener al menos 8 caracteres.' }, 400);
  }
  if (!ROLES_VALIDOS.includes(role)) {
    return json({ error: 'El rol no es válido.' }, 400);
  }
  if (role === 'director' && areaCode) {
    return json({ error: 'El Director no pertenece a un área.' }, 400);
  }
  if (role !== 'director' && !areaCode) {
    return json({ error: 'Elige un área para este rol.' }, 400);
  }
  if (areaCode && !AREAS_VALIDAS.includes(areaCode)) {
    return json({ error: 'El área no es válida.' }, 400);
  }
  if (!COLORES_VALIDOS.includes(colorToken)) {
    return json({ error: 'El color no es válido.' }, 400);
  }

  let areaId: string | null = null;
  if (areaCode) {
    const { data: area, error: errorArea } = await admin
      .from('areas')
      .select('id')
      .eq('code', areaCode)
      .single();
    if (errorArea || !area) return json({ error: 'No se encontró el área elegida.' }, 400);
    areaId = area.id;
  }

  const { data: creado, error: errorCrear } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (errorCrear || !creado?.user) {
    return json({ error: traducirError(errorCrear, 'No se pudo crear la cuenta.') }, 400);
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
    // Sin el perfil la cuenta queda inservible: se revierte para no dejar un
    // usuario fantasma que ocupe el correo sin que nadie pueda usarlo.
    await admin.auth.admin.deleteUser(creado.user.id);
    return json({ error: traducirError(errorPerfilNuevo, 'No se pudo guardar el perfil.') }, 400);
  }

  return json({ id: creado.user.id });
}

async function cambiarActivo(admin: ReturnType<typeof createClient>, body: Record<string, unknown>) {
  const userId = String(body.userId ?? '');
  const isActive = Boolean(body.isActive);
  if (!userId) return json({ error: 'Falta indicar la persona.' }, 400);

  const { error } = await admin.from('profiles').update({ is_active: isActive }).eq('id', userId);
  if (error) return json({ error: traducirError(error, 'No se pudo actualizar la cuenta.') }, 400);

  return json({ ok: true });
}
