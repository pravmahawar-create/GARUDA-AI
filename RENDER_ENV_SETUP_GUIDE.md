# GARUDA RENDER PRODUCTION ENVIRONMENT VARIABLE SETUP GUIDE

To align live production deployment on Render (`https://garuda-ai-xfif.onrender.com`) with GARUDA's 24×7 autonomous operating loop and live Razorpay payment webhooks, set the following Environment Variables in the **Render Dashboard → Environment** settings.

---

## 1. Webhook & Payment Environment Variables

| Variable Name | Required Value / Description | Example |
|---------------|------------------------------|---------|
| `RAZORPAY_WEBHOOK_SECRET_TEST` | Secret string configured in Razorpay Dashboard for Test Webhooks (minimum 12 chars). | `garuda_test_webhook_secret_99` |
| `RAZORPAY_KEY_ID_TEST` | Test Key ID generated from Razorpay Dashboard. | `rzp_test_XXXXXXXXXXXXXX` |
| `RAZORPAY_KEY_SECRET_TEST` | Test Key Secret generated from Razorpay Dashboard. | `XXXXXXXXXXXXXXXXXXXXXXXX` |
| `RAZORPAY_LIVE_ENABLED` | Set `false` for test mode, or `true` when enabling live real-money accounts. | `false` |

---

## 2. 24×7 Background Schedulers

| Variable Name | Required Value / Description | Default |
|---------------|------------------------------|---------|
| `DISCOVERY_INTERVAL_MS` | Continuous job discovery cycle interval in milliseconds. | `900000` (15 minutes) |
| `REVENUE_ACQUISITION_INTERVAL_MS` | Continuous acquisition cycle interval in milliseconds. | `1200000` (20 minutes) |

---

## 3. Webhook Endpoint URL

In your **Razorpay Dashboard → Settings → Webhooks → Add New Webhook**:
- **Webhook URL:** `https://garuda-ai-xfif.onrender.com/api/webhook/payment/razorpay`
- **Secret:** Enter the exact string set in `RAZORPAY_WEBHOOK_SECRET_TEST`.
- **Active Events:**
  - `payment.captured`
  - `payment_link.paid`
  - `settlement.processed`
  - `refund.created`

---

## 4. Verification

After updating variables in Render:
1. GARUDA automatically boots `initRevenueOperatingCycle()` on app startup.
2. Webhooks POSTed to `/api/webhook/payment/razorpay` verify HMAC SHA-256 signatures and update `RevenueRecord` state automatically.
