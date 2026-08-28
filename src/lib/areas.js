/**
 * Las tres áreas de la DEE. Son fijas por definición del proyecto: no se crean
 * ni se borran desde la aplicación, así que la navegación las conoce de
 * antemano y no necesita esperar una consulta para dibujarse.
 *
 * El código (CPYG, RYVE, DEPORTES) es el mismo en la base de datos, que es lo
 * que permite que la interfaz funcione igual con Supabase o con datos locales.
 */
export const AREAS = [
  {
    code: 'CPYG',
    slug: 'cpyg',
    shortName: 'CPyG',
    name: 'Comunidad de Profesionales y Graduados',
    order: 1,
  },
  {
    code: 'RYVE',
    slug: 'ryve',
    shortName: 'RyVE',
    name: 'Relación y Vinculación Estudiantil',
    order: 2,
  },
  {
    code: 'DEPORTES',
    slug: 'deportes',
    shortName: 'Deportes',
    name: 'Unidad de Deportes',
    order: 3,
  },
];

export function areaPorSlug(slug) {
  return AREAS.find((a) => a.slug === slug) ?? null;
}

export function areaPorCodigo(code) {
  return AREAS.find((a) => a.code === code) ?? null;
}
