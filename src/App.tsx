import { useState } from 'react';
import { ChatWindow } from './components/ChatWindow';
import { TaskPanel } from './components/TaskPanel';
import { ReminderStatus } from './components/ReminderStatus';
import { LoginForm } from './components/LoginForm';
import { getToken, clearToken, getUser, clearUser } from './auth';
import './styles.css';

function App() {
  const [authed, setAuthed] = useState(() => Boolean(getToken()));
  const [user, setUserState] = useState(() => getUser());
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [agentActive, setAgentActive] = useState(false);
  const [mobileTab, setMobileTab] = useState<'chat' | 'tasks'>('chat');

  if (!authed) {
    return (
      <LoginForm
        onAuthenticated={() => {
          setUserState(getUser());
          setAuthed(true);
        }}
      />
    );
  }

  function handleLogout() {
    clearToken();
    clearUser();
    setAuthed(false);
  }

  return (
    <div className="app">
      <div className="app-header">
        <div className="app-title-group">
          <img src="/logo.svg" alt="" className="app-logo" />
          <p className="app-title">Task Agent</p>
        </div>
        <div className="header-right">
          <span className="app-session">{user?.email ?? 'sesión activa'}</span>
          <button className="logout-button" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </div>

      {/* Piloto de actividad: se enciende mientras el agente piensa o ejecuta una herramienta. */}
      <div className={`status-strip ${agentActive ? 'active' : ''}`}>
        <div className="status-strip-fill" />
      </div>

      <ReminderStatus />

      <div className="mobile-tabs">
        <button
          className={`mobile-tab ${mobileTab === 'chat' ? 'active' : ''}`}
          onClick={() => setMobileTab('chat')}
        >
          Chat
        </button>
        <button
          className={`mobile-tab ${mobileTab === 'tasks' ? 'active' : ''}`}
          onClick={() => setMobileTab('tasks')}
        >
          Tareas
        </button>
      </div>

      <div className="layout">
        <div className={`chat-pane ${mobileTab === 'chat' ? 'active' : ''}`}>
          <ChatWindow
            onTasksChanged={() => setRefreshTrigger((n) => n + 1)}
            onActiveChange={setAgentActive}
          />
        </div>
        <div className={`task-pane ${mobileTab === 'tasks' ? 'active' : ''}`}>
          <TaskPanel refreshTrigger={refreshTrigger} />
        </div>
      </div>
    </div>
  );
}

export default App;
