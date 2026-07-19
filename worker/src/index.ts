import { requireAccess } from './auth';
import { HttpError, json, parseJson, preflight, withCors } from './http';
import type { Env } from './types';
import {
  ALLY_ROLES,
  DIALECTS,
  SOURCES,
  STATUSES,
  booleanValue,
  email,
  enforceRateLimit,
  oneOf,
  optionalString,
  phone,
  requiredString,
  verifyTurnstile,
} from './validation';

const MAX_AUDIO_SIZE = 5 * 1024 * 1024;
const MAX_FORM_SIZE = MAX_AUDIO_SIZE + 64 * 1024;
const PAGE_SIZE = 20;
const AUDIO_TYPES: Record<string, string> = {
  'audio/webm': 'webm',
  'audio/ogg': 'ogg',
  'audio/mp3': 'mp3',
  'audio/mpeg': 'mp3',
  'audio/wav': 'wav',
  'audio/mp4': 'm4a',
};

type CountTable = 'contributions' | 'speakers_interest' | 'allies_interest';

interface ContributionRow {
  id: string;
  maya_text: string;
  spanish_translation: string;
  audio_key: string | null;
  contributor_name: string;
  consent_given: number;
  dialect: string;
  source: string;
  status: string;
  created_at: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
    if (request.method === 'OPTIONS') return preflight(request, env);

    try {
      const response = await handleApi(request, env, url);
      return withCors(response, request, env);
    } catch (error) {
      if (error instanceof HttpError) {
        return withCors(json({ error: error.message }, { status: error.status }), request, env);
      }
      console.error('Unhandled API error', error);
      return withCors(
        json({ error: 'Ocurrió un error interno. Intenta de nuevo.' }, { status: 500 }),
        request,
        env,
      );
    }
  },
} satisfies ExportedHandler<Env>;

async function handleApi(request: Request, env: Env, url: URL): Promise<Response> {
  if (request.method === 'GET' && url.pathname === '/api/health') {
    await env.DB.prepare('SELECT 1').first();
    return json({ ok: true });
  }

  if (request.method === 'GET' && url.pathname === '/api/counts') {
    return getCount(env, url);
  }

  if (request.method === 'GET' && url.pathname === '/api/corpus') {
    return getCorpus(env, url);
  }

  if (request.method === 'GET' && url.pathname.startsWith('/api/audio/')) {
    const key = decodeURIComponent(url.pathname.slice('/api/audio/'.length));
    return getAudio(request, env, key, false);
  }

  if (request.method === 'POST' && url.pathname === '/api/contributions') {
    await enforceRateLimit(request, env, 'contributions');
    return createContribution(request, env);
  }

  if (request.method === 'POST' && url.pathname === '/api/speakers') {
    await enforceRateLimit(request, env, 'speakers');
    return createSpeaker(request, env);
  }

  if (request.method === 'POST' && url.pathname === '/api/allies') {
    await enforceRateLimit(request, env, 'allies');
    return createAlly(request, env);
  }

  if (url.pathname.startsWith('/api/admin/')) {
    const identity = await requireAccess(request, env);

    if (request.method === 'GET' && url.pathname === '/api/admin/session') {
      return json({ email: identity.email });
    }
    if (request.method === 'GET' && url.pathname.startsWith('/api/admin/audio/')) {
      const key = decodeURIComponent(url.pathname.slice('/api/admin/audio/'.length));
      return getAudio(request, env, key, true);
    }
    if (request.method === 'GET' && url.pathname === '/api/admin/contributions') {
      return getAdminContributions(env, url);
    }
    if (request.method === 'PATCH' && /^\/api\/admin\/contributions\/[^/]+$/.test(url.pathname)) {
      const id = decodeURIComponent(url.pathname.split('/').pop() || '');
      return updateContribution(request, env, id);
    }
    if (request.method === 'GET' && url.pathname === '/api/admin/speakers') {
      return getAdminSpeakers(env);
    }
    if (request.method === 'GET' && url.pathname === '/api/admin/allies') {
      return getAdminAllies(env);
    }
    if (request.method === 'GET' && url.pathname === '/api/admin/export') {
      return exportCorpus(env, url);
    }
  }

  throw new HttpError(404, 'Ruta no encontrada.');
}

async function getCount(env: Env, url: URL): Promise<Response> {
  const table = url.searchParams.get('table') as CountTable | null;
  const statements: Record<CountTable, string> = {
    contributions: 'SELECT COUNT(*) AS count FROM contributions',
    speakers_interest: 'SELECT COUNT(*) AS count FROM speaker_interests',
    allies_interest: 'SELECT COUNT(*) AS count FROM ally_interests',
  };
  if (!table || !statements[table]) throw new HttpError(400, 'La tabla no es válida.');

  const row = await env.DB.prepare(statements[table]).first<{ count: number }>();
  return json({ count: row?.count ?? 0 }, { headers: { 'Cache-Control': 'public, max-age=10' } });
}

async function getCorpus(env: Env, url: URL): Promise<Response> {
  const page = Math.max(0, Math.min(10_000, Number.parseInt(url.searchParams.get('page') || '0', 10) || 0));
  const dialectParam = url.searchParams.get('dialect');
  const dialect = dialectParam ? oneOf(dialectParam, DIALECTS, 'La variante dialectal') : null;
  const search = optionalString(url.searchParams.get('search'), 'La búsqueda', 100);

  const conditions = ["status = 'approved'"];
  const bindings: unknown[] = [];
  if (dialect) {
    conditions.push('dialect = ?');
    bindings.push(dialect);
  }
  if (search) {
    const pattern = `%${search.replace(/[\\%_]/g, '\\$&')}%`;
    conditions.push("(maya_text LIKE ? ESCAPE '\\' OR spanish_translation LIKE ? ESCAPE '\\')");
    bindings.push(pattern, pattern);
  }

  bindings.push(PAGE_SIZE + 1, page * PAGE_SIZE);
  const result = await env.DB.prepare(
    `SELECT id, maya_text, spanish_translation, audio_key, contributor_name,
      consent_given, dialect, source, status, created_at
     FROM contributions
     WHERE ${conditions.join(' AND ')}
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
  ).bind(...bindings).all<ContributionRow>();

  const hasMore = result.results.length > PAGE_SIZE;
  const entries = result.results.slice(0, PAGE_SIZE).map((row) => serializeContribution(row, false));
  return json({ entries, page, hasMore }, { headers: { 'Cache-Control': 'public, max-age=10' } });
}

async function createContribution(request: Request, env: Env): Promise<Response> {
  const contentType = request.headers.get('Content-Type') || '';
  if (!contentType.toLowerCase().startsWith('multipart/form-data')) {
    throw new HttpError(415, 'Se requiere un formulario multipart.');
  }
  const contentLength = Number(request.headers.get('Content-Length') || 0);
  if (contentLength > MAX_FORM_SIZE) throw new HttpError(413, 'La solicitud es demasiado grande.');

  const form = await request.formData();
  await verifyTurnstile(form.get('turnstileToken'), 'contribution', request, env);

  const id = crypto.randomUUID();
  const mayaText = requiredString(form.get('mayaText'), 'El texto en maya', 2000);
  const spanishTranslation = requiredString(form.get('spanishTranslation'), 'La traducción', 2000);
  const contributorName = requiredString(form.get('contributorName'), 'El nombre', 120);
  const dialect = oneOf(form.get('dialect'), DIALECTS, 'La variante dialectal');
  const source = oneOf(form.get('source'), SOURCES, 'La fuente');
  const consent = booleanValue(form.get('consent'));
  if (!consent) throw new HttpError(400, 'Debes dar tu consentimiento para contribuir.');

  let audioKey: string | null = null;
  const audio = form.get('audio');
  if (audio instanceof File && audio.size > 0) {
    if (audio.size > MAX_AUDIO_SIZE) throw new HttpError(413, 'El audio supera el máximo de 5 MB.');
    const baseType = audio.type.split(';')[0].trim().toLowerCase();
    const extension = AUDIO_TYPES[baseType];
    if (!extension) throw new HttpError(400, 'El tipo de audio no está permitido.');
    audioKey = `${id}.${extension}`;
    await env.AUDIO_BUCKET.put(audioKey, await audio.arrayBuffer(), {
      httpMetadata: { contentType: baseType, cacheControl: 'private, no-store' },
      customMetadata: { contributionId: id, status: 'pending' },
    });
  }

  try {
    const results = await env.DB.batch([
      env.DB.prepare(
        `INSERT INTO contributions (
          id, maya_text, spanish_translation, audio_key, contributor_name,
          consent_given, dialect, source, status
        ) VALUES (?, ?, ?, ?, ?, 1, ?, ?, 'pending')`,
      ).bind(id, mayaText, spanishTranslation, audioKey, contributorName, dialect, source),
      env.DB.prepare('SELECT COUNT(*) AS count FROM contributions'),
    ]);
    const countRow = results[1].results[0] as { count?: number } | undefined;
    const totalCount = Number(countRow?.count || 1);
    return json({ id, entryNumber: totalCount, totalCount }, { status: 201 });
  } catch (error) {
    if (audioKey) await env.AUDIO_BUCKET.delete(audioKey);
    throw error;
  }
}

interface SpeakerBody {
  name?: unknown;
  phone?: unknown;
  email?: unknown;
  dialect?: unknown;
  isNativeSpeaker?: unknown;
  wantsToValidate?: unknown;
  message?: unknown;
  turnstileToken?: unknown;
}

async function createSpeaker(request: Request, env: Env): Promise<Response> {
  const body = await parseJson<SpeakerBody>(request);
  await verifyTurnstile(body.turnstileToken, 'speaker', request, env);

  const id = crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO speaker_interests (
      id, name, phone, email, dialect, is_native_speaker, wants_to_validate, message
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(
    id,
    requiredString(body.name, 'El nombre', 120),
    phone(body.phone, true),
    email(body.email),
    oneOf(body.dialect, DIALECTS, 'La variante dialectal'),
    booleanValue(body.isNativeSpeaker) ? 1 : 0,
    booleanValue(body.wantsToValidate) ? 1 : 0,
    optionalString(body.message, 'El mensaje', 2000),
  ).run();
  return json({ id }, { status: 201 });
}

interface AllyBody {
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  organization?: unknown;
  roles?: unknown;
  message?: unknown;
  turnstileToken?: unknown;
}

async function createAlly(request: Request, env: Env): Promise<Response> {
  const body = await parseJson<AllyBody>(request);
  await verifyTurnstile(body.turnstileToken, 'ally', request, env);
  if (!Array.isArray(body.roles) || body.roles.length === 0 || body.roles.length > ALLY_ROLES.length) {
    throw new HttpError(400, 'Selecciona al menos un rol válido.');
  }
  const roles = [...new Set(body.roles.map((role) => oneOf(role, ALLY_ROLES, 'El rol')))];
  const id = crypto.randomUUID();
  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO ally_interests (id, name, email, phone, organization, message)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).bind(
      id,
      requiredString(body.name, 'El nombre', 120),
      email(body.email, true),
      phone(body.phone),
      optionalString(body.organization, 'La organización', 200),
      optionalString(body.message, 'El mensaje', 2000),
    ),
    ...roles.map((role) => env.DB.prepare(
      'INSERT INTO ally_roles (ally_id, role) VALUES (?, ?)',
    ).bind(id, role)),
  ]);
  return json({ id }, { status: 201 });
}

async function getAdminContributions(env: Env, url: URL): Promise<Response> {
  const status = oneOf(url.searchParams.get('status') || 'pending', STATUSES, 'El estado');
  const result = await env.DB.prepare(
    `SELECT id, maya_text, spanish_translation, audio_key, contributor_name,
      consent_given, dialect, source, status, created_at
     FROM contributions WHERE status = ?
     ORDER BY created_at ${status === 'pending' ? 'ASC' : 'DESC'} LIMIT 100`,
  ).bind(status).all<ContributionRow>();
  return json({ entries: result.results.map((row) => serializeContribution(row, true)) });
}

interface StatusBody {
  status?: unknown;
}

async function updateContribution(request: Request, env: Env, id: string): Promise<Response> {
  if (!id || id.length > 100) throw new HttpError(400, 'El identificador no es válido.');
  const body = await parseJson<StatusBody>(request, 4096);
  const status = oneOf(body.status, STATUSES, 'El estado');
  const result = await env.DB.prepare(
    'UPDATE contributions SET status = ? WHERE id = ?',
  ).bind(status, id).run();
  if (!result.meta.changes) throw new HttpError(404, 'La contribución no existe.');

  const row = await env.DB.prepare('SELECT audio_key FROM contributions WHERE id = ?')
    .bind(id).first<{ audio_key: string | null }>();
  if (row?.audio_key) {
    const object = await env.AUDIO_BUCKET.get(row.audio_key);
    if (object) {
      await env.AUDIO_BUCKET.put(row.audio_key, await object.arrayBuffer(), {
        httpMetadata: {
          contentType: object.httpMetadata?.contentType,
          cacheControl: status === 'approved' ? 'public, max-age=31536000, immutable' : 'private, no-store',
        },
        customMetadata: { contributionId: id, status },
      });
    }
  }
  return json({ id, status });
}

async function getAdminSpeakers(env: Env): Promise<Response> {
  const result = await env.DB.prepare(
    `SELECT id, name, phone, email, dialect, is_native_speaker, wants_to_validate, message, created_at
     FROM speaker_interests ORDER BY created_at DESC LIMIT 100`,
  ).all<Record<string, unknown>>();
  return json({ speakers: result.results.map((row) => ({
    ...row,
    is_native_speaker: Boolean(row.is_native_speaker),
    wants_to_validate: Boolean(row.wants_to_validate),
  })) });
}

async function getAdminAllies(env: Env): Promise<Response> {
  const result = await env.DB.prepare(
    `SELECT a.id, a.name, a.email, a.phone, a.organization, a.message, a.created_at,
      COALESCE(json_group_array(ar.role) FILTER (WHERE ar.role IS NOT NULL), '[]') AS roles_json
     FROM ally_interests a
     LEFT JOIN ally_roles ar ON ar.ally_id = a.id
     GROUP BY a.id
     ORDER BY a.created_at DESC LIMIT 100`,
  ).all<Record<string, unknown>>();
  return json({ allies: result.results.map(({ roles_json, ...row }) => ({
    ...row,
    roles: JSON.parse(String(roles_json || '[]')),
  })) });
}

async function getAudio(request: Request, env: Env, key: string, admin: boolean): Promise<Response> {
  if (!/^[0-9a-f-]{36}\.(webm|ogg|mp3|wav|m4a)$/.test(key)) {
    throw new HttpError(400, 'La clave de audio no es válida.');
  }
  const row = await env.DB.prepare('SELECT status FROM contributions WHERE audio_key = ?')
    .bind(key).first<{ status: string }>();
  if (!row || (!admin && row.status !== 'approved')) throw new HttpError(404, 'Audio no encontrado.');

  const object = await env.AUDIO_BUCKET.get(key, { onlyIf: request.headers });
  if (!object) throw new HttpError(404, 'Audio no encontrado.');
  if (!('body' in object)) return new Response(null, { status: 304, headers: { ETag: object.httpEtag } });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('ETag', object.httpEtag);
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Cache-Control', admin ? 'private, no-store' : 'public, max-age=31536000, immutable');
  return new Response(object.body, { headers });
}

async function exportCorpus(env: Env, url: URL): Promise<Response> {
  const format = url.searchParams.get('format') || 'jsonl';
  if (!['jsonl', 'csv'].includes(format)) throw new HttpError(400, 'El formato no es válido.');
  const result = await env.DB.prepare(
    `SELECT id, maya_text, spanish_translation, dialect, source, contributor_name, created_at,
      CASE WHEN audio_key IS NULL THEN NULL ELSE '/api/audio/' || audio_key END AS audio_url,
      consent_scope, license_code, governance_label
     FROM contributions WHERE status = 'approved' ORDER BY created_at ASC`,
  ).all<Record<string, unknown>>();

  if (format === 'jsonl') {
    const body = result.results.map((row) => JSON.stringify(row)).join('\n');
    return new Response(body ? `${body}\n` : '', {
      headers: {
        'Content-Type': 'application/x-ndjson; charset=utf-8',
        'Content-Disposition': 'attachment; filename="maayataan-corpus.jsonl"',
        'Cache-Control': 'private, no-store',
      },
    });
  }

  const columns = ['id', 'maya_text', 'spanish_translation', 'dialect', 'source', 'contributor_name', 'created_at', 'audio_url', 'consent_scope', 'license_code', 'governance_label'];
  const lines = [columns.join(',')];
  for (const row of result.results) {
    lines.push(columns.map((column) => csvCell(row[column])).join(','));
  }
  return new Response(`${lines.join('\n')}\n`, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="maayataan-corpus.csv"',
      'Cache-Control': 'private, no-store',
    },
  });
}

function serializeContribution(row: ContributionRow, admin: boolean): Record<string, unknown> {
  return {
    ...row,
    consent_given: Boolean(row.consent_given),
    audio_url: row.audio_key
      ? `/api/${admin ? 'admin/' : ''}audio/${encodeURIComponent(row.audio_key)}`
      : null,
    audio_key: undefined,
  };
}

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
