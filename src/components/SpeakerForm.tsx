import { useState } from 'react';
import { api } from '../lib/api';
import { Button, FormField } from './ui';
import CommunityBadge from './CommunityBadge';
import Turnstile from './Turnstile';
import type { Dialect } from '../lib/database.types';

type FormState = 'idle' | 'submitting' | 'success' | 'error';

const DIALECTS: { value: Dialect; label: string }[] = [
  { value: 'oriente', label: 'Oriente' },
  { value: 'noroccidente', label: 'Noroccidente' },
  { value: 'centro', label: 'Centro' },
  { value: 'sur', label: 'Sur' },
  { value: 'costa', label: 'Costa' },
  { value: 'otro', label: 'Otro / Ma\' in wojel — No sé' },
];

function validatePhone(value: string): boolean {
  return /^\d{10}$/.test(value.replace(/\s/g, ''));
}

function validateEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function SpeakerForm() {
  const [state, setState] = useState<FormState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [dialect, setDialect] = useState<Dialect>('oriente');
  const [isNative, setIsNative] = useState(false);
  const [wantsToValidate, setWantsToValidate] = useState(false);
  const [message, setMessage] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileRevision, setTurnstileRevision] = useState(0);

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Tu nombre es necesario.';
    if (!whatsapp.trim()) {
      errs.whatsapp = 'Tu WhatsApp es necesario.';
    } else if (!validatePhone(whatsapp)) {
      errs.whatsapp = 'Ingresa un número de 10 dígitos.';
    }
    if (email.trim() && !validateEmail(email)) {
      errs.email = 'Ingresa un correo válido.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    e.preventDefault();
    if (honeypot) return;
    if (!validate()) return;
    if (!turnstileToken) {
      setState('error');
      setErrorMsg('Completa la verificación de seguridad.');
      return;
    }

    setState('submitting');
    setErrorMsg('');

    try {
      await api('/api/speakers', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          phone: whatsapp.trim(),
          email: email.trim() || null,
          dialect,
          isNativeSpeaker: isNative,
          wantsToValidate,
          message: message.trim() || null,
          turnstileToken,
        }),
      });
      setState('success');
    } catch (error) {
      setState('error');
      setErrorMsg(error instanceof Error ? error.message : 'No se pudo enviar. Intenta de nuevo.');
      setTurnstileToken('');
      setTurnstileRevision((revision) => revision + 1);
    }
  }

  if (state === 'success') {
    return <SuccessScreen name={name.trim()} />;
  }

  return (
    <form onSubmit={handleSubmit} className="speaker-form">
      <FormField label="A k'aaba'" sublabel="Tu nombre" htmlFor="speaker-name">
        <input
          id="speaker-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej. María Chan"
        />
        {errors.name && <p className="form-error">{errors.name}</p>}
      </FormField>

      <FormField label="A WhatsApp" sublabel="Número de WhatsApp (10 dígitos)" htmlFor="speaker-whatsapp">
        <input
          id="speaker-whatsapp"
          type="tel"
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          placeholder="9991234567"
        />
        {errors.whatsapp && <p className="form-error">{errors.whatsapp}</p>}
      </FormField>

      <FormField label="A correo" sublabel="Correo electrónico (opcional)" htmlFor="speaker-email">
        <input
          id="speaker-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@correo.com"
        />
        {errors.email && <p className="form-error">{errors.email}</p>}
      </FormField>

      <FormField label="Bix a t'aan" sublabel="Variante dialectal" htmlFor="speaker-dialect">
        <select
          id="speaker-dialect"
          value={dialect}
          onChange={(e) => setDialect(e.target.value as Dialect)}
        >
          {DIALECTS.map((d) => (
            <option key={d.value} value={d.value}>{d.label}</option>
          ))}
        </select>
      </FormField>

      <div className="form-field">
        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={isNative}
            onChange={(e) => setIsNative(e.target.checked)}
          />
          <span>
            <span className="field-label-maya">Jach t'aan maaya</span>
            <span className="field-label-es">Soy hablante nativo</span>
          </span>
        </label>
      </div>

      <div className="form-field">
        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={wantsToValidate}
            onChange={(e) => setWantsToValidate(e.target.checked)}
          />
          <span>
            <span className="field-label-maya">Tin k'áat in wilik ba'ax ku ts'aik</span>
            <span className="field-label-es">Quiero ayudar a validar contribuciones</span>
          </span>
        </label>
      </div>

      <FormField label="A t'aan" sublabel="Mensaje (opcional)" htmlFor="speaker-message">
        <textarea
          id="speaker-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          placeholder="¿Algo que quieras contarnos?"
        />
      </FormField>

      {/* Honeypot */}
      <div style={{ position: 'absolute', left: '-9999px', opacity: 0 }} aria-hidden="true">
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      <Turnstile
        key={turnstileRevision}
        action="speaker"
        onToken={setTurnstileToken}
      />

      {state === 'error' && <p className="form-error" role="alert">{errorMsg}</p>}

      <Button type="submit" variant="primary" disabled={state === 'submitting' || !turnstileToken}>
        {state === 'submitting' ? 'Enviando...' : "Ts'aik in k'aaba' — Registrarme"}
      </Button>

      <style>{`
        .speaker-form {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
          position: relative;
        }
        .checkbox-field {
          display: flex;
          flex-direction: row !important;
          align-items: flex-start;
          gap: var(--space-2);
          cursor: pointer;
        }
        .checkbox-field input[type="checkbox"] {
          width: 20px;
          height: 20px;
          margin-top: 2px;
          flex-shrink: 0;
          accent-color: var(--primary);
        }
        .checkbox-field span {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
      `}</style>
    </form>
  );
}

function SuccessScreen({ name }: { name: string }) {
  return (
    <div className="success-screen">
      <p className="success-maya">Ko'one'ex</p>
      <p className="success-es">Gracias por sumarte</p>
      <p className="success-detail">
        Te contactaremos pronto. Comparte tu badge e invita a más hablantes.
      </p>

      <CommunityBadge name={name} type="speaker" />

      <a href="/contribuir" className="btn" style={{ marginTop: 'var(--space-3)' }}>Contribuir frases</a>

      <style>{`
        .success-screen {
          text-align: center;
          padding: var(--space-5) 0;
        }
        .success-maya {
          font-family: var(--font-display);
          font-size: 2rem;
          font-weight: 900;
        }
        .success-es {
          color: var(--text-muted);
          margin-bottom: var(--space-4);
        }
        .success-detail {
          margin-bottom: var(--space-2);
          font-size: 0.95rem;
        }
        .success-screen .btn {
          text-decoration: none;
          display: inline-flex;
        }
      `}</style>
    </div>
  );
}
