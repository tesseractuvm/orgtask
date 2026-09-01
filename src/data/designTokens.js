/**
 * Referencia del sistema de diseño. Alimenta la página de muestra y sirve como
 * documentación viva: si un color cambia aquí y en tailwind.config.js, la
 * página lo refleja sola.
 */
import { PERSON_TONES } from '../lib/people';
import { profiles } from './seedData';

export const palette = [
  {
    name: 'ink',
    hex: '#10233D',
    role: 'Barra lateral y títulos de mayor jerarquía',
    swatch: 'bg-ink',
  },
  {
    name: 'paper',
    hex: '#F4F5F7',
    role: 'Fondo del lienzo de trabajo',
    swatch: 'bg-paper',
  },
  {
    name: 'surface',
    hex: '#FFFFFF',
    role: 'Tarjetas y superficies elevadas',
    swatch: 'bg-surface',
  },
  {
    name: 'line',
    hex: '#DBDFE6',
    role: 'Bordes y separadores de columna',
    swatch: 'bg-line',
  },
  {
    name: 'slate',
    hex: '#5A6577',
    role: 'Texto secundario, fechas y metadatos',
    swatch: 'bg-slate',
  },
  {
    name: 'signal',
    hex: '#0B63CE',
    role: 'Acento único de acción y anillo de foco',
    swatch: 'bg-signal',
  },
];

export const areaTokens = [
  {
    code: 'CPyG',
    name: 'Comunidad de Profesionales y Graduados',
    hex: '#B8701C',
    swatch: 'bg-area-cpyg',
    tone: 'cpyg',
  },
  {
    code: 'RyVE',
    name: 'Relación y Vinculación Estudiantil',
    hex: '#1E7A5F',
    swatch: 'bg-area-ryve',
    tone: 'ryve',
  },
  {
    code: 'Deportes',
    name: 'Unidad de Deportes',
    hex: '#6D4534',
    swatch: 'bg-area-deportes',
    tone: 'deportes',
  },
];

/**
 * Los diez colores que identifican a las personas. Se arma desde PERSON_TONES y
 * desde el equipo, así que la página de muestra nunca queda desfasada respecto
 * de lo que ve el tablero.
 */
export const personTokens = Object.entries(PERSON_TONES).map(([token, tono]) => ({
  token,
  label: tono.label,
  hex: tono.hex,
  swatch: tono.solid,
  quien: profiles.find((p) => p.colorToken === token)?.fullName ?? 'Sin asignar',
}));

export const typeScale = [
  { token: 'text-3xl', px: 64, use: 'Cifra protagonista de Indicadores', font: 'display' },
  { token: 'text-2xl', px: 40, use: 'Título de página', font: 'display' },
  { token: 'text-xl', px: 28, use: 'Nombre del área en el tablero', font: 'display' },
  { token: 'text-lg', px: 20, use: 'Título de columna y de diálogo', font: 'display' },
  { token: 'text-base', px: 16, use: 'Título de tarjeta y cuerpo', font: 'sans' },
  { token: 'text-sm', px: 14, use: 'Metadatos, fechas y etiquetas', font: 'sans' },
];
