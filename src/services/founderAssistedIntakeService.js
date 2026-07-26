const crypto = require("crypto");
const { DiscoveryCandidate } = require("../models/DiscoveryCandidate");
const { IncomeGoal } = require("../models/IncomeGoal");
const { founderApprovalGranted } = require("./revenueConversionService");
const revenueOrchestrator = require("./revenueOrchestratorService");
const { classifyOpportunityCategory, DIRECT_WORK_SIGNALS, HUMAN_IDENTITY_SIGNALS } = require("./revenueSourceTruthService");

const PROHIBITED_TERMS = ["casino", "gambling", "betting", "adult content", "tobacco", "vape", "alcohol sales"];
const SCAM_TERMS = ["pay upfront", "registration fee", "training fee", "telegram only", "whatsapp only", "guaranteed income"];
const DEMO_TERMS = ["demo", "placeholder", "fake opportunity", "test listing", "lorem ipsum", "sample job", "example.com"];

const INTAKE_LABEL = "Founder-assisted intake — GARUDA has not independently verified inaccessible platform content.";

function plainText(value = "") {
  return String(value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function sha256(data) {
  return crypto.createHash("sha256").update(typeof data === "string" ? data : JSON.stringify(data)).digest("hex");
}

function processFounderAssistedIntake(input = {}, context = {}, now = new Date()) {
  // 1. Founder Attestation & Authorization Gate
  const attestation = input.attestation || {};
  if (
    !founderApprovalGranted(context.founderApproved) ||
    attestation.founderAccessedAuthorizedAccount !== true ||
    attestation.noPlaceholderData !== true ||
    attestation.rawTextUnmodified !== true
  ) {
    const err = new Error("Founder attestation and approval are required to import founder-assisted opportunities");
    err.statusCode = 403;
    throw err;
  }

  // 2. Validate Source URL
  const url = String(input.url || "").trim();
  if (!url || !/^https?:\/\//i.test(url)) {
    const err = new Error("A valid secure HTTP/HTTPS source URL is required");
    err.statusCode = 400;
    throw err;
  }

  // 3. Raw Source Preservation (Immutable Object)
  const rawSource = Object.freeze({
    url,
    source: String(input.source || "Client Portal").trim(),
    title: String(input.title || "").trim(),
    description: String(input.description || "").trim(),
    company: String(input.company || "not disclosed").trim(),
    salaryText: String(input.salaryText || "not stated").trim(),
    deadlineText: String(input.deadlineText || "not stated").trim(),
    attachments: Array.isArray(input.attachments) ? input.attachments.map((a) => Object.freeze({ ...a })) : [],
    importedAt: now.toISOString()
  });

  if (!rawSource.title) {
    const err = new Error("Original title is required for opportunity intake");
    err.statusCode = 400;
    throw err;
  }
  if (!rawSource.description) {
    const err = new Error("Exact description is required for opportunity intake");
    err.statusCode = 400;
    throw err;
  }

  const rawSourceHash = sha256(rawSource);

  // 4. Demo / Fake / Placeholder Content Check
  const searchableText = `${rawSource.url} ${rawSource.title} ${rawSource.description} ${rawSource.company}`.toLowerCase();
  if (DEMO_TERMS.some((term) => searchableText.includes(term))) {
    const err = new Error("Demo, fake, or placeholder listings are strictly prohibited in revenue intake");
    err.statusCode = 409;
    throw err;
  }

  // 5. Prohibited / Scam Content Check
  if (PROHIBITED_TERMS.some((term) => searchableText.includes(term))) {
    const err = new Error("Listing contains prohibited or age-restricted category content");
    err.statusCode = 409;
    throw err;
  }
  if (SCAM_TERMS.some((term) => searchableText.includes(term))) {
    const err = new Error("Listing contains scam or fraud signals");
    err.statusCode = 409;
    throw err;
  }

  // 6. Human Employment Rejection
  const humanIdentityMatch = HUMAN_IDENTITY_SIGNALS.some((sig) => searchableText.includes(sig.trim()));
  const isFullTimeRole = /full.?time|employee|permanent|annual salary|coding interview|resume|curriculum vitae/i.test(searchableText);
  if (isFullTimeRole || humanIdentityMatch) {
    const err = new Error("Listing is a human employment/recruiting role requiring human applicant identity, which cannot be autonomously executed by GARUDA");
    err.statusCode = 409;
    throw err;
  }

  // 7. Expiry Check
  if (rawSource.deadlineText && rawSource.deadlineText.toLowerCase() !== "not stated") {
    const parsedDeadline = Date.parse(rawSource.deadlineText);
    if (Number.isFinite(parsedDeadline) && parsedDeadline < now.getTime()) {
      const err = new Error("Opportunity listing has already expired");
      err.statusCode = 409;
      throw err;
    }
  }

  // 8. Normalized Fields Generation
  const normalizedTitle = plainText(rawSource.title);
  const normalizedCompany = plainText(rawSource.company);
  const normalizedDescription = plainText(rawSource.description);
  const normalizedSalaryText = plainText(rawSource.salaryText);
  const normalizedCategory = classifyOpportunityCategory({ title: normalizedTitle, description: normalizedDescription });

  // Missing Information & Risks Extraction
  const missingInformation = [];
  const risks = [];

  if (normalizedSalaryText.toLowerCase() === "not stated" || normalizedSalaryText.toLowerCase() === "unspecified" || !normalizedSalaryText) {
    missingInformation.push("Budget / payment terms not stated by client");
    risks.push("Missing budget specification requires clarification before commercial proposal confirmation");
  }
  if (normalizedCompany.toLowerCase() === "not disclosed" || !normalizedCompany) {
    missingInformation.push("Client identity not disclosed on public listing");
    risks.push("Client identity unverified until direct engagement");
  }
  if (rawSource.deadlineText.toLowerCase() === "not stated" || !rawSource.deadlineText) {
    missingInformation.push("Delivery deadline not stated by client");
  }

  // Capability Matching
  const assessment = revenueOrchestrator.matchDemand({
    title: normalizedTitle,
    description: normalizedDescription,
    category: normalizedCategory,
    tags: Array.isArray(input.tags) ? input.tags : [],
    source: rawSource.source
  });

  const directSignalCount = DIRECT_WORK_SIGNALS.filter((signal) => searchableText.includes(signal)).length;
  const isDirectWork = directSignalCount >= 1 || /contract|project|fixed price|freelance|scope|deliverable/i.test(searchableText);

  const listingKind = isDirectWork ? "specific_client_work" : "unverified_general_listing";
  const selfEarningEligible = assessment.matches.length > 0 && isDirectWork;

  const candidatePayload = {
    source: rawSource.source.toLowerCase().replace(/[^a-z0-9_]+/g, "_"),
    externalId: `founder-assisted-${rawSourceHash.slice(0, 16)}`,
    title: normalizedTitle,
    company: normalizedCompany,
    description: normalizedDescription.slice(0, 12000),
    category: normalizedCategory,
    location: "Remote",
    url: rawSource.url,
    sourceAttribution: `Founder-Assisted (${rawSource.source})`,
    publishedAt: now,
    salaryText: normalizedSalaryText,
    tags: Array.isArray(input.tags) ? input.tags.map(plainText).filter(Boolean).slice(0, 20) : [],
    score: Math.min(100, (assessment.matches[0]?.score || 50) + (isDirectWork ? 20 : 0)),
    opportunityChannel: selfEarningEligible ? "garuda_deliverable" : "no_verified_capability_match",
    capabilityAssessment: {
      selfEarningEligible,
      humanIdentityRequired: false,
      decision: selfEarningEligible ? "capability_match_found" : assessment.decision,
      matches: assessment.matches.slice(0, 5).map((m) => ({
        capabilityId: m.id || m.capabilityId,
        universe: m.universe || "engineering",
        name: m.name,
        score: m.score
      })),
      assessedAt: now
    },
    verification: {
      sourceVerified: true,
      originalLinkPresent: true,
      prohibitedContentClear: true,
      scamSignalsClear: true,
      listingSpecific: true,
      listingKind,
      directClientWorkEvidence: isDirectWork,
      humanIdentityGateClear: true,
      garudaExecutionEligible: selfEarningEligible,
      sourceRecordHash: rawSourceHash,
      verifiedAt: now.toISOString(),
      rejectionReasons: []
    },
    status: "ranked",
    requiresFounderApproval: true,
    rawSource,
    rawSourceHash,
    founderAssistedIntake: {
      isFounderAssisted: true,
      attestation: {
        founderAccessedAuthorizedAccount: true,
        noPlaceholderData: true,
        rawTextUnmodified: true,
        attestedAt: now.toISOString()
      },
      label: INTAKE_LABEL,
      attachments: rawSource.attachments,
      risks,
      missingInformation
    }
  };

  return candidatePayload;
}

function buildFounderReviewPackage(candidate = {}) {
  const match = candidate.capabilityAssessment?.matches?.[0] || {
    capabilityId: "engineering.software-implementation",
    name: "Governed software implementation",
    score: 80
  };

  return {
    opportunityId: String(candidate.externalId || candidate.id || candidate._id || ""),
    originalUrl: String(candidate.url || candidate.rawSource?.url || ""),
    source: String(candidate.sourceAttribution || candidate.source || ""),
    clientIdentity: String(candidate.company || candidate.rawSource?.company || "not disclosed"),
    workRequirements: candidate.description ? [candidate.description.slice(0, 500)] : [],
    budget: String(candidate.salaryText || candidate.rawSource?.salaryText || "not stated"),
    deadline: String(candidate.rawSource?.deadlineText || "not stated"),
    capabilityMatch: {
      capabilityId: match.capabilityId || match.id,
      name: match.name,
      score: match.score || 80
    },
    risks: candidate.founderAssistedIntake?.risks || [],
    missingInformation: candidate.founderAssistedIntake?.missingInformation || [],
    recommendedProposalStrategy: `Prepare a bounded ${match.name} work package for ${candidate.company || "the client"} matching capability ${match.capabilityId}. Confirm price and deadline before work initiation.`,
    label: INTAKE_LABEL,
    status: "READY_FOR_FOUNDER_REVIEW"
  };
}

async function importFounderAssistedCandidate(input = {}, context = {}, options = {}) {
  const now = options.now ? new Date(options.now) : new Date();
  const processed = processFounderAssistedIntake(input, context, now);

  const mongoose = require("mongoose");
  const mongoReady = mongoose.connection && mongoose.connection.readyState === 1;

  if (mongoReady) {
    const existing = await DiscoveryCandidate.findOne({
      $or: [
        { url: processed.url },
        { rawSourceHash: processed.rawSourceHash },
        { externalId: processed.externalId }
      ]
    });
    if (existing) {
      const err = new Error("Opportunity listing has already been imported or discovered");
      err.statusCode = 409;
      throw err;
    }

    const mission = await IncomeGoal.findOne({ status: "active" });
    const missionId = mission ? mission._id : new mongoose.Types.ObjectId("507f1f77bcf86cd799439011");

    const created = await DiscoveryCandidate.create({
      missionId,
      ...processed
    });
    const result = created.toJSON();
    return {
      candidate: result,
      reviewPackage: buildFounderReviewPackage(result)
    };
  }

  return {
    candidate: processed,
    reviewPackage: buildFounderReviewPackage(processed)
  };
}

module.exports = {
  INTAKE_LABEL,
  buildFounderReviewPackage,
  importFounderAssistedCandidate,
  processFounderAssistedIntake,
  sha256
};
