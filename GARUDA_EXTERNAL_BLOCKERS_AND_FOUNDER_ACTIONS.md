# 🦅 GARUDA OS — EXTERNAL BLOCKERS & FOUNDER ACTIONS
**Document ID**: `GARUDA-BLOCKERS-01`  
**Execution Date**: 20 October 2026, 01:05 IST  
**Doctrine**: Actionable Clarity | Zero Noise | Minimum Founder Involvement  

---

## 1. Required Founder Actions (Short Checklist)

The following actions strictly require Founder Praveen's personal authorization, identity, or business credentials. All automated software tasks that can be performed without these have already been executed.

```text
========================================================================================
                          FOUNDER ACTION CHECKLIST
========================================================================================
#  Action Required               Area           Impact              Status
────────────────────────────────────────────────────────────────────────────────────────
1  Complete Razorpay Live KYC    FinTech / Rev  Activates real card PENDING FOUNDER
                                                and UPI collections (Docs upload)
2  Open Business Current Account Banking        Enables ICICI/Wio   PENDING FOUNDER
                                                enterprise BaaS     (Bank visit/call)
3  Review Reddit Replies         Acquisition    First paying client PENDING PROSPECT
   (When incoming alert triggers)               deal conversion     (Awaiting buyer reply)
========================================================================================
```

---

## 2. Detailed Dependency Breakdown

### Dependency 1: Razorpay Production Merchant KYC
* **Why Required**: Dynamic payment links (`razorpayPaymentLinkService.js`) are 100% built and tested. To accept live payments from real clients into your bank account, Razorpay requires standard business KYC verification.
* **Owner**: Founder Praveen Mahawar.
* **Action**: Log in to [dashboard.razorpay.com](https://dashboard.razorpay.com), upload business PAN/Aadhaar/GST details, and toggle account to Live Mode.

### Dependency 2: Business Current Account (ICICI / Wio Bank BaaS)
* **Why Required**: Corporate treasury adapters (`icici_corporate_india`, `wio_bank_uae`) require an active current account with CIB corporate API access.
* **Owner**: Founder Praveen Mahawar.
* **Action**: When ready for large cross-border payment orchestration clients, register a current account and request BaaS developer credentials.

### Dependency 3: Monitoring Dispatched Client Proposals
* **Why Required**: Tailored starter milestone proposals ($250 to $750) were sent to 3 verified tech buyers on Reddit (`u/Naive_Area6965`, `u/IlIlllIIllIII`, `u/Puzzleheaded_Tea4149`).
* **Owner**: Founder Praveen + Telegram Alert Daemon.
* **Action**: When any buyer replies on Reddit, GARUDA's Telegram bot will alert you immediately. Founder Praveen simply reviews the brief and takes the discovery call or sends the payment link.

---

## 3. What Does NOT Require Founder Intervention

* AI Gateway & Mobile Antigravity: **100% Autonomous (Operational)**.
* Cloud Server Health & Keep-Alive: **100% Autonomous (Operational)**.
* FinTech Core Software & Simulator: **100% Autonomous (Operational)**.
* Lead Deduplication & Proposal Formatting: **100% Autonomous (Operational)**.
* Build & Static Deployments: **100% Autonomous (Operational)**.
