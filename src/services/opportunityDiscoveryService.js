const { DiscoveryCandidate } = require("../models/DiscoveryCandidate");
const { IncomeGoal } = require("../models/IncomeGoal");

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
  return {
    missionId,
    source: "remotive",
    externalId: String(job.id),
    title: plainText(job.title),
    company: plainText(job.company_name),
    category: plainText(job.category || "remote_job"),
    location: plainText(job.candidate_required_location || "Worldwide"),
    url: String(job.url || ""),
    sourceAttribution: "Remotive",
    publishedAt: job.publication_date || null,
    salaryText: plainText(job.salary),
    tags: Array.isArray(job.tags) ? job.tags.map(plainText).filter(Boolean).slice(0, 20) : [],
    score: scoreCandidate(job),
    verification: {
      sourceVerified: true,
      originalLinkPresent: /^https:\/\//i.test(String(job.url || "")),
      prohibitedContentClear: !inspection.rejectionReasons.includes("prohibited_or_age_restricted_category"),
      scamSignalsClear: !inspection.rejectionReasons.includes("scam_signal_detected")
    },
    status: inspection.accepted ? "ranked" : "rejected",
    rejectionReasons: inspection.rejectionReasons,
    requiresFounderApproval: true
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
  const summary = { missionsScanned: missions.length, fetched: 0, ranked: 0, rejected: 0, errors: [] };
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
      const result = await DiscoveryCandidate.updateOne({ missionId: mission._id, source: candidate.source, externalId: candidate.externalId }, { $set: candidate, $setOnInsert: { discoveredAt: new Date() } }, { upsert: true });
      if (result.upsertedCount) cycleCount += 1;
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
  query.status = filters.status || "ranked";
  const limit = Math.min(100, Math.max(1, Number(filters.limit) || 50));
  const items = await DiscoveryCandidate.find(query).sort({ score: -1, publishedAt: -1 }).limit(limit);
  return items.map((item) => item.toJSON());
}

module.exports = { PROHIBITED_TERMS, REMOTIVE_URL, SCAM_TERMS, inspectCandidate, listCandidates, normalizeRemotiveJob, runDiscoveryCycle, scoreCandidate };
