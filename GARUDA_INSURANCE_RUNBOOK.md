# GARUDA ABSLI OUTREACH ENGINE — RUNBOOK v2

## Positioning (Company Rule — LOCKED)
GARUDA ko **"insurance" bol ke pitch NAHI karna**. Company ne clear bola:
- Bolo: **AI Financial Advisor** + **ABSLI Financial Partner**
- Pitch hamesha **investment-first**: ₹30,000 se shuru, investment me hi suraksha included (10x protection), flexible (koi rigid fixed amount), multiple benefits
- Website **garudaos.in** har pitch me mention

## Files
| File | Kaam |
|---|---|
| `src/services/insurancePitchService.js` | ABSLI brochures (978 chunks) se premium Hinglish pitch |
| `src/services/insuranceOutreachService.js` | Ledger, 1/day cap, opt-out, SMTP send, preview |
| `src/services/insuranceLeadGenService.js` | **NEW** — Prospect intake + lead scoring + qualified CSV |
| `src/services/motherPlatformAuthService.js` | `sendSmtpNative` (ab export bhi hai) |
| `scripts/garuda-insurance-outreach.js` | CLI — preview/send/optout/status |
| `scripts/garuda-insurance-scheduler.js` | Daily auto-run (24/7) + LeadGen auto-refill |
| `scripts/garuda-insurance-leads.js` | **NEW** — Lead Gen CLI (add/import/score/generate/status) |
| `src/services/insuranceLeadGenService.test.js` | **NEW** — 10 lead-gen tests |
| `src/services/insuranceOutreachService.test.js` | 6 automated tests |
| `data/insurance-contacts.csv` | Outreach ke liye ready contacts (qualifed) |
| `data/insurance-prospects.json` | Raw prospects + scores (LeadGen ka source) |
| `data/insurance-outreach-ledger.json` | Har lead ka state |

## Commands
```bash
npm run insurance:test              # 6 outreach tests
npm run leads:test                  # 10 lead-gen tests
npm run insurance:preview           # pitches dekho (kuch send nahi)
npm run insurance:send -- --limit 5 # pehle 5 eligible ko bhejo
npm run insurance:send -- --all     # saare eligible ko
npm run insurance:optout -- EMAIL   # permanently opt-out
npm run insurance:status            # summary
npm run insurance:scheduler         # daily run (cron/Vercel)

# Lead Gen (pehle ye, phir outreach)
npm run leads:add -- "businessName=Sharma Traders,city=Jaipur,phone=9829012345,email=contact@sharmatraders.in,gstin=08ABC.."
npm run leads:add -- "businessName=Neha Classes,city=Ajmer,email=neha@x.in,notes=\"director, mother of two kids\""
npm run leads:import -- FILE.csv    # CSV/JSON batch import
npm run leads:score -- "businessName=...,city=..."   # sirf score dekho
npm run leads:generate -- --minScore 60   # qualified se contacts.csv banao
npm run leads:list -- --minScore 60  # scored prospects dekho
npm run leads:status                 # pipeline summary
npm run leads:remove -- EMAIL        # prospect delete
```

## Lead Gen — kaise chalta hai
1. **Prospect daalo** (`leads:add` ya `leads:import`) — sirf public/authorized info (Google Maps listing, public directory, business website, LinkedIn public page). Kabhi scrape mat karo; kisi rule mat todo.
2. **GARUDA score karta hai** — business-owner/MSME/parent/salaried signals se 0-99 score, auto query tag (family_protection | savings_investment | child_education | cancer_health | tax).
3. **`leads:generate -- --minScore 60`** — HOT/STRONG prospects hi outreach CSV me jaate hain.
4. **Scheduler** khud refill karta hai — agar contacts.csv khaali ho aur qualified prospects hon, toh auto-generate.

## Important — SMTP ab LIVE hai
- Gmail App Password ab `.env` me set hai (`GARUDA_EMAIL_PASS`) aur SMTP verify PASS hai (2026-08-10).
- **Warning:** `insurance:send` aur scheduler ab REAL emails bhejenge. Pehle `leads:generate -- --dry-run` / `insurance:preview` se verify karo ki contacts real aur qualified hain. Fake email contacts kabhi CSV me mat chhodo.

## Contacts CSV format
```
email,firstName,lastName,phone,query
rahul@gmail.com,Rahul,Kumar,9810000001,family_protection
```
`query`: `family_protection` | `savings_investment` | `child_education` | `cancer_health` | `tax`

## SMTP — WORKING (App Password set)
`.env` me `GARUDA_EMAIL_PASS` = Gmail App Password (16-digit, spaces ke saath), SMTP verify PASS (2026-08-10).
Gmail normal password par SMTP allow NAHI karta — regular password 534 error deta tha, App Password se 250 OK mila.
App Password kabhi share mat karo; `.env` git-ignored hai.

## Rules (auto-enforced, test-verified)
- 1 message per contact per day
- Opt-out permanent (reply UNSUBSCRIBE ya CLI)
- LeadGen: duplicate/no-email/opted-out prospects reject kar deta hai
- Founder ka naam (Praveen) pitch me KAHIN nahi
- "insurance agent" label pitch me KAHIN nahi — sirf Financial Advisor + Partner
- garudaos.in mention
- Preview pure (ledger kabhi mutate nahi)
- Figures brochure-verified, source ke saath, "terms & conditions apply"

## Tests verified
- Pitch positioning (advisor+partner+website+30k) + founder anonymity
- Relevant chunk retrieval
- canMessageToday unit rules
- Daily cap + opt-out enforcement
- Preview purity
- Dry-run send + ledger persistence
- **LeadGen** (10): business-owner scoring + query tag, parent→child_education, low-signal LOW, dedupe, invalid-email reject, qualified CSV write, dry-run purity, pipeline counts, minScore filter, opted-out reject
