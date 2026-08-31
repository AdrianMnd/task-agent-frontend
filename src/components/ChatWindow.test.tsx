import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const getMessagesMock = vi.fn();
const sendMessageMock = vi.fn();
const clearMessagesMock = vi.fn();
vi.mock('../api/client', () => ({
  getMessages: (...args: any[]) => getMessagesMock(...args),
  sendMessage: (...args: any[]) => sendMessageMock(...args),
  clearMessages: (...args: any[]) => clearMessagesMock(...args)
}));

// jsdom no implementa scrollIntoView; el auto-scroll lo usa en cada actualizacion.
Element.prototype.scrollIntoView = vi.fn();

const { ChatWindow } = await import('./ChatWindow');

beforeEach(() => {
  getMessagesMock.mockReset();
  sendMessageMock.mockReset();
  clearMessagesMock.mockReset();
  getMessagesMock.mockResolvedValue([]);
});

describe('ChatWindow', () => {
  it('carga y muestra el historial guardado al montar', async () => {
    getMessagesMock.mockResolvedValue([
      { role: 'user', content: 'hola' },
      { role: 'assistant', content: 'hola, en que ayudo' }
    ]);
    render(<ChatWindow />);
    await waitFor(() => expect(screen.getByText('hola')).toBeInTheDocument());
    expect(screen.getByText('hola, en que ayudo')).toBeInTheDocument();
  });

  it('al enviar, rellena la respuesta progresivamente segun llegan los chunks', async () => {
    const user = userEvent.setup();
    sendMessageMock.mockImplementation(async (_msg: string, onChunk: (c: string) => void) => {
      onChunk('Hola ');
      onChunk('mundo');
    });

    render(<ChatWindow />);
    await waitFor(() => expect(getMessagesMock).toHaveBeenCalled());

    await user.type(screen.getByPlaceholderText('Escribe una tarea o pregunta...'), 'hola agente');
    await user.click(screen.getByRole('button', { name: 'Enviar' }));

    expect(await screen.findByText('hola agente')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Hola mundo')).toBeInTheDocument());
  });

  it('muestra "Pensando..." mientras la respuesta esta vacia (turnos que solo ejecutan herramientas)', async () => {
    const user = userEvent.setup();
    let resolveSend: () => void;
    sendMessageMock.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveSend = resolve;
        })
    );

    render(<ChatWindow />);
    await waitFor(() => expect(getMessagesMock).toHaveBeenCalled());
    await user.type(screen.getByPlaceholderText('Escribe una tarea o pregunta...'), 'algo');
    await user.click(screen.getByRole('button', { name: 'Enviar' }));

    expect(await screen.findByText('Pensando...')).toBeInTheDocument();
    await act(async () => {
      resolveSend!();
      await Promise.resolve();
    });
  });

  it('llama a onTasksChanged tras un envio correcto', async () => {
    const user = userEvent.setup();
    const onTasksChanged = vi.fn();
    sendMessageMock.mockResolvedValue(undefined);

    render(<ChatWindow onTasksChanged={onTasksChanged} />);
    await waitFor(() => expect(getMessagesMock).toHaveBeenCalled());
    await user.type(screen.getByPlaceholderText('Escribe una tarea o pregunta...'), 'hola');
    await user.click(screen.getByRole('button', { name: 'Enviar' }));

    await waitFor(() => expect(onTasksChanged).toHaveBeenCalled());
  });

  it('reporta onActiveChange(true) al empezar y onActiveChange(false) al terminar', async () => {
    const user = userEvent.setup();
    const onActiveChange = vi.fn();
    sendMessageMock.mockResolvedValue(undefined);

    render(<ChatWindow onActiveChange={onActiveChange} />);
    await waitFor(() => expect(getMessagesMock).toHaveBeenCalled());
    await user.type(screen.getByPlaceholderText('Escribe una tarea o pregunta...'), 'hola');
    await user.click(screen.getByRole('button', { name: 'Enviar' }));

    await waitFor(() => expect(onActiveChange).toHaveBeenNthCalledWith(1, true));
    await waitFor(() => expect(onActiveChange).toHaveBeenLastCalledWith(false));
  });

  it('muestra un mensaje de error si sendMessage falla', async () => {
    const user = userEvent.setup();
    sendMessageMock.mockRejectedValue(new Error('network error'));

    render(<ChatWindow />);
    await waitFor(() => expect(getMessagesMock).toHaveBeenCalled());
    await user.type(screen.getByPlaceholderText('Escribe una tarea o pregunta...'), 'hola');
    await user.click(screen.getByRole('button', { name: 'Enviar' }));

    expect(await screen.findByText('Error al contactar con el agente.')).toBeInTheDocument();
  });

  it('el boton Limpiar borra la conversacion (servidor + estado local)', async () => {
    const user = userEvent.setup();
    getMessagesMock.mockResolvedValue([{ role: 'user', content: 'hola' }]);
    clearMessagesMock.mockResolvedValue(undefined);

    render(<ChatWindow />);
    await waitFor(() => expect(screen.getByText('hola')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Limpiar' }));

    expect(clearMessagesMock).toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByText('hola')).not.toBeInTheDocument());
  });

  it('el boton Limpiar esta deshabilitado si no hay mensajes', async () => {
    render(<ChatWindow />);
    await waitFor(() => expect(getMessagesMock).toHaveBeenCalled());
    expect(screen.getByRole('button', { name: 'Limpiar' })).toBeDisabled();
  });
});
