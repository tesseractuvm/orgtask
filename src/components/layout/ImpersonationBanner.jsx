import { FlaskConical, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

/**
 * Aviso permanente mientras se está probando como otra persona. Existe para que
 * nadie olvide que la sesión abierta no es la suya y termine registrando trabajo
 * a nombre de otro.
 */
export default function ImpersonationBanner() {
  const { probandoComo, signOut } = useAuth();

  if (!probandoComo) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-line-strong bg-signal-light px-4 py-2 sm:px-8">
      <FlaskConical aria-hidden="true" className="h-4 w-4 shrink-0 text-signal-dark" />
      <p className="min-w-0 flex-1 text-sm text-signal-dark">
        Estás probando como <strong>{probandoComo.targetName}</strong>. Lo que hagas queda a su
        nombre.
      </p>
      <button
        type="button"
        onClick={signOut}
        className="inline-flex shrink-0 items-center gap-1.5 rounded border border-signal px-2.5 py-1 text-sm font-medium text-signal-dark transition-colors duration-150 hover:bg-surface"
      >
        <LogOut aria-hidden="true" className="h-3.5 w-3.5" />
        Salir de la prueba
      </button>
    </div>
  );
}
