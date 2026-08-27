import { useState, type FormEvent } from 'react';

interface Props {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export function MessageInput({ onSend, disabled }: Props) {
  const [value, setValue] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    onSend(value.trim());
    setValue('');
  }

  return (
    <form className="message-input" onSubmit={handleSubmit}>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Escribe una tarea o pregunta..."
        disabled={disabled}
      />
      <button type="submit" disabled={disabled}>
        Enviar
      </button>
    </form>
  );
}
