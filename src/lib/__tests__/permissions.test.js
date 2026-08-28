import { describe, it, expect } from 'vitest';
import {
  canArchiveTask,
  canChangePriority,
  canCreateTask,
  canMoveTask,
  canRestoreTask,
  canSeeArea,
  visibleAreas,
} from '../permissions';

const director = { id: 'd', role: 'director', areaCode: null, isAdmin: false };
const liderCpyg = { id: 'l', role: 'lider', areaCode: 'CPYG', isAdmin: false };
const colabCpyg = { id: 'c', role: 'colaborador', areaCode: 'CPYG', isAdmin: false };
const adminCpyg = { id: 'a', role: 'colaborador', areaCode: 'CPYG', isAdmin: true };

const tareaDeColab = { areaCode: 'CPYG', assigneeId: 'c', status: 'por_hacer' };
const tareaDeOtro = { areaCode: 'CPYG', assigneeId: 'l', status: 'por_hacer' };
const tareaDeRyve = { areaCode: 'RYVE', assigneeId: 'x', status: 'hecho' };

const areas = [{ code: 'CPYG' }, { code: 'RYVE' }, { code: 'DEPORTES' }];

describe('Quién ve qué áreas', () => {
  it('el Director ve las tres', () => {
    expect(visibleAreas(director, areas)).toHaveLength(3);
  });

  it('el líder ve solo la suya', () => {
    expect(visibleAreas(liderCpyg, areas).map((a) => a.code)).toEqual(['CPYG']);
  });

  it('el colaborador ve solo la suya', () => {
    expect(canSeeArea(colabCpyg, 'CPYG')).toBe(true);
    expect(canSeeArea(colabCpyg, 'RYVE')).toBe(false);
  });

  it('quien administra usuarios ve las tres, aunque sea colaborador', () => {
    expect(visibleAreas(adminCpyg, areas)).toHaveLength(3);
  });
});

describe('Mover tareas entre columnas', () => {
  it('el colaborador mueve sus propias tareas', () => {
    expect(canMoveTask(colabCpyg, tareaDeColab)).toBe(true);
  });

  it('el colaborador no mueve la tarea de otra persona', () => {
    expect(canMoveTask(colabCpyg, tareaDeOtro)).toBe(false);
  });

  it('el líder mueve cualquier tarea de su área', () => {
    expect(canMoveTask(liderCpyg, tareaDeOtro)).toBe(true);
  });

  it('el líder no toca tareas de otra área', () => {
    expect(canMoveTask(liderCpyg, tareaDeRyve)).toBe(false);
  });

  it('el Director mueve tareas de cualquier área', () => {
    expect(canMoveTask(director, tareaDeRyve)).toBe(true);
  });

  it('quien administra usuarios sigue siendo colaborador para mover', () => {
    expect(canMoveTask(adminCpyg, tareaDeOtro)).toBe(false);
    expect(canMoveTask(adminCpyg, { ...tareaDeColab, assigneeId: 'a' })).toBe(true);
  });
});

describe('Prioridad, creación y archivado', () => {
  it('el colaborador no cambia prioridades ni crea tareas', () => {
    expect(canChangePriority(colabCpyg, tareaDeColab)).toBe(false);
    expect(canCreateTask(colabCpyg, 'CPYG')).toBe(false);
  });

  it('el líder cambia prioridades y crea en su área', () => {
    expect(canChangePriority(liderCpyg, tareaDeOtro)).toBe(true);
    expect(canCreateTask(liderCpyg, 'CPYG')).toBe(true);
    expect(canCreateTask(liderCpyg, 'RYVE')).toBe(false);
  });

  it('solo se archiva lo que está en Hecho', () => {
    expect(canArchiveTask(liderCpyg, tareaDeOtro)).toBe(false);
    expect(canArchiveTask(liderCpyg, { ...tareaDeOtro, status: 'hecho' })).toBe(true);
  });

  it('solo el Director devuelve tareas del histórico al tablero', () => {
    expect(canRestoreTask(director)).toBe(true);
    expect(canRestoreTask(liderCpyg)).toBe(false);
    expect(canRestoreTask(adminCpyg)).toBe(false);
  });
});
