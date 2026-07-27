const crypto = require("crypto");

function sha256(data) {
  return crypto.createHash("sha256").update(typeof data === "string" ? data : JSON.stringify(data)).digest("hex");
}

function plainText(value = "") {
  return String(value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Valid Response Statuses
 */
const RESPONSE_STATUSES = [
  "NO_REPLY",
  "AUTO_REJECTION",
  "REJECTION",
  "SHORTLISTED",
  "INTERVIEW",
  "NEGOTIATION",
  "DEPOSIT_REQUEST",
  "WON",
  "LOST"
];

/**
 * Persistent Deal Store (In-Memory Ledger with SHA-256 state tracking)
 */
const dealLedger = new Map();

/**
 * PHASE 1: SUBMISSION TRACKER
 */
/**
 * LAUNCH READINESS SPRINT: CLIENT WORKSPACE & ONBOARDING ENGINE
 */
function createClientWorkspace(deal = {}) {
  const title = deal.title || deal.opportunityTitle || "Software Implementation Project";
  const client = deal.client || "Client Team";
  const deliveryDays = deal.deliveryPromiseDays || 5;

  const projectBrief = {
    businessGoal: `Deliver high-precision governed software solution for "${title}".`,
    scope: `Complete technical implementation, modular data schemas, REST endpoints, and automated test suite.`,
    features: ["Core Feature & API Implementation", "Modular Data Schema Design", "100% Passing Automated Test Suite"],
    deliverables: ["Production Codebase", "Automated QA Test Runner Suite", "Handover Documentation"],
    deadlines: `${deliveryDays} Business Days from Milestone 1 Deposit`,
    constraints: "Zero placeholder logic; 100% verified test runner logs.",
    successCriteria: "Test runner exits with code 0 and all build checks pass cleanly."
  };

  const deliveryChecklist = [
    { id: "check-1", item: "Requirements Confirmed", completed: true },
    { id: "check-2", item: "Repository Access", completed: true },
    { id: "check-3", item: "Environment Ready", completed: true },
    { id: "check-4", item: "Development Started", completed: true },
    { id: "check-5", item: "Testing Complete", completed: false },
    { id: "check-6", item: "Client Review", completed: false },
    { id: "check-7", item: "Final Delivery", completed: false },
    { id: "check-8", item: "Payment Received", completed: Number(deal.actualPaymentCollected || 0) > 0 }
  ];

  const clientTimeline = [
    { day: "Day 1", phase: "Requirements Confirmation & Repository Setup" },
    { day: `Day 2-${Math.max(2, deliveryDays - 2)}`, phase: "Core Feature & API Implementation" },
    { day: `Day ${Math.max(3, deliveryDays - 1)}`, phase: "Automated QA & Integration Testing" },
    { day: `Day ${deliveryDays}`, phase: "Final Handover & Client Milestone Acceptance" }
  ];

  return {
    workspaceId: `workspace-${deal.dealId || "001"}`,
    clientName: client,
    projectName: title,
    status: deal.currentStatus || "IN_PROGRESS",
    requirements: deal.proposalText || title,
    projectBrief,
    deliverables: projectBrief.deliverables,
    timeline: clientTimeline,
    deliveryChecklist,
    paymentStatus: Number(deal.actualPaymentCollected || 0) > 0 ? "50% DEPOSIT PAID" : "PENDING DEPOSIT",
    repositoryLinks: [`https://github.com/GARUDA-AI-Workspace/${deal.dealId || "repo"}`],
    documents: ["Proposal_Package.md", "Technical_Blueprint.md", "Verification_Report.json"],
    notes: deal.founderNotes || "Client workspace activated. Technical execution in progress."
  };
}

function recordDealSubmission(submissionInput = {}, context = {}) {
  const dealId = String(submissionInput.dealId || `deal-${crypto.randomBytes(4).toString("hex")}`).trim();
  const now = new Date();

  const record = {
    dealId,
    opportunityCategory: String(submissionInput.opportunityCategory || submissionInput.category || "other"),
    executionMode: String(submissionInput.executionMode || "founder_assisted"),
    platformIntelligence: submissionInput.platformIntelligence || { platformId: "generic", platformName: submissionInput.platform || "Direct" },
    client: plainText(submissionInput.client || submissionInput.company || "Client"),
    platform: plainText(submissionInput.platform || submissionInput.source || "Direct"),
    title: plainText(submissionInput.title || submissionInput.opportunityTitle || "Software Engineering Project"),
    submissionDate: now.toISOString(),
    proposalVersion: String(submissionInput.proposalVersion || "v1.0.0"),
    pricing: {
      quotedPrice: Number(submissionInput.pricing?.quotedPrice || submissionInput.quotedPrice || 0),
      floorPrice: Number(submissionInput.pricing?.floorPrice || submissionInput.floorPrice || 0),
      currency: String(submissionInput.pricing?.currency || submissionInput.currency || "USD")
    },
    coverLetterHash: String(submissionInput.coverLetterHash || sha256(submissionInput.proposalText || "")),
    deliveryPromiseDays: Number(submissionInput.deliveryPromiseDays || submissionInput.estimatedDeliveryDays || 5),
    paymentTerms: String(submissionInput.paymentTerms || "50/50 Milestone"),
    founderNotes: String(submissionInput.founderNotes || "Submitted via Founder Authorized Account"),
    
    // Status tracking
    currentStatus: "NO_REPLY",
    responses: [],
    outcome: null,
    actualPaymentCollected: 0,
    recordedAt: now.toISOString()
  };

  record.clientWorkspace = createClientWorkspace(record);
  dealLedger.set(dealId, record);

  return {
    success: true,
    dealId,
    currentStatus: record.currentStatus,
    clientWorkspace: record.clientWorkspace,
    dealRecordHash: sha256(record)
  };
}

/**
 * PHASE 2: RESPONSE TRACKER
 */
function recordClientResponse(responseInput = {}, context = {}) {
  const dealId = String(responseInput.dealId).trim();
  const deal = dealLedger.get(dealId);

  if (!deal) {
    const err = new Error(`Deal ID ${dealId} not found in submission tracker`);
    err.statusCode = 404;
    throw err;
  }

  const status = String(responseInput.status || "SHORTLISTED").toUpperCase();
  if (!RESPONSE_STATUSES.includes(status)) {
    const err = new Error(`Invalid response status ${status}. Must be one of ${RESPONSE_STATUSES.join(", ")}`);
    err.statusCode = 400;
    throw err;
  }

  const responseDate = responseInput.responseDate ? new Date(responseInput.responseDate) : new Date();
  const submissionTime = new Date(deal.submissionDate).getTime();
  const responseTimeHours = Math.max(0, (responseDate.getTime() - submissionTime) / 3600000);

  const responseEvent = {
    status,
    responseDate: responseDate.toISOString(),
    responseTimeHours: Math.round(responseTimeHours * 10) / 10,
    clientMessage: plainText(responseInput.clientMessage || ""),
    negotiatedPrice: responseInput.negotiatedPrice ? Number(responseInput.negotiatedPrice) : null,
    notes: plainText(responseInput.notes || "")
  };

  deal.responses.push(responseEvent);
  deal.currentStatus = status;

  if (status === "WON" || status === "LOST" || status === "AUTO_REJECTION" || status === "REJECTION") {
    deal.outcome = status === "WON" ? "WON" : "LOST";
    if (status === "WON" && responseInput.paymentCollected) {
      deal.actualPaymentCollected = Number(responseInput.paymentCollected);
    }
  }

  dealLedger.set(dealId, deal);

  return {
    success: true,
    dealId,
    currentStatus: deal.currentStatus,
    responseTimeHours: responseEvent.responseTimeHours,
    dealRecordHash: sha256(deal)
  };
}

/**
 * PHASE 3: OUTCOME LEARNING ENGINE
 */
function recordDealOutcome(outcomeInput = {}, context = {}) {
  const dealId = String(outcomeInput.dealId).trim();
  const deal = dealLedger.get(dealId);

  const outcome = String(outcomeInput.outcome || "WON").toUpperCase();
  const reason = plainText(outcomeInput.reason || outcomeInput.reasonForOutcome || "");

  if (deal) {
    deal.outcome = outcome;
    deal.currentStatus = outcome;
    if (outcome === "WON") {
      deal.actualPaymentCollected = Number(outcomeInput.actualPaymentCollected || outcomeInput.agreedPrice || deal.pricing.quotedPrice);
    }
    dealLedger.set(dealId, deal);
  }

  const { recordClosingOutcome: recordClosingOutcomeSystem } = require("./revenueClosingSystemService");
  recordClosingOutcomeSystem({
    closingCaseId: dealId,
    negotiationOutcome: outcome === "WON" ? "won_full_price" : "lost_price_objection",
    discountGiven: Number(outcomeInput.discountGiven || 0),
    clientObjections: outcomeInput.objectionsEncountered || [],
    actualDeliveryTimeDays: Number(outcomeInput.deliveryDays || 3),
    clientSatisfaction: Number(outcomeInput.clientSatisfaction || 5)
  });

  return {
    recorded: true,
    dealId,
    outcome,
    reason,
    metrics: getRealityMetrics()
  };
}

/**
 * PHASE 4: REALITY METRICS CALCULATOR
 */
function getRealityMetrics() {
  const deals = Array.from(dealLedger.values());
  const submissionCount = deals.length;

  if (submissionCount === 0) {
    return {
      submissionCount: 0,
      replyRatePercent: null,
      replyRateLabel: "UNMEASURED (Awaiting empirical deal data)",
      interviewRatePercent: null,
      interviewRateLabel: "UNMEASURED (Awaiting empirical deal data)",
      negotiationRatePercent: null,
      negotiationRateLabel: "UNMEASURED (Awaiting empirical deal data)",
      depositRatePercent: null,
      depositRateLabel: "UNMEASURED (Awaiting empirical deal data)",
      winRatePercent: null,
      winRateLabel: "UNMEASURED (Awaiting empirical deal data)",
      revenueCollected: 0,
      averageReplyTimeHours: null,
      averageDealSize: 0,
      averageDaysToPayment: null,
      statusBreakdown: {
        NO_REPLY: 0,
        AUTO_REJECTION: 0,
        REJECTION: 0,
        SHORTLISTED: 0,
        INTERVIEW: 0,
        NEGOTIATION: 0,
        DEPOSIT_REQUEST: 0,
        WON: 0,
        LOST: 0
      }
    };
  }

  const repliedDeals = deals.filter((d) => d.responses.length > 0 && d.currentStatus !== "NO_REPLY");
  const interviewedDeals = deals.filter((d) => d.responses.some((r) => r.status === "INTERVIEW" || r.status === "SHORTLISTED"));
  const negotiatedDeals = deals.filter((d) => d.responses.some((r) => r.status === "NEGOTIATION"));
  const depositDeals = deals.filter((d) => d.responses.some((r) => r.status === "DEPOSIT_REQUEST" || r.status === "WON"));
  const wonDeals = deals.filter((d) => d.outcome === "WON" || d.currentStatus === "WON");

  const revenueCollected = wonDeals.reduce((sum, d) => sum + (d.actualPaymentCollected || d.pricing.quotedPrice || 0), 0);

  const replyTimes = [];
  deals.forEach((d) => {
    if (d.responses.length > 0) {
      replyTimes.push(d.responses[0].responseTimeHours);
    }
  });

  const avgReplyTime = replyTimes.length > 0 ? Math.round((replyTimes.reduce((a, b) => a + b, 0) / replyTimes.length) * 10) / 10 : null;
  const avgDealSize = wonDeals.length > 0 ? Math.round(revenueCollected / wonDeals.length) : 0;

  const replyRate = Math.round((repliedDeals.length / submissionCount) * 100);
  const winRate = Math.round((wonDeals.length / submissionCount) * 100);

  return {
    submissionCount,
    replyCount: repliedDeals.length,
    replyRatePercent: replyRate,
    replyRateLabel: `${replyRate}% (Empirical)`,
    interviewRatePercent: Math.round((interviewedDeals.length / submissionCount) * 100),
    negotiationRatePercent: Math.round((negotiatedDeals.length / submissionCount) * 100),
    depositRatePercent: Math.round((depositDeals.length / submissionCount) * 100),
    winRatePercent: winRate,
    winRateLabel: `${winRate}% (Empirical)`,
    revenueCollected,
    averageReplyTimeHours: avgReplyTime,
    averageDealSize: avgDealSize,
    averageDaysToPayment: avgReplyTime ? Math.round(avgReplyTime / 24) : null,
    statusBreakdown: {
      NO_REPLY: deals.filter((d) => d.currentStatus === "NO_REPLY").length,
      AUTO_REJECTION: deals.filter((d) => d.currentStatus === "AUTO_REJECTION").length,
      REJECTION: deals.filter((d) => d.currentStatus === "REJECTION").length,
      SHORTLISTED: deals.filter((d) => d.currentStatus === "SHORTLISTED").length,
      INTERVIEW: deals.filter((d) => d.currentStatus === "INTERVIEW").length,
      NEGOTIATION: deals.filter((d) => d.currentStatus === "NEGOTIATION").length,
      DEPOSIT_REQUEST: deals.filter((d) => d.currentStatus === "DEPOSIT_REQUEST").length,
      WON: wonDeals.length,
      LOST: deals.filter((d) => d.outcome === "LOST").length
    }
  };
}

/**
 * EMPIRICAL PROBABILITY LOOKUP
 * Returns empirical win rate if deal data exists, otherwise returns null with unmeasured label.
 */
function getEmpiricalProbability() {
  const metrics = getRealityMetrics();
  if (metrics.submissionCount === 0) {
    return {
      measured: false,
      winRate: null,
      winRateLabel: "UNMEASURED (Awaiting empirical deal data)",
      paymentProbability: null,
      paymentProbabilityLabel: "UNMEASURED (Awaiting empirical deal data)"
    };
  }
  return {
    measured: true,
    winRate: metrics.winRatePercent,
    winRateLabel: `${metrics.winRatePercent}% (Empirical)`,
    paymentProbability: metrics.depositRatePercent,
    paymentProbabilityLabel: `${metrics.depositRatePercent}% (Empirical)`
  };
}

function clearDealTrackerStore() {
  dealLedger.clear();
}

module.exports = {
  createClientWorkspace,
  recordDealSubmission,
  recordClientResponse,
  recordDealOutcome,
  getRealityMetrics,
  getEmpiricalProbability,
  clearDealTrackerStore,
  RESPONSE_STATUSES,
  sha256
};
