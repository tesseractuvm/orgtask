import { useEffect, useState } from 'react';
import PageHeader from '../components/layout/PageHeader';
import BarChart from '../components/indicators/BarChart';
import Badge from '../components/Badge';
import { useAuth } from '../context/AuthContext';
import * as tareas from '../services/tasksService';
import { AREA_TONES, priorityLabel, statusLabel } from '../lib/taskFormat';

const MESES_CORTOS = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
];

function Cifra({ valor, etiqueta, tono = 'text-ink' }) {
  return (
    <div className="rounded border border-line bg-surface p-4 shadow-card">
      <p className={`font-display text-2xl font-bold ${tono}`}>{valor}</p>
      <p className="mt-1 text-sm text-slate">{etiqueta}</p>
    </div>
  );
}

export default function Indicators() {
  const { profile } = useAuth();
  const [datos, setDatos] = useState(null);

  useEffect(() => {
    document.title = 'Indicadores · OrgTask';
    tareas.getIndicators({ actor: profile }).then(setDatos);
  }, [profile]);

  if (!datos) {
    return (
      <>
        <PageHeader eyebrow="Seguimiento" title="Indicadores" />
        <p className="px-5 py-6 text-base text-slate sm:px-8">Calculando…</p>
      </>
    );
  }

  const porMes = datos.completadasPorMes.map((m) => {
    const [anio, mes] = m.clave.split('-');
    return { label: `${MESES_CORTOS[Number(mes) - 1]} ${anio.slice(2)}`, total: m.total };
  });

  const maximaCarga = Math.max(1, ...datos.cargaPorPersona.map((p) => p.abiertas));

  return (
    <>
      <PageHeader
        eyebrow="Seguimiento"
        title="Indicadores"
        description="El estado actual del trabajo y cómo viene evolucionando mes a mes."
      />

      <div className="flex flex-col gap-8 px-5 py-6 sm:px-8">
        <section aria-labelledby="ahora">
          <h2 id="ahora" className="text-lg">
            Ahora mismo
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Cifra valor={datos.abiertasTotal} etiqueta="Tareas abiertas" />
            <Cifra
              valor={datos.vencidas}
              etiqueta="Pasadas de fecha"
              tono={datos.vencidas > 0 ? 'text-alert' : 'text-ink'}
            />
            <Cifra valor={datos.porVencer} etiqueta="Vencen esta semana" />
            <Cifra valor={datos.archivadasTotal} etiqueta="Archivadas en total" />
          </div>
        </section>

        <section aria-labelledby="evolucion">
          <h2 id="evolucion" className="text-lg">
            Evolución
          </h2>
          <div className="mt-3 grid gap-4 lg:grid-cols-2">
            <BarChart
              title="Tareas cerradas por mes"
              caption="Cada vez que una tarea entró a la columna Hecho."
              data={porMes}
            />
            <div className="flex flex-col justify-center rounded border border-line bg-surface p-6 shadow-card">
              <p className="font-display text-3xl font-bold text-ink">
                {datos.cicloPromedio ?? '—'}
              </p>
              <p className="mt-1 text-base font-medium text-ink">días en promedio</p>
              <p className="mt-2 text-sm text-slate">
                Es lo que demora una tarea desde que se crea hasta que llega a Hecho.
                {datos.tareasCerradas > 0 &&
                  ` Calculado sobre ${datos.tareasCerradas} tareas ya cerradas.`}
              </p>
            </div>
          </div>
        </section>

        <section aria-labelledby="por-area">
          <h2 id="por-area" className="text-lg">
            Por área y columna
          </h2>
          <div className="mt-3 overflow-x-auto rounded border border-line bg-surface shadow-card">
            <table className="w-full min-w-[480px] border-collapse text-left">
              <caption className="sr-only">Tareas abiertas por área y por columna</caption>
              <thead>
                <tr className="border-b border-line">
                  <th scope="col" className="px-4 py-2.5 text-sm font-medium text-slate">Área</th>
                  {['por_hacer', 'en_proceso', 'hecho'].map((estado) => (
                    <th key={estado} scope="col" className="px-4 py-2.5 text-sm font-medium text-slate">
                      {statusLabel(estado)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {datos.porColumna.map((fila) => (
                  <tr key={fila.areaCode}>
                    <th scope="row" className="px-4 py-3">
                      <Badge tone={AREA_TONES[fila.areaCode].badge}>{fila.shortName}</Badge>
                    </th>
                    <td className="px-4 py-3 font-mono text-base text-ink">{fila.por_hacer}</td>
                    <td className="px-4 py-3 font-mono text-base text-ink">{fila.en_proceso}</td>
                    <td className="px-4 py-3 font-mono text-base text-ink">{fila.hecho}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-2">
          <section aria-labelledby="prioridad">
            <h2 id="prioridad" className="text-lg">
              Reparto de prioridad
            </h2>
            <BarChart
              title="Tareas abiertas por prioridad"
              caption="Si casi todo es Alta, la prioridad deja de ordenar el trabajo."
              data={datos.porPrioridad.map((p) => ({
                label: priorityLabel(p.priority),
                total: p.total,
              }))}
            />
          </section>

          <section aria-labelledby="carga">
            <h2 id="carga" className="text-lg">
              Carga por responsable
            </h2>
            <ul className="mt-3 flex flex-col gap-2 rounded border border-line bg-surface p-4 shadow-card">
              {datos.cargaPorPersona.map((persona) => (
                <li key={persona.id} className="flex items-center gap-3">
                  <span className="w-36 shrink-0 truncate text-sm text-slate-dark">
                    {persona.fullName}
                  </span>
                  <span className="flex h-4 min-w-0 flex-1 items-center">
                    <span
                      aria-hidden="true"
                      className={`h-2 rounded-sm ${AREA_TONES[persona.areaCode].solid}`}
                      style={{ width: `${(persona.abiertas / maximaCarga) * 100}%` }}
                    />
                  </span>
                  <span className="w-6 shrink-0 text-right font-mono text-sm text-ink">
                    {persona.abiertas}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}
