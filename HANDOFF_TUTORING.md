# GARUDA-AI — Session Handoff (URGENT STOP → RESUME HERE)

> Status: **WORK COMPLETE, NOT COMMITTED**. Terminal corrupt — session aborted.
> This note is the resume point. Read this file first after restart.

## Mission (why this session)

Founder's sister teaches Maths to Class 8 kids. Bot earlier CLAIMED ("pitch ready, $15 / 60 AED,
scanning live hai, expat community boards") with NO real work happening — those were LLM
hallucinations. The Telegram webhook is **synchronous** (one reply, no follow-up), and no scraping
code existed. This session built a REAL background web-research pipeline for USA/Dubai tutoring
center (B2B) leads and made the bot honest.

## What was verified (root cause)

- Webhook live: `https://garuda-ai-xfif.onrender.com/api/telegram` (pending_update_count: 0).
- Telegram flow runs on **Render** (`src/app.js` → `POST /api/telegram`), NOT Vercel.
- All existing lead data is Indian insurance education-prospects; NO USA/Dubai tutoring data.
- Emails WERE sent (insurance 85/85, education 14 sent 1 bounced) — outreach engine is real.
- Only pitch engine existed = insurance (ABSLI). No tutoring pitch existed.
- `parseIndianAmount` couldn't parse `$`/`AED` → silently stored INR 5,00,000.
- Silent `catch {}` in `telegramBotService.js` swallowed all command errors.
- Real background workers (pre-existing): `discoveryWorker` (~15 min),
  `revenueTaskRunnerWorker` (~2 min), `revenueAcquisitionWorker`.

## Decisions (approved by founder)

- **B2B model**: pitch USA/UAE tutoring centers/agencies to onboard the sister as an online
  Maths tutor (Class 8, ~$15/hr). No invented numbers in any pitch.
- **Web scraping required** (founder has no foreign data) → new scout service.
- Phase 1 + Phase 2 both approved.
- Truth markers convention added to founder replies (see below).

## Files created (UNTRACKED — will show as `??` in git status)

- `src/services/tutoringLeadScoutService.js` — real background web-research job.
  `startTutoringScan(location, options)` (fire-and-forget), `runTutoringScanOnce(...)`
  (search API → fetch home+contact pages → extract emails → `addProspects` into tutoring
  namespace), `getTutoringScanStatus()` (reads `data/tutoring-scan-status.json`),
  `extractEmails` (exact placeholder-domain filter), `parseDuckDuckGoHtml`,
  `findContactUrl`, `buildQueries`, test seams `searchFn`/`fetchFn`.
  Search provider order: **Google CSE → SerpAPI → DuckDuckGo HTML (free, no key)**.
- `src/services/tutoringLeadScoutService.test.js` — **15 passed, 0 failed**.
- `scripts/garuda-tutoring-scan.js` — CLI: `npm run tutoring:scan -- usa|dubai|both`.
- `scripts/garuda-tutoring-import.js` — CLI: `npm run tutoring:import -- <file.json>`.
- `data/tutoring-knowledge-index.json` — honest tutoring knowledge (no fake figures).
  NOTE: `data/` is gitignored → this is LOCAL ONLY (pitch degrades gracefully without it).

## Files modified (tracked)

- `src/services/leadgen/domainConfig.js` — added `tutoring` domain (namespace `tutoring`,
  English B2B hooks/brandLines, segments `tutoring_center/small_business/premium/chain`,
  `tutoringInferQuery()` → `partner_maths_tutor`, `locale: "en"`).
- `src/services/garudaCommandRouter.js` — added `parseAmount` ($/USD/AED/INR),
  `handleStatus`, `handlePipeline`, `handleTutoringLeads`, tutoring/pipeline/status
  detection in `detectCommand`, new switch cases. Income-goal detection widened to
  accept `$`/`USD`/`AED`/`dirham` so "$15 ya 60 AED target" records real currency.
- `src/services/telegramBotService.js` — truth markers appended; silent `catch {}` →
  real `[COMMAND ERROR]` reply.
- `src/services/founderMemoryService.js` — `buildPipelineSummary` now includes tutoring
  pipeline + scan status (lazy requires to avoid circular deps).
- `src/services/leadgen/genericLeadGenEngine.js` — `scoreProspect` preserves `country`.
- `src/services/leadgen/genericPitchEngine.js` — FIXED pre-existing `loadKnowledgeChunks`
  path bug: `path.join(__dirname, "..", "..", indexPath)` → `"..","..","..", indexPath`
  so `data/tutoring-knowledge-index.json` actually loads.
- `.env.example` — added tutoring search key docs.
- `package.json` — added `tutoring:scan`, `tutoring:import`, `tutoring:test`.

## Truth-marker convention (founder Telegram replies)

- `[EXECUTED: <command>]` — a real command ran.
- `[CONVERSATIONAL ONLY — koi background task ya command execute nahi hua]` — LLM chat reply.
- `[GROUNDED: ABSLI insurance knowledge]` — insurance advisor path.
- `[COMMAND ERROR]` — real error surfaced (was silent before).

## New Telegram commands

- `/pipeline` or `pipeline dikhao` — REAL file-based numbers per domain + tutoring scan status.
- `/status` or `kya chal raha` — MongoDB, webhook info, workers, SMTP (real, no guesses).
- `tutoring leads usa` / `tutoring leads dubai` / `tutoring leads usa and dubai` —
  starts the real background scan. Location detection handles USA/Dubai/both.
- Income goals now store currency: `5 lakh`, `$15`, `60 aed` all parse correctly.

## Test status (ALL PASSING — verified this session)

- `node src/services/tutoringLeadScoutService.test.js` → 15 passed.
- `node src/services/leadgen/genericLeadGenEngine.test.js` → 19 passed.
- `node src/services/founderMemoryService.test.js` → 6 passed.
- `node src/services/telegramInsuranceWorkerService.test.js` → 30 passed.
- `node src/services/insuranceAdvisorService.test.js` → 14 passed.
- `node src/services/revenueOutreachSprint5.test.js` → PASS.
- Tutoring pitch builds correctly (English B2B, no invented numbers).
- `buildMissionPlan` currency works (AED 60 test passed).

## Remaining steps (NEXT SESSION — in order)

1. **Commit this work** (currently NOT committed; 8 modified + 4 untracked).
   - Commit message suggestion: `feat(telegram): real tutoring lead-scout pipeline + honest status`
2. **Deploy to Render** (push to GitHub; Render auto-deploys from `main`).
3. **Add search keys to Render env** (for reliable foreign-lead scanning):
   - `GOOGLE_CSE_API_KEY` + `GOOGLE_CSE_ID` OR `SERPAPI_KEY`.
   - Without them the scan falls back to DuckDuckGo HTML (free but flaky).
4. **Live verify** on Telegram (founder chat):
   - Send `tutoring leads usa` → bot replies `[EXECUTED: tutoring_leads]`.
   - Send `/pipeline` a few times → scan progress increments (`sites scanned`, `emails found`).
   - Check `data/tutoring-prospects.json` (runtime file on Render) for real USA leads.
   - Run `npm run tutoring:preview` (if exists) or outreach preview to see the pitch.
5. **Cleanup** (optional): delete scratch files in
   `C:\Users\hp\AppData\Local\Temp\opencode\dbg-scan.js` and `dbg2.js`.

## Gotchas

- `data/` is **gitignored** — seed files and runtime state are LOCAL/instance only.
  The tutoring knowledge index will NOT deploy unless copied manually; pitch still works.
- `reports/mother-cycle-report.json` is runtime noise (tracked, changes every cycle) —
  tests may rewrite it; restore with `git checkout -- reports/mother-cycle-report.json`.
- Never commit `node_modules/`, `package-lock.json`, `scripts/mother/memory.json`, `.env`.
- Approval = `GARUDA_FOUNDER_APPROVED=true` env or `x-garuda-founder-approved: true` header.
- Telegram flow: founder chat only; `handleUpdate` in `src/services/telegramBotService.js`.
- Google CSE/SerpAPI search is async I/O; DuckDuckGo fallback scrapes HTML — keep
  `TUTORING_MAX_SITES` modest (default 20) to avoid long runs.