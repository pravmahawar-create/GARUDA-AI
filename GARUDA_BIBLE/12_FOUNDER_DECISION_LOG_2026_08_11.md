# GARUDA FOUNDER DECISION LOG — 11 Aug 2026

> Permanent record of today's founder decisions so nothing gets lost between sessions.
> Status: LOCKED (founder-approved). Source: live session with Founder.

---

## FD-101 — Frontend scope rule
- Public pages (landing, customer dashboard, chat, pay) are **NOT to be modified** in the redesign.
- Only the **founder page/dashboard** (`/founder` + founder components) gets polished this round.
- CustomerDashboard state-data leak fix, public strips, industry guides → **backlog**, not now.

## FD-102 — Landing "Control Center preview" (option B)
- The ₹8.4L / pipeline / tasks section on the landing page stays **exactly as-is**.
- These are concept previews, not live data. No changes.

## FD-103 — Founder dashboard design spec (from 3 prototype images)
- Colors: bg `#0A0D13`, panel `#111827`, gold `#D4AF37`, white `#FFFFFF`, green `#16A34A`, blue `#2563EB`, purple `#7C3AED`.
- Typography: Manrope 32px/700 (headings), Inter 14px/500 (labels).
- Card radius 20px, padding 24px. Gold glow around logo. Soft blue ambient background.
- Hero banner = primary focal point.
- Components: sidebar nav + search bar + founder profile + stat cards + line chart + donut chart + conversation list + quick action buttons.
- Charts must be custom lightweight SVG (no chart library installed; do not add heavy deps).

## FD-104 — Vercel 12-limit hard rule (MANDATORY, never forget)
- Vercel Hobby allows max 12 serverless functions. Currently **3** (`api/auth.js`, `api/customer.js`, `api/public-chat.js`).
- **NEVER add a new top-level file under `api/`.** Every new endpoint goes inside the existing 3 files.
- After every phase verify: no new `api/*.js` file, `vercel.json` untouched, build passes, then deploy is safe.

## FD-105 — Login/demo bug (user-reported, root cause confirmed)
- Root cause: `api/customer.js` demo sign-in logs every public user into the **same shared `demo@garudaos.in`** account → one user "sees/opens" another user's session/data.
- Demo sandbox link (`demo-stage.garuda.ai`) is not linked anywhere in the public UI.
- Fix required: demo session isolation + stale demo cookie cleanup + public demo link (frontend-only) + login flow verification.

## FD-106 — GARUDA is NOT company-specific; it is a thinking core
- GARUDA must evolve as a **general intelligence core**, not a scripted parrot per company/industry.
- Example given by founder: if a tarot reader / astrologer / occult practitioner asks for leads, GARUDA must adapt — never reply with irrelevant canned advice.
- Architecture direction (3 layers):
  1. **Core Mind** — shared reasoning/memory/knowledge (already exists: Mother Brain, RAG, universes).
  2. **Domain Knowledge Packs** — per-domain data packs (documents/do's-don'ts), loaded into RAG. DATA not code.
  3. **Business Understanding + Generation** — intake questions → Business Profile → GARUDA generates messages from profile + knowledge.
- Founder control remains supreme: every significant action founder-gated; founder words are last.

## FD-107 — Lead-gen generalization (multi-industry, phase 4)
- Current lead-gen + pitch + outreach is insurance/ABSLI-locked (hardcoded pitch text, insurance topics, `data/insurance-*` paths).
- Decision: make it **multi-industry** via generic config/knowledge-pack layer. Insurance stays as first domain, **backward-compatible**, tests must keep passing.
- Live industry for first real test: **TBD by founder later** — engine work comes first (revenue-first principle; GARUDA is early-stage).

## FD-108 — Revenue-first, nothing left behind
- Primary aim: revenue. Execution order: (1) login/demo fix, (2) founder dashboard polish, (3) Kingdom documentation, (4) lead-gen generalization.
- Every discussion above is to be preserved in this log so future sessions can resume exactly.
