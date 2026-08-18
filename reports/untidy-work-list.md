# UNTIDY WORK LIST — Deferred (Debug & Configure Later)

Status as of commit `54fed44` (2026-08-18). Original list was captured at commit `8aeab36`.
This file tracks what remains intentionally uncommitted and what has been resolved.

## ✅ RESOLVED

### 1. Mother cycle report churn (RESOLVED)
- Root cause: `runPackageTestScript` spawned `npm.cmd` with `shell:false` → instant `EINVAL` on
  Windows, so mother's `run_validation` step failed every cycle.
- Fix (commit `54fed44`): win32 spawn via `cmd.exe /d /s /c`; recursion guard — when the npm
  `test` script shells back into mother (`test:mother` → `mother.js`), it now runs a bounded
  `node --check` syntax validation instead (`source: package_script_syntax_bounded`,
  `recursionGuard: true`).
- Verified: full mother cycle runs 4/4 SUCCESS; `reports/mother-cycle-report.json` regenerated clean.

### 2. Mother memory timestamp churn (NO ACTION)
- `scripts/mother/memory.json`: only a `completedAt` timestamp changes on each runtime run.
  Harmless runtime artifact — left uncommitted.

### 3. Mountbatten approval script (DONE — sent)
- `scripts/garuda-send-mountbatten-approval.js`: ledger (`data/hotel-outreach-ledger.json`) shows
  the founder-approved email to `info@mountbattenlodge.com` was SENT successfully
  (2026-08-16T10:27Z, SMTP 250 OK) after one failed attempt (bad SMTP creds, since fixed).
  Script kept as the governed idempotency record; remains untracked by design.

### 5. Revenue wire repair test (AUDIT PASSED)
- `src/services/revenueWireRepair.test.js` ran against production DB `garuda_ai` (read-only):
  **88 genuine records, received=0 (evidence-only), pending=59,260 INR, all opportunity-linked,
  zero fabricated received revenue.** Not wired into `npm test` (requires live DB) — kept standalone.

## ⏳ OPEN / DEFERRED

### 4. P16 revenue-execution build script (CODE FIXED — DATA UNVERIFIED)
- `scripts/p16-revenue-execution-build.js`: code bugs fixed (undefined `n` in `calculateProbability`,
  undefined vars in `main()`, broken rank comparator, auto-connect/auto-run guarded behind
  `require.main === module`). Pure functions unit-tested.
- ⚠️ The 50-business dataset is UNVERIFIED (hardcoded names/emails/websites). Must NOT run against
  the production database until the founder reviews and approves the dataset.

### prod-cleanup.mjs (kept)
- `scripts/prod-cleanup.mjs`: production ops tool (sweep ineligible candidates / import insurance
  contacts / verify post-sweep state). Kept as operational tooling; untracked.

## Deployment rule (committed in this push)
`GARUDA_ARCHITECTURE.md` rule #9: **`garuda-ai-v1` is the ONLY Vercel deployment project.** Every push
deploys only to `garuda-ai-v1` and reflects on `garudaos.in`. Other Vercel projects are ignored (not deleted,
not deployed, never given the `garudaos.in` domain).