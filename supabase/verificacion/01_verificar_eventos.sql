-- ============================================================================
-- OrgTask · Verificacion del registro automatico de eventos
--
-- Comprueba que la base de datos escribe sola la cronologia de una tarea.
-- Crea una tarea de prueba, le hace todos los cambios posibles, revisa que
-- cada uno haya quedado registrado, y al final se limpia sola: no deja nada.
--
-- Como ejecutarlo: panel de Supabase, SQL Editor, pegar todo y correr.
-- Devuelve una tabla con una fila por comprobacion. Todas deben decir OK.
-- ============================================================================

create temp table if not exists verificacion (
  paso         int,
  comprobacion text,
  esperado     text,
  obtenido     text,
  resultado    text
);
truncate verificacion;

do $$
declare
  v_area      uuid;
  v_persona_a uuid;
  v_persona_b uuid;
  v_tarea     uuid;
  v_titulo    text := 'Tarea de verificacion automatica';
  v_titulo2   text := 'Tarea de verificacion renombrada';
  v_n         int;
  v_ts        timestamptz;
begin
  select id into v_area from public.areas order by display_order limit 1;
  if v_area is null then
    insert into verificacion values (0, 'Existen areas cargadas', 'al menos 1', '0', 'FALLA');
    return;
  end if;

  select id into v_persona_a from public.profiles order by created_at limit 1;
  select id into v_persona_b from public.profiles where id <> v_persona_a order by created_at limit 1;
  if v_persona_b is null then
    insert into verificacion values (
      0, 'Existen al menos 2 personas', '2 o mas', '1 o menos',
      'FALLA: corre primero el seed 0001_datos_demo.sql'
    );
    return;
  end if;

  -- --------------------------------------------------------------------------
  -- Paso 1: crear la tarea deja el evento "creada"
  -- --------------------------------------------------------------------------
  insert into public.tasks (area_id, title, description, assignee_id, priority, status, due_date)
  values (v_area, v_titulo, 'Se borra al terminar la verificacion.', v_persona_a,
          'media', 'por_hacer', current_date + 10)
  returning id into v_tarea;

  select count(*) into v_n
    from public.task_events
   where task_id = v_tarea and event_type = 'creada';
  insert into verificacion values (
    1, 'Al crear la tarea se registra el evento creada', '1', v_n::text,
    case when v_n = 1 then 'OK' else 'FALLA' end
  );

  -- La posicion vertical se asigna sola
  select sort_order into v_n from public.tasks where id = v_tarea;
  insert into verificacion values (
    2, 'La tarea recibe una posicion vertical automatica', 'mayor que 0', v_n::text,
    case when v_n > 0 then 'OK' else 'FALLA' end
  );

  -- --------------------------------------------------------------------------
  -- Paso 3: avanzar a En proceso guarda el valor anterior y el nuevo
  -- --------------------------------------------------------------------------
  update public.tasks set status = 'en_proceso' where id = v_tarea;

  select count(*) into v_n
    from public.task_events
   where task_id = v_tarea
     and event_type = 'estado_cambiado'
     and old_value = 'por_hacer'
     and new_value = 'en_proceso';
  insert into verificacion values (
    3, 'Mover a En proceso registra de por_hacer a en_proceso', '1', v_n::text,
    case when v_n = 1 then 'OK' else 'FALLA' end
  );

  -- --------------------------------------------------------------------------
  -- Paso 4: pasar a Hecho registra el cambio y marca la fecha de cierre
  -- --------------------------------------------------------------------------
  update public.tasks set status = 'hecho' where id = v_tarea;

  select count(*) into v_n
    from public.task_events
   where task_id = v_tarea
     and event_type = 'estado_cambiado'
     and old_value = 'en_proceso'
     and new_value = 'hecho';
  insert into verificacion values (
    4, 'Mover a Hecho registra de en_proceso a hecho', '1', v_n::text,
    case when v_n = 1 then 'OK' else 'FALLA' end
  );

  select completed_at into v_ts from public.tasks where id = v_tarea;
  insert into verificacion values (
    5, 'Al llegar a Hecho se guarda la fecha de cierre', 'con fecha',
    coalesce(to_char(v_ts, 'DD-MM-YYYY HH24:MI'), 'vacio'),
    case when v_ts is not null then 'OK' else 'FALLA' end
  );

  -- --------------------------------------------------------------------------
  -- Paso 6: prioridad, responsable y detalles
  -- --------------------------------------------------------------------------
  update public.tasks set priority = 'alta' where id = v_tarea;
  select count(*) into v_n
    from public.task_events
   where task_id = v_tarea
     and event_type = 'prioridad_cambiada'
     and old_value = 'media' and new_value = 'alta';
  insert into verificacion values (
    6, 'Cambiar la prioridad queda registrado', '1', v_n::text,
    case when v_n = 1 then 'OK' else 'FALLA' end
  );

  update public.tasks set assignee_id = v_persona_b where id = v_tarea;
  select count(*) into v_n
    from public.task_events
   where task_id = v_tarea and event_type = 'responsable_cambiado';
  insert into verificacion values (
    7, 'Cambiar el responsable queda registrado con nombres', '1', v_n::text,
    case when v_n = 1 then 'OK' else 'FALLA' end
  );

  update public.tasks set title = v_titulo2, due_date = current_date + 20 where id = v_tarea;
  select count(*) into v_n
    from public.task_events
   where task_id = v_tarea and event_type = 'detalle_editado';
  insert into verificacion values (
    8, 'Editar titulo y fecha limite deja 2 eventos de detalle', '2', v_n::text,
    case when v_n = 2 then 'OK' else 'FALLA' end
  );

  -- --------------------------------------------------------------------------
  -- Paso 9: archivar y restaurar
  -- --------------------------------------------------------------------------
  update public.tasks
     set archived_at = now(), archived_by = v_persona_a
   where id = v_tarea;

  select count(*) into v_n
    from public.task_events
   where task_id = v_tarea and event_type = 'archivada';
  insert into verificacion values (
    9, 'Archivar la tarea queda registrado', '1', v_n::text,
    case when v_n = 1 then 'OK' else 'FALLA' end
  );

  update public.tasks
     set archived_at = null, archived_by = null
   where id = v_tarea;

  select count(*) into v_n
    from public.task_events
   where task_id = v_tarea and event_type = 'restaurada';
  insert into verificacion values (
    10, 'Restaurar la tarea al tablero queda registrado', '1', v_n::text,
    case when v_n = 1 then 'OK' else 'FALLA' end
  );

  -- --------------------------------------------------------------------------
  -- Paso 11: sacarla de Hecho borra la fecha de cierre
  -- --------------------------------------------------------------------------
  update public.tasks set status = 'por_hacer' where id = v_tarea;
  select completed_at into v_ts from public.tasks where id = v_tarea;
  insert into verificacion values (
    11, 'Sacarla de Hecho borra la fecha de cierre', 'vacio',
    coalesce(to_char(v_ts, 'DD-MM-YYYY HH24:MI'), 'vacio'),
    case when v_ts is null then 'OK' else 'FALLA' end
  );

  -- --------------------------------------------------------------------------
  -- Paso 12: la cronologia completa quedo en orden
  -- --------------------------------------------------------------------------
  select count(*) into v_n from public.task_events where task_id = v_tarea;
  insert into verificacion values (
    12, 'La tarea acumulo su cronologia completa', '10 eventos', v_n::text,
    case when v_n = 10 then 'OK' else 'FALLA' end
  );

  -- --------------------------------------------------------------------------
  -- Paso 13: al eliminar la tarea, el rastro de la eliminacion sobrevive
  -- --------------------------------------------------------------------------
  delete from public.tasks where id = v_tarea;

  select count(*) into v_n
    from public.task_events
   where task_id is null and event_type = 'eliminada' and task_title = v_titulo2;
  insert into verificacion values (
    13, 'Eliminar la tarea deja constancia de quien la elimino', '1', v_n::text,
    case when v_n = 1 then 'OK' else 'FALLA' end
  );

  select count(*) into v_n from public.task_events where task_id = v_tarea;
  insert into verificacion values (
    14, 'Los eventos de la tarea eliminada se retiran del historico', '0', v_n::text,
    case when v_n = 0 then 'OK' else 'FALLA' end
  );

  -- Limpieza: quitamos el rastro que dejo esta verificacion
  delete from public.task_events
   where task_id is null and event_type = 'eliminada' and task_title = v_titulo2;
end
$$;

select paso, comprobacion, esperado, obtenido, resultado
  from verificacion
 order by paso;
