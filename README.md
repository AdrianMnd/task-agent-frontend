# Task Agent - Frontend

Interfaz de chat en React + TypeScript + Vite para hablar con el agente de tareas.

## Como se organiza el codigo

```
src/
  App.tsx                    -> layout raiz
  main.tsx                   -> entrypoint de React
  api/client.ts               -> llamada fetch a POST /api/chat
  components/
    ChatWindow.tsx           -> estado de la conversacion + orquesta el envio
    MessageBubble.tsx        -> burbuja de mensaje (usuario/asistente)
    MessageInput.tsx         -> input + boton de enviar
```

No hay gestion de estado externa (Redux/Zustand) a proposito: con `useState` en
`ChatWindow` es suficiente para esta fase y evita añadir complejidad innecesaria
mientras te familiarizas con React.

## Puesta en marcha

1. `npm install`
2. Copia `.env.example` a `.env` (por defecto ya apunta a `http://localhost:3001/api`)
3. `npm run dev` (arranca en `http://localhost:5173`)

Necesitas el backend corriendo en paralelo para que el chat responda.
