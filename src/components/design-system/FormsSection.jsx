import { useState } from 'react';
import { Inbox } from 'lucide-react';
import Button from '../Button';
import Input from '../Input';
import Select from '../Select';
import Badge from '../Badge';
import Modal from '../Modal';
import EmptyState from '../EmptyState';

const RESPONSABLES = [
  { value: 'c-tamayo', label: 'Catalina Tamayo' },
  { value: 'j-moya', label: 'Javier Moya' },
  { value: 'f-tapia', label: 'Francisca Tapia' },
];

/** Campos, etiquetas, diálogo y estado vacío. */
export default function FormsSection() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <section aria-labelledby="formularios" className="border-t border-line pt-8">
      <h2 id="formularios" className="text-lg">
        Campos, etiquetas y diálogo
      </h2>

      <div className="mt-5 grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <Input
            label="Título de la tarea"
            placeholder="Convenio con empresa de prácticas"
            hint="Una línea que permita reconocerla en el tablero."
          />
          <Input
            label="Fecha límite"
            type="date"
            defaultValue="2026-09-30"
            hint="Se marca en rojo cuando la fecha ya pasó."
          />
          <Input
            label="Responsable"
            error="Elige a alguien del área antes de guardar."
            placeholder="Sin asignar"
          />
        </div>

        <div className="flex flex-col gap-4">
          <Select
            label="Responsable del área"
            placeholder="Selecciona a una persona"
            options={RESPONSABLES}
            hint="Solo aparecen quienes pertenecen al área del tablero."
          />
          <Input
            label="Descripción breve"
            multiline
            rows={3}
            placeholder="Qué hay que lograr y con quién se coordina."
          />
          <Select label="Prioridad" disabled options={[{ value: 'alta', label: 'Alta' }]} />
        </div>
      </div>

      <h3 className="mt-8 text-base font-semibold">Etiquetas</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        <Badge tone="cpyg">CPyG</Badge>
        <Badge tone="ryve">RyVE</Badge>
        <Badge tone="deportes">Deportes</Badge>
        <Badge tone="ink">Director</Badge>
        <Badge tone="signal">En proceso</Badge>
        <Badge tone="ok">Hecho</Badge>
        <Badge tone="alert">Vencida hace 3 días</Badge>
        <Badge>Sin responsable</Badge>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="text-base font-semibold">Diálogo</h3>
          <p className="mt-1 text-sm text-slate">
            Se cierra con Escape y el foco no se escapa del cuadro.
          </p>
          <Button className="mt-3" variant="secondary" onClick={() => setModalOpen(true)}>
            Abrir diálogo de ejemplo
          </Button>
        </div>
        <div>
          <h3 className="text-base font-semibold">Columna sin tareas</h3>
          <div className="mt-3">
            <EmptyState
              icon={Inbox}
              title="Nada en proceso"
              description="Arrastra una tarea desde Por hacer cuando el equipo empiece a trabajarla."
            />
          </div>
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Archivar tarea"
        description="La tarea sale del tablero y queda en el histórico con su cronología."
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => setModalOpen(false)}>Archivar tarea</Button>
          </>
        }
      >
        <p className="text-base text-slate-dark">
          Vas a archivar <strong className="text-ink">Feria Laboral Primavera</strong>. El
          Director puede devolverla al tablero si hace falta.
        </p>
      </Modal>
    </section>
  );
}
