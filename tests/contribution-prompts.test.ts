import { describe, expect, test, vi } from 'vitest';
import {
  CONTRIBUTION_PROMPTS,
  getNextContributionPrompt,
} from '../src/lib/contributionPrompts';

describe('contribution prompts', () => {
  test('offers the five safe event topics without song lyrics', () => {
    expect(CONTRIBUTION_PROMPTS).toHaveLength(5);
    expect(CONTRIBUTION_PROMPTS.map((prompt) => prompt.id)).toEqual([
      'daily_life',
      'expressions',
      'memories',
      'nature',
      'traditions',
    ]);
    expect(CONTRIBUTION_PROMPTS.map((prompt) => prompt.prompt).join(' ').toLowerCase())
      .not.toContain('canción');
  });

  test('does not repeat the visible idea when another is requested', () => {
    const random = vi.fn(() => 0);
    const next = getNextContributionPrompt('daily_life', random);

    expect(next.id).toBe('expressions');
    expect(random).toHaveBeenCalledOnce();
  });

  test('keeps the random index inside the available topics', () => {
    expect(getNextContributionPrompt(undefined, () => 1).id).toBe('traditions');
  });
});
