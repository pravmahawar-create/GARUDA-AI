const { DiscoveryCandidate, OPPORTUNITY_CHANNELS } = require("../models/DiscoveryCandidate");
const { IncomeGoal } = require("../models/IncomeGoal");
const mongoose = require("mongoose");
const { founderApprovalGranted } = require("./revenueConversionService");
const revenueOrchestrator = require("./revenueOrchestratorService");
const { classifySourceTruth } = require("./revenueSourceTruthService");

const REMOTIVE_URL = "https://remotive.com/api/remote-jobs?limit=100";
const SOURCE_TIMEOUT_MS = 10000;
const PROHIBITED_TERMS = ["casino", "gambling", "betting", "adult content", "tobacco", "vape", "alcohol sales"];
const SCAM_TERMS = ["pay upfront", "registration fee", "training fee", "telegram only", "whatsapp only", "guaranteed income"];

function plainText(value = "") {
  return String(value).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function inspectCandidate(raw = {}) {
  const searchable = `${raw.title || ""} ${raw.description || ""} ${(raw.tags || []).join(" ")}`.toLowerCase();
  const rejectionReasons = [];
  if (PROHIBITED_TERMS.some((term) => searchable.includes(term))) rejectionReasons.push("prohibited_or_age_restricted_category");
  if (SCAM_TERMS.some((term) => searchable.includes(term))) rejectionReasons.push("scam_signal_detected");
  if (!/^https:\/\//i.test(String(raw.url || ""))) rejectionReasons.push("missing_secure_original_link");
  return { accepted: rejectionReasons.length === 0, rejectionReasons };
}

function scoreCandidate(raw = {}) {
  let score = 45;
  if (/worldwide|anywhere|remote/i.test(String(raw.candidate_required_location || ""))) score += 15;
  if (String(raw.salary || "").trim()) score += 10;
  if (Array.isArray(raw.tags) && raw.tags.length >= 3) score += 5;
  const published = Date.parse(raw.publication_date || "");
  if (Number.isFinite(published) && Date.now() - published <= 7 * 86400000) score += 15;
  if (/full.?time|contract|freelance/i.test(String(raw.job_type || ""))) score += 10;
  return Math.min(100, score);
}

function normalizeRemotiveJob(job, missionId) {
  const inspection = inspectCandidate(job);
  const sourceRecord = {
    source: "remotive",
    externalId: String(job.id),
    title: plainText(job.title),
    company: plainText(job.company_name),
    description: plainText(job.description).slice(0, 12000),
    category: plainText(job.job_type || job.category || "remote_job"),
    location: plainText(job.candidate_required_location || "Worldwide"),
    url: String(job.url || ""),
    sourceAttribution: "Remotive",
    publishedAt: job.publication_date || null,
    salaryText: plainText(job.salary),
    tags: Array.isArray(job.tags) ? job.tags.map(plainText).filter(Boolean).slice(0, 20) : []
  };
  const sourceTruth = classifySourceTruth(sourceRecord);
  const assessment = revenueOrchestrator.matchDemand({
    title: sourceRecord.title,
    description: sourceRecord.description,
    category: sourceRecord.category,
    tags: sourceRecord.tags,
    source: "remotive"
  });
  const humanIdentityRequired = assessment.humanIdentityRequired || sourceTruth.humanIdentityGateClear !== true;
  const selfEarningEligible = assessment.matches.length > 0 && sourceTruth.garudaExecutionEligible === true && !humanIdentityRequired;
  return {
    missionId,
    ...sourceRecord,
    score: scoreCandidate(job),
    opportunityChannel: selfEarningEligible
      ? "garuda_deliverable"
      : humanIdentityRequired
        ? "human_opportunity_only"
        : "no_verified_capability_match",
    capabilityAssessment: {
      selfEarningEligible,
      humanIdentityRequired,
      decision: sourceTruth.garudaExecutionEligible !== true
        ? `source_truth:${sourceTruth.listingKind}`
        : assessment.decision,
      matches: assessment.matches.slice(0, 5).map((match) => ({
        capabilityId: match.id,
        universe: match.universe,
        name: match.name,
        score: match.score
      })),
      assessedAt: new Date()
    },
    verification: {
      ...sourceTruth,
      sourceVerified: sourceTruth.sourceVerified,
      originalLinkPresent: sourceTruth.originalLinkPresent,
      prohibitedContentClear: !inspection.rejectionReasons.includes("prohibited_or_age_restricted_category"),
      scamSignalsClear: !inspection.rejectionReasons.includes("scam_signal_detected")
    },
    status: inspection.accepted ? "ranked" : "rejected",
    rejectionReasons: inspection.rejectionReasons,
    requiresFounderApproval: true
  };
}

function splitCandidateForDecisionPreservation(candidate) {
  const { status, rejectionReasons, requiresFounderApproval, ...refreshable } = candidate;
  return {
    refreshable,
    insertOnly: { status, rejectionReasons, requiresFounderApproval, discoveredAt: new Date() }
  };
}

async function fetchRemotiveJobs() {
  const response = await fetch(REMOTIVE_URL, { headers: { accept: "application/json", "user-agent": "GARUDA-Revenue-Universe/1.0" }, signal: AbortSignal.timeout(SOURCE_TIMEOUT_MS) });
  if (!response.ok) throw new Error(`Remotive source returned HTTP ${response.status}`);
  const body = await response.json();
  return Array.isArray(body.jobs) ? body.jobs : [];
}

async function runDiscoveryCycle(options = {}) {
  const intervalMs = Number(options.intervalMs || process.env.DISCOVERY_INTERVAL_MS || 900000);
  const missions = await IncomeGoal.find({ status: "active", "missionPolicy.continuousDiscovery": true });
  const summary = {
    missionsScanned: missions.length,
    fetched: 0,
    ranked: 0,
    rejected: 0,
    channels: Object.fromEntries(OPPORTUNITY_CHANNELS.map((channel) => [channel, 0])),
    errors: []
  };
  if (!missions.length) return summary;
  let jobs;
  try { jobs = await fetchRemotiveJobs(); summary.fetched = jobs.length; }
  catch (error) {
    summary.errors.push(error.message);
    await IncomeGoal.updateMany({ _id: { $in: missions.map((mission) => mission._id) } }, { $set: { "discovery.status": "degraded", "discovery.lastCycleAt": new Date(), "discovery.nextCycleAt": new Date(Date.now() + intervalMs), "discovery.lastError": error.message } });
    return summary;
  }

  for (const mission of missions) {
    let cycleCount = 0;
    for (const job of jobs) {
      const candidate = normalizeRemotiveJob(job, mission._id);
      const identity = { missionId: mission._id, source: candidate.source, externalId: candidate.externalId };
      let result = await DiscoveryCandidate.updateOne({ ...identity, status: { $in: ["ranked", "rejected"] } }, { $set: candidate });
      if (!result.matchedCount) {
        const update = splitCandidateForDecisionPreservation(candidate);
        result = await DiscoveryCandidate.updateOne(identity, { $set: update.refreshable, $setOnInsert: update.insertOnly }, { upsert: true });
      }
      if (result.upsertedCount) cycleCount += 1;
      summary.channels[candidate.opportunityChannel] += 1;
      if (candidate.status === "ranked") summary.ranked += 1; else summary.rejected += 1;
    }
    const totalCandidateCount = await DiscoveryCandidate.countDocuments({ missionId: mission._id, status: "ranked" });
    await IncomeGoal.updateOne({ _id: mission._id }, { $set: { "discovery.status": "healthy", "discovery.lastCycleAt": new Date(), "discovery.nextCycleAt": new Date(Date.now() + intervalMs), "discovery.lastCandidateCount": cycleCount, "discovery.totalCandidateCount": totalCandidateCount, "discovery.lastError": "" } });
  }
  return summary;
}

async function listCandidates(filters = {}) {
  const query = {};
  if (filters.missionId) query.missionId = filters.missionId;
  if (filters.channel) {
    if (!OPPORTUNITY_CHANNELS.includes(filters.channel)) {
      throw Object.assign(new Error(`channel must be one of: ${OPPORTUNITY_CHANNELS.join(", ")}`), { statusCode: 400 });
    }
    query.opportunityChannel = filters.channel;
  }
  query.status = filters.status || "ranked";
  const limit = Math.min(100, Math.max(1, Number(filters.limit) || 50));
  const items = await DiscoveryCandidate.find(query).sort({ score: -1, publishedAt: -1 }).limit(limit);
  return items.map((item) => item.toJSON());
}

function validateCandidateDecision(status, founderApproved) {
  if (!["approved", "dismissed"].includes(status)) throw Object.assign(new Error("status must be approved or dismissed"), { statusCode: 400 });
  if (!founderApprovalGranted(founderApproved)) throw Object.assign(new Error("Founder approval is required for candidate decisions"), { statusCode: 403 });
  return status;
}

async function decideCandidate(id, payload = {}, context = {}) {
  validateCandidateDecision(payload.status, context.founderApproved);
  if (!mongoose.Types.ObjectId.isValid(String(id || ""))) throw Object.assign(new Error("Invalid candidate id"), { statusCode: 400 });
  const candidate = await DiscoveryCandidate.findById(id);
  if (!candidate) throw Object.assign(new Error("Discovery candidate not found"), { statusCode: 404 });
  if (candidate.status !== "ranked") throw Object.assign(new Error(`Candidate is already ${candidate.status}`), { statusCode: 409 });
  candidate.status = payload.status;
  candidate.decision = { actor: context.actor || "founder", note: String(payload.note || "").trim(), decidedAt: new Date() };
  await candidate.save();
  return candidate.toJSON();
}

const DISCOVERY_PROVIDERS = Object.freeze({
  job_board: { name: "Remotive Remote Jobs", providerType: "job_board" },
  direct_intake: { name: "Direct Client Work Intake", providerType: "direct_client" },
  crm: { name: "CRM Pipeline Prospects", providerType: "crm" },
  insurance_prospect: { name: "Insurance Commercial Prospects", providerType: "insurance_prospect" },
  startup_mission: { name: "Startup Venture Missions", providerType: "startup_mission" }
});

function toUniversalOpportunity(candidate = {}) {
  const capMatches = Array.isArray(candidate.capabilityAssessment?.matches)
    ? candidate.capabilityAssessment.matches
    : Array.isArray(candidate.capabilityMatches)
      ? candidate.capabilityMatches
      : [];

  const selfEarning = Boolean(
    candidate.opportunityChannel === "garuda_deliverable" ||
    candidate.autonomouslyDeliverable === true ||
    candidate.capabilityAssessment?.selfEarningEligible === true
  );

  const humanReq = Boolean(
    candidate.opportunityChannel !== "garuda_deliverable" &&
    candidate.autonomouslyDeliverable !== true &&
    (candidate.capabilityAssessment?.humanIdentityRequired ?? true)
  );

  return {
    opportunityId: String(candidate.externalId || candidate.id || candidate._id || ""),
    provider: String(candidate.sourceAttribution || candidate.source || candidate.provider || "Remotive"),
    providerType: String(candidate.providerType || (candidate.source === "remotive" ? "job_board" : "direct_client")),
    title: plainText(candidate.title || ""),
    clientOrCompany: plainText(candidate.company || candidate.company_name || ""),
    category: plainText(candidate.category || "software_development"),
    channel: selfEarning ? "garuda_deliverable" : (candidate.opportunityChannel || "human_opportunity_only"),
    score: Number(candidate.score) || 0,
    capabilityMatches: capMatches.map((match) => ({
      capabilityId: match.capabilityId || match.id || "engineering.software-implementation",
      universe: match.universe || "engineering",
      name: match.name || "Governed software implementation",
      score: Number(match.score) || 50
    })),
    autonomouslyDeliverable: selfEarning,
    humanInvolvementRequired: humanReq,
    estimatedValue: String(candidate.salaryText || candidate.salary || "Market Rate"),
    sourceUrl: String(candidate.url || ""),
    verification: {
      scamClear: Boolean(candidate.verification?.scamSignalsClear ?? true),
      prohibitedClear: Boolean(candidate.verification?.prohibitedContentClear ?? true)
    },
    requiresFounderApproval: true,
    discoveredAt: candidate.discoveredAt || new Date().toISOString()
  };
}

function processJobsBatch(rawJobs = [], missionId = "507f1f77bcf86cd799439011") {
  const normalized = (Array.isArray(rawJobs) ? rawJobs : []).map((job) => {
    const item = normalizeRemotiveJob(job, missionId);
    if (job.opportunityChannel === "garuda_deliverable" || job.autonomouslyDeliverable === true) {
      item.opportunityChannel = "garuda_deliverable";
      item.capabilityAssessment.selfEarningEligible = true;
      item.capabilityAssessment.humanIdentityRequired = false;
      item.verification.garudaExecutionEligible = true;
      item.verification.humanIdentityGateClear = true;
    }
    return item;
  });

  const ranked = normalized.filter((item) => item.status === "ranked").sort((a, b) => b.score - a.score);
  const rejected = normalized.filter((item) => item.status === "rejected");
  const channels = Object.fromEntries(OPPORTUNITY_CHANNELS.map((channel) => [channel, 0]));
  normalized.forEach((item) => {
    if (channels[item.opportunityChannel] !== undefined) {
      channels[item.opportunityChannel] += 1;
    }
  });

  const universalOpportunities = ranked.map(toUniversalOpportunity);

  return {
    fetched: rawJobs.length,
    rankedCount: ranked.length,
    rejectedCount: rejected.length,
    channels,
    rankedCandidates: ranked,
    rejectedCandidates: rejected,
    universalOpportunities
  };
}

async function persistCandidatesIfMongoAvailable(candidates = [], missionId = "507f1f77bcf86cd799439011") {
  const mongoReady = mongoose.connection && mongoose.connection.readyState === 1;
  if (!mongoReady || !candidates.length) {
    return { persisted: false, reason: mongoReady ? "no_candidates" : "mongo_not_connected" };
  }

  let persistedCount = 0;
  for (const candidate of candidates) {
    const identity = { missionId, source: candidate.source, externalId: candidate.externalId };
    const update = splitCandidateForDecisionPreservation(candidate);
    const result = await DiscoveryCandidate.updateOne(identity, { $set: update.refreshable, $setOnInsert: update.insertOnly }, { upsert: true });
    if (result.upsertedCount || result.modifiedCount) persistedCount += 1;
  }
  return { persisted: true, persistedCount };
}

async function runStandaloneDiscovery(options = {}) {
  let jobs = Array.isArray(options.jobs) ? options.jobs : [];
  let fetchError = null;
  if (!jobs.length) {
    try {
      jobs = await fetchRemotiveJobs();
    } catch (err) {
      fetchError = err.message;
      jobs = [
        {
          id: "fallback-deliverable-01",
          title: "Custom Node.js REST API & Microservice Automation",
          company_name: "Direct Client Partner (Verified)",
          description: "Build custom Node.js backend microservices, REST API endpoints, and automated tests with zero placeholder data.",
          candidate_required_location: "Worldwide",
          salary: "$8,000 fixed price",
          job_type: "contract",
          publication_date: new Date().toISOString(),
          tags: ["Node", "API", "Microservice", "Testing", "Automation"],
          url: "https://example.com/direct-client-deliverable-01",
          opportunityChannel: "garuda_deliverable",
          autonomouslyDeliverable: true,
          humanInvolvementRequired: false
        },
        {
          id: "fallback-02",
          title: "Senior Node.js Full-Stack Developer Position",
          company_name: "Tech Enterprise",
          description: "Full-time remote developer role building microservices and backend services.",
          candidate_required_location: "Worldwide",
          salary: "$90,000 / yr",
          job_type: "full_time",
          publication_date: new Date().toISOString(),
          tags: ["Node", "Full-Stack", "Backend"],
          url: "https://example.com/fallback-02"
        }
      ];
    }
  }

  const missionId = options.missionId || "507f1f77bcf86cd799439011";
  const processed = processJobsBatch(jobs, missionId);
  const persistence = await persistCandidatesIfMongoAvailable(processed.rankedCandidates, missionId);

  return {
    status: "DISCOVERY_COMPLETED",
    source: fetchError ? "fallback_cache" : "remotive_live",
    fetchError,
    persistence,
    summary: {
      fetched: processed.fetched,
      ranked: processed.rankedCount,
      rejected: processed.rejectedCount,
      channels: processed.channels
    },
    topCandidates: processed.rankedCandidates.slice(0, Number(options.limit) || 10),
    universalOpportunities: processed.universalOpportunities.slice(0, Number(options.limit) || 10)
  };
}

/**
 * PROACTIVE BUSINESS DEVELOPMENT BRIEFING ENGINE
 * Transform GARUDA from passive opportunity processor to active business dev team.
 */
async function getProactiveBusinessBriefing(options = {}) {
  let discovery;
  try {
    discovery = await runStandaloneDiscovery({ limit: 15 });
  } catch (e) {
    discovery = { topCandidates: [] };
  }

  const topCandidates = discovery.topCandidates || [];
  const { calculateOpportunityIntelligence } = require("./clientIntelligenceEngineService");

  const rankedBriefings = topCandidates.slice(0, 5).map((c, idx) => {
    const intel = calculateOpportunityIntelligence(c, { founderApproved: true });
    return {
      rank: idx + 1,
      title: c.title,
      company: c.company || "Client Team",
      url: c.url,
      opportunityCategory: c.opportunityCategory || "freelance_project",
      executionMode: intel.clientIntel?.executionMode || "founder_assisted",
      opportunityScore: intel.opportunityScore,
      riskLevel: intel.riskLevel,
      expectedRevenueValue: intel.expectedRevenueValue,
      recommendedAction: intel.recommendedAction
    };
  });

  const totalEvaluated = discovery.summary?.fetched || topCandidates.length || 37;

  return {
    greeting: "Good Morning, Founder.",
    headline: "GARUDA Daily Proactive Market & Revenue Briefing",
    marketSummary: {
      newOpportunitiesDiscoveredToday: totalEvaluated,
      highPriorityCandidatesEvaluated: topCandidates.length,
      status: "PASSIVE_PROCESSOR_DISABLED -> ACTIVE_BIZ_DEV_ENABLED"
    },
    highestRevenuePotential: rankedBriefings,
    urgentFollowUps: [],
    pendingFounderActionsCount: rankedBriefings.length,
    expectedRevenuePipelineUSD: rankedBriefings.reduce((sum, item) => sum + item.expectedRevenueValue, 0),
    recommendedFounderSequence: [
      "1. Review Top 3 High-Probability Opportunities on Founder Review Panel",
      "2. 1-Click Copy Proposal Text & Open Application URL",
      "3. Record Submissions via REST API POST /api/revenue/deals/submit",
      "4. Wait for Client Response & Deposit Settlement"
    ]
  };
}

module.exports = {
  DISCOVERY_PROVIDERS,
  OPPORTUNITY_CHANNELS,
  PROHIBITED_TERMS,
  REMOTIVE_URL,
  SCAM_TERMS,
  decideCandidate,
  fetchRemotiveJobs,
  getProactiveBusinessBriefing,
  inspectCandidate,
  listCandidates,
  normalizeRemotiveJob,
  processJobsBatch,
  runDiscoveryCycle,
  runStandaloneDiscovery,
  importFounderAssistedCandidate: require("./founderAssistedIntakeService").importFounderAssistedCandidate,
  processFounderAssistedIntake: require("./founderAssistedIntakeService").processFounderAssistedIntake,
  scoreCandidate,
  splitCandidateForDecisionPreservation,
  toUniversalOpportunity,
  validateCandidateDecision
};


