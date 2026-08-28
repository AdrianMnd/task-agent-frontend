import { useRef, useState, type FormEvent } from 'react';

interface Props {
  onSend: (text: string) => void;
  disabled?: boolean;
}

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: any) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
}

const SpeechRecognitionCtor: (new () => SpeechRecognitionLike) | undefined =
  typeof window !== 'undefined' ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition : undefined;

export function MessageInput({ onSend, disabled }: Props) {
  const [value, setValue] = useState('');
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  function toggleListening() {
    if (!SpeechRecognitionCtor) return;

    if (listening) {
      recognitionRef.current?.stop();
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = 'es-ES';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript as string;
      setValue((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

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
      {SpeechRecognitionCtor && (
        <button
          type="button"
          className={`mic-button ${listening ? 'listening' : ''}`}
          onClick={toggleListening}
          disabled={disabled}
          title={listening ? 'Detener grabación' : 'Hablar'}
        >
          🎤
        </button>
      )}
      <button type="submit" disabled={disabled}>
        Enviar
      </button>
    </form>
  );
}