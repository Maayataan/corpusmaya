import { useEffect, useRef, useState } from 'react';
import { Mic, Pause, Play, RotateCcw, Square, Trash2 } from 'lucide-react';
import type WaveSurfer from 'wavesurfer.js';
import type RecordPlugin from 'wavesurfer.js/plugins/record';

type RecorderStatus = 'loading' | 'ready' | 'requesting' | 'recording' | 'recorded' | 'error' | 'unsupported';

interface VoiceRecorderProps {
  onRecordingChange: (recording: Blob | null) => void;
  maxSeconds?: number;
}

export function formatRecordingTime(durationMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function getRecordingErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message.toLowerCase() : '';
  if (message.includes('notallowed') || message.includes('permission') || message.includes('denied')) {
    return 'El micrófono está bloqueado. Actívalo en los permisos del navegador y vuelve a intentarlo.';
  }
  if (message.includes('notfound') || message.includes('no available adapters') || message.includes('device')) {
    return 'No encontramos un micrófono disponible. Revisa que esté conectado o contribuye sólo con texto.';
  }
  if (message.includes('notreadable') || message.includes('could not start')) {
    return 'Otra aplicación parece estar usando el micrófono. Ciérrala y vuelve a intentarlo.';
  }
  return 'No pudimos iniciar la grabación. Puedes volver a intentarlo o contribuir sólo con texto.';
}

function preferredMimeType(): string | undefined {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type));
}

export default function VoiceRecorder({ onRecordingChange, maxSeconds = 60 }: VoiceRecorderProps) {
  const waveformRef = useRef<HTMLDivElement>(null);
  const waveSurferRef = useRef<WaveSurfer | null>(null);
  const recordPluginRef = useRef<RecordPlugin | null>(null);
  const discardOnEndRef = useRef(false);
  const [status, setStatus] = useState<RecorderStatus>('loading');
  const [durationMs, setDurationMs] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (
      typeof window === 'undefined'
      || typeof MediaRecorder === 'undefined'
      || !navigator.mediaDevices?.getUserMedia
      || !waveformRef.current
    ) {
      setStatus('unsupported');
      return;
    }

    let cancelled = false;
    let unsubscribe: Array<() => void> = [];

    async function setup() {
      try {
        const [{ default: WaveSurferRuntime }, { default: RecordPluginRuntime }] = await Promise.all([
          import('wavesurfer.js'),
          import('wavesurfer.js/plugins/record'),
        ]);
        if (cancelled || !waveformRef.current) return;

        const rootStyles = getComputedStyle(document.documentElement);
        const wavesurfer = WaveSurferRuntime.create({
          container: waveformRef.current,
          height: 72,
          waveColor: rootStyles.getPropertyValue('--text-muted').trim() || '#6B6560',
          progressColor: rootStyles.getPropertyValue('--primary').trim() || '#1B6B5A',
          cursorColor: rootStyles.getPropertyValue('--primary').trim() || '#1B6B5A',
          cursorWidth: 2,
          barWidth: 3,
          barGap: 3,
          barRadius: 0,
          barMinHeight: 2,
          normalize: true,
          interact: false,
        });
        const record = wavesurfer.registerPlugin(RecordPluginRuntime.create({
          mimeType: preferredMimeType(),
          audioBitsPerSecond: 64_000,
          continuousWaveform: true,
          continuousWaveformDuration: maxSeconds,
          renderRecordedAudio: true,
          mediaRecorderTimeslice: 250,
        }));

        waveSurferRef.current = wavesurfer;
        recordPluginRef.current = record;

        unsubscribe = [
          record.on('record-start', () => {
            setDurationMs(0);
            setStatus('recording');
          }),
          record.on('record-progress', (duration) => {
            setDurationMs(duration);
            if (duration >= maxSeconds * 1000 && record.isRecording()) record.stopRecording();
          }),
          record.on('record-end', (blob) => {
            if (discardOnEndRef.current) {
              discardOnEndRef.current = false;
              wavesurfer.empty();
              setDurationMs(0);
              setStatus('ready');
              return;
            }
            onRecordingChange(blob);
            setDurationMs(record.getDuration());
            setStatus('recorded');
            queueMicrotask(() => wavesurfer.setOptions({ interact: true }));
          }),
          wavesurfer.on('play', () => setIsPlaying(true)),
          wavesurfer.on('pause', () => setIsPlaying(false)),
          wavesurfer.on('finish', () => setIsPlaying(false)),
        ];
        setStatus('ready');
      } catch (error) {
        setErrorMessage(getRecordingErrorMessage(error));
        setStatus('error');
      }
    }

    void setup();
    return () => {
      cancelled = true;
      unsubscribe.forEach((off) => off());
      waveSurferRef.current?.destroy();
      waveSurferRef.current = null;
      recordPluginRef.current = null;
    };
  }, [maxSeconds, onRecordingChange]);

  async function startRecording() {
    const record = recordPluginRef.current;
    const wavesurfer = waveSurferRef.current;
    if (!record || !wavesurfer) return;

    try {
      wavesurfer.pause();
      wavesurfer.empty();
      wavesurfer.setOptions({ interact: false });
      onRecordingChange(null);
      setDurationMs(0);
      setIsPlaying(false);
      setErrorMessage('');
      setStatus('requesting');
      await record.startRecording({
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        channelCount: 1,
      });
    } catch (error) {
      record.stopMic();
      setErrorMessage(getRecordingErrorMessage(error));
      setStatus('error');
    }
  }

  function stopRecording() {
    recordPluginRef.current?.stopRecording();
  }

  function cancelRecording() {
    const record = recordPluginRef.current;
    if (!record) return;
    discardOnEndRef.current = true;
    record.stopRecording();
    record.stopMic();
    onRecordingChange(null);
  }

  function discardRecording() {
    waveSurferRef.current?.stop();
    waveSurferRef.current?.empty();
    onRecordingChange(null);
    setDurationMs(0);
    setIsPlaying(false);
    setErrorMessage('');
    setStatus('ready');
  }

  async function togglePlayback() {
    await waveSurferRef.current?.playPause();
  }

  const formattedDuration = formatRecordingTime(durationMs);
  const formattedLimit = formatRecordingTime(maxSeconds * 1000);

  if (status === 'unsupported') {
    return (
      <p className="voice-recorder__unsupported">
        Este navegador no permite grabar aquí. Puedes contribuir sólo con texto.
      </p>
    );
  }

  return (
    <div className={`voice-recorder voice-recorder--${status}`} role="group" aria-label="Grabadora de voz">
      <p className="voice-recorder__hint">
        Di la misma frase en maya. Podrás escucharla antes de enviarla.
      </p>

      <div className="voice-note">
        {status === 'recorded' && (
          <button
            type="button"
            className="voice-note__icon-button voice-note__play"
            onClick={togglePlayback}
            aria-label={isPlaying ? 'Pausar grabación' : 'Reproducir grabación'}
          >
            {isPlaying ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
          </button>
        )}

        <div className="voice-note__content">
          <div ref={waveformRef} className="voice-note__waveform" aria-hidden="true" />
          <div className="voice-note__meta" aria-live="polite">
            <span>
              {status === 'recording' && <span className="voice-note__live-dot" aria-hidden="true" />}
              {status === 'loading' && 'Preparando grabadora…'}
              {status === 'ready' && 'Lista para grabar'}
              {status === 'requesting' && 'Esperando permiso del micrófono…'}
              {status === 'recording' && 'Grabando'}
              {status === 'recorded' && 'Grabación lista'}
              {status === 'error' && 'No se pudo grabar'}
            </span>
            <span className="voice-note__time">
              {formattedDuration} {status === 'recording' && `/ ${formattedLimit}`}
            </span>
          </div>
        </div>

        {status === 'recorded' && (
          <button
            type="button"
            className="voice-note__icon-button voice-note__delete"
            onClick={discardRecording}
            aria-label="Eliminar grabación"
          >
            <Trash2 aria-hidden="true" />
          </button>
        )}
      </div>

      {errorMessage && <p className="voice-recorder__error" role="alert">{errorMessage}</p>}

      <div className="voice-recorder__actions">
        {(status === 'ready' || status === 'error') && (
          <button type="button" className="voice-recorder__primary" onClick={startRecording}>
            <Mic aria-hidden="true" />
            {status === 'error' ? 'Intentar de nuevo' : 'Grabar nota de voz'}
          </button>
        )}
        {status === 'requesting' && (
          <button type="button" className="voice-recorder__primary" disabled>
            <Mic aria-hidden="true" />
            Abriendo micrófono…
          </button>
        )}
        {status === 'recording' && (
          <>
            <button type="button" className="voice-recorder__primary voice-recorder__stop" onClick={stopRecording}>
              <Square aria-hidden="true" />
              Detener y guardar
            </button>
            <button type="button" className="voice-recorder__secondary" onClick={cancelRecording}>
              Cancelar
            </button>
          </>
        )}
        {status === 'recorded' && (
          <button type="button" className="voice-recorder__secondary" onClick={startRecording}>
            <RotateCcw aria-hidden="true" />
            Grabar de nuevo
          </button>
        )}
      </div>

      <style>{`
        .voice-recorder {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }
        .voice-recorder__hint,
        .voice-recorder__unsupported {
          color: var(--text-muted);
          font-size: 0.85rem;
        }
        .voice-note {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          align-items: center;
          min-height: 112px;
          padding: var(--space-2);
          background: var(--card-bg);
          border: 1px solid var(--surface);
          border-radius: var(--radius);
        }
        .voice-note__content {
          min-width: 0;
        }
        .voice-note__waveform {
          min-height: 72px;
          position: relative;
          overflow: hidden;
        }
        .voice-note__waveform:empty::after {
          content: '';
          position: absolute;
          inset: 50% 0 auto;
          border-top: 2px solid var(--surface);
        }
        .voice-note__meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: var(--space-2);
          color: var(--text-muted);
          font-size: 0.75rem;
        }
        .voice-note__time {
          font-family: var(--font-mono);
          font-variant-numeric: tabular-nums;
          white-space: nowrap;
        }
        .voice-note__live-dot {
          display: inline-block;
          width: 9px;
          height: 9px;
          margin-right: var(--space-2);
          background: var(--error);
          border-radius: 50%;
          animation: recording-pulse 1.5s ease-in-out infinite;
        }
        .voice-note__icon-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border: 0;
          background: transparent;
          color: var(--primary);
          cursor: pointer;
        }
        .voice-note__icon-button svg,
        .voice-recorder__actions svg {
          width: 22px;
          height: 22px;
          stroke-width: 2;
        }
        .voice-note__delete {
          color: var(--error);
        }
        .voice-recorder__actions {
          display: flex;
          gap: var(--space-2);
          flex-wrap: wrap;
        }
        .voice-recorder__primary,
        .voice-recorder__secondary {
          display: inline-flex;
          min-height: 56px;
          align-items: center;
          justify-content: center;
          gap: var(--space-2);
          padding: var(--space-2) var(--space-3);
          border-radius: var(--radius);
          font-weight: 700;
          cursor: pointer;
        }
        .voice-recorder__primary {
          flex: 1 1 240px;
          color: white;
          background: var(--primary);
          border: 1px solid var(--primary);
        }
        .voice-recorder__primary:hover:not(:disabled) {
          background: var(--primary-hover);
        }
        .voice-recorder__primary:disabled {
          cursor: wait;
          opacity: 0.65;
        }
        .voice-recorder__stop {
          color: var(--text);
          background: var(--alive);
          border-color: var(--alive);
        }
        .voice-recorder__secondary {
          flex: 0 1 auto;
          color: var(--primary);
          background: transparent;
          border: 1px solid var(--primary);
        }
        .voice-recorder__error {
          color: var(--error);
          font-size: 0.85rem;
        }
        .voice-recorder button:focus-visible {
          outline: 3px solid var(--alive);
          outline-offset: 2px;
        }
        @keyframes recording-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.45; transform: scale(0.75); }
        }
        @media (max-width: 480px) {
          .voice-note {
            min-height: 104px;
          }
          .voice-note__waveform {
            min-height: 64px;
          }
          .voice-recorder__actions > * {
            width: 100%;
            flex-basis: 100%;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .voice-note__live-dot { animation: none; }
        }
      `}</style>
    </div>
  );
}
