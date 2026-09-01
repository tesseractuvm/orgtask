import { useEffect, useState } from 'react';
import { UserPlus, UserX, UserCheck } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Toast from '../components/Toast';
import PersonAvatar from '../components/PersonAvatar';
import UserFormModal from '../components/users/UserFormModal';
import AccessDenied from './AccessDenied';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services';
import { canManageUsers, ROLE_LABELS } from '../lib/permissions';
import { colorLabel } from '../lib/people';
import { AREA_TONES } from '../lib/taskFormat';

/**
 * Administración de usuarios. Nadie se elimina: se desactiva, igual que las
 * tareas se archivan en vez de borrarse. No hay invitación por correo: quien
 * administra usuarios crea la cuenta con una contraseña temporal y se la
 * comunica a la persona por fuera de la aplicación.
 */
export default function Users() {
  const { profile } = useAuth();
  const [personas, setPersonas] = useState([]);
  const [formulario, setFormulario] = useState(false);
  const [aviso, setAviso] = useState(null);
  const [ocupada, setOcupada] = useState(null);

  async function cargar() {
    setPersonas(await authService.listProfiles());
  }

  useEffect(() => {
    document.title = 'Usuarios · OrgTask';
    cargar();
  }, []);

  if (!canManageUsers(profile)) {
    return <AccessDenied motivo="Solo quien administra usuarios entra a esta sección." />;
  }

  async function alternarActiva(persona) {
    setOcupada(persona.id);
    try {
      await authService.setProfileActive({
        profileId: persona.id,
        isActive: !persona.isActive,
        actor: profile,
      });
      await cargar();
      setAviso({
        tone: 'ok',
        message: persona.isActive
          ? `${persona.fullName} quedó desactivada.`
          : `${persona.fullName} quedó activa de nuevo.`,
      });
    } catch (error) {
      setAviso({ tone: 'alert', message: error.message });
    } finally {
      setOcupada(null);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Administración"
        title="Usuarios"
        description="El equipo de la DEE con su rol, su área y el color que lo identifica."
        actions={
          <Button icon={UserPlus} onClick={() => setFormulario(true)}>
            Agregar persona
          </Button>
        }
      />

      <div className="px-5 py-6 sm:px-8">
        <div className="overflow-x-auto rounded border border-line bg-surface shadow-card">
          <table className="w-full min-w-[680px] border-collapse text-left">
            <caption className="sr-only">Personas con acceso a la plataforma</caption>
            <thead>
              <tr className="border-b border-line">
                {['Nombre', 'Correo', 'Rol', 'Área', 'Color', ''].map((columna) => (
                  <th key={columna} scope="col" className="px-4 py-2.5 text-sm font-medium text-slate">
                    {columna}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {personas.map((persona) => (
                <tr key={persona.id} className={persona.isActive === false ? 'opacity-60' : undefined}>
                  <th scope="row" className="px-4 py-3 text-base font-medium text-ink">
                    <span className="flex items-center gap-2.5">
                      <PersonAvatar profile={persona} />
                      {persona.fullName}
                      {persona.isActive === false && (
                        <Badge tone="alert">Desactivada</Badge>
                      )}
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
                  <td className="px-4 py-3 text-right">
                    {persona.id !== profile.id && (
                      <button
                        type="button"
                        onClick={() => alternarActiva(persona)}
                        disabled={ocupada === persona.id}
                        aria-label={
                          persona.isActive === false
                            ? `Reactivar a ${persona.fullName}`
                            : `Desactivar a ${persona.fullName}`
                        }
                        title={persona.isActive === false ? 'Reactivar cuenta' : 'Desactivar cuenta'}
                        className="rounded p-1.5 text-slate transition-colors duration-150 enabled:hover:bg-paper enabled:hover:text-ink disabled:text-slate-light"
                      >
                        {persona.isActive === false ? (
                          <UserCheck aria-hidden="true" className="h-4 w-4" />
                        ) : (
                          <UserX aria-hidden="true" className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 max-w-2xl text-sm text-slate">
          Nadie se elimina de la plataforma: una cuenta que ya no corresponde se desactiva,
          igual que una tarea se archiva. Vuelve a activarse cuando haga falta.
        </p>
      </div>

      <UserFormModal
        open={formulario}
        onClose={() => setFormulario(false)}
        onSubmit={async (values) => {
          await authService.createProfile({ ...values, actor: profile });
          await cargar();
        }}
      />

      <Toast message={aviso?.message} tone={aviso?.tone} onClose={() => setAviso(null)} />
    </>
  );
}
