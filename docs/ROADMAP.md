# GARUDA Roadmap

## Phase 1 — Foundation

- Establish the GARUDA identity and operating principles
- Define the founder-facing experience and core interface language
- Create the initial architecture for intelligence orchestration

## Phase 2 — Arrival and Brand Experience

- Implement cinematic arrival experiences
- Integrate official brand assets and visual identity
- Prepare the founder experience for premium onboarding

## Phase 3 — AI Operating System Foundation

- Document the GARUDA operating architecture
- Define the Revenue Universe, Creative Studio, Mother Brain, and AI Workforce
- Establish the strategic and execution framework for future implementation

## Phase 4 — Agent Orchestration

- Expand the coordination layer for multiple specialized agents
- Connect reasoning, planning, and execution into a unified operating loop
- Formalize approval, memory, and feedback mechanisms

## Phase 5 — Commercial Intelligence

- Deepen revenue generation pathways and market intelligence workflows
- Connect creators, operators, and founders through one operating surface
- Build measurable growth loops into the system architecture

## Phase 6 — Expansion and Evolution

- Extend GARUDA into broader product and platform capabilities
- Reinforce self-improvement and adaptive intelligence loops
- Scale the operating system into a durable founder platform

## Gradual Production Structure Migration

The current repository remains authoritative; no bulk move is authorized by this roadmap. New capabilities and focused refactors should progressively converge on these boundaries while preserving current imports and runtime behavior:

| Boundary | Intended responsibility | Migration approach |
| --- | --- | --- |
| `src/core` | Shared runtime, policy, contracts, and configuration | Extract only stable shared primitives from existing modules. |
| `src/motherCore` | Mother Brain, planning, decisions, execution, learning, and reporting | Keep the existing module as the migration source; add focused submodules in place. |
| `src/revenue` | Revenue intelligence, opportunities, missions, evidence, records, and settlements | Continue Core Revenue services; use the Revenue repository as its authenticated workspace adapter. |
| `src/workers` | Local workers and dispatcher integrations | Keep worker interfaces local-first and approval-aware. |
| `src/automation` | Founder launchers, repeatable verification, packaging, and developer utilities | Add one-command automation before recurring manual instructions. |
| `src/knowledge`, `src/security`, `src/guardian`, `src/creative` | Specialized governed capabilities | Introduce bounded modules only when an approved capability needs them. |
| `tests` | Focused unit, workflow, regression, and integration checks | Add tests beside existing services first; consolidate only with compatible tooling. |
| `docs` | Foundation, architecture, and operational ground truth | Keep Foundation documents binding and concise. |

Migration rule: new work must not create a second approval authority, source of truth, Mother Brain, or Revenue ledger. Any future structural change requires a focused proposal, compatibility review, targeted tests, and the approval required by the Foundation.
