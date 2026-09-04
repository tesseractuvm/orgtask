import { KeyRound, LogIn, UserX, UserCheck } from 'lucide-react';

/**
 * Las tres acciones de una persona. Viven en un componente propio porque las
 * usan las dos presentaciones de la lista, la tabla de escritorio y las
 * tarjetas de móvil, y así la lógica de qué se muestra a quién existe una vez.
 */
export default function UserRowActions({ persona, esYo, ocupada, onClave, onPrueba, onActivar }) {
  const desactivada = persona.isActive === false;
  const boton =
    'rounded p-2 text-slate transition-colors duration-150 enabled:hover:bg-paper enabled:hover:text-ink disabled:text-slate-light';

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => onClave(persona)}
        aria-label={`Asignar contraseña a ${persona.fullName}`}
        title="Asignar contraseña"
        className={boton}
      >
        <KeyRound aria-hidden="true" className="h-4 w-4" />
      </button>

      {!esYo && !desactivada && (
        <button
          type="button"
          onClick={() => onPrueba(persona)}
          aria-label={`Probar el sistema como ${persona.fullName}`}
          title="Probar como esta persona"
          className={boton}
        >
          <LogIn aria-hidden="true" className="h-4 w-4" />
        </button>
      )}

      {!esYo && (
        <button
          type="button"
          onClick={() => onActivar(persona)}
          disabled={ocupada}
          aria-label={
            desactivada ? `Reactivar a ${persona.fullName}` : `Desactivar a ${persona.fullName}`
          }
          title={desactivada ? 'Reactivar cuenta' : 'Desactivar cuenta'}
          className={boton}
        >
          {desactivada ? (
            <UserCheck aria-hidden="true" className="h-4 w-4" />
          ) : (
            <UserX aria-hidden="true" className="h-4 w-4" />
          )}
        </button>
      )}
    </div>
  );
}
