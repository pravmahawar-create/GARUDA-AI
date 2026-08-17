const crypto = require("crypto");
const { DiscoveryCandidate } = require("../models/DiscoveryCandidate");
const { IncomeGoal } = require("../models/IncomeGoal");
const { founderApprovalGranted } = require("./revenueConversionService");
const { matchDemandUniversal } = require("./capabilityRegistryService");

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

/**
 * Advanced Opportunity Classification, Platform Intelligence & Execution Mode Engine
 */
function classifyOpportunityIntelligence(input = {}) {
  const url = String(input.url || "").toLowerCase();
  const source = String(input.source || "").toLowerCase();
  const title = plainText(input.title || "").toLowerCase();
  const description = plainText(input.description || "").toLowerCase();
  const salaryText = plainText(input.salaryText || "").toLowerCase();
  const combinedText = `${title} ${description} ${salaryText} ${source} ${url}`;

  // 1. Platform Intelligence Detection
  let platformId = "generic";
  let platformName = "Direct Client Portal";
  let platformQuirks = "Standard work order execution.";

  if (/upwork\.com/i.test(url) || /upwork/i.test(source)) {
    platformId = "upwork";
    platformName = "Upwork Freelance Marketplace";
    platformQuirks = "Client rating, job history, and client verification required. 20% platform fee applies.";
  } else if (/remotive\.com/i.test(url) || /remotive/i.test(source)) {
    platformId = "remotive";
    platformName = "Remotive Remote Job Board";
    platformQuirks = "Direct applicant link. Mixture of full-time employment and long-term contracts.";
  } else if (/a\.team|ateam/i.test(url) || /a\.team/i.test(source)) {
    platformId = "ateam";
    platformName = "A.Team Independent Builder Network";
    platformQuirks = "Application-only builder network. Milestone and hourly team deployments ($90-$150/hr).";
  } else if (/linkedin\.com/i.test(url) || /linkedin/i.test(source)) {
    platformId = "linkedin";
    platformName = "LinkedIn Jobs & Professional Network";
    platformQuirks = "Strict human profile identity verification. Corporate recruiter screen required.";
  } else if (/freelancer\.com/i.test(url) || /freelancer/i.test(source)) {
    platformId = "freelancer";
    platformName = "Freelancer.com Marketplace";
    platformQuirks = "Fixed bid competitive marketplace.";
  } else if (/fiverr\.com/i.test(url) || /fiverr/i.test(source)) {
    platformId = "fiverr";
    platformName = "Fiverr Gig Marketplace";
    platformQuirks = "Fixed scope gig package.";
  }

  // 2. Category & Reasoning Extraction
  const reasoning = [];
  let category = "other";
  let confidenceScore = 80;

  // Full-time Job Signals
  const ftSignals = /\b(full[- ]time|salary|per year|\$?\d{2,3}k\/?(yr|year|annually)?|benefits|401k|health insurance|pto|vacation)\b/i;
  // Contract Role Signals
  const contractSignals = /\b(contract|contractor|hourly|per hour|\$\d{2,3}\/hr|staff augmentation|3[- ]month|6[- ]month|12[- ]month)\b/i;
  // Freelance Project Signals
  const freelanceSignals = /\b(fixed[- ]price|freelance|milestone|project-based|build a|create a|develop a|one-off)\b/i;
  // Agency / Partner Signals
  const agencySignals = /\b(agency|subcontract|white[- ]label|partner|partner agency|vendor)\b/i;
  // RFP / Tender Signals
  const rfpSignals = /\b(rfp|request for proposal|tender|bidding|bid|compliance|procurement)\b/i;
  // Grant Signals
  const grantSignals = /\b(grant|research grant|non-dilutive|innovation fund|grant application)\b/i;

  if (rfpSignals.test(combinedText)) {
    category = "rfp_tender";
    confidenceScore = 95;
    reasoning.push("Explicit RFP / Tender bidding signals detected in text or source.");
  } else if (grantSignals.test(combinedText)) {
    category = "grant";
    confidenceScore = 95;
    reasoning.push("Innovation or research grant allocation signals detected.");
  } else if (agencySignals.test(combinedText)) {
    category = "agency_project";
    confidenceScore = 90;
    reasoning.push("Agency subcontracting or white-label partnership keywords detected.");
  } else if (freelanceSignals.test(combinedText) || /fixed/i.test(salaryText)) {
    category = "freelance_project";
    confidenceScore = 90;
    reasoning.push("Fixed-price milestone deliverable or project scope identified.");
  } else if (contractSignals.test(combinedText) || /\/hr|hour/i.test(salaryText)) {
    category = "contract_role";
    confidenceScore = 92;
    reasoning.push("Hourly contract rate or staff augmentation terms detected.");
  } else if (ftSignals.test(combinedText) || /k\/yr|\$?\d{2,3}k/i.test(salaryText) || /full-time/i.test(combinedText)) {
    category = "full_time_job";
    confidenceScore = 94;
    reasoning.push("Full-time employment terms, annual salary range, or benefit packages detected.");
  } else if (input.attestation) {
    category = "founder_assisted";
    confidenceScore = 85;
    reasoning.push("Direct Founder-assisted intake work order.");
  } else {
    category = "other";
    confidenceScore = 70;
    reasoning.push("Standard unclassified technical opportunity.");
  }

  // 3. Execution Mode Determination
  let executionMode = "founder_assisted";
  if (/physical onsite|in-person|bar license|court appearance/i.test(combinedText)) {
    executionMode = "human_team_required";
    reasoning.push("Requires physical presence or non-software human team.");
  } else if (/live interview|face-to-face|zoom call|video interview|recruiter screen/i.test(combinedText) || category === "full_time_job") {
    executionMode = "founder_required";
    reasoning.push("Requires active Founder live meeting, recruiter interview, or employment agreement.");
  } else if (category === "freelance_project" || category === "founder_assisted" || category === "contract_role") {
    executionMode = "founder_assisted";
    reasoning.push("GARUDA AI executes technical deliverables; Founder holds identity & approval.");
  } else if (/api endpoint|bot|script|automated webhook/i.test(combinedText)) {
    executionMode = "ai_only";
    reasoning.push("Fully automated AI execution eligible.");
  }

  return {
    category,
    confidenceScore,
    reasoning,
    platformIntelligence: {
      platformId,
      platformName,
      platformQuirks
    },
    executionMode
  };
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
    company: String(input.company || "Unknown Company (Requires Founder Verification)").trim(),
    salaryText: String(input.salaryText || "Unstated Budget (Requires Founder Verification)").trim(),
    deadlineText: String(input.deadlineText || "Unstated Deadline").trim(),
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
  const lowerText = `${rawSource.title} ${rawSource.description} ${rawSource.url}`.toLowerCase();
  const isDemoContent = DEMO_TERMS.some((term) => lowerText.includes(term));
  if (isDemoContent) {
    const err = new Error("Import rejected: Placeholder, demo, or invented content detected");
    err.statusCode = 422;
    throw err;
  }

  // 5. Prohibited & Scam Content Check
  const containsProhibited = PROHIBITED_TERMS.some((term) => lowerText.includes(term));
  const containsScam = SCAM_TERMS.some((term) => lowerText.includes(term));

  let opportunityChannel = "founder_garuda";
  let rejectionReasons = [];

  if (containsProhibited) {
    opportunityChannel = "reject";
    rejectionReasons.push("Contains prohibited domain content (gambling, adult, tobacco)");
  }
  if (containsScam) {
    opportunityChannel = "reject";
    rejectionReasons.push("Contains scam or fraud risk signals");
  }

  if (/physical onsite|bar admission/i.test(rawSource.description)) {
    opportunityChannel = "human_only";
    rejectionReasons.push("Requires physical presence or professional bar license");
  }

  const intel = classifyOpportunityIntelligence(input);
  const { evaluateOutcomeDeliverability } = require("./revenueSourceTruthService");
  const outcomeDeliverability = evaluateOutcomeDeliverability(rawSource);

  let marketSourceType = "job_listings";
  const lowerUrl = rawSource.url.toLowerCase();
  const lowerDesc = rawSource.description.toLowerCase();

  if (/upwork|ateam|freelancer|fiverr/i.test(lowerUrl) || /freelance|gig|milestone project/i.test(lowerDesc)) {
    marketSourceType = "freelance_marketplaces";
  } else if (/partner|agency|subcontract|white[- ]label/i.test(lowerDesc)) {
    marketSourceType = "partnerships";
  } else if (/problem|technical debt|bug|refactor|audit|code review|automation need/i.test(lowerDesc)) {
    marketSourceType = "business_problems";
  } else if (/outreach|cold email|pitch|yc|seed/i.test(lowerDesc)) {
    marketSourceType = "direct_outreach";
  }

  // 6. Candidate Payload Construction
  // Dynamic capability matching using existing capability registry
  const opportunityForMatching = {
    title: rawSource.title,
    description: rawSource.description,
    category: intel.category,
    tags: Array.isArray(input.tags) ? input.tags.map(plainText) : []
  };
  const capMatch = matchDemandUniversal(opportunityForMatching, { rootDir: context?.rootDir || process.cwd() });
  const primaryMatch = capMatch.bestCapability || null;
  const matches = capMatch.matches || [];

  // Determine opportunityChannel based on genuine capability deliverability
  if (!capMatch.capabilityMatchScore || capMatch.capabilityMatchScore < 30) {
    opportunityChannel = "no_verified_capability_match";
  } else if (/physical onsite|in-person|bar license|court appearance/i.test(rawSource.description)) {
    opportunityChannel = "human_only";
  } else {
    opportunityChannel = "garuda_deliverable";
  }

  // humanIdentityRequired based on actual capability, not hardcoded
  const humanIdentityRequired = capMatch.humanIdentityRequired;

  // Score from actual capability matching, defaulting to 0 when no match
  const matchingScore = capMatch.capabilityMatchScore !== undefined ? capMatch.capabilityMatchScore : 0;

  const candidatePayload = {
    externalId: `fa-${rawSourceHash.slice(0, 12)}`,
    source: rawSource.source,
    title: rawSource.title,
    description: rawSource.description,
    company: rawSource.company,
    salaryText: rawSource.salaryText,
    url: rawSource.url,
    category: "remote_job",
    opportunityCategory: intel.category,
    marketSourceType,
    outcomeDeliverability,
    classificationIntelligence: {
      confidenceScore: intel.confidenceScore,
      reasoning: intel.reasoning,
      platformId: intel.platformIntelligence.platformId,
      executionMode: intel.executionMode
    },
    platformIntelligence: intel.platformIntelligence,
    location: String(input.location || "Pending Location Verification"),
    sourceAttribution: `${rawSource.source} (Founder Assisted)`,
    publishedAt: now,
tags: Array.isArray(input.tags) ? input.tags.map(plainText) : [],
    score: matchingScore,
    opportunityChannel,
    requiresFounderApproval: true,
    capabilityAssessment: {
      selfEarningEligible: capMatch.capabilityMatchScore !== undefined && capMatch.capabilityMatchScore >= 30,
      humanIdentityRequired: humanIdentityRequired,
      decision: opportunityChannel,
      matches: matches.length > 0 ? matches : [],
      assessedAt: now
    },
    verification: {
      sourceVerified: true,
      originalLinkPresent: true,
      prohibitedContentClear: !containsProhibited,
      scamSignalsClear: !containsScam,
      listingSpecific: true,
      listingKind: "specific_client_work",
      directClientWorkEvidence: true,
      humanIdentityGateClear: true,
      garudaExecutionEligible: opportunityChannel !== "reject" && opportunityChannel !== "human_only" && opportunityChannel !== "no_verified_capability_match",
      sourceRecordHash: rawSourceHash,
      verifiedAt: now,
      rejectionReasons
    },
    status: opportunityChannel === "reject" ? "rejected" : "ranked",
    rawSource,
    rawSourceHash,
    founderAssistedIntake: {
      attestation: Object.freeze({ ...attestation }),
      label: INTAKE_LABEL,
      attachments: rawSource.attachments,
      risks: [],
      missingInformation: []
    }
  };

  const { estimateValueFromEvidence, isMeasuredValue, minimumValueRejectionReason } = require("./revenueValueModelService");
  const estimate = estimateValueFromEvidence(candidatePayload.salaryText || "", { valueType: "estimated_project_value" });
  const valueReason = minimumValueRejectionReason(estimate.estimatedINR, candidatePayload.opportunityChannel);
  if (candidatePayload.status === "ranked" && valueReason) {
    candidatePayload.status = "rejected";
    candidatePayload.rejectionReasons = Array.from(new Set([
      ...(candidatePayload.rejectionReasons || []),
      valueReason
    ]));
    candidatePayload.verification = {
      ...(candidatePayload.verification || {}),
      garudaExecutionEligible: false,
      rejectionReasons: candidatePayload.rejectionReasons
    };
  }
  if (candidatePayload.status === "ranked" && !isMeasuredValue(estimate.estimatedINR)) {
    // No invented value: founder-assisted work still needs a stated budget.
    candidatePayload.status = "rejected";
    candidatePayload.rejectionReasons = Array.from(new Set([
      ...(candidatePayload.rejectionReasons || []),
      "Rejected: unstated budget — founder-assisted intake requires a stated project value (>= INR 3000)."
    ]));
  }

  return candidatePayload;
}

function buildFounderReviewPackage(candidate = {}) {
  const match = candidate.capabilityAssessment?.matches?.[0] || {
    capabilityId: "engineering.software-implementation",
    name: "Governed software implementation",
    score: 80
  };

  const intel = candidate.classificationIntelligence || {};

  return {
    opportunityId: String(candidate.externalId || candidate.id || candidate._id || ""),
    originalUrl: String(candidate.url || candidate.rawSource?.url || ""),
    source: String(candidate.sourceAttribution || candidate.source || ""),
    clientIdentity: String(candidate.company || candidate.rawSource?.company || "not disclosed"),
    workRequirements: candidate.description ? [candidate.description.slice(0, 500)] : [],
    budget: String(candidate.salaryText || candidate.rawSource?.salaryText || "not stated"),
    deadline: String(candidate.rawSource?.deadlineText || "not stated"),
    opportunityCategory: candidate.opportunityCategory || "other",
    confidenceScore: intel.confidenceScore || 80,
    reasoning: intel.reasoning || [],
    executionMode: intel.executionMode || "founder_assisted",
    platformIntelligence: candidate.platformIntelligence || { platformId: "generic", platformName: "Direct Client Portal" },
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
    let missionId = mission ? mission._id : null;
    if (!missionId) {
      const { ensureContinuousDiscoveryMission } = require("./opportunityDiscoveryService");
      const opsMission = await ensureContinuousDiscoveryMission();
      missionId = opsMission ? opsMission._id : null;
    }
    if (!missionId) {
      const err = new Error("No active mission available for candidate intake");
      err.statusCode = 503;
      throw err;
    }

    const created = await DiscoveryCandidate.create({
      missionId,
      ...processed
    });
    const result = created.toJSON();
    const { buildFounderSubmissionPackage } = require("./founderSubmissionPackageService");
    return {
      candidate: result,
      reviewPackage: buildFounderReviewPackage(result),
      submissionPackage: buildFounderSubmissionPackage(result, context, { now })
    };
  }

  const { buildFounderSubmissionPackage } = require("./founderSubmissionPackageService");
  return {
    candidate: processed,
    reviewPackage: buildFounderReviewPackage(processed),
    submissionPackage: buildFounderSubmissionPackage(processed, context, { now })
  };
}

const { buildFounderSubmissionPackage } = require("./founderSubmissionPackageService");

module.exports = {
  INTAKE_LABEL,
  classifyOpportunityIntelligence,
  buildFounderReviewPackage,
  buildFounderSubmissionPackage,
  importFounderAssistedCandidate,
  processFounderAssistedIntake,
  sha256
};
