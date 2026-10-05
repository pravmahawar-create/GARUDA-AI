# 🦅 GARUDA OS — FINTECH PROVIDER READINESS MATRIX
## Regulated Banking & Payment Service Provider Integration Status
**Document ID**: `GARUDA-FINTECH-PROVIDER-MATRIX-V2.0`  
**Classification**: Sovereign Enterprise Infrastructure & Bank Partner Onboarding  
**Current Spec**: `GARUDA-FINTECH-SPEC-V2.0`  
**Founder**: Praveen Mahawar  
**Last Audit**: 2026-10-01T19:02:30+05:30  
**Status**: ACTIVE PRODUCTION REFERENCE  

---

## 1. STATUS CLASSIFICATION TAXONOMY (7-TIER CANONICAL MODEL)

In accordance with GARUDA's Anti-Fabrication Law, provider integrations are strictly classified as follows:
* `MOCK`: Fully simulated in-memory adapter for automated CI/CD testing without network calls.
* `SANDBOX_READY`: Adapter code implements the interface and schema, ready to connect upon credential configuration.
* `SANDBOX_CONNECTED`: Valid sandbox credentials supplied; network connection established to sandbox endpoints.
* `SANDBOX_VERIFIED`: Full sandbox lifecycle (VAN generation, transaction simulation, webhook receipt, reconciliation) passed with evidence.
* `LIVE_CREDENTIALS_PENDING`: Commercial agreement signed; awaiting issuance of production certificates/API keys.
* `LIVE_CONNECTED`: Production credentials loaded; mTLS handshake and health check verified with live banking core.
* `LIVE_VERIFIED`: Controlled production transactions settled with zero discrepancies.

*HARD INVARIANT: No provider is ever marked "LIVE VERIFIED" without real signed production evidence.*

---

## 2. COMPREHENSIVE PROVIDER MATRIX

| Evaluation Dimension | UAE: Wio Bank PJSC | India: ICICI Bank Ltd | UK / EU: Modulr FS Ltd | Mock Sovereign Interbank |
|---|---|---|---|---|
| **Regulated Entity** | Wio Bank PJSC (Licensed by Central Bank of the UAE) | ICICI Bank Ltd (Scheduled Commercial Bank / RBI Licensed) | Modulr FS Ltd (FCA Authorised EMI / Central Bank of Ireland) | Synthetic Local Test Harness (Offline Simulation) |
| **Jurisdiction** | United Arab Emirates (UAE / GCC) | India (Domestic & Cross-Border) | United Kingdom & European Union | Local Isolated Sandbox |
| **Supported Currencies**| AED, USD | INR | GBP, EUR | USD, GBP, EUR, AED, INR |
| **Supported Rails** | UAE FTS (RTGS), UAE IPI (Aani), SWIFT Inward | RTGS (High Value), NEFT, IMPS | Faster Payments (FPS), CHAPS, SEPA Inst, SEPA Credit | Simulated Domestic & Instant Rails |
| **API Availability** | REST API v1 (Developer Portal) | Corporate Internet Banking (CIB) API Stack | Modulr API v2 (OpenAPI 3.0) | In-Memory Async Adapter |
| **Sandbox Availability**| Sandbox environment via Developer Portal | ICICI Developer Portal Sandbox | Modulr Sandbox Environment | Active in test suite |
| **Production API** | Requires Commercial Corporate Onboarding | Requires Corporate Banking Account & PKI | Requires Commercial BaaS Agreement | N/A (Testing only) |
| **Authentication** | OAuth 2.0 (mTLS + Bearer Token) | PKI Digital Signature (X.509 RSA-2048) | HMAC-SHA256 Signed Request Headers | In-Memory Token Passing |
| **Virtual Account (VAN)**| Supported (Virtual IBANs under Corporate Master) | Supported (Virtual Accounts with corporate prefix) | Supported (Virtual UK Sort Code/Acct & Virtual IBAN) | Supported (Dedicated SIM VANs) |
| **Transaction Status API**| `GET /v1/corporate/transactions/{id}` | `POST /corp-banking/v1/status-inquiry` | `GET /v1/transactions/{id}` | `mockAdapter.getTransactionStatus()` |
| **Webhook Mechanism** | HTTP POST with JSON payload | HTTP POST with Encrypted JSON/XML | HTTP POST with JSON payload | HTTP POST / Direct Ingestion |
| **Webhook Verification**| HMAC-SHA256 (`x-wio-signature`) | HMAC-SHA256 / RSA (`x-icici-signature`) | HMAC-SHA256 (`x-modulr-signature`) | HMAC-SHA256 (`x-mock-signature`) |
| **Settlement Telemetry**| ISO 20022 camt.054 / Real-time callback | Real-time callback + End-of-Day MIS report | Real-time webhooks (`PAYMENT_IN_SUCCESSFUL`) | Synchronous mock event |
| **Reversal/Return Support**| Supported via CBUAE IPP Return API | Supported via RBI RTGS Return Message | Supported via Modulr Return Notification | Supported (`handleReturn`, `handleReversal`)|
| **Rate Limits** | 100 req/min (Sandbox); Custom SLA (Live) | 50 req/min (Sandbox); Dedicated Bandwidth (Live) | 120 req/min (Sandbox); Negotiable (Live) | Unlimited (In-Memory) |
| **Known Limitations** | Aani consumer cap AED 50k (Corporate unlimited) | Scheduled nightly RBI RTGS maintenance window | Max £1M per Faster Payments transaction | Synthetic timing only |
| **Current GARUDA Code** | `src/fintech/adapters/WioBankAdapter.js` | `src/fintech/adapters/IciciCorporateAdapter.js` | `src/fintech/adapters/ModulrUkAdapter.js` | `src/fintech/adapters/MockBankAdapter.js` |
| **Evidence Available** | Unit verified, signature verification tested | Unit verified, signature verification tested | Unit verified, signature verification tested | 73/73 Tests Pass (100% Verified) |
| **Remaining Blockers** | Missing `WIO_API_KEY` & `WIO_MERCHANT_ID` | Missing `ICICI_CORP_ID` & `ICICI_CLIENT_CERT` | Missing `MODULR_API_TOKEN` & `HMAC_SECRET` | None (Fully functional) |
| **Current Operational Status** | **SANDBOX READY (CREDENTIALS GATED)** | **SANDBOX READY (CREDENTIALS GATED)** | **SANDBOX READY (CREDENTIALS GATED)** | **MOCK OPERATIONAL (VERIFIED)** |

---

## 3. LIVE CREDENTIAL GATE & BLOCKER REPORT

In strict adherence to security policies, production credentials are never fabricated or simulated.

```text
================================================================================
                       LIVE CREDENTIAL GATE STATUS REPORT                       
================================================================================
MISSING FOR PRODUCTION:
1. Wio Bank PJSC Production Credentials:
   - WIO_LIVE_API_KEY
   - WIO_LIVE_CLIENT_SECRET
   - WIO_LIVE_MERCHANT_ID
   - Status: AWAITING CORPORATE BAAS CONTRACT EXECUTION (Stage 3 Gate)

2. ICICI Bank Corporate Production Credentials:
   - ICICI_LIVE_CORP_ID
   - ICICI_LIVE_CLIENT_CERT
   - ICICI_LIVE_PRIVATE_KEY_PASS
   - Status: AWAITING CIB API CONTRACT SIGN-OFF (Stage 3 Gate)

3. Modulr FS Ltd Production Credentials:
   - MODULR_LIVE_API_KEY
   - MODULR_LIVE_HMAC_SECRET
   - Status: AWAITING UK/EU EMI CLIENT AGREEMENT (Stage 3 Gate)
================================================================================
```

---

## 4. ENVIRONMENT SEPARATION STANDARD

```text
[DEVELOPMENT]
  • Providers: MockBankAdapter (Default)
  • Storage: In-memory maps / Local PostgreSQL test container
  • Secrets: .env.development (Synthetic keys only)

[STAGING / SANDBOX]
  • Providers: Wio Sandbox, ICICI Sandbox, Modulr Sandbox
  • Storage: Dedicated staging RDS instance
  • Secrets: AWS Secrets Manager / Cloudflare Encrypted Env (Sandbox prefix)

[PRODUCTION]
  • Providers: Verified Live Corporate Bank Adapters
  • Storage: Multi-AZ PostgreSQL with synchronous replication
  • Secrets: AWS KMS / HSM-protected credentials (Strict RBAC, Zero code presence)
```
