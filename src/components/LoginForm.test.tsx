import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const loginMock = vi.fn();
const registerMock = vi.fn();
const requestPasswordResetMock = vi.fn();
vi.mock('../api/client', () => ({
  login: (...args: any[]) => loginMock(...args),
  register: (...args: any[]) => registerMock(...args),
  requestPasswordReset: (...args: any[]) => requestPasswordResetMock(...args)
}));

const setTokenMock = vi.fn();
const setUserMock = vi.fn();
vi.mock('../auth', () => ({
  setToken: (...args: any[]) => setTokenMock(...args),
  setUser: (...args: any[]) => setUserMock(...args)
}));

const { LoginForm } = await import('./LoginForm');

beforeEach(() => {
  loginMock.mockReset();
  registerMock.mockReset();
  requestPasswordResetMock.mockReset();
  setTokenMock.mockReset();
  setUserMock.mockReset();
});

describe('LoginForm - modo login (por defecto)', () => {
  it('muestra el formulario de login por defecto', () => {
    render(<LoginForm onAuthenticated={vi.fn()} />);
    expect(screen.getByText('Inicia sesión')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument();
  });

  it('login correcto guarda token/usuario y llama a onAuthenticated', async () => {
    const user = userEvent.setup();
    loginMock.mockResolvedValue({ token: 'tok', user: { id: 1, email: 'a@b.com' } });
    const onAuthenticated = vi.fn();

    render(<LoginForm onAuthenticated={onAuthenticated} />);
    await user.type(screen.getByPlaceholderText('Email'), 'a@b.com');
    await user.type(screen.getByPlaceholderText(/Contraseña/), 'password123');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => expect(onAuthenticated).toHaveBeenCalled());
    expect(setTokenMock).toHaveBeenCalledWith('tok');
    expect(setUserMock).toHaveBeenCalledWith({ id: 1, email: 'a@b.com' });
  });

  it('muestra el error del servidor si el login falla', async () => {
    const user = userEvent.setup();
    loginMock.mockRejectedValue(new Error('Credenciales incorrectas'));

    render(<LoginForm onAuthenticated={vi.fn()} />);
    await user.type(screen.getByPlaceholderText('Email'), 'a@b.com');
    await user.type(screen.getByPlaceholderText(/Contraseña/), 'malapassword');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByText('Credenciales incorrectas')).toBeInTheDocument();
  });
});

describe('LoginForm - modo registro', () => {
  it('cambia a registro y llama a register al enviar', async () => {
    const user = userEvent.setup();
    registerMock.mockResolvedValue({ token: 'tok', user: { id: 2, email: 'nuevo@b.com' } });
    const onAuthenticated = vi.fn();

    render(<LoginForm onAuthenticated={onAuthenticated} />);
    await user.click(screen.getByText('¿No tienes cuenta? Regístrate'));
    expect(screen.getByText('Crea una cuenta')).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('Email'), 'nuevo@b.com');
    await user.type(screen.getByPlaceholderText(/Contraseña/), 'password123');
    await user.click(screen.getByRole('button', { name: 'Registrarme' }));

    await waitFor(() => expect(onAuthenticated).toHaveBeenCalled());
    expect(registerMock).toHaveBeenCalledWith('nuevo@b.com', 'password123');
  });

  it('muestra el error si el email ya existe', async () => {
    const user = userEvent.setup();
    registerMock.mockRejectedValue(new Error('Ese email ya está registrado'));

    render(<LoginForm onAuthenticated={vi.fn()} />);
    await user.click(screen.getByText('¿No tienes cuenta? Regístrate'));
    await user.type(screen.getByPlaceholderText('Email'), 'ya@b.com');
    await user.type(screen.getByPlaceholderText(/Contraseña/), 'password123');
    await user.click(screen.getByRole('button', { name: 'Registrarme' }));

    expect(await screen.findByText('Ese email ya está registrado')).toBeInTheDocument();
  });
});

describe('LoginForm - modo recuperar contraseña', () => {
  it('no pide contraseña en el modo de reset', async () => {
    const user = userEvent.setup();
    render(<LoginForm onAuthenticated={vi.fn()} />);
    await user.click(screen.getByText('¿Olvidaste tu contraseña?'));

    expect(screen.getByText('Recuperar contraseña')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/Contraseña/)).not.toBeInTheDocument();
  });

  it('al enviar, muestra el mensaje informativo (no llama a onAuthenticated)', async () => {
    const user = userEvent.setup();
    requestPasswordResetMock.mockResolvedValue(undefined);
    const onAuthenticated = vi.fn();

    render(<LoginForm onAuthenticated={onAuthenticated} />);
    await user.click(screen.getByText('¿Olvidaste tu contraseña?'));
    await user.type(screen.getByPlaceholderText('Email'), 'a@b.com');
    await user.click(screen.getByRole('button', { name: 'Enviar solicitud' }));

    expect(await screen.findByText(/Te contactaremos con una nueva contraseña/)).toBeInTheDocument();
    expect(onAuthenticated).not.toHaveBeenCalled();
  });

  it('"Volver a inicio de sesion" regresa al modo login', async () => {
    const user = userEvent.setup();
    render(<LoginForm onAuthenticated={vi.fn()} />);
    await user.click(screen.getByText('¿Olvidaste tu contraseña?'));
    await user.click(screen.getByText('Volver a inicio de sesión'));
    expect(screen.getByText('Inicia sesión')).toBeInTheDocument();
  });
});
