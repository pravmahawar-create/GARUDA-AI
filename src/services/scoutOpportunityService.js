const mongoose = require("mongoose");
const { ScoutOpportunity, SCOUT_STATUSES } = require("../models/ScoutOpportunity");
const { scoreOpportunity, urgencyFromText, parseBudgetText } = require("./scoutScoring");
const { buildProposal } = require("./scoutProposals");

const memoryStore = new Map();

function mongoReady() {
  return mongoose.connection && mongoose.connection.readyState === 1;
}

function normalizeCreate(data = {}) {
  const budgetText = String(data.budgetText || "").trim();
  const parsed = Number(data.budget);
  const budget = Number.isFinite(parsed)
    ? parsed
    : budgetText
      ? parseBudgetText(budgetText)
      : null;

  return {
    platform: String(data.platform || "manual").trim(),
    title: String(data.title || "").trim(),
    client: String(data.client || "").trim(),
    url: String(data.url || "").trim(),
    budgetText,
    budget,
    currency: String(data.currency || "USD").trim().toUpperCase(),
    deadlineText: String(data.deadlineText || "").trim(),
    categoryId: String(data.categoryId || "").trim(),
    notes: String(data.notes || "").trim(),
    source: String(data.source || "manual").trim(),
    status: "found",
    score: 0,
    scoreFactors: null,
    verdict: "LOW",
    proposalText: "",
    submissionUrl: "",
    revenueReceived: 0,
    decidedAt: null
  };
}

function pushHistory(record, status) {
  const item = { status, at: new Date() };
  if (Array.isArray(record.history)) {
    record.history.push(item);
  } else {
    record.history = [item];
  }
}

function enrichForScoring(input = {}) {
  const budget =
    Number.isFinite(Number(input.budget)) && String(input.budget).trim() !== ""
      ? Number(input.budget)
      : parseBudgetText(String(input.budgetText || ""));

  const urgency = Number.isFinite(Number(input.urgency))
    ? Number(input.urgency)
    : urgencyFromText(String(input.deadlineText || input.urgencyText || ""));

  return {
    budget,
    urgency,
    competition: input.competition ?? 5,
    paymentReliability: input.paymentReliability ?? 5,
    deliveryComplexity: input.deliveryComplexity ?? 5
  };
}

async function getRecord(id) {
  if (mongoReady()) {
    if (!mongoose.Types.ObjectId.isValid(String(id || ""))) return null;
    const doc = await ScoutOpportunity.findById(id);
    return doc ? doc.toJSON() : null;
  }
  return memoryStore.get(String(id)) || null;
}

function toJson(doc) {
  return doc && typeof doc.toJSON === "function" ? doc.toJSON() : doc;
}

function toMongoDoc(record) {
  const { id, ...plain } = record;
  return { ...plain, history: Array.isArray(plain.history) ? plain.history : [] };
}

async function createOpportunity(payload = {}) {
  const record = { ...normalizeCreate(payload) };
  record.history = [];
  pushHistory(record, "found");

  if (mongoReady()) {
    const doc = await ScoutOpportunity.create(toMongoDoc(record));
    return toJson(doc);
  }

  const id = `mem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  record.id = id;
  memoryStore.set(id, record);
  return { ...record };
}

async function listOpportunities(filters = {}) {
  if (mongoReady()) {
    const query = {};
    if (filters.status && SCOUT_STATUSES.includes(filters.status)) query.status = filters.status;
    if (filters.platform) query.platform = String(filters.platform).trim();
    if (filters.categoryId) query.categoryId = String(filters.categoryId).trim();
    const docs = await ScoutOpportunity.find(query)
      .sort({ createdAt: -1 })
      .limit(Math.min(200, Number(filters.limit) || 100));
    return docs.map(toJson);
  }

  const all = Array.from(memoryStore.values());
  const filtered = all.filter((item) =>
    filters.status ? item.status === filters.status : true
  );
  return filtered
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, Number(filters.limit) || 200);
}

async function getOpportunity(id) {
  const rec = await getRecord(id);
  return rec ? { ...rec } : null;
}

async function scoreOpportunityRecord(id, input = {}) {
  const current = await getRecord(id);
  if (!current) throw Object.assign(new Error("Opportunity not found"), { statusCode: 404 });

  const enriched = enrichForScoring({
    ...input,
    budgetText: input.budgetText || current.budgetText,
    deadlineText: input.deadlineText || current.deadlineText
  });
  const assessment = scoreOpportunity(enriched);

  const update = {
    score: assessment.score,
    scoreFactors: assessment.factors,
    verdict: assessment.verdict,
    budget: enriched.budget,
    budgetText: String(input.budgetText || current.budgetText || "").trim(),
    deadlineText: String(input.deadlineText || current.deadlineText || "").trim(),
    status: "scored"
  };

  if (mongoReady()) {
    const doc = await ScoutOpportunity.findByIdAndUpdate(
      id,
      { $set: update, $push: { history: { status: "scored", at: new Date() } } },
      { new: true }
    );
    if (!doc) throw Object.assign(new Error("Opportunity not found"), { statusCode: 404 });
    return { ...toJson(doc), assessment };
  }

  const rec = memoryStore.get(String(id));
  if (!rec) throw Object.assign(new Error("Opportunity not found"), { statusCode: 404 });
  pushHistory(rec, "scored");
  Object.assign(rec, update);
  return { ...rec, assessment };
}

async function draftProposal(id) {
  const current = await getRecord(id);
  if (!current) throw Object.assign(new Error("Opportunity not found"), { statusCode: 404 });
  if (!current.categoryId) {
    throw Object.assign(new Error("categoryId is required before drafting"), { statusCode: 400 });
  }

  const built = buildProposal(current.categoryId, {
    clientName: current.client,
    project: current.title,
    budgetText: current.budgetText,
    timeline: current.deadlineText
  });
  if (!built) {
    throw Object.assign(new Error("Unknown categoryId"), { statusCode: 400 });
  }

  return mutateStatus(id, "drafted", {
    proposalText: built.proposal,
    budgetText: built.budget || current.budgetText
  });
}

async function approveOpportunity(id, context = {}) {
  requireFounderApproval(context.founderApproved, "Founder approval is required to approve");
  return mutateStatus(id, "approved", {});
}

async function submitOpportunity(id, context = {}) {
  requireFounderApproval(context.founderApproved, "Founder approval is required before submit");
  return mutateStatus(id, "submitted", { submissionUrl: String(context.submissionUrl || "").trim() });
}

async function recordOutcome(id, context = {}) {
  const status = String(context.status || "").trim();
  if (!["interview", "won", "lost", "dismissed", "paid"].includes(status)) {
    throw Object.assign(new Error("status must be one of interview, won, lost, dismissed, paid"), { statusCode: 400 });
  }
  const revenue = Number(context.revenue) || 0;
  if (status === "paid" && revenue <= 0) {
    throw Object.assign(new Error("paid requires a revenueReceived amount"), { statusCode: 400 });
  }
  return mutateStatus(id, status, { revenueReceived: revenue, decidedAt: new Date() });
}

async function mutateStatus(id, status, extra = {}) {
  if (mongoReady()) {
    const doc = await ScoutOpportunity.findByIdAndUpdate(
      id,
      { $set: { status, ...extra }, $push: { history: { status, at: new Date() } } },
      { new: true }
    );
    if (!doc) throw Object.assign(new Error("Opportunity not found"), { statusCode: 404 });
    return toJson(doc);
  }

  const rec = memoryStore.get(String(id));
  if (!rec) throw Object.assign(new Error("Opportunity not found"), { statusCode: 404 });
  pushHistory(rec, status);
  Object.assign(rec, { status, ...extra });
  return { ...rec };
}

function requireFounderApproval(value, message) {
  if (value !== true) {
    throw Object.assign(new Error(message), { statusCode: 403 });
  }
}

async function getDashboard() {
  const all = await listOpportunities({});
  const statusCount = {};
  for (const status of SCOUT_STATUSES) statusCount[status] = 0;
  for (const item of all) {
    if (statusCount[item.status] !== undefined) statusCount[item.status] += 1;
  }

  const activeStatuses = ["found", "scored", "drafted", "approved", "submitted", "interview", "won", "paid"];
  const pipelineStatuses = ["submitted", "interview", "won"];

  return {
    funnel: {
      opportunitiesFound: activeStatuses.reduce((sum, status) => sum + (statusCount[status] || 0), 0),
      shortlisted: (statusCount.scored || 0) + (statusCount.drafted || 0) + (statusCount.approved || 0),
      proposalsReady: (statusCount.drafted || 0) + (statusCount.approved || 0),
      submitted: statusCount.submitted || 0,
      interviews: statusCount.interview || 0,
      won: statusCount.won || 0,
      revenueReceived: all.reduce((sum, item) => sum + (Number(item.revenueReceived) || 0), 0)
    },
    pipelinePotentialUSD: all
      .filter((item) => pipelineStatuses.includes(item.status))
      .reduce((sum, item) => sum + (Number(item.budget) || 0), 0),
    totalOpportunities: all.length
  };
}

module.exports = {
  SCOUT_STATUSES,
  approveOpportunity,
  createOpportunity,
  draftProposal,
  getDashboard,
  getOpportunity,
  listOpportunities,
  recordOutcome,
  scoreOpportunityRecord,
  setStatus: mutateStatus,
  submitOpportunity
};