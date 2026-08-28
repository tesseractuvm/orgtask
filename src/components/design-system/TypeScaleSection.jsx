import { typeScale } from '../../data/designTokens';

/** Muestra los 6 pasos de la escala tipográfica y su uso previsto. */
export default function TypeScaleSection() {
  return (
    <section aria-labelledby="tipografia" className="border-t border-line pt-8">
      <h2 id="tipografia" className="text-lg">
        Tipografía
      </h2>
      <p className="mt-1 max-w-2xl text-sm text-slate">
        Bricolage Grotesque para títulos y cifras. IBM Plex Sans para el cuerpo y su
        variante Mono para fechas y números. Seis tamaños: 14, 16, 20, 28, 40 y 64.
      </p>

      <ul className="mt-5 divide-y divide-line border-y border-line">
        {typeScale.map((step) => (
          <li key={step.token} className="flex flex-wrap items-baseline gap-x-6 gap-y-1 py-4">
            <span className="w-24 shrink-0 font-mono text-sm text-slate">
              {step.px} px
            </span>
            <span
              className={`${step.token} ${
                step.font === 'display' ? 'font-display font-semibold' : 'font-sans'
              } min-w-0 flex-1 truncate text-ink`}
            >
              Tablero de CPyG
            </span>
            <span className="text-sm text-slate">{step.use}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
