# GARUDA MILESTONE 30 — CUSTOMER CONVERSION ARCHITECTURE MAP

**Architecture Phase:** Milestone 30 Commercial Conversion & Revenue Realization  
**Date:** 2026-08-28  
**Governance Baseline:** Reuses Mother Brain, Mission Control, Payment Truth, Proposal Portal, Global Lead Scoring, and Governed Outbound Dispatch.

---

## 1. End-to-End Commercial Loop

```
[1. DISCOVER] ──► Multi-Source Feeds (Remotive, RemoteOK, WWR, GitHub Bounties, RFPs)
       │
[2. QUALIFY] ──► Global Lead Scoring Engine (0-100 Score, Capability Match, Value in USD/INR)
       │
[3. PRIORITIZE] ──► Classification (HIGH_VALUE ≥ $1k USD / GOOD ≥ $500 USD / REJECTED)
       │
[4. OUTREACH] ──► Governed Outreach Engine (Personalized truthful brief, Founder approval gate)
       │
[5. CONVERSATION] ──► Inbound Response -> Solution Architect Scoping -> Requirement Matrix
       │
[6. SCOPE] ──► Fixed Price Milestone Schedule & Deliverables
       │
[7. PROPOSAL] ──► Canonical Proposal Portal (/proposal/:id) + Digital Signature
       │
[8. ACCEPTANCE] ──► Client signs terms -> Awaiting Kickoff Deposit (50%)
       │
[9. PAYMENT] ──► Authoritative Razorpay Webhook HMAC Verification (Payment Truth Law)
       │
[10. AUTHORIZATION] ──► ≤ ₹25,000 Low-Risk Autonomous Gate vs Founder Approval Gate
       │
[11. EXECUTION] ──► Phase 1–8 Governed Worker Queue (Architecture, Coding, QA Test Passes)
       │
[12. DELIVERY] ──► QA Test Suite Run & SHA-256 Release Manifest Artifact
       │
[13. CLIENT ACCEPT] ──► Client Sign-off -> 50% Final Settlement Payment
       │
[14. REVENUE REALIZED] ──► Authoritative Cash in Bank & Ledger Record (Strict Truth)
       │
[15. LEARNING] ──► Post-Mission Diagnostic & Conversion Rate Optimization
```

---

## 2. Dependency & Subsystem Map

```
                               ┌───────────────────────────────────────────────┐
                               │       ACQUISITION COMMAND CENTER              │
                               │     (Funnel, Blocker Intel, Revenue Truth)    │
                               └──────────────────────┬────────────────────────┘
                                                      │
                       ┌──────────────────────────────┴──────────────────────────────┐
                       ▼                                                             ▼
       ┌───────────────────────────────┐                             ┌───────────────────────────────┐
       │   GLOBAL LEAD ENGINE (M29)    │                             │    GOVERNED OUTREACH (M28)    │
       │ - Multi-Source Discovery      │                             │ - Tailored Outreach Brief     │
       │ - Scoring (0-100) & Tiers     │────────────────────────────►│ - Founder Telegram Approval   │
       │ - Transparent Rejection Tax.  │                             │ - Authenticated Relay Status  │
       └───────────────────────────────┘                             └───────────────┬───────────────┘
                                                                                     │ (Response)
                                                                                     ▼
       ┌───────────────────────────────┐                             ┌───────────────────────────────┐
       │   PAYMENT TRUTH ENGINE (M25)  │                             │  SOLUTION ARCHITECT SCOPING   │
       │ - Razorpay HMAC Verification  │◄────────────────────────────│ - Multi-Turn Requirement Form │
       │ - Strict Anti-Fabrication Gate│                             │ - Deliverable Breakdown       │
       │ - Rejects Text/Screenshot Fake│                             │ - Proposal Portal Creation    │
       └───────────────┬───────────────┘                             └───────────────────────────────┘
                       │ (Verified Deposit)
                       ▼
       ┌───────────────────────────────┐                             ┌───────────────────────────────┐
       │    GOVERNED EXECUTION CORE    │                             │      FAILURE INTELLIGENCE     │
       │ - ≤ ₹25,000 Autonomous Gate   │                             │ - 15 Diagnostic Blocker States│
       │ - Phase 1–8 Governed Workers  │────────────────────────────►│ - Root Cause Identification   │
       │ - SHA-256 QA Release Manifest │                             │ - Immediate Next Actions      │
       └───────────────────────────────┘                             └───────────────────────────────┘
```

---

## 3. Forensic Gap Analysis: Exact Missing Links Resolved in M30

| COMMERCIAL STEP | PREVIOUS STATUS (M29) | UPGRADED RESOLUTION IN M30 |
| :--- | :--- | :--- |
| **Outreach Draft Generation** | Generic template string | **Personalized, capability-grounded brief** detailing specific architecture & deliverables without hyperbole. |
| **Outreach Relay Status** | Unmonitored | **Surfaces explicit credential status:** `CONFIGURED` vs `BLOCKED_CREDENTIAL_MISSING` with remediation steps. |
| **Inbound Prospect Scoping** | Isolated in `/chat` | **Direct webhook bridge** from outreach responses to commercial Solution Architect scoping session. |
| **Blocker Intelligence** | High-level summary | **15 Granular Blocker States** (e.g. `OUTBOUND_CREDENTIAL_MISSING`, `PROPOSAL_NOT_ACCEPTED`, `PAYMENT_UNVERIFIED`, `WORK_AUTHORIZATION_BLOCKED`). |
| **≤ ₹25k Auto-Execution Gate** | Unit tested in isolation | **Fully wired into conversion pipeline:** Automatically transitions verified deposits into active `MissionRecord` and executes Phase 1–8 workers. |
| **End-to-End Telemetry** | High-level funnel | **Per-lead lifecycle tracking:** Each prospect shows exact acquisition state, blocker, and next recommended action. |

---

## 4. Authoritative Payment Truth & Governance Guardrails
1. **Zero Fabrication:** Neither test assertions, mock transactions, nor client text assertions are recorded as real revenue.
2. **Authoritative Evidence Gate:** Only cryptographically verified webhooks (`razorpay_payment_id` + `razorpay_signature`) transition state to `PAYMENT_VERIFIED`.
3. **Low-Risk Policy:** Projects ≤ ₹25,000 ($300 USD) with clean compliance checks launch governed workers autonomously; projects > ₹25,000 pause at `WAITING_APPROVAL` for Founder confirmation.
