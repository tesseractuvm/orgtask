import {
  CalendarDays,
  ArrowLeft,
  ArrowRight,
  Pencil,
  Archive,
  GripVertical,
} from 'lucide-react';
import PriorityRail from './PriorityRail';
import PersonAvatar from '../PersonAvatar';
import { personTone } from '../../lib/people';
import { dueLabel, dueState, priorityLabel, STATUSES } from '../../lib/taskFormat';

const ORDEN = STATUSES.map((s) => s.value);

/**
 * Tarjeta del tablero. Muestra los datos que pide el brief y solo los controles
 * que la persona tiene permitido usar.
 *
 * El color de la tarjeta es el de quien responde por ella, nunca el de su
 * prioridad ni el de su área. Va acompañado siempre de las iniciales y del
 * nombre escrito, que es la regla del brief para no depender del color.
 */
export default function TaskCard({
  task,
  rank,
  responsable,
  permisos,
  onMove,
  onPriority,
  onEdit,
  onArchive,
  busy,
  dragHandleProps,
}) {
  const posicion = ORDEN.indexOf(task.status);
  const vencimiento = dueState(task);
  const tono = personTone(responsable);

  const fechaClases =
    vencimiento === 'vencida'
      ? 'font-medium text-alert'
      : vencimiento === 'por_vencer'
        ? 'font-medium text-slate-dark'
        : 'text-slate';

  return (
    <article className="flex overflow-hidden rounded border border-line bg-surface shadow-card">
      <PriorityRail
        tone={tono}
        rank={rank}
        taskTitle={task.title}
        canChange={permisos.puedeCambiarPrioridad}
        onChange={(direccion) => onPriority(task, direccion)}
        busy={busy}
      />

      <div className="min-w-0 flex-1 px-3 py-2.5">
        <div className="flex items-start gap-2">
          <h3 className="min-w-0 flex-1 text-base font-medium text-ink">{task.title}</h3>
          {permisos.puedeMover && dragHandleProps && (
            <span
              {...dragHandleProps}
              aria-hidden="true"
              title="Arrastra para cambiar de columna"
              className="hidden shrink-0 cursor-grab rounded-sm p-0.5 text-slate-light hover:bg-paper hover:text-slate active:cursor-grabbing sm:block"
            >
              <GripVertical className="h-4 w-4" />
            </span>
          )}
        </div>

        {task.description && (
          <p className="mt-1 line-clamp-2 text-sm text-slate">{task.description}</p>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <PersonAvatar profile={responsable} />
          <span className="text-slate-dark">{responsable?.fullName ?? 'Sin responsable'}</span>
          <span aria-hidden="true" className="text-slate-light">·</span>
          <span className="font-mono uppercase tracking-wide text-slate">
            {priorityLabel(task.priority)}
          </span>
          {task.dueDate && (
            <span className={`ml-auto inline-flex items-center gap-1 font-mono ${fechaClases}`}>
              <CalendarDays aria-hidden="true" className="h-3.5 w-3.5" />
              {dueLabel(task)}
            </span>
          )}
        </div>

        <div className="mt-2.5 flex items-center gap-1 border-t border-line pt-2">
          <button
            type="button"
            disabled={!permisos.puedeMover || posicion === 0 || busy}
            onClick={() => onMove(task, ORDEN[posicion - 1])}
            aria-label={`Retroceder ${task.title}`}
            title="Retroceder"
            className="rounded p-1.5 text-slate transition-colors duration-150 enabled:hover:bg-paper enabled:hover:text-ink disabled:text-slate-light"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          </button>
          <button
            type="button"
            disabled={!permisos.puedeMover || posicion === ORDEN.length - 1 || busy}
            onClick={() => onMove(task, ORDEN[posicion + 1])}
            aria-label={`Avanzar ${task.title}`}
            title="Avanzar"
            className="rounded p-1.5 text-slate transition-colors duration-150 enabled:hover:bg-paper enabled:hover:text-ink disabled:text-slate-light"
          >
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </button>

          <div className="ml-auto flex items-center gap-1">
            {permisos.puedeEditar && (
              <button
                type="button"
                onClick={() => onEdit(task)}
                aria-label={`Editar ${task.title}`}
                title="Editar tarea"
                className="rounded p-1.5 text-slate transition-colors duration-150 hover:bg-paper hover:text-ink"
              >
                <Pencil aria-hidden="true" className="h-4 w-4" />
              </button>
            )}
            {permisos.puedeArchivar && (
              <button
                type="button"
                onClick={() => onArchive(task)}
                aria-label={`Archivar ${task.title}`}
                title="Archivar al histórico"
                className="rounded p-1.5 text-slate transition-colors duration-150 hover:bg-paper hover:text-ink"
              >
                <Archive aria-hidden="true" className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
