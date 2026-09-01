import { ChevronUp, ChevronDown, CalendarDays } from 'lucide-react';
import { PERSON_TONES } from '../../lib/people';

const TAREAS = [
  {
    rank: 1,
    priority: 'Alta',
    title: 'Convenio de prácticas con empresa aliada',
    owner: 'Francisca Tapia',
    colorToken: 'amarillo',
    due: '30 sep',
    overdue: false,
  },
  {
    rank: 2,
    priority: 'Media',
    title: 'Boletín mensual de la comunidad de egresados',
    owner: 'Catalina Tamayo',
    colorToken: 'rosado',
    due: '15 sep',
    overdue: false,
  },
  {
    rank: 3,
    priority: 'Baja',
    title: 'Actualizar base de contactos de graduados',
    owner: 'Javier Moya',
    colorToken: 'azul',
    due: '20 ago',
    overdue: true,
  },
];

/**
 * Vista previa del elemento firma: el riel de prioridad. La prioridad es la
 * posición vertical, así que su control también es vertical y vive en el borde
 * izquierdo de la tarjeta.
 */
export default function SignatureSection() {
  return (
    <section aria-labelledby="firma" className="border-t border-line pt-8">
      <h2 id="firma" className="text-lg">
        El riel de prioridad
      </h2>
      <p className="mt-1 max-w-2xl text-sm text-slate">
        El detalle propio de esta interfaz. Cada tarjeta lleva su orden a la izquierda,
        en el color de quien responde por ella, y ahí mismo están las flechas que
        cambian la prioridad. Las flechas solo aparecen activas para el Director y el
        líder del área.
      </p>

      <ul className="mt-5 flex max-w-md flex-col gap-2">
        {TAREAS.map((tarea, index) => (
          <li
            key={tarea.rank}
            className="flex overflow-hidden rounded border border-line bg-surface shadow-card"
          >
            <div
              className={`flex w-11 shrink-0 flex-col items-center justify-between border-r border-line py-1.5 ${PERSON_TONES[tarea.colorToken].soft}`}
            >
              <button
                type="button"
                disabled={index === 0}
                aria-label={`Subir prioridad de ${tarea.title}`}
                className={`rounded-sm p-0.5 transition-colors duration-150 ${PERSON_TONES[tarea.colorToken].text} hover:bg-ink hover:text-white disabled:text-slate-light disabled:hover:bg-transparent disabled:hover:text-slate-light`}
              >
                <ChevronUp aria-hidden="true" className="h-4 w-4" />
              </button>
              <span
                className={`font-mono text-sm font-semibold ${PERSON_TONES[tarea.colorToken].text}`}
              >
                {tarea.rank}
              </span>
              <button
                type="button"
                disabled={index === TAREAS.length - 1}
                aria-label={`Bajar prioridad de ${tarea.title}`}
                className={`rounded-sm p-0.5 transition-colors duration-150 ${PERSON_TONES[tarea.colorToken].text} hover:bg-ink hover:text-white disabled:text-slate-light disabled:hover:bg-transparent disabled:hover:text-slate-light`}
              >
                <ChevronDown aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>

            <div className="min-w-0 flex-1 px-3 py-2.5">
              <p className="text-base font-medium text-ink">{tarea.title}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate">
                <span>{tarea.owner}</span>
                <span className="text-slate-light" aria-hidden="true">
                  ·
                </span>
                <span className="font-mono uppercase tracking-wide">
                  Prioridad {tarea.priority}
                </span>
                <span
                  className={`ml-auto inline-flex items-center gap-1 font-mono ${
                    tarea.overdue ? 'font-medium text-alert' : 'text-slate'
                  }`}
                >
                  <CalendarDays aria-hidden="true" className="h-3.5 w-3.5" />
                  {tarea.due}
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
