const crypto = require("crypto");

const PROPOSAL_TYPES = ["application", "quotation"];
const RESPONSE_TYPES = ["client_message", "revision_request", "rejected", "award_offer"];
const SUBMISSION_CHANNELS = ["platform", "email", "client_portal", "authorized_connector"];

function fail(message, statusCode = 400) {
  throw Object.assign(new Error(message), { statusCode });
}

function hash(value) {
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function text(value, name, max = 1000) {
  const result = String(value || "").trim();
  if (!result) fail(`${name} is required`);
  if (result.length > max) fail(`${name} exceeds ${max} characters`);
  return result;
}

function list(value, name, maxItems = 20) {
  if (!Array.isArray(value) || value.length < 1 || value.length > maxItems) fail(`${name} must contain 1 to ${maxItems} items`);
  const result = value.map((item, index) => text(item, `${name}[${index}]`, 500));
  if (new Set(result).size !== result.length) fail(`${name} must not contain duplicates`);
  return result;
}

function isoPast(value, name, now = new Date()) {
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) fail(`${name} must be a valid date`);
  if (parsed.getTime() > now.getTime()) fail(`${name} cannot be in the future`);
  return parsed.toISOString();
}

function money(input = {}) {
  const amount = Number(input.amount);
  const currency = String(input.currency || "").trim().toUpperCase();
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000_000) fail("commercialOffer.amount must be a positive finite amount");
  if (!/^[A-Z]{3}$/.test(currency)) fail("commercialOffer.currency must be a three-letter currency code");
  return { amount, currency };
}

function candidateContext(candidateInput, options = {}) {
  const { validateApprovedCandidate } = require("./revenueExecutionMissionService");
  const { candidate } = validateApprovedCandidate(candidateInput, options);
  const candidateId = String(candidate._id || candidate.id || "");
  const incomeGoalId = String(candidate.missionId || "");
  const match = candidate.capabilityAssessment?.matches?.[0];
  if (!candidateId || !incomeGoalId || !match?.capabilityId) fail("Candidate and verified capability identities are required", 409);
  return {
    candidate,
    candidateId,
    incomeGoalId,
    match,
    listing: {
      title: text(candidate.title, "candidate.title", 300),
      company: String(candidate.company || "").trim(),
      source: text(candidate.source, "candidate.source", 120),
      sourceAttribution: text(candidate.sourceAttribution || candidate.source, "candidate.sourceAttribution", 160),
      originalUrl: text(candidate.url, "candidate.url", 1000),
      classification: "public_listing_not_contract"
    }
  };
}

function sourceRulesFor(candidate) {
  return {
    source: String(candidate.source || ""),
    discoveryUse: "public_lead_research_only",
    applicationMode: "manual_handoff_only",
    automatedSubmissionAllowed: false,
    platformTermsReviewRequired: true,
    authorizedEligibleAccountRequired: true,
    credentialsStoredByGaruda: false,
    publicListingConfirmsContract: false
  };
}

function defaultDeliverables(match) {
  const engineering = String(match.universe || "").toLowerCase() === "engineering";
  return engineering
    ? ["Bounded implementation artifact", "Automated validation evidence", "Client delivery and acceptance package"]
    : ["Bounded client deliverable", "Quality-review evidence", "Client delivery and acceptance package"];
}

function buildProposal(candidateInput, input = {}, now = new Date(), options = {}) {
  const context = candidateContext(candidateInput, options);
  const proposalType = String(input.proposalType || "application").trim().toLowerCase();
  if (!PROPOSAL_TYPES.includes(proposalType)) fail(`proposalType must be one of: ${PROPOSAL_TYPES.join(", ")}`);
  const deliverables = Array.isArray(input.deliverables) && input.deliverables.length
    ? list(input.deliverables, "deliverables")
    : defaultDeliverables(context.match);
  const acceptanceCriteria = Array.isArray(input.acceptanceCriteria) && input.acceptanceCriteria.length
    ? list(input.acceptanceCriteria, "acceptanceCriteria")
    : ["Client confirms the bounded scope before work starts", "Every agreed deliverable passes its documented quality checks"];
  const commercialOffer = proposalType === "quotation"
    ? { ...money(input.commercialOffer), deliveryDays: Number(input.commercialOffer?.deliveryDays) }
    : { status: "client_confirmation_required" };
  if (proposalType === "quotation" && (!Number.isInteger(commercialOffer.deliveryDays) || commercialOffer.deliveryDays < 1 || commercialOffer.deliveryDays > 365)) {
    fail("commercialOffer.deliveryDays must be an integer from 1 to 365");
  }
  const preparedAt = now.toISOString();
  const payload = {
    candidateId: context.candidateId,
    proposalType,
    title: `GARUDA proposal for ${context.listing.title}`,
    summary: String(input.summary || "").trim() || `GARUDA can prepare a bounded ${context.match.name || context.match.capabilityId} work package for this opportunity, with validation evidence and a governed delivery handoff.`,
    capability: {
      id: context.match.capabilityId,
      name: context.match.name || context.match.capabilityId,
      universe: context.match.universe || "Engineering",
      matchScore: Number(context.match.score) || 0
    },
    deliverables,
    acceptanceCriteria,
    commercialOffer,
    requestedClientConfirmation: ["Exact brief and required inputs", "Price and currency", "Deadline", "Acceptance criteria", "Authority to start work"],
    truthfulClaims: ["No human identity is impersonated", "No prior-client or experience claim is invented", "Public listing is not represented as a contract"],
    preparedAt,
    governance: {
      internalDraftOnly: true,
      founderApprovalRequiredBeforeHandoff: true,
      externalSubmissionPerformed: false,
      contractConfirmed: false,
      paidServiceUsed: false
    }
  };
  return {
    candidateId: context.candidateId,
    incomeGoalId: context.incomeGoalId,
    status: "proposal_drafted",
    listing: context.listing,
    capability: payload.capability,
    sourceRules: sourceRulesFor(context.candidate),
    proposal: { ...payload, proposalHash: hash(payload) },
    governance: {
      listingIsLeadOnly: true,
      noFakeOrDemoRuntimeData: true,
      noAutomaticApplication: true,
      noAutomaticContractAcceptance: true,
      separateFounderApprovalForSubmissionRequired: true,
      verifiedAwardRequiredBeforeMission: true
    }
  };
}

function assertHash(value, name) {
  if (!/^[a-f0-9]{64}$/.test(String(value || ""))) fail(`${name} must be a SHA-256 hash`);
  return String(value);
}

function buildApprovedHandoff(caseInput, input = {}, now = new Date()) {
  const record = caseInput?.toObject ? caseInput.toObject() : caseInput || {};
  if (record.status !== "proposal_drafted") fail("Only a proposal draft can be approved for handoff", 409);
  if (assertHash(input.proposalHash, "proposalHash") !== record.proposal?.proposalHash) fail("Founder decision is not bound to the current proposal", 409);
  for (const gate of ["proposalReviewed", "sourceRulesReviewed", "authorizedAccountConfirmed", "platformEligibilityConfirmed", "noMisrepresentationConfirmed"]) {
    if (input[gate] !== true) fail(`${gate} must be explicitly confirmed`, 409);
  }
  const approvedAt = now.toISOString();
  const approvalPayload = {
    candidateId: String(record.candidateId),
    proposalHash: record.proposal.proposalHash,
    decision: "approved_for_handoff",
    approvedBy: "founder",
    approvedAt,
    confirmations: {
      proposalReviewed: true,
      sourceRulesReviewed: true,
      authorizedAccountConfirmed: true,
      platformEligibilityConfirmed: true,
      noMisrepresentationConfirmed: true
    }
  };
  const founderApproval = { ...approvalPayload, decisionHash: hash(approvalPayload) };
  const handoffPayload = {
    candidateId: String(record.candidateId),
    proposalHash: record.proposal.proposalHash,
    decisionHash: founderApproval.decisionHash,
    destination: text(input.destination, "destination", 1000),
    preparedAt: approvedAt,
    proposal: record.proposal,
    sourceRules: record.sourceRules,
    governance: {
      manualSubmissionRequired: true,
      automaticSubmissionAllowed: false,
      externalSubmissionPerformed: false,
      contractConfirmed: false,
      exactFounderDecisionBound: true
    }
  };
  return { founderApproval, handoff: { ...handoffPayload, handoffHash: hash(handoffPayload) } };
}

function buildSubmissionReceipt(caseInput, input = {}, now = new Date()) {
  const record = caseInput?.toObject ? caseInput.toObject() : caseInput || {};
  if (record.status !== "handoff_ready" || !record.handoff?.handoffHash) fail("An approved handoff is required before recording submission", 409);
  if (assertHash(input.handoffHash, "handoffHash") !== record.handoff.handoffHash) fail("Submission is not bound to the approved handoff", 409);
  for (const gate of ["externalSubmissionActuallyCompleted", "sameApprovedPackage", "platformRulesFollowed", "authorizedAccountUsed", "noAutomatedSubmission"]) {
    if (input[gate] !== true) fail(`${gate} must be explicitly confirmed`, 409);
  }
  const channel = text(input.channel, "channel", 80).toLowerCase();
  if (!SUBMISSION_CHANNELS.includes(channel)) fail(`channel must be one of: ${SUBMISSION_CHANNELS.join(", ")}`);
  const payload = {
    candidateId: String(record.candidateId),
    handoffHash: record.handoff.handoffHash,
    channel,
    provider: text(input.provider, "provider", 160),
    reference: text(input.reference, "reference", 500),
    evidence: text(input.evidence, "evidence", 1500),
    submittedAt: isoPast(input.occurredAt, "occurredAt", now),
    recordedAt: now.toISOString(),
    recordedBy: "founder",
    governance: {
      actualExternalSubmissionRecorded: true,
      exactApprovedPackageUsed: true,
      platformRulesFollowed: true,
      authorizedEligibleAccountUsed: true,
      automatedSubmissionPerformed: false,
      contractConfirmed: false
    }
  };
  return { ...payload, receiptHash: hash(payload) };
}

function buildClientResponse(caseInput, input = {}, now = new Date()) {
  const record = caseInput?.toObject ? caseInput.toObject() : caseInput || {};
  if (!["submitted", "response_received"].includes(record.status) || !record.submissionReceipt?.receiptHash) fail("A recorded real submission is required before client response", 409);
  const responseType = text(input.responseType, "responseType", 80).toLowerCase();
  if (!RESPONSE_TYPES.includes(responseType)) fail(`responseType must be one of: ${RESPONSE_TYPES.join(", ")}`);
  for (const gate of ["genuineClientResponse", "evidenceReviewedByFounder", "responseMatchesSubmission"]) {
    if (input[gate] !== true) fail(`${gate} must be explicitly confirmed`, 409);
  }
  const payload = {
    candidateId: String(record.candidateId),
    submissionReceiptHash: record.submissionReceipt.receiptHash,
    responseType,
    counterparty: text(input.counterparty, "counterparty", 200),
    reference: text(input.reference, "reference", 500),
    evidence: text(input.evidence, "evidence", 2000),
    occurredAt: isoPast(input.occurredAt, "occurredAt", now),
    recordedAt: now.toISOString(),
    governance: {
      genuineClientResponseRecorded: true,
      founderReviewedEvidence: true,
      listingStillNotContract: responseType !== "award_offer",
      awardOfferStillRequiresFullTermsVerification: responseType === "award_offer"
    }
  };
  return { ...payload, responseHash: hash(payload) };
}

function buildAuditEvent(input = {}, now = new Date()) {
  const payload = {
    acquisitionCaseId: text(input.acquisitionCaseId, "acquisitionCaseId", 80),
    candidateId: text(input.candidateId, "candidateId", 80),
    sequence: Number(input.sequence),
    eventType: text(input.eventType, "eventType", 80),
    actor: ["garuda", "founder", "client"].includes(input.actor) ? input.actor : "garuda",
    details: input.details || {},
    previousEventHash: input.previousEventHash || null,
    occurredAt: now.toISOString()
  };
  if (!Number.isInteger(payload.sequence) || payload.sequence < 1) fail("Audit sequence must be a positive integer");
  return { ...payload, eventHash: hash(payload) };
}

async function requireCandidate(candidateId) {
  const mongoose = require("mongoose");
  const { DiscoveryCandidate } = require("../models/DiscoveryCandidate");
  if (!mongoose.Types.ObjectId.isValid(String(candidateId || ""))) fail("Invalid candidate id");
  const candidate = await DiscoveryCandidate.findById(candidateId);
  if (!candidate) fail("Discovery candidate not found", 404);
  return candidate;
}

async function requireCase(candidateId) {
  const { RevenueAcquisitionCase } = require("../models/RevenueAcquisitionCase");
  const record = await RevenueAcquisitionCase.findOne({ candidateId });
  if (!record) fail("Acquisition case not found", 404);
  return record;
}

async function appendAudit(record, eventType, actor, details, now = new Date()) {
  const { RevenueAcquisitionEvent } = require("../models/RevenueAcquisitionEvent");
  const previous = await RevenueAcquisitionEvent.findOne({ acquisitionCaseId: record._id }).sort({ sequence: -1 });
  const event = buildAuditEvent({
    acquisitionCaseId: String(record._id),
    candidateId: String(record.candidateId),
    sequence: previous ? previous.sequence + 1 : 1,
    eventType,
    actor,
    details,
    previousEventHash: previous?.eventHash || null
  }, now);
  const stored = await RevenueAcquisitionEvent.create(event);
  record.lastAuditHash = event.eventHash;
  await record.save();
  return stored.toJSON();
}

async function draftProposal(candidateId, input = {}, context = {}) {
  const { RevenueAcquisitionCase } = require("../models/RevenueAcquisitionCase");
  const candidate = await requireCandidate(candidateId);
  const preview = buildProposal(candidate, input, new Date(), { rootDir: context.rootDir });
  let record = await RevenueAcquisitionCase.findOne({ candidateId: candidate._id });
  if (record && !["proposal_drafted", "changes_requested"].includes(record.status)) fail("Submitted acquisition evidence cannot be replaced by a new draft", 409);
  const changed = record?.proposal?.proposalHash !== preview.proposal.proposalHash;
  if (!record) record = await RevenueAcquisitionCase.create(preview);
  else {
    Object.assign(record, preview);
    record.founderApproval = null;
    record.handoff = null;
    record.submissionReceipt = null;
    await record.save();
  }
  if (changed) await appendAudit(record, "proposal_drafted", "garuda", { proposalHash: preview.proposal.proposalHash, proposalType: preview.proposal.proposalType, externalSubmissionPerformed: false });
  return getByCandidate(candidateId);
}

async function approveHandoff(candidateId, input = {}, context = {}) {
  const { founderApprovalGranted } = require("./revenueConversionService");
  if (!founderApprovalGranted(context.founderApproved)) fail("Founder approval is required for this exact proposal handoff", 403);
  const record = await requireCase(candidateId);
  const result = buildApprovedHandoff(record, input);
  record.founderApproval = result.founderApproval;
  record.handoff = result.handoff;
  record.status = "handoff_ready";
  await record.save();
  await appendAudit(record, "founder_handoff_approved", "founder", { proposalHash: record.proposal.proposalHash, decisionHash: result.founderApproval.decisionHash, handoffHash: result.handoff.handoffHash, destination: result.handoff.destination, externalSubmissionPerformed: false });
  return getByCandidate(candidateId);
}

async function recordSubmission(candidateId, input = {}, context = {}) {
  const { founderApprovalGranted } = require("./revenueConversionService");
  if (!founderApprovalGranted(context.founderApproved)) fail("Founder verification is required to record real submission", 403);
  const record = await requireCase(candidateId);
  const receipt = buildSubmissionReceipt(record, input);
  record.submissionReceipt = receipt;
  record.status = "submitted";
  await record.save();
  await appendAudit(record, "submission_recorded", "founder", { handoffHash: receipt.handoffHash, receiptHash: receipt.receiptHash, provider: receipt.provider, reference: receipt.reference, automatedSubmissionPerformed: false });
  return getByCandidate(candidateId);
}

async function recordResponse(candidateId, input = {}, context = {}) {
  const { founderApprovalGranted } = require("./revenueConversionService");
  if (!founderApprovalGranted(context.founderApproved)) fail("Founder verification is required to record client response", 403);
  const record = await requireCase(candidateId);
  const response = buildClientResponse(record, input);
  record.latestResponse = response;
  record.status = response.responseType === "rejected" ? "closed_no_award" : response.responseType === "revision_request" ? "changes_requested" : "response_received";
  await record.save();
  await appendAudit(record, response.responseType === "rejected" ? "no_award_closed" : "client_response_recorded", response.responseType === "rejected" ? "founder" : "client", { responseHash: response.responseHash, responseType: response.responseType, reference: response.reference, contractConfirmed: false });
  return getByCandidate(candidateId);
}

async function verifyAwardAndCreateMission(candidateId, input = {}, context = {}) {
  const { founderApprovalGranted } = require("./revenueConversionService");
  if (!founderApprovalGranted(context.founderApproved)) fail("Founder approval is required to verify the award and create a mission", 403);
  const record = await requireCase(candidateId);
  if (record.status !== "response_received" || record.latestResponse?.responseType !== "award_offer" || !record.latestResponse?.responseHash) {
    fail("A genuine recorded client award response is required before mission creation", 409);
  }
  const acquisitionEvidence = {
    acquisitionCaseId: String(record._id),
    proposalHash: record.proposal.proposalHash,
    decisionHash: record.founderApproval?.decisionHash,
    handoffHash: record.handoff?.handoffHash,
    submissionReceiptHash: record.submissionReceipt?.receiptHash,
    clientResponseHash: record.latestResponse.responseHash
  };
  for (const [name, value] of Object.entries(acquisitionEvidence)) {
    if (name !== "acquisitionCaseId") assertHash(value, name);
  }
  const { verifyAndCreateMission } = require("./revenueWorkIntakeService");
  const result = await verifyAndCreateMission(candidateId, input, { ...context, acquisitionEvidence });
  record.workIntakeId = result.intake.id;
  record.executionMissionId = result.mission.id;
  record.status = "mission_created";
  await record.save();
  await appendAudit(record, "award_verified", "founder", { responseHash: record.latestResponse.responseHash, workIntakeTruthHash: result.intake.truthHash, workIntakeId: result.intake.id });
  await appendAudit(record, "mission_created", "garuda", { missionId: result.mission.id, missionHash: result.mission.missionHash, workIntakeTruthHash: result.intake.truthHash });
  return { acquisition: await getByCandidate(candidateId), ...result };
}

async function getByCandidate(candidateId) {
  const { RevenueAcquisitionCase } = require("../models/RevenueAcquisitionCase");
  const { RevenueAcquisitionEvent } = require("../models/RevenueAcquisitionEvent");
  const record = await RevenueAcquisitionCase.findOne({ candidateId });
  if (!record) return null;
  const events = await RevenueAcquisitionEvent.find({ acquisitionCaseId: record._id }).sort({ sequence: 1 });
  return { ...record.toJSON(), auditTrail: events.map((event) => event.toJSON()) };
}

async function listCases(filters = {}) {
  const { RevenueAcquisitionCase } = require("../models/RevenueAcquisitionCase");
  const { RevenueAcquisitionEvent } = require("../models/RevenueAcquisitionEvent");
  const query = {};
  if (filters.status) query.status = filters.status;
  const limit = Math.min(100, Math.max(1, Number(filters.limit) || 50));
  const records = await RevenueAcquisitionCase.find(query).sort({ updatedAt: -1 }).limit(limit);
  const events = await RevenueAcquisitionEvent.find({ acquisitionCaseId: { $in: records.map((record) => record._id) } }).sort({ sequence: 1 });
  const byCase = new Map();
  for (const event of events) {
    const key = String(event.acquisitionCaseId);
    byCase.set(key, [...(byCase.get(key) || []), event.toJSON()]);
  }
  return records.map((record) => ({ ...record.toJSON(), auditTrail: byCase.get(String(record._id)) || [] }));
}

module.exports = {
  PROPOSAL_TYPES,
  RESPONSE_TYPES,
  SUBMISSION_CHANNELS,
  approveHandoff,
  buildApprovedHandoff,
  buildAuditEvent,
  buildClientResponse,
  buildProposal,
  buildSubmissionReceipt,
  draftProposal,
  getByCandidate,
  hash,
  listCases,
  recordResponse,
  recordSubmission,
  verifyAwardAndCreateMission
};
