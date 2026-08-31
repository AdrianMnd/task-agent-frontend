import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useEffect } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const getTokenMock = vi.fn();
const clearTokenMock = vi.fn();
const getUserMock = vi.fn();
const clearUserMock = vi.fn();
vi.mock('../auth', () => ({
  getToken: () => getTokenMock(),
  clearToken: () => clearTokenMock(),
  getUser: () => getUserMock(),
  clearUser: () => clearUserMock()
}));

vi.mock('../components/LoginForm', () => ({
  LoginForm: ({ onAuthenticated }: { onAuthenticated: () => void }) => (
    <button onClick={onAuthenticated}>Fake login</button>
  )
}));

vi.mock('../components/ChatWindow', () => ({
  ChatWindow: ({
    onTasksChanged,
    onActiveChange,
    onReady
  }: {
    onTasksChanged?: () => void;
    onActiveChange?: (active: boolean) => void;
    onReady?: () => void;
  }) => {
    // Igual que el componente real: avisa de que esta listo tras su "carga" (aqui inmediata).
    useEffect(() => {
      onReady?.();
    }, []);
    return (
      <div>
        <span>chat-window-stub</span>
        <button onClick={onTasksChanged}>Simular tarea creada</button>
        <button onClick={() => onActiveChange?.(true)}>Simular agente activo</button>
      </div>
    );
  }
}));

vi.mock('../components/TaskPanel', () => ({
  TaskPanel: ({ refreshTrigger, onReady }: { refreshTrigger: number; onReady?: () => void }) => {
    useEffect(() => {
      onReady?.();
    }, []);
    return <div>task-panel-stub refresh={refreshTrigger}</div>;
  }
}));

vi.mock('../components/ReminderStatus', () => ({
  ReminderStatus: () => <div>reminder-status-stub</div>
}));

const { default: App } = await import('../App');

beforeEach(() => {
  getTokenMock.mockReset();
  clearTokenMock.mockReset();
  getUserMock.mockReset();
  clearUserMock.mockReset();
  getUserMock.mockReturnValue(null);
});

describe('App - puerta de autenticacion', () => {
  it('sin token, muestra el formulario de login en vez de la app', () => {
    getTokenMock.mockReturnValue(null);
    render(<App />);
    expect(screen.getByText('Fake login')).toBeInTheDocument();
    expect(screen.queryByText('chat-window-stub')).not.toBeInTheDocument();
  });

  it('con token, muestra la app directamente', () => {
    getTokenMock.mockReturnValue('un-token');
    render(<App />);
    expect(screen.getByText('chat-window-stub')).toBeInTheDocument();
    expect(screen.getByText('task-panel-stub refresh=0')).toBeInTheDocument();
  });

  it('al autenticarse desde el login, pasa a mostrar la app', async () => {
    const user = userEvent.setup();
    getTokenMock.mockReturnValue(null);
    render(<App />);

    await user.click(screen.getByText('Fake login'));

    expect(screen.getByText('chat-window-stub')).toBeInTheDocument();
  });
});

describe('App - cabecera', () => {
  it('muestra el email del usuario si esta disponible', () => {
    getTokenMock.mockReturnValue('tok');
    getUserMock.mockReturnValue({ id: 1, email: 'adrian@example.com' });
    render(<App />);
    expect(screen.getByText('adrian@example.com')).toBeInTheDocument();
  });

  it('sin usuario guardado, muestra el texto por defecto', () => {
    getTokenMock.mockReturnValue('tok');
    getUserMock.mockReturnValue(null);
    render(<App />);
    expect(screen.getByText('sesión activa')).toBeInTheDocument();
  });

  it('cerrar sesion limpia token/usuario y vuelve al login', async () => {
    const user = userEvent.setup();
    getTokenMock.mockReturnValue('tok');
    render(<App />);

    await user.click(screen.getByText('Cerrar sesión'));

    expect(clearTokenMock).toHaveBeenCalled();
    expect(clearUserMock).toHaveBeenCalled();
    expect(screen.getByText('Fake login')).toBeInTheDocument();
  });
});

describe('App - pestañas moviles', () => {
  it('Chat empieza activa por defecto', () => {
    getTokenMock.mockReturnValue('tok');
    const { container } = render(<App />);
    expect(container.querySelector('.chat-pane.active')).toBeInTheDocument();
    expect(container.querySelector('.task-pane.active')).not.toBeInTheDocument();
  });

  it('pulsar "Tareas" activa el panel de tareas y desactiva el chat', async () => {
    const user = userEvent.setup();
    getTokenMock.mockReturnValue('tok');
    const { container } = render(<App />);

    await user.click(screen.getByRole('button', { name: 'Tareas' }));

    expect(container.querySelector('.task-pane.active')).toBeInTheDocument();
    expect(container.querySelector('.chat-pane.active')).not.toBeInTheDocument();
  });
});

describe('App - barra de estado y refresco de tareas', () => {
  it('se activa la clase "active" de la barra de estado cuando el chat reporta actividad', async () => {
    const user = userEvent.setup();
    getTokenMock.mockReturnValue('tok');
    const { container } = render(<App />);

    expect(container.querySelector('.status-strip.active')).not.toBeInTheDocument();
    await user.click(screen.getByText('Simular agente activo'));
    expect(container.querySelector('.status-strip.active')).toBeInTheDocument();
  });

  it('cuando ChatWindow avisa de una tarea nueva, TaskPanel recibe un refreshTrigger incrementado', async () => {
    const user = userEvent.setup();
    getTokenMock.mockReturnValue('tok');
    render(<App />);

    expect(screen.getByText('task-panel-stub refresh=0')).toBeInTheDocument();
    await user.click(screen.getByText('Simular tarea creada'));
    expect(screen.getByText('task-panel-stub refresh=1')).toBeInTheDocument();
  });
});