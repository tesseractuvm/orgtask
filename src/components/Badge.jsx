const TONES = {
  neutral: 'bg-paper text-slate-dark border-line-strong',
  ink: 'bg-ink text-white border-ink',
  signal: 'bg-signal-light text-signal-dark border-signal-light',
  alert: 'bg-alert-light text-alert border-alert-light',
  ok: 'bg-ok-light text-ok border-ok-light',
  cpyg: 'bg-area-cpyg-soft text-area-cpyg-text border-area-cpyg-soft',
  ryve: 'bg-area-ryve-soft text-area-ryve-text border-area-ryve-soft',
  deportes: 'bg-area-deportes-soft text-area-deportes-text border-area-deportes-soft',
};

/**
 * Etiqueta corta de estado o clasificacion. No lleva iconos ni emojis.
 */
export default function Badge({ children, tone = 'neutral', className = '' }) {
  return (
    <span
      className={`inline-flex items-center rounded-sm border px-2 py-0.5 text-sm font-medium leading-5 ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
