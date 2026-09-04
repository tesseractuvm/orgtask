import Badge from '../Badge';
import PersonAvatar from '../PersonAvatar';
import UserRowActions from './UserRowActions';
import { ROLE_LABELS } from '../../lib/permissions';
import { colorLabel } from '../../lib/people';
import { AREA_TONES } from '../../lib/taskFormat';

/** La lista completa en tabla, para pantallas anchas donde caben las seis columnas. */
export default function UserTable({ personas, miId, ocupada, ...acciones }) {
  return (
    <div className="rounded border border-line bg-surface shadow-card">
      <table className="w-full border-collapse text-left">
        <caption className="sr-only">Personas con acceso a la plataforma</caption>
        <thead>
          <tr className="border-b border-line">
            {['Nombre', 'Correo', 'Rol', 'Área', 'Color', ''].map((columna) => (
              <th
                key={columna}
                scope="col"
                className="px-4 py-2.5 text-sm font-medium text-slate"
              >
                {columna}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {personas.map((persona) => (
            <tr
              key={persona.id}
              className={persona.isActive === false ? 'opacity-60' : undefined}
            >
              <th scope="row" className="px-4 py-3 text-base font-medium text-ink">
                <span className="flex items-center gap-2.5">
                  <PersonAvatar profile={persona} />
                  {persona.fullName}
                  {persona.isActive === false && <Badge tone="alert">Desactivada</Badge>}
                </span>
              </th>
              <td className="px-4 py-3 font-mono text-sm text-slate">{persona.email}</td>
              <td className="px-4 py-3 text-sm text-slate-dark">
                {ROLE_LABELS[persona.role]}
                {persona.isAdmin && ' + admin'}
              </td>
              <td className="px-4 py-3">
                {persona.areaCode ? (
                  <Badge tone={AREA_TONES[persona.areaCode].badge}>{persona.areaCode}</Badge>
                ) : (
                  <span className="text-sm text-slate">Las tres</span>
                )}
              </td>
              <td className="px-4 py-3 text-sm text-slate-dark">
                {colorLabel(persona.colorToken)}
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end">
                  <UserRowActions
                    persona={persona}
                    esYo={persona.id === miId}
                    ocupada={ocupada === persona.id}
                    {...acciones}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
