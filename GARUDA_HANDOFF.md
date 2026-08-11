# GARUDA HANDOFF — Redesign Chunk (10 Aug 2026)

> Source of truth for the frontend redesign that starts next session.
> Saved so work resumes exactly from here. Discussion logs and decisions are captured below.

---

## ✅ COMPLETED SESSION 1 (deployed + pushed)

| Work | Commit | Status |
|---|---|---|
| Insurance lead-gen engine + survival dispatch + SMTP live (App Password) | `6719c40` | ✅ |
| Public Razorpay Payment Page buttons (landing) | `0c3592b` | ✅ |
| Vercel consolidation: 14 → 3 serverless functions | `a2bf7ac` | ✅ live healthy |
| 27-Universes map added to `/app` customer dashboard | `ff979ba` | ✅ |
| Premium "Make a Payment" button in customer portal | `e1cd8eb` | ✅ |

**Gmail App Password** (`GARUDA_EMAIL_PASS` in `.env`): `mpzd npqv qmme ozqp` — SMTP verified PASS (`accepted:true`). Never commit `.env`.

**Payment URL** (single source): `GARUDA_PAYMENT_PAGE_URL` / `VITE_PAYMENT_URL` = `https://razorpay.me/@garudaosincompany`. The `rzp.io/rzp/6ZGtcY9` link was a test self-payment — wrong, do not use.

**Live endpoints currently healthy** (garudaos.in): landing 200, `/api/auth/session`, `/api/customer/session`, login 401-checks, `/api/public-chat` POST works.

---

## 🚧 IN-PROGRESS (NEXT SESSION) — Frontend Redesign

**NOT STARTED.** Full plan is captured in this handoff + the "Plan" discussion in chat.

### Why (founder's complaints)
1. Customer dashboard `/app` shows founder-end data publicly — inner core is founder-only subject.
2. Layout looks like a "train" (stacked, ugly) — needs horizontal left→right, tidy arrangement.
3. Pay button missing inside public page (landing has it).
4. Need industry guides — how GARUDA helps lawyers (legally), doctors, hotels, inns + more.

---

## 📐 FINALIZED DECISIONS (founder-approved)

### 1. Pay button
- Landing already has it (header `Pay`, hero `Make a Payment`, final CTA).
- `/app` public page must also have premium "Make a Payment" — **already added in `e1cd8eb`, pending deploy → hard-refresh to verify**.

### 2. Universe split — 27 total
**Public (16)** — horizontal, tidy:
Creative (+ its 6 studios inside), Career, Finance, Business, Education, Health, Relationship, Travel, Lifestyle, Content, Branding, Digital Presence, Entertainment, Innovation, Collective Intelligence, Consciousness & Future.

**Founder-internal (11)** — founder page only:
Knowledge, Reasoning, Memory, Learning, Decision, Automation, Communication, Security, Governance, **Revenue**, Wealth.

### 3. Revenue Universe rules (CRITICAL)
- **Revenue = founder-only, NEVER public.** Its internal details (what GARUDA is doing) stay on founder page.
- **All universes connect to Revenue by default** → Revenue is the reporting hub.
- **Every universe reports to founder page** → founder sees individual performance of each universe.

### 4. Layout
- Kill the "train" stacked look.
- Horizontal left→right arrangement, tidy, snap-scroll strips.
- Public page AND founder page both horizontal.

### 5. Industry guides
- Lawyers/Legal, Doctors & Clinics, Hospital & Healthcare, Hotels, Restaurants & Inns, CA & Auditors, Real Estate, Schools & Coaching, Gyms & Wellness, Dental Labs, Retail & Stores (+ more).
- Each shows "How GARUDA helps" (leads, follow-up, scheduling, records, compliance, payments).

---

## 📋 TASK LIST (next session, in order)

1. Save this handoff to `GARUDA_HANDOFF.md` ✅ (done)
2. `frontend/src/config/universes.js`: add `scope: "public"|"founder"`, `group: CREATE/GROW/LIVE/FUTURE` for public 16, `reportsToRevenue: true` on all + `hub: true` on Revenue.
3. New `frontend/src/config/industryGuides.js`: 10+ industry guides.
4. New `frontend/src/components/UniversesStrip.jsx`: horizontal left→right scroll strips, snap, tidy.
5. New `frontend/src/components/IndustryGuides.jsx`: horizontal industry guide cards.
6. `CustomerDashboard.jsx`: replace `UniversesGrid` with `UniversesStrip`, add guides section, **zero founder data**.
7. `FounderWorkspace.jsx`: add "Inner Core — Founder Universes" horizontal strip + Revenue hub card + per-universe performance.
8. `PublicLanding.jsx`: remove founder-end figures (₹8.4L / pipeline / tasks) from "Control Center preview" → replace with 27-universe architecture teaser (no fake numbers).
9. Build (`npm run build` in `frontend/`), live-check, commit + push.

---

## ⏳ UNRESOLVED BLOCKER

- Landing's "Control Center preview" section shows ₹8.4L revenue / pipeline / tasks figures. **NOTE: these are concept previews, not real data.** Next session confirm: (A) remove it and replace with 27-universe teaser, or (B) keep as-is.

---

## 💾 FILE MAP

- `frontend/src/config/universes.js` — the 27-universe map (source of truth)
- `frontend/src/components/UniversesGrid.jsx` — current grid (to be replaced/refactored into strip)
- `frontend/src/components/UniverseDetail.jsx` — detail overlay (reuse)
- `frontend/src/pages/CustomerDashboard.jsx` — public customer portal
- `frontend/src/pages/FounderWorkspace.jsx` — founder desktop
- `frontend/src/pages/PublicLanding.jsx` — public landing page
- Existing docs: `GARUDA_STATE.md`, `GARUDA_TASK_QUEUE.md`, `GARUDA_ROADMAP.md`, `GARUDA_INSURANCE_RUNBOOK.md`

---

## 🔑 KEY COMMANDS

- Build: `cd frontend && npm run build`
- Tests: `npm test` (root, insurance lead-gen suite 10 tests)
- Deploy: auto via git push (Vercel) + Render
- Surge/scheduler: `npm run leads:*` scripts