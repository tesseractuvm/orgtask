/** Encabezado común de cada vista: título, bajada y acciones a la derecha. */
export default function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <header className="border-b border-line bg-surface px-4 py-6 sm:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && (
            <p className="font-mono text-sm uppercase tracking-widest text-slate">{eyebrow}</p>
          )}
          <h1 className="mt-1 text-xl sm:text-2xl">{title}</h1>
          {description && <p className="mt-2 max-w-2xl text-base text-slate">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
      </div>
    </header>
  );
}
