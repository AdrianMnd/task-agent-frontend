import { getToken, clearToken } from '../auth';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface Task {
  id: number;
  title: string;
  description: string | null;
  due_date: string | null;
  completed: boolean;
  source: 'manual' | 'github';
}

export interface ReminderCheck {
  checked_at: string;
  urgent_count: number;
  email_sent: boolean;
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 401) {
    // Token caducado o invalido: limpiamos y forzamos volver a la pantalla de login.
    clearToken();
    window.location.reload();
    throw new Error('Sesion caducada');
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Error de red');
  }
  return res.json();
}

export async function register(email: string, password: string): Promise<{ token: string }> {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return handleResponse(res);
}

export async function login(email: string, password: string): Promise<{ token: string }> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return handleResponse(res);
}

export async function sendMessage(message: string): Promise<string> {
  const res = await fetch(`${API_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ message })
  });
  const data = await handleResponse<{ reply: string }>(res);
  return data.reply;
}

export async function getMessages(): Promise<ChatMessage[]> {
  const res = await fetch(`${API_URL}/messages`, { headers: authHeaders() });
  const data = await handleResponse<{ messages: ChatMessage[] }>(res);
  return data.messages;
}

export async function getTasks(): Promise<Task[]> {
  const res = await fetch(`${API_URL}/tasks`, { headers: authHeaders() });
  const data = await handleResponse<{ tasks: Task[] }>(res);
  return data.tasks;
}

export async function getLastReminderCheck(): Promise<ReminderCheck | null> {
  const res = await fetch(`${API_URL}/reminders/last`, { headers: authHeaders() });
  const data = await handleResponse<{ lastCheck: ReminderCheck | null }>(res);
  return data.lastCheck;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1] ?? '');
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function transcribeAudio(blob: Blob): Promise<string> {
  const base64 = await blobToBase64(blob);
  const res = await fetch(`${API_URL}/transcribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ audio: base64, mimeType: blob.type })
  });
  const data = await handleResponse<{ text: string }>(res);
  return data.text;
}