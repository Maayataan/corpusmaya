import { afterEach, describe, expect, test, vi } from 'vitest';
import { api } from '../src/lib/api';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('api', () => {
  test('sends JSON requests with credentials', async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      expect(headers.get('Content-Type')).toBe('application/json');
      expect(init?.credentials).toBe('include');
      return Response.json({ saved: true });
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(api<{ saved: boolean }>('/api/example', {
      method: 'POST',
      body: JSON.stringify({ text: "Ma'alob" }),
    })).resolves.toEqual({ saved: true });
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  test('lets the browser set the multipart boundary for audio uploads', async () => {
    const form = new FormData();
    form.set('audio', new Blob(['voice'], { type: 'audio/webm' }), 'voice.webm');

    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      expect(headers.has('Content-Type')).toBe(false);
      expect(init?.body).toBe(form);
      return Response.json({ uploaded: true });
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(api<{ uploaded: boolean }>('/api/contributions', {
      method: 'POST',
      body: form,
    })).resolves.toEqual({ uploaded: true });
  });

  test('preserves the API error message and status', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json(
      { error: 'El audio supera el límite permitido.' },
      { status: 413 },
    )));

    const request = api('/api/contributions', { method: 'POST' });
    await expect(request).rejects.toMatchObject({
      message: 'El audio supera el límite permitido.',
      status: 413,
    });
  });
});
