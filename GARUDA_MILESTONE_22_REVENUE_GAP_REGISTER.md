# GARUDA MILESTONE 22 — REVENUE GAP REGISTER
**Engineering Milestone 22A — Code-to-Production Forensic Audit**  
**Date:** August 27, 2026  

---

## 1. Ranked Critical Revenue Gaps

| Priority | Gap Title | Why It Matters | Current Code State | Minimum Fix | Expected Impact |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **P0** | **Render Webhook Secret Config** | Blocks automatic live payment link settlement ingestion on `garudaos.in`. | HMAC verification code complete (`paymentWebhookService.js`); env var missing in Render Dashboard. | Add `RAZORPAY_WEBHOOK_SECRET_TEST` to Render env vars. | Unblocks live multi-currency webhook payment verification. |
| **P1** | **Single Discovery Feed Bottleneck** | Limits daily qualified lead volume to Remotive API feed only. | `opportunityDiscoveryService.js` fetches Remotive API; no additional feed adapters active. | Add GitHub Jobs RSS & Upwork RSS adapters. | 5x increase in qualified global lead volume. |
| **P1** | **Live FX Normalization Engine** | Prevents automatic conversion of multi-currency pipelines ($10k USD, £8k GBP, €10k EUR) to unified base reporting. | Target models store currency strings; no live exchange rate API connector. | Integrate OpenExchangeRates or Fixer API in `incomeGoalService.js`. | Real-time multi-currency target and pipeline valuation. |
| **P2** | **Automated Strategy Adaptation Loop** | Rejection feedback does not auto-tune discovery scoring weights without Founder trigger. | `opportunityFollowUpService.js` logs to `LearningStore`; scoring weights static. | Connect `LearningStore` output to `scoreCandidate()` weight multipliers. | Auto-demotes non-converting job categories over time. |
| **P3** | **Multi-Tier Deal Strategy Portfolio Generator** | Target decomposition is linear milestones ($2,500 x 4) rather than portfolio strategy (e.g. 10x$1k vs 2x$5k). | `IncomeGoalService.buildMilestones()` generates equal sequence chunks. | Extend `GoalEngine` to generate alternative deal structure strategies. | Optimizes deal allocation based on candidate market supply. |

---

## 2. P0/P1 Implementation Roadmap

```text
Milestone 22B: Render Production Webhook Configuration & Verification
  ├── Configure RAZORPAY_WEBHOOK_SECRET_TEST on Render Web Service
  └── Verify HMAC webhook signature against live Razorpay endpoint

Milestone 23: Multi-Feed Global Discovery Expansion & Live FX Normalizer
  ├── Build GitHub Jobs RSS & Upwork RSS discovery adapters
  ├── Integrate Live FX Normalization API (USD/GBP/EUR/AED to base currency)
  └── Connect LearningStore feedback to auto-tune discovery scoring weights
```
