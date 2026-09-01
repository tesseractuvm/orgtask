import { palette, areaTokens, personTokens } from '../../data/designTokens';
import { initials, PERSON_TONES } from '../../lib/people';

/** Muestra la paleta con el nombre, el hex y la funcion de cada color. */
export default function PaletteSection() {
  return (
    <section aria-labelledby="paleta" className="border-t border-line pt-8">
      <h2 id="paleta" className="text-lg">
        Paleta
      </h2>
      <p className="mt-1 max-w-2xl text-sm text-slate">
        Seis colores de interfaz, diez de identificación de personas y tres de área.
        Cada uno tiene una función asignada: ningún color entra por decoración.
      </p>

      <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {palette.map((color) => (
          <li
            key={color.name}
            className="flex items-center gap-3 rounded border border-line bg-surface p-3 shadow-card"
          >
            <span
              aria-hidden="true"
              className={`h-12 w-12 shrink-0 rounded border border-line-strong ${color.swatch}`}
            />
            <div className="min-w-0">
              <p className="font-mono text-sm font-medium text-ink">{color.name}</p>
              <p className="font-mono text-sm text-slate">{color.hex}</p>
              <p className="mt-0.5 text-sm text-slate">{color.role}</p>
            </div>
          </li>
        ))}
      </ul>

      <h3 className="mt-8 text-base font-semibold">Identificación del responsable</h3>
      <p className="mt-1 max-w-2xl text-sm text-slate">
        El color de una tarjeta dice de quién es la tarea, no de qué área es ni qué
        prioridad tiene. Nunca viaja solo: junto al color van siempre las iniciales y
        el nombre escrito, para que el tablero se pueda leer sin distinguir los tonos.
      </p>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {personTokens.map((persona) => (
          <li
            key={persona.token}
            className="flex items-center gap-3 rounded border border-line bg-surface p-3 shadow-card"
          >
            <span
              aria-hidden="true"
              className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-mono text-sm font-medium ${persona.swatch} ${PERSON_TONES[persona.token].on}`}
            >
              {initials(persona.quien)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-base font-medium text-ink">{persona.quien}</p>
              <p className="text-sm text-slate">{persona.label}</p>
              <p className="font-mono text-sm text-slate">{persona.hex}</p>
            </div>
          </li>
        ))}
      </ul>

      <h3 className="mt-8 text-base font-semibold">Identificación de área</h3>
      <p className="mt-1 max-w-2xl text-sm text-slate">
        Se usa solo para navegar entre tableros y en las tablas por área. En una
        tarjeta manda el color de la persona.
      </p>
      <ul className="mt-3 grid gap-3 sm:grid-cols-3">
        {areaTokens.map((area) => (
          <li
            key={area.code}
            className="flex items-center gap-3 rounded border border-line bg-surface p-3 shadow-card"
          >
            <span
              aria-hidden="true"
              className={`h-10 w-2 shrink-0 rounded-sm ${area.swatch}`}
            />
            <div className="min-w-0">
              <p className="text-base font-medium text-ink">{area.code}</p>
              <p className="text-sm text-slate">{area.name}</p>
              <p className="font-mono text-sm text-slate">{area.hex}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
