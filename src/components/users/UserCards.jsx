import Badge from '../Badge';
import PersonAvatar from '../PersonAvatar';
import UserRowActions from './UserRowActions';
import { ROLE_LABELS } from '../../lib/permissions';
import { colorLabel } from '../../lib/people';
import { AREA_TONES } from '../../lib/taskFormat';

/**
 * La misma información que la tabla, apilada para pantallas angostas. Una tabla
 * de seis columnas en un teléfono obliga a desplazarse de lado para leer una
 * fila completa, así que aquí cada persona es una tarjeta.
 */
export default function UserCards({ personas, miId, ocupada, ...acciones }) {
  return (
    <ul className="flex flex-col gap-3">
      {personas.map((persona) => (
        <li
          key={persona.id}
          className={`rounded border border-line bg-surface p-4 shadow-card ${
            persona.isActive === false ? 'opacity-60' : ''
          }`}
        >
          <div className="flex items-start gap-3">
            <PersonAvatar profile={persona} />
            <div className="min-w-0 flex-1">
              <p className="text-base font-medium text-ink">{persona.fullName}</p>
              <p className="break-all font-mono text-sm text-slate">{persona.email}</p>
            </div>
            {persona.isActive === false && <Badge tone="alert">Desactivada</Badge>}
          </div>

          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-line pt-3">
            <div>
              <dt className="text-sm text-slate">Rol</dt>
              <dd className="text-sm text-slate-dark">
                {ROLE_LABELS[persona.role]}
                {persona.isAdmin && ' + admin'}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-slate">Área</dt>
              <dd className="mt-0.5">
                {persona.areaCode ? (
                  <Badge tone={AREA_TONES[persona.areaCode].badge}>{persona.areaCode}</Badge>
                ) : (
                  <span className="text-sm text-slate-dark">Las tres</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-slate">Color</dt>
              <dd className="text-sm text-slate-dark">{colorLabel(persona.colorToken)}</dd>
            </div>
          </dl>

          <div className="mt-3 flex justify-end border-t border-line pt-2">
            <UserRowActions
              persona={persona}
              esYo={persona.id === miId}
              ocupada={ocupada === persona.id}
              {...acciones}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
