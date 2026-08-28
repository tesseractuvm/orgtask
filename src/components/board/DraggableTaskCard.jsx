import { useDraggable } from '@dnd-kit/core';
import TaskCard from './TaskCard';

/**
 * Envuelve la tarjeta para poder arrastrarla en escritorio. El arrastre solo se
 * habilita si la persona puede mover esa tarea; en móvil los botones de avanzar
 * y retroceder hacen lo mismo, que es más cómodo con el dedo.
 */
export default function DraggableTaskCard({ task, permisos, ...props }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    disabled: !permisos.puedeMover,
  });

  const estilo = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={estilo}
      className={isDragging ? 'relative z-20 opacity-90 shadow-raised' : undefined}
    >
      <TaskCard
        task={task}
        permisos={permisos}
        dragHandleProps={{ ...attributes, ...listeners }}
        {...props}
      />
    </div>
  );
}
