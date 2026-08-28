import { useEffect } from 'react';
import { CircleAlert, CircleCheck, X } from 'lucide-react';

/**
 * Aviso breve en la esquina. Se usa sobre todo para explicar por qué se rechazó
 * una acción, así la persona entiende la regla en vez de solo ver que no pasó nada.
 */
export default function Toast({ message, tone = 'alert', onClose }) {
  useEffect(() => {
    if (!message) return undefined;
    const id = setTimeout(onClose, 6000);
    return () => clearTimeout(id);
  }, [message, onClose]);

  if (!message) return null;

  const Icon = tone === 'ok' ? CircleCheck : CircleAlert;
  const estilo =
    tone === 'ok' ? 'border-ok bg-ok-light text-ok' : 'border-alert bg-alert-light text-alert';

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-4 left-4 right-4 z-50 flex items-start gap-3 rounded border px-4 py-3 shadow-raised sm:left-auto sm:w-96 ${estilo}`}
    >
      <Icon aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
      <p className="min-w-0 flex-1 text-sm font-medium">{message}</p>
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar aviso"
        className="shrink-0 rounded p-0.5 hover:bg-surface/60"
      >
        <X aria-hidden="true" className="h-4 w-4" />
      </button>
    </div>
  );
}
