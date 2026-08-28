import { useEffect, useState } from 'react';
import PageHeader from '../components/layout/PageHeader';
import Badge from '../components/Badge';
import AccessDenied from './AccessDenied';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services';
import { canManageUsers, ROLE_LABELS } from '../lib/permissions';
import { AREA_TONES } from '../lib/taskFormat';

/**
 * Administración de usuarios. Por ahora solo lista al equipo: invitar y
 * desactivar necesitan la Edge Function de Supabase, que llega en la tarea 13.
 */
export default function Users() {
  const { profile } = useAuth();
  const [personas, setPersonas] = useState([]);

  useEffect(() => {
    document.title = 'Usuarios · OrgTask';
    authService.listProfiles().then(setPersonas);
  }, []);

  if (!canManageUsers(profile)) {
    return <AccessDenied motivo="Solo quien administra usuarios entra a esta sección." />;
  }

  return (
    <>
      <PageHeader
        eyebrow="Administración"
        title="Usuarios"
        description="El equipo de la DEE con su rol y su área."
      />

      <div className="px-5 py-6 sm:px-8">
        <div className="overflow-x-auto rounded border border-line bg-surface shadow-card">
          <table className="w-full min-w-[560px] border-collapse text-left">
            <caption className="sr-only">Personas con acceso a la plataforma</caption>
            <thead>
              <tr className="border-b border-line">
                {['Nombre', 'Correo', 'Rol', 'Área'].map((columna) => (
                  <th key={columna} scope="col" className="px-4 py-2.5 text-sm font-medium text-slate">
                    {columna}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {personas.map((persona) => (
                <tr key={persona.id}>
                  <th scope="row" className="px-4 py-3 text-base font-medium text-ink">
                    {persona.fullName}
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 max-w-2xl text-sm text-slate">
          Invitar por correo, cambiar el rol y desactivar cuentas requieren la conexión con
          Supabase. Quedan habilitados en cuanto tengamos las credenciales del proyecto.
        </p>
      </div>
    </>
  );
}
