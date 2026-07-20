# gstack

Use the `/browse` skill from gstack for all web browsing. Never use `mcp__claude-in-chrome__*` tools.

Available gstack skills:
- `/office-hours` — async Q&A / office hours workflow
- `/plan-ceo-review` — prepare a plan for CEO review
- `/plan-eng-review` — prepare a plan for engineering review
- `/plan-design-review` — prepare a plan for design review
- `/design-consultation` — consult on design decisions
- `/review` — code review
- `/ship` — ship a change
- `/land-and-deploy` — land and deploy a change
- `/canary` — canary deploy
- `/benchmark` — run benchmarks
- `/browse` — web browsing (use this instead of any MCP browser tools)
- `/qa` — QA a change
- `/qa-only` — QA without other steps
- `/design-review` — design review
- `/setup-browser-cookies` — set up browser cookies
- `/setup-deploy` — set up deployment
- `/retro` — retrospective
- `/investigate` — investigate an issue
- `/document-release` — document a release
- `/codex` — codex workflow
- `/cso` — CSO workflow
- `/careful` — careful/cautious mode
- `/freeze` — freeze a branch
- `/guard` — guard a branch
- `/unfreeze` — unfreeze a branch
- `/gstack-upgrade` — upgrade gstack

If gstack skills aren't working, run `cd .claude/skills/gstack && ./setup` to build the binary and register skills.

## Design System
Always read DESIGN.md before making any visual or UI decisions.
All font choices, colors, spacing, and aesthetic direction are defined there.
Do not deviate without explicit user approval.
In QA mode, flag any code that doesn't match DESIGN.md.

## Testing

- Run `npm test` for browser-based Vitest tests in `tests/`.
- Run `npm run check` and `npm run build` before shipping.
- See `TESTING.md` for test layers and conventions.
- New functions and conditionals require tests for all behavior branches.
- Bug fixes require a regression test that reproduces the failure.
- Error handling must be tested by triggering the error.
- Never commit code that makes existing tests fail.
