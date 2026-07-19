# Design System — maayataan

## Product Context
- **What this is:** Open-source platform for collecting, validating, and structuring Yucatec Maya linguistic corpus data for AI training
- **Who it's for:** Maya-speaking artisans on smartphones, academics, government officials in Yucatan
- **Space/industry:** Language preservation, indigenous tech, community corpus collection
- **Project type:** Web app (Astro + React + Cloudflare Workers/D1/R2)

## Aesthetic Direction
- **Direction:** Organic/Natural with architectural structure
- **Visual thesis:** "Sun-warmed stone split open to reveal living water underneath."
- **Decoration level:** Intentional — textural section dividers (stone strata), no decorative blobs
- **Mood:** Warm, sharp, civic, alive. A cultural tool from Yucatan's streets and plazas, not a soft international nonprofit dashboard. Carved, not printed. A poster in Merida, not a template from San Francisco.
- **Reference sites:** Researched Mozilla Common Voice, FirstVoices, Endangered Languages Project, Lingualibre, Living Tongues, Masakhane — all converge on generic institutional/NGO aesthetic. maayataan deliberately departs from this.

## Typography
- **Display/Hero:** `Fraunces` (variable, optical size + wonk axis) — sculpted, high-contrast forms that feel carved rather than corporate. Set large, tight, assertive.
- **Body/UI:** `DM Sans` — geometric with humanist terminals, reads clean at small sizes on budget Android screens. Full Latin Extended for Maya orthography (ts', ch', k').
- **Data/Counters:** `JetBrains Mono` — for timestamps, contribution stats, recording durations. Signals rigor and fieldwork.
- **Loading:** Google Fonts CDN
- **Scale:** 17px mobile / 19px desktop body. 1.25 modular scale (Major Third).
- **Fallbacks:** `'Fraunces', serif` / `'DM Sans', sans-serif` / `'JetBrains Mono', monospace`

## Color
- **Approach:** Restrained + one "alive" accent. Geological layer logic — stacked strata from raw limestone to carved content.

| Token | Name | Hex | Usage |
|-------|------|-----|-------|
| `--bg` | Sascab | `#F5EDE0` | Page background — powdered limestone |
| `--surface` | Chukum | `#EDE3D0` | Cards, overlays — resin-sealed plaster |
| `--primary` | Cenote | `#1B6B5A` | Primary CTAs, links — the green that means "life is here" |
| `--primary-hover` | Deep Cenote | `#134A3F` | Hover/active states |
| `--accent` | Terracotta | `#C4603C` | Warm emphasis, secondary links — clay pottery |
| `--alive` | K'an | `#E8A838` | Recording/live states ONLY — ripe maize, the "cracked open" moment |
| `--text` | Obsidian | `#1A1A18` | Primary text — volcanic glass with warm cast |
| `--text-muted` | Smoke | `#6B6560` | Secondary text, placeholders — copal smoke |
| `--error` | Achiote | `#C43D2E` | Error states — annatto seed paste |
| `--success` | Milpa | `#3A8A5C` | Success states — young corn leaves |

- **Dark mode:** Invert surfaces (#1A1A18 bg, #2A2722 surface), desaturate primaries 10-20%.
- **Discipline:** Six semantic roles. No extra support palettes. Discipline creates identity.

## Spacing
- **Base unit:** 4px
- **Density:** Comfortable
- **Scale:** 4, 8, 16, 24, 32, 48, 64
- **Component padding:** 16px default
- **Section spacing:** 48px mobile / 64px desktop
- **Touch targets:** 48px minimum (56px preferred — "sized for work-calloused hands")
- **Body text minimum:** 17px (outdoor readability in Yucatan sunlight)

## Layout
- **Approach:** Left-aligned poster composition, single-column mobile-first
- **Grid:** Single column mobile, max-width 720px
- **Border radius:** 2px everywhere (cut stone, not bubbly SaaS)
- **Shadows:** None — use background contrast for separation
- **Section dividers:** 4px horizontal stratum bands (--surface color), not 1px lines
- **Cards:** Flush-stacked like masonry blocks in browse view, no gaps between cards
- **Hero:** Poster-first — large headline, one supporting line, one clear action. Not centered template.
- **Composition:** Left-aligned almost everything. Pinned to a wall, not floating in a template.

## Motion
- **Approach:** Minimal-functional
- **Easing:** ease-out for entrances, ease-in for exits
- **Duration:** 150ms for micro-interactions, 250ms for state transitions
- **Special:** K'an yellow pulse animation on recording button (1.5s ease-in-out infinite)

## Bilingual Pattern
- Maya text first, Spanish below
- Maya in Fraunces display (larger/bolder) to establish hierarchy
- Spanish in DM Sans at smaller size, --text-muted color
- Language labels subtle (--text-muted, small caps, JetBrains Mono)

## Anti-Patterns (do NOT use)
- Purple/violet/indigo gradients
- 3-column icon-in-circle feature grids
- Centered everything
- Decorative blobs, wavy SVG dividers
- Emoji as design elements
- Generic hero copy ("Welcome to...", "Unlock the power of...")
- Cookie-cutter section rhythm
- "Humanitarian neutral" soft sage + tan + rounded card soup
- Fake "ethnic" pattern wallpaper or clip-art pyramids
- Stock-illustration diversity scenes
- Oversized pill buttons floating in whitespace

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-23 | Initial palette (terracotta/jade/limestone) | CEO review — Yucatan earth tones |
| 2026-03-24 | Full design system redesign | /design-consultation — 3 voices (Codex + Claude subagent + research) converged on Fraunces + cenote/sascab palette + poster-first layout. Every language platform in the space looks like a UN project; maayataan should look like Yucatan. |
