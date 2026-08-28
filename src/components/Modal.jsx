import { useRef } from 'react';
import { X } from 'lucide-react';
import useFocusTrap from '../hooks/useFocusTrap';

/**
 * Dialogo modal. Se cierra con Escape, con el boton de cerrar o al hacer clic
 * fuera. El foco queda atrapado dentro mientras esta abierto.
 */
export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}) {
  const panelRef = useRef(null);
  useFocusTrap(panelRef, open, onClose);

  if (!open) return null;

  const widths = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl' };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink-900/50 p-0 sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-titulo"
        aria-describedby={description ? 'modal-descripcion' : undefined}
        tabIndex={-1}
        className={`w-full ${widths[size]} animate-rise rounded-t-lg bg-surface shadow-raised sm:rounded-lg`}
      >
        <header className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
          <div>
            <h2 id="modal-titulo" className="text-lg">
              {title}
            </h2>
            {description && (
              <p id="modal-descripcion" className="mt-1 text-sm text-slate">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="-mr-2 -mt-1 rounded p-2 text-slate transition-colors duration-150 hover:bg-paper hover:text-ink"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </header>
        <div className="px-6 py-5">{children}</div>
        {footer && (
          <footer className="flex flex-wrap justify-end gap-2 border-t border-line bg-surface-muted px-6 py-4">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}
