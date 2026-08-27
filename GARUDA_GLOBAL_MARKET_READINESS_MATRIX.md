# GARUDA GLOBAL MARKET READINESS MATRIX
**Engineering Milestone 19 — International Market & Currency Readiness Audit**  
**Date:** August 27, 2026  

---

## 1. Geographic Market Readiness Matrix

| Market / Region | Discovery Source | Currency | Readiness % | Level | Key Capabilities & Gaps |
| :--- | :--- | :---: | ---: | :---: | :--- |
| **United States (US)** | Remotive API (`remotive.com`) | USD | **75%** | **Level 3 (Connected)** | Remote software engineering roles fetched live via API; USD pricing in candidates. |
| **United Kingdom (UK)** | Remotive API / Permitted feeds | GBP | **65%** | **Level 2 (Functional)** | GBP currency code supported in `IncomeGoal` & `RazorpayTestPaymentService`. |
| **European Union (EU)** | Remotive API (`worldwide_remote`) | EUR | **65%** | **Level 2 (Functional)** | Remotive EU jobs fetched; EUR currency conversion supported in schema. |
| **UAE / GCC (Middle East)** | Remotive API / Telegram Bot | AED | **55%** | **Level 2 (Functional)** | AED target currency supported; requires adding GCC-specific job API feeds. |
| **Canada (CA)** | Remotive API (`canada_remote`) | CAD | **65%** | **Level 2 (Functional)** | CAD candidates parsed from Remotive API; pricing supported in target models. |
| **Australia (AU)** | Remotive API (`aus_remote`) | AUD | **60%** | **Level 2 (Functional)** | AUD candidates parsed from Remotive API; pricing supported in target models. |
| **Singapore / Asia-Pacific** | Remotive API (`apac_remote`) | SGD | **55%** | **Level 2 (Functional)** | SGD target supported in `IncomeGoal`; requires adding APAC job board feeds. |
| **Switzerland (CH)** | Remotive API | CHF | **50%** | **Level 2 (Functional)** | Target currency CHF supported; requires international settlement provider. |

---

## 2. Currency Support & Accounting Matrix

| Currency Code | Target Normalization | Quoted & Contract | Payment Verification | Settlement Support | Real Revenue Received |
| :---: | :---: | :---: | :---: | :---: | :---: |
| **USD ($)** | **YES** (`$10,000/wk`) | **YES** (`OutboundComm`) | **YES** (Razorpay multi-currency HMAC) | **YES** (`SettlementLedger`) | **$0** (₹0) |
| **GBP (£)** | **YES** (`£8,000/wk`) | **YES** (`OutboundComm`) | **YES** (Razorpay multi-currency HMAC) | **YES** (`SettlementLedger`) | **£0** (₹0) |
| **EUR (€)** | **YES** (`€10,000/wk`) | **YES** (`OutboundComm`) | **YES** (Razorpay multi-currency HMAC) | **YES** (`SettlementLedger`) | **€0** (₹0) |
| **AED (AED)** | **YES** (`AED 40,000/wk`) | **YES** (`OutboundComm`) | **YES** (Razorpay multi-currency HMAC) | **YES** (`SettlementLedger`) | **AED 0** (₹0) |
| **CAD ($)** | **YES** (`CAD 12,000/wk`) | **YES** (`OutboundComm`) | **YES** (Razorpay multi-currency HMAC) | **YES** (`SettlementLedger`) | **CAD 0** (₹0) |
| **AUD ($)** | **YES** (`AUD 15,000/wk`) | **YES** (`OutboundComm`) | **YES** (Razorpay multi-currency HMAC) | **YES** (`SettlementLedger`) | **AUD 0** (₹0) |
| **SGD ($)** | **YES** (`SGD 13,000/wk`) | **YES** (`OutboundComm`) | **YES** (Razorpay multi-currency HMAC) | **YES** (`SettlementLedger`) | **SGD 0** (₹0) |
| **INR (₹)** | **YES** (`₹800,000/wk`) | **YES** (`OutboundComm`) | **YES** (Razorpay multi-currency HMAC) | **YES** (`SettlementLedger`) | **₹0** |

---

## 3. Global Service Capability Matrix

| Service Offering | Target Universe | Supported Agent / Tools | Deliverable Artifact | Pricing Model | Real-World Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **AI & Software Engineering** | Software Development | Mother Brain + Phase 1-8 Execution Core | Source Code, Web App, Architecture Audit | Hourly ($50-$150/hr) or Fixed Contract | **Level 5 (Real Data - Candidate #2091105)** |
| **Technical Documentation** | Knowledge Engine | Knowledge RAG + FileModifierTool | API Specs, Guidelines Document | Per Document ($500-$2,000) | **Level 2 (Locally Functional)** |
| **Repository Quality Audit** | Engineering | CommandRunnerTool + Validator | Code Audit Report, Vulnerability Matrix | Project Fixed Fee ($1,000-$5,000) | **Level 2 (Locally Functional)** |
| **Insurance Q&A** | Knowledge / Insurance | ABSLI Policy Service + Telegram Bot | Policy Answers, Terms Summary | Per Inquiry / Lead Fee | **Level 1 (Code Exists - Zero Scrapers)** |
| **Tutor Services** | Education | None | None | Per Session Fee | **Level 0 (Vision Only - Zero Code)** |
