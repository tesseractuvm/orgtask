import { useEffect, useState } from 'react';
import { Copy, RefreshCw } from 'lucide-react';
import Modal from '../Modal';
import Button from '../Button';
import Input from '../Input';
import Select from '../Select';
import { AREAS } from '../../lib/areas';
import { ROLE_LABELS } from '../../lib/permissions';
import { PERSON_TONES } from '../../lib/people';

const ALFABETO_CLAVE = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

/**
 * Genera una contraseña temporal legible: sin 0/O ni 1/l/I, para que
 * transcribirla a mano (por Slack, en persona) no dé lugar a dudas.
 */
function generarClave(longitud = 10) {
  const valores = new Uint32Array(longitud);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(valores);
  } else {
    for (let i = 0; i < longitud; i += 1) valores[i] = Math.floor(Math.random() * 4294967296);
  }
  return Array.from(valores, (v) => ALFABETO_CLAVE[v % ALFABETO_CLAVE.length]).join('');
}

const VACIO = {
  fullName: '',
  email: '',
  role: 'colaborador',
  areaCode: '',
  colorToken: '',
  isAdmin: false,
  password: '',
};

function validar(values) {
  const errores = {};
  const nombre = values.fullName.trim();
  const correo = values.email.trim();

  if (nombre.length < 3) errores.fullName = 'Escribe el nombre completo.';
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo)) {
    errores.email = 'El correo no tiene un formato válido.';
  }
  if (values.role !== 'director' && !values.areaCode) {
    errores.areaCode = 'Elige el área de esta persona.';
  }
  if (!values.colorToken) errores.colorToken = 'Elige el color con el que se va a identificar.';
  if (values.password.length < 8) {
    errores.password = 'Debe tener al menos 8 caracteres.';
  }
  return errores;
}

/** Muestra un dato con un botón para copiarlo, para la pantalla final de alta. */
function CampoCopiable({ label, value }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(value);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Sin permiso de portapapeles: el valor sigue seleccionable a mano
    }
  }

  return (
    <div>
      <p className="text-sm font-medium text-slate-dark">{label}</p>
      <div className="mt-1 flex items-center gap-2">
        <code className="flex-1 select-all rounded border border-line-strong bg-paper px-3 py-2 font-mono text-base text-ink">
          {value}
        </code>
        <Button type="button" variant="secondary" icon={Copy} onClick={copiar}>
          {copiado ? 'Copiada' : 'Copiar'}
        </Button>
      </div>
    </div>
  );
}

/**
 * Alta de una persona nueva. No manda correo de invitación: quien administra
 * usuarios define la contraseña temporal acá y se la comunica aparte. Por eso,
 * apenas se crea la cuenta, la pantalla se queda mostrando esos datos en vez
 * de cerrarse sola: es la única vez que la contraseña va a estar visible.
 */
export default function UserFormModal({ open, onClose, onSubmit }) {
  const [values, setValues] = useState(VACIO);
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState(null);
  const [creada, setCreada] = useState(null);

  useEffect(() => {
    if (!open) return;
    setErrores({});
    setErrorGeneral(null);
    setCreada(null);
    setValues({ ...VACIO, password: generarClave() });
  }, [open]);

  const cambiar = (campo) => (evento) =>
    setValues((previo) => ({ ...previo, [campo]: evento.target.value }));

  function cambiarRol(evento) {
    const role = evento.target.value;
    // El Director ve las tres áreas, así que no pertenece a ninguna
    setValues((previo) => ({ ...previo, role, areaCode: role === 'director' ? '' : previo.areaCode }));
  }

  async function enviar(evento) {
    evento.preventDefault();
    const encontrados = validar(values);
    setErrores(encontrados);
    if (Object.keys(encontrados).length > 0) return;

    setGuardando(true);
    setErrorGeneral(null);
    try {
      await onSubmit(values);
      setCreada({
        fullName: values.fullName.trim(),
        email: values.email.trim().toLowerCase(),
        password: values.password,
      });
    } catch (error) {
      setErrorGeneral(error.message);
    } finally {
      setGuardando(false);
    }
  }

  if (creada) {
    return (
      <Modal
        open={open}
        onClose={onClose}
        title="Cuenta creada"
        description={`Comunícale estos datos a ${creada.fullName} fuera de la aplicación: por chat, en persona o como prefieras. Es la única vez que la contraseña se muestra.`}
        footer={<Button onClick={onClose}>Entendido, cerrar</Button>}
      >
        <div className="flex flex-col gap-4">
          <CampoCopiable label="Correo" value={creada.email} />
          <CampoCopiable label="Contraseña temporal" value={creada.password} />
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Agregar persona"
      description="Define su rol, su área y su color. La contraseña que pongas acá es la que va a usar la primera vez."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={guardando}>
            Cancelar
          </Button>
          <Button type="submit" form="formulario-usuario" loading={guardando}>
            Crear cuenta
          </Button>
        </>
      }
    >
      <form id="formulario-usuario" onSubmit={enviar} className="flex flex-col gap-4" noValidate>
        <Input
          label="Nombre completo"
          value={values.fullName}
          onChange={cambiar('fullName')}
          error={errores.fullName}
          placeholder="Nombre Apellido"
          autoFocus
        />
        <Input
          label="Correo institucional"
          type="email"
          value={values.email}
          onChange={cambiar('email')}
          error={errores.email}
          placeholder="nombre.apellido@uvm.cl"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Rol"
            value={values.role}
            onChange={cambiarRol}
            options={Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label }))}
          />
          {values.role === 'director' ? (
            <div className="flex flex-col justify-end pb-2.5">
              <p className="text-sm text-slate">Ve las tres áreas, no pertenece a una sola.</p>
            </div>
          ) : (
            <Select
              label="Área"
              value={values.areaCode}
              onChange={cambiar('areaCode')}
              error={errores.areaCode}
              placeholder="Selecciona un área"
              options={AREAS.map((a) => ({ value: a.code, label: a.shortName }))}
            />
          )}
        </div>

        <Select
          label="Color de identificación"
          value={values.colorToken}
          onChange={cambiar('colorToken')}
          error={errores.colorToken}
          placeholder="Selecciona un color"
          hint="El que la distingue en las tarjetas del tablero. No se repite con nadie más."
          options={Object.entries(PERSON_TONES).map(([value, tono]) => ({
            value,
            label: tono.label,
          }))}
        />

        <div className="flex items-end gap-2">
          <Input
            label="Contraseña temporal"
            className="flex-1"
            value={values.password}
            onChange={cambiar('password')}
            error={errores.password}
            hint="Se genera sola. Puedes cambiarla si prefieres otra."
          />
          <Button
            type="button"
            variant="secondary"
            icon={RefreshCw}
            onClick={() => setValues((previo) => ({ ...previo, password: generarClave() }))}
          >
            Generar otra
          </Button>
        </div>

        <label className="flex items-start gap-2.5 text-sm text-slate-dark">
          <input
            type="checkbox"
            checked={values.isAdmin}
            onChange={(evento) => setValues((previo) => ({ ...previo, isAdmin: evento.target.checked }))}
            className="mt-0.5 h-4 w-4 rounded border-line-strong text-signal focus:ring-signal"
          />
          Además administra usuarios: puede agregar y desactivar cuentas.
        </label>

        {errorGeneral && (
          <p role="alert" className="rounded border border-alert bg-alert-light px-3 py-2 text-sm font-medium text-alert">
            {errorGeneral}
          </p>
        )}
      </form>
    </Modal>
  );
}
