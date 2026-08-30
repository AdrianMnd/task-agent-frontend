import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MessageBubble } from './MessageBubble';

describe('MessageBubble', () => {
  it('renderiza un mensaje de usuario sin la etiqueta "Agente"', () => {
    render(<MessageBubble message={{ role: 'user', content: 'Hola' }} />);
    expect(screen.getByText('Hola')).toBeInTheDocument();
    expect(screen.queryByText('Agente')).not.toBeInTheDocument();
  });

  it('renderiza un mensaje del asistente con la etiqueta "Agente"', () => {
    render(<MessageBubble message={{ role: 'assistant', content: 'Hola, ¿en qué ayudo?' }} />);
    expect(screen.getByText('Agente')).toBeInTheDocument();
    expect(screen.getByText('Hola, ¿en qué ayudo?')).toBeInTheDocument();
  });

  it('aplica la clase "user" o "assistant" segun el rol', () => {
    const { container: userContainer } = render(<MessageBubble message={{ role: 'user', content: 'x' }} />);
    expect(userContainer.querySelector('.message-bubble.user')).toBeInTheDocument();

    const { container: agentContainer } = render(
      <MessageBubble message={{ role: 'assistant', content: 'x' }} />
    );
    expect(agentContainer.querySelector('.message-bubble.assistant')).toBeInTheDocument();
  });
});
