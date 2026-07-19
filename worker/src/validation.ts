import { HttpError } from './http';
import type { Env } from './types';

export const DIALECTS = ['oriente', 'noroccidente', 'centro', 'sur', 'costa', 'otro'] as const;
export const SOURCES = ['hablante_nativo', 'estudiante', 'academico', 'evento', 'otro'] as const;
export const ALLY_ROLES = ['desarrollo', 'diseño', 'api_datos', 'donacion', 'institucion_educativa', 'otro'] as const;
export const STATUSES = ['pending', 'approved', 'rejected'] as const;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^\d{10}$/;

interface TurnstileResponse {
  success: boolean;
  hostname?: string;
  action?: string;
  'error-codes'?: string[];
}

export function requiredString(value: unknown, label: string, maxLength: number): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new HttpError(400, `${label} es obligatorio.`);
  }
  const trimmed = value.trim();
  if (trimmed.length > maxLength) {
    throw new HttpError(400, `${label} es demasiado largo.`);
  }
  return trimmed;
}

export function optionalString(value: unknown, label: string, maxLength: number): string | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value !== 'string') throw new HttpError(400, `${label} no es válido.`);
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > maxLength) throw new HttpError(400, `${label} es demasiado largo.`);
  return trimmed;
}

export function oneOf<T extends readonly string[]>(value: unknown, allowed: T, label: string): T[number] {
  if (typeof value !== 'string' || !allowed.includes(value)) {
    throw new HttpError(400, `${label} no es válido.`);
  }
  return value as T[number];
}

export function email(value: unknown, required = false): string | null {
  const parsed = optionalString(value, 'El correo', 254);
  if (!parsed && required) throw new HttpError(400, 'El correo es obligatorio.');
  if (parsed && !EMAIL.test(parsed)) throw new HttpError(400, 'El correo no es válido.');
  return parsed;
}

export function phone(value: unknown, required = false): string | null {
  const parsed = optionalString(value, 'El teléfono', 20)?.replace(/\s/g, '') || null;
  if (!parsed && required) throw new HttpError(400, 'El teléfono es obligatorio.');
  if (parsed && !PHONE.test(parsed)) throw new HttpError(400, 'El teléfono debe tener 10 dígitos.');
  return parsed;
}

export function booleanValue(value: unknown): boolean {
  return value === true || value === 'true' || value === '1' || value === 1;
}

export async function verifyTurnstile(
  token: unknown,
  expectedAction: string,
  request: Request,
  env: Env,
): Promise<void> {
  if (typeof token !== 'string' || !token) {
    throw new HttpError(400, 'Completa la verificación de seguridad.');
  }
  if (env.ENVIRONMENT === 'development' && token === 'development-test-token') {
    return;
  }
  if (!env.TURNSTILE_SECRET) {
    throw new HttpError(503, 'La verificación de seguridad aún no está configurada.');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5_000);
  let result: TurnstileResponse;
  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: env.TURNSTILE_SECRET,
        response: token,
        remoteip: request.headers.get('CF-Connecting-IP') || undefined,
        idempotency_key: crypto.randomUUID(),
      }),
      signal: controller.signal,
    });
    result = await response.json() as TurnstileResponse;
  } catch {
    throw new HttpError(503, 'No se pudo verificar la solicitud. Intenta de nuevo.');
  } finally {
    clearTimeout(timeout);
  }

  const allowedHostnames = env.ALLOWED_HOSTNAMES.split(',').map((value) => value.trim());
  const hostnameAllowed = env.ENVIRONMENT === 'development'
    || (!!result.hostname && allowedHostnames.includes(result.hostname));
  const actionAllowed = env.ENVIRONMENT === 'development'
    || result.action === expectedAction;

  if (!result.success || !hostnameAllowed || !actionAllowed) {
    throw new HttpError(403, 'La verificación de seguridad falló. Intenta de nuevo.');
  }
}

export async function enforceRateLimit(request: Request, env: Env, route: string): Promise<void> {
  const ip = request.headers.get('CF-Connecting-IP') || 'local';
  const userAgent = request.headers.get('User-Agent') || 'unknown';
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${ip}:${userAgent}`));
  const fingerprint = Array.from(new Uint8Array(digest).slice(0, 12), (byte) => byte.toString(16).padStart(2, '0')).join('');
  const { success } = await env.PUBLIC_RATE_LIMITER.limit({ key: `${route}:${fingerprint}` });
  if (!success) throw new HttpError(429, 'Demasiados intentos. Espera un minuto e intenta de nuevo.');
}
