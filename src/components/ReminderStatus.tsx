import { useEffect, useState } from 'react';
import { getLastReminderCheck, type ReminderCheck } from '../api/client';

export function ReminderStatus() {
  const [check, setCheck] = useState<ReminderCheck | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getLastReminderCheck()
      .then(setCheck)
      .catch(() => setCheck(null))
      .finally(() => setLoaded(true));
  }, []);

  if (!loaded || !check) return null;

  const date = new Date(check.checked_at).toLocaleString('es-ES', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });

  const message = check.email_sent
    ? `${check.urgent_count} tarea(s) urgente(s), email enviado`
    : 'sin tareas urgentes';

  return (
    <p className="reminder-status">
      Última comprobación automática: {date} — {message}
    </p>
  );
}
