import { useEffect, useState } from 'react';
import { Save, RotateCcw } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import Input from '../components/Input';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Toast from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { resetState } from '../services/localStore';
import { usandoSupabase } from '../services';
import { ROLE_LABELS } from '../lib/permissions';
import { AREA_TONES } from '../lib/taskFormat';
import { AREAS as todasLasAreas } from '../lib/areas';

export default function Profile() {
  const { profile, renameProfile, changePassword } = useAuth();
  const [nombre, setNombre] = useState(profile?.fullName ?? '');
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState(null);
  const [clave, setClave] = useState({ nueva: '', repetida: '' });
  const [errorClave, setErrorClave] = useState(null);
  const [cambiandoClave, setCambiandoClave] = useState(false);

  useEffect(() => {
    document.title = 'Perfil · OrgTask';
  }, []);

  const area = todasLasAreas.find((a) => a.code === profile?.areaCode);

  async function guardar(evento) {
    evento.preventDefault();
    setError(null);
    setGuardando(true);
    try {
      await renameProfile(nombre);
      setAviso({ tone: 'ok', message: 'Tu nombre quedó actualizado en toda la aplicación.' });
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  }

  async function cambiarClave(evento) {
    evento.preventDefault();
    setErrorClave(null);

    if (clave.nueva !== clave.repetida) {
      setErrorClave('Las dos contraseñas no coinciden.');
      return;
    }

    setCambiandoClave(true);
    try {
      await changePassword(clave.nueva);
      setClave({ nueva: '', repetida: '' });
      setAviso({ tone: 'ok', message: 'Tu contraseña quedó actualizada.' });
    } catch (e) {
      setErrorClave(e.message);
    } finally {
      setCambiandoClave(false);
    }
  }

  return (
    <>
      <PageHeader eyebrow="Tu cuenta" title="Perfil" description="Tus datos y tu rol en la DEE." />

      <div className="flex flex-col gap-8 px-5 py-6 sm:px-8">
        <section aria-labelledby="datos" className="max-w-md">
          <h2 id="datos" className="text-lg">
            Tus datos
          </h2>
          <form onSubmit={guardar} className="mt-3 flex flex-col gap-4" noValidate>
            <Input
              label="Nombre completo"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              error={error}
              hint="Es el nombre que ve el resto en las tarjetas y en el histórico."
            />
            <Input
              label="Correo institucional"
              value={profile?.email ?? ''}
              disabled
              hint="El correo lo cambia quien administra los usuarios."
            />
            <div>
              <Button type="submit" icon={Save} loading={guardando}>
                Guardar cambios
              </Button>
            </div>
          </form>
        </section>

        <section aria-labelledby="rol" className="max-w-md">
          <h2 id="rol" className="text-lg">
            Tu rol
          </h2>
          <dl className="mt-3 divide-y divide-line overflow-hidden rounded border border-line bg-surface">
            <div className="flex items-baseline justify-between gap-4 px-4 py-3">
              <dt className="text-sm text-slate">Rol</dt>
              <dd className="text-base text-ink">{ROLE_LABELS[profile?.role]}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 px-4 py-3">
              <dt className="text-sm text-slate">Área</dt>
              <dd>
                {area ? (
                  <Badge tone={AREA_TONES[area.code].badge}>{area.shortName}</Badge>
                ) : (
                  <span className="text-base text-ink">Las tres áreas</span>
                )}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 px-4 py-3">
              <dt className="text-sm text-slate">Administra usuarios</dt>
              <dd className="text-base text-ink">{profile?.isAdmin ? 'Sí' : 'No'}</dd>
            </div>
          </dl>
        </section>

        <section aria-labelledby="clave" className="max-w-md">
          <h2 id="clave" className="text-lg">
            Contraseña
          </h2>
          <form onSubmit={cambiarClave} className="mt-3 flex flex-col gap-4" noValidate>
            <Input
              label="Contraseña nueva"
              type="password"
              autoComplete="new-password"
              value={clave.nueva}
              onChange={(e) => setClave((p) => ({ ...p, nueva: e.target.value }))}
              hint="Al menos 8 caracteres."
            />
            <Input
              label="Repite la contraseña nueva"
              type="password"
              autoComplete="new-password"
              value={clave.repetida}
              onChange={(e) => setClave((p) => ({ ...p, repetida: e.target.value }))}
              error={errorClave}
            />
            <div>
              <Button type="submit" variant="secondary" loading={cambiandoClave}>
                Cambiar contraseña
              </Button>
            </div>
          </form>
        </section>

        {!usandoSupabase && (
          <section aria-labelledby="datos-locales" className="max-w-md">
            <h2 id="datos-locales" className="text-lg">
              Datos de prueba
            </h2>
            <p className="mt-2 text-base text-slate">
              Todavía no está conectada la base de datos, así que todo lo que hagas se guarda
              solo en este navegador y en este equipo. No se comparte con el resto del equipo.
            </p>
            <Button
              variant="secondary"
              icon={RotateCcw}
              className="mt-3"
              onClick={() => {
                resetState();
                window.location.reload();
              }}
            >
              Volver a los datos de ejemplo
            </Button>
          </section>
        )}
      </div>

      <Toast message={aviso?.message} tone={aviso?.tone} onClose={() => setAviso(null)} />
    </>
  );
}
