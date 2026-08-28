-- ============================================================================
-- OrgTask · Politicas de seguridad y funciones de permiso
--
-- La migracion 0001 dejo las tablas cerradas. Esta las abre, pero solo lo justo
-- para cada rol. Los permisos viven aqui, en la base de datos, y no en la
-- interfaz: esconder un boton no protege nada, porque cualquiera puede llamar a
-- la API directamente con la clave publica.
--
-- Como ejecutarlo: panel de Supabase, SQL Editor, pegar todo y correr.
-- Requiere haber corrido antes 0001_esquema_inicial.sql.
-- Es seguro correrlo dos veces.
--
-- Tabla de permisos que implementa:
--
--   Accion                          Director  Lider(su area)  Colaborador   Admin
--   Ver todas las areas             Si        No              No            Si
--   Crear, editar, eliminar tareas  Todas     Su area         No            No
--   Cambiar prioridad y orden       Todas     Su area         No            No
--   Cambiar estado (mover)          Todas     Su area         Solo las suyas No
--   Archivar al historico           Si        Su area         No            No
--   Restaurar del historico         Si        No              No            No
--   Gestionar usuarios              No        No              No            Si
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. Funciones auxiliares
--
-- Son security definer a proposito: necesitan leer la tabla profiles para saber
-- quien eres, y esa tabla esta protegida por las mismas politicas que estas
-- funciones alimentan. Sin security definer se produciria una recursion.
--
-- Todas exigen is_active: una cuenta desactivada no puede hacer nada, aunque
-- su usuario siga existiendo en auth.users.
-- ----------------------------------------------------------------------------

create or replace function public.current_profile()
returns public.profiles
language sql
stable
security definer
set search_path = public
as $$
  select p.*
    from public.profiles p
   where p.id = auth.uid()
     and p.is_active;
$$;

comment on function public.current_profile() is
  'Perfil de quien esta usando la aplicacion, o nada si la cuenta esta desactivada.';


create or replace function public.is_director()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select p.role = 'director' from public.current_profile() p), false);
$$;


create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select p.is_admin from public.current_profile() p), false);
$$;


create or replace function public.my_area()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select (select p.area_id from public.current_profile() p);
$$;


-- Quien ve un area: el Director y quien administra usuarios ven las tres;
-- el resto solo la propia.
create or replace function public.can_see_area(p_area_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_director()
      or public.is_admin()
      or p_area_id = public.my_area();
$$;


-- Quien manda en un area: el Director en todas, el lider en la suya.
-- Es la condicion para crear, editar, eliminar, priorizar y archivar.
create or replace function public.leads_area(p_area_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_director()
      or coalesce(
           (select p.role = 'lider' and p.area_id = p_area_id
              from public.current_profile() p),
           false
         );
$$;


-- ----------------------------------------------------------------------------
-- 2. Politicas de la tabla areas
--
-- Las tres areas son datos de referencia: cualquiera con sesion las lee, porque
-- se necesitan para mostrar nombres y colores. No se crean ni editan desde la
-- aplicacion, asi que no hay politicas de escritura.
-- ----------------------------------------------------------------------------

drop policy if exists areas_lectura on public.areas;
create policy areas_lectura
  on public.areas for select
  to authenticated
  using (true);


-- ----------------------------------------------------------------------------
-- 3. Politicas de la tabla profiles
-- ----------------------------------------------------------------------------

-- Cada persona se ve a si misma, ve a su equipo, y el Director o el admin ven a todos
drop policy if exists profiles_lectura on public.profiles;
create policy profiles_lectura
  on public.profiles for select
  to authenticated
  using (
    id = auth.uid()
    or public.is_director()
    or public.is_admin()
    or area_id = public.my_area()
  );

-- Solo el propio perfil. Que campos puede tocar lo controla el disparador de abajo
drop policy if exists profiles_actualizar_propio on public.profiles;
create policy profiles_actualizar_propio
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Nadie cambia su propio rol, area ni permiso de administracion. RLS trabaja por
-- fila y no por columna, asi que el limite por campo se pone con un disparador.
create or replace function public.profiles_proteger_campos()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- La Edge Function de administracion usa la clave privilegiada y no pasa por aqui
  if auth.uid() is null then
    return new;
  end if;

  if new.role      is distinct from old.role
     or new.area_id   is distinct from old.area_id
     or new.is_admin  is distinct from old.is_admin
     or new.is_active is distinct from old.is_active
     or new.email     is distinct from old.email
  then
    raise exception
      'El rol, el area, el correo y el estado de la cuenta los cambia quien administra usuarios.';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_proteger_campos on public.profiles;
create trigger profiles_proteger_campos
  before update on public.profiles
  for each row execute function public.profiles_proteger_campos();


-- ----------------------------------------------------------------------------
-- 4. Politicas de la tabla tasks
--
-- Nota deliberada: los colaboradores NO tienen politica de UPDATE. No es un
-- olvido. Cambian el estado de sus tareas unicamente a traves de la funcion
-- move_task, que valida que la tarea sea suya. Asi no pueden editar el titulo,
-- la prioridad ni el responsable por mas que llamen directo a la API.
-- ----------------------------------------------------------------------------

drop policy if exists tasks_lectura on public.tasks;
create policy tasks_lectura
  on public.tasks for select
  to authenticated
  using (public.can_see_area(area_id));

drop policy if exists tasks_crear on public.tasks;
create policy tasks_crear
  on public.tasks for insert
  to authenticated
  with check (public.leads_area(area_id));

drop policy if exists tasks_actualizar on public.tasks;
create policy tasks_actualizar
  on public.tasks for update
  to authenticated
  using (public.leads_area(area_id))
  with check (public.leads_area(area_id));

drop policy if exists tasks_eliminar on public.tasks;
create policy tasks_eliminar
  on public.tasks for delete
  to authenticated
  using (public.leads_area(area_id));


-- Devolver una tarea archivada al tablero es exclusivo del Director. El lider
-- puede archivar, pero no deshacerlo: para eso hay que subir un nivel.
create or replace function public.tasks_proteger_restauracion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  if old.archived_at is not null
     and new.archived_at is null
     and not public.is_director()
  then
    raise exception 'Solo el Director devuelve una tarea archivada al tablero.';
  end if;

  return new;
end;
$$;

drop trigger if exists tasks_proteger_restauracion on public.tasks;
create trigger tasks_proteger_restauracion
  before update on public.tasks
  for each row execute function public.tasks_proteger_restauracion();


-- ----------------------------------------------------------------------------
-- 5. Politicas de la tabla task_events
--
-- Solo lectura. La cronologia la escriben los disparadores de la migracion 0001,
-- que corren con permisos elevados. Nadie puede insertar, editar ni borrar
-- eventos desde la aplicacion: es lo que hace que el historial sea confiable.
-- ----------------------------------------------------------------------------

drop policy if exists task_events_lectura on public.task_events;
create policy task_events_lectura
  on public.task_events for select
  to authenticated
  using (public.can_see_area(area_id));


-- ----------------------------------------------------------------------------
-- 6. move_task: la unica via para cambiar de columna
--
-- Valida rol, area y propiedad, y deja la tarea al final de su grupo de
-- prioridad en la columna de destino.
-- ----------------------------------------------------------------------------

create or replace function public.move_task(
  p_task_id    uuid,
  p_new_status public.task_status
)
returns public.tasks
language plpgsql
security definer
set search_path = public
as $$
declare
  v_task    public.tasks;
  v_perfil  public.profiles;
  v_permite boolean := false;
  v_final   numeric;
begin
  select * into v_task from public.tasks where id = p_task_id;
  if v_task.id is null then
    raise exception 'La tarea ya no existe.';
  end if;

  select * into v_perfil from public.current_profile();
  if v_perfil.id is null then
    raise exception 'Necesitas iniciar sesion.';
  end if;

  if v_task.archived_at is not null then
    raise exception 'La tarea esta archivada. Hay que devolverla al tablero antes de moverla.';
  end if;

  -- El Director y el lider del area mueven cualquier tarea de esa area
  if public.leads_area(v_task.area_id) then
    v_permite := true;
  -- El colaborador mueve solo aquellas donde el es el responsable
  elsif v_perfil.role = 'colaborador'
        and v_perfil.area_id = v_task.area_id
        and v_task.assignee_id = v_perfil.id then
    v_permite := true;
  end if;

  if not v_permite then
    if v_perfil.area_id is distinct from v_task.area_id then
      raise exception 'Esta tarea pertenece a otra area.';
    else
      raise exception 'Solo puedes mover las tareas donde tu eres el responsable.';
    end if;
  end if;

  if v_task.status = p_new_status then
    return v_task;
  end if;

  select coalesce(max(t.sort_order), 0) + 1000
    into v_final
    from public.tasks t
   where t.area_id  = v_task.area_id
     and t.status   = p_new_status
     and t.priority = v_task.priority
     and t.archived_at is null;

  update public.tasks
     set status     = p_new_status,
         sort_order = v_final
   where id = p_task_id
  returning * into v_task;

  return v_task;
end;
$$;

comment on function public.move_task(uuid, public.task_status) is
  'Cambia la columna de una tarea. Unica via para los colaboradores.';


-- ----------------------------------------------------------------------------
-- 7. set_task_priority: prioridad y orden vertical
--
-- Reservada al Director y al lider del area. Si no se indica p_sort_order, la
-- tarea queda al final de su nuevo grupo de prioridad.
-- ----------------------------------------------------------------------------

create or replace function public.set_task_priority(
  p_task_id    uuid,
  p_priority   public.task_priority,
  p_sort_order numeric default null
)
returns public.tasks
language plpgsql
security definer
set search_path = public
as $$
declare
  v_task  public.tasks;
  v_final numeric;
begin
  select * into v_task from public.tasks where id = p_task_id;
  if v_task.id is null then
    raise exception 'La tarea ya no existe.';
  end if;

  if not public.leads_area(v_task.area_id) then
    raise exception 'Solo el Director y el lider del area cambian la prioridad.';
  end if;

  if p_sort_order is not null then
    v_final := p_sort_order;
  else
    select coalesce(max(t.sort_order), 0) + 1000
      into v_final
      from public.tasks t
     where t.area_id  = v_task.area_id
       and t.status   = v_task.status
       and t.priority = p_priority
       and t.archived_at is null
       and t.id <> p_task_id;
  end if;

  update public.tasks
     set priority   = p_priority,
         sort_order = v_final
   where id = p_task_id
  returning * into v_task;

  return v_task;
end;
$$;


-- ----------------------------------------------------------------------------
-- 8. archive_task y restore_task
--
-- Se exponen como funciones para que la aplicacion no tenga que saber que
-- archivar es "llenar dos columnas". Las reglas quedan en un solo lugar.
-- ----------------------------------------------------------------------------

create or replace function public.archive_task(p_task_id uuid)
returns public.tasks
language plpgsql
security definer
set search_path = public
as $$
declare
  v_task   public.tasks;
  v_perfil public.profiles;
begin
  select * into v_task from public.tasks where id = p_task_id;
  if v_task.id is null then
    raise exception 'La tarea ya no existe.';
  end if;

  select * into v_perfil from public.current_profile();

  if not public.leads_area(v_task.area_id) then
    raise exception 'Solo el Director y el lider del area archivan tareas.';
  end if;

  if v_task.status <> 'hecho' then
    raise exception 'Solo se archivan las tareas que ya estan en Hecho.';
  end if;

  update public.tasks
     set archived_at = now(),
         archived_by = v_perfil.id
   where id = p_task_id
  returning * into v_task;

  return v_task;
end;
$$;


create or replace function public.restore_task(p_task_id uuid)
returns public.tasks
language plpgsql
security definer
set search_path = public
as $$
declare
  v_task public.tasks;
begin
  if not public.is_director() then
    raise exception 'Solo el Director devuelve una tarea archivada al tablero.';
  end if;

  update public.tasks
     set archived_at = null,
         archived_by = null
   where id = p_task_id
  returning * into v_task;

  if v_task.id is null then
    raise exception 'La tarea ya no existe.';
  end if;

  return v_task;
end;
$$;


-- ----------------------------------------------------------------------------
-- 9. Permisos de ejecucion
--
-- Nadie sin sesion puede llamar a nada. Las funciones auxiliares solo informan
-- sobre el propio perfil, asi que se pueden exponer a quien tiene sesion.
-- ----------------------------------------------------------------------------

revoke all on function public.current_profile()                                    from public, anon;
revoke all on function public.is_director()                                        from public, anon;
revoke all on function public.is_admin()                                           from public, anon;
revoke all on function public.my_area()                                            from public, anon;
revoke all on function public.can_see_area(uuid)                                   from public, anon;
revoke all on function public.leads_area(uuid)                                     from public, anon;
revoke all on function public.move_task(uuid, public.task_status)                  from public, anon;
revoke all on function public.set_task_priority(uuid, public.task_priority, numeric) from public, anon;
revoke all on function public.archive_task(uuid)                                   from public, anon;
revoke all on function public.restore_task(uuid)                                   from public, anon;

grant execute on function public.current_profile()                                    to authenticated;
grant execute on function public.is_director()                                        to authenticated;
grant execute on function public.is_admin()                                           to authenticated;
grant execute on function public.my_area()                                            to authenticated;
grant execute on function public.can_see_area(uuid)                                   to authenticated;
grant execute on function public.leads_area(uuid)                                     to authenticated;
grant execute on function public.move_task(uuid, public.task_status)                  to authenticated;
grant execute on function public.set_task_priority(uuid, public.task_priority, numeric) to authenticated;
grant execute on function public.archive_task(uuid)                                   to authenticated;
grant execute on function public.restore_task(uuid)                                   to authenticated;
