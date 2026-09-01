-- ============================================================================
-- OrgTask · Borrar las tareas de ejemplo
--
-- Se ejecuta una sola vez, cuando la DEE empiece a cargar su trabajo real:
-- elimina las 16 tareas de ejemplo con toda su cronologia.
--
-- Lo que NO borra, a proposito:
--   - Las tres areas. Son datos reales de la DEE.
--   - Las diez cuentas del equipo. Antes este guion tambien las borraba, cuando
--     eran cuentas inventadas; ahora son las personas del piloto y quedarse sin
--     ellas dejaria a todo el equipo fuera de la plataforma. Para dar de baja a
--     alguien se desactiva su cuenta, no se elimina.
--
-- Como ejecutarlo: panel de Supabase, SQL Editor, pegar todo y correr.
-- Es irreversible.
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

select
  (select count(*) from public.profiles)    as personas,
  (select count(*) from public.tasks)       as tareas_restantes,
  (select count(*) from public.task_events) as eventos_restantes,
  (select count(*) from public.areas)       as areas;
