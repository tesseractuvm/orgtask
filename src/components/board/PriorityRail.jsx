import { ChevronUp, ChevronDown } from 'lucide-react';
import { AREA_TONES } from '../../lib/taskFormat';

/**
 * El elemento firma de la interfaz. La prioridad es la posición vertical, así
 * que su control también es vertical y vive en el borde izquierdo de la tarjeta.
 * Las flechas solo aparecen activas para quien puede cambiar la prioridad.
 */
export default function PriorityRail({ rank, areaCode, taskTitle, canChange, onChange, busy }) {
  const tono = AREA_TONES[areaCode];

  return (
    <div
      className={`flex w-11 shrink-0 flex-col items-center justify-between border-r border-line py-1.5 ${tono.rail}`}
    >
      <button
        type="button"
        disabled={!canChange || busy}
        onClick={() => onChange('subir')}
        aria-label={`Subir prioridad de ${taskTitle}`}
        title="Subir prioridad"
        className={`rounded-sm p-0.5 transition-colors duration-150 ${tono.text} enabled:hover:bg-ink enabled:hover:text-white disabled:text-slate-light`}
      >
        <ChevronUp aria-hidden="true" className="h-4 w-4" />
      </button>

      <span className={`font-mono text-sm font-semibold ${tono.text}`}>{rank}</span>

      <button
        type="button"
        disabled={!canChange || busy}
        onClick={() => onChange('bajar')}
        aria-label={`Bajar prioridad de ${taskTitle}`}
        title="Bajar prioridad"
        className={`rounded-sm p-0.5 transition-colors duration-150 ${tono.text} enabled:hover:bg-ink enabled:hover:text-white disabled:text-slate-light`}
      >
        <ChevronDown aria-hidden="true" className="h-4 w-4" />
      </button>
    </div>
  );
}
