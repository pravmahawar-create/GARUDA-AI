# 04 System Architecture

## Summary
Current GARUDA runtime architecture and implementation maturity mapping.

## Runtime Principle
Mother remains the single founder-facing orchestration runtime.

## Maturity
- Implemented: Mother, memory, multibrain, approval gate
- Partially Implemented: Bible-driven routing/prompt flow
- Planned: extended worker adapters

## Creative Production OS — Canonical Architecture (2026-09-04)

### Principle: INTEGRATION NOT PROLIFERATION
GARUDA Creative Production OS reuses existing engines; no duplicate universes, no duplicate memory, no duplicate rendering.

### Canonical Engines (reused)
- `creativeStudioService` — brief → concept → asset orchestration
- `imageGenerationRouter` / `videoGenerationRouter` / `audioGenerationRouter` — provider adapters (sovereign SVG + Fal/Gemini/Runway gated)
- `local2dCinematicMotionEngine` + `ffmpeg-static` — sovereign 2.5D + timeline rendering
- `creativeQualityService` — 7-point QC + SHA-256 seal
- `identityLockService` — brand governance
- `livingArtifactService` + `creativeBibleService` (character/world/visual bibles extend memory, not replace)
- `creativeIntentRouter` — natural-language front door (40+ intents)
- `creativeDirectorService` / `creativeEditorService` — orchestrators (not duplicate brains)
- `mediaEditingService` — ingest + timeline + sovereign beat placeholder + real PCM autocorrelation (async)
- `HighCommandCenter` CREATIVE tab + `/creative` canonical workspace

### Website-First Command Surface
`/creative` is canonical. `/studio` `/agency` `/creator` are compatibility aliases converging to same Production OS. Upload (JPG/PNG/WEBP/SVG/MP4/MOV/WEBM/MP3/WAV/M4A) → `POST /api/creative/media/ingest` → asset registration → command via `POST /api/creative/intent` (creativeIntentRouter) → director/editor → engines → QC → `/assets/creative/*` preview (image viewer, video player, audio player, QC badge, version history).

### Governance — CREATIVE-01 .. CREATIVE-12
CREATIVE-01: Creative Universe is a governed production system, not a collection of generators.
CREATIVE-02: Existing creative engines are canonical and must be reused before new components.
CREATIVE-03: No duplicate engines/files/services/universes/dashboards/memory.
CREATIVE-04: Website is the primary Creative command surface; every operation observable on website.
CREATIVE-05: Every deliverable requires appropriate QC (PASS/WARN/FAIL).
CREATIVE-06: Anti-Fabrication Truth Law applies — capabilities report VERIFIED/PARTIAL/UNAVAILABLE/BLOCKED truthfully.
CREATIVE-07: Providers are adapters, not dependencies; FREE FIRST + SOVEREIGN ALWAYS.
CREATIVE-08: Project Memory + bibles preserve continuity (character/world/visual).
CREATIVE-09: Creative capabilities are composable primitives; workflows compose them.
CREATIVE-10: Self-healing uses canonical `engineeringPipeline` / `selfHealingService` — health signal → diagnose → corrective plan → bounded retry → review.
CREATIVE-11: Founder approval required for paid/external/irreversible actions.
CREATIVE-12: GARUDA grows by integration, not proliferation; only genuinely absent components are created.
