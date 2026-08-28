import { useEffect, useRef } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Mantiene el foco del teclado dentro de un contenedor mientras esta abierto,
 * y lo devuelve al elemento que lo abrio al cerrarse. Necesario para que un
 * dialogo sea usable sin mouse.
 *
 * `onEscape` se guarda en una referencia a proposito: si dependiera del efecto,
 * cada render volveria a montar la trampa y el foco saltaria fuera del dialogo.
 */
export default function useFocusTrap(containerRef, isActive, onEscape) {
  const onEscapeRef = useRef(onEscape);

  useEffect(() => {
    onEscapeRef.current = onEscape;
  }, [onEscape]);

  useEffect(() => {
    if (!isActive) return undefined;

    const previouslyFocused = document.activeElement;
    const container = containerRef.current;
    const firstFocusable = container?.querySelector(FOCUSABLE);
    (firstFocusable || container)?.focus();

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onEscapeRef.current?.();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusables = Array.from(container?.querySelectorAll(FOCUSABLE) || []);
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [containerRef, isActive]);
}
