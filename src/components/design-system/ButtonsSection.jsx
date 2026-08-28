import { Plus, ArrowRight, Archive } from 'lucide-react';
import Button from '../Button';

const VARIANTS = [
  { variant: 'primary', label: 'Crear tarea', icon: Plus },
  { variant: 'secondary', label: 'Ver histórico', icon: Archive },
  { variant: 'ghost', label: 'Avanzar estado', icon: ArrowRight, iconPosition: 'right' },
  { variant: 'danger', label: 'Eliminar tarea' },
];

/** Los cuatro tipos de boton en sus cuatro estados. */
export default function ButtonsSection() {
  return (
    <section aria-labelledby="botones" className="border-t border-line pt-8">
      <h2 id="botones" className="text-lg">
        Botones
      </h2>
      <p className="mt-1 max-w-2xl text-sm text-slate">
        El texto de cada botón nombra la acción exacta. Recorre la fila con la tecla
        Tab para ver el anillo de foco.
      </p>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left">
          <caption className="sr-only">
            Tipos de botón y sus estados de reposo, carga y deshabilitado
          </caption>
          <thead>
            <tr className="border-b border-line">
              {['Tipo', 'Reposo y hover', 'Cargando', 'Deshabilitado'].map((header) => (
                <th key={header} className="pb-2 pr-4 text-sm font-medium text-slate">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {VARIANTS.map((item) => (
              <tr key={item.variant}>
                <td className="py-4 pr-4 font-mono text-sm text-slate">
                  {item.variant}
                </td>
                <td className="py-4 pr-4">
                  <Button
                    variant={item.variant}
                    icon={item.icon}
                    iconPosition={item.iconPosition}
                  >
                    {item.label}
                  </Button>
                </td>
                <td className="py-4 pr-4">
                  <Button variant={item.variant} loading>
                    Guardando
                  </Button>
                </td>
                <td className="py-4 pr-4">
                  <Button variant={item.variant} disabled>
                    Sin permiso
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button size="sm">Tamaño sm</Button>
        <Button size="md">Tamaño md</Button>
        <Button size="lg">Tamaño lg</Button>
      </div>
    </section>
  );
}
