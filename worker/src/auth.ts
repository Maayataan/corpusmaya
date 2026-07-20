import { createRemoteJWKSet, jwtVerify } from 'jose';
import { HttpError } from './http';
import type { AccessIdentity, Env } from './types';

const jwksByTeam = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

export async function requireAccess(request: Request, env: Env): Promise<AccessIdentity> {
  if (env.ENVIRONMENT === 'development') {
    return { email: 'local-admin@maayataan.test', sub: 'local-development' };
  }

  if (!env.TEAM_DOMAIN || !env.POLICY_AUD) {
    throw new HttpError(503, 'El acceso administrativo aún no está configurado.');
  }

  const token = request.headers.get('Cf-Access-Jwt-Assertion');
  if (!token) throw new HttpError(401, 'Se requiere autenticación administrativa.');

  const teamDomain = env.TEAM_DOMAIN.replace(/\/$/, '');
  let jwks = jwksByTeam.get(teamDomain);
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(`${teamDomain}/cdn-cgi/access/certs`));
    jwksByTeam.set(teamDomain, jwks);
  }

  try {
    const { payload } = await jwtVerify(token, jwks, {
      issuer: teamDomain,
      audience: env.POLICY_AUD,
    });
    if (typeof payload.email !== 'string' || typeof payload.sub !== 'string') {
      throw new Error('Missing identity claims');
    }
    return { email: payload.email, sub: payload.sub };
  } catch {
    throw new HttpError(403, 'La sesión administrativa no es válida.');
  }
}
