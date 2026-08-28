import { NavLink } from 'react-router-dom';
import {
  Home,
  Archive,
  BarChart3,
  UserCircle,
  LogOut,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { canManageUsers, visibleAreas, ROLE_LABELS } from '../../lib/permissions';
import { areas as todasLasAreas } from '../../data/seedData';

const AREA_DOT = {
  CPYG: 'bg-area-cpyg',
  RYVE: 'bg-area-ryve',
  DEPORTES: 'bg-area-deportes',
};

function enlaceClases({ isActive }) {
  return `flex items-center gap-2.5 rounded px-3 py-2 text-sm transition-colors duration-150 ${
    isActive ? 'bg-ink-600 font-medium text-white' : 'text-line hover:bg-ink-700 hover:text-white'
  }`;
}

/** Barra lateral. Solo muestra las áreas que la persona tiene permitido ver. */
export default function Sidebar({ onNavigate }) {
  const { profile, signOut } = useAuth();
  const misAreas = visibleAreas(profile, todasLasAreas);

  return (
    <div className="flex h-full w-full flex-col bg-ink px-4 py-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-display text-lg font-bold text-white">OrgTask</p>
          <p className="mt-0.5 text-sm text-slate-light">Gestión DEE</p>
        </div>
        {onNavigate && (
          <button
            type="button"
            onClick={onNavigate}
            aria-label="Cerrar menú"
            className="rounded p-1.5 text-line hover:bg-ink-700 hover:text-white lg:hidden"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        )}
      </div>

      <nav className="mt-6 flex flex-1 flex-col gap-1 overflow-y-auto" aria-label="Principal">
        <NavLink to="/" end className={enlaceClases} onClick={onNavigate}>
          <Home aria-hidden="true" className="h-4 w-4 shrink-0" />
          Inicio
        </NavLink>

        <p className="mt-4 px-3 text-sm font-medium uppercase tracking-wide text-slate-light">
          {misAreas.length > 1 ? 'Áreas' : 'Mi área'}
        </p>
        {misAreas.map((area) => (
          <NavLink
            key={area.code}
            to={`/area/${area.slug}`}
            className={enlaceClases}
            onClick={onNavigate}
          >
            <span
              aria-hidden="true"
              className={`h-2.5 w-2.5 shrink-0 rounded-sm ${AREA_DOT[area.code]}`}
            />
            {area.shortName}
          </NavLink>
        ))}

        <p className="mt-4 px-3 text-sm font-medium uppercase tracking-wide text-slate-light">
          Seguimiento
        </p>
        <NavLink to="/historico" className={enlaceClases} onClick={onNavigate}>
          <Archive aria-hidden="true" className="h-4 w-4 shrink-0" />
          Histórico
        </NavLink>
        <NavLink to="/indicadores" className={enlaceClases} onClick={onNavigate}>
          <BarChart3 aria-hidden="true" className="h-4 w-4 shrink-0" />
          Indicadores
        </NavLink>

        {canManageUsers(profile) && (
          <>
            <p className="mt-4 px-3 text-sm font-medium uppercase tracking-wide text-slate-light">
              Administración
            </p>
            <NavLink to="/usuarios" className={enlaceClases} onClick={onNavigate}>
              <Users aria-hidden="true" className="h-4 w-4 shrink-0" />
              Usuarios
            </NavLink>
          </>
        )}
      </nav>

      <div className="mt-4 border-t border-ink-600 pt-4">
        <NavLink to="/perfil" className={enlaceClases} onClick={onNavigate}>
          <UserCircle aria-hidden="true" className="h-4 w-4 shrink-0" />
          <span className="min-w-0 flex-1 truncate">{profile?.fullName}</span>
        </NavLink>
        <p className="px-3 pt-1 text-sm text-slate-light">
          {ROLE_LABELS[profile?.role]}
          {profile?.isAdmin ? ' · Administra usuarios' : ''}
        </p>
        <button
          type="button"
          onClick={signOut}
          className="mt-2 flex w-full items-center gap-2.5 rounded px-3 py-2 text-sm text-line transition-colors duration-150 hover:bg-ink-700 hover:text-white"
        >
          <LogOut aria-hidden="true" className="h-4 w-4 shrink-0" />
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
