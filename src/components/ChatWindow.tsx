import { useEffect, useState } from 'react';
import { sendMessage, getMessages, type ChatMessage } from '../api/client';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';

interface Props {
  onTasksChanged?: () => void;
}

export function ChatWindow({ onTasksChanged }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getMessages()
      .then(setMessages)
      .catch(() => {})
      .finally(() => setLoadingHistory(false));
  }, []);

  async function handleSend(text: string) {
    setMessages((prev) => [...prev, { role: 'user', content: text }, { role: 'assistant', content: '' }]);
    setLoading(true);

    try {
      await sendMessage(text, (chunk) => {
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          updated[updated.length - 1] = { ...last, content: last.content + chunk };
          return updated;
        });
      });
      onTasksChanged?.();
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'assistant', content: 'Error al contactar con el agente.' };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="chat-window">
      <div className="messages">
        {loadingHistory && <p className="task-panel-hint">Cargando conversación...</p>}
        {messages.map((m, i) => (
          <MessageBubble key={i} message={m.content === '' ? { ...m, content: 'Pensando...' } : m} />
        ))}
      </div>
      <MessageInput onSend={handleSend} disabled={loading} />
    </div>
  );
}