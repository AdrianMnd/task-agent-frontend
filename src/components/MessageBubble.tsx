import type { ChatMessage } from '../api/client';

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  return (
    <div className={`message-bubble ${isUser ? 'user' : 'assistant'}`}>
      {!isUser && <span className="message-agent-label">Agente</span>}
      {message.content}
    </div>
  );
}
