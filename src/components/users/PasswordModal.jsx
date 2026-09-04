import { useEffect, useState } from 'react';
import { Copy, RefreshCw } from 'lucide-react';
import Modal from '../Modal';
import Button from '../Button';
import Input from '../Input';
import { generarClave, LARGO_MINIMO_CLAVE } from '../../lib/password';

/**
 * Asigna una contraseña nueva a una persona. Una vez guardada no se puede volver
 * a consultar, así que la pantalla se queda mostrándola para copiarla antes de
 * cerrar.
 */
export default function PasswordModal({ open, persona, onClose, onSubmit }) {
  const [clave, setClave] = useState('');
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [lista, setLista] = useState(false);
  const [copiada, setCopiada] = useState(false);

  useEffect(() => {
    if (!open) return;
    setClave(generarClave());
    setError(null);
    setLista(false);
    setCopiada(false);
  }, [open, persona]);

  async function enviar(evento) {
    evento.preventDefault();
    if (clave.length < LARGO_MINIMO_CLAVE) {
      setError(`Debe tener al menos ${LARGO_MINIMO_CLAVE} caracteres.`);
      return;
    }

    setGuardando(true);
    setError(null);
    try {
      await onSubmit(clave);
      setLista(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(clave);
      setCopiada(true);
      setTimeout(() => setCopiada(false), 2000);
    } catch {
      // Sin permiso de portapapeles: el valor sigue seleccionable a mano
    }
  }

  if (!persona) return null;

  if (lista) {
    return (
      <Modal
        open={open}
        onClose={onClose}
        title="Contraseña asignada"
        description={`Comunícasela a ${persona.fullName} fuera de la aplicación. Es la única vez que se muestra.`}
        footer={<Button onClick={onClose}>Entendido, cerrar</Button>}
      >
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-sm font-medium text-slate-dark">Correo</p>
            <code className="mt-1 block select-all rounded border border-line-strong bg-paper px-3 py-2 font-mono text-base text-ink">
              {persona.email}
            </code>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-dark">Contraseña nueva</p>
            <div className="mt-1 flex items-center gap-2">
              <code className="flex-1 select-all rounded border border-line-strong bg-paper px-3 py-2 font-mono text-base text-ink">
                {clave}
              </code>
              <Button type="button" variant="secondary" icon={Copy} onClick={copiar}>
                {copiada ? 'Copiada' : 'Copiar'}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Asignar contraseña a ${persona.fullName}`}
      description="Reemplaza la que tenía. La anterior deja de funcionar de inmediato."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={guardando}>
            Cancelar
          </Button>
          <Button type="submit" form="formulario-clave" loading={guardando}>
            Asignar contraseña
          </Button>
        </>
      }
    >
      <form id="formulario-clave" onSubmit={enviar} className="flex flex-col gap-4" noValidate>
        <div className="flex items-end gap-2">
          <Input
            label="Contraseña nueva"
            className="flex-1"
            value={clave}
            onChange={(e) => setClave(e.target.value)}
            error={error}
            hint="Se genera sola. Puedes escribir otra si prefieres."
            autoFocus
          />
          <Button
            type="button"
            variant="secondary"
            icon={RefreshCw}
            onClick={() => setClave(generarClave())}
          >
            Generar otra
          </Button>
        </div>
        <p className="text-sm text-slate">
          La aplicación no guarda esta contraseña en ninguna parte que se pueda consultar
          después, así que cópiala antes de cerrar.
        </p>
      </form>
    </Modal>
  );
}
