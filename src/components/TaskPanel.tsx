import { useEffect, useState } from 'react';
import { getTasks, type Task } from '../api/client';

interface Props {
  refreshTrigger: number;
  onReady?: () => void;
}

function isOverdue(task: Task): boolean {
  if (task.completed || !task.due_date) return false;
  return new Date(task.due_date) < new Date(new Date().toDateString());
}

export function TaskPanel({ refreshTrigger, onReady }: Props) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getTasks()
      .then((data) => {
        if (!cancelled) {
          setTasks(data);
          setError(false);
        }
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          onReady?.();
        }
      });
    return () => {
      cancelled = true;
    };
  }, [refreshTrigger]);

  const pending = tasks.filter((t) => !t.completed);
  const completed = tasks.filter((t) => t.completed);

  return (
    <aside className="task-panel">
      <p className="task-panel-header">Tareas</p>

      {loading && tasks.length === 0 && <p className="task-panel-hint">Cargando...</p>}
      {error && <p className="task-panel-hint">No se pudieron cargar las tareas.</p>}
      {!loading && !error && tasks.length === 0 && (
        <p className="task-panel-hint">No tienes tareas todavía.</p>
      )}

      {pending.length > 0 && (
        <ul className="task-list">
          {pending.map((t) => {
            const overdue = isOverdue(t);
            return (
              <li key={t.id} className="task-item">
                <span className={`task-dot ${overdue ? 'overdue' : 'pending'}`} />
                <span className="task-title">{t.title}</span>
                {t.due_date && <span className={`task-due ${overdue ? 'overdue' : ''}`}>{t.due_date}</span>}
                {t.source === 'github' && <span className="task-badge">GitHub</span>}
              </li>
            );
          })}
        </ul>
      )}

      {completed.length > 0 && (
        <>
          <h3>Completadas</h3>
          <ul className="task-list">
            {completed.map((t) => (
              <li key={t.id} className="task-item task-item-done">
                <span className="task-dot done" />
                <span className="task-title">{t.title}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </aside>
  );
}