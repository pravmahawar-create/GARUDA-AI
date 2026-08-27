# GARUDA MILESTONE 24A — RAZORPAY WEBHOOK SECRET RECONCILIATION REPORT
**Engineering Milestone 24A — Configuration Reconciliation & Mode Semantics Audit**  
**Date:** August 27, 2026  
**Status:** Completed — Read-Only Audit  

---

## 1. Code-to-Environment Runtime Trace

The exact runtime path for Razorpay webhook signature verification in GARUDA is:

```text
Express Server Startup (src/app.js)
       ↓
POST /api/webhook/payment/razorpay (Express route in src/routes/webhookRoutes.js)
       ↓
WebhookController.receiveRazorpay (src/controllers/webhookController.js)
       ↓
PaymentWebhookService.processRazorpayWebhook (src/services/paymentWebhookService.js)
       ↓
Mode Determination: getProviderMode() → process.env.RAZORPAY_LIVE_ENABLED === "true" ? "live" : "test"
       ↓
Secret Lookup:
  - If mode === "live": process.env.RAZORPAY_WEBHOOK_SECRET_LIVE
  - If mode === "test": process.env.RAZORPAY_WEBHOOK_SECRET_TEST
       ↓
Signature Verification: verifyRazorpaySignature(rawBody, signature, secret)
  - Uses crypto.createHmac("sha256", secret).update(rawBody).digest("hex")
  - Validates using crypto.timingSafeEqual()
```

---

## 2. Configuration Reconciliation Matrix

| Environment Variable | Code Expected | Render Environment | Compatibility | Mode Trigger |
| :--- | :---: | :---: | :---: | :--- |
| **`RAZORPAY_WEBHOOK_SECRET_LIVE`** | **YES** (when `live`) | **CONFIGURED** | **MATCH** | `RAZORPAY_LIVE_ENABLED=true` |
| **`RAZORPAY_WEBHOOK_SECRET_TEST`** | **YES** (when `test`) | **MISSING** | **MISMATCH (if test mode)** | Default when `RAZORPAY_LIVE_ENABLED` is false/unset |
| **`RAZORPAY_LIVE_ENABLED`** | **YES** | Configured/Targeted | Controls mode | Sets `getProviderMode()` to `"live"` |

---

## 3. LIVE vs TEST Semantics & Mode Behavior

- **LIVE Mode (`RAZORPAY_LIVE_ENABLED = true`):**
  - `getProviderMode()` returns `"live"`.
  - Secret lookup retrieves `process.env.RAZORPAY_WEBHOOK_SECRET_LIVE`.
  - **Result:** **MATCH.** Render's existing `RAZORPAY_WEBHOOK_SECRET_LIVE` environment variable is selected automatically.

- **TEST Mode (`RAZORPAY_LIVE_ENABLED` unset/false):**
  - `getProviderMode()` returns `"test"`.
  - Secret lookup retrieves `process.env.RAZORPAY_WEBHOOK_SECRET_TEST`.
  - **Result:** If `RAZORPAY_LIVE_ENABLED` is not `"true"`, the code looks for `RAZORPAY_WEBHOOK_SECRET_TEST` and fails to find it.

---

## 4. Safest Recommended Solution (Option C + Fallback)

To achieve 100% seamless production compatibility **without** altering Render environment variables or creating duplicate secrets:

Add a safe fallback secret lookup in `src/services/paymentWebhookService.js`:
```javascript
const secret = mode === "live"
  ? (process.env.RAZORPAY_WEBHOOK_SECRET_LIVE || process.env.RAZORPAY_WEBHOOK_SECRET)
  : (process.env.RAZORPAY_WEBHOOK_SECRET_TEST || process.env.RAZORPAY_WEBHOOK_SECRET_LIVE || process.env.RAZORPAY_WEBHOOK_SECRET);
```

### Why this is the safest solution:
1. **Zero Render Variable Duplication:** Immediately works with Render's existing `RAZORPAY_WEBHOOK_SECRET_LIVE`.
2. **Backwards Compatible:** Preserves test suite behavior where `RAZORPAY_WEBHOOK_SECRET_TEST` is set in unit tests.
3. **Environment Flexible:** Supports both live and test deployment configurations seamlessly.

---

## 5. Security Inspection Audit

- **Secret Logging Check:** **PASSED.** `secret` variable is never passed to `console.log`, error messages, or telemetry logs.
- **Frontend Leak Check:** **PASSED.** `secret` is used strictly on backend in `verifyRazorpaySignature()` and is never exported to frontend APIs or client bundles.
- **Timing Attack Prevention:** **PASSED.** Uses `crypto.timingSafeEqual()` to prevent timing-attack side-channel vulnerabilities during HMAC comparison.

---

## 6. Production Readiness Summary

| Component | Production Readiness Status | Details |
| :--- | :---: | :--- |
| **Razorpay Webhook Endpoint** | **LIVE & REACHABLE** | Mounted at `POST /api/webhook/payment/razorpay`; actively returns HTTP 401 on unauthenticated calls. |
| **HMAC Signature Engine** | **READY** | Uses `crypto.createHmac("sha256", secret)` with timing-safe comparison. |
| **Render Secret Availability** | **CONFIGURED** | `RAZORPAY_WEBHOOK_SECRET_LIVE` is present in Render environment. |
| **Code Lookup Compatibility** | **READY AFTER FALLBACK FIX** | Code currently selects `RAZORPAY_WEBHOOK_SECRET_LIVE` when `RAZORPAY_LIVE_ENABLED=true`, or via the fallback fix. |

---

## 7. Single Safest Next Action

Update `src/services/paymentWebhookService.js` to include the fallback secret lookup (`process.env.RAZORPAY_WEBHOOK_SECRET_LIVE || process.env.RAZORPAY_WEBHOOK_SECRET_TEST`), run the test suite, and commit/push to `origin main` for automatic Render deployment.
