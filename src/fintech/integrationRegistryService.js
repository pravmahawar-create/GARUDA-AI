/**
 * 🦅 GARUDA OS — BANK & CRM INTEGRATION READINESS REGISTRY (PHASE 8)
 *
 * Truthful Operational Contract:
 * - Customer has NOT yet supplied live bank or CRM API credentials/documentation.
 * - Live connectors strictly report "NOT CONNECTED / AWAITING CUSTOMER ACCESS".
 * - Staged credential fields are hashed/masked server-side (never echoed in plaintext).
 * - Activation remains strictly disabled until formal customer access docs & verification exist.
 */

const crypto = require("crypto");

const INTEGRATION_STATUS = Object.freeze({
  NOT_CONNECTED: "NOT_CONNECTED",
  SANDBOX_SIMULATION_ONLY: "SANDBOX_SIMULATION_ONLY"
});

const INITIAL_CONNECTOR_DEFINITIONS = Object.freeze([
  // Bank Adapters
  {
    providerId: "icici_corporate_india",
    category: "BANK",
    name: "ICICI Bank Corporate API Stack (CIB)",
    region: "India (INR · RTGS / NEFT / IMPS / VAN)",
    connectionStatus: INTEGRATION_STATUS.NOT_CONNECTED,
    readinessLabel: "NOT CONNECTED / AWAITING CUSTOMER ACCESS",
    activationAllowed: false,
    requiredFields: ["corpId", "userId", "clientCertFingerprint", "webhookSecret", "callbackUrl"],
    notes: "Requires customer CIB corporate portal onboarding, static IP allowlisting, and mTLS certificate exchange."
  },
  {
    providerId: "wio_bank_uae",
    category: "BANK",
    name: "Wio Business Banking API",
    region: "UAE (AED / USD · UAEFTS)",
    connectionStatus: INTEGRATION_STATUS.NOT_CONNECTED,
    readinessLabel: "NOT CONNECTED / AWAITING CUSTOMER ACCESS",
    activationAllowed: false,
    requiredFields: ["merchantId", "apiKey", "webhookSecret", "callbackUrl"],
    notes: "Requires licensed UAE entity portal API token and HMAC webhook provisioning."
  },
  {
    providerId: "modulr_uk_eu",
    category: "BANK",
    name: "Modulr Financial Services API",
    region: "UK / EU (GBP / EUR · Faster Payments / SEPA)",
    connectionStatus: INTEGRATION_STATUS.NOT_CONNECTED,
    readinessLabel: "NOT CONNECTED / AWAITING CUSTOMER ACCESS",
    activationAllowed: false,
    requiredFields: ["customerId", "apiToken", "hmacSecret", "callbackUrl"],
    notes: "Requires Modulr customer partner approval and HMAC request signing keys."
  },
  {
    providerId: "mock_sovereign_bank",
    category: "BANK",
    name: "GARUDA Deterministic Bank Simulator",
    region: "Local / Isolated Sandbox (SIMULATED ONLY)",
    connectionStatus: INTEGRATION_STATUS.SANDBOX_SIMULATION_ONLY,
    readinessLabel: "SIMULATED SANDBOX ADAPTER (NON-MONEY)",
    activationAllowed: false,
    requiredFields: ["webhookSecret", "callbackUrl"],
    notes: "Deterministic local simulator for webhook HMAC, duplicate, reversal, and settlement tests."
  },
  // CRM Connectors
  {
    providerId: "zoho_crm",
    category: "CRM",
    name: "Zoho CRM Enterprise Sync",
    region: "Merchant KYC & B2B Billing Sync",
    connectionStatus: INTEGRATION_STATUS.NOT_CONNECTED,
    readinessLabel: "NOT CONNECTED / AWAITING CUSTOMER ACCESS",
    activationAllowed: false,
    requiredFields: ["orgId", "clientId", "clientSecret", "webhookSecret"],
    notes: "Syncs approved commercial agreements and daily GST invoice statuses upon customer OAuth grant."
  },
  {
    providerId: "salesforce_enterprise",
    category: "CRM",
    name: "Salesforce Financial Services Cloud",
    region: "Enterprise Account & Dispute Sync",
    connectionStatus: INTEGRATION_STATUS.NOT_CONNECTED,
    readinessLabel: "NOT CONNECTED / AWAITING CUSTOMER ACCESS",
    activationAllowed: false,
    requiredFields: ["instanceUrl", "clientId", "clientSecret", "webhookSecret"],
    notes: "Awaiting customer Salesforce connected-app credentials and field mapping specification."
  },
  {
    providerId: "hubspot_crm",
    category: "CRM",
    name: "HubSpot Revenue & Merchant Pipeline",
    region: "Onboarding & Commercial Pipeline Sync",
    connectionStatus: INTEGRATION_STATUS.NOT_CONNECTED,
    readinessLabel: "NOT CONNECTED / AWAITING CUSTOMER ACCESS",
    activationAllowed: false,
    requiredFields: ["portalId", "privateAppToken", "webhookSecret"],
    notes: "Awaiting customer HubSpot Private App token and scoped webhook endpoint."
  },
  {
    providerId: "custom_webhook_crm",
    category: "CRM",
    name: "Customer ERP / Signed Webhook Connector",
    region: "Custom HMAC-SHA256 Event Bridge",
    connectionStatus: INTEGRATION_STATUS.NOT_CONNECTED,
    readinessLabel: "NOT CONNECTED / AWAITING CUSTOMER ACCESS",
    activationAllowed: false,
    requiredFields: ["endpointUrl", "signingSecret", "authHeaderName"],
    notes: "Outbox connector for SAP/Tally/custom ERP ledger sync once customer provides endpoint spec."
  }
]);

const SENSITIVE_FIELD_RE = /(secret|token|key|password|cert|pin)/i;

class IntegrationReadinessError extends Error {
  constructor(message, errorCode = "CUSTOMER_ACCESS_REQUIRED", httpStatus = 403) {
    super(`[INTEGRATION_READINESS] ${message} (${errorCode})`);
    this.name = "IntegrationReadinessError";
    this.errorCode = errorCode;
    this.httpStatus = httpStatus;
  }
}

class IntegrationRegistryService {
  constructor() {
    this.stagedConfigs = new Map(); // `${tenantId}::${providerId}` -> masked metadata
  }

  _requireTenant(tenantId) {
    const clean = String(tenantId || "").trim();
    if (!clean) {
      throw new IntegrationReadinessError("Authenticated tenantId is required", "TENANT_REQUIRED", 401);
    }
    return clean;
  }

  listIntegrations(tenantId) {
    const cleanTenantId = this._requireTenant(tenantId);
    return INITIAL_CONNECTOR_DEFINITIONS.map((def) => {
      const staged = this.stagedConfigs.get(`${cleanTenantId}::${def.providerId}`) || null;
      return {
        ...def,
        tenantId: cleanTenantId,
        stagedConfigSummary: staged
          ? {
              stagedAt: staged.stagedAt,
              stagedBy: staged.stagedBy,
              fieldsConfigured: staged.fieldsConfigured,
              maskedValues: staged.maskedValues
            }
          : null,
        // Never allow live activation without genuine bank/CRM access verification
        activationAllowed: false,
        connectionStatus: def.connectionStatus,
        readinessLabel: def.readinessLabel
      };
    });
  }

  stageCredentials({ tenantId, providerId, payload = {}, actorId = "TENANT_ADMIN" }) {
    const cleanTenantId = this._requireTenant(tenantId);
    const def = INITIAL_CONNECTOR_DEFINITIONS.find((c) => c.providerId === providerId);
    if (!def) {
      throw new IntegrationReadinessError(`Unknown provider connector "${providerId}"`, "UNKNOWN_CONNECTOR", 404);
    }

    const fieldsConfigured = [];
    const maskedValues = {};

    for (const field of def.requiredFields) {
      const rawVal = payload[field];
      if (rawVal === undefined || rawVal === null || String(rawVal).trim() === "") continue;
      const val = String(rawVal).trim();
      if ((field.toLowerCase().includes("url") || field.toLowerCase().includes("endpoint")) && !/^https:\/\/.+/i.test(val)) {
        throw new IntegrationReadinessError(
          `Field "${field}" must use a valid https:// URL`,
          "INVALID_CALLBACK_URL",
          400
        );
      }

      fieldsConfigured.push(field);
      if (SENSITIVE_FIELD_RE.test(field)) {
        const digest = crypto.createHash("sha256").update(val).digest("hex").slice(0, 12);
        const last4 = val.length >= 4 ? val.slice(-4) : "****";
        maskedValues[field] = `MASKED(****${last4} · sha256:${digest})`;
      } else {
        maskedValues[field] = val;
      }
    }

    if (fieldsConfigured.length === 0) {
      throw new IntegrationReadinessError(
        "At least one configuration field is required to stage setup",
        "EMPTY_CONFIG_PAYLOAD",
        400
      );
    }

    const stagedRecord = {
      tenantId: cleanTenantId,
      providerId,
      stagedAt: new Date().toISOString(),
      stagedBy: actorId,
      fieldsConfigured,
      maskedValues
    };

    this.stagedConfigs.set(`${cleanTenantId}::${providerId}`, stagedRecord);

    return {
      providerId,
      connectionStatus: def.connectionStatus,
      readinessLabel: def.readinessLabel,
      activationAllowed: false,
      stagedConfigSummary: stagedRecord,
      message: "Non-live configuration metadata staged securely. Connector remains NOT CONNECTED / AWAITING CUSTOMER ACCESS until authorized provider documentation and sandbox/live sign-off are supplied."
    };
  }

  attemptActivate({ tenantId, providerId }) {
    this._requireTenant(tenantId);
    const def = INITIAL_CONNECTOR_DEFINITIONS.find((c) => c.providerId === providerId);
    if (!def) {
      throw new IntegrationReadinessError(`Unknown provider connector "${providerId}"`, "UNKNOWN_CONNECTOR", 404);
    }

    throw new IntegrationReadinessError(
      `Activation blocked for "${def.name}": customer has not supplied verified production API credentials, bank/CRM documentation, and IP allowlist approval (NOT CONNECTED / AWAITING CUSTOMER ACCESS).`,
      "CUSTOMER_ACCESS_REQUIRED",
      403
    );
  }
}

const defaultIntegrationRegistryService = new IntegrationRegistryService();

module.exports = {
  INTEGRATION_STATUS,
  INITIAL_CONNECTOR_DEFINITIONS,
  IntegrationReadinessError,
  IntegrationRegistryService,
  defaultIntegrationRegistryService
};
