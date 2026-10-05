# 🦅 GARUDA OS — FINTECH OPERATIONS RUNBOOK
**Document Reference**: `FINTECH_OPERATIONS_RUNBOOK.md`  
**System**: GARUDA OS Sovereign Payment Orchestration & Treasury Infrastructure  
**Specification**: `GARUDA-FINTECH-SPEC-V2.0`  
**Founder**: Praveen Mahawar  
**Classification**: SOVEREIGN OPERATIONAL STANDARD  
**Effective Date**: 2026-10-01  

---

## 1. DAILY OPERATIONAL CHECKLIST (08:00 UTC)

Every operating morning, the Treasury Systems Operator must execute the following forensic routine:

1. **Provider Health Check**:
   - Query `GET /api/fintech/providers/health`.
   - Verify all active providers report `HEALTHY`.
   - If any provider returns `CREDENTIALS_REQUIRED`, verify whether sandbox or live keys have expired.
2. **Reconciliation Exceptions & Manual Review Queue**:
   - Query `GET /api/fintech/treasury/metrics`.
   - Check `manualReviewCount` and `reconciliationMismatches`.
   - If count > 0, inspect each quarantined payment in `src/fintech/reconciliationEngine.js`.
3. **Audit Chain Cryptographic Integrity Check**:
   - Execute internal audit chain verification: `defaultAuditLogger.verifyChainIntegrity()`.
   - Ensure zero tampering exceptions (`AuditTamperingError`).
4. **Zero-Custody Balance Proof**:
   - Confirm GARUDA custodial balance = $0.00.
   - Verify that all settled funds flowed direct to external merchant corporate IBANs.
5. **High-Value Transaction Review**:
   - Review all transactions flagged by the High-Value Gate (`metrics.highValueTransactions`).
   - Confirm dual-signoff on whale trades (> $1,000,000 USD).

---

## 2. MULTI-TIER ALERT TRIAGE MATRIX

| Severity | Trigger Event | Automated Action | SLA | Escalation Target |
|---|---|---|---|---|
| **CRITICAL** | Suspected Custody Invariant Bypass | Immediate circuit breaker; freeze affected rail | < 5 Minutes | Founder Praveen Mahawar (+91 9098750362) & Security Lead |
| **CRITICAL** | Cryptographic Audit Hash Mismatch | Lock state transition engine; freeze write operations | < 5 Minutes | Founder Praveen Mahawar & Lead Architect |
| **CRITICAL** | Webhook Nonce Replay Flood | Block sender IP; drop replayed payloads (HTTP 409) | < 15 Minutes | Infrastructure & Network Security |
| **HIGH** | Provider Outage / Unresponsive API | Auto-route to secondary clearing rail; notify operator | < 30 Minutes | Treasury Operations Desk |
| **HIGH** | Settlement Reconciliation Mismatch | Automatic quarantine to `MANUAL_REVIEW`; zero auto-settle | < 1 Hour | Treasury Reconciliation Officer |
| **HIGH** | Central Bank Return / Reversal | Mark intent `RETURNED` / `REVERSED`; alert merchant | < 1 Hour | Client Relationship Manager |
| **MEDIUM** | API Latency Spikes (> 2000ms) | Log telemetry; trigger background ping diagnostics | < 4 Hours | DevOps / Infrastructure Desk |
| **MEDIUM** | Approaching High-Value Gate ($250k+) | Enhanced logging; notify executive operations | < 4 Hours | Executive Operations Desk |
| **LOW** | Minor Provider Schema Deprecation | Schedule adapter update in next sprint | 48 Hours | Engineering Sprint Backlog |

---

## 3. MANUAL REVIEW QUEUE RESOLUTION PROCEDURE

When an incoming bank settlement event is quarantined into `STATES.MANUAL_REVIEW`:

1. **Step 1: Identify Quarantine Reason**:
   - Inspect `intent.reconciliationNotes`.
   - Possible causes: `PARTIAL_PAYMENT`, `OVERPAYMENT`, `CURRENCY_MISMATCH`, `LATE_ARRIVAL`, `UNKNOWN_PAYMENT`.
2. **Step 2: Compare Bank Telemetry against Invoice**:
   - Pull original bank MT940 / ISO 20022 statement from corporate banking portal.
   - Confirm gross amount credited to merchant's bank account.
3. **Step 3: Execution Paths**:
   - **Underpayment / Partial**: Contact commercial buyer; request top-up wire for the remaining deficit. The intent remains in `MANUAL_REVIEW` until the supplemental credit arrives.
   - **Overpayment**: Contact merchant finance team to initiate interbank refund of excess amount.
   - **Currency Mismatch**: Verify if foreign exchange conversion occurred at clearing bank.
   - **Late Arrival**: If funds arrived after VAN expiry, verify merchant accepts late settlement, then manually authorize transition to `SETTLED`.
4. **Step 4: Immutability Log**:
   - Every manual override requires dual operator sign-off and is immutably logged into `src/fintech/auditLogger.js` with operator actor ID and justification.

---

## 4. INCIDENT ESCALATION DISPATCH

In accordance with GARUDA Agent Governance Rule 2 & 3:
* Founder Praveen Mahawar's personal phone number (`+91 9098750362`) is strictly an **INTERNAL SYSTEM ESCALATION CHANNEL** for AI agents and automated monitors.
* When a CRITICAL incident or client pilot agreement occurs:
  1. Compile full telemetry snapshot (Transaction ID, Provider ID, Amount, Error Details, Hash Chain Status).
  2. Dispatch high-priority alert directly to Founder Praveen's private WhatsApp / Telegram.
  3. Never flash, publish, or leak this number in public marketing, external emails, or client-facing portals.
