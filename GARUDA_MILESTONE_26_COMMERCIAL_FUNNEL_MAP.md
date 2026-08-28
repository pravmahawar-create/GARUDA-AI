# GARUDA — COMMERCIAL FUNNEL MAP (MILESTONE 26)

---

## Complete End-to-End Customer Journey

```
                        [VISITOR TOUCHPOINTS]
                ┌──────────────────┴──────────────────┐
        (Public Website)                      (Public Chat /chat)
                │                                     │
    [Inbound Scope Form]               [Solution Architect Scoping Agent]
                │                                     │
                └──────────────────┬──────────────────┘
                                   ↓
                  [Progressive Requirement Extraction]
                   • Platform (Web, Mobile, AI, CRM)
                   • Key Features & Integrations
                   • Budget & Benchmark Currency (INR, USD, AED, EUR)
                                   ↓
                  [Structured Commercial Qualification]
                   • CLEARLY_DELIVERABLE
                   • NEEDS_CLARIFICATION (2-3 targeted questions)
                   • NEEDS_HUMAN_REVIEW
                   • HIGH_RISK / PROHIBITED (Blocked)
                                   ↓
                   [Canonical Proposal Generation]
                   • Milestone 1: 50% Advance Kickoff Deposit
                   • Milestone 2: 50% Final QA Delivery & Sign-off
                   • Policy Gate: ≤ ₹25,000 Autonomously Approved
                   • Unique ID: prop_... | SHA-256 Scope Hash
                                   ↓
                  [Public Client Proposal Portal]
                  URL: https://garudaos.in/proposal/:proposalId
                                   ↓
                   [Client Accepts Terms & Signs]
                   • Status: CLIENT_ACCEPTED
                   • Telegram: "🎉 CLIENT ACCEPTED PROPOSAL"
                                   ↓
                  [Milestone 1 Kickoff Deposit Payment]
                   ┌───────────────┴───────────────┐
            (Fake text / screenshot)      (Razorpay Live Webhook)
                   ↓                               ↓
       [PAYMENT_CLAIMED (Rejected)]     [DEPOSIT_PAID & PAYMENT_VERIFIED]
                                                   ↓
                                         [Autonomous Mission Launch]
                                                   ↓
                                         [Phase 1-8 Governed Build]
                                                   ↓
                                         [Automated QA Suite & SHA-256 Manifest]
                                                   ↓
                                         [DELIVERY_READY]
                                                   ↓
                                         [Client Final Acceptance]
                                                   ↓
                                         [Milestone 2 Final Payment]
                                                   ↓
                                         [REVENUE_REALIZED & CLOSED]
```

---

## Funnel Telemetry Endpoint
* **API Route:** `GET /api/proposals/metrics/funnel`
* **Metrics Tracked:**
  * Total Proposals Created
  * Funnel Counts by Status
  * Pipeline Value INR
  * Deposits Paid INR
  * Realized Revenue INR
  * Realized Revenue by Currency
  * Conversion Rates:
    * `proposalToAcceptanceRate`
    * `acceptanceToDepositRate`
    * `depositToDeliveryRate`
