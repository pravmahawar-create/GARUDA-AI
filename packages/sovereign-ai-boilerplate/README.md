# 🦅 GARUDA Sovereign AI & WhatsApp Bot Starter Kit (Next.js 14 + Supabase + Payments)

Build and deploy production-grade, 24/7 autonomous WhatsApp AI triage bots and high-converting PWAs with 50/50 milestone payments in under 1 hour.

---

## 🚀 Key Features
- **Next.js 14 App Router & Tailwind CSS**: Sub-second loading, dark cyber modern theme.
- **WhatsApp Webhook Receiver (`src/app/api/whatsapp/route.js`)**: Built-in verification (`hub.verify_token`), interactive appointment booking, client triage.
- **Gemini 2.5 Flash Triage Engine (`src/lib/aiTriage.js`)**: Living Google Gemini model with emergency flagging, urgency categorization, and automated on-brand drafting.
- **50/50 Milestone Escrow Payments (`src/app/api/checkout/route.js` & `src/app/api/payments/route.js`)**: Pre-integrated Razorpay & Stripe webhooks with cryptographic HMAC signature verification.
- **Supabase PostgreSQL Schema (`schema.sql`)**: Zero cold-start latency, multi-tenant tables for leads, appointments, orders, and compliance audit logs.
- **1-Tap QR Client Intake PWA**: Interactive web intake simulator that runs anywhere without requiring native app store approvals.

---

## 🛠️ Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/pravmahawar-create/GARUDA-AI.git
cd packages/sovereign-ai-boilerplate
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in your credentials:
- `NEXT_PUBLIC_SUPABASE_URL` & `SUPABASE_SERVICE_ROLE_KEY` (Supabase project)
- `GEMINI_API_KEY` (Google AI Studio)
- `WHATSAPP_PHONE_NUMBER_ID` & `WHATSAPP_ACCESS_TOKEN` (Meta Cloud API)
- `NEXT_PUBLIC_RAZORPAY_KEY_ID` & `RAZORPAY_KEY_SECRET` (Razorpay)

### 3. Initialize Database
Execute `schema.sql` inside your Supabase SQL Editor.

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to access the live interactive simulator.

---

## 📦 Commercial Distribution License
- **Standard License ($49 / ₹3,999)**: Single client commercial deployment.
- **Extended Agency License ($99 / ₹7,999)**: Unlimited client deployments & white-label re-licensing.

Official Payment Portal: [https://razorpay.me/@garudaosincompany](https://razorpay.me/@garudaosincompany)

Maintained by **Praveen Mahawar** | [GARUDA OS](https://www.garudaos.in)  
Founder Direct Line: `+91 9098750362` | `praveen@garudaos.in`
