# GARUDA MILESTONE 23 — PAYMENT TRUTH AUDIT
**Engineering Milestone 23 — Payment Verification & Evidence Integrity Audit**  
**Date:** August 27, 2026  

---

## 1. Payment Evidence Disambiguation Matrix

Below is the authoritative classification matrix of payment evidence states across GARUDA's codebase:

| Payment Evidence State | Code Location | Verification Method | Authoritative for REAL REVENUE? | Notes / Security Rule |
| :--- | :--- | :--- | :---: | :--- |
| **1. CLAIMED PAYMENT** | `src/services/inboundResponseService.js` | Client text message claim ("I paid") | **NO** | Strictly tagged as `CLAIMED_PAYMENT`. Does NOT transition state to `PAYMENT_VERIFIED`. |
| **2. SCREENSHOT EVIDENCE** | N/A (No OCR Parser) | Image uploaded by user/client | **NO (P0 Security Rule)** | **CRITICAL:** Screenshots can be falsified. GARUDA strictly treats screenshots as UNVERIFIED. |
| **3. PROVIDER-VERIFIED PAYMENT**| `src/services/paymentWebhookService.js` | HMAC SHA-256 webhook signature + Razorpay API check | **YES (for test/live state)** | Requires valid HMAC SHA-256 signature matching `secret`. |
| **4. SETTLED PAYMENT** | `src/models/SettlementLedger.js` | Bank settlement payout confirmation | **YES (Final Revenue)** | Payout net amount recorded in `SettlementLedger` (`status: "settled"`). |
| **5. DUPLICATE PAYMENT** | `src/services/paymentWebhookService.js` | `paymentId` lookup in `processedPayments` ledger | **NO (Blocked)** | Throws `DUPLICATE_PAYMENT_BLOCKED` to prevent double-counting. |
| **6. MISMATCHED PAYMENT** | `src/services/paymentWebhookService.js` | Reference ID / Amount mismatch check | **NO (Flagged)** | Flagged as `MISMATCHED_PAYMENT` for manual review. |
| **7. UNVERIFIABLE CLAIM** | `src/services/paymentWebhookService.js` | Missing signature or missing reference ID | **NO (Rejected)** | Returns HTTP 401 Unauthorized or HTTP 400 Bad Request. |

---

## 2. P0 Security Inspection: Screenshots vs Provider Verification

- **P0 Check Question:** *Does any current code incorrectly treat screenshots or user text claims as payment confirmation?*
- **Audit Findings:** **NO.**
- **Code Evidence:**
  - In `src/services/paymentWebhookService.js` lines 60–68:
    ```javascript
    async function verifyRazorpaySignature(rawBody, signature, secret) {
      if (!secret || String(secret).length < 12) fail("Razorpay webhook secret is not configured", 503);
      const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
      const valid = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
      if (!valid) fail("Invalid Razorpay webhook signature", 401);
      return true;
    }
    ```
  - In `src/tools/revenueExecutionAdapter.js`: `recordPaymentVerified()` requires explicit HMAC signature verification or authenticated Razorpay payment payload. User text claims in `inboundResponseService.js` map to `PAYMENT_PENDING` and trigger a payment verification request.

---

## 3. Provider Verification Matrix (Razorpay)

| Capability | Current Status | Code Location | Production Environment Status |
| :--- | :---: | :--- | :--- |
| **HMAC SHA-256 Signature Verification** | **LOCALLY FUNCTIONAL** | `src/services/paymentWebhookService.js` | Verified via 100% green tests (`productionDeployment.test.js`); secret pending in Render. |
| **Duplicate Payment Protection** | **LOCALLY FUNCTIONAL** | `src/services/paymentWebhookService.js` | Prevents double-counting duplicate `paymentId` values. |
| **Multi-Currency Webhook Normalization** | **LOCALLY FUNCTIONAL** | `src/services/paymentWebhookService.js` | Normalizes `USD`, `GBP`, `EUR`, `AED`, `INR` from Razorpay payload. |
| **Settlement Payout Tracking** | **LOCALLY FUNCTIONAL** | `src/models/SettlementLedger.js` | Tracks gross amount, provider fees, and net settlement amount. |
| **Production Webhook Secret Setup** | **MISSING (Render Env)**| `RENDER_ENV_SETUP_GUIDE.md` | Requires configuring `RAZORPAY_WEBHOOK_SECRET_TEST` in Render Dashboard. |

---

## 4. Payment Evidence Ingestion & Closure State Machine

```text
WORK_COMPLETED (Phase 1–8 Governed Tools)
   ↓
DELIVERY_SUBMITTED (Deliverable artifact compiled with SHA-256 hash)
   ↓
CLIENT_ACCEPTED (Explicit client confirmation recorded in ledger)
   ↓
PAYMENT_PENDING (Client receives Razorpay payment link)
   ↓
PAYMENT_VERIFIED (Razorpay HMAC SHA-256 signature verified by PaymentWebhookService)
   ↓
REVENUE_REALIZED (Recorded in RevenueRecord schema with transaction ID)
   ↓
CLOSED (Mission complete)
```
