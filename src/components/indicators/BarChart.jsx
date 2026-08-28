/**
 * Gráfico de barras dibujado a mano con SVG, sin librerías. Además de las
 * barras entrega una tabla equivalente oculta, para que un lector de pantalla
 * pueda leer los mismos datos.
 */
export default function BarChart({ title, caption, data, unidad = 'tareas' }) {
  const maximo = Math.max(1, ...data.map((d) => d.total));
  const alto = 160;
  const anchoBarra = 100 / Math.max(data.length, 1);

  return (
    <figure className="rounded border border-line bg-surface p-4 shadow-card">
      <figcaption>
        <h3 className="text-base font-semibold text-ink">{title}</h3>
        {caption && <p className="mt-0.5 text-sm text-slate">{caption}</p>}
      </figcaption>

      {/* Decorativo: los datos se leen en la tabla equivalente de más abajo */}
      <svg
        aria-hidden="true"
        viewBox={`0 0 100 ${alto}`}
        preserveAspectRatio="none"
        className="mt-4 h-40 w-full"
      >
        {data.map((dato, indice) => {
          const altura = (dato.total / maximo) * (alto - 24);
          return (
            <rect
              key={dato.label}
              x={indice * anchoBarra + anchoBarra * 0.2}
              y={alto - altura}
              width={anchoBarra * 0.6}
              height={altura}
              className="fill-signal"
            />
          );
        })}
      </svg>

      <ul className="mt-2 flex">
        {data.map((dato) => (
          <li
            key={dato.label}
            className="min-w-0 flex-1 text-center"
            style={{ flexBasis: `${anchoBarra}%` }}
          >
            <span className="block font-mono text-sm font-medium text-ink">{dato.total}</span>
            <span className="block truncate text-sm text-slate" title={dato.label}>
              {dato.label}
            </span>
          </li>
        ))}
      </ul>

      <table className="sr-only">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th scope="col">Periodo</th>
            <th scope="col">{unidad}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((dato) => (
            <tr key={dato.label}>
              <th scope="row">{dato.label}</th>
              <td>{dato.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
