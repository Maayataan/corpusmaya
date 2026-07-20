import { describe, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';

const { apiMock } = vi.hoisted(() => ({
  apiMock: vi.fn(async (_path: string, _init?: RequestInit) => ({ entryNumber: 11, totalCount: 11 })),
}));

vi.mock('../src/lib/api', () => ({ api: apiMock }));
vi.mock('../src/components/Certificate', () => ({
  default: () => <div>Certificado</div>,
}));
vi.mock('../src/components/Turnstile', () => ({
  default: ({ onToken }: { onToken: (token: string) => void }) => (
    <button type="button" onClick={() => onToken('development-test-token')}>
      Completar verificación
    </button>
  ),
}));
vi.mock('../src/components/VoiceRecorder', () => ({
  default: ({ onRecordingChange }: { onRecordingChange: (blob: Blob | null) => void }) => (
    <button
      type="button"
      onClick={() => onRecordingChange(new Blob(['voice'], { type: 'audio/webm' }))}
    >
      Grabar nota de voz
    </button>
  ),
}));

import ContributionForm from '../src/components/ContributionForm';

async function completeRequiredFields(screen: Awaited<ReturnType<typeof render>>) {
  const textboxes = screen.getByRole('textbox');
  await textboxes.nth(0).fill("Ma'alob k'iin");
  await textboxes.nth(1).fill('Buenos días');
  await textboxes.nth(2).fill('María');
  await screen.getByRole('checkbox').click();
  await screen.getByRole('button', { name: 'Completar verificación' }).click();
}

describe('contribution form event flow', () => {
  test('offers safe random ideas and lets the contributor request another', async () => {
    const screen = await render(<ContributionForm />);

    await screen.getByRole('button', { name: /no sabes sobre qué contribuir/i }).click();
    await expect.element(screen.getByText('Una idea para empezar')).toBeVisible();
    await expect.element(screen.getByRole('button', { name: 'Otra idea' })).toBeVisible();
    expect(screen.container.textContent?.toLowerCase()).not.toContain('letra de canción');
  });

  test('confirms a text-only contribution and returns focus to the recorder', async () => {
    apiMock.mockClear();
    const screen = await render(<ContributionForm />);
    await completeRequiredFields(screen);

    await screen.getByRole('button', { name: 'Enviar contribución' }).click();
    await expect.element(screen.getByRole('dialog')).toBeVisible();
    await expect.element(screen.getByText('Este aporte no incluye audio')).toBeVisible();
    await expect.element(screen.getByRole('button', { name: 'Enviar sin audio' })).toHaveFocus();
    expect(apiMock).not.toHaveBeenCalled();

    await screen.getByRole('button', { name: 'Volver y grabar' }).click();
    await expect.element(screen.getByRole('dialog')).not.toBeInTheDocument();
    await expect.element(screen.getByRole('button', { name: 'Grabar nota de voz' })).toHaveFocus();
  });

  test('sends immediately when audio is included', async () => {
    apiMock.mockClear();
    const screen = await render(<ContributionForm />);
    await completeRequiredFields(screen);
    await screen.getByRole('button', { name: 'Grabar nota de voz' }).click();

    await expect.element(screen.getByText('Audio incluido y listo para enviar')).toBeVisible();
    await screen.getByRole('button', { name: 'Enviar contribución' }).click();

    await expect.poll(() => apiMock.mock.calls.length).toBe(1);
    const submittedForm = apiMock.mock.calls[0][1]?.body as FormData;
    expect(submittedForm.get('audio')).toBeInstanceOf(File);
  });
});
