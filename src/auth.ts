// Almacenamiento del token de sesion. localStorage es apropiado aqui porque esta
// es una app real desplegada (no un artifact de Claude), donde localStorage
// funciona con normalidad.
const TOKEN_KEY = 'task_agent_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}
