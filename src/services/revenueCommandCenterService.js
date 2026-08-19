const mongoose = require("mongoose");
const { DiscoveryCandidate, resolveEarningMode, resolveContractPermission } = require("../models/DiscoveryCandidate");
const { RevenueAcquisitionCase } = require("../models/RevenueAcquisitionCase");
const { RevenueWorkIntake } = require("../models/RevenueWorkIntake");
const { RevenueRecord } = require("../models/RevenueRecord");
const { SettlementLedger } = require("../models/SettlementLedger");
const { RevenueExecutionMission } = require("../models/RevenueExecutionMission");
const { RevenueProductionDelivery } = require("../models/RevenueProductionDelivery");
const { PermissionReview } = require("../models/PermissionReview");
const { PaymentReconciliationItem } = require("../models/PaymentReconciliationItem");
const { runStandaloneDiscovery } = require("./opportunityDiscoveryService");
const ProjectMemoryEngine = require("../../scripts/dev-agent/core/ProjectMemoryEngine");

function parseMonetaryValueDetailed(salaryInput = "", options = {}) {
  const usdToInrRate = options.usdToInrRate || 83;
  const rawValue = String(salaryInput || "").trim();

  if (!rawValue || rawValue === "0" || rawValue === "null" || rawValue === "undefined") {
    return {
      rawValue: rawValue || "0",
      minUSD: 0,
      maxUSD: 0,
      estimatedUSD: 0,
      minINR: 0,
      maxINR: 0,
      estimatedINR: 0,
      payUnit: "unknown",
      confidence: 0,
      warning: "Zero or missing salary value"
    };
  }

  // 1. Correct malformed comma values like "$31,2k" -> "$31.2k"
  let cleaned = rawValue.replace(/(\d+),(\d{1,2})k/gi, "$1.$2k");

  // 2. Identify payUnit
  let payUnit = "annual";
  let warning = null;
  let confidence = 90;

  if (/\b(hour|hourly|hr)\b|\/hr|\/hour/i.test(cleaned)) {
    payUnit = "hourly";
  } else if (/\b(month|monthly|mo)\b|\/mo|\/month/i.test(cleaned)) {
    payUnit = "monthly";
  } else if (/\b(fixed|project|flat|deliverable)\b/i.test(cleaned)) {
    payUnit = "fixed_project";
  } else if (/\b(yr|year|annual|annually)\b/i.test(cleaned) || /k\b/i.test(cleaned)) {
    payUnit = "annual";
  } else {
    payUnit = "unknown";
  }

  // 3. Normalize inner number commas like 100,000 -> 100000
  const normalizedStr = cleaned.replace(/(\d+),(\d{3})/g, "$1$2");

  // 4. Extract numeric values with optional k/m multipliers
  const matches = normalizedStr.match(/(\d+(?:\.\d+)?)\s*(k|m)?/gi);

  if (!matches || !matches.length) {
    return {
      rawValue,
      minUSD: 0,
      maxUSD: 0,
      estimatedUSD: 0,
      minINR: 0,
      maxINR: 0,
      estimatedINR: 0,
      payUnit: "unknown",
      confidence: 0,
      warning: "Non-numeric or malformed salary text"
    };
  }

  const valuesUSD = matches
    .map((m) => {
      const numMatch = m.match(/(\d+(?:\.\d+)?)/);
      if (!numMatch) return 0;
      let num = parseFloat(numMatch[1]);
      if (/k/i.test(m) && num < 1000) {
        num = num * 1000;
      } else if (/m/i.test(m) && num < 1000) {
        num = num * 1000000;
      }
      return num;
    })
    .filter((v) => !isNaN(v) && v > 0);

  if (!valuesUSD.length) {
    return {
      rawValue,
      minUSD: 0,
      maxUSD: 0,
      estimatedUSD: 0,
      minINR: 0,
      maxINR: 0,
      estimatedINR: 0,
      payUnit: "unknown",
      confidence: 0,
      warning: "Non-numeric or malformed salary text"
    };
  }

  const minUSD = Math.min(...valuesUSD);
  const maxUSD = Math.max(...valuesUSD);

  let estimatedUSD = 0;

  if (payUnit === "hourly") {
    // Requirements 4 & 5: Never add hourly rates directly into annual pipeline revenue
    estimatedUSD = options.estimatedHours ? Math.round(options.estimatedHours * ((minUSD + maxUSD) / 2)) : 0;
    warning = options.estimatedHours ? null : "Hourly rate excluded from pipeline total without estimated hours";
  } else if (payUnit === "monthly") {
    estimatedUSD = Math.round(((minUSD + maxUSD) / 2) * 12);
  } else {
    estimatedUSD = Math.round((minUSD + maxUSD) / 2);
  }

  const minINR = Math.round(minUSD * usdToInrRate);
  const maxINR = Math.round(maxUSD * usdToInrRate);
  const estimatedINR = Math.round(estimatedUSD * usdToInrRate);

  return {
    rawValue,
    minUSD,
    maxUSD,
    estimatedUSD,
    minINR,
    maxINR,
    estimatedINR,
    payUnit,
    confidence,
    warning
  };
}

function parseMonetaryValue(salaryInput = "", options = {}) {
  if (typeof salaryInput === "number") return salaryInput;
  const detailed = parseMonetaryValueDetailed(salaryInput, options);
  return detailed.estimatedUSD;
}

function calculateNextHighestRoiAction(metrics) {
  if (metrics.founderApprovalsPending > 0) {
    return {
      action: "REVIEW_PENDING_PROPOSALS",
      priority: "CRITICAL",
      reason: `${metrics.founderApprovalsPending} proposal(s) awaiting Founder authorization. Authorizing handoff enables immediate outreach execution.`
    };
  }
  if (metrics.garudaDeliverableOpportunities > 0 && metrics.proposalReadyOpportunities === 0) {
    return {
      action: "GENERATE_AUTOMATED_PROPOSALS",
      priority: "HIGH",
      reason: `${metrics.garudaDeliverableOpportunities} verified GARUDA-deliverable lead(s) ready for automated technical proposal synthesis.`
    };
  }
  if (metrics.opportunitiesDiscovered === 0) {
    return {
      action: "RUN_LIVE_OPPORTUNITY_DISCOVERY",
      priority: "HIGH",
      reason: "Revenue pipeline is empty. Execute live opportunity discovery cycle across remote job boards and client work intake."
    };
  }
  if (metrics.submittedProposals > 0 && metrics.clientResponses === 0) {
    return {
      action: "MONITOR_CLIENT_PORTAL_RESPONSES",
      priority: "MEDIUM",
      reason: `${metrics.submittedProposals} proposal(s) submitted to client portals. Monitor for client award notices or revision requests.`
    };
  }
  return {
    action: "EXPAND_DISCOVERY_PROVIDERS",
    priority: "MEDIUM",
    reason: "Maintain continuous discovery flow across CRM intake and direct client work order channels."
  };
}

const { defaultQueueManager } = require("./revenueOutreachService");

async function getRevenueMetrics(options = {}) {
  const mongoReady = mongoose.connection && mongoose.connection.readyState === 1;

  let candidates = [];
  let cases = [];
  let intakes = [];

  if (mongoReady) {
    candidates = await DiscoveryCandidate.find({}).lean();
    cases = await RevenueAcquisitionCase.find({}).lean();
    intakes = await RevenueWorkIntake.find({}).lean();
  } else {
    // Persistent file memory fallback when MongoDB is offline
    const memoryEngine = new ProjectMemoryEngine({
      memoryFilePath: options.memoryFilePath
    });
    const memoryData = memoryEngine.loadMemory();

    // Run standalone discovery to gather real local candidates if candidates array is empty
    const discoveryResult = await runStandaloneDiscovery({ jobs: options.sampleJobs || [] });
    candidates = discoveryResult.topCandidates || [];
  }

  const opportunitiesDiscovered = candidates.length;
  const qualifiedOpportunities = candidates.filter((c) => (c.score >= 70 || c.status === "ranked") && c.verification?.scamSignalsClear !== false).length;
  const garudaDeliverableOpportunities = candidates.filter((c) => c.opportunityChannel === "garuda_deliverable" || c.capabilityAssessment?.selfEarningEligible === true).length;

  // Earning-mode breakdown (Founder Engagement Review Queue). PERMISSION_UNKNOWN
  // opportunities are reviewable, never counted as executable revenue.
  const directGarudaOpportunities = candidates.filter((c) => resolveEarningMode(c) === "DIRECT_GARUDA").length;
  const founderEngagedOpportunities = candidates.filter((c) => resolveEarningMode(c) === "FOUNDER_ENGAGED_GARUDA_ASSISTED").length;
  const permissionReviewRequired = candidates.filter((c) => resolveEarningMode(c) === "PERMISSION_UNKNOWN").length;
  const blockedNotEligible = candidates.filter((c) => resolveEarningMode(c) === "NOT_ELIGIBLE").length;
  const prohibitedOpportunities = candidates.filter((c) => resolveContractPermission(c) === "PROHIBITED").length;

  const proposalReadyOpportunities = cases.filter((c) => ["proposal_drafted", "handoff_ready"].includes(c.status)).length;
  const founderApprovalsPending = cases.filter((c) => ["proposal_drafted", "handoff_ready"].includes(c.status) && (!c.founderApproval || c.founderApproval.authorized !== true)).length;
  const submittedProposals = cases.filter((c) => ["submitted", "submitted_for_review"].includes(c.status)).length;
  const clientResponses = cases.filter((c) => c.status === "response_received" || c.latestResponse).length;
  const negotiations = cases.filter((c) => c.status === "changes_requested").length;
  const wonOpportunities = cases.filter((c) => c.status === "mission_created").length + intakes.filter((i) => i.status === "work_confirmed").length;
  const lostOpportunities = cases.filter((c) => ["closed_no_award", "source_invalidated"].includes(c.status)).length + candidates.filter((c) => c.status === "rejected").length;

  const usdToInrRate = options.usdToInrRate || 83;
  let revenuePotentialUSD = 0;
  let revenuePotentialINR = 0;

  const detailedCandidates = candidates.map((c) => {
    const detailed = parseMonetaryValueDetailed(c.salaryText || c.salary || 0, { usdToInrRate });
    revenuePotentialUSD += detailed.estimatedUSD;
    revenuePotentialINR += detailed.estimatedINR;
    return {
      candidateId: String(c._id || c.id || ""),
      title: c.title,
      ...detailed
    };
  });

  let revenueClosedUSD = 0;
  intakes.forEach((i) => {
    if (i.brief?.price?.amount) revenueClosedUSD += Number(i.brief.price.amount);
  });
  const revenueClosedINR = Math.round(revenueClosedUSD * usdToInrRate);

  const conversionRateNum = submittedProposals > 0 ? (wonOpportunities / submittedProposals) * 100 : 0;
  const conversionPercentage = `${conversionRateNum.toFixed(1)}%`;

  const outreachMetrics = (options.queueManager || defaultQueueManager).getOutreachMetrics();

  // Requirement 9: Display INR first in Founder-facing reports
  const formattedRevenuePotential = `₹${revenuePotentialINR.toLocaleString("en-IN")} ($${revenuePotentialUSD.toLocaleString()} USD)`;
  const formattedRevenueClosed = `₹${revenueClosedINR.toLocaleString("en-IN")} ($${revenueClosedUSD.toLocaleString()} USD)`;

  const metrics = {
    opportunitiesDiscovered,
    qualifiedOpportunities,
    garudaDeliverableOpportunities,
    directGarudaOpportunities,
    founderEngagedOpportunities,
    permissionReviewRequired,
    blockedNotEligible,
    prohibitedOpportunities,
    proposalReadyOpportunities,
    founderApprovalsPending,
    submittedProposals,
    clientResponses: clientResponses + outreachMetrics.responsesReceived,
    negotiations,
    wonOpportunities,
    lostOpportunities,
    revenuePotential: formattedRevenuePotential,
    revenuePotentialUSD,
    revenuePotentialINR,
    revenueClosed: formattedRevenueClosed,
    revenueClosedUSD,
    revenueClosedINR,
    conversionPercentage,
    detailedCandidates,
    outreach: {
      pendingOutreach: outreachMetrics.pendingOutreach,
      sentToday: outreachMetrics.sentToday,
      responsesReceived: outreachMetrics.responsesReceived,
      meetingsRequested: outreachMetrics.meetingsRequested,
      dealsProgressing: outreachMetrics.dealsProgressing,
      blockedDeals: outreachMetrics.blockedDeals
    }
  };

  const nextAction = calculateNextHighestRoiAction(metrics);

  return {
    timestamp: new Date().toISOString(),
    dataSource: mongoReady ? "mongodb_persisted" : "project_memory_persisted",
    metrics,
    nextHighestRoiAction: nextAction
  };
}

async function getRevenueTruthMetrics() {
  const mongoReady = mongoose.connection && mongoose.connection.readyState === 1;
  if (!mongoReady) {
    return {
      timestamp: new Date().toISOString(),
      dataSource: "mongo_disconnected",
      pipeline: {}, payments: {}, delivery: {}, settlements: {}, reconciliation: {},
      receivedRevenue: 0, testExcluded: { count: 0, amount: 0 }
    };
  }

  const sum = (rows) => (rows[0]?.value || 0);

  const [
    candidates,
    missions,
    deliveries,
    payments,
    ledgers,
    reconcil,
    permissionReviews
  ] = await Promise.all([
    DiscoveryCandidate.find({}).lean(),
    RevenueExecutionMission.find({}).lean(),
    RevenueProductionDelivery.find({}).lean(),
    RevenueRecord.find({ mode: { $ne: "test" } }).lean(),
    SettlementLedger.find({}).lean(),
    PaymentReconciliationItem.find({}).sort({ createdAt: -1 }).lean(),
    PermissionReview.find({}).lean()
  ]);

  const settledIds = new Set(ledgers.filter((l) => l.status === "settled").map((l) => String(l.revenueRecordId)));
  const bankReconciledIds = new Set(ledgers.filter((l) => l.status === "settled" && l.bankReconciled === true).map((l) => String(l.revenueRecordId)));

  const paid = payments.filter((p) => p.status === "received");
  const capturedNotSettledAmount = paid.filter((p) => !settledIds.has(String(p._id))).reduce((acc, p) => acc + Number(p.amount || 0), 0);

  const settledAmount = ledgers.filter((l) => l.status === "settled").reduce((acc, l) => acc + Number(l.netAmount || 0), 0);
  const bankReconciledAmount = ledgers.filter((l) => l.status === "settled" && l.bankReconciled).reduce((acc, l) => acc + Number(l.netAmount || 0), 0);

  const deliveryCount = (s) => deliveries.filter((d) => d.status === s).length;

  return {
    timestamp: new Date().toISOString(),
    dataSource: "mongodb_persisted",
    pipeline: {
      discovered: candidates.length,
      permissionReviewRequired: candidates.filter((c) => resolveEarningMode(c) === "PERMISSION_UNKNOWN").length,
      permissionConfirmed: candidates.filter((c) => resolveEarningMode(c) === "FOUNDER_ENGAGED_GARUDA_ASSISTED").length,
      directGaruda: candidates.filter((c) => resolveEarningMode(c) === "DIRECT_GARUDA").length,
      blockedNotEligible: candidates.filter((c) => resolveEarningMode(c) === "NOT_ELIGIBLE").length,
      permissionReviews: permissionReviews.length
    },
    engagements: {
      awaitingFounderReview: missions.filter((m) => m.status === "ready_for_founder_review").length,
      founderApproved: missions.filter((m) => m.status === "founder_approved").length,
      changesRequired: missions.filter((m) => m.status === "changes_required").length,
      rejectedOrBlocked: missions.filter((m) => ["rejected", "blocked"].includes(m.status)).length
    },
    proposals: {
      draftedOrHandoff: missions.filter((m) => m.productionDelivery?.proposalState).length,
      none: "Proposal state tracked on acquisition cases; see Opportunities view"
    },
    paymentRequests: {
      created: missions.filter((m) => m.payment && m.payment.url).length,
      statuses: missions.reduce((acc, m) => {
        const s = m.payment?.status || "none";
        acc[s] = (acc[s] || 0) + 1;
        return acc;
      }, {})
    },
    payments: {
      pending: payments.filter((p) => p.status === "pending").reduce((acc, p) => acc + Number(p.amount || 0), 0),
      capturedNotSettled: capturedNotSettledAmount,
      refunded: payments.filter((p) => p.status === "refunded").reduce((acc, p) => acc + Number(p.amount || 0), 0)
    },
    delivery: {
      qualityPassed: deliveryCount("quality_passed"),
      finalApproved: deliveryCount("final_approved"),
      delivered: deliveryCount("delivered"),
      clientAccepted: deliveryCount("client_accepted"),
      paymentVerified: deliveryCount("payment_verified")
    },
    settlements: {
      pending: ledgers.filter((l) => l.status === "pending").length,
      eligible: ledgers.filter((l) => l.status === "eligible").length,
      processing: ledgers.filter((l) => l.status === "processing").length,
      settled: ledgers.filter((l) => l.status === "settled").length,
      failed: ledgers.filter((l) => l.status === "failed").length,
      settledAmount,
      bankReconciledAmount,
      bankReconciled: ledgers.filter((l) => l.bankReconciled).length
    },
    reconciliation: {
      unmatched: reconcil.filter((r) => r.status === "unmatched").length,
      total: reconcil.length,
      statuses: reconcil.reduce((acc, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc; }, {})
    },
    receivedRevenue: bankReconciledAmount,
    receivedRevenueLabel: "RECEIVED only when payment captured, settled, AND bank credit reconciled",
    testExcluded: {
      count: await RevenueRecord.countDocuments({ mode: "test" }),
      amount: (await RevenueRecord.aggregate([
        { $match: { mode: "test" } },
        { $group: { _id: null, value: { $sum: "$amount" } } }
      ]))[0]?.value || 0,
      note: "Test transactions are excluded from all revenue truth buckets"
    }
  };
}

module.exports = {
  getRevenueMetrics,
  getRevenueTruthMetrics,
  calculateNextHighestRoiAction,
  parseMonetaryValue,
  parseMonetaryValueDetailed
};
