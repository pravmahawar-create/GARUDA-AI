# GARUDA — MILESTONE 27: REAL-WORLD ACQUISITION ARCHITECTURE MAP

---

## 1. Executive System Topology

```
                         [PROSPECT & DISCOVERY CHANNELS]
          ┌─────────────────────────────┼─────────────────────────────┐
   [Global Lead Discovery]   [SEO & Search Intent]      [Inbound Visitor Chat]
   • Remotive Adapter         • Custom Software / SaaS   • Senior Solution Architect
   • Freelance RSS Adapter    • AI Automation / RAG      • Progressive Scoping
   • Developer Bounties       • Bot / CRM Integrations   • Direct Proposal Portal Links
   • Custom Software RFPs     • Schema.org / Sitemap     • Payment Truth Gate
          │                             │                             │
          └─────────────────────────────┼─────────────────────────────┘
                                        ↓
                        [GARUDA ACQUISITION ENGINE]
                 (src/services/garudaAcquisitionEngineService.js)
                                        │
             ┌──────────────────────────┴──────────────────────────┐
             ↓                                                     ↓
  [Self-Marketing & SEO Engine]                         [Commercial Lead State Machine]
  • Programmatic Topic Planning                         • DISCOVERED → QUALIFIED
  • Technical Whitepapers & Use Cases                   • SCOPED → PROPOSAL_READY
  • Performance Telemetry                               • ACCEPTED → DEPOSIT_PAID
  • Truth Guardrail: Zero Fake Testimonials             • MISSION_SPAWNED → REVENUE_REALIZED
             │                                                     │
             └──────────────────────────┬──────────────────────────┘
                                        ↓
                       [PROPOSAL & PAYMENT TRUTH CORE]
                       • clientProposalService.js (MongoDB)
                       • ≤ ₹25,000 LOW_RISK_TIER_1 Policy
                       • paymentWebhookService.js (HMAC Truth)
                                        ↓
                      [GOVERNED MISSION EXECUTION CORE]
                      • missionControlService.js
                      • Phase 1–8 Governed Worker Queue
                      • Cryptographic SHA-256 Release Manifest
                                        ↓
                       [FOUNDER ACQUISITION COMMAND]
                       • /api/acquisition/command-center
                       • Real-time Funnel & Revenue Metrics
                       • Founder Telegram Broadcasts (Tagged)
```

---

## 2. Reused vs Extended Components

| Subsystem | Existing File / Asset | Milestone 27 Enhancement |
| :--- | :--- | :--- |
| **Global Discovery** | `src/services/opportunityDiscoveryService.js` | Tuned weights for custom AI, SaaS, Automation RFPs |
| **Public Chat** | `src/services/publicChatCommercialAgentService.js` | Added inbound campaign source attribution & routing |
| **Proposal Engine** | `src/services/clientProposalService.js` | Linked to acquisition state machine & campaign metrics |
| **Payment Truth** | `src/services/paymentWebhookService.js` | Authoritative provider HMAC gates preserved |
| **Self-Marketing** | `NEW: src/services/garudaSelfMarketingService.js` | Generates verified technical use cases & SEO drafts |
| **Acquisition Engine**| `NEW: src/services/garudaAcquisitionEngineService.js`| Orchestrates end-to-end acquisition state lifecycle |
| **Command Center** | `NEW: src/routes/acquisitionRoutes.js` | Exposes `/api/acquisition/command-center` for Founder |
| **Telegram Bot** | `src/services/telegramBotService.js` | Dispatches real-time commercial acquisition updates |
| **Insurance Advisor**| `src/services/insuranceAdvisorService.js` | Preserved untouched on parallel channel |
| **Tutoring Scout** | `src/services/tutoringLeadScoutService.js` | Preserved untouched on parallel channel |

---

## 3. Strict Truth & Anti-Fabrication Invariants
1. **Zero Fake Testimonials / Customers:** Marketing content highlights only real, reproducible technical capabilities and verified architectures.
2. **Authoritative Revenue Definition:** REAL CUSTOMER REVENUE = Cash in Bank verified via Razorpay/Stripe HMAC webhook signatures.
3. **Simulation Disambiguation:** All test and verification events tagged `🧪 [TEST / SIMULATION]` across all database documents and Telegram alerts.
