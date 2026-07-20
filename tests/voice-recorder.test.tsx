import { describe, expect, test, vi } from 'vitest';
import {
  DEFAULT_MAX_SECONDS,
  formatRecordingTime,
  getRecordingErrorMessage,
  loadRecordedAudio,
} from '../src/components/VoiceRecorder';

describe('voice recorder helpers', () => {
  test('formats elapsed recording time', () => {
    expect(formatRecordingTime(0)).toBe('0:00');
    expect(formatRecordingTime(59_999)).toBe('0:59');
    expect(formatRecordingTime(60_000)).toBe('1:00');
    expect(formatRecordingTime(DEFAULT_MAX_SECONDS * 1000)).toBe('2:00');
  });

  test('explains microphone permission failures', () => {
    expect(getRecordingErrorMessage(new Error('NotAllowedError: Permission denied')))
      .toContain('permisos del navegador');
  });

  test('explains missing microphones', () => {
    expect(getRecordingErrorMessage(new DOMException('Requested device not found', 'NotFoundError')))
      .toContain('micrófono disponible');
  });

  test('keeps an actionable fallback for unknown failures', () => {
    expect(getRecordingErrorMessage(new Error('Unexpected failure')))
      .toContain('volver a intentarlo');
  });

  test('waits for recorded audio to load before enabling seeking', async () => {
    let finishLoading: (() => void) | undefined;
    const loadBlob = vi.fn(() => new Promise<void>((resolve) => {
      finishLoading = resolve;
    }));
    const setOptions = vi.fn();
    const player = {
      loadBlob,
      setOptions,
      getDuration: () => 87,
    };

    const loading = loadRecordedAudio(player, new Blob(['voice'], { type: 'audio/webm' }));
    expect(setOptions).not.toHaveBeenCalled();

    finishLoading?.();
    await expect(loading).resolves.toBe(87_000);
    expect(setOptions).toHaveBeenCalledWith({ interact: true, dragToSeek: true });
  });
});
