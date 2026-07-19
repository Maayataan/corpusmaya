import { describe, expect, test } from 'vitest';
import {
  formatRecordingTime,
  getRecordingErrorMessage,
} from '../src/components/VoiceRecorder';

describe('voice recorder helpers', () => {
  test('formats elapsed recording time', () => {
    expect(formatRecordingTime(0)).toBe('0:00');
    expect(formatRecordingTime(59_999)).toBe('0:59');
    expect(formatRecordingTime(60_000)).toBe('1:00');
  });

  test('explains microphone permission failures', () => {
    expect(getRecordingErrorMessage(new Error('NotAllowedError: Permission denied')))
      .toContain('permisos del navegador');
  });

  test('explains missing microphones', () => {
    expect(getRecordingErrorMessage(new Error('No available adapters')))
      .toContain('micrófono disponible');
  });

  test('keeps an actionable fallback for unknown failures', () => {
    expect(getRecordingErrorMessage(new Error('Unexpected failure')))
      .toContain('volver a intentarlo');
  });
});
