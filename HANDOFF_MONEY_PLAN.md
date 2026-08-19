# HANDOFF — 2026-08-20 (MONEY FOCUS) — DO THIS TOMORROW

> Prepared: 2026-08-20 late night. Founder went to sleep. Goal tomorrow:
> **GARUDA se REAL PAISA/INCOME** — not more plumbing.
> Everything below is grounded in what actually exists. No fluff.

## ⛔ Today's honest state (verified facts, not feelings)

1. **Telegram bot FIXED + LIVE + DEPLOYED** ✓
   - Root cause was: deployed Render had no `GARUDA_LLM_PROVIDER`/`GEMINI_API_KEY`
     → bot lied "engine load ho raha hai".
   - Fix committed `9eca8b5`, pushed to GitHub (`06bf4b4`), Render auto-deployed.
   - **VERIFIED LIVE:** webhook test returned real gemini reply
     `"Haan bhai, GARUDA online hai, full operational."` (provider gemini-2.5-flash).
   - Render env now has `GEMINI_API_KEY` + `GARUDA_LLM_PROVIDER=gemini` (founder added).

2. **`universes.md` written + committed** (`06bf4b4`) — canonical 27-Universe architecture doc (~1300 lines).

3. **THE REAL BLOCKER (this is why "koi qualified prospects nahi mila"):**
   - `data/` folder is **gitignored → 0 files on Render/GitHub**.
   - All prospects/contacts/ledgers live ONLY on founder's local machine.
   - Render bot runs `generateContactsCsv` → file doesn't exist → always 0 prospects.
   - **Money cannot flow through the bot until data reaches the server (or commands run locally).**

4. **Local data snapshot (what actually exists):**
   - insurance: 91 total, **8 scored left (2 HOT: score>=60)** — dreamsolutionsjaipur(63),
     varun@gvcaudit(75); 6 LOW (37-39). Rest already `queued_for_outreach` (emailed).
   - All other domains: **0 scored** (clinic, education, hospital, hotel, restaurant,
     salon, web_services exhausted; gym 1 scored).
   - → **There are almost NO fresh leads to email locally.** New money needs NEW prospects.

5. **Bot is NOT a command center yet** — `garudaCommandRouter` handles only 5 commands:
   income_goal, leadgen, outreach, affiliate, insurance_pitch. Default domain = insurance.
   Revenue Engine / Opportunity Discovery / Mission orchestration / Mother are NOT
   wired into Telegram. (Documented in this session; expansion planned.)

## 🎯 TOMORROW'S MONEY PLAN (in priority order)

### STEP 1 — Get REAL new prospects (this is where income starts)
- **PRIORITY 1A: Insurance 2 HOT prospects** (varun@gvcaudit 75, dreamsolutionsjaipur 63).
  These are scored+qualified RIGHT NOW. Craft a genuinely premium, personalized
  ABSLI outreach (FD-021/FD-022: premium copy + recipient-specific visual page),
  preview, founder approves, SEND via existing SMTP (`leads:send` / insurance outreach).
  **This is the fastest possible real-money action.**
- **PRIORITY 1B: Fresh lead generation** — run `scout`/discovery + `leads:generate`
  for new qualified prospects across domains. Old ones are exhausted.
- **PRIORITY 1C (strategic):** Decide real offer to sell tomorrow. Options to pitch:
  insurance advisory (ABSLI partner), websites/AI agents/automation/leadgen for
  businesses (garudaos.in services). **A paid offer + payment link (Razorpay ALREADY
  wired) = real income.**

### STEP 2 — Data must reach the server (or run locally)
- **2A (recommended, no secrets):** MongoDB sync — Render DB already connected.
  Write a seed/sync script: local `data/*-prospects.json` → Mongo → bot reads Mongo.
  Don't commit raw leads to git (FD-020).
- **2B (quick local):** Run outreach locally from founder's machine (scripts exist:
  `npm run leads:send`, `npm run insurance:send`). Works today, no server needed.

### STEP 3 — Make the bot a command center (so founder can command money ops from phone)
- Expand `garudaCommandRouter`: add `/revenue`, `/opportunities`, `/missions`,
  `/status`, `/command-center` wired to real services:
  `opportunityDiscoveryService`, `revenueCommandCenterService`,
  `revenueExecutionMissionService`, mother status.
- Then "leads generate" should answer with REAL counts per domain, not a canned
  insurance message.

### STEP 4 — Verify income loop end-to-end (this is the definition of done)
- Lead → outreach sent (approval) → reply/interest → pitch → **Razorpay payment link
  paid** → webhook verified → settlement ledger → founder sees real money.
- All these services EXIST and PASS tests. Missing piece is real people replying.

## 🔧 Gotchas (repeated so tomorrow doesn't waste time)
- `data/` is gitignored. Never commit it. If deployed bot must see data → Mongo, not git.
- `reports/mother-cycle-report.json` changes every cycle — leave it.
- Approval = `GARUDA_FOUNDER_APPROVED=true` env or `x-garuda-founder-approved: true` header.
- Local `.env`: gemini configured. Ollama `qwen2.5-coder:3b` local fallback available.
- Render deploys from GitHub `main`. Push to deploy.
- FD-021/FD-022: every outreach = premium copy AND premium recipient-specific visuals.
- Don't run blind LLM test scripts; read the file before executing.

## ✅ Today's commits (all pushed)
- `9eca8b5` fix(telegram): honest engine-unavailable reply
- `06bf4b4` docs: universes.md + handoff complete
- `0ef76fb` docs: money-focus handoff

## 🔴 TOMORROW'S FIRST TASK (before money plan) — Fix gemini 503

**Founder report (tonight):** bot replied with big message `gemini_http_503` —
"high demand, try again later". Bot is now honest (no more lying), but gemini
transient 503 kills the answer instantly.

**Root cause (diagnosed, verified):** `src/rag/llmAdapter.js` line ~808-812:
```js
if (res.status === 404 || res.status === 400 || res.status === 429) {
  continue;   // only these retry against next candidate model
}
return lastResult;  // 503 returns FATAL here — no retry, no backoff
```
Render has ONLY gemini configured (NVIDIA key dead/403) → no fallback survives →
honest "engine unavailable". 503 is Google transient overload (seconds), must retry.

**Fix (small, one file — `src/rag/llmAdapter.js`):**
1. Add `sleep()` helper (~5 lines).
2. Gemini path: on 503/429/500/502/504 retry SAME model up to 3× with backoff
   (1s → 2s → 4s), then `continue` to next candidate model. Keep 401/403 fatal
   (auth errors, not retryable). Apply same retry to the catch/network-error block.
3. Verify: local mock test (503 then 200 → confirm retry works), real gemini call
   3-4×, `node --check`, re-run mother LLM tests
   (`conversationalIntelligenceRegression`, `localCognitiveResourceIntegration`).
4. Optional: soften/trim the telegram engine-unavailable message.

Then push (`git push origin main`) → Render auto-deploys → test bot again.