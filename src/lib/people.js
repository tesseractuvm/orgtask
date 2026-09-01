/**
 * Identidad visual de cada persona.
 *
 * El brief lo fija en tres lugares distintos: el color identifica al
 * responsable de la tarea, no al área. Por eso el color vive en el perfil de
 * la persona y no en el área, y por eso este archivo existe.
 *
 * El brief también advierte que el color nunca puede ser el único mecanismo:
 * junto al color va siempre el nombre y las iniciales. Una persona que no
 * distingue esos diez tonos sigue pudiendo leer el tablero.
 *
 * Las clases se escriben completas a propósito: Tailwind solo genera el CSS de
 * las clases que encuentra literalmente escritas en el código, así que no se
 * pueden armar concatenando el nombre del color.
 */

/**
 * Los diez tonos aprobados. `on` es el color de texto que va encima del relleno
 * sólido: los tonos claros llevan texto ink y los oscuros texto blanco. Todas
 * las combinaciones están verificadas sobre el contraste mínimo AA (4.5:1).
 */
export const PERSON_TONES = {
  amarillo: {
    label: 'Amarillo',
    hex: '#F2C230',
    solid: 'bg-person-amarillo',
    on: 'text-ink',
    soft: 'bg-person-amarillo-soft',
    text: 'text-person-amarillo-text',
    border: 'border-person-amarillo',
  },
  rosado: {
    label: 'Rosado pálido',
    hex: '#E8A0B4',
    solid: 'bg-person-rosado',
    on: 'text-ink',
    soft: 'bg-person-rosado-soft',
    text: 'text-person-rosado-text',
    border: 'border-person-rosado',
  },
  azul: {
    label: 'Azul',
    hex: '#1E63C4',
    solid: 'bg-person-azul',
    on: 'text-white',
    soft: 'bg-person-azul-soft',
    text: 'text-person-azul-text',
    border: 'border-person-azul',
  },
  verde: {
    label: 'Verde',
    hex: '#1E7A4F',
    solid: 'bg-person-verde',
    on: 'text-white',
    soft: 'bg-person-verde-soft',
    text: 'text-person-verde-text',
    border: 'border-person-verde',
  },
  lila: {
    label: 'Lila',
    hex: '#9B7BD4',
    solid: 'bg-person-lila',
    on: 'text-ink',
    soft: 'bg-person-lila-soft',
    text: 'text-person-lila-text',
    border: 'border-person-lila',
  },
  magenta: {
    label: 'Magenta',
    hex: '#B5218C',
    solid: 'bg-person-magenta',
    on: 'text-white',
    soft: 'bg-person-magenta-soft',
    text: 'text-person-magenta-text',
    border: 'border-person-magenta',
  },
  cafe: {
    label: 'Café',
    hex: '#6D4534',
    solid: 'bg-person-cafe',
    on: 'text-white',
    soft: 'bg-person-cafe-soft',
    text: 'text-person-cafe-text',
    border: 'border-person-cafe',
  },
  gris: {
    label: 'Gris',
    hex: '#6B7280',
    solid: 'bg-person-gris',
    on: 'text-white',
    soft: 'bg-person-gris-soft',
    text: 'text-person-gris-text',
    border: 'border-person-gris',
  },
  calipso: {
    label: 'Calipso',
    hex: '#0F7C90',
    solid: 'bg-person-calipso',
    on: 'text-white',
    soft: 'bg-person-calipso-soft',
    text: 'text-person-calipso-text',
    border: 'border-person-calipso',
  },
  naranjo: {
    label: 'Naranjo',
    hex: '#C2551A',
    solid: 'bg-person-naranjo',
    on: 'text-white',
    soft: 'bg-person-naranjo-soft',
    text: 'text-person-naranjo-text',
    border: 'border-person-naranjo',
  },
};

/** Tono neutro para una tarea sin responsable asignado. */
export const SIN_RESPONSABLE_TONE = {
  label: 'Sin asignar',
  hex: '#DBDFE6',
  solid: 'bg-line',
  on: 'text-slate-dark',
  soft: 'bg-paper',
  text: 'text-slate',
  border: 'border-line',
};

/** El tono de una persona, o el neutro si la tarea no tiene responsable. */
export function personTone(profile) {
  if (!profile) return SIN_RESPONSABLE_TONE;
  return PERSON_TONES[profile.colorToken] ?? SIN_RESPONSABLE_TONE;
}

export function colorLabel(colorToken) {
  return PERSON_TONES[colorToken]?.label ?? SIN_RESPONSABLE_TONE.label;
}

/**
 * Iniciales para el avatar: la primera letra del nombre y la del apellido.
 * "Juan Pablo Caneo" da JC, no JP: el apellido distingue más que el segundo
 * nombre en un equipo con varios Juan.
 */
export function initials(fullName) {
  const partes = String(fullName ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (partes.length === 0) return '?';
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}
