import { useEffect, useRef, useState } from 'react';
import { sendMessage, getMessages, clearMessages, type ChatMessage } from '../api/client';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';

interface Props {
  onTasksChanged?: () => void;
  onActiveChange?: (active: boolean) => void;
  onReady?: () => void;
}

export function ChatWindow({ onTasksChanged, onActiveChange, onReady }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getMessages()
      .then(setMessages)
      .catch(() => {})
      .finally(() => {
        setLoadingHistory(false);
        onReady?.();
      });
  }, []);

  // Scroll automatico: cada vez que cambia la conversacion (mensaje nuevo,
  // o un trozo mas de texto llegando por streaming), seguimos al final.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  async function handleSend(text: string) {
    setMessages((prev) => [...prev, { role: 'user', content: text }, { role: 'assistant', content: '' }]);
    setLoading(true);
    onActiveChange?.(true);

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
      onActiveChange?.(false);
    }
  }

  async function handleClear() {
    try {
      await clearMessages();
      setMessages([]);
    } catch {
      // Si falla el borrado en el servidor, dejamos la conversacion tal cual.
    }
  }

  return (
    <div className="chat-window">
      <div className="chat-header">
        <span className="chat-header-label">Conversación</span>
        <button className="clear-chat-button" onClick={handleClear} disabled={loading || messages.length === 0}>
          Limpiar
        </button>
      </div>
      <div className="messages">
        {loadingHistory && <p className="task-panel-hint">Cargando conversación...</p>}
        {messages.map((m, i) => (
          <MessageBubble key={i} message={m.content === '' ? { ...m, content: 'Pensando...' } : m} />
        ))}
        <div ref={messagesEndRef} />
      </div>
      <MessageInput onSend={handleSend} disabled={loading} />
    </div>
  );
}