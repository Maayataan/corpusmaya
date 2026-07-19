# Testing Maayataan

## Philosophy

Automated tests make it safe to improve sensitive flows such as microphone permissions, recording, playback, consent, and uploads. The goal is complete behavioral coverage of new logic and regression coverage for every bug fix.

## Framework

- Vitest 4
- Vitest Browser Mode
- Playwright Chromium
- `vitest-browser-react` for React component tests

Tests run in a real headless Chromium browser instead of a simulated DOM.

## Commands

```bash
npm test
npm run test:watch
```

Install the browser once on a new machine:

```bash
npx playwright install chromium
```

## Layers

- **Unit:** pure formatters, validators, state transitions, and API helpers.
- **Component:** React interactions, accessibility, loading, error, and success states.
- **Integration:** microphone permission, `MediaRecorder`, audio preview, discard, and upload behavior using controlled browser fakes.
- **Smoke/E2E:** production routes and Worker endpoints, added when a user journey crosses multiple pages or services.

## Conventions

- Test files live in `tests/` and end in `.test.ts` or `.test.tsx`.
- Name tests after visible behavior, not implementation details.
- Prefer role and accessible-name queries for UI tests.
- Assert specific outcomes. Avoid assertions that only check whether a value exists.
- Reset browser globals and mocks after every test.
