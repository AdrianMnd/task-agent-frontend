import { useState, type FormEvent } from 'react';
import { login, register, requestPasswordReset } from '../api/client';
import { setToken, setUser } from '../auth';

interface Props {
  onAuthenticated: () => void;
}

type Mode = 'login' | 'register' | 'reset';

export function LoginForm({ onAuthenticated }: Props) {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setInfo(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    try {
      if (mode === 'reset') {
        await requestPasswordReset(email);
        setInfo('Si el email existe, hemos recibido tu solicitud. Te contactaremos con una nueva contraseña.');
      } else {
        const { token, user } = mode === 'login' ? await login(email, password) : await register(email, password);
        setToken(token);
        setUser(user);
        onAuthenticated();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Algo ha ido mal');
    } finally {
      setLoading(false);
    }
  }

  const subtitle = mode === 'login' ? 'Inicia sesión' : mode === 'register' ? 'Crea una cuenta' : 'Recuperar contraseña';
  const submitLabel = mode === 'login' ? 'Entrar' : mode === 'register' ? 'Registrarme' : 'Enviar solicitud';

  return (
    <div className="auth-screen">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h1>Task Agent</h1>
        <p className="auth-subtitle">{subtitle}</p>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        {mode !== 'reset' && (
          <input
            type="password"
            placeholder="Contraseña (mín. 8 caracteres)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        )}

        {error && <p className="auth-error">{error}</p>}
        {info && <p className="auth-info">{info}</p>}

        <button type="submit" disabled={loading}>
          {loading ? 'Cargando...' : submitLabel}
        </button>

        {mode === 'login' && (
          <button type="button" className="auth-switch" onClick={() => switchMode('reset')}>
            ¿Olvidaste tu contraseña?
          </button>
        )}

        <button
          type="button"
          className="auth-switch"
          onClick={() => switchMode(mode === 'register' ? 'login' : mode === 'reset' ? 'login' : 'register')}
        >
          {mode === 'login'
            ? '¿No tienes cuenta? Regístrate'
            : mode === 'register'
              ? '¿Ya tienes cuenta? Inicia sesión'
              : 'Volver a inicio de sesión'}
        </button>
      </form>
    </div>
  );
}