import { useEffect, useRef, useState } from 'react';

interface TurnstileApi {
  render(
    container: HTMLElement,
    options: {
      sitekey: string;
      action: string;
      theme: 'auto';
      size: 'flexible';
      callback: (token: string) => void;
      'expired-callback': () => void;
      'error-callback': () => void;
    },
  ): string;
  remove(widgetId: string): void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

interface Props {
  action: 'contribution' | 'speaker' | 'ally';
  onToken: (token: string) => void;
}

const TEST_SITE_KEY = '1x00000000000000000000AA';
const PRODUCTION_SITE_KEY = '0x4AAAAAAD5SeeojO6sHK2Fy';
const configuredSiteKey = import.meta.env.PUBLIC_TURNSTILE_SITE_KEY as string | undefined;
const siteKey = configuredSiteKey || (import.meta.env.DEV ? TEST_SITE_KEY : PRODUCTION_SITE_KEY);
let loader: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (loader) return loader;

  loader = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-maayataan-turnstile]');
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Turnstile failed to load')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.dataset.maayataanTurnstile = 'true';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Turnstile failed to load'));
    document.head.appendChild(script);
  });
  return loader;
}

export default function Turnstile({ action, onToken }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loadError, setLoadError] = useState(!siteKey);

  useEffect(() => {
    if (!siteKey || !containerRef.current) return;
    let widgetId: string | null = null;
    let cancelled = false;

    loadScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return;
        widgetId = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          action,
          theme: 'auto',
          size: 'flexible',
          callback: onToken,
          'expired-callback': () => onToken(''),
          'error-callback': () => {
            onToken('');
            setLoadError(true);
          },
        });
      })
      .catch(() => setLoadError(true));

    return () => {
      cancelled = true;
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
      onToken('');
    };
  }, [action, onToken]);

  return (
    <div className="turnstile-field">
      <div ref={containerRef} />
      {loadError && (
        <p className="form-error" role="alert">
          No se pudo cargar la verificación de seguridad. Recarga la página.
        </p>
      )}
      <style>{`
        .turnstile-field {
          min-height: 65px;
          margin: var(--space-3) 0;
        }
      `}</style>
    </div>
  );
}
