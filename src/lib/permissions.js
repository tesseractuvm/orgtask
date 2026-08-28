/**
 * Reglas de permiso en un solo lugar. Las pantallas preguntan aquí antes de
 * mostrar un control, y la capa de datos pregunta aquí antes de guardar.
 *
 * Cuando conectemos Supabase, estas mismas reglas se escriben además como
 * políticas RLS en la base de datos. Ocultar un botón no protege nada: la
 * versión que manda es la de la base de datos. Esta existe para que la interfaz
 * no ofrezca acciones que van a ser rechazadas.
 */

export const ROLE_LABELS = {
  director: 'Director',
  lider: 'Líder de área',
  colaborador: 'Colaborador',
};

/** El Director y quien administra usuarios ven las tres áreas. */
export function canSeeAllAreas(profile) {
  return profile?.role === 'director' || profile?.isAdmin === true;
}

export function canSeeArea(profile, areaCode) {
  if (!profile) return false;
  if (canSeeAllAreas(profile)) return true;
  return profile.areaCode === areaCode;
}

export function visibleAreas(profile, areas) {
  if (!profile) return [];
  return areas.filter((area) => canSeeArea(profile, area.code));
}

/** Manda en el área: el Director en todas, el líder en la suya. */
function leadsArea(profile, areaCode) {
  if (!profile) return false;
  if (profile.role === 'director') return true;
  return profile.role === 'lider' && profile.areaCode === areaCode;
}

export function canCreateTask(profile, areaCode) {
  return leadsArea(profile, areaCode);
}

export function canEditTask(profile, task) {
  return leadsArea(profile, task.areaCode);
}

export function canDeleteTask(profile, task) {
  return leadsArea(profile, task.areaCode);
}

export function canChangePriority(profile, task) {
  return leadsArea(profile, task.areaCode);
}

/**
 * Mover entre columnas. Los colaboradores mueven solo sus propias tareas: es la
 * regla que la infografía marca como clave.
 */
export function canMoveTask(profile, task) {
  if (!profile) return false;
  if (leadsArea(profile, task.areaCode)) return true;
  if (profile.role === 'colaborador' && profile.areaCode === task.areaCode) {
    return task.assigneeId === profile.id;
  }
  return false;
}

/** Explica en español por qué no se puede mover, para mostrarlo al rechazar. */
export function moveRejectionReason(profile, task) {
  if (!profile) return 'Necesitas iniciar sesión.';
  if (profile.isAdmin && profile.role === 'colaborador' && task.assigneeId !== profile.id) {
    return 'Administras usuarios y ves las tres áreas, pero solo mueves tus propias tareas.';
  }
  if (!canSeeArea(profile, task.areaCode)) {
    return 'Esta tarea pertenece a otra área.';
  }
  if (profile.role === 'colaborador' && task.assigneeId !== profile.id) {
    return 'Solo puedes mover las tareas donde tú eres el responsable.';
  }
  return 'No tienes permiso para esta acción.';
}

export function canArchiveTask(profile, task) {
  return leadsArea(profile, task.areaCode) && task.status === 'hecho';
}

/** Devolver una tarea archivada al tablero es exclusivo del Director. */
export function canRestoreTask(profile) {
  return profile?.role === 'director';
}

export function canManageUsers(profile) {
  return profile?.isAdmin === true;
}
