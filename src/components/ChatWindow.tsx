import { useState } from 'react';
import { sendMessage, type ChatMessage } from '../api/client';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';

interface Props {
  onTasksChanged?: () => void;
}

export function ChatWindow({ onTasksChanged }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleSend(text: string) {
    const nextHistory: ChatMessage[] = [...messages, { role: 'user', content: text }];
    setMessages(nextHistory);
    setLoading(true);
    try {
      const reply = await sendMessage(text, messages);
      setMessages([...nextHistory, { role: 'assistant', content: reply }]);
      // No sabemos si este mensaje cambio tareas o no (crear, completar, PRs...),
      // asi que simplemente refrescamos el panel siempre. Para un proyecto de este
      // tamaño es mas simple que intentar detectarlo desde la respuesta del agente.
      onTasksChanged?.();
    } catch {
      setMessages([...nextHistory, { role: 'assistant', content: 'Error al contactar con el agente.' }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="chat-window">
      <div className="messages">
        {messages.map((m, i) => (
          <MessageBubble key={i} message={m} />
        ))}
        {loading && <div className="message-bubble assistant">Pensando...</div>}
      </div>
      <MessageInput onSend={handleSend} disabled={loading} />
    </div>
  );
}
