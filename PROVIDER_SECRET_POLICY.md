# 🦅 GARUDA OS — PROVIDER SECRET & CREDENTIAL SECURITY POLICY
**Document Reference**: `PROVIDER_SECRET_POLICY.md`  
**System**: GARUDA OS Sovereign Payment Orchestration & Treasury Infrastructure  
**Specification**: `GARUDA-FINTECH-SPEC-V2.0`  
**Author**: Principal Security Architect  
**Founder**: Praveen Mahawar  
**Effective Date**: 2026-10-01  
**Classification**: SOVEREIGN INTERNAL SECURITY DIRECTIVE  

---

## 1. INVIOLABLE CREDENTIAL BOUNDARIES

In accordance with GARUDA Sovereign Security Doctrine and the **100% Anti-Fabrication Law**, the following boundaries are non-negotiable and strictly enforced by automated unit tests:

1. **Zero Hardcoded Secrets**: Under NO circumstances shall any banking API key, client secret, private key, bearer token, or webhook signing key be hardcoded in application source code.
2. **Zero Secrets in Git**: No certificate files (`.pem`, `.pfx`, `.crt`, `.key`) or `.env` files containing live or sandbox secrets shall ever be committed to git repositories or worktrees.
3. **Zero Frontend Exposure**: No provider secret or signing key shall ever be passed to or accessible from browser client bundles, Vite environmental defines, or client-side storage.
4. **Zero Raw Secret Logging**: All logging frameworks, audit loggers, and error handlers MUST apply recursive deep-redaction (`src/fintech/observability.js:redactSecrets`) before serializing payloads to stdout, stderr, or persistent storage.
5. **Zero Secret API Responses**: No REST API endpoint, error response, or diagnostic route shall return raw credential values.
6. **Zero Secrets in Database Records**: Database tables storing merchant or transaction metadata must NEVER store banking provider credentials; all authentication is resolved at runtime via external secret managers.

---

## 2. ENVIRONMENT VARIABLE NAMING CONVENTIONS

All provider credentials must strictly use the designated environment variable names. Environment variables must be separated by environment tiers:

### A. UAE Rails — Wio Bank PJSC
| Variable Name | Environment | Description | Classification |
|---|---|---|---|
| `WIO_SANDBOX_API_KEY` | Sandbox | Sandbox BaaS Client API Key | CONFIDENTIAL |
| `WIO_SANDBOX_CLIENT_SECRET` | Sandbox | Sandbox OAuth2 Client Secret | RESTRICTED |
| `WIO_SANDBOX_MERCHANT_ID` | Sandbox | Wio Corporate Merchant Identifier | CONFIDENTIAL |
| `WIO_LIVE_API_KEY` | Production | Live CBUAE Corporate BaaS Key | STRICTLY CONFIDENTIAL |
| `WIO_LIVE_CLIENT_SECRET` | Production | Live OAuth2 Client Secret | STRICTLY CONFIDENTIAL |
| `WIO_LIVE_MERCHANT_ID` | Production | Production Wio Corporate Account ID | STRICTLY CONFIDENTIAL |
| `WIO_WEBHOOK_SECRET` | Both | Webhook HMAC-SHA256 Secret Key | RESTRICTED |

### B. India Rails — ICICI Bank Corporate API Stack
| Variable Name | Environment | Description | Classification |
|---|---|---|---|
| `ICICI_SANDBOX_CORP_ID` | Sandbox | Corporate Internet Banking (CIB) ID | CONFIDENTIAL |
| `ICICI_SANDBOX_USER_ID` | Sandbox | API User Identifier | CONFIDENTIAL |
| `ICICI_SANDBOX_CLIENT_CERT` | Sandbox | Client PKI Certificate Path / PEM | RESTRICTED |
| `ICICI_LIVE_CORP_ID` | Production | Live CIB Corporate Identifier | STRICTLY CONFIDENTIAL |
| `ICICI_LIVE_CLIENT_CERT` | Production | Production RSA-2048 Client Certificate | CRITICAL VAULT |
| `ICICI_LIVE_PRIVATE_KEY_PASS` | Production | HSM / Key Passphrase | CRITICAL VAULT |
| `ICICI_WEBHOOK_SECRET` | Both | Corporate Webhook HMAC Secret | RESTRICTED |

### C. UK / EU Rails — Modulr Finance EMI
| Variable Name | Environment | Description | Classification |
|---|---|---|---|
| `MODULR_SANDBOX_API_KEY` | Sandbox | Modulr Sandbox Partner API Token | CONFIDENTIAL |
| `MODULR_SANDBOX_HMAC_SECRET` | Sandbox | Sandbox HMAC Authorization Key | RESTRICTED |
| `MODULR_LIVE_API_KEY` | Production | Live FCA-Authorized EMI API Key | STRICTLY CONFIDENTIAL |
| `MODULR_LIVE_HMAC_SECRET` | Production | Live HMAC Signing Secret | CRITICAL VAULT |
| `MODULR_WEBHOOK_SECRET` | Both | Webhook Signature Verification Key | RESTRICTED |

### D. Internal Orchestration
| Variable Name | Environment | Description | Classification |
|---|---|---|---|
| `FINTECH_WEBHOOK_SECRET` | Both | Default Fallback Webhook HMAC Secret | INTERNAL SECURE |
| `FINTECH_HIGH_VALUE_THRESHOLD` | Both | High-Value Gate Trigger ($ USD) | CONFIGURATION |

---

## 3. CERTIFICATE & PKI HANDLING PROCEDURE

For banking partners requiring mutual TLS (mTLS) and Public Key Infrastructure (such as ICICI Corporate CIB or European Open Banking eIDAS certificates):

1. **Storage**:
   - Certificates and private keys must NEVER reside on disk in plaintext within the application root.
   - In production, certificates must be injected into memory via AWS Secrets Manager, HashiCorp Vault, or base64-encoded environment variables (`ICICI_CLIENT_CERT_B64`).
2. **Access Control**:
   - Permissions on local certificate staging paths must be restricted strictly to `chmod 600` (read/write only by the application execution UID).
3. **Format & Encryption**:
   - Private keys must be encrypted with AES-256 passphrases at rest.
   - The passphrase must be provided via an ephemeral environment variable and never committed.

---

## 4. SANDBOX VS. LIVE ISOLATION

To prevent accidental cross-talk between test and live environments:

1. **Hard URL Separation**:
   - Adapters MUST dynamically route requests based on `this.environment`.
   - Sandbox endpoints (e.g. `api-sandbox.modulrfinance.com`) and Production endpoints (e.g. `api.modulrfinance.com`) must never share credentials or connection pools.
2. **Key Prefix Validation**:
   - If a live key is supplied to a sandbox adapter, initialization must fail immediately with `CONFIGURATION_MISMATCH`.
3. **Virtual Account Validation**:
   - Sandbox VANs generated in test modes are explicitly prefixed with `VAN-SIM-` or test IBAN identifiers to prevent bank clearing collisions.

---

## 5. SECRET ROTATION PROTOCOL

All banking API keys, webhook HMAC secrets, and certificates must be rotated according to the following schedule:

| Credential Type | Rotation Frequency | Maximum Lifetime | Grace Period |
|---|---|---|---|
| Webhook HMAC Secrets | 90 Days | 120 Days | 72 Hours Dual-Verification Window |
| API Tokens / Keys | 180 Days | 210 Days | 48 Hours Parallel Acceptance |
| mTLS Client Certificates | 365 Days | 395 Days | 14 Days Pre-Expiry Staging |

### Dual-Key Rotation Procedure:
1. Request secondary credential pair from banking partner portal.
2. Configure application with primary and secondary secrets (`WIO_WEBHOOK_SECRET_PRIMARY`, `WIO_WEBHOOK_SECRET_SECONDARY`).
3. Verify signature against primary; if validation fails, fall back to secondary.
4. Promote secondary to primary in environment variables.
5. Decommission deprecated key in banking partner console.

---

## 6. INCIDENT RESPONSE FOR LEAKED CREDENTIALS

If a provider credential or secret is suspected of exposure:

1. **Immediate Revocation (T+0 to T+15 Mins)**:
   - Log into the bank developer portal / corporate banking terminal and revoke the affected API key or certificate immediately.
2. **Circuit Breaker Activation (T+15 Mins)**:
   - Switch affected adapter state in `src/fintech/adapters/` to `CREDENTIALS_REQUIRED`.
   - Incoming webhooks or settlement attempts for that provider are automatically frozen and directed to `MANUAL_REVIEW`.
3. **Forensic Audit & Telemetry Inspection (T+30 Mins)**:
   - Inspect the cryptographic audit log (`src/fintech/auditLogger.js`) to verify whether unauthorized transactions or duplicate nonces were attempted during the exposure window.
4. **Founder & Counsel Alert (T+45 Mins)**:
   - Dispatch immediate CRITICAL alert directly to Founder Praveen Mahawar (+91 9098750362) and retained legal/compliance counsel.
5. **Re-issuance & Verification (T+2 Hours)**:
   - Generate fresh credential pair, stage in secure vault, run automated security suite (`npm run test:fintech`), and verify clean exit code 0 before re-enabling traffic.
