# GARUDA MILESTONE 23 — IMPLEMENTATION ROADMAP & PRIORITY REGISTER
**Engineering Milestone 23 — Target Architecture & Priority Register**  
**Date:** August 27, 2026  

---

## 1. Priority Ranking Matrix

| Priority | Capability | Why It Matters | Dependencies | Minimum Fix |
| :---: | :--- | :--- | :--- | :--- |
| **P0** | **Payment Truth Engine & Webhook Config** | Prevents fraudulent payment claims (screenshots/text claims) and enables authoritative webhook verification. | Render env vars | Set `RAZORPAY_WEBHOOK_SECRET_TEST` in Render Dashboard; enforce HMAC verification. |
| **P0** | **≤ ₹25,000 Low-Risk Autonomous Authorization Policy** | Enables GARUDA to autonomously approve and execute low-risk work up to ₹25,000 without Founder bottleneck. | Risk policy model | Implement `LowRiskAutonomousAuthorizationGate` evaluating 11 safety conditions. |
| **P1** | **Multi-Feed Global Discovery Expansion** | Expands candidate volume 5x (100+ candidates/week) beyond single Remotive API feed. | Source adapters | Build GitHub Jobs RSS & Upwork RSS discovery adapters in `opportunityDiscoveryService.js`. |
| **P1** | **Live FX Exchange Rate Normalization** | Converts multi-currency pipelines ($10k USD, £8k GBP, €10k EUR) to unified base reporting currency. | FX API key | Integrate OpenExchangeRates or Fixer API in `incomeGoalService.js`. |
| **P2** | **Automated Strategy Adaptation Loop** | Auto-tunes candidate scoring weights based on `LearningStore` rejection/timeout feedback. | LearningStore | Connect `LearningStore` output to `scoreCandidate()` weight multipliers. |
| **P3** | **Multi-Tier Deal Strategy Portfolio Generator** | Generates alternative deal structure options (10x$1k vs 2x$5k) for target amounts. | GoalEngine | Extend `GoalEngine` in `scripts/mother/goalEngine.js`. |

---

## 2. Proposed Target Architecture for Trusted Revenue Operator

```text
                    GARUDA TRUSTED REVENUE OPERATOR ARCHITECTURE

 ┌───────────────────────────────────────────────────────────────────────────┐
 │                       OPERATING INTELLIGENCE LAYER                        │
 │  (Mother Brain + RAG Knowledge Adapter + Real-Time Telemetry Interface)   │
 └─────────────────────────────────────┬─────────────────────────────────────┘
                                       │
 ┌─────────────────────────────────────▼─────────────────────────────────────┐
 │                 LOW-RISK AUTONOMOUS AUTHORIZATION GATE                    │
 │    (Evaluates 11 Safety Conditions for Work ≤ ₹25,000 Equivalent)        │
 └─────────────────────────────────────┬─────────────────────────────────────┘
                                       │
 ┌─────────────────────────────────────▼─────────────────────────────────────┐
 │                       PAYMENT TRUTH ENGINE (P0)                           │
 │ (Disambiguates Claimed vs Screenshot vs HMAC Provider Verified vs Settled)│
 └─────────────────────────────────────┬─────────────────────────────────────┘
                                       │
 ┌─────────────────────────────────────▼─────────────────────────────────────┐
 │                  GOVERNED PHASE 1–8 EXECUTION ENGINE                      │
 │    (Parallel Worker Queue + TaskContinuationController + SHA-256 Hashes)  │
 └───────────────────────────────────────────────────────────────────────────┘
```
