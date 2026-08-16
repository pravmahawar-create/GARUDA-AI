// GARUDA Revenue Value Model Service
//
// Governed value-priority model for GARUDA's revenue engine.
// Distinguishes (never mixes):
//   - estimated project value
//   - salary/contract compensation
//   - recurring monthly value
//   - one-time project value
//   - affiliate/commission value
//   - insurance opportunity value
//   - approved deal value
//   - received revenue
//
// Priority bands (Founder-approved):
//   < ₹3,000    -> LOW_VALUE / JUNK
//   ₹3,000–5,000 -> LOW
//   ₹5,000+      -> NORMAL
//   ₹25,000+     -> HIGH
//   ₹50,000+     -> VERY_HIGH
//   ₹1,00,000+   -> STRATEGIC
//
// Value must be evidence-backed. If it cannot be determined, it is UNKNOWN /
// UNMEASURED. No invented values.
// NOTE: revenueCommandCenterService is required lazily to avoid a load-time
// circular dependency (it requires opportunityDiscoveryService).

const PRIORITY_BANDS = Object.freeze([
  { priority: "LOW_VALUE", min: 0, max: 3000, label: "LOW VALUE / JUNK", maxFollowUps: 2, archiveOnExhaustion: true },
  { priority: "LOW", min: 3000, max: 5000, label: "LOW PRIORITY", maxFollowUps: 3, archiveOnExhaustion: true },
  { priority: "NORMAL", min: 5000, max: 25000, label: "NORMAL", maxFollowUps: 3, archiveOnExhaustion: true },
  { priority: "HIGH", min: 25000, max: 50000, label: "HIGH", maxFollowUps: 3, archiveOnExhaustion: false },
  { priority: "VERY_HIGH", min: 50000, max: 100000, label: "VERY HIGH", maxFollowUps: 3, archiveOnExhaustion: false },
  { priority: "STRATEGIC", min: 100000, max: Infinity, label: "STRATEGIC HIGH-VALUE", maxFollowUps: 3, archiveOnExhaustion: false }
]);

const VALUE_TYPES = Object.freeze([
  "estimated_project_value",
  "salary_contract_compensation",
  "recurring_monthly_value",
  "one_time_project_value",
  "affiliate_commission_value",
  "insurance_opportunity_value",
  "approved_deal_value",
  "received_revenue"
]);

const RANK_FACTORS = Object.freeze([
  "buying_intent",
  "verified_business_need",
  "decision_maker_contactability",
  "urgency_deadline",
  "commercial_value",
  "delivery_feasibility",
  "payment_probability",
  "strategic_fit"
]);

const MAX_FOLLOW_UPS_BY_PRIORITY = Object.freeze({
  LOW_VALUE: 2,
  LOW: 3,
  NORMAL: 3,
  HIGH: 3,
  VERY_HIGH: 3,
  STRATEGIC: 3
});

function classifyPriority(valueInr) {
  const v = Number(valueInr);
  if (!Number.isFinite(v) || v < 0) return null;
  return PRIORITY_BANDS.find((band) => v >= band.min && v < band.max) || null;
}

function priorityLabel(priority) {
  const band = PRIORITY_BANDS.find((b) => b.priority === priority);
  return band ? band.label : "UNMEASURED";
}

function maxFollowUpsFor(priority) {
  const p = String(priority || "").toUpperCase();
  if (MAX_FOLLOW_UPS_BY_PRIORITY[p] !== undefined) return MAX_FOLLOW_UPS_BY_PRIORITY[p];
  return 2;
}

// Estimate commercial value from evidence (salary text / compensation). Returns
// UNKNOWN / UNMEASURED when no credible figure can be derived.
function estimateValueFromEvidence(salaryText = "", options = {}) {
  const raw = String(salaryText || "").trim();
  const { parseMonetaryValueDetailed } = require("./revenueCommandCenterService");
  const parsed = parseMonetaryValueDetailed(raw, options);
  const hasCredible = parsed && Number(parsed.estimatedINR) > 0 && parsed.payUnit !== "unknown" && parsed.confidence > 0;
  if (!hasCredible) {
    return {
      status: "UNKNOWN",
      rawValue: raw || "UNMEASURED",
      estimatedINR: null,
      valueType: options.valueType || "estimated_project_value",
      payUnit: parsed ? parsed.payUnit : "unknown",
      confidence: 0,
      source: "source_evidence_missing",
      note: "Value cannot be determined from available source evidence."
    };
  }
  return {
    status: "ESTIMATED",
    rawValue: raw,
    estimatedINR: parsed.estimatedINR,
    valueType: options.valueType || "estimated_project_value",
    payUnit: parsed.payUnit,
    confidence: parsed.confidence,
    source: "source_evidence",
    note: "Evidence-backed estimate; not revenue and not approved deal value."
  };
}

// 8-factor governed ranking. Each factor scores 0-10. Returns a rank (0-100)
// plus per-factor detail. Never fabricates factors without evidence.
function rankOpportunity(input = {}) {
  const factors = [
    { id: "buying_intent", label: "Buying intent", score: Number(input.buyingIntent) || 0, evidence: input.buyingIntentEvidence || "UNMEASURED" },
    { id: "verified_business_need", label: "Verified business need", score: Number(input.verifiedBusinessNeed) || 0, evidence: input.verifiedBusinessNeedEvidence || "UNMEASURED" },
    { id: "decision_maker_contactability", label: "Decision-maker / contactability", score: Number(input.decisionMakerContactability) || 0, evidence: input.decisionMakerContactabilityEvidence || "UNMEASURED" },
    { id: "urgency_deadline", label: "Urgency / deadline", score: Number(input.urgency) || 0, evidence: input.urgencyEvidence || "UNMEASURED" },
    { id: "commercial_value", label: "Commercial value", score: Number(input.commercialValue) || 0, evidence: input.commercialValueEvidence || "UNMEASURED" },
    { id: "delivery_feasibility", label: "Delivery feasibility", score: Number(input.deliveryFeasibility) || 0, evidence: input.deliveryFeasibilityEvidence || "UNMEASURED" },
    { id: "payment_probability", label: "Payment probability", score: Number(input.paymentProbability) || 0, evidence: input.paymentProbabilityEvidence || "UNMEASURED" },
    { id: "strategic_fit", label: "Strategic fit", score: Number(input.strategicFit) || 0, evidence: input.strategicFitEvidence || "UNMEASURED" }
  ];
  const raw = factors.reduce((sum, factor) => sum + factor.score, 0);
  const rank = Math.round((raw / (factors.length * 10)) * 100);
  return { rank, factors, measured: factors.some((f) => f.evidence !== "UNMEASURED") };
}

// Default ranking for a discovery candidate. Only evidence-backed factors are
// scored; missing evidence stays UNMEASURED so no rank is fabricated.
function rankFromCandidate(candidate = {}) {
  const estimate = estimateValueFromEvidence(candidate.salaryText || "");
  const channel = candidate.opportunityChannel || "";
  const deliverability = candidate.outcomeDeliverability && candidate.outcomeDeliverability.canGarudaDeliver;
  const verification = candidate.verification || {};

  const factorScores = {};
  const factorEvidence = {};

  if (estimate.status === "ESTIMATED" && estimate.estimatedINR != null) {
    factorScores.commercialValue = Math.min(10, Math.max(2, Math.round(Number(estimate.estimatedINR) / 2500)));
    factorEvidence.commercialValue = `salary_evidence:${estimate.estimatedINR} INR`;
  }
  if (channel === "garuda_deliverable" || channel === "human_opportunity_only") {
    factorScores.buyingIntent = channel === "garuda_deliverable" ? 6 : 4;
    factorEvidence.buyingIntent = `opportunity_channel:${channel}`;
  }
  if (deliverability === true) {
    factorScores.deliveryFeasibility = 8;
    factorEvidence.deliveryFeasibility = "outcome_deliverability:canGarudaDeliver";
  }
  if (verification.sourceVerified === true) {
    factorScores.verifiedBusinessNeed = 8;
    factorEvidence.verifiedBusinessNeed = "source_truth:sourceVerified";
  }
  if (verification.directClientWorkEvidence === true) {
    factorScores.decisionMakerContactability = 7;
    factorEvidence.decisionMakerContactability = "source_truth:directClientWorkEvidence";
  }

  return rankOpportunity({
    buyingIntent: factorScores.buyingIntent || 0,
    buyingIntentEvidence: factorEvidence.buyingIntent,
    verifiedBusinessNeed: factorScores.verifiedBusinessNeed || 0,
    verifiedBusinessNeedEvidence: factorEvidence.verifiedBusinessNeed,
    decisionMakerContactability: factorScores.decisionMakerContactability || 0,
    decisionMakerContactabilityEvidence: factorEvidence.decisionMakerContactability,
    commercialValue: factorScores.commercialValue || 0,
    commercialValueEvidence: factorEvidence.commercialValue,
    deliveryFeasibility: factorScores.deliveryFeasibility || 0,
    deliveryFeasibilityEvidence: factorEvidence.deliveryFeasibility
  });
}

module.exports = {
  MAX_FOLLOW_UPS_BY_PRIORITY,
  PRIORITY_BANDS,
  RANK_FACTORS,
  VALUE_TYPES,
  classifyPriority,
  estimateValueFromEvidence,
  maxFollowUpsFor,
  priorityLabel,
  rankFromCandidate,
  rankOpportunity
};