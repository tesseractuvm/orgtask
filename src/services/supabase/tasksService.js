/**
 * Tareas contra Supabase. Cada escritura pasa por una función de la base de
 * datos o por una política RLS, así que el permiso se comprueba en el servidor
 * y no en el navegador.
 */
import { supabase, traducirError } from './client';
import {
  areasEnCache,
  codeDeArea,
  eventoDesdeFila,
  guardarAreas,
  idDeArea,
  perfilDesdeFila,
  tareaDesdeFila,
  tareaHaciaFila,
} from './mappers';
import { priorityRank } from '../../lib/taskFormat';

async function cargarAreas() {
  if (areasEnCache().length > 0) return areasEnCache();
  const { data, error } = await supabase.from('areas').select('*').order('display_order');
  if (error) throw new Error(traducirError(error, 'No se pudieron cargar las áreas.'));
  return guardarAreas(data);
}

export async function getAreas() {
  return cargarAreas();
}

export async function getAreaBySlug(slug) {
  const areas = await cargarAreas();
  return areas.find((a) => a.slug === slug) ?? null;
}

function ordenar(lista) {
  return [...lista].sort(
    (a, b) => priorityRank(a.priority) - priorityRank(b.priority) || a.sortOrder - b.sortOrder
  );
}

export async function getBoard(areaCode) {
  await cargarAreas();
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('area_id', idDeArea(areaCode))
    .is('archived_at', null);

  if (error) throw new Error(traducirError(error, 'No se pudo cargar el tablero.'));

  const tareas = data.map(tareaDesdeFila);
  return {
    por_hacer: ordenar(tareas.filter((t) => t.status === 'por_hacer')),
    en_proceso: ordenar(tareas.filter((t) => t.status === 'en_proceso')),
    hecho: ordenar(tareas.filter((t) => t.status === 'hecho')),
  };
}

export async function getAreaSummary() {
  const areas = await cargarAreas();
  const { data, error } = await supabase.from('tasks').select('area_id, status, priority, archived_at');
  if (error) throw new Error(traducirError(error, 'No se pudo cargar el resumen.'));

  return areas.map((area) => {
    const suyas = data.filter((t) => t.area_id === area.id);
    const activas = suyas.filter((t) => !t.archived_at);
    return {
      ...area,
      porHacer: activas.filter((t) => t.status === 'por_hacer').length,
      enProceso: activas.filter((t) => t.status === 'en_proceso').length,
      hecho: activas.filter((t) => t.status === 'hecho').length,
      altaPrioridad: activas.filter((t) => t.priority === 'alta').length,
      archivadas: suyas.filter((t) => t.archived_at).length,
    };
  });
}

export async function getTeam(areaCode) {
  await cargarAreas();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('area_id', idDeArea(areaCode))
    .eq('is_active', true)
    .order('full_name');

  if (error) throw new Error(traducirError(error, 'No se pudo cargar el equipo del área.'));
  return data.map(perfilDesdeFila);
}

export async function getProfilesById() {
  await cargarAreas();
  const { data, error } = await supabase.from('profiles').select('*');
  if (error) throw new Error(traducirError(error, 'No se pudo cargar el equipo.'));
  return Object.fromEntries(data.map((fila) => [fila.id, perfilDesdeFila(fila)]));
}

/** Mover de columna. La base valida rol, área y propiedad dentro de move_task. */
export async function moveTask({ taskId, newStatus }) {
  const { data, error } = await supabase.rpc('move_task', {
    p_task_id: taskId,
    p_new_status: newStatus,
  });
  if (error) throw new Error(traducirError(error, 'No se pudo mover la tarea.'));
  return tareaDesdeFila(Array.isArray(data) ? data[0] : data);
}

export async function setTaskPriority({ taskId, direction }) {
  const { data: actual, error: errorLectura } = await supabase
    .from('tasks')
    .select('priority')
    .eq('id', taskId)
    .single();

  if (errorLectura) throw new Error(traducirError(errorLectura, 'No se pudo leer la tarea.'));

  const escala = ['alta', 'media', 'baja'];
  const destino = escala.indexOf(actual.priority) + (direction === 'subir' ? -1 : 1);
  if (destino < 0 || destino >= escala.length) return null;

  const { data, error } = await supabase.rpc('set_task_priority', {
    p_task_id: taskId,
    p_priority: escala[destino],
  });
  if (error) throw new Error(traducirError(error, 'No se pudo cambiar la prioridad.'));
  return tareaDesdeFila(Array.isArray(data) ? data[0] : data);
}

export async function createTask({ areaCode, values }) {
  await cargarAreas();
  const { data, error } = await supabase
    .from('tasks')
    .insert(tareaHaciaFila(values, areaCode))
    .select()
    .single();

  if (error) throw new Error(traducirError(error, 'No se pudo crear la tarea.'));
  return tareaDesdeFila(data);
}

export async function updateTask({ taskId, values }) {
  const { area_id: _sinUsar, ...campos } = tareaHaciaFila(values, null);
  const { data, error } = await supabase
    .from('tasks')
    .update(campos)
    .eq('id', taskId)
    .select()
    .single();

  if (error) throw new Error(traducirError(error, 'No se pudo guardar la tarea.'));
  return tareaDesdeFila(data);
}

export async function deleteTask({ taskId }) {
  const { error } = await supabase.from('tasks').delete().eq('id', taskId);
  if (error) throw new Error(traducirError(error, 'No se pudo eliminar la tarea.'));
}

export async function archiveTask({ taskId }) {
  const { data, error } = await supabase.rpc('archive_task', { p_task_id: taskId });
  if (error) throw new Error(traducirError(error, 'No se pudo archivar la tarea.'));
  return tareaDesdeFila(Array.isArray(data) ? data[0] : data);
}

export async function restoreTask({ taskId }) {
  const { data, error } = await supabase.rpc('restore_task', { p_task_id: taskId });
  if (error) throw new Error(traducirError(error, 'No se pudo devolver la tarea al tablero.'));
  return tareaDesdeFila(Array.isArray(data) ? data[0] : data);
}

export async function getHistory({ areaCode = 'todas', assigneeId = 'todos', desde, hasta }) {
  await cargarAreas();

  let consulta = supabase
    .from('tasks')
    .select('*')
    .not('archived_at', 'is', null)
    .order('archived_at', { ascending: false });

  if (areaCode !== 'todas') consulta = consulta.eq('area_id', idDeArea(areaCode));
  if (assigneeId !== 'todos') consulta = consulta.eq('assignee_id', assigneeId);
  if (desde) consulta = consulta.gte('archived_at', `${desde}T00:00:00`);
  if (hasta) consulta = consulta.lte('archived_at', `${hasta}T23:59:59`);

  const { data, error } = await consulta;
  if (error) throw new Error(traducirError(error, 'No se pudo cargar el histórico.'));
  return data.map(tareaDesdeFila);
}

export async function getTaskTimeline(taskId) {
  await cargarAreas();
  const { data, error } = await supabase
    .from('task_events')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at')
    .order('id');

  if (error) throw new Error(traducirError(error, 'No se pudo cargar la cronología.'));
  return data.map(eventoDesdeFila);
}

export async function getIndicators() {
  const areas = await cargarAreas();

  const [{ data: tareas, error: e1 }, { data: personas, error: e2 }, { data: cierres, error: e3 }] =
    await Promise.all([
      supabase.from('tasks').select('*'),
      supabase.from('profiles').select('*').eq('is_active', true),
      supabase
        .from('task_events')
        .select('task_id, area_id, created_at')
        .eq('event_type', 'estado_cambiado')
        .eq('new_value', 'hecho')
        .order('created_at'),
    ]);

  const fallo = e1 ?? e2 ?? e3;
  if (fallo) throw new Error(traducirError(fallo, 'No se pudieron calcular los indicadores.'));

  const todas = tareas.map(tareaDesdeFila);
  const activas = todas.filter((t) => !t.archivedAt);
  const hoy = new Date();

  const porColumna = areas
    .filter((area) => activas.some((t) => t.areaCode === area.code) || true)
    .filter((area) => tareas.some((t) => t.area_id === area.id))
    .map((area) => {
      const suyas = activas.filter((t) => t.areaCode === area.code);
      return {
        areaCode: area.code,
        shortName: area.shortName,
        por_hacer: suyas.filter((t) => t.status === 'por_hacer').length,
        en_proceso: suyas.filter((t) => t.status === 'en_proceso').length,
        hecho: suyas.filter((t) => t.status === 'hecho').length,
      };
    });

  const abiertas = activas.filter((t) => t.status !== 'hecho' && t.dueDate);
  const vencidas = abiertas.filter((t) => new Date(`${t.dueDate}T23:59:59`) < hoy);
  const porVencer = abiertas.filter((t) => {
    const limite = new Date(`${t.dueDate}T23:59:59`);
    return limite >= hoy && limite - hoy <= 7 * 86400000;
  });

  const meses = new Map();
  for (const cierre of cierres) {
    const fecha = new Date(cierre.created_at);
    const clave = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
    meses.set(clave, (meses.get(clave) ?? 0) + 1);
  }

  const primerCierre = new Map();
  for (const cierre of cierres) {
    if (!primerCierre.has(cierre.task_id)) primerCierre.set(cierre.task_id, cierre.created_at);
  }

  const duraciones = todas
    .filter((t) => primerCierre.has(t.id))
    .map((t) => (new Date(primerCierre.get(t.id)) - new Date(t.createdAt)) / 86400000);

  return {
    porColumna,
    porPrioridad: ['alta', 'media', 'baja'].map((priority) => ({
      priority,
      total: activas.filter((t) => t.priority === priority).length,
    })),
    vencidas: vencidas.length,
    porVencer: porVencer.length,
    abiertasTotal: activas.filter((t) => t.status !== 'hecho').length,
    archivadasTotal: todas.filter((t) => t.archivedAt).length,
    cargaPorPersona: personas
      .map(perfilDesdeFila)
      .filter((p) => p.areaCode)
      .map((p) => ({
        id: p.id,
        fullName: p.fullName,
        areaCode: p.areaCode,
        abiertas: activas.filter((t) => t.assigneeId === p.id && t.status !== 'hecho').length,
      }))
      .sort((a, b) => b.abiertas - a.abiertas),
    completadasPorMes: [...meses.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([clave, total]) => ({ clave, total })),
    cicloPromedio:
      duraciones.length > 0
        ? Math.round(duraciones.reduce((a, b) => a + b, 0) / duraciones.length)
        : null,
    tareasCerradas: duraciones.length,
  };
}
