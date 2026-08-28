-- ============================================================================
-- OrgTask · Datos de demostracion
--
-- Como ejecutarlo: panel de Supabase, SQL Editor, pegar todo y correr.
-- Requiere haber corrido antes 0001_esquema_inicial.sql.
-- Es seguro correrlo dos veces: no duplica nada.
--
-- ADVERTENCIA: crea 8 cuentas de prueba con nombres y correos inventados y una
-- contrasena compartida. Existen para poder verificar los permisos de cada rol
-- antes de cargar al equipo real. Hay que eliminarlas antes de usar la
-- plataforma en serio; el guion 9999_borrar_datos_demo.sql lo hace.
--
--   Contrasena de todas las cuentas de prueba:  OrgTaskDemo2026
--
--   director@demo.orgtask.cl          Ana Rivas          Director, ve las 3 areas
--   lider.cpyg@demo.orgtask.cl        Marta Solis        Lider de CPyG
--   admin@demo.orgtask.cl             Luis Herrera       Colaborador CPyG + admin
--   colab.cpyg@demo.orgtask.cl        Paula Cardenas     Colaboradora de CPyG
--   lider.ryve@demo.orgtask.cl        Diego Fuentes      Lider de RyVE
--   colab.ryve@demo.orgtask.cl        Sofia Navarro      Colaboradora de RyVE
--   lider.deportes@demo.orgtask.cl    Tomas Reyes        Lider de Deportes
--   colab.deportes@demo.orgtask.cl    Camila Ortiz       Colaboradora de Deportes
--
-- Luis Herrera reproduce a proposito la doble condicion de Javier Moya:
-- colaborador de su area y ademas administrador de usuarios.
-- ============================================================================

create extension if not exists pgcrypto with schema extensions;


-- ----------------------------------------------------------------------------
-- 1. Las tres areas
-- ----------------------------------------------------------------------------

insert into public.areas (id, code, name, color_token, display_order) values
  ('a0000001-0000-4000-8000-000000000001', 'CPYG',
   'Comunidad de Profesionales y Graduados', 'cpyg', 1),
  ('a0000002-0000-4000-8000-000000000002', 'RYVE',
   'Relacion y Vinculacion Estudiantil', 'ryve', 2),
  ('a0000003-0000-4000-8000-000000000003', 'DEPORTES',
   'Unidad de Deportes', 'deportes', 3)
on conflict (code) do nothing;


-- ----------------------------------------------------------------------------
-- 2. Cuentas de prueba
--
-- Crear un usuario implica escribir en auth.users, que es la tabla interna de
-- Supabase donde vive el correo y la contrasena cifrada. Esta funcion existe
-- solo durante el seed y se elimina al final: dejarla disponible permitiria
-- que cualquiera con sesion creara cuentas.
-- ----------------------------------------------------------------------------

create or replace function public.seed_crear_usuario_demo(
  p_email     text,
  p_password  text,
  p_full_name text,
  p_role      public.user_role,
  p_area_code text,
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
  v_identity_data     jsonb;
  v_tiene_provider_id boolean;
begin
  -- Si la cuenta ya existe, no se toca
  select id into v_user_id
    from auth.users
   where lower(email) = lower(p_email);

  if v_user_id is not null then
    return v_user_id;
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
    created_at, updated_at
  ) values (
    '00000000-0000-0000-0000-000000000000',
    v_user_id,
    'authenticated',
    'authenticated',
    lower(p_email),
    extensions.crypt(p_password, extensions.gen_salt('bf')),
    now(),
    jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
    jsonb_build_object('full_name', p_full_name),
    now(),
    now()
  );

  v_identity_data := jsonb_build_object(
    'sub', v_user_id::text,
    'email', lower(p_email),
    'email_verified', true,
    'phone_verified', false
  );

  -- La columna provider_id se agrego en versiones recientes de Supabase.
  -- Se comprueba antes para que el guion funcione en proyectos nuevos y viejos.
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

  insert into public.profiles (id, full_name, email, area_id, role, is_admin)
  values (v_user_id, p_full_name, lower(p_email), v_area_id, p_role, p_is_admin);

  return v_user_id;
end;
$$;

revoke all on function public.seed_crear_usuario_demo(
  text, text, text, public.user_role, text, boolean
) from public, anon, authenticated;


select public.seed_crear_usuario_demo(
  'director@demo.orgtask.cl', 'OrgTaskDemo2026', 'Ana Rivas', 'director', null, false
);
select public.seed_crear_usuario_demo(
  'lider.cpyg@demo.orgtask.cl', 'OrgTaskDemo2026', 'Marta Solis', 'lider', 'CPYG', false
);
select public.seed_crear_usuario_demo(
  'admin@demo.orgtask.cl', 'OrgTaskDemo2026', 'Luis Herrera', 'colaborador', 'CPYG', true
);
select public.seed_crear_usuario_demo(
  'colab.cpyg@demo.orgtask.cl', 'OrgTaskDemo2026', 'Paula Cardenas', 'colaborador', 'CPYG', false
);
select public.seed_crear_usuario_demo(
  'lider.ryve@demo.orgtask.cl', 'OrgTaskDemo2026', 'Diego Fuentes', 'lider', 'RYVE', false
);
select public.seed_crear_usuario_demo(
  'colab.ryve@demo.orgtask.cl', 'OrgTaskDemo2026', 'Sofia Navarro', 'colaborador', 'RYVE', false
);
select public.seed_crear_usuario_demo(
  'lider.deportes@demo.orgtask.cl', 'OrgTaskDemo2026', 'Tomas Reyes', 'lider', 'DEPORTES', false
);
select public.seed_crear_usuario_demo(
  'colab.deportes@demo.orgtask.cl', 'OrgTaskDemo2026', 'Camila Ortiz', 'colaborador', 'DEPORTES', false
);


-- ----------------------------------------------------------------------------
-- 3. Tareas
--
-- Reparto pensado para que el tablero y los indicadores tengan algo que mostrar
-- desde el primer pantallazo: tareas en las tres columnas, alguna vencida,
-- y trabajo cerrado entre mayo y agosto para ver la evolucion por mes.
-- Las fechas estan escritas respecto a fines de agosto de 2026.
-- ----------------------------------------------------------------------------

insert into public.tasks (
  id, area_id, title, description, assignee_id, priority, status, sort_order,
  due_date, created_by, created_at, completed_at, archived_at, archived_by
) values

-- ---------- CPyG ----------
('b1000001-0000-4000-8000-000000000001',
 (select id from public.areas where code = 'CPYG'),
 'Convenio de practicas con empresa aliada',
 'Cerrar el convenio para que los estudiantes de ultimo ano postulen a practicas con la empresa.',
 (select id from public.profiles where email = 'lider.cpyg@demo.orgtask.cl'),
 'alta', 'en_proceso', 1000, '2026-09-30',
 (select id from public.profiles where email = 'lider.cpyg@demo.orgtask.cl'),
 '2026-08-05 10:15:00-04', null, null, null),

('b1000002-0000-4000-8000-000000000002',
 (select id from public.areas where code = 'CPYG'),
 'Boletin mensual de la comunidad de egresados',
 'Armar el numero de septiembre con dos entrevistas y la agenda de actividades.',
 (select id from public.profiles where email = 'colab.cpyg@demo.orgtask.cl'),
 'media', 'por_hacer', 1000, '2026-09-15',
 (select id from public.profiles where email = 'lider.cpyg@demo.orgtask.cl'),
 '2026-08-18 09:00:00-04', null, null, null),

('b1000003-0000-4000-8000-000000000003',
 (select id from public.areas where code = 'CPYG'),
 'Actualizar base de contactos de graduados',
 'Depurar correos rebotados y sumar a los titulados del semestre pasado.',
 (select id from public.profiles where email = 'admin@demo.orgtask.cl'),
 'baja', 'por_hacer', 1000, '2026-08-20',
 (select id from public.profiles where email = 'lider.cpyg@demo.orgtask.cl'),
 '2026-07-28 16:40:00-04', null, null, null),

('b1000004-0000-4000-8000-000000000004',
 (select id from public.areas where code = 'CPYG'),
 'Encuentro de networking para profesionales',
 'Encuentro con 60 egresados en el campus, con mesas por area de desempeno.',
 (select id from public.profiles where email = 'lider.cpyg@demo.orgtask.cl'),
 'alta', 'hecho', 1000, '2026-08-10',
 (select id from public.profiles where email = 'lider.cpyg@demo.orgtask.cl'),
 '2026-06-15 11:00:00-04', '2026-08-12 18:30:00-04',
 '2026-08-20 09:15:00-04',
 (select id from public.profiles where email = 'lider.cpyg@demo.orgtask.cl')),

('b1000005-0000-4000-8000-000000000005',
 (select id from public.areas where code = 'CPYG'),
 'Charla de empleabilidad con egresados de Ingenieria',
 'Panel de tres egresados sobre primeros empleos y expectativas de renta.',
 (select id from public.profiles where email = 'colab.cpyg@demo.orgtask.cl'),
 'media', 'hecho', 2000, '2026-07-20',
 (select id from public.profiles where email = 'lider.cpyg@demo.orgtask.cl'),
 '2026-06-01 14:20:00-04', '2026-07-22 17:00:00-04',
 '2026-07-30 10:00:00-04',
 (select id from public.profiles where email = 'lider.cpyg@demo.orgtask.cl')),

('b1000006-0000-4000-8000-000000000006',
 (select id from public.areas where code = 'CPYG'),
 'Programa de mentorias entre egresados y estudiantes',
 'Emparejar 20 duplas y dejar agendada la primera sesion de cada una.',
 (select id from public.profiles where email = 'colab.cpyg@demo.orgtask.cl'),
 'alta', 'en_proceso', 2000, '2026-10-15',
 (select id from public.profiles where email = 'lider.cpyg@demo.orgtask.cl'),
 '2026-08-01 08:45:00-04', null, null, null),

-- ---------- RyVE ----------
('b2000001-0000-4000-8000-000000000011',
 (select id from public.areas where code = 'RYVE'),
 'Feria de bienvenida para estudiantes nuevos',
 'Coordinar stands de las carreras y el punto de informacion de beneficios.',
 (select id from public.profiles where email = 'lider.ryve@demo.orgtask.cl'),
 'alta', 'en_proceso', 1000, '2026-09-05',
 (select id from public.profiles where email = 'lider.ryve@demo.orgtask.cl'),
 '2026-08-10 09:30:00-04', null, null, null),

('b2000002-0000-4000-8000-000000000012',
 (select id from public.areas where code = 'RYVE'),
 'Taller de habilidades blandas para primer ano',
 'Dos sesiones de trabajo en equipo y comunicacion, con cupo para 40 personas.',
 (select id from public.profiles where email = 'colab.ryve@demo.orgtask.cl'),
 'media', 'por_hacer', 1000, '2026-09-22',
 (select id from public.profiles where email = 'lider.ryve@demo.orgtask.cl'),
 '2026-08-20 15:10:00-04', null, null, null),

('b2000003-0000-4000-8000-000000000013',
 (select id from public.areas where code = 'RYVE'),
 'Encuesta de satisfaccion estudiantil semestral',
 'Aplicar la encuesta y entregar el informe con los tres hallazgos principales.',
 (select id from public.profiles where email = 'colab.ryve@demo.orgtask.cl'),
 'media', 'hecho', 1000, '2026-08-08',
 (select id from public.profiles where email = 'lider.ryve@demo.orgtask.cl'),
 '2026-07-01 10:00:00-04', '2026-08-05 12:45:00-04', null, null),

('b2000004-0000-4000-8000-000000000014',
 (select id from public.areas where code = 'RYVE'),
 'Convenio con centro de estudiantes para uso de salas',
 'Acordar horarios de uso de las salas de reunion del edificio central.',
 (select id from public.profiles where email = 'lider.ryve@demo.orgtask.cl'),
 'baja', 'por_hacer', 2000, '2026-08-25',
 (select id from public.profiles where email = 'lider.ryve@demo.orgtask.cl'),
 '2026-08-01 11:25:00-04', null, null, null),

('b2000005-0000-4000-8000-000000000015',
 (select id from public.areas where code = 'RYVE'),
 'Ciclo de cine y conversatorio de mitad de semestre',
 'Tres funciones con conversatorio guiado por docentes invitados.',
 (select id from public.profiles where email = 'colab.ryve@demo.orgtask.cl'),
 'baja', 'hecho', 2000, '2026-06-30',
 (select id from public.profiles where email = 'lider.ryve@demo.orgtask.cl'),
 '2026-05-20 16:00:00-04', '2026-06-28 20:15:00-04',
 '2026-07-02 09:40:00-04',
 (select id from public.profiles where email = 'lider.ryve@demo.orgtask.cl')),

-- ---------- Deportes ----------
('b3000001-0000-4000-8000-000000000021',
 (select id from public.areas where code = 'DEPORTES'),
 'Campeonato interno de futbolito',
 'Doce equipos, fase de grupos y final. Falta confirmar arbitros.',
 (select id from public.profiles where email = 'lider.deportes@demo.orgtask.cl'),
 'alta', 'en_proceso', 1000, '2026-09-12',
 (select id from public.profiles where email = 'lider.deportes@demo.orgtask.cl'),
 '2026-08-08 08:20:00-04', null, null, null),

('b3000002-0000-4000-8000-000000000022',
 (select id from public.areas where code = 'DEPORTES'),
 'Renovacion de implementacion deportiva',
 'Cotizar balones, petos y conos para el segundo semestre.',
 (select id from public.profiles where email = 'colab.deportes@demo.orgtask.cl'),
 'alta', 'por_hacer', 1000, '2026-09-01',
 (select id from public.profiles where email = 'lider.deportes@demo.orgtask.cl'),
 '2026-08-22 10:50:00-04', null, null, null),

('b3000003-0000-4000-8000-000000000023',
 (select id from public.areas where code = 'DEPORTES'),
 'Seleccion de voleibol femenino para liga interuniversitaria',
 'Convocatoria, dos jornadas de seleccion y nomina final de 14 jugadoras.',
 (select id from public.profiles where email = 'colab.deportes@demo.orgtask.cl'),
 'media', 'por_hacer', 1000, '2026-10-03',
 (select id from public.profiles where email = 'lider.deportes@demo.orgtask.cl'),
 '2026-08-15 09:05:00-04', null, null, null),

('b3000004-0000-4000-8000-000000000024',
 (select id from public.areas where code = 'DEPORTES'),
 'Torneo de tenis de mesa de invierno',
 'Torneo de 32 participantes en el gimnasio, categoria unica.',
 (select id from public.profiles where email = 'lider.deportes@demo.orgtask.cl'),
 'baja', 'hecho', 1000, '2026-07-18',
 (select id from public.profiles where email = 'lider.deportes@demo.orgtask.cl'),
 '2026-06-10 13:30:00-04', '2026-07-15 19:00:00-04',
 '2026-07-20 08:30:00-04',
 (select id from public.profiles where email = 'lider.deportes@demo.orgtask.cl')),

('b3000005-0000-4000-8000-000000000025',
 (select id from public.areas where code = 'DEPORTES'),
 'Convenio con gimnasio municipal para estudiantes',
 'Tarifa preferente acreditando matricula vigente.',
 (select id from public.profiles where email = 'colab.deportes@demo.orgtask.cl'),
 'media', 'hecho', 2000, '2026-06-05',
 (select id from public.profiles where email = 'lider.deportes@demo.orgtask.cl'),
 '2026-04-20 15:45:00-04', '2026-05-30 11:20:00-04',
 '2026-06-05 09:00:00-04',
 (select id from public.profiles where email = 'lider.deportes@demo.orgtask.cl'))

on conflict (id) do nothing;


-- ----------------------------------------------------------------------------
-- 4. Cronologia de las tareas ya avanzadas
--
-- El disparador del esquema ya escribio el evento "creada" de cada tarea. Aqui
-- se agregan los pasos intermedios con fechas coherentes, para que el historico
-- se lea como un recorrido y los indicadores puedan calcular cuanto demoro
-- cerrar cada tarea.
-- ----------------------------------------------------------------------------

do $$
declare
  r              record;
  v_paso_proceso timestamptz;
begin
  for r in
    select t.id, t.area_id, t.title, t.status, t.created_at, t.completed_at,
           t.archived_at, t.assignee_id,
           coalesce(p.full_name, 'Sistema') as responsable
      from public.tasks t
      left join public.profiles p on p.id = t.assignee_id
     where not exists (
       select 1
         from public.task_events e
        where e.task_id = t.id
          and e.event_type = 'estado_cambiado'
     )
     order by t.created_at
  loop
    if r.status = 'en_proceso' then
      insert into public.task_events (
        task_id, area_id, task_title, actor_id, actor_name,
        event_type, field, old_value, new_value, created_at
      ) values (
        r.id, r.area_id, r.title, r.assignee_id, r.responsable,
        'estado_cambiado', 'status', 'por_hacer', 'en_proceso',
        r.created_at + interval '3 days'
      );

    elsif r.status = 'hecho' and r.completed_at is not null then
      -- El paso a En proceso se ubica en el primer cuarto del recorrido
      v_paso_proceso := r.created_at + ((r.completed_at - r.created_at) * 0.25);

      insert into public.task_events (
        task_id, area_id, task_title, actor_id, actor_name,
        event_type, field, old_value, new_value, created_at
      ) values (
        r.id, r.area_id, r.title, r.assignee_id, r.responsable,
        'estado_cambiado', 'status', 'por_hacer', 'en_proceso', v_paso_proceso
      );

      insert into public.task_events (
        task_id, area_id, task_title, actor_id, actor_name,
        event_type, field, old_value, new_value, created_at
      ) values (
        r.id, r.area_id, r.title, r.assignee_id, r.responsable,
        'estado_cambiado', 'status', 'en_proceso', 'hecho', r.completed_at
      );

      if r.archived_at is not null then
        insert into public.task_events (
          task_id, area_id, task_title, actor_id, actor_name,
          event_type, field, old_value, new_value, created_at
        ) values (
          r.id, r.area_id, r.title, r.assignee_id, r.responsable,
          'archivada', 'archived_at', null,
          to_char(r.archived_at, 'DD-MM-YYYY HH24:MI'), r.archived_at
        );
      end if;
    end if;
  end loop;
end
$$;


-- ----------------------------------------------------------------------------
-- 5. Limpieza: la funcion que crea cuentas no debe quedar disponible
-- ----------------------------------------------------------------------------

drop function if exists public.seed_crear_usuario_demo(
  text, text, text, public.user_role, text, boolean
);


-- ----------------------------------------------------------------------------
-- 6. Resumen de lo cargado
-- ----------------------------------------------------------------------------

select
  (select count(*) from public.areas)                                   as areas,
  (select count(*) from public.profiles)                                as personas,
  (select count(*) from public.tasks where archived_at is null)          as tareas_en_tablero,
  (select count(*) from public.tasks where archived_at is not null)      as tareas_archivadas,
  (select count(*) from public.task_events)                             as eventos;
