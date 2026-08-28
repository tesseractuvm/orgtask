-- ============================================================================
-- OrgTask · Borrar los datos de demostracion
--
-- Se ejecuta una sola vez, cuando la plataforma pase a uso real: elimina las 8
-- cuentas de prueba y las 16 tareas de ejemplo, con toda su cronologia.
-- Las tres areas NO se borran: son datos reales de la DEE.
--
-- Como ejecutarlo: panel de Supabase, SQL Editor, pegar todo y correr.
-- Es irreversible. Conviene correrlo solo despues de haber cargado al equipo
-- real desde el panel de administracion de usuarios.
-- ============================================================================

-- Las tareas de ejemplo tienen identificadores que empiezan con b1, b2 o b3.
-- Al borrarlas, su cronologia se va en cascada.
delete from public.tasks
 where id::text like 'b1000%'
    or id::text like 'b2000%'
    or id::text like 'b3000%';

-- Rastro que dejan las eliminaciones anteriores
delete from public.task_events
 where task_id is null
   and event_type = 'eliminada';

-- Las cuentas de prueba. Al borrar de auth.users, el perfil se va en cascada.
delete from auth.users
 where email like '%@demo.orgtask.cl';

select
  (select count(*) from public.profiles)    as personas_restantes,
  (select count(*) from public.tasks)       as tareas_restantes,
  (select count(*) from public.task_events) as eventos_restantes,
  (select count(*) from public.areas)       as areas_restantes;
