import { useState, type FormEvent } from 'react';
import { login, register } from '../api/client';
import { setToken, setUser } from '../auth';

interface Props {
  onAuthenticated: () => void;
}

export function LoginForm({ onAuthenticated }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { token, user } = mode === 'login' ? await login(email, password) : await register(email, password);
      setToken(token);
      setUser(user);
      onAuthenticated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Algo ha ido mal');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-screen">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h1>Task Agent</h1>
        <p className="auth-subtitle">{mode === 'login' ? 'Inicia sesión' : 'Crea una cuenta'}</p>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Contraseña (mín. 8 caracteres)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
        />

        {error && <p className="auth-error">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? 'Cargando...' : mode === 'login' ? 'Entrar' : 'Registrarme'}
        </button>
        <button type="button" className="auth-switch" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
          {mode === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
        </button>
      </form>
    </div>
  );
}
