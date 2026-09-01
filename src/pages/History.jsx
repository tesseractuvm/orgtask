import { useCallback, useEffect, useMemo, useState } from 'react';
import { Archive, RotateCcw } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import Select from '../components/Select';
import Input from '../components/Input';
import Button from '../components/Button';
import Badge from '../components/Badge';
import PersonAvatar from '../components/PersonAvatar';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import EmptyState from '../components/EmptyState';
import TaskTimeline from '../components/history/TaskTimeline';
import { useAuth } from '../context/AuthContext';
import { tasksService as tareas } from '../services';
import { canRestoreTask, visibleAreas } from '../lib/permissions';
import { AREA_TONES, longDate, monthLabel } from '../lib/taskFormat';
import { AREAS as todasLasAreas } from '../lib/areas';

/**
 * Repositorio histórico. Vive fuera del tablero, ordenado del archivado más
 * reciente al más antiguo y agrupado por mes.
 */
export default function History() {
  const { profile } = useAuth();
  const [filtros, setFiltros] = useState({
    areaCode: 'todas',
    assigneeId: 'todos',
    desde: '',
    hasta: '',
  });
  const [lista, setLista] = useState(null);
  const [personas, setPersonas] = useState({});
  const [detalle, setDetalle] = useState(null);
  const [cronologia, setCronologia] = useState([]);
  const [aviso, setAviso] = useState(null);

  const misAreas = visibleAreas(profile, todasLasAreas);

  const cargar = useCallback(async () => {
    const [archivadas, mapa] = await Promise.all([
      tareas.getHistory({ actor: profile, ...filtros }),
      tareas.getProfilesById(),
    ]);
    setLista(archivadas);
    setPersonas(mapa);
  }, [profile, filtros]);

  useEffect(() => {
    document.title = 'Histórico · OrgTask';
    cargar();
  }, [cargar]);

  const porMes = useMemo(() => {
    if (!lista) return [];
    const grupos = new Map();
    for (const task of lista) {
      const clave = monthLabel(task.archivedAt);
      if (!grupos.has(clave)) grupos.set(clave, []);
      grupos.get(clave).push(task);
    }
    return [...grupos.entries()];
  }, [lista]);

  async function abrir(task) {
    setDetalle(task);
    setCronologia(await tareas.getTaskTimeline(task.id));
  }

  async function restaurar(task) {
    try {
      await tareas.restoreTask({ taskId: task.id, actor: profile });
      setDetalle(null);
      await cargar();
      setAviso({ tone: 'ok', message: `"${task.title}" volvió al tablero.` });
    } catch (error) {
      setAviso({ tone: 'alert', message: error.message });
    }
  }

  const cambiar = (campo) => (e) => setFiltros((p) => ({ ...p, [campo]: e.target.value }));

  return (
    <>
      <PageHeader
        eyebrow="Seguimiento"
        title="Histórico"
        description="El trabajo ya ejecutado y archivado, con la cronología completa de cada tarea."
      />

      <div className="px-5 py-6 sm:px-8">
        <div className="grid gap-4 rounded border border-line bg-surface p-4 shadow-card sm:grid-cols-2 lg:grid-cols-4">
          <Select
            label="Área"
            value={filtros.areaCode}
            onChange={cambiar('areaCode')}
            options={[
              { value: 'todas', label: misAreas.length > 1 ? 'Todas las áreas' : 'Mi área' },
              ...misAreas.map((a) => ({ value: a.code, label: a.shortName })),
            ]}
          />
          <Select
            label="Responsable"
            value={filtros.assigneeId}
            onChange={cambiar('assigneeId')}
            options={[
              { value: 'todos', label: 'Cualquier responsable' },
              ...Object.values(personas)
                .filter((p) => misAreas.some((a) => a.code === p.areaCode))
                .map((p) => ({ value: p.id, label: p.fullName })),
            ]}
          />
          <Input label="Archivadas desde" type="date" value={filtros.desde} onChange={cambiar('desde')} />
          <Input label="Archivadas hasta" type="date" value={filtros.hasta} onChange={cambiar('hasta')} />
        </div>

        <div className="mt-6">
          {!lista ? (
            <p className="text-base text-slate">Cargando el histórico…</p>
          ) : lista.length === 0 ? (
            <EmptyState
              icon={Archive}
              title="Sin tareas archivadas"
              description="Cuando una tarea llegue a Hecho y se archive, aparecerá aquí con su recorrido completo."
            />
          ) : (
            <div className="flex flex-col gap-8">
              {porMes.map(([mes, items]) => (
                <section key={mes} aria-labelledby={`mes-${mes}`}>
                  <h2 id={`mes-${mes}`} className="text-lg first-letter:uppercase">
                    {mes}
                  </h2>
                  <ul className="mt-3 divide-y divide-line overflow-hidden rounded border border-line bg-surface">
                    {items.map((task) => (
                      <li key={task.id}>
                        <button
                          type="button"
                          onClick={() => abrir(task)}
                          className="flex w-full flex-wrap items-baseline gap-x-3 gap-y-1 px-4 py-3 text-left transition-colors duration-150 hover:bg-paper"
                        >
                          <span className="min-w-0 flex-1 text-base text-ink">{task.title}</span>
                          <Badge tone={AREA_TONES[task.areaCode].badge}>{task.areaCode}</Badge>
                          <span className="inline-flex items-center gap-2 self-center text-sm text-slate">
                            <PersonAvatar profile={personas[task.assigneeId]} />
                            {personas[task.assigneeId]?.fullName ?? 'Sin responsable'}
                          </span>
                          <span className="font-mono text-sm text-slate">
                            {longDate(task.archivedAt.slice(0, 10))}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal
        open={Boolean(detalle)}
        onClose={() => setDetalle(null)}
        title={detalle?.title ?? ''}
        description="Recorrido completo de la tarea, desde que se creó hasta que se archivó."
        footer={
          canRestoreTask(profile) && (
            <Button variant="secondary" icon={RotateCcw} onClick={() => restaurar(detalle)}>
              Devolver al tablero
            </Button>
          )
        }
      >
        {detalle && (
          <>
            {detalle.description && (
              <p className="mb-4 text-base text-slate-dark">{detalle.description}</p>
            )}
            <TaskTimeline events={cronologia} />
          </>
        )}
      </Modal>

      <Toast message={aviso?.message} tone={aviso?.tone} onClose={() => setAviso(null)} />
    </>
  );
}
