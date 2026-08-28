# GARUDA PAID SEARCH READINESS & CAMPAIGN BLUEPRINT
*(Architecture & Configuration Blueprint — No Ads Running, Zero Spend)*

**Objective:** Ensure that whenever the Founder decides to allocate an acquisition budget, Google Search Ads campaigns can be launched immediately with pre-tested landing pages, negative keyword safety filters, high-intent ad copy, and end-to-end UTM conversion tracking.

---

## 1. Campaign Structure & Budget Allocation Model

```
Campaign 1: HIGH-INTENT CUSTOM AI & AGENTS
├── Ad Group 1.1: Custom AI Development [Exact / Phrase Match]
│   └── Landing Page: https://www.garudaos.in/services/custom-ai-development?utm_source=google_ads&utm_medium=cpc&utm_campaign=custom_ai_search
├── Ad Group 1.2: AI Agent & Multi-Agent Development
│   └── Landing Page: https://www.garudaos.in/services/ai-agent-development?utm_source=google_ads&utm_medium=cpc&utm_campaign=ai_agents_search
└── Ad Group 1.3: Enterprise RAG Pipelines
    └── Landing Page: https://www.garudaos.in/services/rag-development?utm_source=google_ads&utm_medium=cpc&utm_campaign=enterprise_rag_search

Campaign 2: RAPID SAAS MVP & CUSTOM SOFTWARE
├── Ad Group 2.1: SaaS MVP Development
│   └── Landing Page: https://www.garudaos.in/services/saas-mvp-development?utm_source=google_ads&utm_medium=cpc&utm_campaign=saas_mvp_search
├── Ad Group 2.2: Custom Software Development
│   └── Landing Page: https://www.garudaos.in/services/custom-software-development?utm_source=google_ads&utm_medium=cpc&utm_campaign=custom_software_search
└── Ad Group 2.3: Custom Website Development
    └── Landing Page: https://www.garudaos.in/services/website-development?utm_source=google_ads&utm_medium=cpc&utm_campaign=website_dev_search

Campaign 3: WORKFLOW AUTOMATION & COMMERCIAL BOTS
├── Ad Group 3.1: Business Workflow Automation
│   └── Landing Page: https://www.garudaos.in/services/business-automation?utm_source=google_ads&utm_medium=cpc&utm_campaign=business_automation_search
└── Ad Group 3.2: Custom WhatsApp & Telegram Bots
    └── Landing Page: https://www.garudaos.in/services/whatsapp-telegram-ai-bots?utm_source=google_ads&utm_medium=cpc&utm_campaign=commercial_bots_search
```

---

## 2. High-Intent Target Keywords vs Negative Keyword Guardrails

### Target Keywords (High Commercial Intent):
- `"custom ai development company"`
- `"hire custom ai developers"`
- `"ai agent development services"`
- `"build multi agent system"`
- `"saas mvp development company"`
- `"custom software development services"`
- `"custom website development company"`
- `"enterprise rag pipeline development"`
- `"automate business workflows with ai"`

### Negative Keywords (Protect Budget against Non-Buyers & Job Seekers):
- `free`, `open source tutorial`, `internship`, `jobs`, `salary`, `github repo`, `crack`, `course`, `certification`, `student project`, `cheap freelancer`, `fiverr $5`, `hourly contractor`, `garuda linux download`

---

## 3. Recommended High-Converting Ad Copy Variations

### Ad Group: Custom AI Development
* **Headline 1:** Custom AI Development | Production-Grade AI Systems
* **Headline 2:** Built with Deterministic QA & 100% Truth Law
* **Headline 3:** Get a Fixed-Price Project Scope
* **Description 1:** Bespoke generative AI pipelines, tool-calling multi-agent graphs, and enterprise RAG. Full source code ownership.
* **Description 2:** Scoped in hours by senior AI architects. View transparent milestone pricing and get a formal quotation.

### Ad Group: SaaS MVP Development
* **Headline 1:** SaaS MVP Development | Launch in 2-3 Weeks
* **Headline 2:** React, Node.js, Stripe Billing & Auth Included
* **Headline 3:** Request Your Project Architecture
* **Description 1:** Turn your product concept into a scalable, production-ready SaaS application with clean code and zero vendor lock-in.
* **Description 2:** Fixed milestone pricing with 50% advance kickoff and 100% automated regression verification.

---

## 4. Conversion Tracking & Attribution Flow

1. **Ad Click Tracking:**
   `https://www.garudaos.in/services/custom-ai-development?utm_source=google_ads&utm_medium=cpc&utm_campaign=custom_ai_search&gclid=Cj0K...`
2. **First-Touch Persistence:**
   `frontend/src/utils/attribution.js` caches `gclid`, `utm_campaign`, `utm_source`, and `utm_medium` into `sessionStorage`.
3. **Form Submission Telemetry:**
   `trackEvent("project_scope_submitted")` fires `window.gtag("event", "conversion", { ... })`.
4. **Backend Lead Ingestion:**
   `POST /api/inbound/project-scope` persists `attribution: { channel: "Identifiable Campaign", source: "google_ads", gclid: "..." }` and delivers real-time Telegram alert to Founder.

---

## 5. Pre-Launch Founder Checklist

- [ ] Connect Google Ads account to Google Analytics 4 property.
- [ ] Import `project_scope_submitted` conversion event into Google Ads.
- [ ] Set initial test budget (e.g. ₹1,000 – ₹2,500 / day).
- [ ] Confirm negative keyword list is applied to all active ad groups.
- [ ] Ensure `VITE_WHATSAPP_NUMBER` is configured in Vercel if WhatsApp conversion path is utilized.
