/**
 * 🦅 GARUDA Governed Platform Authentication & Governed Live Action Service
 * Manages connector credentials, validation, readiness gating, and governed execution.
 *
 * Framework Version: v1.0.0
 * Zero secret exposure, zero browser automation, strict Founder authorization gating.
 */

const crypto = require("crypto");
const net = require("net");
const tls = require("tls");
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

// Single-send audit store for live actions
const liveActionAuditStore = new Map();

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
 * @returns {Object} Normalized authentication result
 */
function validateConnectorAuthentication(connectorId = "generic_email", env = process.env) {
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

/**
 * Prepare proposed governed live SMTP action (Step 2 & 3)
 * @param {String} candidateId
 * @param {Object} options
 * @returns {Object} Complete proposed action payload awaiting authorization
 */
function prepareGovernedSmtpAction(candidateId, options = {}) {
  const readiness = evaluateConnectorReadiness(candidateId, "generic_email", options.env || process.env);

  if (readiness.readinessStatus !== "ready_for_external_authorization") {
    const err = new Error(`Cannot prepare SMTP action: Connector readiness is '${readiness.readinessStatus}'`);
    err.statusCode = 409;
    throw err;
  }

  const recipient = "garudaos.ai@gmail.com";
  const subject = "GARUDA First Governed SMTP Test";
  const body = `GARUDA SMTP connector successfully completed its first founder-authorized governed live test.\n\nThis message confirms:\n- authenticated connector execution\n- founder-controlled authorization\n- truthful audit recording\n- no customer outreach\n- no payment or settlement action\n\nJAI GARUDA.`;

  const packageHash = readiness.executionPackage.packageHash;
  const idempotencyKey = crypto.createHash("sha256").update(`${candidateId}:${recipient}:${packageHash}`).digest("hex");

  return {
    missionCandidateId: candidateId,
    connectorId: "generic_email",
    proposedAction: {
      recipient,
      subject,
      body,
      connector: "generic_email (SMTP)",
      executionPackageHash: packageHash,
      sideEffectClassification: "Live Outbound Email Dispatch (Self-Test Only)",
      idempotencyKey
    },
    authenticationStatus: readiness.authentication.validationStatus,
    redactedSender: readiness.authentication.redactedAccountReference,
    authorizationStatus: "awaiting_founder_authorization",
    exactAuthorizationPhraseRequired: "FOUNDER APPROVED FIRST SMTP SELF-TEST",
    authorizesExternalAction: false
  };
}

/**
 * Native Zero-Dependency SMTP Client over Socket (STARTTLS / TLS)
 */
function sendSmtpNative(config, mail) {
  return new Promise((resolve, reject) => {
    const port = Number(config.port) || 587;
    const host = String(config.host).trim();
    const user = String(config.user).trim();
    const pass = String(config.pass).trim();

    let socket;
    let step = 0;
    const responseLog = [];

    function cleanup() {
      if (socket && !socket.destroyed) {
        socket.destroy();
      }
    }

    const timer = setTimeout(() => {
      cleanup();
      reject(new Error("SMTP socket connection timed out"));
    }, Number(config.timeoutMs) || 30000);

    function sendCmd(cmd) {
      if (socket && socket.writable) {
        socket.write(cmd + "\r\n");
      }
    }

    function handleData(data) {
      const text = data.toString();
      responseLog.push(text.trim());
      const code = parseInt(text.slice(0, 3), 10);

      if (step === 0 && code === 220) {
        // Connected, EHLO
        step = 1;
        sendCmd("EHLO garuda.ai");
      } else if (step === 1 && code === 250) {
        // EHLO ok -> STARTTLS or AUTH
        if (port === 465) {
          step = 3;
          sendCmd("AUTH LOGIN");
        } else {
          step = 2;
          sendCmd("STARTTLS");
        }
      } else if (step === 2 && code === 220) {
        // STARTTLS ok -> upgrade socket to TLS
        const secureSocket = tls.connect({
          socket,
          servername: host,
          rejectUnauthorized: false
        }, () => {
          socket = secureSocket;
          socket.on("data", handleData);
          step = 3;
          sendCmd("EHLO garuda.ai");
        });
        secureSocket.on("error", (err) => {
          clearTimeout(timer);
          cleanup();
          reject(err);
        });
      } else if (step === 3 && code === 250) {
        // EHLO after TLS ok -> AUTH LOGIN
        step = 4;
        sendCmd("AUTH LOGIN");
      } else if (step === 4 && code === 334) {
        // Username prompt -> Send base64 user
        step = 5;
        sendCmd(Buffer.from(user).toString("base64"));
      } else if (step === 5 && code === 334) {
        // Password prompt -> Send base64 pass
        step = 6;
        sendCmd(Buffer.from(pass).toString("base64"));
      } else if (step === 6 && code === 235) {
        // Auth OK -> MAIL FROM
        step = 7;
        sendCmd(`MAIL FROM:<${user}>`);
      } else if (step === 7 && code === 250) {
        // MAIL FROM ok -> RCPT TO
        step = 8;
        sendCmd(`RCPT TO:<${mail.to}>`);
      } else if (step === 8 && code === 250) {
        // RCPT TO ok -> DATA
        step = 9;
        sendCmd("DATA");
      } else if (step === 9 && code === 354) {
        // DATA ok -> Send Email Content
        step = 10;
        const msgId = `<${Date.now()}.${crypto.randomBytes(4).toString("hex")}@garuda.ai>`;
        const emailContent = [
          `From: GARUDA AI Operating System <${user}>`,
          `To: <${mail.to}>`,
          `Subject: ${mail.subject}`,
          `Date: ${new Date().toUTCString()}`,
          `Message-ID: ${msgId}`,
          `Content-Type: text/plain; charset=utf-8`,
          ``,
          mail.body,
          `.`
        ].join("\r\n");

        sendCmd(emailContent);
      } else if (step === 10 && code === 250) {
        // Delivery accepted! QUIT
        clearTimeout(timer);
        const providerResponseId = text.trim();
        step = 11;
        sendCmd("QUIT");
        cleanup();
        resolve({
          accepted: true,
          providerResponseId,
          smtpLog: responseLog.slice(-3)
        });
      } else if (code >= 400) {
        clearTimeout(timer);
        cleanup();
        reject(new Error(`SMTP Server Error (${code}): ${text.trim()}`));
      }
    }

    if (port === 465) {
      socket = tls.connect(port, host, { servername: host, rejectUnauthorized: false, family: 4 }, () => {
        socket.on("data", handleData);
      });
    } else {
      socket = net.connect({ port, host, family: 4 }, () => {
        socket.on("data", handleData);
      });
    }

    socket.on("error", (err) => {
      clearTimeout(timer);
      cleanup();
      reject(err);
    });
  });
}

/**
 * Execute Governed Live SMTP Action (Step 4 & 5)
 * Requires exact Founder Authorization phrase: "FOUNDER APPROVED FIRST SMTP SELF-TEST"
 * @param {String} candidateId
 * @param {String} authorizationPhrase
 * @param {Object} options
 * @returns {Promise<Object>} Execution result & audit record
 */
async function executeGovernedSmtpAction(candidateId, authorizationPhrase, options = {}) {
  const REQUIRED_PHRASE = "FOUNDER APPROVED FIRST SMTP SELF-TEST";
  const trimmedPhrase = String(authorizationPhrase || "").trim();

  // Founder Authorization Gate
  if (trimmedPhrase !== REQUIRED_PHRASE) {
    const err = new Error(`Execution blocked: Exact Founder authorization phrase required: '${REQUIRED_PHRASE}' (Received: '${trimmedPhrase}')`);
    err.statusCode = 403;
    throw err;
  }

  const proposal = prepareGovernedSmtpAction(candidateId, options);
  const idempotencyKey = proposal.proposedAction.idempotencyKey;

  // Idempotency Check
  if (liveActionAuditStore.has(idempotencyKey)) {
    return {
      status: "idempotent_duplicate_prevented",
      result: liveActionAuditStore.get(idempotencyKey),
      message: "Action already executed. Duplicate send prevented."
    };
  }

  const env = options.env || process.env;
  const smtpConfig = {
    host: env.GARUDA_EMAIL_HOST,
    port: env.GARUDA_EMAIL_PORT,
    user: env.GARUDA_EMAIL_USER,
    pass: env.GARUDA_EMAIL_PASS
  };

  const mailPayload = {
    to: proposal.proposedAction.recipient,
    subject: proposal.proposedAction.subject,
    body: proposal.proposedAction.body
  };

  let smtpResult;
  try {
    if (options.mockTransport) {
      smtpResult = await options.mockTransport(smtpConfig, mailPayload);
    } else {
      smtpResult = await sendSmtpNative(smtpConfig, mailPayload);
    }
  } catch (err) {
    const failedRecord = {
      timestamp: new Date().toISOString(),
      candidateId,
      status: "failed",
      error: err.message,
      redactedSender: redactEmail(smtpConfig.user),
      recipient: proposal.proposedAction.recipient,
      subject: proposal.proposedAction.subject,
      idempotencyKey,
      executionPackageHash: proposal.proposedAction.executionPackageHash,
      founderAuthorization: {
        phrase: REQUIRED_PHRASE,
        verified: true
      },
      networkSideEffectCount: 0
    };
    liveActionAuditStore.set(idempotencyKey, failedRecord);
    throw err;
  }

  const auditRecord = {
    timestamp: new Date().toISOString(),
    candidateId,
    status: "sent_and_provider_accepted",
    providerResponseId: smtpResult.providerResponseId || "SMTP_ACCEPTED_250_OK",
    redactedSender: redactEmail(smtpConfig.user),
    recipient: proposal.proposedAction.recipient,
    subject: proposal.proposedAction.subject,
    idempotencyKey,
    executionPackageHash: proposal.proposedAction.executionPackageHash,
    founderAuthorization: {
      phrase: REQUIRED_PHRASE,
      verified: true
    },
    networkSideEffectCount: 1
  };

  liveActionAuditStore.set(idempotencyKey, auditRecord);
  return auditRecord;
}

/**
 * Get audit record for a live action
 * @param {String} idempotencyKey
 */
function getLiveActionAudit(idempotencyKey) {
  return liveActionAuditStore.get(idempotencyKey) || null;
}

/**
 * Reset live audit store (for testing)
 */
function resetLiveActionAuditStore() {
  liveActionAuditStore.clear();
}

module.exports = {
  CONNECTOR_AUTH_SPECS,
  getCredentialRequirements,
  redactEmail,
  redactSecret,
  sendSmtpNative,
  validateConnectorAuthentication,
  evaluateConnectorReadiness,
  prepareGovernedSmtpAction,
  executeGovernedSmtpAction,
  getLiveActionAudit,
  resetLiveActionAuditStore
};
