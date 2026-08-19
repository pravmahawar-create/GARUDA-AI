const mongoose = require("mongoose");
const { DiscoveryCandidate, resolveEarningMode, resolveContractPermission } = require("../models/DiscoveryCandidate");
const { PermissionReview, REVIEW_DECISIONS, EVIDENCE_TYPES, FOUNDER_ATTESTATION_REQUIRED } = require("../models/PermissionReview");
const { founderApprovalGranted } = require("./revenueConversionService");
const { candidatePrioritySortValue } = require("./opportunityDiscoveryService");

const MAX_EVIDENCE_SOURCE = 500;
const MAX_EVIDENCE_SUMMARY = 2000;
const MAX_NOTE = 2000;
const MAX_BATCH_SIZE = 50;

function httpError(message, statusCode) {
  return Object.assign(new Error(message), { statusCode });
}

// ---------------------------------------------------------------------------
// Pure review-payload validation (testable without a database).
// ---------------------------------------------------------------------------
function validateReviewPayload(payload = {}) {
  const decision = String(payload.decision || "").trim();
  if (!REVIEW_DECISIONS.includes(decision)) {
    throw httpError(`decision must be one of: ${REVIEW_DECISIONS.join(", ")}`, 400);
  }
  const evidenceType = String(payload.evidenceType || "UNKNOWN").trim();
  if (!EVIDENCE_TYPES.includes(evidenceType)) {
    throw httpError(`evidenceType must be one of: ${EVIDENCE_TYPES.join(", ")}`, 400);
  }
  const evidenceSource = String(payload.evidenceSource || "").trim().slice(0, MAX_EVIDENCE_SOURCE);
  const evidenceSummary = String(payload.evidenceSummary || "").trim().slice(0, MAX_EVIDENCE_SUMMARY);
  const founderAttestation = String(payload.founderAttestation || "").trim();
  const note = String(payload.note || "").trim().slice(0, MAX_NOTE);

  if (decision === "PERMISSION_CONFIRMED") {
    // Confirmation requires concrete permission evidence — never fabricated,
    // never UNKNOWN, plus the exact Founder attestation.
    if (evidenceType === "UNKNOWN") {
      throw httpError("PERMISSION_CONFIRMED requires concrete evidence (CLIENT_EMPLOYER_EXPLICIT_PERMISSION, PLATFORM_JOB_RULE_CHECK, CONTRACT_ENGAGEMENT_TERMS, or FOUNDER_ATTESTATION)", 400);
    }
    if (!evidenceSource) throw httpError("PERMISSION_CONFIRMED requires an evidence source", 400);
    if (!evidenceSummary) throw httpError("PERMISSION_CONFIRMED requires an evidence summary", 400);
    if (founderAttestation !== FOUNDER_ATTESTATION_REQUIRED) {
      throw httpError("PERMISSION_CONFIRMED requires the Founder attestation text", 400);
    }
  }
  if (decision === "PERMISSION_PROHIBITED") {
    if (!evidenceSource) throw httpError("PERMISSION_PROHIBITED requires an evidence source (the explicit prohibition)", 400);
    if (!evidenceSummary) throw httpError("PERMISSION_PROHIBITED requires an evidence summary describing the prohibition", 400);
  }

  return { decision, evidenceType, evidenceSource, evidenceSummary, founderAttestation, note };
}

// ---------------------------------------------------------------------------
// Pure review state machine (testable without a database).
// Returns { previousState, newState }.
// Allowed transitions (Amendment 9 + founder review):
//   PERMISSION_UNKNOWN -> FOUNDER_ENGAGED_GARUDA_ASSISTED (review + evidence
//     + PERMITTED + otherwise eligible)   [PERMISSION_CONFIRMED]
//   PERMISSION_UNKNOWN -> NOT_ELIGIBLE    [PERMISSION_PROHIBITED / DISMISS]
//   PERMISSION_UNKNOWN -> PERMISSION_UNKNOWN [NEEDS_INFORMATION]
// No other transition is permitted. Founder approval cannot override PROHIBITED.
// ---------------------------------------------------------------------------
function resolveReviewTransition({ candidate = {}, payload = {}, founderApproved = false } = {}) {
  const clean = validateReviewPayload(payload);
  if (!founderApprovalGranted(founderApproved)) {
    throw httpError("Founder approval is required for permission review decisions", 403);
  }
  const currentEarningMode = resolveEarningMode(candidate);
  const currentContractPermission = resolveContractPermission(candidate);
  if (currentEarningMode !== "PERMISSION_UNKNOWN") {
    throw httpError(`Candidate is not awaiting permission review (earningMode is already ${currentEarningMode})`, 409);
  }
  if (currentContractPermission === "PROHIBITED") {
    throw httpError("Candidate contract/platform permission explicitly prohibits GARUDA-assisted engagement — Founder approval cannot override it", 409);
  }

  const previousState = {
    earningMode: currentEarningMode,
    contractPermission: currentContractPermission,
    opportunityChannel: String(candidate.opportunityChannel || ""),
    status: String(candidate.status || "ranked")
  };

  let newState;
  if (clean.decision === "PERMISSION_CONFIRMED") {
    const matches = (candidate.capabilityAssessment && candidate.capabilityAssessment.matches) || [];
    if (!Array.isArray(matches) || matches.length === 0) {
      throw httpError("PERMISSION_CONFIRMED requires a verified capability match for GARUDA-assisted execution", 422);
    }
    newState = {
      earningMode: "FOUNDER_ENGAGED_GARUDA_ASSISTED",
      contractPermission: "PERMITTED",
      opportunityChannel: "founder_garuda",
      status: previousState.status
    };
  } else if (clean.decision === "PERMISSION_PROHIBITED") {
    newState = {
      earningMode: "NOT_ELIGIBLE",
      contractPermission: "PROHIBITED",
      opportunityChannel: previousState.opportunityChannel,
      status: previousState.status
    };
  } else if (clean.decision === "DISMISS") {
    // Reuse the existing dismissal mechanism (status field + decision subdoc).
    newState = {
      earningMode: "NOT_ELIGIBLE",
      contractPermission: previousState.contractPermission,
      opportunityChannel: previousState.opportunityChannel,
      status: "dismissed"
    };
  } else {
    // NEEDS_INFORMATION: no state change; candidate stays in the queue.
    newState = { ...previousState };
  }

  return { previousState, newState };
}

function candidateResolvedState(candidate) {
  return {
    earningMode: resolveEarningMode(candidate),
    contractPermission: resolveContractPermission(candidate),
    opportunityChannel: String(candidate.opportunityChannel || ""),
    status: String(candidate.status || "ranked")
  };
}

// ---------------------------------------------------------------------------
// Review queue read models.
// ---------------------------------------------------------------------------
async function listPendingReviews(filters = {}) {
  const query = {};
  if (filters.missionId) query.missionId = filters.missionId;
  if (filters.source) query.source = String(filters.source).trim();
  const items = await DiscoveryCandidate.find(query);
  const reviews = await PermissionReview.find().sort({ decidedAt: -1 }).lean();
  const latestByCandidate = {};
  for (const review of reviews) {
    const key = String(review.candidateId);
    if (!latestByCandidate[key]) latestByCandidate[key] = review;
  }
  const minScore = Number(filters.minScore);
  const hasMinScore = Number.isFinite(minScore) && minScore > 0;
  const maxResults = Number(filters.maxResults);
  const hasMaxResults = Number.isFinite(maxResults) && maxResults > 0;
  const pending = items
    .filter((c) => !query.source || String(c.source || "") === query.source)
    .filter((c) => resolveEarningMode(c) === "PERMISSION_UNKNOWN")
    .filter((c) => !hasMinScore || (typeof c.score === "number" ? c.score : 0) >= minScore)
    .sort((a, b) => candidatePrioritySortValue(b) - candidatePrioritySortValue(a))
    .slice(0, hasMaxResults ? Math.floor(maxResults) : undefined);
  return pending.map((c) => {
    const json = c.toJSON();
    json.resolvedState = candidateResolvedState(c);
    json.latestReview = latestByCandidate[String(c._id)] || null;
    json.hasCapabilityMatch = Array.isArray(c.capabilityAssessment && c.capabilityAssessment.matches) && c.capabilityAssessment.matches.length > 0;
    return json;
  });
}

async function getReview(candidateId) {
  if (!mongoose.Types.ObjectId.isValid(String(candidateId || ""))) throw httpError("Invalid candidate id", 400);
  const candidate = await DiscoveryCandidate.findById(candidateId);
  if (!candidate) throw httpError("Discovery candidate not found", 404);
  const history = await PermissionReview.find({ candidateId: candidate._id }).sort({ decidedAt: -1 });
  const json = candidate.toJSON();
  json.resolvedState = candidateResolvedState(candidate);
  json.hasCapabilityMatch = Array.isArray(candidate.capabilityAssessment && candidate.capabilityAssessment.matches) && candidate.capabilityAssessment.matches.length > 0;
  json.history = history.map((h) => h.toJSON());
  return json;
}

async function listHistory(candidateId) {
  if (!mongoose.Types.ObjectId.isValid(String(candidateId || ""))) throw httpError("Invalid candidate id", 400);
  const candidate = await DiscoveryCandidate.findById(candidateId);
  if (!candidate) throw httpError("Discovery candidate not found", 404);
  const history = await PermissionReview.find({ candidateId: candidate._id }).sort({ decidedAt: -1 });
  return history.map((h) => h.toJSON());
}

async function queueStats() {
  const items = await DiscoveryCandidate.find();
  const counts = {
    DIRECT_GARUDA: 0,
    FOUNDER_ENGAGED_GARUDA_ASSISTED: 0,
    PERMISSION_UNKNOWN: 0,
    NOT_ELIGIBLE: 0
  };
  let prohibited = 0;
  for (const c of items) {
    const mode = resolveEarningMode(c);
    counts[mode] = (counts[mode] || 0) + 1;
    if (resolveContractPermission(c) === "PROHIBITED") prohibited += 1;
  }
  const reviews = await PermissionReview.find();
  const decisionCounts = {
    PERMISSION_CONFIRMED: 0,
    PERMISSION_PROHIBITED: 0,
    DISMISS: 0,
    NEEDS_INFORMATION: 0
  };
  const reviewedSet = new Set();
  for (const r of reviews) {
    decisionCounts[r.decision] = (decisionCounts[r.decision] || 0) + 1;
    reviewedSet.add(String(r.candidateId));
  }
  return {
    counts,
    prohibited,
    reviewDecisions: decisionCounts,
    reviewedCandidates: reviewedSet.size,
    totalCandidates: items.length
  };
}

// ---------------------------------------------------------------------------
// Record a Founder review decision. NEVER executes an external action and
// NEVER writes more than the single candidate under review.
// ---------------------------------------------------------------------------
async function recordDecision(candidateId, payload = {}, context = {}) {
  const clean = validateReviewPayload(payload);
  if (!mongoose.Types.ObjectId.isValid(String(candidateId || ""))) throw httpError("Invalid candidate id", 400);
  const candidate = await DiscoveryCandidate.findById(candidateId);
  if (!candidate) throw httpError("Discovery candidate not found", 404);

  const { previousState, newState } = resolveReviewTransition({
    candidate,
    payload: clean,
    founderApproved: context.founderApproved
  });

  const changed = {};
  if (newState.earningMode !== previousState.earningMode) changed.earningMode = newState.earningMode;
  if (newState.contractPermission !== previousState.contractPermission) changed.contractPermission = newState.contractPermission;
  if (newState.opportunityChannel !== previousState.opportunityChannel) changed.opportunityChannel = newState.opportunityChannel;
  if (newState.status !== previousState.status) changed.status = newState.status;
  // DISMISS reuses the existing decision subdoc so the pre-existing dismissal
  // mechanism (status + decision trace) stays coherent.
  if (clean.decision === "DISMISS") {
    changed.decision = {
      actor: context.actor || "founder",
      note: clean.note || "Dismissed during Founder permission review",
      decidedAt: new Date()
    };
  }
  // Single-document update. NEVER updateMany; a decision changes only the
  // specific candidate under review.
  if (Object.keys(changed).length > 0) {
    await DiscoveryCandidate.updateOne({ _id: candidate._id }, { $set: changed });
  }

  const review = await PermissionReview.create({
    candidateId: candidate._id,
    externalId: candidate.externalId,
    title: candidate.title,
    company: candidate.company || "",
    source: candidate.source || "",
    url: candidate.url || "",
    decision: clean.decision,
    evidenceType: clean.evidenceType,
    evidenceSource: clean.evidenceSource,
    evidenceSummary: clean.evidenceSummary,
    founderAttestation: clean.founderAttestation || "",
    note: clean.note,
    reviewer: context.actor || "founder",
    previousState,
    newState,
    decidedAt: new Date()
  });

  const updated = await DiscoveryCandidate.findById(candidate._id);
  return { review: review.toJSON(), candidate: updated ? updated.toJSON() : null };
}

// ---------------------------------------------------------------------------
// Batch Founder review. One shared decision + one shared evidence/attestation
// is applied to up to MAX_BATCH_SIZE candidates. Every candidate still goes
// through the governed per-candidate state machine (resolveReviewTransition)
// and receives its OWN append-only PermissionReview document. There is NEVER
// a blanket updateMany — each candidate is individually validated and updated.
// A failure on one candidate is recorded per-candidate and never aborts the
// rest of the batch. Safety cap 50 per batch (Amendment-9 style founder review).
// ---------------------------------------------------------------------------
async function recordBatchDecisions(candidateIds = [], payload = {}, context = {}) {
  const ids = Array.from(new Set(
    (Array.isArray(candidateIds) ? candidateIds : [])
      .map((id) => String(id || "").trim())
      .filter(Boolean)
  ));
  if (ids.length === 0) throw httpError("batch requires at least one candidate id", 400);
  if (ids.length > MAX_BATCH_SIZE) {
    throw httpError(`batch size ${ids.length} exceeds the safety cap of ${MAX_BATCH_SIZE}`, 422);
  }
  for (const id of ids) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw httpError(`invalid candidate id: ${id}`, 400);
  }
  if (!founderApprovalGranted(context.founderApproved)) {
    throw httpError("Founder approval is required for permission review decisions", 403);
  }

  const clean = validateReviewPayload(payload);
  if (clean.decision === "PERMISSION_CONFIRMED" && clean.evidenceType !== "FOUNDER_ATTESTATION") {
    throw httpError("Batch PERMISSION_CONFIRMED requires shared evidence type FOUNDER_ATTESTATION", 422);
  }

  const results = [];
  for (const id of ids) {
    try {
      const { review, candidate } = await recordDecision(id, clean, context);
      results.push({
        candidateId: id,
        title: candidate && candidate.title ? candidate.title : null,
        decision: clean.decision,
        ok: true,
        reviewId: review && review.id ? review.id : null
      });
    } catch (error) {
      results.push({
        candidateId: id,
        decision: clean.decision,
        ok: false,
        error: (error && error.message) ? error.message : String(error)
      });
    }
  }

  const summary = {
    requested: ids.length,
    confirmed: 0,
    prohibited: 0,
    dismissed: 0,
    needsInformation: 0,
    failed: 0
  };
  for (const r of results) {
    if (!r.ok) {
      summary.failed += 1;
      continue;
    }
    if (r.decision === "PERMISSION_CONFIRMED") summary.confirmed += 1;
    else if (r.decision === "PERMISSION_PROHIBITED") summary.prohibited += 1;
    else if (r.decision === "DISMISS") summary.dismissed += 1;
    else summary.needsInformation += 1;
  }

  return { summary, results };
}

module.exports = {
  REVIEW_DECISIONS,
  EVIDENCE_TYPES,
  FOUNDER_ATTESTATION_REQUIRED,
  validateReviewPayload,
  resolveReviewTransition,
  candidateResolvedState,
  listPendingReviews,
  getReview,
  listHistory,
  queueStats,
  recordDecision,
  recordBatchDecisions,
  MAX_BATCH_SIZE
};