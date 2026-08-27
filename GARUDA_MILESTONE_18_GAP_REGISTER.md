# GARUDA MILESTONE 18 — SYSTEM GAP REGISTER
**Engineering Milestone 18 — Forensic Gap & Bottleneck Audit**  
**Date:** August 27, 2026  

---

## 1. Top 5 Technical & Product Gaps

1. **Render Production Environment Variable Secret Alignment:**
   - *Impact:* High.
   - *Description:* `RAZORPAY_WEBHOOK_SECRET_TEST` and production SMTP API keys are not yet configured in the Render Dashboard environment variables, blocking automatic live payment link webhook processing on `garudaos.in`.

2. **Zero Outbound Email SMTP Production Key:**
   - *Impact:* High.
   - *Description:* Outbound proposal emails currently run via governed mock provider in offline/test mode. Sending real emails to external clients requires configuring an active SendGrid/Postmark/SMTP credential.

3. **Missing Automated Lead Crawlers for Insurance & Tutoring:**
   - *Impact:* Medium.
   - *Description:* While software engineering jobs are fetched live from Remotive API and ABSLI policy Q&A exists for Telegram users, no active scrapers exist for insurance or tutor lead acquisition.

4. **Capacitor Mobile App Scaffold Uncompiled:**
   - *Impact:* Low.
   - *Description:* The `billing/android` directory contains basic Capacitor configuration files, but no compiled Android APK or iOS app binary exists.

5. **Inbound Email Webhook Service Unexposed Publicly:**
   - *Impact:* Medium.
   - *Description:* While Telegram inbound messages route via `/api/telegram`, inbound email response parsing requires setting up an Inbound Mailgun/SendGrid webhook endpoint.

---

## 2. The Single Biggest Bottleneck
> **Production Render Environment Variable Setup & Webhook Secret Configuration.**  
> Aligning live Render environment variables (`RAZORPAY_WEBHOOK_SECRET_TEST`) to allow automated live payment link webhook signature verification on `garudaos.in`.
