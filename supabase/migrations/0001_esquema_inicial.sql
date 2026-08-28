-- ============================================================================
-- OrgTask · Esquema inicial
-- Plataforma de gestion de tareas de la Direccion de Desarrollo Estudiantil
-- y Exalumnos (DEE) de UVM.
--
-- Como ejecutarlo: panel de Supabase, seccion SQL Editor, pegar todo y correr.
-- Es seguro correrlo dos veces: cada objeto se crea solo si no existe.
--
-- Contenido:
--   1. Tipos enumerados
--   2. Tablas: areas, profiles, tasks, task_events
--   3. Indices
--   4. Disparadores que mantienen updated_at, completed_at y el orden vertical
--   5. Disparadores que escriben la cronologia en task_events
--   6. Seguridad: RLS activado sin politicas (todo cerrado hasta la migracion 0002)
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. Tipos enumerados
--
-- El orden de declaracion importa: PostgreSQL ordena los valores de un enum
-- por el orden en que fueron declarados. Gracias a eso, "order by priority"
-- ya devuelve Alta, Media, Baja, y "order by status" devuelve las columnas del
-- tablero de izquierda a derecha, sin necesidad de una tabla de traduccion.
-- ----------------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1 from pg_type
    where typname = 'user_role' and typnamespace = 'public'::regnamespace
  ) then
    create type public.user_role as enum ('director', 'lider', 'colaborador');
  end if;

  if not exists (
    select 1 from pg_type
    where typname = 'task_priority' and typnamespace = 'public'::regnamespace
  ) then
    create type public.task_priority as enum ('alta', 'media', 'baja');
  end if;

  if not exists (
    select 1 from pg_type
    where typname = 'task_status' and typnamespace = 'public'::regnamespace
  ) then
    create type public.task_status as enum ('por_hacer', 'en_proceso', 'hecho');
  end if;

  if not exists (
    select 1 from pg_type
    where typname = 'task_event_type' and typnamespace = 'public'::regnamespace
  ) then
    create type public.task_event_type as enum (
      'creada',
      'estado_cambiado',
      'prioridad_cambiada',
      'responsable_cambiado',
      'detalle_editado',
      'archivada',
      'restaurada',
      'eliminada'
    );
  end if;
end
$$;


-- ----------------------------------------------------------------------------
-- 2. Tablas
-- ----------------------------------------------------------------------------

-- Las tres areas de la DEE. Tabla fija: no se crean areas desde la aplicacion.
create table if not exists public.areas (
  id            uuid        primary key default gen_random_uuid(),
  code          text        not null,
  name          text        not null,
  -- Nombre del color en el sistema de diseno (cpyg, ryve, deportes).
  -- Se guarda el nombre y no el hex para que un cambio de paleta no obligue
  -- a tocar la base de datos.
  color_token   text        not null,
  display_order smallint    not null,
  created_at    timestamptz not null default now(),

  constraint areas_code_unico      unique (code),
  constraint areas_orden_unico     unique (display_order),
  constraint areas_code_valido     check (code in ('CPYG', 'RYVE', 'DEPORTES'))
);

comment on table public.areas is
  'Las tres areas de la DEE. Cada tablero Kanban pertenece a una area.';


-- Perfil de cada persona. Se apoya en auth.users, que es donde Supabase guarda
-- el correo y la contrasena. Aqui vive todo lo que la aplicacion necesita saber:
-- a que area pertenece, que rol cumple y si puede administrar usuarios.
create table if not exists public.profiles (
  id         uuid             primary key references auth.users (id) on delete cascade,
  full_name  text             not null,
  email      text             not null,
  area_id    uuid             references public.areas (id) on delete restrict,
  role       public.user_role not null default 'colaborador',
  -- Permiso de administracion de usuarios, separado del rol en el area.
  -- Esa separacion es lo que permite que una misma persona sea colaboradora
  -- de su area y ademas administre las cuentas del equipo.
  is_admin   boolean          not null default false,
  is_active  boolean          not null default true,
  created_at timestamptz      not null default now(),
  updated_at timestamptz      not null default now(),

  constraint profiles_nombre_no_vacio check (length(btrim(full_name)) > 0),
  constraint profiles_email_valido    check (email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  -- El Director ve las tres areas, asi que no pertenece a ninguna.
  -- Lideres y colaboradores siempre pertenecen a una.
  constraint profiles_area_segun_rol  check (
    (role = 'director' and area_id is null)
    or (role <> 'director' and area_id is not null)
  )
);

create unique index if not exists profiles_email_unico
  on public.profiles (lower(email));

create index if not exists profiles_area_idx
  on public.profiles (area_id)
  where is_active;

comment on table public.profiles is
  'Perfil de cada integrante: area, rol y permiso de administracion.';
comment on column public.profiles.is_admin is
  'Permiso para administrar usuarios. Es independiente del rol en el area.';


-- Las tareas del tablero. Una tarea archivada sigue viviendo aqui con
-- archived_at lleno: sale del tablero pero no se pierde.
create table if not exists public.tasks (
  id           uuid                 primary key default gen_random_uuid(),
  area_id      uuid                 not null references public.areas (id) on delete restrict,
  title        text                 not null,
  description  text,
  assignee_id  uuid                 references public.profiles (id) on delete set null,
  priority     public.task_priority not null default 'media',
  status       public.task_status   not null default 'por_hacer',
  -- Orden vertical dentro de su grupo de prioridad. Es numeric a proposito:
  -- permite insertar una tarea entre dos existentes usando el punto medio,
  -- sin renumerar la columna completa.
  sort_order   numeric              not null,
  due_date     date,
  created_by   uuid                 references public.profiles (id) on delete set null,
  created_at   timestamptz          not null default now(),
  updated_at   timestamptz          not null default now(),
  -- Momento en que la tarea entro a la columna Hecho. Lo mantiene un disparador.
  completed_at timestamptz,
  archived_at  timestamptz,
  archived_by  uuid                 references public.profiles (id) on delete set null,

  constraint tasks_titulo_largo check (length(btrim(title)) between 3 and 120),
  constraint tasks_descripcion_largo check (
    description is null or length(description) <= 500
  ),
  -- Solo se archiva lo que ya esta hecho.
  constraint tasks_archiva_solo_hecho check (
    archived_at is null or status = 'hecho'
  )
);

create index if not exists tasks_tablero_idx
  on public.tasks (area_id, status, priority, sort_order)
  where archived_at is null;

create index if not exists tasks_archivadas_idx
  on public.tasks (archived_at desc)
  where archived_at is not null;

create index if not exists tasks_responsable_idx
  on public.tasks (assignee_id)
  where archived_at is null;

create index if not exists tasks_vencimiento_idx
  on public.tasks (due_date)
  where archived_at is null and status <> 'hecho';

comment on table public.tasks is
  'Tareas del tablero. Con archived_at lleno salen del tablero y pasan al historico.';
comment on column public.tasks.sort_order is
  'Orden vertical dentro del grupo de prioridad. Lo cambia set_task_priority.';


-- Cronologia de todo lo que le pasa a una tarea. La escriben disparadores,
-- nunca la aplicacion: asi el historial no se puede falsear desde el navegador.
-- Guarda copias del titulo de la tarea y del nombre de quien actuo para que la
-- cronologia siga siendo legible aunque la tarea se elimine o la persona salga.
create table if not exists public.task_events (
  id         bigint                   generated always as identity primary key,
  -- Queda en null cuando la tarea fue eliminada. El evento sobrevive.
  task_id    uuid                     references public.tasks (id) on delete cascade,
  area_id    uuid                     not null references public.areas (id) on delete restrict,
  task_title text                     not null,
  actor_id   uuid                     references public.profiles (id) on delete set null,
  actor_name text                     not null default 'Sistema',
  event_type public.task_event_type   not null,
  field      text,
  old_value  text,
  new_value  text,
  created_at timestamptz              not null default now()
);

create index if not exists task_events_tarea_idx
  on public.task_events (task_id, created_at);

create index if not exists task_events_area_fecha_idx
  on public.task_events (area_id, created_at desc);

create index if not exists task_events_tipo_fecha_idx
  on public.task_events (event_type, created_at desc);

comment on table public.task_events is
  'Cronologia de cada tarea. La escriben disparadores, no la aplicacion. '
  'Leida en orden es el historico; leida agregada son los indicadores.';


-- ----------------------------------------------------------------------------
-- 4. Disparadores de mantenimiento
-- ----------------------------------------------------------------------------

-- Mantiene updated_at al dia en cualquier tabla que lo tenga.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;


-- Al crear una tarea, la deja al final de su grupo de prioridad si no se
-- indico una posicion. El salto de 1000 deja espacio para intercalar despues.
create or replace function public.tasks_preparar_insercion()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.sort_order is null then
    select coalesce(max(t.sort_order), 0) + 1000
      into new.sort_order
      from public.tasks t
     where t.area_id  = new.area_id
       and t.status   = new.status
       and t.priority = new.priority
       and t.archived_at is null;
  end if;

  if new.status = 'hecho' and new.completed_at is null then
    new.completed_at := now();
  end if;

  return new;
end;
$$;


-- Mantiene completed_at segun las entradas y salidas de la columna Hecho.
create or replace function public.tasks_preparar_actualizacion()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();

  if new.status = 'hecho' and old.status <> 'hecho' then
    new.completed_at := now();
  elsif new.status <> 'hecho' and old.status = 'hecho' then
    new.completed_at := null;
  end if;

  return new;
end;
$$;


-- ----------------------------------------------------------------------------
-- 5. Disparadores que escriben la cronologia
--
-- Son security definer para que puedan escribir en task_events aunque la
-- persona que hizo el cambio no tenga permiso de escritura sobre esa tabla.
-- Eso es justamente lo que hace que el historial sea confiable.
-- ----------------------------------------------------------------------------

-- Devuelve quien esta actuando. En la aplicacion es la persona autenticada;
-- si el cambio viene del editor SQL no hay sesion y queda registrado como Sistema.
create or replace function public.actor_actual()
returns table (actor_id uuid, actor_name text)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.full_name
    from public.profiles p
   where p.id = auth.uid();
$$;


create or replace function public.tasks_registrar_creacion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id   uuid;
  v_actor_name text;
begin
  select a.actor_id, a.actor_name into v_actor_id, v_actor_name
    from public.actor_actual() a;

  insert into public.task_events (
    task_id, area_id, task_title, actor_id, actor_name,
    event_type, field, old_value, new_value, created_at
  )
  values (
    new.id, new.area_id, new.title, v_actor_id, coalesce(v_actor_name, 'Sistema'),
    'creada', null, null, new.status::text, new.created_at
  );

  return null;
end;
$$;


create or replace function public.tasks_registrar_cambios()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id   uuid;
  v_actor_name text;
  v_old_resp   text;
  v_new_resp   text;
begin
  select a.actor_id, a.actor_name into v_actor_id, v_actor_name
    from public.actor_actual() a;
  v_actor_name := coalesce(v_actor_name, 'Sistema');

  if new.status is distinct from old.status then
    insert into public.task_events (
      task_id, area_id, task_title, actor_id, actor_name,
      event_type, field, old_value, new_value
    ) values (
      new.id, new.area_id, new.title, v_actor_id, v_actor_name,
      'estado_cambiado', 'status', old.status::text, new.status::text
    );
  end if;

  if new.priority is distinct from old.priority then
    insert into public.task_events (
      task_id, area_id, task_title, actor_id, actor_name,
      event_type, field, old_value, new_value
    ) values (
      new.id, new.area_id, new.title, v_actor_id, v_actor_name,
      'prioridad_cambiada', 'priority', old.priority::text, new.priority::text
    );
  end if;

  if new.assignee_id is distinct from old.assignee_id then
    select full_name into v_old_resp from public.profiles where id = old.assignee_id;
    select full_name into v_new_resp from public.profiles where id = new.assignee_id;

    insert into public.task_events (
      task_id, area_id, task_title, actor_id, actor_name,
      event_type, field, old_value, new_value
    ) values (
      new.id, new.area_id, new.title, v_actor_id, v_actor_name,
      'responsable_cambiado', 'assignee_id',
      coalesce(v_old_resp, 'Sin responsable'),
      coalesce(v_new_resp, 'Sin responsable')
    );
  end if;

  if new.title is distinct from old.title then
    insert into public.task_events (
      task_id, area_id, task_title, actor_id, actor_name,
      event_type, field, old_value, new_value
    ) values (
      new.id, new.area_id, new.title, v_actor_id, v_actor_name,
      'detalle_editado', 'title', old.title, new.title
    );
  end if;

  if new.description is distinct from old.description then
    insert into public.task_events (
      task_id, area_id, task_title, actor_id, actor_name,
      event_type, field, old_value, new_value
    ) values (
      new.id, new.area_id, new.title, v_actor_id, v_actor_name,
      'detalle_editado', 'description', old.description, new.description
    );
  end if;

  if new.due_date is distinct from old.due_date then
    insert into public.task_events (
      task_id, area_id, task_title, actor_id, actor_name,
      event_type, field, old_value, new_value
    ) values (
      new.id, new.area_id, new.title, v_actor_id, v_actor_name,
      'detalle_editado', 'due_date',
      to_char(old.due_date, 'DD-MM-YYYY'), to_char(new.due_date, 'DD-MM-YYYY')
    );
  end if;

  if old.archived_at is null and new.archived_at is not null then
    insert into public.task_events (
      task_id, area_id, task_title, actor_id, actor_name,
      event_type, field, old_value, new_value
    ) values (
      new.id, new.area_id, new.title, v_actor_id, v_actor_name,
      'archivada', 'archived_at', null, to_char(new.archived_at, 'DD-MM-YYYY HH24:MI')
    );
  end if;

  if old.archived_at is not null and new.archived_at is null then
    insert into public.task_events (
      task_id, area_id, task_title, actor_id, actor_name,
      event_type, field, old_value, new_value
    ) values (
      new.id, new.area_id, new.title, v_actor_id, v_actor_name,
      'restaurada', 'archived_at', to_char(old.archived_at, 'DD-MM-YYYY HH24:MI'), null
    );
  end if;

  return null;
end;
$$;


-- Deja constancia de la eliminacion. El evento se escribe con task_id en null
-- a proposito: los demas eventos de esa tarea se borran en cascada, pero este
-- sobrevive, asi queda registro de quien elimino que y cuando.
create or replace function public.tasks_registrar_eliminacion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id   uuid;
  v_actor_name text;
begin
  select a.actor_id, a.actor_name into v_actor_id, v_actor_name
    from public.actor_actual() a;

  insert into public.task_events (
    task_id, area_id, task_title, actor_id, actor_name,
    event_type, field, old_value, new_value
  ) values (
    null, old.area_id, old.title, v_actor_id, coalesce(v_actor_name, 'Sistema'),
    'eliminada', null, old.status::text, null
  );

  return old;
end;
$$;


-- Registro de disparadores. Se borran antes de crearlos para que la migracion
-- se pueda volver a correr sin errores.
drop trigger if exists profiles_actualizar_fecha on public.profiles;
create trigger profiles_actualizar_fecha
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists tasks_antes_de_insertar on public.tasks;
create trigger tasks_antes_de_insertar
  before insert on public.tasks
  for each row execute function public.tasks_preparar_insercion();

drop trigger if exists tasks_antes_de_actualizar on public.tasks;
create trigger tasks_antes_de_actualizar
  before update on public.tasks
  for each row execute function public.tasks_preparar_actualizacion();

drop trigger if exists tasks_al_crear on public.tasks;
create trigger tasks_al_crear
  after insert on public.tasks
  for each row execute function public.tasks_registrar_creacion();

drop trigger if exists tasks_al_cambiar on public.tasks;
create trigger tasks_al_cambiar
  after update on public.tasks
  for each row execute function public.tasks_registrar_cambios();

drop trigger if exists tasks_al_eliminar on public.tasks;
create trigger tasks_al_eliminar
  before delete on public.tasks
  for each row execute function public.tasks_registrar_eliminacion();


-- ----------------------------------------------------------------------------
-- 6. Seguridad
--
-- RLS queda activado sin ninguna politica. En Supabase eso significa que nadie
-- que use la clave publica puede leer ni escribir: las tablas nacen cerradas.
-- Las politicas que abren el acceso segun el rol llegan en la migracion 0002.
--
-- Ademas se le quita todo permiso al rol anon: la aplicacion exige inicio de
-- sesion, asi que no existe ningun caso de uso anonimo.
-- ----------------------------------------------------------------------------

alter table public.areas       enable row level security;
alter table public.profiles    enable row level security;
alter table public.tasks       enable row level security;
alter table public.task_events enable row level security;

revoke all on public.areas       from anon;
revoke all on public.profiles    from anon;
revoke all on public.tasks       from anon;
revoke all on public.task_events from anon;

grant select                         on public.areas       to authenticated;
grant select, update                 on public.profiles    to authenticated;
grant select, insert, update, delete on public.tasks       to authenticated;
grant select                         on public.task_events to authenticated;
