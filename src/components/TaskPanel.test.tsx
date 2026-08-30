import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

const getTasksMock = vi.fn();
vi.mock('../api/client', () => ({ getTasks: (...args: any[]) => getTasksMock(...args) }));

const { TaskPanel } = await import('./TaskPanel');

beforeEach(() => {
  getTasksMock.mockReset();
});

describe('TaskPanel', () => {
  it('muestra "Cargando..." mientras resuelve la peticion', () => {
    getTasksMock.mockReturnValue(new Promise(() => {})); // nunca resuelve
    render(<TaskPanel refreshTrigger={0} />);
    expect(screen.getByText('Cargando...')).toBeInTheDocument();
  });

  it('muestra un mensaje de error si falla la peticion', async () => {
    getTasksMock.mockRejectedValue(new Error('fail'));
    render(<TaskPanel refreshTrigger={0} />);
    await waitFor(() => expect(screen.getByText('No se pudieron cargar las tareas.')).toBeInTheDocument());
  });

  it('muestra el mensaje de vacio si no hay tareas', async () => {
    getTasksMock.mockResolvedValue([]);
    render(<TaskPanel refreshTrigger={0} />);
    await waitFor(() => expect(screen.getByText('No tienes tareas todavía.')).toBeInTheDocument());
  });

  it('una tarea pendiente sin fecha vencida muestra punto ambar', async () => {
    const future = new Date();
    future.setDate(future.getDate() + 5);
    getTasksMock.mockResolvedValue([
      { id: 1, title: 'Futura', completed: false, due_date: future.toISOString().slice(0, 10), description: null, source: 'manual' }
    ]);
    const { container } = render(<TaskPanel refreshTrigger={0} />);
    await waitFor(() => expect(screen.getByText('Futura')).toBeInTheDocument());
    expect(container.querySelector('.task-dot.pending')).toBeInTheDocument();
    expect(container.querySelector('.task-dot.overdue')).not.toBeInTheDocument();
  });

  it('una tarea pendiente con fecha pasada muestra punto rojo (vencida)', async () => {
    getTasksMock.mockResolvedValue([
      { id: 2, title: 'Vencida', completed: false, due_date: '2020-01-01', description: null, source: 'manual' }
    ]);
    const { container } = render(<TaskPanel refreshTrigger={0} />);
    await waitFor(() => expect(screen.getByText('Vencida')).toBeInTheDocument());
    expect(container.querySelector('.task-dot.overdue')).toBeInTheDocument();
    expect(container.querySelector('.task-due.overdue')).toBeInTheDocument();
  });

  it('una tarea completada con fecha pasada NO se marca como vencida (ya esta hecha)', async () => {
    getTasksMock.mockResolvedValue([
      { id: 3, title: 'Hecha hace tiempo', completed: true, due_date: '2020-01-01', description: null, source: 'manual' }
    ]);
    const { container } = render(<TaskPanel refreshTrigger={0} />);
    await waitFor(() => expect(screen.getByText('Completadas')).toBeInTheDocument());
    expect(container.querySelector('.task-dot.done')).toBeInTheDocument();
    expect(container.querySelector('.task-dot.overdue')).not.toBeInTheDocument();
  });

  it('una tarea de GitHub muestra la insignia correspondiente', async () => {
    getTasksMock.mockResolvedValue([
      { id: 4, title: 'PR pendiente', completed: false, due_date: null, description: null, source: 'github' }
    ]);
    render(<TaskPanel refreshTrigger={0} />);
    await waitFor(() => expect(screen.getByText('GitHub')).toBeInTheDocument());
  });

  it('vuelve a pedir las tareas cuando cambia refreshTrigger', async () => {
    getTasksMock.mockResolvedValue([]);
    const { rerender } = render(<TaskPanel refreshTrigger={0} />);
    await waitFor(() => expect(getTasksMock).toHaveBeenCalledTimes(1));
    rerender(<TaskPanel refreshTrigger={1} />);
    await waitFor(() => expect(getTasksMock).toHaveBeenCalledTimes(2));
  });
});
