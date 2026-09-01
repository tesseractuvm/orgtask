import { ChevronUp, ChevronDown } from 'lucide-react';

/**
 * El elemento firma de la interfaz. La prioridad es la posición vertical, así
 * que su control también es vertical y vive en el borde izquierdo de la tarjeta.
 * Las flechas solo aparecen activas para quien puede cambiar la prioridad.
 *
 * El riel se tiñe con el color de la persona responsable, no con el del área:
 * es lo que permite recorrer una columna y ver de quién es cada tarea sin leer
 * un solo nombre.
 */
export default function PriorityRail({ tone, rank, taskTitle, canChange, onChange, busy }) {
  return (
    <div
      className={`flex w-11 shrink-0 flex-col items-center justify-between border-r border-line py-1.5 ${tone.soft}`}
    >
      <button
        type="button"
        disabled={!canChange || busy}
        onClick={() => onChange('subir')}
        aria-label={`Subir prioridad de ${taskTitle}`}
        title="Subir prioridad"
        className={`rounded-sm p-0.5 transition-colors duration-150 ${tone.text} enabled:hover:bg-ink enabled:hover:text-white disabled:text-slate-light`}
      >
        <ChevronUp aria-hidden="true" className="h-4 w-4" />
      </button>

      <span className={`font-mono text-sm font-semibold ${tone.text}`}>{rank}</span>

      <button
        type="button"
        disabled={!canChange || busy}
        onClick={() => onChange('bajar')}
        aria-label={`Bajar prioridad de ${taskTitle}`}
        title="Bajar prioridad"
        className={`rounded-sm p-0.5 transition-colors duration-150 ${tone.text} enabled:hover:bg-ink enabled:hover:text-white disabled:text-slate-light`}
      >
        <ChevronDown aria-hidden="true" className="h-4 w-4" />
      </button>
    </div>
  );
}
