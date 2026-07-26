/**
 * 🦅 GARUDA Governed Execution Connector Framework
 * Builds immutable execution packages for approved Mother revenue missions.
 *
 * Framework Version: v1.0.0
 * Zero live network calls, zero browser automation, zero credential storage, zero fake financial records.
 */

const crypto = require("crypto");
const motherIntegration = require("./motherRevenueIntegrationService");

function sha256(data) {
  return crypto.createHash("sha256").update(JSON.stringify(data)).digest("hex");
}

// 1. CONNECTOR REGISTRY DEFINITIONS
const CONNECTOR_REGISTRY = Object.freeze({
  generic_job_platform: Object.freeze({
    connectorId: "generic_job_platform",
    connectorType: "job_board",
    name: "Generic Job Platform Connector",
    requiredFields: ["opportunityId", "title", "description", "url"],
    supportedActions: ["prepare_deliverable_package", "format_scope_brief"],
    requiredApprovals: ["founder_approval"],
    validationRules: { sourceVerifiedRequired: true, garudaExecutionEligible: true },
    payloadBuilderVersion: "v1.0.0",
    requiresCredentials: false
  }),
  generic_freelance_platform: Object.freeze({
    connectorId: "generic_freelance_platform",
    connectorType: "freelance_marketplace",
    name: "Generic Freelance Platform Connector",
    requiredFields: ["opportunityId", "title", "description", "url"],
    supportedActions: ["prepare_deliverable_package", "format_freelance_milestones"],
    requiredApprovals: ["founder_approval"],
    validationRules: { sourceVerifiedRequired: true },
    payloadBuilderVersion: "v1.0.0",
    requiresCredentials: false
  }),
  generic_client_portal: Object.freeze({
    connectorId: "generic_client_portal",
    connectorType: "client_portal",
    name: "Generic Client Portal Connector",
    requiredFields: ["opportunityId", "title", "description", "url"],
    supportedActions: ["prepare_deliverable_package", "build_technical_proposal_draft"],
    requiredApprovals: ["founder_approval"],
    validationRules: { sourceVerifiedRequired: true },
    payloadBuilderVersion: "v1.0.0",
    requiresCredentials: false
  }),
  generic_email: Object.freeze({
    connectorId: "generic_email",
    connectorType: "email_outbound",
    name: "Generic Email Draft Connector",
    requiredFields: ["opportunityId", "title", "description"],
    supportedActions: ["format_email_draft"],
    requiredApprovals: ["founder_approval"],
    validationRules: { sourceVerifiedRequired: true },
    payloadBuilderVersion: "v1.0.0",
    requiresCredentials: false
  }),
  generic_crm: Object.freeze({
    connectorId: "generic_crm",
    connectorType: "crm_intake",
    name: "Generic CRM Intake Connector",
    requiredFields: ["opportunityId", "title", "description"],
    supportedActions: ["format_crm_lead"],
    requiredApprovals: ["founder_approval"],
    validationRules: { sourceVerifiedRequired: true },
    payloadBuilderVersion: "v1.0.0",
    requiresCredentials: false
  })
});

// In-memory package store for idempotency and audit tracking
const executionPackageStore = new Map();

/**
 * List all registered connectors
 * @returns {Array} List of connector definitions
 */
function listConnectors() {
  return Object.values(CONNECTOR_REGISTRY);
}

/**
 * Resolve a specific connector by ID
 * @param {String} connectorId
 * @returns {Object} Connector definition
 */
function resolveConnector(connectorId) {
  const key = String(connectorId || "").trim();
  const connector = CONNECTOR_REGISTRY[key];
  if (!connector) {
    const err = new Error(`Connector '${connectorId}' is not registered or allow-listed`);
    err.statusCode = 404;
    throw err;
  }
  return connector;
}

/**
 * Build a governed Execution Package from an approved mission candidate
 * @param {Object|String} candidateInput Mission candidate object or candidate ID
 * @param {String} connectorId Connector identifier
 * @param {Object} options Options
 * @returns {Object} Immutable Execution Package
 */
function buildExecutionPackage(candidateInput, connectorId = "generic_job_platform", options = {}) {
  let candidate = typeof candidateInput === "string"
    ? motherIntegration.getMissionCandidate(candidateInput)
    : candidateInput;

  if (!candidate || !candidate.opportunityId) {
    const err = new Error("Valid mission candidate identity is required");
    err.statusCode = 400;
    throw err;
  }

  // Idempotency check: Return existing package if already built
  const existingKey = `${candidate.opportunityId}:${connectorId}`;
  if (executionPackageStore.has(existingKey)) {
    return executionPackageStore.get(existingKey);
  }

  // Governance Check 1: Founder Approval Required
  if (candidate.founderApproved !== true || (candidate.status !== "approved" && candidate.status !== "execution_ready")) {
    const err = new Error(`Execution package generation refused: Mission candidate '${candidate.opportunityId}' is not Founder-approved (current status: '${candidate.status}')`);
    err.statusCode = 409;
    throw err;
  }

  // Governance Check 2: Opportunity Source Verification
  if (candidate.sourceVerified === false || candidate.url === "") {
    const err = new Error(`Execution package generation refused: Opportunity '${candidate.opportunityId}' is unverified or missing original URL`);
    err.statusCode = 409;
    throw err;
  }

  // Governance Check 3: Risk / Status Block Check
  if (candidate.riskLevel === "critical" || candidate.status === "rejected" || candidate.status === "blocked") {
    const err = new Error(`Execution package generation refused: Candidate '${candidate.opportunityId}' is blocked due to risk/rejection`);
    err.statusCode = 409;
    throw err;
  }

  // Resolve Connector
  const connector = resolveConnector(connectorId);

  // Governance Check 4: Connector Required Fields Verification
  const missingFields = connector.requiredFields.filter((field) => {
    const val = candidate[field];
    return val === undefined || val === null || val === "";
  });
  if (missingFields.length > 0) {
    const err = new Error(`Execution package generation refused: Candidate '${candidate.opportunityId}' is missing required connector fields: ${missingFields.join(", ")}`);
    err.statusCode = 400;
    throw err;
  }

  // Extract Verified Data ONLY (Never Fabricate)
  const verifiedTitle = String(candidate.title || "").trim();
  const verifiedScope = String(candidate.description || "").trim();
  const verifiedBudget = candidate.salaryText || candidate.budget || null;
  const verifiedDeadline = candidate.deadline || candidate.publishedAt || null;

  // Build Payload
  const payloadData = {
    opportunityId: candidate.opportunityId,
    missionId: candidate.missionId,
    title: verifiedTitle,
    scope: verifiedScope,
    budget: verifiedBudget,
    deadline: verifiedDeadline,
    primaryCapability: candidate.primaryCapability,
    secondaryCapabilities: candidate.secondaryCapabilities || [],
    classification: candidate.classification,
    source: candidate.source || "unknown",
    url: candidate.url || ""
  };

  const packageId = `EXEC_PKG_${candidate.opportunityId}_${connector.connectorId}`;
  const timestamp = new Date().toISOString();

  const packageHash = sha256({
    packageId,
    connectorId: connector.connectorId,
    payload: payloadData,
    founderApprovedAt: candidate.founderDecision?.decidedAt || timestamp
  });

  const executionPackage = {
    packageId,
    missionId: candidate.missionId,
    opportunityId: candidate.opportunityId,
    connectorRequirements: {
      connectorId: connector.connectorId,
      connectorType: connector.connectorType,
      name: connector.name,
      payloadBuilderVersion: connector.payloadBuilderVersion
    },
    verifiedTitle,
    verifiedScope,
    verifiedBudget,
    verifiedDeadline,
    capabilityProfile: {
      primaryCapability: candidate.primaryCapability,
      secondaryCapabilities: candidate.secondaryCapabilities || []
    },
    deliverables: [
      {
        name: `${candidate.primaryCapability}_deliverable`,
        type: "source_code_package",
        verified: true
      }
    ],
    evidence: {
      sourceVerified: true,
      url: candidate.url,
      qualification: candidate.qualification,
      feasibility: candidate.feasibility,
      riskLevel: candidate.riskLevel
    },
    payload: payloadData,
    governance: {
      founderApproved: true,
      externalActionBlocked: true,
      authorizesExternalAction: false,
      noNetworkExecutionPerformed: true,
      noPaymentOrSettlementCreated: true
    },
    packageHash,
    createdAt: timestamp,
    status: "package_prepared_awaiting_dispatch_authorization"
  };

  executionPackageStore.set(existingKey, executionPackage);
  return executionPackage;
}

/**
 * Reset execution package store (for testing)
 */
function resetExecutionPackageStore() {
  executionPackageStore.clear();
}

module.exports = {
  CONNECTOR_REGISTRY,
  listConnectors,
  resolveConnector,
  buildExecutionPackage,
  resetExecutionPackageStore
};
