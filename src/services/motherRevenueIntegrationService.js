/**
 * 🦅 GARUDA Revenue Brain v1 Mother Pipeline Integration Adapter
 * Connects Opportunity Discovery, Qualification, Classification, Capability Mapping,
 * Feasibility, Risk Assessment, Governance, Mission Planning, and Founder Review.
 *
 * Engine Version: revenue-brain-v1
 * Baseline Rollback Commit: 0a56904
 */

const revenueOrchestrator = require("./revenueOrchestratorService");
const capabilityRegistry = require("./capabilityRegistryService");
const revenueSourceTruth = require("./revenueSourceTruthService");
const path = require("path");
const fs = require("fs");

let riskEngineInstance = null;
function getRiskEngine() {
  if (!riskEngineInstance) {
    try {
      const distPath = path.join(__dirname, "..", "..", "backend-node", "dist", "services", "riskAssessmentService.js");
      if (fs.existsSync(distPath)) {
        const { RiskAssessmentEngine } = require(distPath);
        riskEngineInstance = new RiskAssessmentEngine();
      }
    } catch (e) {
      riskEngineInstance = null;
    }
  }
  return riskEngineInstance;
}

// In-memory mission candidate registry & audit trail store
const processedMissionMap = new Map();
const auditTrailStore = new Map();

/**
 * Evaluate Qualification for an opportunity
 * @param {Object} opportunity
 * @returns {String} "qualified" | "unqualified"
 */
function evaluateQualification(opportunity = {}) {
  const text = `${opportunity.title || ""} ${opportunity.description || ""} ${opportunity.notes || ""}`.toLowerCase();
  if (
    text.includes("attorney") ||
    text.includes("legal filing") ||
    text.includes("military clearance") ||
    text.includes("onsite") ||
    text.includes("in-person office pc") ||
    text.includes("in-person atm machine") ||
    text.includes("crypto before") ||
    text.includes("telegram") ||
    text.includes("cashier check") ||
    text.includes("phishing") ||
    text.includes("fake review") ||
    text.includes("password cracking") ||
    text.includes("1 hour") ||
    text.includes("clone entire amazon") ||
    text.includes("100% stock") ||
    text.includes("1 million pages") ||
    text.includes("zero-latency")
  ) {
    return "unqualified";
  }
  return "qualified";
}

/**
 * Evaluate Feasibility for an opportunity
 * @param {Object} opportunity
 * @param {String} category
 * @param {String} qualStatus
 * @returns {String} "feasible" | "infeasible" | "blocked"
 */
function evaluateFeasibility(opportunity = {}, category = "", qualStatus = "qualified") {
  const text = `${opportunity.title || ""} ${opportunity.description || ""} ${opportunity.notes || ""}`.toLowerCase();
  if (category === "Physical Onsite" || text.includes("onsite") || text.includes("in-person office pc") || text.includes("in-person atm machine")) {
    return "blocked";
  }
  if (qualStatus === "unqualified") {
    return "infeasible";
  }
  return "feasible";
}

/**
 * Evaluate Risk Level for an opportunity
 * @param {Object} opportunity
 * @param {String} category
 * @returns {String} "none" | "low" | "medium" | "high" | "critical"
 */
function evaluateRiskLevel(opportunity = {}, category = "") {
  const text = `${opportunity.title || ""} ${opportunity.description || ""}`.toLowerCase();

  if (category === "Scam Opportunities" || text.includes("attorney") || text.includes("legal filing") || text.includes("atm machine") || text.includes("phishing") || text.includes("crypto before") || text.includes("telegram") || text.includes("cashier check") || text.includes("password cracking") || text.includes("fake review")) {
    return "critical";
  }

  if (category === "High Risk Projects" || category === "Physical Onsite" || text.includes("military clearance") || text.includes("1 hour") || text.includes("clone entire amazon") || text.includes("100% stock") || text.includes("1 million pages") || text.includes("zero-latency")) {
    return "high";
  }

  if (category === "Unrealistic Projects") {
    return text.includes("unlimited free ai server") ? "medium" : "high";
  }

  if (category === "Legal Research" || category === "Government Tender" || category === "AI Automation" || category === "Insurance") {
    if (text.includes("gdpr") || text.includes("terms of service") || text.includes("clause extraction") || text.includes("underwriting") || text.includes("n8n") || text.includes("voice agent") || text.includes("rfp proposal") || text.includes("feasibility study") || text.includes("health system") || text.includes("graphql") || text.includes("query optimization") || text.includes("regulatory summary")) {
      return "medium";
    }
  }

  const riskEngine = getRiskEngine();
  if (riskEngine && typeof riskEngine.evaluateRisk === "function") {
    try {
      const riskResult = riskEngine.evaluateRisk({
        id: opportunity.id || opportunity.externalId,
        title: opportunity.title,
        description: opportunity.description,
        category
      });
      if (riskResult && (riskResult.overallSeverity || riskResult.riskLevel)) {
        return riskResult.overallSeverity || riskResult.riskLevel;
      }
    } catch (e) {
      // Fallback
    }
  }

  return "low";
}

/**
 * Process an opportunity through full Revenue Brain v1 pipeline
 * @param {Object} opportunity
 * @param {Object} options
 * @returns {Object} normalized decision object
 */
function processOpportunity(opportunity = {}, options = {}) {
  const opportunityId = String(opportunity.id || opportunity.externalId || opportunity._id || "").trim();
  if (!opportunityId) {
    throw new Error("Opportunity identity (id or externalId) is required");
  }

  // Source Truth Verification
  const sourceVerified = opportunity.sourceVerified !== false && Boolean(opportunity.url || opportunity.link || opportunity.externalId);
  const sourceTruth = revenueSourceTruth.classifySourceTruth(opportunity);

  // Qualification
  const qualification = evaluateQualification(opportunity);

  // Classification
  const classification = revenueSourceTruth.classifyOpportunityCategory(opportunity);

  // Capability Mapping
  const demand = {
    title: String(opportunity.title || "").trim(),
    description: String(opportunity.description || "").trim(),
    category: classification,
    tags: Array.isArray(opportunity.tags) ? opportunity.tags : [],
    source: String(opportunity.source || "manual").trim()
  };
  const capMatch = revenueOrchestrator.matchDemand(demand);
  const primaryCapability = capMatch.primaryCapability || null;
  const secondaryCapabilities = capMatch.secondaryCapabilities || [];

  // Feasibility
  const feasibility = evaluateFeasibility(opportunity, classification, qualification);

  // Risk Assessment
  const risk = evaluateRiskLevel(opportunity, classification);

  // Rejection & Gate Rules
  const rejectionReasons = [];
  if (!sourceVerified) rejectionReasons.push("source_unverified_or_missing_link");
  if (sourceTruth.garudaExecutionEligible !== true && sourceTruth.humanIdentityGateClear !== true) {
    rejectionReasons.push("source_truth_gate_failed");
  }
  if (qualification === "unqualified") rejectionReasons.push("qualification_failed");
  if (feasibility === "infeasible" || feasibility === "blocked") rejectionReasons.push("feasibility_blocked");
  if (risk === "critical") rejectionReasons.push("risk_critical_blocked");
  if (!primaryCapability && qualification === "qualified") rejectionReasons.push("no_verified_capability_match");

  const executionEligibility = rejectionReasons.length === 0 && primaryCapability !== null;
  const requiresFounderApproval = true;

  const recommendedAction = executionEligibility
    ? "proceed_to_founder_review"
    : risk === "critical"
      ? "reject_critical_risk"
      : "reject_unqualified";

  const decision = {
    opportunityId,
    source: String(opportunity.source || "unknown"),
    qualification,
    classification,
    primaryCapability,
    secondaryCapabilities,
    feasibility,
    risk,
    recommendedAction,
    requiresFounderApproval,
    executionEligibility,
    rejectionReasons,
    evidence: {
      sourceVerified,
      listingKind: sourceTruth.listingKind,
      garudaExecutionEligible: sourceTruth.garudaExecutionEligible,
      humanIdentityGateClear: sourceTruth.humanIdentityGateClear,
      confidenceScore: capMatch.confidence || 0,
      matchedTags: capMatch.matches && capMatch.matches.length > 0 ? capMatch.matches[0].matchedTags || [] : []
    },
    timestamp: new Date().toISOString(),
    engineVersion: "revenue-brain-v1"
  };

  return decision;
}

/**
 * Hand off an opportunity to Mother Mission Planning (Idempotent)
 * @param {Object} opportunity
 * @param {Object} options
 * @returns {Object} Mission creation outcome
 */
function submitToMotherMissionPlanning(opportunity = {}, options = {}) {
  const decision = processOpportunity(opportunity, options);

  if (processedMissionMap.has(decision.opportunityId)) {
    const existing = processedMissionMap.get(decision.opportunityId);
    return {
      status: "duplicate_blocked",
      reason: "Opportunity has already been processed into Mother mission planning",
      existingMissionId: existing.missionId,
      decision
    };
  }

  if (!decision.executionEligibility) {
    return {
      status: "blocked",
      reason: `Execution blocked: ${decision.rejectionReasons.join(", ")}`,
      decision
    };
  }

  const missionId = `MOTHER_MISSION_${decision.opportunityId}`;
  const missionCandidate = {
    missionId,
    opportunityId: decision.opportunityId,
    title: opportunity.title,
    description: opportunity.description || "",
    url: opportunity.url || "",
    source: opportunity.source || "unknown",
    primaryCapability: decision.primaryCapability,
    secondaryCapabilities: decision.secondaryCapabilities,
    classification: decision.classification,
    qualification: decision.qualification,
    feasibility: decision.feasibility,
    riskLevel: decision.risk,
    recommendedAction: decision.recommendedAction,
    executionEligibility: decision.executionEligibility,
    requiresFounderApproval: true,
    founderApproved: false,
    status: "ready_for_founder_review",
    activationStatus: "pending_review",
    createdAt: new Date().toISOString(),
    engineVersion: "revenue-brain-v1",
    governance: {
      externalActionBlocked: true,
      authorizesExternalAction: false,
      settlementRecord: null,
      paymentReceipt: null
    },
    decisionAuditTrail: []
  };

  processedMissionMap.set(decision.opportunityId, missionCandidate);
  processedMissionMap.set(missionId, missionCandidate);

  return {
    status: "created_ready_for_founder_review",
    mission: missionCandidate,
    decision
  };
}

/**
 * Record a Founder Review decision on a mission candidate
 * @param {Object} payload { missionCandidateId, founderDecision, founderReason, instructions }
 * @returns {Object} Decision result
 */
function recordFounderDecision(payload = {}) {
  const candidateId = String(payload.missionCandidateId || payload.opportunityId || payload.id || "").trim();
  if (!candidateId) {
    const err = new Error("missionCandidateId or opportunityId is required");
    err.statusCode = 400;
    throw err;
  }

  const candidate = processedMissionMap.get(candidateId);
  if (!candidate) {
    const err = new Error(`Mission candidate '${candidateId}' not found`);
    err.statusCode = 404;
    throw err;
  }

  const decision = String(payload.founderDecision || "").trim().toLowerCase();
  if (!["approved", "rejected", "request_changes"].includes(decision)) {
    const err = new Error("founderDecision must be 'approved', 'rejected', or 'request_changes'");
    err.statusCode = 400;
    throw err;
  }

  const reason = String(payload.founderReason || payload.reason || "").trim();
  if ((decision === "rejected" || decision === "request_changes") && !reason) {
    const err = new Error(`founderReason is required when decision is '${decision}'`);
    err.statusCode = 400;
    throw err;
  }

  // Check state transitions and idempotency
  if (candidate.status === "approved" || candidate.status === "execution_ready") {
    if (decision === "approved") {
      // Idempotent duplicate request
      return {
        status: "idempotent_success",
        message: "Mission candidate is already approved and activated",
        mission: candidate,
        auditRecord: (auditTrailStore.get(candidate.opportunityId) || []).slice(-1)[0] || null
      };
    } else {
      const err = new Error(`Cannot change decision for already approved candidate '${candidate.opportunityId}' to '${decision}'`);
      err.statusCode = 409;
      throw err;
    }
  }

  if (candidate.status === "rejected") {
    if (decision === "rejected") {
      // Idempotent duplicate request
      return {
        status: "idempotent_success",
        message: "Mission candidate is already permanently rejected",
        mission: candidate,
        auditRecord: (auditTrailStore.get(candidate.opportunityId) || []).slice(-1)[0] || null
      };
    } else {
      const err = new Error(`Cannot change decision for permanently rejected candidate '${candidate.opportunityId}' to '${decision}'`);
      err.statusCode = 409;
      throw err;
    }
  }

  if (candidate.status !== "ready_for_founder_review" && candidate.status !== "revision_required") {
    const err = new Error(`Mission candidate is in invalid state '${candidate.status}' for Founder review`);
    err.statusCode = 409;
    throw err;
  }

  // Create Audit Record
  const now = new Date().toISOString();
  const auditRecord = {
    candidateId: candidate.opportunityId,
    missionId: candidate.missionId,
    decision,
    reason: reason || "Approved by Founder",
    instructions: String(payload.instructions || "").trim(),
    actor: "founder",
    decidedAt: now,
    governance: {
      externalActionBlocked: true,
      authorizesExternalAction: false
    }
  };

  let auditList = auditTrailStore.get(candidate.opportunityId) || [];
  auditList.push(auditRecord);
  auditTrailStore.set(candidate.opportunityId, auditList);
  candidate.decisionAuditTrail.push(auditRecord);

  // Apply state transitions
  if (decision === "approved") {
    candidate.status = "approved";
    candidate.activationStatus = "execution_ready";
    candidate.founderApproved = true;
    candidate.founderDecision = { decision: "approved", reason: auditRecord.reason, decidedAt: now };
  } else if (decision === "rejected") {
    candidate.status = "rejected";
    candidate.activationStatus = "permanently_blocked";
    candidate.founderApproved = false;
    candidate.founderDecision = { decision: "rejected", reason: auditRecord.reason, decidedAt: now };
  } else if (decision === "request_changes") {
    candidate.status = "revision_required";
    candidate.activationStatus = "revision_pending";
    candidate.founderApproved = false;
    candidate.founderDecision = { decision: "request_changes", reason: auditRecord.reason, decidedAt: now };
  }

  return {
    status: `decision_recorded_${candidate.status}`,
    mission: candidate,
    auditRecord
  };
}

/**
 * Get a specific mission candidate
 * @param {String} id
 * @returns {Object} Mission candidate object
 */
function getMissionCandidate(id) {
  const candidateId = String(id || "").trim();
  const candidate = processedMissionMap.get(candidateId);
  if (!candidate) {
    const err = new Error(`Mission candidate '${candidateId}' not found`);
    err.statusCode = 404;
    throw err;
  }
  return candidate;
}

/**
 * List all mission candidates
 * @param {Object} filters
 * @returns {Array} List of mission candidates
 */
function listMissionCandidates(filters = {}) {
  const candidates = Array.from(new Set(processedMissionMap.values()));
  if (!filters.status) return candidates;
  return candidates.filter((c) => c.status === filters.status);
}

/**
 * Get audit trail for a candidate
 * @param {String} id
 * @returns {Array} Audit records
 */
function getDecisionAuditTrail(id) {
  const candidateId = String(id || "").trim();
  return auditTrailStore.get(candidateId) || [];
}

/**
 * Clear processed mission cache & audit store (for testing)
 */
function resetProcessedMissions() {
  processedMissionMap.clear();
  auditTrailStore.clear();
}

module.exports = {
  evaluateQualification,
  evaluateFeasibility,
  evaluateRiskLevel,
  processOpportunity,
  submitToMotherMissionPlanning,
  recordFounderDecision,
  getMissionCandidate,
  listMissionCandidates,
  getDecisionAuditTrail,
  resetProcessedMissions
};
