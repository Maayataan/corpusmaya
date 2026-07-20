import type { Env } from './types';

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function json(data: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json; charset=utf-8');
  if (!headers.has('Cache-Control')) headers.set('Cache-Control', 'no-store');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  return Response.json(data, { ...init, headers });
}

export function withCors(response: Response, request: Request, env: Env): Response {
  const origin = request.headers.get('Origin');
  if (!origin) return response;

  const allowedOrigins = env.ALLOWED_ORIGINS.split(',').map((value) => value.trim());
  if (!allowedOrigins.includes(origin)) return response;

  const next = new Response(response.body, response);
  next.headers.set('Access-Control-Allow-Origin', origin);
  next.headers.set('Access-Control-Allow-Credentials', 'true');
  next.headers.set('Vary', 'Origin');
  return next;
}

export function preflight(request: Request, env: Env): Response {
  const origin = request.headers.get('Origin') || '';
  const allowedOrigins = env.ALLOWED_ORIGINS.split(',').map((value) => value.trim());
  if (!allowedOrigins.includes(origin)) {
    return new Response(null, { status: 403 });
  }

  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
      Vary: 'Origin',
    },
  });
}

export async function parseJson<T>(request: Request, maxBytes = 32_768): Promise<T> {
  const contentType = request.headers.get('Content-Type') || '';
  if (!contentType.toLowerCase().startsWith('application/json')) {
    throw new HttpError(415, 'Se requiere contenido JSON.');
  }

  const length = Number(request.headers.get('Content-Length') || 0);
  if (length > maxBytes) throw new HttpError(413, 'La solicitud es demasiado grande.');

  try {
    return await request.json() as T;
  } catch {
    throw new HttpError(400, 'El contenido JSON no es válido.');
  }
}
