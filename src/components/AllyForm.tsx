import { useState } from 'react';
import { api } from '../lib/api';
import { Button, FormField } from './ui';
import CommunityBadge from './CommunityBadge';
import Turnstile from './Turnstile';

type FormState = 'idle' | 'submitting' | 'success' | 'error';

const ROLES = [
  { value: 'desarrollo', label: 'Desarrollo / Ingeniería' },
  { value: 'diseño', label: 'Diseño' },
  { value: 'api_datos', label: 'Conexión API / Datos' },
  { value: 'donacion', label: 'Donación' },
  { value: 'institucion_educativa', label: 'Institución educativa' },
  { value: 'otro', label: 'Otro' },
];

function validateEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validatePhone(value: string): boolean {
  return /^\d{10}$/.test(value.replace(/\s/g, ''));
}

export default function AllyForm() {
  const [state, setState] = useState<FormState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [organization, setOrganization] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileRevision, setTurnstileRevision] = useState(0);

  function toggleRole(role: string) {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Tu nombre es necesario.';
    if (!email.trim()) {
      errs.email = 'Tu correo es necesario.';
    } else if (!validateEmail(email)) {
      errs.email = 'Ingresa un correo válido.';
    }
    if (phone.trim() && !validatePhone(phone)) {
      errs.phone = 'Ingresa un número de 10 dígitos.';
    }
    if (selectedRoles.length === 0) errs.roles = 'Selecciona al menos un rol.';
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
      await api('/api/allies', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
          organization: organization.trim() || null,
          roles: selectedRoles,
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
    <form onSubmit={handleSubmit} className="ally-form">
      <FormField label="Nombre" htmlFor="ally-name">
        <input
          id="ally-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej. Carlos López"
        />
        {errors.name && <p className="form-error">{errors.name}</p>}
      </FormField>

      <FormField label="Correo electrónico" htmlFor="ally-email">
        <input
          id="ally-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@correo.com"
        />
        {errors.email && <p className="form-error">{errors.email}</p>}
      </FormField>

      <FormField label="WhatsApp / Teléfono (opcional)" htmlFor="ally-phone">
        <input
          id="ally-phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="9991234567"
        />
        {errors.phone && <p className="form-error">{errors.phone}</p>}
      </FormField>

      <FormField label="Organización (opcional)" htmlFor="ally-org">
        <input
          id="ally-org"
          type="text"
          value={organization}
          onChange={(e) => setOrganization(e.target.value)}
          placeholder="Universidad de Yucatán"
        />
      </FormField>

      <div className="form-field">
        <p className="field-label-main">¿Cómo te gustaría contribuir?</p>
        <div className="roles-grid">
          {ROLES.map((role) => (
            <label key={role.value} className="role-checkbox">
              <input
                type="checkbox"
                checked={selectedRoles.includes(role.value)}
                onChange={() => toggleRole(role.value)}
              />
              <span>{role.label}</span>
            </label>
          ))}
        </div>
        {errors.roles && <p className="form-error">{errors.roles}</p>}
      </div>

      <FormField label="Mensaje (opcional)" htmlFor="ally-message">
        <textarea
          id="ally-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          placeholder="¿Algo que quieras contarnos sobre cómo puedes ayudar?"
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
        action="ally"
        onToken={setTurnstileToken}
      />

      {state === 'error' && <p className="form-error" role="alert">{errorMsg}</p>}

      <Button type="submit" variant="primary" disabled={state === 'submitting' || !turnstileToken}>
        {state === 'submitting' ? 'Enviando...' : 'Sumarme como aliado'}
      </Button>

      <style>{`
        .ally-form {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
          position: relative;
        }
        .field-label-main {
          font-weight: 600;
          font-size: 1rem;
          margin-bottom: var(--space-2);
        }
        .roles-grid {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }
        .role-checkbox {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: var(--space-2);
          cursor: pointer;
          padding: var(--space-2);
          border: 1px solid var(--surface);
          border-radius: var(--radius);
          background: var(--card-bg);
          transition: border-color 150ms ease-out;
        }
        .role-checkbox:hover {
          border-color: var(--text-muted);
        }
        .role-checkbox:has(input:checked) {
          border-color: var(--primary);
          background: color-mix(in srgb, var(--primary) 5%, var(--card-bg));
        }
        .role-checkbox input[type="checkbox"] {
          width: 20px;
          height: 20px;
          flex-shrink: 0;
          accent-color: var(--primary);
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
        Te contactaremos pronto. Comparte tu badge e invita a más aliados.
      </p>

      <CommunityBadge name={name} type="ally" />

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
