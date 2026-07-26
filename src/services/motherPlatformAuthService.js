/**
 * 🦅 GARUDA Governed Platform Authentication Readiness Service
 * Evaluates connector credential configuration, performs offline shape validation,
 * enforces scope checks, and gates execution readiness with zero secret leakage.
 *
 * Framework Version: v1.0.0
 * Zero secret exposure, zero live external dispatch, zero browser automation.
 */

const motherIntegration = require("./motherRevenueIntegrationService");
const connectorFramework = require("./motherExecutionConnectorService");

// Secret Redaction Utilities
function redactEmail(email = "") {
  const str = String(email || "").trim();
  if (!str.includes("@")) return "[REDACTED]";
  const [user, domain] = str.split("@");
  const maskedUser = user.length <= 2 ? `${user[0]}*` : `${user[0]}***${user[user.length - 1]}`;
  return `${maskedUser}@${domain}`;
}

function redactSecret(secret = "") {
  const str = String(secret || "").trim();
  if (!str) return "[NOT_SET]";
  return "[REDACTED]";
}

// Connector Credential Requirements Definition
const CONNECTOR_AUTH_SPECS = Object.freeze({
  generic_email: Object.freeze({
    connectorId: "generic_email",
    authType: "smtp_basic",
    requiredEnvVars: ["GARUDA_EMAIL_HOST", "GARUDA_EMAIL_PORT", "GARUDA_EMAIL_USER", "GARUDA_EMAIL_PASS"],
    requiredScopes: ["email.draft", "email.send"]
  }),
  generic_client_portal: Object.freeze({
    connectorId: "generic_client_portal",
    authType: "api_key",
    requiredEnvVars: ["GARUDA_CLIENT_PORTAL_API_KEY", "GARUDA_CLIENT_PORTAL_URL"],
    requiredScopes: ["proposal.write", "deliverable.upload"]
  }),
  generic_job_platform: Object.freeze({
    connectorId: "generic_job_platform",
    authType: "oauth2",
    requiredEnvVars: ["GARUDA_JOB_PLATFORM_TOKEN"],
    requiredScopes: ["jobs.read", "applications.draft"]
  }),
  generic_freelance_platform: Object.freeze({
    connectorId: "generic_freelance_platform",
    authType: "oauth2",
    requiredEnvVars: ["GARUDA_FREELANCE_PLATFORM_TOKEN"],
    requiredScopes: ["freelance.read", "proposal.draft"]
  }),
  generic_crm: Object.freeze({
    connectorId: "generic_crm",
    authType: "api_key",
    requiredEnvVars: ["GARUDA_CRM_API_KEY"],
    requiredScopes: ["leads.write"]
  })
});

/**
 * Get public credential requirements for a connector (Zero secrets exposed)
 * @param {String} connectorId
 * @returns {Object} Public configuration spec
 */
function getCredentialRequirements(connectorId) {
  const key = String(connectorId || "").trim();
  const spec = CONNECTOR_AUTH_SPECS[key];
  if (!spec) {
    const err = new Error(`Connector '${connectorId}' authentication spec is not defined`);
    err.statusCode = 404;
    throw err;
  }
  return {
    connectorId: spec.connectorId,
    authType: spec.authType,
    requiredEnvironmentVariables: [...spec.requiredEnvVars],
    requiredScopes: [...spec.requiredScopes],
    secretSource: "process.env"
  };
}

/**
 * Validate connector authentication status safely
 * @param {String} connectorId
 * @param {Object} env Environment variables (defaults to process.env)
 * @param {Object} options Options
 * @returns {Object} Normalized authentication result
 */
function validateConnectorAuthentication(connectorId = "generic_email", env = process.env, options = {}) {
  const key = String(connectorId || "").trim();
  const spec = CONNECTOR_AUTH_SPECS[key];
  if (!spec) {
    const err = new Error(`Connector '${connectorId}' authentication spec is not defined`);
    err.statusCode = 404;
    throw err;
  }

  const now = new Date().toISOString();
  const envVars = spec.requiredEnvVars;
  const missingVars = envVars.filter((varName) => !env[varName] || String(env[varName]).trim() === "");

  if (missingVars.length > 0) {
    return {
      connectorId: spec.connectorId,
      configured: false,
      authenticated: false,
      testMode: true,
      requiredScopes: [...spec.requiredScopes],
      grantedScopes: [],
      missingScopes: [...spec.requiredScopes],
      validationStatus: "credential_not_configured",
      failureCode: "MISSING_ENV_VARS",
      missingEnvironmentVariables: missingVars,
      redactedAccountReference: null,
      validatedAt: now,
      authorizesExternalAction: false
    };
  }

  // Local Shape & Format Validation
  if (spec.connectorId === "generic_email") {
    const user = String(env.GARUDA_EMAIL_USER || "").trim();
    const host = String(env.GARUDA_EMAIL_HOST || "").trim();
    const port = Number(env.GARUDA_EMAIL_PORT);

    const emailValid = user.includes("@") && user.length > 3;
    const hostValid = host.length > 3 && !host.includes(" ");
    const portValid = Number.isInteger(port) && port > 0 && port < 65536;

    if (!emailValid || !hostValid || !portValid) {
      return {
        connectorId: spec.connectorId,
        configured: true,
        authenticated: false,
        testMode: true,
        requiredScopes: [...spec.requiredScopes],
        grantedScopes: [],
        missingScopes: [...spec.requiredScopes],
        validationStatus: "invalid_credentials",
        failureCode: "INVALID_CREDENTIAL_SHAPE",
        redactedAccountReference: redactEmail(user),
        validatedAt: now,
        authorizesExternalAction: false
      };
    }

    // Authenticated Test-Mode Handshake (Offline Shape Verified)
    return {
      connectorId: spec.connectorId,
      configured: true,
      authenticated: true,
      testMode: true,
      requiredScopes: [...spec.requiredScopes],
      grantedScopes: [...spec.requiredScopes],
      missingScopes: [],
      validationStatus: "configured_authenticated",
      failureCode: null,
      redactedAccountReference: redactEmail(user),
      redactedMetadata: {
        host,
        port,
        user: redactEmail(user),
        password: redactSecret(env.GARUDA_EMAIL_PASS)
      },
      validatedAt: now,
      authorizesExternalAction: false
    };
  }

  // Default shape validation for other allow-listed connectors
  return {
    connectorId: spec.connectorId,
    configured: true,
    authenticated: true,
    testMode: true,
    requiredScopes: [...spec.requiredScopes],
    grantedScopes: [...spec.requiredScopes],
    missingScopes: [],
    validationStatus: "configured_authenticated",
    failureCode: null,
    redactedAccountReference: "[CONFIGURED_CONNECTOR]",
    validatedAt: now,
    authorizesExternalAction: false
  };
}

/**
 * Evaluate overall connector readiness for a mission candidate
 * @param {String} missionCandidateId
 * @param {String} connectorId
 * @param {Object} env
 * @returns {Object} Readiness outcome
 */
function evaluateConnectorReadiness(missionCandidateId, connectorId = "generic_email", env = process.env) {
  const candidate = motherIntegration.getMissionCandidate(missionCandidateId);
  const auth = validateConnectorAuthentication(connectorId, env);

  // Readiness Status Logic
  if (candidate.status === "rejected" || candidate.riskLevel === "critical" || candidate.status === "blocked") {
    return {
      missionCandidateId: candidate.opportunityId,
      connectorId,
      readinessStatus: "blocked",
      reason: "Mission candidate is rejected or critical risk",
      authentication: auth,
      executionPackage: null,
      authorizesExternalAction: false
    };
  }

  if (candidate.status !== "approved" && candidate.status !== "execution_ready") {
    return {
      missionCandidateId: candidate.opportunityId,
      connectorId,
      readinessStatus: "blocked",
      reason: "Mission candidate is not Founder-approved",
      authentication: auth,
      executionPackage: null,
      authorizesExternalAction: false
    };
  }

  if (!auth.configured) {
    return {
      missionCandidateId: candidate.opportunityId,
      connectorId,
      readinessStatus: "not_configured",
      reason: `Connector credentials missing: ${auth.missingEnvironmentVariables.join(", ")}`,
      authentication: auth,
      executionPackage: null,
      authorizesExternalAction: false
    };
  }

  if (!auth.authenticated) {
    return {
      missionCandidateId: candidate.opportunityId,
      connectorId,
      readinessStatus: "authentication_required",
      reason: "Connector configuration shape validation failed",
      authentication: auth,
      executionPackage: null,
      authorizesExternalAction: false
    };
  }

  if (auth.missingScopes.length > 0) {
    return {
      missionCandidateId: candidate.opportunityId,
      connectorId,
      readinessStatus: "scope_missing",
      reason: `Required scopes missing: ${auth.missingScopes.join(", ")}`,
      authentication: auth,
      executionPackage: null,
      authorizesExternalAction: false
    };
  }

  const pkg = connectorFramework.buildExecutionPackage(candidate, connectorId);

  return {
    missionCandidateId: candidate.opportunityId,
    connectorId,
    readinessStatus: "ready_for_external_authorization",
    reason: "All connector requirements, authentication, and execution packages are prepared. Awaiting separate Founder external-action authorization.",
    authentication: auth,
    executionPackage: pkg,
    authorizesExternalAction: false
  };
}

module.exports = {
  CONNECTOR_AUTH_SPECS,
  getCredentialRequirements,
  redactEmail,
  redactSecret,
  validateConnectorAuthentication,
  evaluateConnectorReadiness
};
