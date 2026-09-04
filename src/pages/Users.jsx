import { useEffect, useState } from 'react';
import { UserPlus, UserX, UserCheck, KeyRound, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/layout/PageHeader';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Toast from '../components/Toast';
import PersonAvatar from '../components/PersonAvatar';
import UserFormModal from '../components/users/UserFormModal';
import PasswordModal from '../components/users/PasswordModal';
import ImpersonateModal from '../components/users/ImpersonateModal';
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
  const { profile, impersonate } = useAuth();
  const navigate = useNavigate();
  const [personas, setPersonas] = useState([]);
  const [formulario, setFormulario] = useState(false);
  const [claveDe, setClaveDe] = useState(null);
  const [pruebaCon, setPruebaCon] = useState(null);
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
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => setClaveDe(persona)}
                        aria-label={`Asignar contraseña a ${persona.fullName}`}
                        title="Asignar contraseña"
                        className="rounded p-1.5 text-slate transition-colors duration-150 hover:bg-paper hover:text-ink"
                      >
                        <KeyRound aria-hidden="true" className="h-4 w-4" />
                      </button>

                      {persona.id !== profile.id && persona.isActive !== false && (
                        <button
                          type="button"
                          onClick={() => setPruebaCon(persona)}
                          aria-label={`Probar el sistema como ${persona.fullName}`}
                          title="Probar como esta persona"
                          className="rounded p-1.5 text-slate transition-colors duration-150 hover:bg-paper hover:text-ink"
                        >
                          <LogIn aria-hidden="true" className="h-4 w-4" />
                        </button>
                      )}

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
                          title={
                            persona.isActive === false ? 'Reactivar cuenta' : 'Desactivar cuenta'
                          }
                          className="rounded p-1.5 text-slate transition-colors duration-150 enabled:hover:bg-paper enabled:hover:text-ink disabled:text-slate-light"
                        >
                          {persona.isActive === false ? (
                            <UserCheck aria-hidden="true" className="h-4 w-4" />
                          ) : (
                            <UserX aria-hidden="true" className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex max-w-2xl flex-col gap-2 text-sm text-slate">
          <p>
            Nadie se elimina de la plataforma: una cuenta que ya no corresponde se desactiva,
            igual que una tarea se archiva. Vuelve a activarse cuando haga falta.
          </p>
          <p>
            La llave asigna una contraseña nueva, para cuando alguien la olvidó. La flecha entra
            como esa persona para probar el sistema con sus permisos: tu sesión se cierra y
            tendrás que volver a iniciarla después.
          </p>
        </div>
      </div>

      <UserFormModal
        open={formulario}
        onClose={() => setFormulario(false)}
        onSubmit={async (values) => {
          await authService.createProfile({ ...values, actor: profile });
          await cargar();
        }}
      />

      <PasswordModal
        open={Boolean(claveDe)}
        persona={claveDe}
        onClose={() => setClaveDe(null)}
        onSubmit={async (password) => {
          await authService.setProfilePassword({
            profileId: claveDe.id,
            password,
            actor: profile,
          });
        }}
      />

      <ImpersonateModal
        open={Boolean(pruebaCon)}
        persona={pruebaCon}
        onClose={() => setPruebaCon(null)}
        onConfirm={async () => {
          await impersonate(pruebaCon);
          setPruebaCon(null);
          navigate('/');
        }}
      />

      <Toast message={aviso?.message} tone={aviso?.tone} onClose={() => setAviso(null)} />
    </>
  );
}
