const mongoose = require("mongoose");
const { RevenueRecord, REVENUE_STATUSES } = require("../models/RevenueRecord");
const { SettlementLedger } = require("../models/SettlementLedger");
const { Opportunity } = require("../models/Opportunity");

function isObjectId(value) {
  return mongoose.Types.ObjectId.isValid(String(value || ""));
}

function parseDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function monthRange(monthOffset = 0) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + monthOffset + 1, 1);
  return { start, end };
}

function buildTrendString(currentValue, previousValue) {
  if (!previousValue) {
    return currentValue > 0 ? "+100%" : "+0%";
  }
  const pct = Math.round(((currentValue - previousValue) / previousValue) * 100);
  return `${pct >= 0 ? "+" : ""}${pct}%`;
}

async function findOpportunity(opportunityId) {
  if (!opportunityId) return null;
  if (!isObjectId(opportunityId)) {
    const error = new Error("Invalid opportunityId");
    error.statusCode = 400;
    throw error;
  }

  const opportunity = await Opportunity.findById(opportunityId);
  if (!opportunity) {
    const error = new Error("Opportunity not found");
    error.statusCode = 404;
    throw error;
  }

  return opportunity;
}

async function syncOpportunityStageForRevenue(record) {
  if (!record || !record.opportunityId || record.status !== "received") {
    return { updated: false };
  }

  const opportunity = await Opportunity.findById(record.opportunityId);
  if (!opportunity || ["won", "lost"].includes(opportunity.stage)) {
    return { updated: false };
  }

  const previousStage = opportunity.stage;
  opportunity.stage = "won";
  opportunity.probability = 100;
  await opportunity.save();

  return {
    updated: true,
    opportunityId: String(opportunity._id),
    previousStage,
    stage: opportunity.stage,
    title: opportunity.title
  };
}

function normalizeRevenueInput(payload = {}) {
  return {
    amount: payload.amount,
    currency: typeof payload.currency === "string" ? payload.currency.trim().toUpperCase() : undefined,
    source: typeof payload.source === "string" ? payload.source.trim() : undefined,
    client: typeof payload.client === "string" ? payload.client.trim() : undefined,
    status: payload.status,
    recordedAt: parseDate(payload.recordedAt),
    notes: typeof payload.notes === "string" ? payload.notes.trim() : undefined,
    opportunityId: payload.opportunityId
  };
}

function validateRevenueInput(payload, { partial = false } = {}) {
  const data = normalizeRevenueInput(payload);

  if (!partial || data.amount !== undefined) {
    if (typeof data.amount !== "number" || Number.isNaN(data.amount) || data.amount < 0) {
      const error = new Error("amount must be a non-negative number");
      error.statusCode = 400;
      throw error;
    }
  }

  if (!partial || data.client !== undefined) {
    if (!data.client) {
      const error = new Error("client is required");
      error.statusCode = 400;
      throw error;
    }
  }

  if (data.status !== undefined && !REVENUE_STATUSES.includes(data.status)) {
    const error = new Error(`status must be one of: ${REVENUE_STATUSES.join(", ")}`);
    error.statusCode = 400;
    throw error;
  }

  if (payload.recordedAt !== undefined && !data.recordedAt) {
    const error = new Error("recordedAt must be a valid ISO date");
    error.statusCode = 400;
    throw error;
  }

  return data;
}

async function listRevenue(filters = {}) {
  const query = {};

  if (filters.status && REVENUE_STATUSES.includes(filters.status)) {
    query.status = filters.status;
  }
  if (filters.source) {
    query.source = String(filters.source).trim();
  }
  if (filters.client) {
    query.client = { $regex: String(filters.client).trim(), $options: "i" };
  }
  if (filters.opportunityId) {
    if (!isObjectId(filters.opportunityId)) {
      const error = new Error("Invalid opportunityId");
      error.statusCode = 400;
      throw error;
    }
    query.opportunityId = filters.opportunityId;
  }

  const from = parseDate(filters.from);
  const to = parseDate(filters.to);
  if (filters.from && !from) {
    const error = new Error("Invalid from date");
    error.statusCode = 400;
    throw error;
  }
  if (filters.to && !to) {
    const error = new Error("Invalid to date");
    error.statusCode = 400;
    throw error;
  }
  if (from || to) {
    query.recordedAt = {};
    if (from) query.recordedAt.$gte = from;
    if (to) query.recordedAt.$lte = to;
  }

  const records = await RevenueRecord.find(query).sort({ recordedAt: -1, createdAt: -1 });
  return records.map((record) => record.toJSON());
}

async function createRevenue(payload) {
  const data = validateRevenueInput(payload);
  const linkedOpportunity = await findOpportunity(data.opportunityId);

  const record = await RevenueRecord.create({
    amount: data.amount,
    currency: data.currency || "INR",
    source: data.source || "direct",
    client: data.client,
    status: data.status || "received",
    recordedAt: data.recordedAt || new Date(),
    notes: data.notes || "",
    opportunityId: linkedOpportunity ? linkedOpportunity._id : undefined
  });

  const workflow = await syncOpportunityStageForRevenue(record);
  return {
    record: record.toJSON(),
    workflow
  };
}

async function updateRevenue(id, payload) {
  if (!isObjectId(id)) {
    const error = new Error("Invalid revenue id");
    error.statusCode = 400;
    throw error;
  }

  const record = await RevenueRecord.findById(id);
  if (!record) {
    const error = new Error("Revenue record not found");
    error.statusCode = 404;
    throw error;
  }

  const data = validateRevenueInput(payload, { partial: true });
  const linkedOpportunity = await findOpportunity(data.opportunityId);

  if (data.amount !== undefined) record.amount = data.amount;
  if (data.currency !== undefined) record.currency = data.currency || record.currency;
  if (data.source !== undefined) record.source = data.source || record.source;
  if (data.client !== undefined) record.client = data.client;
  if (data.status !== undefined) record.status = data.status;
  if (payload.recordedAt !== undefined) record.recordedAt = data.recordedAt;
  if (data.notes !== undefined) record.notes = data.notes;
  if (payload.opportunityId !== undefined) {
    record.opportunityId = linkedOpportunity ? linkedOpportunity._id : null;
  }

  await record.save();

  const workflow = await syncOpportunityStageForRevenue(record);
  return {
    record: record.toJSON(),
    workflow
  };
}

async function deleteRevenue(id) {
  if (!isObjectId(id)) {
    const error = new Error("Invalid revenue id");
    error.statusCode = 400;
    throw error;
  }

  const deleted = await RevenueRecord.findByIdAndDelete(id);
  if (!deleted) {
    const error = new Error("Revenue record not found");
    error.statusCode = 404;
    throw error;
  }

  return { ok: true };
}

async function getRevenueMetrics() {
  const [
    totalReceived,
    pending,
    refunded,
    totalRecords,
    byStatus,
    bySource,
    topClients,
    currentMonth,
    previousMonth,
    testTransactions
  ] = await Promise.all([
    RevenueRecord.aggregate([
      { $match: { status: "received", mode: { $ne: "test" } } },
      { $group: { _id: null, value: { $sum: "$amount" } } }
    ]),
    RevenueRecord.aggregate([
      { $match: { status: "pending", mode: { $ne: "test" } } },
      { $group: { _id: null, value: { $sum: "$amount" } } }
    ]),
    RevenueRecord.aggregate([
      { $match: { status: "refunded", mode: { $ne: "test" } } },
      { $group: { _id: null, value: { $sum: "$amount" } } }
    ]),
    RevenueRecord.countDocuments({ mode: { $ne: "test" } }),
    RevenueRecord.aggregate([
      { $match: { mode: { $ne: "test" } } },
      { $group: { _id: "$status", count: { $sum: 1 }, amount: { $sum: "$amount" } } }
    ]),
    RevenueRecord.aggregate([
      { $match: { mode: { $ne: "test" } } },
      { $group: { _id: "$source", amount: { $sum: "$amount" } } },
      { $sort: { amount: -1 } },
      { $limit: 8 }
    ]),
    RevenueRecord.aggregate([
      { $match: { mode: { $ne: "test" } } },
      { $group: { _id: "$client", amount: { $sum: "$amount" } } },
      { $sort: { amount: -1 } },
      { $limit: 5 }
    ]),
    RevenueRecord.aggregate([
      {
        $match: {
          status: "received",
          mode: { $ne: "test" },
          recordedAt: { $gte: monthRange(0).start, $lt: monthRange(0).end }
        }
      },
      { $group: { _id: null, value: { $sum: "$amount" } } }
    ]),
    RevenueRecord.aggregate([
      {
        $match: {
          status: "received",
          mode: { $ne: "test" },
          recordedAt: { $gte: monthRange(-1).start, $lt: monthRange(-1).end }
        }
      },
      { $group: { _id: null, value: { $sum: "$amount" } } }
    ]),
    RevenueRecord.aggregate([
      { $match: { mode: "test" } },
      { $group: { _id: null, count: { $sum: 1 }, amount: { $sum: "$amount" } } }
    ])
  ]);

  const receivedRevenue = totalReceived[0]?.value || 0;
  const pendingRevenue = pending[0]?.value || 0;
  const refundedRevenue = refunded[0]?.value || 0;
  const mtdRevenue = currentMonth[0]?.value || 0;
  const prevMonthRevenue = previousMonth[0]?.value || 0;

  return {
    totalRecords,
    receivedRevenue,
    pendingRevenue,
    refundedRevenue,
    mtdRevenue,
    prevMonthRevenue,
    trend: buildTrendString(mtdRevenue, prevMonthRevenue),
    byStatus: byStatus.map((row) => ({ status: row._id, count: row.count, amount: row.amount })),
    bySource: bySource.map((row) => ({ source: row._id || "unknown", amount: row.amount })),
    topClients: topClients.map((row) => ({ client: row._id || "unknown", amount: row.amount })),
    testTransactions: {
      count: testTransactions[0]?.count || 0,
      amount: testTransactions[0]?.amount || 0,
      excludedFromReceivedRevenue: true
    }
  };
}

async function getRevenueAnalytics({ monthsBack = 6 } = {}) {
  const safeMonths = Math.max(1, Math.min(24, Number(monthsBack) || 6));
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - (safeMonths - 1), 1);

  const grouped = await RevenueRecord.aggregate([
    { $match: { status: "received", recordedAt: { $gte: start } } },
    {
      $group: {
        _id: { year: { $year: "$recordedAt" }, month: { $month: "$recordedAt" } },
        amount: { $sum: "$amount" },
        count: { $sum: 1 }
      }
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } }
  ]);

  const monthlySeries = [];
  for (let i = 0; i < safeMonths; i += 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - (safeMonths - 1 - i), 1);
    const row = grouped.find(
      (item) => item._id.year === date.getFullYear() && item._id.month === date.getMonth() + 1
    );

    monthlySeries.push({
      label: date.toLocaleString("en-US", { month: "short" }),
      amount: row?.amount || 0,
      count: row?.count || 0
    });
  }

  const metrics = await getRevenueMetrics();

  return {
    monthlySeries,
    bySource: metrics.bySource,
    topClients: metrics.topClients
  };
}

async function getSettlementSummary() {
  const metrics = await getRevenueMetrics();
  const [{ settled } = {}] = await SettlementLedger.aggregate([
    { $match: { status: "settled" } },
    { $group: { _id: null, value: { $sum: "$netAmount" } } }
  ]);
  const [{ inFlight } = {}] = await SettlementLedger.aggregate([
    { $match: { status: { $in: ["pending", "eligible", "processing"] } } },
    { $group: { _id: null, value: { $sum: "$netAmount" } } }
  ]);
  const settledAmount = settled?.value || 0;
  const inFlightAmount = inFlight?.value || 0;
  const settlementBase = settledAmount + inFlightAmount;
  const settlementRate = settlementBase > 0 ? Math.round((settledAmount / settlementBase) * 100) : 0;

  const recentSettlements = await SettlementLedger.find({ status: "settled" })
    .sort({ settledAt: -1 })
    .limit(5);

  return {
    pendingSettlementAmount: inFlightAmount,
    pendingSettlementCount: await SettlementLedger.countDocuments({ status: { $in: ["pending", "eligible", "processing"] } }),
    settledAmount,
    settledCount: await SettlementLedger.countDocuments({ status: "settled" }),
    bankReconciledAmount: (await SettlementLedger.aggregate([
      { $match: { status: "settled", bankReconciled: true } },
      { $group: { _id: null, value: { $sum: "$netAmount" } } }
    ]))[0]?.value || 0,
    refundedAmount: metrics.refundedRevenue,
    settlementRate,
    recentSettlements: recentSettlements.map((ledger) => ledger.toJSON())
  };
}

module.exports = {
  listRevenue,
  createRevenue,
  updateRevenue,
  deleteRevenue,
  getRevenueMetrics,
  getRevenueAnalytics,
  getSettlementSummary,
  REVENUE_STATUSES
};
