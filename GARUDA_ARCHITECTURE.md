# GARUDA SYSTEM ARCHITECTURE — REVENUE OPERATING SYSTEM

## GARUDA PRODUCTION OUTPUT RULE (Permanent, Founder-Approved)

1. **garudaos.in is the SINGLE final user-facing production asset.** All public/founder product surfaces are served from `garudaos.in` (via the `garuda-ai-v1` Vercel project). No preview, staging, or side-app host is ever presented to users as the product.
2. **localhost is DEV ONLY.** `localhost:3000` (server) and `localhost:5173` (Vite) are local development surfaces, never production.
3. **Render backend is INFRASTRUCTURE ONLY.** `garuda-ai-xfif.onrender.com` is the production API host that `garudaos.in` proxies `/api/*` to. It is not a user-facing product surface.
4. **MongoDB need not run on garudaos.in.** The production database may live anywhere (local Mongo, Atlas, etc.); what matters is that the production backend reads the SAME genuine database that drives user-visible output, and that `MONGODB_URI` in production points at genuine data (currently `garuda_ai`), never test data.
5. **No test host becomes source of truth.** Preview URLs (Vercel/other repos) and test databases (`garuda`, `garuda_revenue` in the other repo) are never the production source of truth.
6. **A feature is NOT DONE until it is usable/visible through garudaos.in** — served by the production backend and backed by the production database.
7. **Founder approval is mandatory** before any production commit, push, or deploy (Constitutional Law 10).
8. **The Revenue Department is served IN-APP** at `garudaos.in/revenue` (founder-scoped) inside the GARUDA-AI frontend, reading the production API `/api/revenue*`. No dependency on the other repo's `garuda-emergent-revenue.vercel.app` SPA.
9. **SINGLE DEPLOYMENT PROJECT RULE (Permanent, Founder-Approved 2026-08-17):** `garuda-ai-v1` is the ONLY Vercel project for GARUDA. Every deployment, build, push, and production update lands ONLY on `garuda-ai-v1` and is reflected on `garudaos.in`. Any other Vercel project that appears in the account (e.g. old or preview projects) is IGNORED for production — it is not deleted, not deployed, not treated as production, and must never be given the `garudaos.in` domain. No push from this repo may trigger a deployment to any project other than `garuda-ai-v1`.

### Production Host Topology (verified)

| Host | Purpose | Classification |
|---|---|---|
| `garudaos.in` / `www.garudaos.in` | Final user-facing frontend (Vite SPA) | PRODUCTION PRODUCT |
| `garuda-ai-v1.vercel.app` | Same deployment default domain | PRODUCTION PRODUCT |
| `garuda-ai-xfif.onrender.com` | Production API backend (`/api/*`) | PRODUCTION INFRASTRUCTURE |
| localhost:3000 / localhost:5173 | Local dev server / Vite | DEV ONLY |
| `garuda-emergent-revenue.vercel.app` | Other-repo Revenue SPA (no public backend) | OBSOLETE FOR PRODUCTION OUTPUT |
| `gcifzzuyswrcwvkcfqbr.supabase.co` | Customer auth (Supabase) | PRODUCTION INFRASTRUCTURE |
| `api.razorpay.com`, `razorpay.me/@garudaosincompany` | Payments | PRODUCTION INFRASTRUCTURE |
| `api.telegram.org` | Telegram bot | PRODUCTION INFRASTRUCTURE |
| NVIDIA / OpenAI / Gemini endpoints | LLM engines | PRODUCTION INFRASTRUCTURE |

## System Architecture Diagram

```
+-----------------------------------------------------------------------------------+
|                                  FOUNDER INTERFACE                                |
|                 (Command Line `npm run garuda:dispatch` / Web Dashboard)          |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                            OPPORTUNITY DISCOVERY ENGINE                           |
|      (Remotive API / Public RSS Feeds / Founder-Assisted Candidate Intake)         |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                        FOUNDER SUBMISSION PACKAGE SERVICE                         |
|     - Effort Estimation (AI Hours vs Human Days)                                 |
|     - Risk-Adjusted Pricing Recommendation (Base Cost, Risk Buffer %, Floor)     |
|     - Deliverable Specifications & Acceptance Criteria                           |
|     - Immutable Package SHA-256 Hash Assembly                                    |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                        REVENUE INTELLIGENCE ENGINE (RIE)                          |
|     - Executive Decision Report (ACCEPT / REJECT / NEGOTIATE)                     |
|     - Time Economics & AI Time Compression Ratio (5.3x Speed Advantage)           |
|     - Negotiation Strategy Engine (Leverage Points, Concessions, Non-Negotiables) |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                       GARUDA CHIEF REVENUE OFFICER (CRO)                          |
|     - 15-Point Deal Battle Plan Generator                                         |
|     - Emotional & Commercial Trigger Analysis                                     |
|     - Exact Dialogue Scripting & Objections Handling                              |
|     - Automatic Outcome Learning Loop (`learnFromDealOutcome`)                    |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                         REALITY FEEDBACK & DEAL TRACKER                           |
|     - Submission Tracker (`recordDealSubmission`)                                 |
|     - Response Tracker (`recordClientResponse`)                                   |
|     - Measured Reality KPIs (Win Rate, Reply Rate, Revenue Collected)             |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                         PAYMENT PROTECTION WORKFLOW                               |
|   [1. Unpaid] ---> [2. Deposit Paid] ---> [3. Proof Verified] ---> [4. Fully Paid] |
|        |                  |                      |                     |          |
|   (Assets Locked)   (Demo Sandbox)        (100% Test Logs)    (Code Unlocked)     |
+-----------------------------------------------------------------------------------+
```

## Architectural Core Modules

### 1. Governed Opportunity Intake (`src/services/founderAssistedIntakeService.js`)
Validates Founder attestations, filters prohibited content (gambling, scam), rejects physical onsite or professional bar licence requirements (`human_only`), and classifies client opportunities as `founder_garuda` (first-class revenue opportunity).

### 2. Submission Package Engine (`src/services/founderSubmissionPackageService.js`)
Computes effort hours, risk-adjusted pricing recommendations, floor prices, deliverable acceptance criteria, and generates hash-stamped submission packages.

### 3. Revenue Intelligence Engine (`src/services/revenueIntelligenceEngineService.js`)
Consumes intake packages, capability maps, and risk findings to produce Executive Decision Reports with `ACCEPT` / `REJECT` / `NEGOTIATE` recommendations, Time Economics, and AI Time Compression Ratios.

### 4. Chief Revenue Officer Engine (`src/services/garudaCroService.js`)
Evaluates 15 deal-winning factors per opportunity, formulates exact Founder dialogue scripts, counter-offers, walk-away prices, and updates historical memory based on real outcomes.

### 5. Reality Feedback Engine (`src/services/dealTrackerService.js`)
Tracks deal submissions, client response statuses (`NO_REPLY`, `SHORTLISTED`, `INTERVIEW`, `NEGOTIATION`, `DEPOSIT_REQUEST`, `WON`, `LOST`), and computes empirical conversion metrics without hardcoded assumptions.

### 6. Payment Protection State Machine (`src/services/revenueClosingSystemService.js`)
Enforces a 5-state payment protection state machine: sensitive assets (`source_code`, `api_keys`, `production_credentials`) remain **STRICTLY LOCKED** behind HTTP 403 Forbidden until `paymentState === "fully_paid"` and `unlockState === "fully_unlocked"`.
