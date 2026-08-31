# GARUDA Growth Intelligence / Digital Marketing Stage — Implementation Log

> Durable cross-session handoff document. Update after EVERY completed phase.
> Canonical law: exactly 27 Universes (LOCKED_UNIVERSE_COUNT = 27). The Growth Intelligence
> Layer is a CROSS-UNIVERSE ORCHESTRATION LAYER — it is NOT Universe 28 and must never be
> presented as one.

---

## CURRENT MISSION

Build the GARUDA Growth Intelligence / Digital Marketing Stage as a real cross-universe
execution foundation that orchestrates U21 Brand, U20 Content, U19 Creative, U22 Digital
Presence, U07 Communication, and U10 Revenue under a single Campaign Command architecture
with founder-approval gates.

Status labels used throughout (mandatory truth vocabulary):
- VERIFIED & LIVE — tested, real provider/IO wired
- BACKEND WIRED — real backend logic + persistence, reachable via API
- PARTIALLY IMPLEMENTED — real but incomplete scope
- DETERMINISTIC / TEMPLATE ENGINE — structured deterministic output, NOT AI-generated
- BLUEPRINT EXISTS — contract/interface defined, no engine
- DEMO / UI PROTOTYPE — client-side mock, no backend call

---

## PHASE 0 — READ-ONLY RECONNAISSANCE  ✅ COMPLETE

Date completed: 2026-08-31
Commit: (see git log — `docs(growth): record digital growth stage architecture reconnaissance`)

### A. Repository & Runtime Architecture (verified)

- Monorepo, single Express backend + React/Vite frontend + Vercel serverless functions.
  - Backend: `src/app.js` (Express 5, mounts routers under `/api`), started by `server.js`
    (port 3000, Mongo optional — degraded mode still serves file/Supabase features).
  - Frontend: `frontend/` — React 19 + react-router-dom v7, Vite config at repo root
    `vite.config.mjs` (`root: "frontend"`, port 5173, NO dev proxy configured).
  - Serverless: `api/*.js` (auth, customer, founder, project-scope, proposals, public-chat…)
    used on Vercel; everything else proxied by `vercel.json` catch-all
    `/api/:path*` → `https://garuda-ai-xfif.onrender.com/api/:path*` (Render).
  - `backend-node/` — separate tiny TS package (risk assessment only, `npm run test:risk`).
- Frontend routes: `frontend/src/App.jsx`. Ring 3 studios: `/creative`, `/content`,
  `/brand`, `/digital-presence`, `/entertainment`. Founder-gated: `/founder`,
  `/command-center`, `/founder/acquisition`, `/revenue`.
- API response convention: `{ success: true, data: … }` / `{ success: false, error }`,
  status 400 for bad input, 404 not found, 500 internal.
- Persistence conventions: singleton service classes + JSONL append-only files in `data/`
  (e.g. `marketing-calendars.jsonl`, `brand-profiles.jsonl`, `marketing-campaigns.jsonl`,
  `creative-briefs.jsonl`), Map store loaded at module init. Some services use Mongo
  when connected (outboundCommunicationService, revenueService).
- Event bus: `garudaEventService` + `garudaEventTypes.js` (already has
  `CAMPAIGN_CREATED`, `CAMPAIGN_UPDATED`, `CAMPAIGN_ASSET_READY`,
  `BRAND_PROFILE_CREATED/UPDATED`). `crossUniverseEventWiring.js` wires producers→consumers.
- Shared contracts: `src/services/growthSharedContracts.js` — canonical
  PROVIDER_LIFECYCLE_STATES, PROVIDER_HEALTH_STATUSES, GENERATION_OUTPUT_TYPES,
  METRIC_TRUTH_CLASSIFICATIONS. Reuse these — do not invent parallel enums.
- Tests: plain Node scripts using `assert`, run directly (`node path/test.js`), wired as
  `test:*` scripts in package.json. `npm test` = mother script + backend-node risk.
  Two test styles exist: pure service assertion tests (capabilityRegistryService.test.js)
  and end-to-end suites with console sections (digitalGrowthBatch1EndToEnd.test.js).
- LLM layer: `src/services/llmProvider.js` wraps configured providers
  (GEMINI_API_KEY + NVIDIA_API_KEY are present in local .env — LLM IS genuinely configured).
- Image/Video providers: NO external image/video/music provider keys are configured
  (no REPLICATE/OPENAI/STABILITY/ELEVENLABS). `imageGenerationRouter` /
  `videoGenerationRouter` correctly report NOT_CONFIGURED and emit truthful
  PROVIDER_UNAVAILABLE states. Local sovereign SVG generation works.
- Deployment: Vercel (frontend) + Render (Express API). Direct pushes to `main` are the
  existing workflow (recent history is all direct-to-main commits).

### B. Canonical universe registry (verified)

- `frontend/src/config/universes.js` — 27 universes, `LOCKED_UNIVERSE_COUNT = 27`, rings 1-4.
  Relevant entries:
  - U19 Creative — STUDIO_EXECUTABLE, engines: creativeStudioService, image/video routers, creativeQualityService
  - U20 Content — STUDIO_EXECUTABLE, engines: digitalMarketingOsService
  - U21 Brand — STUDIO_EXECUTABLE, engines: identityLockService
  - U22 Digital Presence — PRODUCTION_VERIFIED, engines: garudaCroService
  - U07 Communication — PRODUCTION_VERIFIED, engines: outboundCommunicationService, emailRelayService, telegramBotService
  - U10 Revenue — PRODUCTION_VERIFIED (hub), engines: persistentProposalService, razorpayPaymentLinkService, revenueClosingSystemService
  - STATUS vocabulary in this file: PRODUCTION_VERIFIED / STUDIO_EXECUTABLE / BACKEND_WIRED / BLUEPRINT_EXISTS / ROADMAP
- `universes.md` (1322 lines) is the canonical constitution doc. Do not modify universe count.

### C. Existing reusable backend services (verified by direct read)

| Service | Lines | State | Notes |
|---|---|---|---|
| `digitalMarketingOsService.js` | 475 | BACKEND WIRED (deterministic) | content pillars, 4-week editorial calendar (persisted JSONL), carousel, topic clusters, article brief, landing-page blueprint, review responses, digital-presence profile. Template/deterministic; real-estate-flavored copy templates; has truthNotice on SERP data. Exported singleton + class. |
| `identityLockService.js` | 385 | BACKEND WIRED | brand profiles (create/update/list/get), sha256 lockHash, validateCompliance (prohibited copy/visual scan, CTA check), buildCampaignFamilySpec. JSONL persistence + events. |
| `creativeStudioService.js` | 520 | BACKEND WIRED (providers truthful) | createCreativeBrief, generateConcept, generateAsset (SVG local / provider), generateVideoStoryboard, generateCampaignFamily, getAssetLibrary. Provider truth: UNAVAILABLE ≠ 0. |
| `garudaCroService.js` | 226 | BACKEND WIRED (deterministic) | evaluateCroDealStrategy (why-buy/why-not/emotional+commercial triggers/proof required/negotiation conversation), learnFromDealOutcome, getCroLearningHistory (2 seeded baseline deals — labeled baseline, not fake metrics). |
| `performanceMarketingService.js` | ~540 | BACKEND WIRED | THE existing campaign entity: createCampaign, attachCreativeToCampaign, Meta/Google campaign MAPPINGS (references, not live spend), recordConversionEvent, UTM lookup, getCampaignPerformance, getAggregatePerformance. Truth laws: never fabricate platform metrics; AD_PLATFORM_DATA_UNAVAILABLE states. |
| `realEstateGrowthService.js` | — | BACKEND WIRED | Vertical orchestration (real estate only). Pattern reference for vertical growth services. |
| `clientProductionPipelineService.js` | — | BACKEND WIRED | client register/onboard/launch readiness. |
| `growthSharedContracts.js` | — | BACKEND WIRED | canonical enums/contracts for growth domain. |
| `outboundCommunicationService.js` (U07) | 140 | BACKEND WIRED | draftCommunication (status APPROVAL_REQUIRED unless founderApproved), approveAndSend (403 without founder approval; real Telegram send if configured), getCommunication. Mongo or in-memory fallback. |
| `revenueOutreachService.js` (U07/U10) | — | BACKEND WIRED | OutreachQueueManager with explicit founder authorization gate, connectors, metrics. |
| `persistentProposalService.js` (U10) | — | BACKEND WIRED | proposals, accept, deposit→project activation, leads listing. |
| `razorpayPaymentLinkService.js` (U10) | — | BACKEND WIRED | payment link generation/dispatch/status/webhook verify. |
| `universalRevenueService.js` (U10) | — | BACKEND WIRED | getGarudaRevenueState. |
| `llmProvider.js` | — | CONFIGURED (Gemini/NVIDIA) | pluggable LLM intelligence for strategy generation later. |

### D. Existing API surface relevant to growth (verified — `src/routes/growthCreativeRoutes.js`, mounted at `/api`)

Already LIVE:
- `/api/creative/brief|concept|asset|video-storyboard|campaign-family|library|providers|provider-discovery|machine-audit|operations-snapshot|image-providers/health/:id|video-providers/health/:id`
- `/api/creative/brand-profile` (POST), `/api/creative/brand-profiles` (GET), `/api/creative/brand-profile/:id` (GET), `/api/creative/validate-compliance` (POST)
- `/api/growth/content-pillars` (POST), `/api/growth/calendar` (POST), `/api/growth/carousel` (POST),
  `/api/growth/seo/clusters` (POST), `/api/growth/seo/article-brief` (POST),
  `/api/growth/landing-page` (POST), `/api/growth/reviews/draft` (POST),
  `/api/growth/digital-presence` (GET)
- `/api/growth/campaigns` (POST create / GET aggregate), `/api/growth/campaigns/:id` (GET),
  `/api/growth/campaigns/:id/meta-mapping|google-mapping` (GET), `/api/growth/conversions` (POST)
- `/api/growth/real-estate/buyer-personas` (GET), `/api/growth/real-estate/orchestrate` (POST)
- `/api/growth/clients/register|onboard`, `/api/growth/clients/:id`, `/api/growth/clients/:id/readiness`

MISSING (to be built):
- Business brief → Growth Strategy generation (`/api/growth/strategy`)
- Cross-universe Campaign orchestration object + lifecycle (`/api/growth/campaign-command/*`)
- Founder approval endpoint for orchestrated campaigns
- Any frontend consumption of ALL of the above

### E. UI truth audit (verified by reading page code)

| Page | Route | Verdict |
|---|---|---|
| `ContentStudio.jsx` (199 ln) | `/content` | **DEMO / UI PROTOTYPE.** Zero fetch calls. Output hardcoded in a `setTimeout(…, 700)`. Does NOT call the live `/api/growth/calendar`. |
| `BrandStudio.jsx` (196 ln) | `/brand` | **DEMO / UI PROTOTYPE.** Zero fetch calls. Hardcoded dossier via setTimeout. |
| `DigitalPresenceStudio.jsx` (193 ln) | `/digital-presence` | **DEMO / UI PROTOTYPE.** Zero fetch calls. Hardcoded via setTimeout. |
| `CreativeStudio.jsx` (576 ln) | `/creative` | **DEMO / UI PROTOTYPE.** Zero fetch calls. Fake compose-music + fake film via setTimeout (WebAudio beep playback only). Does not call live `/api/creative/*`. |
| Founder pages (HighCommandCenter, FounderWorkspace, RevenueDepartment, …) | — | Real `/api` fetches (auth/session, founder command, proposals). Reference pattern for API wiring. |

### F. Risks & constraints

1. Vercel `/api/:path*` catch-all → Render backend. New `/api/growth/*` routes are
   automatically available in production once merged — no vercel.json change needed for API.
   New PAGE routes DO need a vercel.json rewrite + prerender-seo route entry.
2. Vite dev server has no `/api` proxy — studio API wiring will 404 in `npm run dev:frontend`
   unless we add a small proxy to `vite.config.mjs` (low-risk, planned in Phase 5).
3. Naming collisions checked: `growthStrategyService.js` and `campaignOrchestratorService.js`
   are FREE. Existing `revenueOrchestratorService` / `revenueMissionOrchestratorService` are
   distinct concerns (revenue missions) — do not merge.
4. `performanceMarketingService` campaigns ≠ cross-universe Campaign. They are ad-lifecycle
   campaign records with platform mappings. The new orchestration Campaign is a SUPERIOR
   object that should REFERENCE performance campaigns for measurement, not replace them.
5. Do not rename/move/split existing services. Adapt via adapters only.
6. Mongo is optional at runtime (degraded mode). New persistence must follow the JSONL
   file-store convention like sibling growth services so it works in degraded mode.
7. `digitalMarketingOsService` template copy is real-estate-flavored. Phase 3 must make
   templates brief-driven WITHOUT breaking existing route contracts (backward-compatible
   parameterization only).

### G. Proposed implementation phases (verified-safe path)

- **Phase 1 — Growth Domain Foundation**: `src/services/growthStrategyService.js`
  (structured business brief → GrowthStrategy object: audience, positioning, objective,
  funnel stages, channel strategy, content/creative/presence/communication/revenue/measurement
  requirements). Deterministic strategy engine + clearly-labeled pluggable LLM hook
  (`llmProvider` later). JSONL persistence (`data/growth-strategies.jsonl`).
  Tests: `growthStrategyService.test.js`.
- **Phase 2 — Campaign Orchestration**: `src/services/campaignOrchestratorService.js`.
  Campaign object (campaignId, businessBrief, growthStrategy, brandContext, contentPlan,
  creativeBriefs, presencePlan, communicationPlan, revenueHandoff, measurementPlan, status).
  Lifecycle: DRAFT → STRATEGIZED → READY_FOR_APPROVAL → APPROVED → EXECUTION_PENDING (+
  EXECUTING/COMPLETED later). Founder approval REQUIRED; no auto-dispatch; no spend.
  JSONL persistence (`data/growth-campaigns.jsonl`), emits CAMPAIGN_CREATED/UPDATED events.
  Tests: `campaignOrchestratorService.test.js`.
- **Phase 3 — Universe adapters**: `src/services/growthUniverseAdapters.js` — thin adapters
  that CALL (not modify) identityLockService (brand context), digitalMarketingOsService
  (content plan), creativeStudioService (creative briefs), performanceMarketingService
  (measurement linkage). Brief-driven parameterization of digitalMarketingOs templates via
  new optional input fields only (backward compatible). Tests per adapter.
- **Phase 4 — Growth Command API**: new `src/routes/growthCommandRoutes.js` mounted in
  `src/app.js` BEFORE the existing `/api` router at `/api/growth`:
  `POST /api/growth/strategy`, `POST /api/growth/campaign`, `GET /api/growth/campaign/:id`,
  `GET /api/growth/campaigns`, `POST /api/growth/campaign/:id/approve`,
  `GET /api/growth/campaign/:id/plan/:universe`. Same `{success,data}` convention.
  Tests: route-level e2e via supertest-style direct handler invocation or app-level fetch test.
- **Phase 5 — Growth Command Center UI**: `frontend/src/pages/GrowthCommandCenter.jsx`,
  route `/growth-command` (founder-gated like command-center), vercel.json page rewrite +
  prerender route, vite dev proxy. Real API calls, loading/error/empty states, approval gate.
- **Phase 6 — Studio page connection**: rewire ContentStudio (/api/growth/calendar),
  BrandStudio (/api/creative/brand-profiles + validate-compliance),
  DigitalPresenceStudio (/api/growth/landing-page, /api/growth/seo/clusters,
  /api/growth/digital-presence), CreativeStudio (read-only brief→concept→asset-provider-truth).
  Each shows explicit output-class badges (LIVE ENGINE OUTPUT / STRATEGY OUTPUT /
  PROVIDER NOT CONNECTED / DEMO).
- **Phase 7 — Communication + Revenue handoff contracts**: communicationPlan →
  outboundCommunicationService drafts (APPROVAL_REQUIRED), revenueHandoff →
  persistentProposalService lead/proposal linkage contract + acquisitionAttribution
  identifiers. No autonomous sending.
- **Phase 8 — End-to-end demonstration**: `growthCampaignEndToEnd.test.js` driving the real
  pipeline: Business Brief → Strategy → Campaign → universe plans → approval gate →
  handoff contracts. Real estate project example via the ACTUAL pipeline (not hardcoded).

---

## WHAT IS COMPLETE (running total)

- Phase 0 reconnaissance: COMPLETE (this document).

## WHAT REMAINS

- Phases 1–8 (see G above). Phase 1 is the exact next step.

## EXACT NEXT STEP FOR NEXT AGENT

Implement Phase 1:
1. Create `src/services/growthStrategyService.js` — deterministic brief→strategy engine,
   JSONL persistence `data/growth-strategies.jsonl`, pluggable `strategyIntelligence`
   hook interface (LLM later, clearly labeled `engine: "DETERMINISTIC_TEMPLATE_V1"`).
2. Create `src/services/growthStrategyService.test.js` following
   capabilityRegistryService.test.js style (plain assert, run via node).
3. Add `"test:growth:strategy": "node src/services/growthStrategyService.test.js"` to package.json.
4. Run the test, update this log (PHASE 1 section), commit:
   `feat(growth): add cross-universe growth strategy foundation`.
