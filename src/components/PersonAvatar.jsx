import { personTone, initials } from '../lib/people';

const TAMANOS = {
  sm: 'h-6 w-6 text-sm',
  md: 'h-8 w-8 text-sm',
};

/**
 * Identificación visual del responsable: color de la persona con sus iniciales
 * encima. Las iniciales van dentro del círculo a propósito, para que el color
 * no sea el único dato que distingue a una persona de otra.
 *
 * El círculo es decorativo para el lector de pantalla porque el nombre completo
 * siempre aparece escrito al lado. Si algún día no fuera así, hay que quitar el
 * aria-hidden y poner el nombre en un title.
 */
export default function PersonAvatar({ profile, size = 'sm' }) {
  const tono = personTone(profile);

  return (
    <span
      aria-hidden="true"
      title={profile?.fullName ?? 'Sin responsable'}
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-mono font-medium ${TAMANOS[size]} ${tono.solid} ${tono.on}`}
    >
      {profile ? initials(profile.fullName) : '—'}
    </span>
  );
}
