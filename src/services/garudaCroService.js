const crypto = require("crypto");
const { generateExecutiveDecisionReport } = require("./revenueIntelligenceEngineService");
const { evaluateNegotiationObjection, recordClosingOutcome: recordClosingOutcomeSystem } = require("./revenueClosingSystemService");
const { buildFounderSubmissionPackage } = require("./founderSubmissionPackageService");

function sha256(data) {
  return crypto.createHash("sha256").update(typeof data === "string" ? data : JSON.stringify(data)).digest("hex");
}

function plainText(value = "") {
  return String(value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * CRO Historical Memory Ledger (Learns from past WON / LOST deals)
 */
const croMemoryLedger = [
  {
    dealId: "cro-deal-baseline-001",
    title: "Senior Node.js Backend API",
    category: "software_engineering",
    outcome: "WON",
    reasonForOutcome: "Client bought due to 3-day speed compression and 100% automated test execution guarantee.",
    objectionsEncountered: ["price_concern"],
    agreedPrice: 5000,
    discountGiven: 0,
    recordedAt: "2026-07-20T10:00:00.000Z"
  },
  {
    dealId: "cro-deal-baseline-002",
    title: "React Web Dashboard",
    category: "software_engineering",
    outcome: "WON",
    reasonForOutcome: "Client bought after seeing live sandbox demo link and 50/50 milestone payment structure.",
    objectionsEncountered: ["trust_and_proof"],
    agreedPrice: 4200,
    discountGiven: 300,
    recordedAt: "2026-07-22T10:00:00.000Z"
  }
];

function getCroLearningHistory(category = "software_engineering") {
  const matching = croMemoryLedger.filter((d) => !category || d.category === category || d.category === "software_engineering");
  const wonDeals = matching.filter((d) => d.outcome === "WON");
  const lostDeals = matching.filter((d) => d.outcome === "LOST");

  const winReasons = wonDeals.map((d) => d.reasonForOutcome);
  const lossReasons = lostDeals.map((d) => d.reasonForOutcome);

  return {
    totalEvaluatedDeals: matching.length,
    dealsWonCount: wonDeals.length,
    dealsLostCount: lostDeals.length,
    historicalWinRatePercent: matching.length > 0 ? Math.round((wonDeals.length / matching.length) * 100) : 85,
    topWinFactors: winReasons.length > 0 ? winReasons : ["Speed compression advantage", "100% test execution proof"],
    topLossFactors: lossReasons.length > 0 ? lossReasons : ["Unresolved budget mismatch", "Delayed Founder submission turnaround"]
  };
}

/**
 * Core CRO Evaluation Engine
 */
function evaluateCroDealStrategy(candidateInput = {}, context = {}, options = {}) {
  const now = options.now ? new Date(options.now) : new Date();

  const rieReport = generateExecutiveDecisionReport(candidateInput, context, { now });
  const subPkg = buildFounderSubmissionPackage(candidateInput, context, { now });
  const history = getCroLearningHistory(candidateInput.category);

  const title = plainText(candidateInput.title || candidateInput.rawSource?.title || rieReport.title || "Opportunity");
  const company = plainText(candidateInput.company || candidateInput.rawSource?.company || rieReport.clientCompany || "Client");
  const pricing = subPkg.pricingRecommendation || {};
  const effort = subPkg.effortEstimation || {};
  const time = rieReport.timeEconomics || {};

  const currency = pricing.currency || "USD";
  const recommendedPrice = pricing.recommendedPrice || 2500;
  const floorPrice = pricing.minimumAcceptableFloorPrice || 2000;

  // 1. Why will this client buy?
  const whyClientWillBuy = `${company} seeks to eliminate delivery risk and accelerate time-to-market. They will buy because GARUDA delivers production-ready ${title} in ${effort.estimatedDeliveryDays} days (${time.aiTimeCompressionRatio}× faster than traditional agencies) backed by 100% empirical test execution logs.`;

  // 2. Why will this client NOT buy?
  let whyClientWillNotBuy = `Friction arises if ${company} fears paying for non-working software upfront or if they perceive ${currency} $${recommendedPrice.toLocaleString()} as exceeding unannounced internal budget limits.`;
  if (rieReport.metrics?.clientQualityScore < 60) {
    whyClientWillNotBuy = `Unverified client identity or unspecified budget creates reluctance until commercial milestones and live sandbox demo proof are confirmed.`;
  }

  // 3. What emotional trigger will close this deal?
  const emotionalTrigger = `Relief & Certainty: Giving ${company}'s technical lead absolute confidence that the codebase will compile cleanly, contain 0 placeholder bugs, and launch within ${effort.estimatedDeliveryDays} days.`;

  // 4. What commercial trigger will close this deal?
  const commercialTrigger = `Low-Risk 50/50 Milestone: Requiring only a 50% deposit to initiate Milestone 1 prototype, with the remaining 50% tied strictly to client acceptance of passing test logs.`;

  // 5. What proof is actually required?
  const proofRequired = [
    `Live functional sandbox demo URL (demo-stage.garuda.ai/preview/${rieReport.opportunityId})`,
    "Automated unit & integration test runner execution output (100% pass rate, 0 failures)",
    "Documented API setup and environment configuration guide"
  ];

  // 6. What proof is unnecessary?
  const proofUnnecessary = [
    "Verbose 30-page marketing PDF slide decks",
    "Unverified or generic client logo portfolios",
    "Fabricated team experience claims or agency size credentials"
  ];

  // 7. Should Founder negotiate? (YES / NO)
  const shouldNegotiate = rieReport.recommendation === "NEGOTIATE" || rieReport.metrics?.clientQualityScore < 70 || pricing.targetClientBudget === null;

  // 8. Exact Negotiation Conversation (If YES)
  let negotiationConversation = null;
  if (shouldNegotiate) {
    const counterPrice = Math.max(floorPrice, Math.round(recommendedPrice * 0.90));
    negotiationConversation = {
      founderOpeningMessage: `Hi ${company} team, thank you for considering GARUDA for "${title}". We have reviewed the scope and can execute the core deliverables for ${currency} $${counterPrice.toLocaleString()} under a 50/50 milestone agreement, delivering Milestone 1 within ${Math.max(1, Math.floor(effort.estimatedDeliveryDays / 2))} business days.`,
      expectedClientReply: `That rate works better for our budget. Can we confirm the exact deliverables included in Milestone 1?`,
      founderClosingCounter: `Milestone 1 (${currency} $${Math.round(counterPrice / 2).toLocaleString()}) includes core API endpoint setup, database schema implementation, and automated Jest test logs. Final code handover occurs upon Milestone 2 approval.`,
      lowestAcceptablePrice: `${currency} $${floorPrice.toLocaleString()}`,
      counterPrice: `${currency} $${counterPrice.toLocaleString()}`
    };
  }

  // 9. Direct Acceptance Message (If NO)
  let directAcceptanceMessage = null;
  if (!shouldNegotiate) {
    directAcceptanceMessage = `
Commercial Proposal & Work Agreement for ${company}
Project: ${title}
Quoted Investment: ${currency} $${recommendedPrice.toLocaleString()} (${pricing.pricingModel.replace("_", " ")})

GARUDA is ready to initiate execution immediately upon Milestone 1 confirmation (${currency} $${Math.round(recommendedPrice / 2).toLocaleString()}).
• Target Delivery: ${effort.estimatedDeliveryDays} Business Days
• Quality Guarantee: 100% automated test execution log provided with final handover.

Please reply to authorize Milestone 1 initiation.
`.trim();
  }

  const followUpStrategy = {
    noReply24h: `Hi ${company} team, following up on our proposal for "${title}". We are reserved to initiate Milestone 1 with a ${effort.estimatedDeliveryDays}-day delivery commitment.`,
    noReply72h: `Hi ${company} team, sharing our technical architecture breakdown and test runner plan for "${title}" to assist your review.`,
    noReply7Days: `Hi ${company} team, checking in before our current scheduling availability for "${title}" closes this week.`
  };

  const payload = {
    opportunityId: String(candidateInput.externalId || candidateInput.id || candidateInput._id || rieReport.opportunityId),
    title,
    clientCompany: company,
    whyClientWillBuy,
    whyClientWillNotBuy,
    emotionalTrigger,
    commercialTrigger,
    proofRequired,
    proofUnnecessary,
    shouldNegotiate: shouldNegotiate ? "YES" : "NO",
    negotiationConversation,
    directAcceptanceMessage,
    followUpStrategy,
    historicalContext: history,
    evaluatedAt: now.toISOString()
  };

  const croDecisionHash = sha256(payload);

  return {
    ...payload,
    croDecisionHash
  };
}

/**
 * 10. Automatic Outcome Learning Engine
 */
function learnFromDealOutcome(outcomeInput = {}, context = {}) {
  const dealId = String(outcomeInput.dealId || outcomeInput.opportunityId || `deal-${Date.now()}`).trim();
  const outcome = String(outcomeInput.outcome || "WON").toUpperCase();
  if (!["WON", "LOST"].includes(outcome)) {
    const err = new Error("Outcome must be WON or LOST");
    err.statusCode = 400;
    throw err;
  }

  const reasonForOutcome = String(outcomeInput.reasonForOutcome || outcomeInput.reason || (outcome === "WON" ? "Client accepted speed advantage and milestone terms." : "Client chose lower-cost provider or delayed project initiation.")).trim();

  const record = {
    dealId,
    title: String(outcomeInput.title || "Software Project"),
    category: String(outcomeInput.category || "software_engineering"),
    outcome,
    reasonForOutcome,
    objectionsEncountered: Array.isArray(outcomeInput.objectionsEncountered) ? outcomeInput.objectionsEncountered : [],
    agreedPrice: Number(outcomeInput.agreedPrice || 0),
    discountGiven: Number(outcomeInput.discountGiven || 0),
    deliveryDays: Number(outcomeInput.deliveryDays || 3),
    clientSatisfaction: Number(outcomeInput.clientSatisfaction || 5),
    recordedAt: new Date().toISOString()
  };

  croMemoryLedger.push(record);

  recordClosingOutcomeSystem({
    closingCaseId: dealId,
    negotiationOutcome: outcome === "WON" ? (record.discountGiven > 0 ? "won_negotiated_price" : "won_full_price") : "lost_price_objection",
    discountGiven: record.discountGiven,
    clientObjections: record.objectionsEncountered,
    actualDeliveryTimeDays: record.deliveryDays,
    clientSatisfaction: record.clientSatisfaction
  });

  return {
    recorded: true,
    dealId,
    outcome,
    reasonForOutcome,
    updatedHistory: getCroLearningHistory(record.category)
  };
}

module.exports = {
  evaluateCroDealStrategy,
  learnFromDealOutcome,
  getCroLearningHistory,
  sha256
};
