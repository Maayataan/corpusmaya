import { useEffect, useRef, useState } from 'react';
import { Lightbulb, RefreshCw, X } from 'lucide-react';
import { api } from '../lib/api';
import {
  getNextContributionPrompt,
  type ContributionPrompt,
} from '../lib/contributionPrompts';
import { Button, FormField } from './ui';
import Certificate from './Certificate';
import Turnstile from './Turnstile';
import VoiceRecorder from './VoiceRecorder';
import type { Dialect, Source } from '../lib/database.types';

type FormState = 'idle' | 'submitting' | 'success' | 'error';

const DIALECTS: { value: Dialect; label: string }[] = [
  { value: 'oriente', label: 'Oriente' },
  { value: 'noroccidente', label: 'Noroccidente' },
  { value: 'centro', label: 'Centro' },
  { value: 'sur', label: 'Sur' },
  { value: 'costa', label: 'Costa' },
  { value: 'otro', label: 'Otro / No sé' },
];

const SOURCES: { value: Source; label: string }[] = [
  { value: 'hablante_nativo', label: 'Hablante nativo' },
  { value: 'estudiante', label: 'Estudiante' },
  { value: 'academico', label: 'Académico' },
  { value: 'evento', label: 'Evento' },
  { value: 'otro', label: 'Otro' },
];

export default function ContributionForm() {
  const [state, setState] = useState<FormState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [mayaText, setMayaText] = useState('');
  const [spanishTranslation, setSpanishTranslation] = useState('');
  const [contributorName, setContributorName] = useState('');
  const [dialect, setDialect] = useState<Dialect>('oriente');
  const [source, setSource] = useState<Source>('hablante_nativo');
  const [consent, setConsent] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [successData, setSuccessData] = useState<{ entryNumber: number; totalCount: number } | null>(null);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileRevision, setTurnstileRevision] = useState(0);
  const [selectedPrompt, setSelectedPrompt] = useState<ContributionPrompt | null>(null);
  const [showAudioConfirmation, setShowAudioConfirmation] = useState(false);
  const audioSectionRef = useRef<HTMLDivElement>(null);
  const audioConfirmationRef = useRef<HTMLDivElement>(null);
  const submissionStartedRef = useRef(false);

  useEffect(() => {
    if (!showAudioConfirmation) return;
    audioConfirmationRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
  }, [showAudioConfirmation]);

  function validateContribution(): boolean {
    if (!mayaText.trim() || !spanishTranslation.trim() || !contributorName.trim()) {
      setErrorMsg('Completa todos los campos obligatorios.');
      return false;
    }
    if (!consent) {
      setErrorMsg('Debes dar tu consentimiento para contribuir.');
      return false;
    }
    if (!turnstileToken) {
      setErrorMsg('Completa la verificación de seguridad.');
      return false;
    }
    return true;
  }

  async function submitContribution() {
    if (!validateContribution() || submissionStartedRef.current) {
      setShowAudioConfirmation(false);
      return;
    }
    submissionStartedRef.current = true;
    setShowAudioConfirmation(false);

    setState('submitting');
    setErrorMsg('');

    try {
      const form = new FormData();
      form.set('mayaText', mayaText.trim());
      form.set('spanishTranslation', spanishTranslation.trim());
      form.set('contributorName', contributorName.trim());
      form.set('dialect', dialect);
      form.set('source', source);
      form.set('consent', 'true');
      form.set('turnstileToken', turnstileToken);
      if (selectedPrompt) form.set('promptTopic', selectedPrompt.id);
      if (audioBlob) {
        form.set('audio', audioBlob, `grabacion.${audioBlob.type.includes('mp4') ? 'm4a' : 'webm'}`);
      }

      const result = await api<{ entryNumber: number; totalCount: number }>('/api/contributions', {
        method: 'POST',
        body: form,
      });
      setSuccessData(result);
      setState('success');
    } catch (err) {
      submissionStartedRef.current = false;
      setErrorMsg(err instanceof Error ? err.message : 'Error al enviar. Intenta de nuevo.');
      setState('error');
      setTurnstileToken('');
      setTurnstileRevision((revision) => revision + 1);
    }
  }

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    e.preventDefault();
    if (!validateContribution()) return;
    if (!audioBlob) {
      setErrorMsg('');
      setShowAudioConfirmation(true);
      return;
    }
    void submitContribution();
  }

  function returnToAudioRecorder() {
    setShowAudioConfirmation(false);
    requestAnimationFrame(() => {
      audioSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      audioSectionRef.current
        ?.querySelector<HTMLButtonElement>('button:not([disabled])')
        ?.focus({ preventScroll: true });
    });
  }

  function handleReset() {
    setState('idle');
    setMayaText('');
    setSpanishTranslation('');
    setAudioBlob(null);
    setSelectedPrompt(null);
    setShowAudioConfirmation(false);
    setSuccessData(null);
    setErrorMsg('');
    setTurnstileToken('');
    setTurnstileRevision((revision) => revision + 1);
    submissionStartedRef.current = false;
  }

  if (state === 'success' && successData) {
    return (
      <div className="success-screen">
        <p className="success-maya">A t'aane' k'a'abéet</p>
        <p className="success-es">Tu voz importa</p>
        <Certificate
          contributorName={contributorName}
          entryNumber={successData.entryNumber}
          totalCount={successData.totalCount}
        />
        <Button variant="primary" onClick={handleReset}>
          Contribuir otra vez
        </Button>

        <div className="sumate-invite">
          <p className="sumate-invite-text">¿Quieres estar más cerca de la comunidad?</p>
          <a href="/hablantes" className="sumate-invite-link">
            Regístrate como hablante y ayúdanos a validar →
          </a>
        </div>
        <style>{`
          .success-screen { text-align: center; }
          .success-maya {
            font-size: 1.5rem;
            font-weight: 700;
            margin-bottom: var(--space-1);
          }
          .success-es {
            color: var(--text-muted);
            margin-bottom: var(--space-4);
          }
          .sumate-invite {
            margin-top: var(--space-5);
            padding: var(--space-3);
            border: 1px solid var(--surface);
            border-radius: var(--radius);
            background: var(--card-bg);
          }
          .sumate-invite-text {
            font-family: var(--font-display);
            font-weight: 700;
            font-size: 0.95rem;
            margin-bottom: var(--space-2);
          }
          .sumate-invite-link {
            font-size: 0.9rem;
            color: var(--primary);
            font-weight: 600;
          }
        `}</style>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="contribution-form">
      <FormField label="A t'aan" sublabel="Tu texto en maya" htmlFor="maya-text">
        {!selectedPrompt ? (
          <button
            type="button"
            className="idea-trigger"
            onClick={() => setSelectedPrompt(getNextContributionPrompt())}
          >
            <Lightbulb aria-hidden="true" />
            ¿No sabes sobre qué contribuir? Te damos una idea
          </button>
        ) : (
          <div className="idea-card" aria-live="polite">
            <div>
              <p className="idea-card__eyebrow">Una idea para empezar</p>
              <p className="idea-card__title">{selectedPrompt.title}</p>
              <p className="idea-card__prompt">{selectedPrompt.prompt}</p>
            </div>
            <div className="idea-card__actions">
              <button
                type="button"
                onClick={() => setSelectedPrompt(getNextContributionPrompt(selectedPrompt.id))}
              >
                <RefreshCw aria-hidden="true" />
                Otra idea
              </button>
              <button type="button" onClick={() => setSelectedPrompt(null)}>
                <X aria-hidden="true" />
                Aportar libremente
              </button>
            </div>
          </div>
        )}
        <textarea
          id="maya-text"
          value={mayaText}
          onChange={(e) => setMayaText(e.target.value)}
          placeholder="Escribe una frase, palabra o expresión en maya yucateco"
          rows={3}
          maxLength={2000}
          required
        />
      </FormField>

      <FormField label="U tsikbal ich kastelan t'aan" sublabel="Traducción al español" htmlFor="spanish-translation">
        <textarea
          id="spanish-translation"
          value={spanishTranslation}
          onChange={(e) => setSpanishTranslation(e.target.value)}
          placeholder="Traducción o significado en español"
          rows={2}
          maxLength={2000}
          required
        />
      </FormField>

      <FormField label="A k'aaba'" sublabel="Tu nombre" htmlFor="contributor-name">
        <input
          type="text"
          id="contributor-name"
          value={contributorName}
          onChange={(e) => setContributorName(e.target.value)}
          placeholder="Nombre o seudónimo"
          maxLength={200}
          required
        />
      </FormField>

      <div className="form-row">
        <FormField label="Bix a t'aan" sublabel="Variante dialectal" htmlFor="dialect">
          <select
            id="dialect"
            value={dialect}
            onChange={(e) => setDialect(e.target.value as Dialect)}
          >
            {DIALECTS.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Tu'ux a kanik" sublabel="¿Cómo aprendiste?" htmlFor="source">
          <select
            id="source"
            value={source}
            onChange={(e) => setSource(e.target.value as Source)}
          >
            {SOURCES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </FormField>
      </div>

      <div ref={audioSectionRef} className="audio-section">
        <FormField label="U juum a t'aan" sublabel="Tu voz · Opcional">
          <p className={`audio-summary ${audioBlob ? 'audio-summary--included' : ''}`} aria-live="polite">
            {audioBlob
              ? 'Audio incluido y listo para enviar'
              : 'Sin audio · puedes enviar solamente el texto'}
          </p>
          <VoiceRecorder onRecordingChange={setAudioBlob} />
        </FormField>
      </div>

      <div className="form-field consent-field">
        <label>
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            required
          />
          <span>
            Autorizo almacenar y revisar mi contribución para integrarla al corpus
            de maya yucateco. La licencia y las condiciones de uso se documentarán
            por separado antes de cualquier publicación.
          </span>
        </label>
      </div>

      <Turnstile
        key={turnstileRevision}
        action="contribution"
        onToken={setTurnstileToken}
      />

      {errorMsg && (
        <p className="form-error" role="alert">{errorMsg}</p>
      )}

      <Button
        type="submit"
        variant="primary"
        disabled={state === 'submitting' || !turnstileToken}
      >
        {state === 'submitting' ? 'Enviando...' : 'Enviar contribución'}
      </Button>

      {showAudioConfirmation && (
        <div className="audio-confirmation-backdrop">
          <div
            ref={audioConfirmationRef}
            className="audio-confirmation"
            role="dialog"
            aria-modal="true"
            aria-labelledby="audio-confirmation-title"
            aria-describedby="audio-confirmation-description"
            onKeyDown={(event) => {
              if (event.key === 'Escape') returnToAudioRecorder();
            }}
          >
            <p id="audio-confirmation-title" className="audio-confirmation__title">
              Este aporte no incluye audio
            </p>
            <p id="audio-confirmation-description" className="audio-confirmation__description">
              El audio es opcional, aunque nos ayuda a conservar la pronunciación.
            </p>
            <div className="audio-confirmation__actions">
              <Button type="button" variant="primary" onClick={() => void submitContribution()}>
                Enviar sin audio
              </Button>
              <Button type="button" onClick={returnToAudioRecorder}>
                Volver y grabar
              </Button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .contribution-form {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-3);
        }
        .idea-trigger {
          display: inline-flex;
          align-items: center;
          gap: var(--space-2);
          width: 100%;
          min-height: 48px;
          margin-bottom: var(--space-2);
          padding: var(--space-2) var(--space-3);
          color: var(--primary);
          background: transparent;
          border: 1px solid var(--primary);
          border-radius: var(--radius);
          font-weight: 700;
          text-align: left;
          cursor: pointer;
        }
        .idea-trigger svg,
        .idea-card__actions svg {
          width: 20px;
          height: 20px;
          flex-shrink: 0;
        }
        .idea-card {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
          margin-bottom: var(--space-2);
          padding: var(--space-3);
          background: var(--surface);
          border-left: 4px solid var(--alive);
        }
        .idea-card__eyebrow {
          color: var(--text-muted);
          font-family: var(--font-mono);
          font-size: 0.7rem;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        .idea-card__title {
          margin: var(--space-1) 0;
          font-family: var(--font-display);
          font-size: 1.05rem;
          font-weight: 700;
        }
        .idea-card__prompt {
          color: var(--text-muted);
          font-size: 0.9rem;
        }
        .idea-card__actions {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-1) var(--space-3);
        }
        .idea-card__actions button {
          display: inline-flex;
          align-items: center;
          min-height: 48px;
          gap: var(--space-1);
          padding: var(--space-1) 0;
          color: var(--primary);
          background: transparent;
          border: 0;
          font-weight: 700;
          cursor: pointer;
        }
        .audio-section {
          scroll-margin: var(--space-5);
        }
        .audio-summary {
          margin-bottom: var(--space-2);
          color: var(--text-muted);
          font-size: 0.85rem;
          font-weight: 600;
        }
        .audio-summary--included {
          color: var(--success);
        }
        .audio-confirmation-backdrop {
          position: fixed;
          z-index: 1000;
          inset: 0;
          display: grid;
          place-items: end center;
          padding: var(--space-3);
          background: color-mix(in srgb, var(--text) 55%, transparent);
        }
        .audio-confirmation {
          width: min(100%, 520px);
          padding: var(--space-4);
          background: var(--bg);
          border-top: 4px solid var(--alive);
        }
        .audio-confirmation__title {
          font-family: var(--font-display);
          font-size: 1.25rem;
          font-weight: 700;
        }
        .audio-confirmation__description {
          margin: var(--space-2) 0 var(--space-4);
          color: var(--text-muted);
        }
        .audio-confirmation__actions {
          display: grid;
          gap: var(--space-2);
        }
        .audio-confirmation__actions .btn {
          width: 100%;
        }
        @media (min-width: 640px) {
          .audio-confirmation-backdrop {
            place-items: center;
          }
          .audio-confirmation__actions {
            grid-template-columns: 1fr 1fr;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .audio-section {
            scroll-behavior: auto;
          }
        }
        @media (max-width: 480px) {
          .form-row {
            grid-template-columns: 1fr;
          }
        }
        .consent-field label {
          display: flex;
          flex-direction: row;
          align-items: flex-start;
          gap: var(--space-2);
          font-weight: 400;
          font-size: 0.85rem;
          cursor: pointer;
        }
        .consent-field input[type="checkbox"] {
          margin-top: 3px;
          width: 18px;
          height: 18px;
          flex-shrink: 0;
        }
      `}</style>
    </form>
  );
}
