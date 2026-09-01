-- ============================================================================
-- OrgTask · Gestion de cuentas desde SQL
--
-- Como ejecutarlo: panel de Supabase, SQL Editor, pegar todo y correr.
-- Requiere haber corrido antes 0001, 0002 y 0003.
-- Es seguro correrlo dos veces.
--
-- ----------------------------------------------------------------------------
-- Por que existe esta migracion
--
-- El seed creaba las cuentas insertando a mano en auth.users, pero solo llenaba
-- once columnas. Todas las demas quedaban en NULL, incluidas las de token:
-- confirmation_token, recovery_token, email_change_token_new y compania.
--
-- El servicio de autenticacion de Supabase (GoTrue, escrito en Go) lee esas
-- columnas como texto, no como texto-que-puede-ser-nulo. Cuando encuentra un
-- NULL donde espera una cadena, la lectura de la fila falla y responde
-- "Invalid login credentials", el mismo mensaje que usa cuando la contrasena
-- esta mala. De ahi que la cuenta se viera perfecta en la base y aun asi no
-- dejara entrar: el problema nunca fue la contrasena, era que GoTrue no podia
-- leer la fila completa.
--
-- Esta migracion no borra ni recrea a nadie. Repara las cuentas donde estan,
-- que es lo unico seguro: el id de cada persona es la llave con la que sus
-- tareas y su historial la reconocen (tasks.assignee_id, task_events.actor_id),
-- y las dos se apagan solas en cuanto la cuenta desaparece. Borrar a Javier
-- para volver a crearlo le habria dejado las tareas sin responsable y el
-- historial sin autor.
-- ============================================================================


create extension if not exists pgcrypto with schema extensions;


-- ----------------------------------------------------------------------------
-- 1. Rellenar los tokens de cualquier cuenta
--
-- Se recorren solo las columnas de token conocidas, y solo si existen en esta
-- version de Supabase. No se tocan otras columnas de texto (phone, por ejemplo)
-- porque ahi el NULL si tiene significado y cambiarlo romperia sus indices.
--
-- p_user_id en null significa "todas las cuentas".
-- ----------------------------------------------------------------------------

create or replace function public.admin_reparar_tokens(p_user_id uuid default null)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_columna  text;
  v_columnas text[] := array[
    'confirmation_token',
    'recovery_token',
    'email_change',
    'email_change_token_new',
    'email_change_token_current',
    'phone_change',
    'phone_change_token',
    'reauthentication_token'
  ];
  v_reparadas integer := 0;
  v_filas     integer;
begin
  foreach v_columna in array v_columnas loop
    if exists (
      select 1
        from information_schema.columns
       where table_schema = 'auth'
         and table_name   = 'users'
         and column_name  = v_columna
    ) then
      execute format(
        'update auth.users set %I = %L where %I is null and ($1 is null or id = $1)',
        v_columna, '', v_columna
      ) using p_user_id;

      get diagnostics v_filas = row_count;
      v_reparadas := v_reparadas + v_filas;
    end if;
  end loop;

  return v_reparadas;
end;
$$;


-- ----------------------------------------------------------------------------
-- 2. Crear una cuenta
--
-- Misma idea que la funcion del seed, pero escribiendo los tokens en cadena
-- vacia y fijando el costo del cifrado en 10, que es el que usa Supabase cuando
-- crea una cuenta por su cuenta.
--
-- Devuelve el id de la persona. Si el correo ya existe, no toca nada y devuelve
-- el id que ya tenia.
-- ----------------------------------------------------------------------------

create or replace function public.admin_crear_cuenta(
  p_email     text,
  p_password  text,
  p_full_name text,
  p_role      public.user_role,
  p_area_code text,
  p_color     text,
  p_is_admin  boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user_id           uuid;
  v_area_id           uuid;
  v_correo            text := lower(btrim(p_email));
  v_nombre            text := btrim(p_full_name);
  v_identity_data     jsonb;
  v_tiene_provider_id boolean;
begin
  if length(coalesce(p_password, '')) < 8 then
    raise exception 'La contrasena debe tener al menos 8 caracteres.';
  end if;
  if length(coalesce(v_nombre, '')) < 3 then
    raise exception 'El nombre debe tener al menos 3 caracteres.';
  end if;

  select id into v_user_id from auth.users where lower(email) = v_correo;
  if v_user_id is not null then
    return v_user_id;
  end if;

  if p_role = 'director' and p_area_code is not null then
    raise exception 'El Director no pertenece a un area.';
  end if;
  if p_role <> 'director' and p_area_code is null then
    raise exception 'Elige un area para este rol.';
  end if;

  if p_area_code is not null then
    select id into v_area_id from public.areas where code = p_area_code;
    if v_area_id is null then
      raise exception 'No existe el area con codigo %', p_area_code;
    end if;
  end if;

  v_user_id := gen_random_uuid();

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at,
    confirmation_token, recovery_token, email_change, email_change_token_new
  ) values (
    '00000000-0000-0000-0000-000000000000',
    v_user_id,
    'authenticated',
    'authenticated',
    v_correo,
    extensions.crypt(p_password, extensions.gen_salt('bf', 10)),
    now(),
    jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
    jsonb_build_object('full_name', v_nombre, 'email_verified', true),
    now(),
    now(),
    '', '', '', ''
  );

  -- Los tokens que no estan en el insert de arriba dependen de la version de
  -- Supabase, asi que se rellenan despues, solo si existen.
  perform public.admin_reparar_tokens(v_user_id);

  v_identity_data := jsonb_build_object(
    'sub', v_user_id::text,
    'email', v_correo,
    'email_verified', true,
    'phone_verified', false
  );

  select exists (
    select 1 from information_schema.columns
     where table_schema = 'auth'
       and table_name   = 'identities'
       and column_name  = 'provider_id'
  ) into v_tiene_provider_id;

  if v_tiene_provider_id then
    insert into auth.identities (
      id, provider_id, user_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), v_user_id::text, v_user_id, v_identity_data, 'email',
      now(), now(), now()
    );
  else
    insert into auth.identities (
      id, user_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), v_user_id, v_identity_data, 'email',
      now(), now(), now()
    );
  end if;

  insert into public.profiles (
    id, full_name, email, area_id, role, color_token, is_admin, is_active
  ) values (
    v_user_id, v_nombre, v_correo, v_area_id, p_role, p_color, p_is_admin, true
  );

  return v_user_id;
end;
$$;


-- ----------------------------------------------------------------------------
-- 3. Cambiar la contrasena de una cuenta
--
-- Sirve tanto para reparar una cuenta vieja como para dejarle a alguien una
-- clave temporal nueva. Repara los tokens de paso.
-- ----------------------------------------------------------------------------

create or replace function public.admin_cambiar_clave(
  p_email    text,
  p_password text
)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user_id uuid;
begin
  if length(coalesce(p_password, '')) < 8 then
    raise exception 'La contrasena debe tener al menos 8 caracteres.';
  end if;

  select id into v_user_id from auth.users where lower(email) = lower(btrim(p_email));
  if v_user_id is null then
    raise exception 'No existe una cuenta con el correo %', p_email;
  end if;

  update auth.users
     set encrypted_password = extensions.crypt(p_password, extensions.gen_salt('bf', 10)),
         email_confirmed_at = coalesce(email_confirmed_at, now()),
         aud                = 'authenticated',
         role               = 'authenticated',
         updated_at         = now()
   where id = v_user_id;

  perform public.admin_reparar_tokens(v_user_id);
end;
$$;


-- ----------------------------------------------------------------------------
-- 4. Cambiar los permisos de una cuenta
--
-- Solo toca public.profiles, que es donde viven el rol, el area, el color y el
-- permiso de administrar usuarios. Los parametros en null dejan el valor que
-- ya estaba.
-- ----------------------------------------------------------------------------

create or replace function public.admin_cambiar_permisos(
  p_email     text,
  p_role      public.user_role default null,
  p_area_code text            default null,
  p_color     text            default null,
  p_is_admin  boolean         default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_correo  text := lower(btrim(p_email));
  v_area_id uuid;
begin
  if p_area_code is not null then
    select id into v_area_id from public.areas where code = p_area_code;
    if v_area_id is null then
      raise exception 'No existe el area con codigo %', p_area_code;
    end if;
  end if;

  update public.profiles
     set role        = coalesce(p_role, role),
         area_id     = case
                         when coalesce(p_role, role) = 'director' then null
                         when p_area_code is not null             then v_area_id
                         else area_id
                       end,
         color_token = coalesce(p_color, color_token),
         is_admin    = coalesce(p_is_admin, is_admin),
         updated_at  = now()
   where lower(email) = v_correo;

  if not found then
    raise exception 'No existe un perfil con el correo %', p_email;
  end if;
end;
$$;


-- ----------------------------------------------------------------------------
-- 5. Activar o desactivar una cuenta
--
-- Nada se elimina, igual que las tareas se archivan en vez de borrarse. Una
-- cuenta desactivada no puede entrar, pero su nombre sigue apareciendo en las
-- tareas que hizo y en el historial.
-- ----------------------------------------------------------------------------

create or replace function public.admin_activar_cuenta(
  p_email  text,
  p_activa boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
     set is_active = p_activa, updated_at = now()
   where lower(email) = lower(btrim(p_email));

  if not found then
    raise exception 'No existe un perfil con el correo %', p_email;
  end if;
end;
$$;


-- ----------------------------------------------------------------------------
-- 6. Estas funciones no las puede llamar cualquiera
--
-- Escriben directo en auth.users saltandose toda politica RLS. Si quedaran al
-- alcance de una sesion normal, cualquiera podria crearse una cuenta con
-- is_admin en true. Solo las puede ejecutar el rol postgres, que es el que
-- corre el editor SQL del panel de Supabase.
-- ----------------------------------------------------------------------------

revoke all on function public.admin_reparar_tokens(uuid)
  from public, anon, authenticated;
revoke all on function public.admin_crear_cuenta(
  text, text, text, public.user_role, text, text, boolean
) from public, anon, authenticated;
revoke all on function public.admin_cambiar_clave(text, text)
  from public, anon, authenticated;
revoke all on function public.admin_cambiar_permisos(
  text, public.user_role, text, text, boolean
) from public, anon, authenticated;
revoke all on function public.admin_activar_cuenta(text, boolean)
  from public, anon, authenticated;


-- ----------------------------------------------------------------------------
-- 7. Reparar las diez cuentas que ya existen
--
-- Todas se crearon con el mismo insert incompleto, asi que a todas les falta lo
-- mismo. Se reparan donde estan, sin tocar sus id.
-- ----------------------------------------------------------------------------

select public.admin_reparar_tokens() as columnas_reparadas;


-- La contrasena de Javier se sobreescribio a mano mientras buscabamos el fallo,
-- asi que se vuelve a dejar en la documentada.
select public.admin_cambiar_clave('javier.moya@uvm.cl', 'OrgTaskDemo2026');

-- Y se confirma que es quien administra usuarios.
select public.admin_cambiar_permisos(
  p_email    => 'javier.moya@uvm.cl',
  p_is_admin => true
);
select public.admin_cambiar_permisos(
  p_email    => 'daniel.tello@uvm.cl',
  p_is_admin => false
);


-- ----------------------------------------------------------------------------
-- 8. Comprobacion
--
-- clave_valida compara la contrasena contra el cifrado guardado, dentro de la
-- propia base. Si sale true, el cifrado esta bien y la contrasena es la que
-- creemos.
--
-- tokens_nulos tiene que salir en 0. Si sale en algo mas, esa cuenta todavia
-- tiene el problema que impedia entrar.
-- ----------------------------------------------------------------------------

select
  u.email,
  u.encrypted_password = extensions.crypt('OrgTaskDemo2026', u.encrypted_password)
    as clave_valida,
  u.email_confirmed_at is not null as correo_confirmado,
  (
    (u.confirmation_token     is null)::int +
    (u.recovery_token         is null)::int +
    (u.email_change           is null)::int +
    (u.email_change_token_new is null)::int
  ) as tokens_nulos,
  (select count(*) from auth.identities i where i.user_id = u.id) as identidades,
  p.role,
  p.is_admin,
  p.is_active
from auth.users u
left join public.profiles p on p.id = u.id
order by p.is_admin desc nulls last, u.email;
