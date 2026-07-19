# TODOS — maayataan

## P1 — Critical

### Consent vs copyright model refinement
**What:** Separate community consent permissions from legal licensing. Current design maps `consent_level` directly to CC licenses, but for oral/collective indigenous language data these are different concepts.
**Why:** A contributor saying "research-only" expresses a community governance preference, not a copyright claim. Conflating them creates legal ambiguity and may misrepresent contributors' intent in exports.
**Context:** Flagged by Codex during CEO review (2026-03-23). Needs resolution before first HuggingFace publish. Consider consulting with indigenous data sovereignty frameworks (CARE Principles, Local Contexts labels).
**Effort:** L (human) → M (CC)
**Depends on:** Legal/community consultation
**Target:** Before Month 2 (HuggingFace publish)

### Full validation workflow with community voting
**What:** Replace admin-only review with configurable quorum voting. ValidationVote table, dispute flow, re-review triggers.
**Why:** Admin-only review doesn't scale and doesn't represent community ownership. Quorum voting (default 2/3, target 3/5 at 15+ validators) ensures quality through consensus.
**Context:** Initial validators recruited from university linguistics faculty via the 25-institution network. Schema already designed (see design doc).
**Effort:** M (human) → S (CC)
**Depends on:** Demo launch + initial validator recruitment
**Target:** Week 1

## P2 — Important

### One-click HuggingFace Hub publish
**What:** Python script that packages validated entries as a HuggingFace dataset with auto-generated dataset card, consent-level filtering, and `datasets.load_dataset()` compatibility.
**Why:** Makes the corpus discoverable and usable by the global NLP community. Enables submission to AmericasNLP 2026 workshop.
**Context:** Export pipeline (CSV/JSONL/Parquet) is in demo scope. HuggingFace publish extends this with dataset card generation and Hub API integration.
**Effort:** M (human) → S (CC)
**Depends on:** Validation workflow + enough validated data
**Target:** Month 2

### API/CLI for institutional partners
**What:** REST endpoints for bulk ingestion, CLI tool for batch imports, export endpoints (JSONL, CSV, Parquet).
**Why:** Enables the 25 educational institutions to programmatically contribute data and researchers to download datasets.
**Context:** The Worker API already provides protected CSV/JSONL exports; bulk ingestion and a packaged CLI remain.
**Effort:** M (human) → S (CC)
**Depends on:** Validation workflow
**Target:** Week 2

### Reusable component library
**What:** Extract Button, Input, Card, FormField React components with built-in a11y (visible labels, aria attributes, focus management, 44px touch targets).
**Why:** Prevents visual drift across 5+ pages as the platform grows. Ensures consistent accessibility without per-component effort.
**Context:** Flagged during design review (2026-03-23). DESIGN.md defines the tokens; this TODO creates the components that consume them.
**Effort:** M (human) → S (CC)
**Depends on:** DESIGN.md (done)
**Target:** Week 1

### Phone/social login + WhatsApp auth
**What:** Add phone OTP and/or WhatsApp-based authentication for community accounts.
**Why:** Artisans may not have email accounts. Phone auth lowers the barrier for Maya-speaking community members.
**Context:** Cloudflare Access protects staff administration; community identity needs a separate low-friction provider. WhatsApp Business API may require additional setup. Anonymous contributions already work.
**Effort:** S (human) → S (CC)
**Depends on:** Identity-provider decision + Twilio/WhatsApp Business API
**Target:** Week 3

## P3 — Future

### Language-agnostic template extraction
**What:** Move Maya-specific code (UI labels, adapter configs, branding) into a configuration layer so other communities can fork with a single config change.
**Why:** The 10x vision — maayataan becomes the replicable framework for any indigenous language community.
**Context:** Schema and architecture are already language-agnostic (`language_code` field). This step extracts deployment/branding into config.
**Effort:** M (human) → S (CC)
**Depends on:** Stable platform with proven usage
**Target:** Month 3
