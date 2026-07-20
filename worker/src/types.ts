export interface RateLimitBinding {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

export interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  AUDIO_BUCKET: R2Bucket;
  PUBLIC_RATE_LIMITER: RateLimitBinding;
  ENVIRONMENT: 'development' | 'production';
  ALLOWED_ORIGINS: string;
  ALLOWED_HOSTNAMES: string;
  TURNSTILE_SECRET?: string;
  TEAM_DOMAIN?: string;
  POLICY_AUD?: string;
}

export interface AccessIdentity {
  email: string;
  sub: string;
}
