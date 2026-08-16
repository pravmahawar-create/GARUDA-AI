const { DiscoveryCandidate, OPPORTUNITY_CHANNELS } = require("../models/DiscoveryCandidate");
const { IncomeGoal } = require("../models/IncomeGoal");
const mongoose = require("mongoose");
const { founderApprovalGranted } = require("./revenueConversionService");
const revenueOrchestrator = require("./revenueOrchestratorService");
const { classifySourceTruth } = require("./revenueSourceTruthService");
const revenueValueModel = require("./revenueValueModelService");

const REMOTIVE_URL = "https://remotive.com/api/remote-jobs?limit=100";
const SOURCE_TIMEOUT_MS = 10000;
const PROHIBITED_TERMS = ["casino", "gambling", "betting", "adult content", "tobacco", "vape", "alcohol sales"];
const SCAM_TERMS = ["pay upfront", "registration fee", "training fee", "telegram only", "whatsapp only", "guaranteed income"];
// A dedicated, clearly-identifiable continuous-discovery IncomeGoal. Used when
// no active continuous-discovery mission exists, so the discovery worker keeps
// running against a REAL mission (never a phantom id) and every candidate
// attaches to a real IncomeGoal. This is an operational mission, NOT a business
// revenue goal: targetAmount stays at the schema minimum and the title + audit
// trail make that explicit.
const CONTINUOUS_DISCOVERY_MISSION_TITLE = "GARUDA Continuous Discovery (operations only)";
// TTL used for cycle-status docs when there is no IncomeGoal to persist to.
const DISCOVERY_CYCLE_COLLECTION = "discoverycyclestatuses";

/**
 * Deterministic, idempotent find-or-create of the dedicated continuous-discovery
 * mission. Repeated calls reuse the same mission; concurrent cycles never create
 * duplicates because the mission is keyed by title + continuousDiscovery flag.
 * Returns the mission document, or null when MongoDB is unavailable.
 */
async function ensureContinuousDiscoveryMission(options = {}) {
  const ready = (mongoose.connection && mongoose.connection.readyState === 1) || options.bypassReady === true;
  if (!ready) return null;
  try {
    let mission = await IncomeGoal.findOne({ title: CONTINUOUS_DISCOVERY_MISSION_TITLE, "missionPolicy.continuousDiscovery": true });
    if (!mission) {
      mission = await IncomeGoal.create({
        title: CONTINUOUS_DISCOVERY_MISSION_TITLE,
        targetAmount: 1,
        achievedAmount: 0,
        currency: "INR",
        status: "active",
        discovery: { status: "waiting", lastCandidateCount: 0, totalCandidateCount: 0 },
        auditTrail: [{
          action: "continuous_discovery_mission_auto_created",
          actor: "garuda",
          note: "Operational mission to keep discovery running. Not a business revenue goal; targetAmount is schema-minimum placeholder.",
          at: new Date()
        }]
      });
    }
    return mission;
  } catch {
    return null;
  }
}

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

  const estimate = revenueValueModel.estimateValueFromEvidence(sourceRecord.salaryText, { valueType: "salary_contract_compensation" });
  const rank = revenueValueModel.rankFromCandidate({
    opportunityChannel: selfEarningEligible ? "garuda_deliverable" : (humanIdentityRequired ? "human_opportunity_only" : "no_verified_capability_match"),
    salaryText: sourceRecord.salaryText,
    outcomeDeliverability: { canGarudaDeliver: !humanIdentityRequired },
    verification: { sourceVerified: sourceTruth.sourceVerified, directClientWorkEvidence: sourceTruth.directClientWorkEvidence }
  });
  const priority = estimate.status === "ESTIMATED"
    ? (revenueValueModel.classifyPriority(estimate.estimatedINR)?.priority || "UNMEASURED")
    : "UNMEASURED";

  return {
    missionId,
    ...sourceRecord,
    score: scoreCandidate(job),
    priority,
    valueModel: {
      status: estimate.status,
      rawValue: estimate.rawValue,
      estimatedINR: estimate.estimatedINR,
      valueType: estimate.valueType,
      payUnit: estimate.payUnit,
      confidence: estimate.confidence,
      source: estimate.source,
      note: estimate.note,
      bandPriority: priority,
      bandLabel: revenueValueModel.priorityLabel(priority),
      rank: rank.rank,
      factors: rank.factors,
      rankedAt: new Date()
    },
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

async function persistCycleStatus({ missionId, status, intervalMs, summary, error }) {
  const db = mongoose.connection.db;
  if (!db) return;
  const doc = {
    missionId: mongoose.Types.ObjectId.isValid(missionId) ? mongoose.Types.ObjectId(missionId) : missionId,
    status,
    lastCycleAt: new Date(),
    nextCycleAt: new Date(Date.now() + intervalMs),
    fetched: summary.fetched,
    ranked: summary.ranked,
    rejected: summary.rejected,
    channels: summary.channels,
    errors: summary.errors,
    lastError: error || "",
    updatedAt: new Date()
  };
  try {
    await db.collection(DISCOVERY_CYCLE_COLLECTION).updateOne(
      { missionId: doc.missionId },
      { $set: doc },
      { upsert: true }
    );
  } catch {}
}

async function runDiscoveryCycle(options = {}) {
  const intervalMs = Number(options.intervalMs || process.env.DISCOVERY_INTERVAL_MS || 900000);
  // NOTE: continuous discovery is NOT gated on an active IncomeGoal. When no
  // active continuous-discovery mission exists, a dedicated operations mission
  // is found-or-created idempotently so discovery keeps running against a REAL
  // mission and candidates never attach to a phantom id. Idempotent upserts by
  // (missionId, source, externalId) prevent duplicates.
  const missions = await IncomeGoal.find({ status: "active", "missionPolicy.continuousDiscovery": true });
  let effectiveMissions = missions.map((mission) => mission._id);
  let fallbackMission = null;
  if (!effectiveMissions.length) {
    fallbackMission = await ensureContinuousDiscoveryMission();
    if (fallbackMission) effectiveMissions = [fallbackMission._id];
  }
  const summary = {
    missionsScanned: effectiveMissions.length,
    activeMissionCount: missions.length,
    mode: missions.length ? "active_mission" : (fallbackMission ? "fallback_continuous" : "no_mission"),
    fetched: 0,
    ranked: 0,
    rejected: 0,
    channels: Object.fromEntries(OPPORTUNITY_CHANNELS.map((channel) => [channel, 0])),
    errors: []
  };
  let jobs;
  try { jobs = await fetchRemotiveJobs(); summary.fetched = jobs.length; }
  catch (error) {
    summary.errors.push(error.message);
    for (const missionId of effectiveMissions) {
      await persistCycleStatus({ missionId, status: "degraded", intervalMs, summary, error: error.message });
    }
    return summary;
  }
  if (!effectiveMissions.length) {
    summary.errors.push("no continuous-discovery mission available");
    return summary;
  }

  for (const missionId of effectiveMissions) {
    let cycleCount = 0;
    for (const job of jobs) {
      let candidate;
      try {
        candidate = normalizeRemotiveJob(job, missionId);
      } catch (error) {
        summary.errors.push(`normalize failed: ${error.message}`);
        continue;
      }
      const identity = { missionId, source: candidate.source, externalId: candidate.externalId };
      try {
        let result = await DiscoveryCandidate.updateOne({ ...identity, status: { $in: ["ranked", "rejected"] } }, { $set: candidate });
        if (!result.matchedCount) {
          const update = splitCandidateForDecisionPreservation(candidate);
          result = await DiscoveryCandidate.updateOne(identity, { $set: update.refreshable, $setOnInsert: update.insertOnly }, { upsert: true });
        }
        if (result.upsertedCount) cycleCount += 1;
      } catch (error) {
        summary.errors.push(`persist failed: ${error.message}`);
        continue;
      }
      summary.channels[candidate.opportunityChannel] += 1;
      if (candidate.status === "ranked") summary.ranked += 1; else summary.rejected += 1;
    }
    const totalCandidateCount = await DiscoveryCandidate.countDocuments({ missionId, status: "ranked" });
    summary.candidatesTotal = totalCandidateCount;
    await persistCycleStatus({ missionId, status: "healthy", intervalMs, summary });
    let mission = null;
    try {
      if (mongoose.Types.ObjectId.isValid(String(missionId))) {
        mission = await IncomeGoal.findById(missionId);
      }
    } catch {
      mission = null;
    }
    if (mission) {
      await IncomeGoal.updateOne({ _id: mission._id }, { $set: { "discovery.status": "healthy", "discovery.lastCycleAt": new Date(), "discovery.nextCycleAt": new Date(Date.now() + intervalMs), "discovery.lastCandidateCount": cycleCount, "discovery.totalCandidateCount": totalCandidateCount, "discovery.lastError": "" } });
    }
  }
  return summary;
}

// Composite, priority-aware ranking for candidate listings. Precedence:
// 1) founder-approved/actionable state, 2) verified buying intent, 3) commercial
// priority band, 4) evidence-backed commercial value (NOT raw INR), 5) urgency,
// 6) qualification/rank score. A well-verified low-band buyer outranks a
// weak-evidence high-value listing, and UNMEASURED/UNKNOWN stays bottom.
const PRIORITY_BAND_WEIGHTS = Object.freeze({
  STRATEGIC: 3000,
  VERY_HIGH: 2400,
  HIGH: 2000,
  NORMAL: 1000,
  LOW: 500,
  LOW_VALUE: 200,
  UNMEASURED: 0,
  UNKNOWN: 0
});

function candidatePrioritySortValue(candidate = {}) {
  let value = 0;
  const status = String(candidate.status || "ranked");
  if (status === "approved") value += 100000;
  else if (status === "ranked") value += 80000;

  const channel = candidate.opportunityChannel || "";
  const verification = candidate.verification || {};
  if (channel === "garuda_deliverable" || verification.garudaExecutionEligible === true) value += 12000;
  else if (channel === "human_opportunity_only") value += 5000;
  if (verification.sourceVerified === true) value += 3000;
  if (verification.directClientWorkEvidence === true) value += 2000;

  value += PRIORITY_BAND_WEIGHTS[candidate.priority] || 0;

  const vm = candidate.valueModel || {};
  if (vm.status === "ESTIMATED" && Number(vm.estimatedINR) > 0) {
    value += Math.min(1000, Math.round(Math.log10(Number(vm.estimatedINR)) * 160));
  }

  const published = Date.parse(candidate.publishedAt || "");
  if (Number.isFinite(published)) {
    const ageDays = Math.max(0, (Date.now() - published) / 86400000);
    value += Math.max(0, 400 - Math.round(ageDays * 4));
  }

  value += Math.min(1000, Math.round(Number(vm.rank) || Number(candidate.score) || 0));
  return value;
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
  const items = await DiscoveryCandidate.find(query);
  const sorted = items.sort((a, b) => {
    const byPriority = candidatePrioritySortValue(b) - candidatePrioritySortValue(a);
    if (byPriority !== 0) return byPriority;
    return (Number(b.score) || 0) - (Number(a.score) || 0);
  });
  return sorted.slice(0, limit).map((item) => item.toJSON());
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
  if (payload.status === "approved" && !candidate.opportunityId) {
    // Governed Candidate -> Opportunity handoff. Opportunity inherits the value
    // model; only approved candidates may enter the pipeline.
    const opportunity = await createOpportunityFromCandidate(candidate.toJSON(), { actor: context.actor || "founder", note: payload.note });
    candidate.opportunityId = opportunity.id;
    candidate.valueModel.status = candidate.valueModel.status === "UNKNOWN" ? "UNKNOWN" : candidate.valueModel.status;
  }
  await candidate.save();
  const result = candidate.toJSON();
  if (payload.status === "approved" && candidate.opportunityId) {
    try {
      result.opportunity = await require("./opportunityService").getOpportunityById(candidate.opportunityId);
    } catch {
      result.opportunity = null;
    }
  }
  return result;
}

// Build a governed Opportunity from an approved DiscoveryCandidate. The value
// model (priority / rank / estimate) is carried over; no fabricated figures.
async function createOpportunityFromCandidate(candidate, context = {}) {
  const opportunityService = require("./opportunityService");
  const estimate = candidate.valueModel && candidate.valueModel.estimatedINR != null
    ? candidate.valueModel
    : revenueValueModel.estimateValueFromEvidence(candidate.salaryText || "", { valueType: "estimated_project_value" });
  const priority = estimate.estimatedINR != null
    ? (revenueValueModel.classifyPriority(estimate.estimatedINR)?.priority || "UNMEASURED")
    : "UNMEASURED";
  const payload = {
    title: candidate.title,
    client: candidate.company || candidate.sourceAttribution || "Client Team",
    source: `discovery:${candidate.source || "remotive"}`,
    stage: "prospect",
    potentialValue: estimate.estimatedINR || 0,
    currency: "INR",
    probability: 25,
    notes: `Approved discovery candidate. Source: ${candidate.url || "n/a"}. Value note: ${estimate.note || ""} Decision by ${context.actor || "founder"}.${context.note ? ` ${context.note}` : ""}`,
    tags: ["discovery", candidate.source || "remotive", priority].filter(Boolean),
    priority,
    valueModel: {
      status: estimate.estimatedINR != null ? "ESTIMATED" : "UNKNOWN",
      rawValue: estimate.rawValue || "",
      estimatedINR: estimate.estimatedINR,
      valueType: estimate.valueType || "estimated_project_value",
      payUnit: estimate.payUnit || "unknown",
      confidence: estimate.confidence || 0,
      source: estimate.source || "source_evidence_missing",
      note: estimate.note || "",
      bandPriority: priority,
      bandLabel: revenueValueModel.priorityLabel(priority),
      rank: candidate.valueModel?.rank || 0,
      factors: candidate.valueModel?.factors || [],
      rankedAt: candidate.valueModel?.rankedAt || null
    },
    origin: "discovery",
    candidateId: candidate._id
  };
  const created = await opportunityService.createOpportunity(payload);
  return created;
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

function processJobsBatch(rawJobs = [], missionId = null) {
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

async function persistCandidatesIfMongoAvailable(candidates = [], missionId = null) {
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
      jobs = [];
    }
  }

  let missionId = options.missionId || null;
  if (!missionId) {
    const mission = await ensureContinuousDiscoveryMission();
    missionId = mission ? String(mission._id) : null;
  }
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
  CONTINUOUS_DISCOVERY_MISSION_TITLE,
  DISCOVERY_CYCLE_COLLECTION,
  DISCOVERY_PROVIDERS,
  OPPORTUNITY_CHANNELS,
  PROHIBITED_TERMS,
  REMOTIVE_URL,
  SCAM_TERMS,
  createOpportunityFromCandidate,
  candidatePrioritySortValue,
  decideCandidate,
  ensureContinuousDiscoveryMission,
  fetchRemotiveJobs,
  getProactiveBusinessBriefing,
  inspectCandidate,
  listCandidates,
  normalizeRemotiveJob,
  persistCycleStatus,
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


