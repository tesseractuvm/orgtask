import { useEffect, useState } from 'react';
import Modal from '../Modal';
import Button from '../Button';
import Input from '../Input';
import Select from '../Select';
import { PRIORITIES } from '../../lib/taskFormat';

const VACIO = { title: '', description: '', assigneeId: '', priority: 'media', dueDate: '' };

function validar(values) {
  const errores = {};
  const titulo = values.title.trim();

  if (titulo.length < 3) errores.title = 'Escribe un título de al menos 3 caracteres.';
  else if (titulo.length > 120) errores.title = 'El título no puede pasar de 120 caracteres.';

  if (values.description.length > 500) {
    errores.description = 'La descripción no puede pasar de 500 caracteres.';
  }
  if (!values.assigneeId) errores.assigneeId = 'Elige a alguien del área como responsable.';
  if (values.dueDate && Number.isNaN(Date.parse(values.dueDate))) {
    errores.dueDate = 'La fecha no es válida.';
  }
  return errores;
}

/** Formulario de crear y editar. La misma pieza para las dos cosas. */
export default function TaskFormModal({ open, task, team, onClose, onSubmit }) {
  const [values, setValues] = useState(VACIO);
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState(null);

  useEffect(() => {
    if (!open) return;
    setErrores({});
    setErrorGeneral(null);
    setValues(
      task
        ? {
            title: task.title,
            description: task.description ?? '',
            assigneeId: task.assigneeId ?? '',
            priority: task.priority,
            dueDate: task.dueDate ?? '',
          }
        : VACIO
    );
  }, [open, task]);

  const cambiar = (campo) => (evento) =>
    setValues((previo) => ({ ...previo, [campo]: evento.target.value }));

  async function enviar(evento) {
    evento.preventDefault();
    const encontrados = validar(values);
    setErrores(encontrados);
    if (Object.keys(encontrados).length > 0) return;

    setGuardando(true);
    setErrorGeneral(null);
    try {
      await onSubmit(values);
      onClose();
    } catch (error) {
      setErrorGeneral(error.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={task ? 'Editar tarea' : 'Crear tarea'}
      description={
        task
          ? 'Los cambios quedan registrados en la cronología de la tarea.'
          : 'La tarea nueva entra en la columna Por hacer.'
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={guardando}>
            Cancelar
          </Button>
          <Button type="submit" form="formulario-tarea" loading={guardando}>
            {task ? 'Guardar cambios' : 'Crear tarea'}
          </Button>
        </>
      }
    >
      <form id="formulario-tarea" onSubmit={enviar} className="flex flex-col gap-4" noValidate>
        <Input
          label="Título de la tarea"
          value={values.title}
          onChange={cambiar('title')}
          error={errores.title}
          placeholder="Convenio de prácticas con empresa aliada"
          hint="Una línea que permita reconocerla en el tablero."
          autoFocus
        />
        <Input
          label="Descripción breve"
          multiline
          rows={3}
          value={values.description}
          onChange={cambiar('description')}
          error={errores.description}
          placeholder="Qué hay que lograr y con quién se coordina."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Responsable"
            value={values.assigneeId}
            onChange={cambiar('assigneeId')}
            error={errores.assigneeId}
            placeholder="Selecciona a una persona"
            options={team.map((p) => ({ value: p.id, label: p.fullName }))}
            hint="Solo aparece quien pertenece a esta área."
          />
          <Select
            label="Prioridad"
            value={values.priority}
            onChange={cambiar('priority')}
            options={PRIORITIES.map((p) => ({ value: p.value, label: p.label }))}
          />
        </div>
        <Input
          label="Fecha límite"
          type="date"
          value={values.dueDate}
          onChange={cambiar('dueDate')}
          error={errores.dueDate}
          hint="Opcional. Se marca en rojo cuando la fecha ya pasó."
        />
        {errorGeneral && (
          <p role="alert" className="rounded border border-alert bg-alert-light px-3 py-2 text-sm font-medium text-alert">
            {errorGeneral}
          </p>
        )}
      </form>
    </Modal>
  );
}
