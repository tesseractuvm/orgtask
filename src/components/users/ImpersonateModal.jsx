import { useState } from 'react';
import { LogIn, TriangleAlert } from 'lucide-react';
import Modal from '../Modal';
import Button from '../Button';
import Badge from '../Badge';
import { ROLE_LABELS } from '../../lib/permissions';

/**
 * Confirmación antes de entrar como otra persona. Pide un paso explícito porque
 * la consecuencia no es obvia: la sesión propia se cierra y todo lo que se haga
 * a continuación queda registrado a nombre de esa persona.
 */
export default function ImpersonateModal({ open, persona, onClose, onConfirm }) {
  const [entrando, setEntrando] = useState(false);
  const [error, setError] = useState(null);

  if (!persona) return null;

  async function confirmar() {
    setEntrando(true);
    setError(null);
    try {
      await onConfirm();
    } catch (e) {
      setError(e.message);
      setEntrando(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Probar como ${persona.fullName}`}
      description="Vas a usar la aplicación con los permisos de esta persona, tal como los ve ella."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={entrando}>
            Cancelar
          </Button>
          <Button icon={LogIn} onClick={confirmar} loading={entrando}>
            Entrar como {persona.fullName.split(' ')[0]}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <dl className="divide-y divide-line overflow-hidden rounded border border-line">
          <div className="flex items-baseline justify-between gap-4 px-4 py-2.5">
            <dt className="text-sm text-slate">Rol</dt>
            <dd className="text-base text-ink">
              {ROLE_LABELS[persona.role]}
              {persona.isAdmin && ' + administra usuarios'}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 px-4 py-2.5">
            <dt className="text-sm text-slate">Área</dt>
            <dd>
              {persona.areaCode ? (
                <Badge tone="neutral">{persona.areaCode}</Badge>
              ) : (
                <span className="text-base text-ink">Las tres</span>
              )}
            </dd>
          </div>
        </dl>

        <div className="flex gap-3 rounded border border-line-strong bg-surface-muted px-4 py-3">
          <TriangleAlert aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-slate-dark" />
          <div className="text-sm text-slate-dark">
            <p className="font-medium text-ink">Dos cosas antes de seguir</p>
            <p className="mt-1">
              Tu sesión de administración se cierra: para volver a tu cuenta tendrás que
              iniciar sesión otra vez con tu contraseña.
            </p>
            <p className="mt-1">
              Todo lo que hagas mientras pruebas queda registrado en el histórico a nombre de{' '}
              {persona.fullName}, no al tuyo.
            </p>
          </div>
        </div>

        {error && (
          <p
            role="alert"
            className="rounded border border-alert bg-alert-light px-3 py-2 text-sm font-medium text-alert"
          >
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}
