import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  register,
  login,
  requestPasswordReset,
  sendMessage,
  getMessages,
  clearMessages,
  getTasks,
  getLastReminderCheck,
  transcribeAudio
} from './client';
import { setToken } from '../auth';

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

function jsonResponse(body: unknown, status = 200) {
  return { ok: status < 300, status, json: async () => body } as Response;
}

function makeStreamResponse(chunks: string[], status = 200) {
  let i = 0;
  const encoder = new TextEncoder();
  return {
    ok: status < 300,
    status,
    body: {
      getReader: () => ({
        read: async () => {
          if (i < chunks.length) {
            return { done: false, value: encoder.encode(chunks[i++]) };
          }
          return { done: true, value: undefined };
        }
      })
    }
  } as unknown as Response;
}

beforeEach(() => {
  fetchMock.mockReset();
  localStorage.clear();
  Object.defineProperty(window, 'location', {
    value: { reload: vi.fn() },
    writable: true
  });
});

describe('register / login / requestPasswordReset', () => {
  it('register hace POST y devuelve token + user', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ token: 't', user: { id: 1, email: 'a@b.com' } }));
    const result = await register('a@b.com', 'password123');
    expect(result).toEqual({ token: 't', user: { id: 1, email: 'a@b.com' } });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/auth/register'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('login con 401 lanza el mensaje del servidor SIN recargar la pagina', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: 'Credenciales incorrectas' }, 401));
    await expect(login('a@b.com', 'mala')).rejects.toThrow('Credenciales incorrectas');
    expect(window.location.reload).not.toHaveBeenCalled();
  });

  it('requestPasswordReset hace POST al endpoint correcto', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ requested: true }));
    await requestPasswordReset('a@b.com');
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/auth/request-reset'),
      expect.objectContaining({ method: 'POST' })
    );
  });
});

describe('sendMessage (streaming)', () => {
  it('invoca onChunk por cada trozo recibido, en orden', async () => {
    fetchMock.mockResolvedValueOnce(makeStreamResponse(['Hola ', 'mundo']));
    const chunks: string[] = [];
    await sendMessage('hola', (c) => chunks.push(c));
    expect(chunks).toEqual(['Hola ', 'mundo']);
  });

  it('con 401 limpia la sesion y recarga, sin llamar a onChunk', async () => {
    fetchMock.mockResolvedValueOnce({ status: 401, ok: false });
    const onChunk = vi.fn();
    await expect(sendMessage('hola', onChunk)).rejects.toThrow('Sesion caducada');
    expect(onChunk).not.toHaveBeenCalled();
    expect(window.location.reload).toHaveBeenCalled();
  });

  it('con error de servidor sin body de stream lanza el mensaje del servidor', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: 'Error interno del agente' }, 500));
    await expect(sendMessage('hola', vi.fn())).rejects.toThrow('Error interno del agente');
  });
});

describe('endpoints autenticados (getMessages, clearMessages, getTasks, getLastReminderCheck)', () => {
  it('getMessages añade el header Authorization si hay token', async () => {
    setToken('mi-token');
    fetchMock.mockResolvedValueOnce(jsonResponse({ messages: [{ role: 'user', content: 'hola' }] }));
    const result = await getMessages();
    expect(result).toEqual([{ role: 'user', content: 'hola' }]);
    const [, options] = fetchMock.mock.calls[0];
    expect(options.headers.Authorization).toBe('Bearer mi-token');
  });

  it('sin token no manda header de Authorization', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ messages: [] }));
    await getMessages();
    const [, options] = fetchMock.mock.calls[0];
    expect(options.headers).toEqual({});
  });

  it('clearMessages hace DELETE', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ cleared: true }));
    await clearMessages();
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/messages'), expect.objectContaining({ method: 'DELETE' }));
  });

  it('getTasks devuelve la lista de tareas', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ tasks: [{ id: 1, title: 'T' }] }));
    const result = await getTasks();
    expect(result).toEqual([{ id: 1, title: 'T' }]);
  });

  it('getLastReminderCheck devuelve null si no hay comprobaciones', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ lastCheck: null }));
    const result = await getLastReminderCheck();
    expect(result).toBeNull();
  });

  it('un 401 en cualquiera de estas rutas limpia sesion y recarga', async () => {
    fetchMock.mockResolvedValueOnce({ status: 401, ok: false, json: async () => ({}) });
    await expect(getTasks()).rejects.toThrow('Sesion caducada');
    expect(window.location.reload).toHaveBeenCalled();
  });
});

describe('transcribeAudio', () => {
  it('convierte el blob a base64 y lo manda junto al mimeType', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ text: 'texto transcrito' }));
    const blob = new Blob(['contenido-audio'], { type: 'audio/webm' });

    const result = await transcribeAudio(blob);

    expect(result).toBe('texto transcrito');
    const [, options] = fetchMock.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.mimeType).toBe('audio/webm');
    expect(typeof body.audio).toBe('string');
    expect(body.audio.length).toBeGreaterThan(0);
  });
});
