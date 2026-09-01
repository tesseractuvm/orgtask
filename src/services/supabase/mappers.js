/**
 * Traducción entre la base de datos y la aplicación.
 *
 * La base usa nombres_con_guion_bajo y llaves uuid para las áreas; la interfaz
 * usa nombresEnCamello y el código del área (CPYG, RYVE, DEPORTES). Todo ese
 * cambio de forma ocurre aquí y en ningún otro lugar.
 */

let cacheAreas = null;

export function guardarAreas(filas) {
  cacheAreas = filas.map((fila) => ({
    id: fila.id,
    code: fila.code,
    slug: fila.code.toLowerCase(),
    shortName: NOMBRES_CORTOS[fila.code] ?? fila.code,
    name: fila.name,
    order: fila.display_order,
  }));
  return cacheAreas;
}

const NOMBRES_CORTOS = {
  CPYG: 'CPyG',
  RYVE: 'RyVE',
  DEPORTES: 'Deportes',
};

export function areasEnCache() {
  return cacheAreas ?? [];
}

export function idDeArea(code) {
  return areasEnCache().find((a) => a.code === code)?.id ?? null;
}

export function codeDeArea(id) {
  return areasEnCache().find((a) => a.id === id)?.code ?? null;
}

export function perfilDesdeFila(fila) {
  if (!fila) return null;
  return {
    id: fila.id,
    fullName: fila.full_name,
    email: fila.email,
    areaCode: fila.area_id ? codeDeArea(fila.area_id) : null,
    role: fila.role,
    // Color con el que se identifica a la persona en el tablero
    colorToken: fila.color_token,
    isAdmin: fila.is_admin,
    isActive: fila.is_active,
  };
}

export function tareaDesdeFila(fila) {
  if (!fila) return null;
  return {
    id: fila.id,
    areaCode: codeDeArea(fila.area_id),
    title: fila.title,
    description: fila.description,
    assigneeId: fila.assignee_id,
    priority: fila.priority,
    status: fila.status,
    sortOrder: Number(fila.sort_order),
    dueDate: fila.due_date,
    createdBy: fila.created_by,
    createdAt: fila.created_at,
    completedAt: fila.completed_at,
    archivedAt: fila.archived_at,
    archivedBy: fila.archived_by,
  };
}

export function eventoDesdeFila(fila) {
  return {
    id: String(fila.id),
    taskId: fila.task_id,
    areaCode: codeDeArea(fila.area_id),
    taskTitle: fila.task_title,
    actorId: fila.actor_id,
    actorName: fila.actor_name,
    type: fila.event_type,
    field: fila.field,
    from: fila.old_value,
    to: fila.new_value,
    at: fila.created_at,
  };
}

/** Los valores que viajan de la interfaz a la base al crear o editar una tarea. */
export function tareaHaciaFila(values, areaCode) {
  return {
    area_id: idDeArea(areaCode),
    title: values.title.trim(),
    description: values.description?.trim() || null,
    assignee_id: values.assigneeId || null,
    priority: values.priority,
    due_date: values.dueDate || null,
  };
}
