# GARUDA SYSTEM ARCHITECTURE — REVENUE OPERATING SYSTEM

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
