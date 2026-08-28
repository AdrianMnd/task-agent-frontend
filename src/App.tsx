import { useState } from 'react';
import { ChatWindow } from './components/ChatWindow';
import { TaskPanel } from './components/TaskPanel';
import { ReminderStatus } from './components/ReminderStatus';
import './styles.css';

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  return (
    <div className="app">
      <h1>Agente de Tareas</h1>
      <ReminderStatus />
      <div className="layout">
        <ChatWindow onTasksChanged={() => setRefreshTrigger((n) => n + 1)} />
        <TaskPanel refreshTrigger={refreshTrigger} />
      </div>
    </div>
  );
}

export default App;