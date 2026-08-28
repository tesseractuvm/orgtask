/**
 * Almacén local. Guarda el estado en localStorage del navegador para que el
 * trabajo sobreviva al recargar la página.
 *
 * IMPORTANTE: esto vive solo en tu navegador y en tu equipo. No se comparte
 * entre personas. Es el reemplazo temporal de Supabase hasta que tengamos las
 * credenciales; ninguna pantalla habla con este archivo directamente.
 */
import { areas, profiles, tasks as seedTasks } from '../data/seedData';

const STORAGE_KEY = 'orgtask.estado.v1';

/**
 * Reconstruye la cronología de las tareas de ejemplo con fechas coherentes,
 * igual que hace el seed de la base de datos.
 */
function buildInitialEvents(taskList) {
  const events = [];
  let secuencia = 1;

  const nombre = (id) => profiles.find((p) => p.id === id)?.fullName ?? 'Sistema';

  const push = (task, tipo, extra) => {
    events.push({
      id: `e-${secuencia++}`,
      taskId: task.id,
      areaCode: task.areaCode,
      taskTitle: task.title,
      actorId: task.assigneeId,
      actorName: nombre(task.assigneeId),
      ...extra,
      type: tipo,
    });
  };

  for (const task of taskList) {
    push(task, 'creada', { at: task.createdAt, from: null, to: 'por_hacer' });

    const creado = new Date(task.createdAt).getTime();

    if (task.status === 'en_proceso') {
      push(task, 'estado_cambiado', {
        at: new Date(creado + 3 * 86400000).toISOString(),
        from: 'por_hacer',
        to: 'en_proceso',
      });
    }

    if (task.status === 'hecho' && task.completedAt) {
      const cerrado = new Date(task.completedAt).getTime();
      push(task, 'estado_cambiado', {
        at: new Date(creado + (cerrado - creado) * 0.25).toISOString(),
        from: 'por_hacer',
        to: 'en_proceso',
      });
      push(task, 'estado_cambiado', {
        at: task.completedAt,
        from: 'en_proceso',
        to: 'hecho',
      });
      if (task.archivedAt) {
        push(task, 'archivada', { at: task.archivedAt, from: null, to: null });
      }
    }
  }

  return events.sort((a, b) => new Date(a.at) - new Date(b.at));
}

function initialState() {
  return {
    areas,
    profiles,
    tasks: seedTasks.map((t) => ({ ...t })),
    events: buildInitialEvents(seedTasks),
    session: null,
  };
}

let cache = null;

export function readState() {
  if (cache) return cache;

  try {
    const guardado = window.localStorage.getItem(STORAGE_KEY);
    cache = guardado ? JSON.parse(guardado) : initialState();
  } catch {
    // Si el contenido guardado está corrupto, se parte de cero en vez de fallar
    cache = initialState();
  }
  return cache;
}

export function writeState(siguiente) {
  cache = siguiente;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(siguiente));
  } catch {
    // Sin espacio o en modo privado: la sesión sigue funcionando en memoria
  }
  return cache;
}

export function updateState(cambio) {
  return writeState({ ...readState(), ...cambio });
}

/** Vuelve a los datos de ejemplo. Lo usa el botón de reinicio del perfil. */
export function resetState() {
  cache = null;
  window.localStorage.removeItem(STORAGE_KEY);
  return readState();
}

export function nextEventId() {
  return `e-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function nextTaskId() {
  return `t-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
