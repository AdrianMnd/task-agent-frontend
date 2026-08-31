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
  const [chatReady, setChatReady] = useState(false);
  const [tasksReady, setTasksReady] = useState(false);

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

  // Mientras el chat y las tareas no han terminado su primera carga, se muestra
  // una pantalla de bienvenida en vez del layout vacio. ChatWindow y TaskPanel
  // siguen montados (con visibility:hidden) para que su fetch inicial arranque
  // en paralelo desde el primer render, no despues de ocultar esta pantalla.
  const appReady = chatReady && tasksReady;

  return (
    <div className="app">
      {!appReady && (
        <div className="loading-screen">
          <img src="/logo.svg" alt="" className="loading-logo" />
          <p className="loading-title">Task Agent</p>
        </div>
      )}

      <div style={{ visibility: appReady ? 'visible' : 'hidden' }}>
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
              onReady={() => setChatReady(true)}
            />
          </div>
          <div className={`task-pane ${mobileTab === 'tasks' ? 'active' : ''}`}>
            <TaskPanel refreshTrigger={refreshTrigger} onReady={() => setTasksReady(true)} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;