import { useState } from 'react';
import { ChatWindow } from './components/ChatWindow';
import { TaskPanel } from './components/TaskPanel';
import { ReminderStatus } from './components/ReminderStatus';
import { LoginForm } from './components/LoginForm';
import { getToken, clearToken } from './auth';
import './styles.css';

function App() {
  const [authed, setAuthed] = useState(() => Boolean(getToken()));
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  if (!authed) {
    return <LoginForm onAuthenticated={() => setAuthed(true)} />;
  }

  function handleLogout() {
    clearToken();
    setAuthed(false);
  }

  return (
    <div className="app">
      <div className="app-header">
        <h1>Agente de Tareas</h1>
        <button className="logout-button" onClick={handleLogout}>
          Cerrar sesión
        </button>
      </div>
      <ReminderStatus />
      <div className="layout">
        <ChatWindow onTasksChanged={() => setRefreshTrigger((n) => n + 1)} />
        <TaskPanel refreshTrigger={refreshTrigger} />
      </div>
    </div>
  );
}

export default App;
