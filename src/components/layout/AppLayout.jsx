import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import ImpersonationBanner from './ImpersonationBanner';

/**
 * Estructura de la aplicación: barra lateral oscura fija y a la derecha el
 * lienzo claro de trabajo. En pantallas chicas la barra se abre como panel.
 */
export default function AppLayout() {
  const [menuAbierto, setMenuAbierto] = useState(false);

  return (
    <div className="min-h-screen bg-paper lg:flex">
      {/* Barra fija en escritorio */}
      <aside className="hidden w-60 shrink-0 lg:sticky lg:top-0 lg:block lg:h-screen">
        <Sidebar />
      </aside>

      {/* Cabecera con el botón de menú en móvil */}
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-ink-600 bg-ink px-4 py-3 lg:hidden">
        <button
          type="button"
          onClick={() => setMenuAbierto(true)}
          className="rounded p-1.5 text-line transition-colors duration-150 hover:bg-ink-700 hover:text-white"
          aria-label="Abrir menú"
        >
          <Menu aria-hidden="true" className="h-5 w-5" />
        </button>
        <p className="font-display text-base font-bold text-white">OrgTask</p>
      </header>

      {menuAbierto && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-ink-900/50"
            onMouseDown={() => setMenuAbierto(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0 w-64 shadow-raised">
            <Sidebar onNavigate={() => setMenuAbierto(false)} />
          </div>
        </div>
      )}

      <main className="min-w-0 flex-1">
        <ImpersonationBanner />
        <Outlet />
      </main>
    </div>
  );
}
