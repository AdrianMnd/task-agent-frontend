import { useRef, useState, type FormEvent } from 'react';
import { transcribeAudio } from '../api/client';

interface Props {
  onSend: (text: string) => void;
  disabled?: boolean;
}

const canRecordAudio = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;

const SILENCE_THRESHOLD = 8;
const SILENCE_DURATION_MS = 1500;
const MAX_RECORDING_MS = 30000;

export function MessageInput({ onSend, disabled }: Props) {
  const [value, setValue] = useState('');
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const maxDurationTimeoutRef = useRef<number | null>(null);

  function cleanupAudioAnalysis() {
    if (animationFrameRef.current !== null) cancelAnimationFrame(animationFrameRef.current);
    if (maxDurationTimeoutRef.current !== null) window.clearTimeout(maxDurationTimeoutRef.current);
    audioContextRef.current?.close().catch(() => {});
    audioContextRef.current = null;
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    cleanupAudioAnalysis();
    setRecording(false);
  }

  async function startRecording() {
    setVoiceError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType });
        setTranscribing(true);
        try {
          const text = await transcribeAudio(blob);
          if (text) onSend(text);
        } catch (err) {
          setVoiceError(err instanceof Error ? err.message : 'Error al transcribir el audio');
        } finally {
          setTranscribing(false);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setRecording(true);

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);

      const data = new Uint8Array(analyser.frequencyBinCount);
      let silenceStartedAt: number | null = null;
      let hasDetectedSpeech = false;

      function checkVolume() {
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          sum += Math.abs(data[i] - 128);
        }
        const volume = sum / data.length;

        if (volume > SILENCE_THRESHOLD) {
          hasDetectedSpeech = true;
          silenceStartedAt = null;
        } else if (hasDetectedSpeech) {
          if (silenceStartedAt === null) {
            silenceStartedAt = Date.now();
          } else if (Date.now() - silenceStartedAt > SILENCE_DURATION_MS) {
            stopRecording();
            return;
          }
        }

        animationFrameRef.current = requestAnimationFrame(checkVolume);
      }

      animationFrameRef.current = requestAnimationFrame(checkVolume);
      maxDurationTimeoutRef.current = window.setTimeout(stopRecording, MAX_RECORDING_MS);
    } catch {
      setVoiceError('No se pudo acceder al micrófono (revisa los permisos del navegador)');
    }
  }

  function toggleRecording() {
    if (recording) {
      stopRecording();
    } else {
      startRecording();
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    onSend(value.trim());
    setValue('');
  }

  const busy = disabled || transcribing;

  return (
    <div>
      <form className="message-input" onSubmit={handleSubmit}>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={
            recording ? 'Escuchando...' : transcribing ? 'Transcribiendo audio...' : 'Escribe una tarea o pregunta...'
          }
          disabled={busy}
        />
        {canRecordAudio && (
          <button
            type="button"
            className={`mic-button ${recording ? 'listening' : ''}`}
            onClick={toggleRecording}
            disabled={busy}
            title={recording ? 'Detener grabación (o espera al silencio)' : 'Hablar'}
          >
            🎤
          </button>
        )}
        <button type="submit" disabled={busy}>
          Enviar
        </button>
      </form>
      {voiceError && <p className="voice-error">Error de voz: {voiceError}</p>}
    </div>
  );
}