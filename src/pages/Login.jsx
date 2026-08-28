import { useState } from 'react';
import { LogIn } from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';
import { useAuth } from '../context/AuthContext';
import { demoAccounts } from '../services/authService';
import { DEMO_PASSWORD } from '../data/seedData';
import { ROLE_LABELS } from '../lib/permissions';

/**
 * Ingreso. Mientras no está conectado Supabase, valida contra las cuentas de
 * ejemplo; el formulario y el flujo son los definitivos.
 */
export default function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [entrando, setEntrando] = useState(false);

  async function enviar(evento) {
    evento.preventDefault();
    setError(null);
    setEntrando(true);
    try {
      await signIn(email, password);
    } catch (e) {
      setError(e.message);
    } finally {
      setEntrando(false);
    }
  }

  function usarCuenta(correo) {
    setEmail(correo);
    setPassword(DEMO_PASSWORD);
    setError(null);
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      <div className="flex flex-col justify-center bg-ink px-6 py-12 sm:px-12">
        <p className="font-mono text-sm uppercase tracking-widest text-signal-light">
          Universidad Viña del Mar
        </p>
        <h1 className="mt-3 max-w-md text-2xl text-white">
          El trabajo de la DEE, en un solo lugar
        </h1>
        <p className="mt-4 max-w-md text-base text-line">
          Tableros de CPyG, RyVE y Deportes, con el histórico de lo ejecutado y los
          indicadores de cada área.
        </p>

        <dl className="mt-10 grid max-w-md grid-cols-3 gap-4 border-t border-ink-600 pt-6">
          {[
            { n: '3', t: 'áreas' },
            { n: '10', t: 'personas' },
            { n: '4', t: 'roles' },
          ].map((dato) => (
            <div key={dato.t}>
              <dt className="sr-only">{dato.t}</dt>
              <dd>
                <span className="block font-display text-xl font-bold text-white">{dato.n}</span>
                <span className="text-sm text-slate-light">{dato.t}</span>
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="flex flex-col justify-center px-6 py-12 sm:px-12">
        <div className="w-full max-w-sm">
          <h2 className="text-xl">Iniciar sesión</h2>
          <p className="mt-1 text-base text-slate">Usa tu correo institucional.</p>

          <form onSubmit={enviar} className="mt-6 flex flex-col gap-4" noValidate>
            <Input
              label="Correo institucional"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nombre.apellido@uvm.cl"
            />
            <Input
              label="Contraseña"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && (
              <p
                role="alert"
                className="rounded border border-alert bg-alert-light px-3 py-2 text-sm font-medium text-alert"
              >
                {error}
              </p>
            )}
            <Button type="submit" icon={LogIn} loading={entrando} size="lg">
              Entrar
            </Button>
          </form>

          <div className="mt-8 rounded border border-line bg-surface-muted p-4">
            <p className="text-sm font-medium text-ink">Cuentas de prueba</p>
            <p className="mt-1 text-sm text-slate">
              Todavía no está conectada la base de datos real. Elige una cuenta para entrar y
              ver los permisos de cada rol.
            </p>
            <ul className="mt-3 flex flex-col gap-1">
              {demoAccounts().map((cuenta) => (
                <li key={cuenta.email}>
                  <button
                    type="button"
                    onClick={() => usarCuenta(cuenta.email)}
                    className="w-full rounded px-2 py-1.5 text-left text-sm transition-colors duration-150 hover:bg-paper"
                  >
                    <span className="font-medium text-ink">{cuenta.fullName}</span>
                    <span className="text-slate">
                      {' · '}
                      {ROLE_LABELS[cuenta.role]}
                      {cuenta.areaCode ? ` de ${cuenta.areaCode}` : ''}
                      {cuenta.isAdmin ? ' + administra usuarios' : ''}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
