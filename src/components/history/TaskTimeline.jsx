import { dateTimeLabel, priorityLabel, statusLabel } from '../../lib/taskFormat';

const TITULOS = {
  creada: 'Creó la tarea',
  estado_cambiado: 'Movió la tarea',
  prioridad_cambiada: 'Cambió la prioridad',
  responsable_cambiado: 'Cambió el responsable',
  detalle_editado: 'Editó los detalles',
  archivada: 'Archivó la tarea',
  restaurada: 'Devolvió la tarea al tablero',
  eliminada: 'Eliminó la tarea',
};

function detalle(evento) {
  if (evento.type === 'estado_cambiado') {
    return `${statusLabel(evento.from)} a ${statusLabel(evento.to)}`;
  }
  if (evento.type === 'prioridad_cambiada') {
    return `${priorityLabel(evento.from)} a ${priorityLabel(evento.to)}`;
  }
  if (evento.type === 'responsable_cambiado') {
    return `${evento.from} a ${evento.to}`;
  }
  return null;
}

/** La cronología de una tarea, leída de arriba hacia abajo. */
export default function TaskTimeline({ events }) {
  if (events.length === 0) {
    return <p className="text-sm text-slate">Esta tarea no tiene movimientos registrados.</p>;
  }

  return (
    <ol className="flex flex-col">
      {events.map((evento, indice) => (
        <li key={evento.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <span aria-hidden="true" className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-signal" />
            {indice < events.length - 1 && (
              <span aria-hidden="true" className="w-px flex-1 bg-line-strong" />
            )}
          </div>
          <div className="pb-4">
            <p className="text-base text-ink">
              <span className="font-medium">{evento.actorName}</span>
              {' · '}
              {TITULOS[evento.type]}
            </p>
            {detalle(evento) && <p className="text-sm text-slate-dark">{detalle(evento)}</p>}
            <p className="font-mono text-sm text-slate">{dateTimeLabel(evento.at)}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
