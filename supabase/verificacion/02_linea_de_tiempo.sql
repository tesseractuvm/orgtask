-- ============================================================================
-- OrgTask · Linea de tiempo de una tarea
--
-- Es la demostracion de la tarea 2: muestra el recorrido completo de una tarea
-- desde que se creo, con quien hizo cada cambio y cuando, leible sin conocer
-- la base de datos. Es la misma consulta que va a alimentar el Historico.
--
-- Como ejecutarlo: panel de Supabase, SQL Editor, pegar todo y correr.
-- Por defecto muestra el "Encuentro de networking para profesionales", que en
-- los datos de demostracion ya paso por todas las columnas y esta archivado.
-- Para ver otra tarea, cambia el titulo de la ultima linea.
-- ============================================================================

select
  to_char(e.created_at, 'DD-MM-YYYY HH24:MI')      as cuando,
  e.actor_name                                     as quien,
  case e.event_type
    when 'creada'               then 'Creo la tarea'
    when 'estado_cambiado'      then 'Movio la tarea'
    when 'prioridad_cambiada'   then 'Cambio la prioridad'
    when 'responsable_cambiado' then 'Cambio el responsable'
    when 'detalle_editado'      then 'Edito los detalles'
    when 'archivada'            then 'Archivo la tarea'
    when 'restaurada'           then 'Devolvio la tarea al tablero'
    when 'eliminada'            then 'Elimino la tarea'
  end                                              as que_hizo,
  case
    when e.event_type = 'estado_cambiado' then
      replace(replace(replace(e.old_value, 'por_hacer', 'Por hacer'),
              'en_proceso', 'En proceso'), 'hecho', 'Hecho')
      || ' a ' ||
      replace(replace(replace(e.new_value, 'por_hacer', 'Por hacer'),
              'en_proceso', 'En proceso'), 'hecho', 'Hecho')
    when e.event_type = 'prioridad_cambiada' then
      initcap(e.old_value) || ' a ' || initcap(e.new_value)
    when e.event_type = 'responsable_cambiado' then
      e.old_value || ' a ' || e.new_value
    when e.event_type = 'detalle_editado' then
      'Campo ' || e.field
    else ''
  end                                              as detalle
from public.task_events e
join public.tasks t on t.id = e.task_id
where t.title = 'Encuentro de networking para profesionales'
order by e.created_at, e.id;
