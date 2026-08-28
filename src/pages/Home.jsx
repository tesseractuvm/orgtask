import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import { useAuth } from '../context/AuthContext';
import * as tareas from '../services/tasksService';
import { visibleAreas } from '../lib/permissions';
import { AREA_TONES, dueState } from '../lib/taskFormat';

/** Inicio: el estado de las áreas que la persona puede ver, sin adornos. */
export default function Home() {
  const { profile } = useAuth();
  const [resumen, setResumen] = useState(null);
  const [vencidas, setVencidas] = useState([]);

  useEffect(() => {
    document.title = 'Inicio · OrgTask';
    Promise.all([tareas.getAreaSummary(), tareas.getProfilesById()]).then(([datos, personas]) => {
      const permitidas = visibleAreas(profile, datos);
      setResumen(permitidas);

      Promise.all(permitidas.map((a) => tareas.getBoard(a.code))).then((tableros) => {
        const atrasadas = tableros
          .flatMap((t) => [...t.por_hacer, ...t.en_proceso])
          .filter((t) => dueState(t) === 'vencida')
          .map((t) => ({ ...t, responsable: personas[t.assigneeId]?.fullName }));
        setVencidas(atrasadas);
      });
    });
  }, [profile]);

  const soloUnArea = resumen?.length === 1;

  return (
    <>
      <PageHeader
        eyebrow={`Hola, ${profile?.fullName?.split(' ')[0]}`}
        title={soloUnArea ? 'Tu área hoy' : 'Las tres áreas hoy'}
        description={
          soloUnArea
            ? 'El estado de tu tablero y lo que está atrasado.'
            : 'Cuántas tareas hay en cada columna y qué está atrasado en cada área.'
        }
      />

      <div className="flex flex-col gap-8 px-5 py-6 sm:px-8">
        {!resumen ? (
          <p className="text-base text-slate">Cargando…</p>
        ) : (
          <section aria-labelledby="areas">
            <h2 id="areas" className="sr-only">
              Estado por área
            </h2>
            <ul className="flex flex-col gap-3">
              {resumen.map((area) => (
                <li key={area.code}>
                  <Link
                    to={`/area/${area.slug}`}
                    className="flex items-stretch overflow-hidden rounded border border-line bg-surface shadow-card transition-colors duration-150 hover:border-slate-light"
                  >
                    <span
                      aria-hidden="true"
                      className={`w-1.5 shrink-0 ${AREA_TONES[area.code].solid}`}
                    />
                    <span className="min-w-0 flex-1 px-4 py-4">
                      <span className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="font-display text-lg font-semibold text-ink">
                          {area.shortName}
                        </span>
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-signal">
                          Ver tablero
                          <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
                        </span>
                      </span>
                      <span className="mt-0.5 block text-sm text-slate">{area.name}</span>

                      <span className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {[
                          { etiqueta: 'Por hacer', valor: area.porHacer },
                          { etiqueta: 'En proceso', valor: area.enProceso },
                          { etiqueta: 'Hecho', valor: area.hecho },
                          { etiqueta: 'Archivadas', valor: area.archivadas },
                        ].map((dato) => (
                          <span key={dato.etiqueta} className="block">
                            <span className="block font-display text-lg font-bold text-ink">
                              {dato.valor}
                            </span>
                            <span className="block text-sm text-slate">{dato.etiqueta}</span>
                          </span>
                        ))}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section aria-labelledby="atrasadas">
          <h2 id="atrasadas" className="text-lg">
            Atrasadas
          </h2>
          {vencidas.length === 0 ? (
            <p className="mt-2 text-base text-slate">
              Nada pasado de fecha. Todo el trabajo abierto está dentro de plazo.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-line overflow-hidden rounded border border-line bg-surface">
              {vencidas.map((task) => (
                <li key={task.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 py-3">
                  <span className="min-w-0 flex-1 text-base text-ink">{task.title}</span>
                  <span className="text-sm text-slate">{task.responsable ?? 'Sin responsable'}</span>
                  <span className="font-mono text-sm font-medium text-alert">
                    {task.areaCode}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
