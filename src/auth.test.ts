import { describe, it, expect, beforeEach } from 'vitest';
import { getToken, setToken, clearToken, getUser, setUser, clearUser } from './auth';

beforeEach(() => {
  localStorage.clear();
});

describe('token', () => {
  it('getToken devuelve null si no hay nada guardado', () => {
    expect(getToken()).toBeNull();
  });

  it('setToken/getToken guardan y recuperan el valor', () => {
    setToken('abc123');
    expect(getToken()).toBe('abc123');
  });

  it('clearToken elimina el token', () => {
    setToken('abc123');
    clearToken();
    expect(getToken()).toBeNull();
  });
});

describe('user', () => {
  it('getUser devuelve null si no hay nada guardado', () => {
    expect(getUser()).toBeNull();
  });

  it('setUser/getUser guardan y recuperan un objeto', () => {
    setUser({ id: 1, email: 'a@b.com' });
    expect(getUser()).toEqual({ id: 1, email: 'a@b.com' });
  });

  it('clearUser elimina el usuario', () => {
    setUser({ id: 1, email: 'a@b.com' });
    clearUser();
    expect(getUser()).toBeNull();
  });

  it('getUser devuelve null (no lanza) si el JSON guardado esta corrupto', () => {
    localStorage.setItem('task_agent_user', 'esto no es json valido{{{');
    expect(getUser()).toBeNull();
  });
});
