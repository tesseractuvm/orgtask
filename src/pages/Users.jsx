import { useEffect, useState } from 'react';
import { UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/layout/PageHeader';
import Button from '../components/Button';
import Toast from '../components/Toast';
import UserFormModal from '../components/users/UserFormModal';
import PasswordModal from '../components/users/PasswordModal';
import ImpersonateModal from '../components/users/ImpersonateModal';
import UserTable from '../components/users/UserTable';
import UserCards from '../components/users/UserCards';
import AccessDenied from './AccessDenied';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services';
import { canManageUsers } from '../lib/permissions';

/**
 * Administración de usuarios. Nadie se elimina: se desactiva, igual que las
 * tareas se archivan en vez de borrarse. No hay invitación por correo: quien
 * administra usuarios crea la cuenta con una contraseña temporal y se la
 * comunica a la persona por fuera de la aplicación.
 *
 * La lista tiene dos presentaciones. En pantallas anchas es una tabla; en
 * teléfonos, tarjetas apiladas. Solo una está visible a la vez, y como la otra
 * se oculta con display:none, tampoco la anuncian los lectores de pantalla.
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
        isActive: persona.isActive === false,
        actor: profile,
      });
      await cargar();
      setAviso({
        tone: 'ok',
        message:
          persona.isActive === false
            ? `${persona.fullName} quedó activa de nuevo.`
            : `${persona.fullName} quedó desactivada.`,
      });
    } catch (error) {
      setAviso({ tone: 'alert', message: error.message });
    } finally {
      setOcupada(null);
    }
  }

  const acciones = {
    onClave: setClaveDe,
    onPrueba: setPruebaCon,
    onActivar: alternarActiva,
  };

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

      <div className="px-4 py-6 sm:px-8">
        <div className="md:hidden">
          <UserCards personas={personas} miId={profile.id} ocupada={ocupada} {...acciones} />
        </div>
        <div className="hidden md:block">
          <UserTable personas={personas} miId={profile.id} ocupada={ocupada} {...acciones} />
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
