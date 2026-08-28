const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function sendMessage(message: string, history: ChatMessage[]): Promise<string> {
  const res = await fetch(`${API_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history })
  });

  if (!res.ok) {
    throw new Error('Error al comunicarse con el agente');
  }

  const data = await res.json();
  return data.reply as string;
}

export interface Task {
  id: number;
  title: string;
  description: string | null;
  due_date: string | null;
  completed: boolean;
  source: 'manual' | 'github';
}

export async function getTasks(): Promise<Task[]> {
  const res = await fetch(`${API_URL}/tasks`);
  if (!res.ok) {
    throw new Error('Error al obtener las tareas');
  }
  const data = await res.json();
  return data.tasks as Task[];
}

export interface ReminderCheck {
  checked_at: string;
  urgent_count: number;
  email_sent: boolean;
}

export async function getLastReminderCheck(): Promise<ReminderCheck | null> {
  const res = await fetch(`${API_URL}/reminders/last`);
  if (!res.ok) {
    throw new Error('Error al obtener el estado de recordatorios');
  }
  const data = await res.json();
  return data.lastCheck as ReminderCheck | null;
}
