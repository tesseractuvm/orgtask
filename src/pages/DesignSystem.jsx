import PaletteSection from '../components/design-system/PaletteSection';
import TypeScaleSection from '../components/design-system/TypeScaleSection';
import ButtonsSection from '../components/design-system/ButtonsSection';
import FormsSection from '../components/design-system/FormsSection';
import SignatureSection from '../components/design-system/SignatureSection';

/**
 * Página de muestra del sistema de diseño. Es la referencia visual del proyecto
 * y se reemplaza por la aplicación real en cuanto el tablero esté construido.
 */
export default function DesignSystem() {
  return (
    <div className="min-h-screen bg-paper">
      <header className="bg-ink px-6 py-10 sm:px-10 sm:py-14">
        <div className="mx-auto max-w-5xl">
          <p className="font-mono text-sm uppercase tracking-widest text-signal-light">
            OrgTask · Dirección de Desarrollo Estudiantil y Exalumnos
          </p>
          <h1 className="mt-3 max-w-3xl text-2xl text-white sm:text-3xl">
            Sistema de diseño
          </h1>
          <p className="mt-4 max-w-2xl text-base text-line">
            Las piezas con las que se construyen los tableros de CPyG, RyVE y Deportes.
            Revisa que la paleta, las tipografías y el riel de prioridad sean lo que
            esperas antes de que avancemos al tablero.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10 sm:px-10">
        <div className="flex flex-col gap-10">
          <PaletteSection />
          <TypeScaleSection />
          <SignatureSection />
          <ButtonsSection />
          <FormsSection />
        </div>
      </main>

      <footer className="border-t border-line px-6 py-6 sm:px-10">
        <p className="mx-auto max-w-5xl text-sm text-slate">
          Universidad Viña del Mar · Plataforma interna de gestión de tareas de la DEE
        </p>
      </footer>
    </div>
  );
}
