/**
 * Capa única de acceso a los datos de tareas. Toda pantalla pasa por aquí.
 * Cada función comprueba el permiso antes de guardar y registra el cambio en la
 * cronología, igual que harán las políticas RLS y los disparadores de Supabase.
 */
import { readState, updateState, nextEventId, nextTaskId } from './localStore';
import { priorityRank } from '../lib/taskFormat';
import {
  canArchiveTask,
  canChangePriority,
  canCreateTask,
  canDeleteTask,
  canEditTask,
  canMoveTask,
  canRestoreTask,
  canSeeArea,
  moveRejectionReason,
} from '../lib/permissions';

const espera = (ms = 160) => new Promise((r) => setTimeout(r, ms));

function registrar(events, task, actor, type, extra = {}) {
  return [
    ...events,
    {
      id: nextEventId(),
      taskId: task.id,
      areaCode: task.areaCode,
      taskTitle: task.title,
      actorId: actor?.id ?? null,
      actorName: actor?.fullName ?? 'Sistema',
      at: new Date().toISOString(),
      type,
      from: null,
      to: null,
      ...extra,
    },
  ];
}

/** Orden del tablero: primero la prioridad, después la posición vertical. */
function ordenar(lista) {
  return [...lista].sort(
    (a, b) => priorityRank(a.priority) - priorityRank(b.priority) || a.sortOrder - b.sortOrder
  );
}

export async function getAreas() {
  return readState().areas;
}

export async function getAreaBySlug(slug) {
  return readState().areas.find((a) => a.slug === slug) ?? null;
}

export async function getBoard(areaCode) {
  await espera(120);
  const { tasks } = readState();
  const delArea = tasks.filter((t) => t.areaCode === areaCode && !t.archivedAt);

  return {
    por_hacer: ordenar(delArea.filter((t) => t.status === 'por_hacer')),
    en_proceso: ordenar(delArea.filter((t) => t.status === 'en_proceso')),
    hecho: ordenar(delArea.filter((t) => t.status === 'hecho')),
  };
}

export async function getAreaSummary() {
  const { tasks, areas } = readState();
  return areas.map((area) => {
    const activas = tasks.filter((t) => t.areaCode === area.code && !t.archivedAt);
    return {
      ...area,
      porHacer: activas.filter((t) => t.status === 'por_hacer').length,
      enProceso: activas.filter((t) => t.status === 'en_proceso').length,
      hecho: activas.filter((t) => t.status === 'hecho').length,
      altaPrioridad: activas.filter((t) => t.priority === 'alta').length,
      archivadas: tasks.filter((t) => t.areaCode === area.code && t.archivedAt).length,
    };
  });
}

export async function getTeam(areaCode) {
  const { profiles } = readState();
  return profiles.filter((p) => p.areaCode === areaCode);
}

export async function moveTask({ taskId, newStatus, actor }) {
  await espera();
  const estado = readState();
  const task = estado.tasks.find((t) => t.id === taskId);
  if (!task) throw new Error('La tarea ya no existe.');

  if (!canMoveTask(actor, task)) {
    throw new Error(moveRejectionReason(actor, task));
  }
  if (task.status === newStatus) return task;

  const anterior = task.status;
  const finalDeColumna =
    Math.max(
      0,
      ...estado.tasks
        .filter(
          (t) =>
            t.areaCode === task.areaCode &&
            t.status === newStatus &&
            t.priority === task.priority &&
            !t.archivedAt
        )
        .map((t) => t.sortOrder)
    ) + 1000;

  const actualizada = {
    ...task,
    status: newStatus,
    sortOrder: finalDeColumna,
    completedAt:
      newStatus === 'hecho' ? new Date().toISOString() : anterior === 'hecho' ? null : task.completedAt,
  };

  updateState({
    tasks: estado.tasks.map((t) => (t.id === taskId ? actualizada : t)),
    events: registrar(estado.events, actualizada, actor, 'estado_cambiado', {
      from: anterior,
      to: newStatus,
    }),
  });

  return actualizada;
}

export async function setTaskPriority({ taskId, direction, actor }) {
  await espera(140);
  const estado = readState();
  const task = estado.tasks.find((t) => t.id === taskId);
  if (!task) throw new Error('La tarea ya no existe.');
  if (!canChangePriority(actor, task)) {
    throw new Error('Solo el Director y el líder del área cambian la prioridad.');
  }

  const escala = ['alta', 'media', 'baja'];
  const posicion = escala.indexOf(task.priority);
  const destino = direction === 'subir' ? posicion - 1 : posicion + 1;
  if (destino < 0 || destino >= escala.length) return task;

  const nuevaPrioridad = escala[destino];
  const finalDelGrupo =
    Math.max(
      0,
      ...estado.tasks
        .filter(
          (t) =>
            t.areaCode === task.areaCode &&
            t.status === task.status &&
            t.priority === nuevaPrioridad &&
            !t.archivedAt
        )
        .map((t) => t.sortOrder)
    ) + 1000;

  const actualizada = { ...task, priority: nuevaPrioridad, sortOrder: finalDelGrupo };

  updateState({
    tasks: estado.tasks.map((t) => (t.id === taskId ? actualizada : t)),
    events: registrar(estado.events, actualizada, actor, 'prioridad_cambiada', {
      from: task.priority,
      to: nuevaPrioridad,
    }),
  });

  return actualizada;
}

export async function createTask({ areaCode, values, actor }) {
  await espera();
  if (!canCreateTask(actor, areaCode)) {
    throw new Error('Solo el Director y el líder del área crean tareas.');
  }

  const estado = readState();
  const nueva = {
    id: nextTaskId(),
    areaCode,
    title: values.title.trim(),
    description: values.description?.trim() || null,
    assigneeId: values.assigneeId || null,
    priority: values.priority,
    status: 'por_hacer',
    sortOrder:
      Math.max(
        0,
        ...estado.tasks
          .filter(
            (t) =>
              t.areaCode === areaCode &&
              t.status === 'por_hacer' &&
              t.priority === values.priority &&
              !t.archivedAt
          )
          .map((t) => t.sortOrder)
      ) + 1000,
    dueDate: values.dueDate || null,
    createdBy: actor.id,
    createdAt: new Date().toISOString(),
    completedAt: null,
    archivedAt: null,
    archivedBy: null,
  };

  updateState({
    tasks: [...estado.tasks, nueva],
    events: registrar(estado.events, nueva, actor, 'creada', { to: 'por_hacer' }),
  });

  return nueva;
}

export async function updateTask({ taskId, values, actor }) {
  await espera();
  const estado = readState();
  const task = estado.tasks.find((t) => t.id === taskId);
  if (!task) throw new Error('La tarea ya no existe.');
  if (!canEditTask(actor, task)) {
    throw new Error('Solo el Director y el líder del área editan tareas.');
  }

  const actualizada = {
    ...task,
    title: values.title.trim(),
    description: values.description?.trim() || null,
    assigneeId: values.assigneeId || null,
    priority: values.priority,
    dueDate: values.dueDate || null,
  };

  let events = estado.events;
  if (actualizada.priority !== task.priority) {
    events = registrar(events, actualizada, actor, 'prioridad_cambiada', {
      from: task.priority,
      to: actualizada.priority,
    });
  }
  if (actualizada.assigneeId !== task.assigneeId) {
    const nombre = (id) =>
      estado.profiles.find((p) => p.id === id)?.fullName ?? 'Sin responsable';
    events = registrar(events, actualizada, actor, 'responsable_cambiado', {
      from: nombre(task.assigneeId),
      to: nombre(actualizada.assigneeId),
    });
  }
  if (
    actualizada.title !== task.title ||
    actualizada.description !== task.description ||
    actualizada.dueDate !== task.dueDate
  ) {
    events = registrar(events, actualizada, actor, 'detalle_editado', {});
  }

  updateState({
    tasks: estado.tasks.map((t) => (t.id === taskId ? actualizada : t)),
    events,
  });

  return actualizada;
}

export async function deleteTask({ taskId, actor }) {
  await espera();
  const estado = readState();
  const task = estado.tasks.find((t) => t.id === taskId);
  if (!task) return;
  if (!canDeleteTask(actor, task)) {
    throw new Error('Solo el Director y el líder del área eliminan tareas.');
  }

  // La cronología de la tarea se va con ella, pero queda constancia de quién la
  // eliminó: así nadie hace desaparecer trabajo sin dejar rastro.
  const rastro = registrar(
    estado.events.filter((e) => e.taskId !== taskId),
    task,
    actor,
    'eliminada',
    { from: task.status }
  ).map((e) => (e.taskId === taskId && e.type === 'eliminada' ? { ...e, taskId: null } : e));

  updateState({
    tasks: estado.tasks.filter((t) => t.id !== taskId),
    events: rastro,
  });
}

export async function archiveTask({ taskId, actor }) {
  await espera();
  const estado = readState();
  const task = estado.tasks.find((t) => t.id === taskId);
  if (!task) throw new Error('La tarea ya no existe.');
  if (!canArchiveTask(actor, task)) {
    throw new Error('Solo se archivan tareas en Hecho, y lo hacen el Director o el líder.');
  }

  const actualizada = {
    ...task,
    archivedAt: new Date().toISOString(),
    archivedBy: actor.id,
  };

  updateState({
    tasks: estado.tasks.map((t) => (t.id === taskId ? actualizada : t)),
    events: registrar(estado.events, actualizada, actor, 'archivada'),
  });

  return actualizada;
}

export async function restoreTask({ taskId, actor }) {
  await espera();
  if (!canRestoreTask(actor)) {
    throw new Error('Solo el Director devuelve tareas al tablero.');
  }

  const estado = readState();
  const task = estado.tasks.find((t) => t.id === taskId);
  if (!task) throw new Error('La tarea ya no existe.');

  const actualizada = { ...task, archivedAt: null, archivedBy: null };

  updateState({
    tasks: estado.tasks.map((t) => (t.id === taskId ? actualizada : t)),
    events: registrar(estado.events, actualizada, actor, 'restaurada'),
  });

  return actualizada;
}

/** Repositorio histórico: lo archivado, en orden cronológico inverso. */
export async function getHistory({ actor, areaCode = 'todas', assigneeId = 'todos', desde, hasta }) {
  await espera(120);
  const { tasks } = readState();

  return tasks
    .filter((t) => t.archivedAt)
    .filter((t) => canSeeArea(actor, t.areaCode))
    .filter((t) => (areaCode === 'todas' ? true : t.areaCode === areaCode))
    .filter((t) => (assigneeId === 'todos' ? true : t.assigneeId === assigneeId))
    .filter((t) => (desde ? new Date(t.archivedAt) >= new Date(`${desde}T00:00:00`) : true))
    .filter((t) => (hasta ? new Date(t.archivedAt) <= new Date(`${hasta}T23:59:59`) : true))
    .sort((a, b) => new Date(b.archivedAt) - new Date(a.archivedAt));
}

export async function getTaskTimeline(taskId) {
  const { events } = readState();
  return events
    .filter((e) => e.taskId === taskId)
    .sort((a, b) => new Date(a.at) - new Date(b.at));
}

export async function getProfilesById() {
  const { profiles } = readState();
  return Object.fromEntries(profiles.map((p) => [p.id, p]));
}

/**
 * Indicadores. Devuelve dos cosas: el estado actual y la evolución en el tiempo.
 * La evolución se calcula desde la cronología, que es la única fuente que sabe
 * cuándo pasó cada cosa.
 */
export async function getIndicators({ actor }) {
  await espera(140);
  const { tasks, events, profiles, areas } = readState();

  const visibles = tasks.filter((t) => canSeeArea(actor, t.areaCode));
  const activas = visibles.filter((t) => !t.archivedAt);
  const hoy = new Date();

  const porColumna = areas
    .filter((a) => canSeeArea(actor, a.code))
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

  const porPrioridad = ['alta', 'media', 'baja'].map((priority) => ({
    priority,
    total: activas.filter((t) => t.priority === priority).length,
  }));

  const abiertas = activas.filter((t) => t.status !== 'hecho' && t.dueDate);
  const vencidas = abiertas.filter((t) => new Date(`${t.dueDate}T23:59:59`) < hoy);
  const porVencer = abiertas.filter((t) => {
    const limite = new Date(`${t.dueDate}T23:59:59`);
    return limite >= hoy && limite - hoy <= 7 * 86400000;
  });

  const cargaPorPersona = profiles
    .filter((p) => p.areaCode && canSeeArea(actor, p.areaCode))
    .map((p) => ({
      id: p.id,
      fullName: p.fullName,
      areaCode: p.areaCode,
      colorToken: p.colorToken,
      abiertas: activas.filter((t) => t.assigneeId === p.id && t.status !== 'hecho').length,
    }))
    .sort((a, b) => b.abiertas - a.abiertas);

  // Cierres por mes, tomados del momento en que la tarea entró a Hecho
  const cierres = events.filter(
    (e) => e.type === 'estado_cambiado' && e.to === 'hecho' && canSeeArea(actor, e.areaCode)
  );

  const meses = new Map();
  for (const cierre of cierres) {
    const fecha = new Date(cierre.at);
    const clave = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
    meses.set(clave, (meses.get(clave) ?? 0) + 1);
  }
  const completadasPorMes = [...meses.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([clave, total]) => ({ clave, total }));

  // Tiempo de ciclo: desde que se creó hasta la primera vez que llegó a Hecho
  const duraciones = [];
  for (const task of visibles) {
    const cierre = cierres
      .filter((e) => e.taskId === task.id)
      .sort((a, b) => new Date(a.at) - new Date(b.at))[0];
    if (cierre) {
      duraciones.push((new Date(cierre.at) - new Date(task.createdAt)) / 86400000);
    }
  }
  const cicloPromedio =
    duraciones.length > 0
      ? Math.round(duraciones.reduce((a, b) => a + b, 0) / duraciones.length)
      : null;

  return {
    porColumna,
    porPrioridad,
    vencidas: vencidas.length,
    porVencer: porVencer.length,
    abiertasTotal: activas.filter((t) => t.status !== 'hecho').length,
    archivadasTotal: visibles.filter((t) => t.archivedAt).length,
    cargaPorPersona,
    completadasPorMes,
    cicloPromedio,
    tareasCerradas: duraciones.length,
  };
}
