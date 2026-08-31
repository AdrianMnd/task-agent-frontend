import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

const getLastReminderCheckMock = vi.fn();
vi.mock('../api/client', () => ({
  getLastReminderCheck: (...args: any[]) => getLastReminderCheckMock(...args)
}));

const { ReminderStatus } = await import('./ReminderStatus');

beforeEach(() => {
  getLastReminderCheckMock.mockReset();
});

describe('ReminderStatus', () => {
  it('no renderiza nada si no hay ninguna comprobacion aun', async () => {
    getLastReminderCheckMock.mockResolvedValue(null);
    const { container } = render(<ReminderStatus />);
    await waitFor(() => expect(getLastReminderCheckMock).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it('no renderiza nada si la peticion falla', async () => {
    getLastReminderCheckMock.mockRejectedValue(new Error('fail'));
    const { container } = render(<ReminderStatus />);
    await waitFor(() => expect(getLastReminderCheckMock).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it('muestra punto verde y cuenta de tareas cuando se envio un email', async () => {
    getLastReminderCheckMock.mockResolvedValue({
      checked_at: '2026-08-29T08:00:00Z',
      urgent_count: 2,
      email_sent: true
    });
    const { container } = render(<ReminderStatus />);
    await waitFor(() => expect(screen.getByText(/tarea\(s\) urgente\(s\), email enviado/)).toBeInTheDocument());
    expect(container.querySelector('.reminder-dot.sent')).toBeInTheDocument();
  });

  it('muestra punto neutro y "sin tareas urgentes" cuando no se envio nada', async () => {
    getLastReminderCheckMock.mockResolvedValue({
      checked_at: '2026-08-29T08:00:00Z',
      urgent_count: 0,
      email_sent: false
    });
    const { container } = render(<ReminderStatus />);
    await waitFor(() => expect(screen.getByText(/sin tareas urgentes/)).toBeInTheDocument());
    expect(container.querySelector('.reminder-dot.idle')).toBeInTheDocument();
  });
});
