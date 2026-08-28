import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { Plus } from 'lucide-react';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Toast from '../components/Toast';
import PageHeader from '../components/layout/PageHeader';
import BoardColumn from '../components/board/BoardColumn';
import TaskFormModal from '../components/board/TaskFormModal';
import AccessDenied from './AccessDenied';
import { useAuth } from '../context/AuthContext';
import { tasksService as tareas } from '../services';
import { STATUSES, AREA_TONES } from '../lib/taskFormat';
import {
  canArchiveTask,
  canChangePriority,
  canCreateTask,
  canEditTask,
  canMoveTask,
  canSeeArea,
} from '../lib/permissions';
import { AREAS as todasLasAreas } from '../lib/areas';

export default function AreaBoard() {
  const { slug } = useParams();
  const { profile } = useAuth();
  const area = todasLasAreas.find((a) => a.slug === slug);

  const [board, setBoard] = useState(null);
  const [team, setTeam] = useState([]);
  const [personas, setPersonas] = useState({});
  const [aviso, setAviso] = useState(null);
  const [ocupada, setOcupada] = useState(null);
  const [formulario, setFormulario] = useState({ abierto: false, task: null });

  const sensores = useSensors(
    // 6px de margen para que un clic en un botón no se interprete como arrastre
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const cargar = useCallback(async () => {
    if (!area) return;
    const [tablero, equipo, mapa] = await Promise.all([
      tareas.getBoard(area.code),
      tareas.getTeam(area.code),
      tareas.getProfilesById(),
    ]);
    setBoard(tablero);
    setTeam(equipo);
    setPersonas(mapa);
  }, [area]);

  useEffect(() => {
    setBoard(null);
    cargar();
  }, [cargar]);

  useEffect(() => {
    document.title = area ? `${area.shortName} · OrgTask` : 'Área no encontrada · OrgTask';
  }, [area]);

  if (!area) return <AccessDenied motivo="El área que buscas no existe." />;
  if (!canSeeArea(profile, area.code)) {
    return <AccessDenied motivo={`No tienes acceso al tablero de ${area.shortName}.`} />;
  }

  async function mover(task, nuevoEstado) {
    setOcupada(task.id);
    // Actualización inmediata: la tarjeta se mueve antes de confirmar
    const previo = board;
    setBoard((actual) => {
      const sinTarea = Object.fromEntries(
        Object.entries(actual).map(([estado, lista]) => [
          estado,
          lista.filter((t) => t.id !== task.id),
        ])
      );
      sinTarea[nuevoEstado] = [...sinTarea[nuevoEstado], { ...task, status: nuevoEstado }];
      return sinTarea;
    });

    try {
      await tareas.moveTask({ taskId: task.id, newStatus: nuevoEstado, actor: profile });
      await cargar();
    } catch (error) {
      setBoard(previo); // se devuelve la tarjeta a su columna
      setAviso({ tone: 'alert', message: error.message });
    } finally {
      setOcupada(null);
    }
  }

  async function accion(fn, exito) {
    try {
      await fn();
      await cargar();
      if (exito) setAviso({ tone: 'ok', message: exito });
    } catch (error) {
      setAviso({ tone: 'alert', message: error.message });
    } finally {
      setOcupada(null);
    }
  }

  const permisosDe = (task) => ({
    permisos: {
      puedeMover: canMoveTask(profile, task),
      puedeCambiarPrioridad: canChangePriority(profile, task),
      puedeEditar: canEditTask(profile, task),
      puedeArchivar: canArchiveTask(profile, task),
    },
    responsable: personas[task.assigneeId],
    busy: ocupada === task.id,
    onMove: mover,
    onPriority: (t, direccion) => {
      setOcupada(t.id);
      accion(() => tareas.setTaskPriority({ taskId: t.id, direction: direccion, actor: profile }));
    },
    onEdit: (t) => setFormulario({ abierto: true, task: t }),
    onArchive: (t) => {
      setOcupada(t.id);
      accion(
        () => tareas.archiveTask({ taskId: t.id, actor: profile }),
        `"${t.title}" pasó al histórico.`
      );
    },
  });

  return (
    <>
      <PageHeader
        eyebrow={`Tablero · ${area.name}`}
        title={area.shortName}
        description={`Arrastra una tarjeta entre columnas para cambiar su estado, o usa las flechas del riel izquierdo para cambiar su prioridad.`}
        actions={
          <>
            <Badge tone={AREA_TONES[area.code].badge}>{area.shortName}</Badge>
            {canCreateTask(profile, area.code) && (
              <Button icon={Plus} onClick={() => setFormulario({ abierto: true, task: null })}>
                Crear tarea
              </Button>
            )}
          </>
        }
      />

      <div className="px-5 py-6 sm:px-8">
        {!board ? (
          <p className="text-base text-slate">Cargando el tablero…</p>
        ) : (
          <DndContext
            sensors={sensores}
            onDragEnd={({ active, over }) => {
              if (!over) return;
              const task = Object.values(board).flat().find((t) => t.id === active.id);
              if (task && over.id !== task.status) mover(task, over.id);
            }}
          >
            <div className="flex gap-4 overflow-x-auto pb-2">
              {STATUSES.map((columna) => (
                <BoardColumn
                  key={columna.value}
                  status={columna.value}
                  label={columna.label}
                  tasks={board[columna.value]}
                  cardProps={permisosDe}
                />
              ))}
            </div>
          </DndContext>
        )}
      </div>

      <TaskFormModal
        open={formulario.abierto}
        task={formulario.task}
        team={team}
        onClose={() => setFormulario({ abierto: false, task: null })}
        onSubmit={async (values) => {
          if (formulario.task) {
            await tareas.updateTask({ taskId: formulario.task.id, values, actor: profile });
          } else {
            await tareas.createTask({ areaCode: area.code, values, actor: profile });
          }
          await cargar();
        }}
      />

      <Toast
        message={aviso?.message}
        tone={aviso?.tone}
        onClose={() => setAviso(null)}
      />
    </>
  );
}
