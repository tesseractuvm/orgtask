import { Link } from 'react-router-dom';
import { ShieldOff } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';

/** Se muestra cuando alguien escribe a mano una dirección fuera de su alcance. */
export default function AccessDenied({ motivo = 'No tienes acceso a esta sección.' }) {
  return (
    <>
      <PageHeader eyebrow="Acceso restringido" title="Aquí no puedes entrar" description={motivo} />
      <div className="px-4 py-6 sm:px-8">
        <div className="flex max-w-lg flex-col items-start gap-3 rounded border border-line bg-surface p-5 shadow-card">
          <ShieldOff aria-hidden="true" className="h-5 w-5 text-slate" />
          <p className="text-base text-slate-dark">
            Cada persona ve solo el área a la que pertenece. Si necesitas acceso a otra, pídelo
            a quien administra los usuarios.
          </p>
          <Link
            to="/"
            className="mt-1 inline-flex h-10 items-center justify-center rounded border border-line-strong bg-surface px-4 text-sm font-medium text-ink transition-colors duration-150 hover:bg-paper hover:border-slate-light"
          >
            Volver a Inicio
          </Link>
        </div>
      </div>
    </>
  );
}
