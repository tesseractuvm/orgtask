-- ============================================================================
-- OrgTask · Equipo del piloto y trabajo de ejemplo
--
-- Como ejecutarlo: panel de Supabase, SQL Editor, pegar todo y correr.
-- Requiere haber corrido antes 0001_esquema_inicial.sql, 0002_politicas_seguridad.sql,
-- 0003_color_por_responsable.sql y 0004_gestion_de_cuentas.sql.
-- Es seguro correrlo dos veces: no duplica nada.
--
-- Crea las diez cuentas del piloto definidas en el brief, con su area, su rol y
-- el color que identifica a cada persona, mas tareas de ejemplo repartidas
-- entre las tres areas.
--
-- ADVERTENCIA: las diez cuentas quedan con una contrasena compartida, pensada
-- solo para la puesta en marcha. Cada persona debe cambiarla desde su perfil la
-- primera vez que entra. Mientras no lo haga, cualquiera que conozca esta
-- contrasena puede entrar con su nombre.
--
--   Contrasena inicial de todas las cuentas:  OrgTaskDemo2026
--
--   daniel.tello@uvm.cl           Daniel Tello           Director, ve las 3 areas
--   francisca.tapia@uvm.cl        Francisca Tapia        Lider de CPyG        amarillo
--   catalina.tamayo@uvm.cl        Catalina Tamayo        Colaboradora CPyG    rosado
--   javier.moya@uvm.cl            Javier Moya            Colaborador CPyG     azul   + admin
--   juan.caneo@uvm.cl             Juan Pablo Caneo       Lider de RyVE        verde
--   makarena.ibaceta@uvm.cl       Macarena Ibaceta       Colaboradora RyVE    lila
--   teresa.urzua@uvm.cl           Teresita Urzua         Colaboradora RyVE    magenta
--   jean.munoz@uvm.cl             Juan Carlos Munoz      Lider de Deportes    cafe
--   gabriel.marschhausen@uvm.cl   Gabriel Marschhausen   Colaborador Deportes gris
--   javiera.alvarez@uvm.cl        Javiera Alvarez        Colaboradora Deportes calipso
--
-- Los correos estan escritos en minuscula. El brief los lista con algunas
-- mayusculas iniciales, pero el inicio de sesion no distingue mayusculas y la
-- base guarda el correo en minuscula, asi que ambas formas funcionan igual.
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
-- 2. Las diez cuentas del piloto
--
-- Antes este guion traia su propia funcion para crear cuentas, que insertaba en
-- auth.users dejando en NULL las columnas de token. Esas cuentas se veian bien
-- en la base pero no podian iniciar sesion: el detalle esta explicado en
-- 0004_gestion_de_cuentas.sql, que es de donde sale ahora admin_crear_cuenta.
--
-- Si el correo ya existe, la funcion no toca nada y devuelve el id que tenia.
-- ----------------------------------------------------------------------------

-- El rol de director ya le da a Daniel las tres areas y todas sus tareas
-- (ver public.leads_area en la migracion de RLS); is_admin es un permiso
-- aparte, solo para administrar cuentas, y hoy lo tiene Javier Moya en su
-- lugar.
select public.admin_crear_cuenta(
  'daniel.tello@uvm.cl', 'OrgTaskDemo2026', 'Daniel Tello', 'director', null, 'naranjo'
);
select public.admin_crear_cuenta(
  'francisca.tapia@uvm.cl', 'OrgTaskDemo2026', 'Francisca Tapia', 'lider', 'CPYG', 'amarillo'
);
select public.admin_crear_cuenta(
  'catalina.tamayo@uvm.cl', 'OrgTaskDemo2026', 'Catalina Tamayo', 'colaborador', 'CPYG', 'rosado'
);
-- Colaborador de su area y ademas administrador de usuarios: son dos permisos
-- independientes, asi que puede agregar y desactivar cuentas sin dejar de ser
-- colaborador de CPyG.
select public.admin_crear_cuenta(
  'javier.moya@uvm.cl', 'OrgTaskDemo2026', 'Javier Moya', 'colaborador', 'CPYG', 'azul', true
);
select public.admin_crear_cuenta(
  'juan.caneo@uvm.cl', 'OrgTaskDemo2026', 'Juan Pablo Caneo', 'lider', 'RYVE', 'verde'
);
select public.admin_crear_cuenta(
  'makarena.ibaceta@uvm.cl', 'OrgTaskDemo2026', 'Macarena Ibaceta', 'colaborador', 'RYVE', 'lila'
);
select public.admin_crear_cuenta(
  'teresa.urzua@uvm.cl', 'OrgTaskDemo2026', 'Teresita Urzua', 'colaborador', 'RYVE', 'magenta'
);
select public.admin_crear_cuenta(
  'jean.munoz@uvm.cl', 'OrgTaskDemo2026', 'Juan Carlos Munoz', 'lider', 'DEPORTES', 'cafe'
);
select public.admin_crear_cuenta(
  'gabriel.marschhausen@uvm.cl', 'OrgTaskDemo2026', 'Gabriel Marschhausen', 'colaborador', 'DEPORTES', 'gris'
);
select public.admin_crear_cuenta(
  'javiera.alvarez@uvm.cl', 'OrgTaskDemo2026', 'Javiera Alvarez', 'colaborador', 'DEPORTES', 'calipso'
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
 (select id from public.profiles where email = 'francisca.tapia@uvm.cl'),
 'alta', 'en_proceso', 1000, '2026-09-30',
 (select id from public.profiles where email = 'francisca.tapia@uvm.cl'),
 '2026-08-05 10:15:00-04', null, null, null),

('b1000002-0000-4000-8000-000000000002',
 (select id from public.areas where code = 'CPYG'),
 'Boletin mensual de la comunidad de egresados',
 'Armar el numero de septiembre con dos entrevistas y la agenda de actividades.',
 (select id from public.profiles where email = 'catalina.tamayo@uvm.cl'),
 'media', 'por_hacer', 1000, '2026-09-15',
 (select id from public.profiles where email = 'francisca.tapia@uvm.cl'),
 '2026-08-18 09:00:00-04', null, null, null),

('b1000003-0000-4000-8000-000000000003',
 (select id from public.areas where code = 'CPYG'),
 'Actualizar base de contactos de graduados',
 'Depurar correos rebotados y sumar a los titulados del semestre pasado.',
 (select id from public.profiles where email = 'javier.moya@uvm.cl'),
 'baja', 'por_hacer', 1000, '2026-08-20',
 (select id from public.profiles where email = 'francisca.tapia@uvm.cl'),
 '2026-07-28 16:40:00-04', null, null, null),

('b1000004-0000-4000-8000-000000000004',
 (select id from public.areas where code = 'CPYG'),
 'Encuentro de networking para profesionales',
 'Encuentro con 60 egresados en el campus, con mesas por area de desempeno.',
 (select id from public.profiles where email = 'francisca.tapia@uvm.cl'),
 'alta', 'hecho', 1000, '2026-08-10',
 (select id from public.profiles where email = 'francisca.tapia@uvm.cl'),
 '2026-06-15 11:00:00-04', '2026-08-12 18:30:00-04',
 '2026-08-20 09:15:00-04',
 (select id from public.profiles where email = 'francisca.tapia@uvm.cl')),

('b1000005-0000-4000-8000-000000000005',
 (select id from public.areas where code = 'CPYG'),
 'Charla de empleabilidad con egresados de Ingenieria',
 'Panel de tres egresados sobre primeros empleos y expectativas de renta.',
 (select id from public.profiles where email = 'catalina.tamayo@uvm.cl'),
 'media', 'hecho', 2000, '2026-07-20',
 (select id from public.profiles where email = 'francisca.tapia@uvm.cl'),
 '2026-06-01 14:20:00-04', '2026-07-22 17:00:00-04',
 '2026-07-30 10:00:00-04',
 (select id from public.profiles where email = 'francisca.tapia@uvm.cl')),

('b1000006-0000-4000-8000-000000000006',
 (select id from public.areas where code = 'CPYG'),
 'Programa de mentorias entre egresados y estudiantes',
 'Emparejar 20 duplas y dejar agendada la primera sesion de cada una.',
 (select id from public.profiles where email = 'catalina.tamayo@uvm.cl'),
 'alta', 'en_proceso', 2000, '2026-10-15',
 (select id from public.profiles where email = 'francisca.tapia@uvm.cl'),
 '2026-08-01 08:45:00-04', null, null, null),

-- ---------- RyVE ----------
('b2000001-0000-4000-8000-000000000011',
 (select id from public.areas where code = 'RYVE'),
 'Feria de bienvenida para estudiantes nuevos',
 'Coordinar stands de las carreras y el punto de informacion de beneficios.',
 (select id from public.profiles where email = 'juan.caneo@uvm.cl'),
 'alta', 'en_proceso', 1000, '2026-09-05',
 (select id from public.profiles where email = 'juan.caneo@uvm.cl'),
 '2026-08-10 09:30:00-04', null, null, null),

('b2000002-0000-4000-8000-000000000012',
 (select id from public.areas where code = 'RYVE'),
 'Taller de habilidades blandas para primer ano',
 'Dos sesiones de trabajo en equipo y comunicacion, con cupo para 40 personas.',
 (select id from public.profiles where email = 'teresa.urzua@uvm.cl'),
 'media', 'por_hacer', 1000, '2026-09-22',
 (select id from public.profiles where email = 'juan.caneo@uvm.cl'),
 '2026-08-20 15:10:00-04', null, null, null),

('b2000003-0000-4000-8000-000000000013',
 (select id from public.areas where code = 'RYVE'),
 'Encuesta de satisfaccion estudiantil semestral',
 'Aplicar la encuesta y entregar el informe con los tres hallazgos principales.',
 (select id from public.profiles where email = 'makarena.ibaceta@uvm.cl'),
 'media', 'hecho', 1000, '2026-08-08',
 (select id from public.profiles where email = 'juan.caneo@uvm.cl'),
 '2026-07-01 10:00:00-04', '2026-08-05 12:45:00-04', null, null),

('b2000004-0000-4000-8000-000000000014',
 (select id from public.areas where code = 'RYVE'),
 'Convenio con centro de estudiantes para uso de salas',
 'Acordar horarios de uso de las salas de reunion del edificio central.',
 (select id from public.profiles where email = 'juan.caneo@uvm.cl'),
 'baja', 'por_hacer', 2000, '2026-08-25',
 (select id from public.profiles where email = 'juan.caneo@uvm.cl'),
 '2026-08-01 11:25:00-04', null, null, null),

('b2000005-0000-4000-8000-000000000015',
 (select id from public.areas where code = 'RYVE'),
 'Ciclo de cine y conversatorio de mitad de semestre',
 'Tres funciones con conversatorio guiado por docentes invitados.',
 (select id from public.profiles where email = 'teresa.urzua@uvm.cl'),
 'baja', 'hecho', 2000, '2026-06-30',
 (select id from public.profiles where email = 'juan.caneo@uvm.cl'),
 '2026-05-20 16:00:00-04', '2026-06-28 20:15:00-04',
 '2026-07-02 09:40:00-04',
 (select id from public.profiles where email = 'juan.caneo@uvm.cl')),

-- ---------- Deportes ----------
('b3000001-0000-4000-8000-000000000021',
 (select id from public.areas where code = 'DEPORTES'),
 'Campeonato interno de futbolito',
 'Doce equipos, fase de grupos y final. Falta confirmar arbitros.',
 (select id from public.profiles where email = 'jean.munoz@uvm.cl'),
 'alta', 'en_proceso', 1000, '2026-09-12',
 (select id from public.profiles where email = 'jean.munoz@uvm.cl'),
 '2026-08-08 08:20:00-04', null, null, null),

('b3000002-0000-4000-8000-000000000022',
 (select id from public.areas where code = 'DEPORTES'),
 'Renovacion de implementacion deportiva',
 'Cotizar balones, petos y conos para el segundo semestre.',
 (select id from public.profiles where email = 'gabriel.marschhausen@uvm.cl'),
 'alta', 'por_hacer', 1000, '2026-09-01',
 (select id from public.profiles where email = 'jean.munoz@uvm.cl'),
 '2026-08-22 10:50:00-04', null, null, null),

('b3000003-0000-4000-8000-000000000023',
 (select id from public.areas where code = 'DEPORTES'),
 'Seleccion de voleibol femenino para liga interuniversitaria',
 'Convocatoria, dos jornadas de seleccion y nomina final de 14 jugadoras.',
 (select id from public.profiles where email = 'javiera.alvarez@uvm.cl'),
 'media', 'por_hacer', 1000, '2026-10-03',
 (select id from public.profiles where email = 'jean.munoz@uvm.cl'),
 '2026-08-15 09:05:00-04', null, null, null),

('b3000004-0000-4000-8000-000000000024',
 (select id from public.areas where code = 'DEPORTES'),
 'Torneo de tenis de mesa de invierno',
 'Torneo de 32 participantes en el gimnasio, categoria unica.',
 (select id from public.profiles where email = 'jean.munoz@uvm.cl'),
 'baja', 'hecho', 1000, '2026-07-18',
 (select id from public.profiles where email = 'jean.munoz@uvm.cl'),
 '2026-06-10 13:30:00-04', '2026-07-15 19:00:00-04',
 '2026-07-20 08:30:00-04',
 (select id from public.profiles where email = 'jean.munoz@uvm.cl')),

('b3000005-0000-4000-8000-000000000025',
 (select id from public.areas where code = 'DEPORTES'),
 'Convenio con gimnasio municipal para estudiantes',
 'Tarifa preferente acreditando matricula vigente.',
 (select id from public.profiles where email = 'javiera.alvarez@uvm.cl'),
 'media', 'hecho', 2000, '2026-06-05',
 (select id from public.profiles where email = 'jean.munoz@uvm.cl'),
 '2026-04-20 15:45:00-04', '2026-05-30 11:20:00-04',
 '2026-06-05 09:00:00-04',
 (select id from public.profiles where email = 'jean.munoz@uvm.cl'))

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
-- 5. La funcion que crea cuentas se queda
--
-- Vive en 0004 y ya esta fuera del alcance de anon y authenticated, asi que
-- solo se puede llamar desde el editor SQL del panel. Se queda instalada
-- porque es la forma de dar de alta a alguien mas adelante.
-- ----------------------------------------------------------------------------


-- ----------------------------------------------------------------------------
-- 6. Resumen de lo cargado
-- ----------------------------------------------------------------------------

select
  (select count(*) from public.areas)                                   as areas,
  (select count(*) from public.profiles)                                as personas,
  (select count(*) from public.tasks where archived_at is null)          as tareas_en_tablero,
  (select count(*) from public.tasks where archived_at is not null)      as tareas_archivadas,
  (select count(*) from public.task_events)                             as eventos;
