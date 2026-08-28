/**
 * Estado vacio. El texto siempre explica que falta y que puede hacer la persona,
 * nunca dice solo "Sin datos".
 */
export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-start gap-2 rounded border border-dashed border-line-strong bg-surface-muted px-4 py-6">
      {Icon && <Icon aria-hidden="true" className="h-5 w-5 text-slate" />}
      <p className="font-display text-base font-semibold text-ink">{title}</p>
      {description && <p className="text-sm text-slate">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
