/** Traducciones y formatos de fecha usados en todo el tablero. */

export const STATUSES = [
  { value: 'por_hacer', label: 'Por hacer' },
  { value: 'en_proceso', label: 'En proceso' },
  { value: 'hecho', label: 'Hecho' },
];

export const PRIORITIES = [
  { value: 'alta', label: 'Alta', rank: 1 },
  { value: 'media', label: 'Media', rank: 2 },
  { value: 'baja', label: 'Baja', rank: 3 },
];

// Las clases se escriben completas a propósito: Tailwind solo genera el CSS de
// las clases que encuentra escritas literalmente en el código.
export const AREA_TONES = {
  CPYG: {
    badge: 'cpyg',
    rail: 'bg-area-cpyg-soft',
    solid: 'bg-area-cpyg',
    text: 'text-area-cpyg-text',
  },
  RYVE: {
    badge: 'ryve',
    rail: 'bg-area-ryve-soft',
    solid: 'bg-area-ryve',
    text: 'text-area-ryve-text',
  },
  DEPORTES: {
    badge: 'deportes',
    rail: 'bg-area-deportes-soft',
    solid: 'bg-area-deportes',
    text: 'text-area-deportes-text',
  },
};

export function statusLabel(value) {
  return STATUSES.find((s) => s.value === value)?.label ?? value;
}

export function priorityLabel(value) {
  return PRIORITIES.find((p) => p.value === value)?.label ?? value;
}

export function priorityRank(value) {
  return PRIORITIES.find((p) => p.value === value)?.rank ?? 99;
}

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

/** "30 sep" para la tarjeta, donde el espacio es escaso. */
export function shortDate(isoDate) {
  if (!isoDate) return null;
  const d = new Date(`${isoDate}T12:00:00`);
  return `${d.getDate()} ${MESES[d.getMonth()].slice(0, 3)}`;
}

/** "30 de septiembre de 2026" para el detalle. */
export function longDate(isoDate) {
  if (!isoDate) return null;
  const d = new Date(`${isoDate}T12:00:00`);
  return `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
}

export function dateTimeLabel(isoInstant) {
  if (!isoInstant) return null;
  const d = new Date(isoInstant);
  return `${d.getDate()} ${MESES[d.getMonth()].slice(0, 3)} ${d.getFullYear()}, ${String(
    d.getHours()
  ).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function monthLabel(isoInstant) {
  const d = new Date(isoInstant);
  return `${MESES[d.getMonth()]} de ${d.getFullYear()}`;
}

/** Días de atraso respecto a hoy. Negativo significa que aún queda plazo. */
export function daysOverdue(isoDate, today = new Date()) {
  if (!isoDate) return null;
  const due = new Date(`${isoDate}T23:59:59`);
  return Math.floor((today - due) / 86400000);
}

export function dueState(task, today = new Date()) {
  if (!task.dueDate || task.status === 'hecho') return 'sin_plazo';
  const dias = daysOverdue(task.dueDate, today);
  if (dias > 0) return 'vencida';
  if (dias >= -7) return 'por_vencer';
  return 'a_tiempo';
}

export function dueLabel(task, today = new Date()) {
  const estado = dueState(task, today);
  if (estado === 'vencida') {
    const dias = daysOverdue(task.dueDate, today);
    return dias === 1 ? 'Venció ayer' : `Venció hace ${dias} días`;
  }
  return shortDate(task.dueDate);
}
