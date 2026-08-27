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
