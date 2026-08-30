import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MessageInput } from './MessageInput';

describe('MessageInput', () => {
  it('envia el texto escrito y limpia el input', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<MessageInput onSend={onSend} />);

    const input = screen.getByPlaceholderText('Escribe una tarea o pregunta...') as HTMLInputElement;
    await user.type(input, 'crea una tarea');
    await user.click(screen.getByRole('button', { name: 'Enviar' }));

    expect(onSend).toHaveBeenCalledWith('crea una tarea');
    expect(input.value).toBe('');
  });

  it('no envia si el input esta vacio o solo tiene espacios', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<MessageInput onSend={onSend} />);

    await user.type(screen.getByPlaceholderText('Escribe una tarea o pregunta...'), '   ');
    await user.click(screen.getByRole('button', { name: 'Enviar' }));

    expect(onSend).not.toHaveBeenCalled();
  });

  it('deshabilita input y boton cuando disabled=true', () => {
    render(<MessageInput onSend={vi.fn()} disabled />);
    expect(screen.getByPlaceholderText('Escribe una tarea o pregunta...')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Enviar' })).toBeDisabled();
  });

  it('sin soporte de MediaRecorder/getUserMedia en el entorno, no muestra el boton de micro', () => {
    // jsdom no implementa navigator.mediaDevices por defecto, que es exactamente
    // el caso real de un navegador sin soporte: el boton no debe aparecer.
    render(<MessageInput onSend={vi.fn()} />);
    expect(screen.queryByTitle('Hablar')).not.toBeInTheDocument();
  });
});
