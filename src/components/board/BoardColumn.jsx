import { useDroppable } from '@dnd-kit/core';
import { Inbox } from 'lucide-react';
import DraggableTaskCard from './DraggableTaskCard';
import EmptyState from '../EmptyState';

const VACIAS = {
  por_hacer: 'Nada pendiente por ahora. Crea una tarea cuando aparezca un compromiso nuevo.',
  en_proceso: 'Nada en proceso. Avanza una tarea desde Por hacer cuando el equipo la tome.',
  hecho: 'Nada cerrado todavía. Lo que llegue aquí se puede archivar al histórico.',
};

/**
 * Una columna del tablero. Recibe tarjetas soltadas si el arrastre lo permite.
 * `cardProps` es una función porque los permisos y controles se calculan por
 * tarea, no por columna.
 */
export default function BoardColumn({ status, label, tasks, cardProps }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <section
      className="flex w-full shrink-0 snap-start flex-col sm:w-80"
      aria-labelledby={`columna-${status}`}
    >
      <div className="flex items-center justify-between gap-2 border-b-2 border-line px-1 pb-2">
        <h2 id={`columna-${status}`} className="text-lg">
          {label}
        </h2>
        <span className="font-mono text-sm text-slate">{tasks.length}</span>
      </div>

      <div
        ref={setNodeRef}
        className={`mt-3 flex min-h-24 flex-1 flex-col gap-2 rounded p-1 transition-colors duration-150 ${
          isOver ? 'bg-signal-light ring-2 ring-signal' : ''
        }`}
      >
        {tasks.length === 0 ? (
          <EmptyState icon={Inbox} title={label} description={VACIAS[status]} />
        ) : (
          tasks.map((task, indice) => (
            <DraggableTaskCard key={task.id} task={task} rank={indice + 1} {...cardProps(task)} />
          ))
        )}
      </div>
    </section>
  );
}
