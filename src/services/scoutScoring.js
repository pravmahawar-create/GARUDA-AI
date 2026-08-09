const DEFAULT_WEIGHTS = {
  budget: 0.25,
  urgency: 0.2,
  competition: 0.2,
  paymentReliability: 0.25,
  deliveryComplexity: 0.1
};

function toNumber(value, { min = 1, max = 10 } = {}) {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return min;
  return Math.max(min, Math.min(max, numeric));
}

const URGENCY_MAP = {
  asap: 9,
  immediate: 9,
  week1: 8,
  week2: 6,
  month: 4,
  flexible: 3
};

function urgencyFromText(text = "") {
  const t = String(text || "").toLowerCase();
  if (/(asap|immediate|today)/.test(t)) return URGENCY_MAP.asap;
  if (/\b1\s?-?\s?week/.test(t)) return URGENCY_MAP.week1;
  if (/\b2\s?weeks?/.test(t)) return URGENCY_MAP.week2;
  if (/(month|one month)/.test(t)) return URGENCY_MAP.month;
  return URGENCY_MAP.flexible;
}

const COMPETITION_RULES = { low: 9, medium: 5, high: 2 };
const PAYMENT_LEVELS = { "proven-escrow": 9, marketplace: 7, "verified-client": 7, "new-client": 3, unknown: 4 };
const COMPLEXITY_LEVELS = { low: 8, medium: 5, high: 3, critical: 1 };

function parseBudgetText(text = "") {
  const m = String(text || "").replace(/,/g, "").match(/([A-Z]{3}|\$)?\s*(\d+(?:\.\d+)?)/i);
  return m ? Number(m[2]) : null;
}

function scoreBudget(budget) {
  const b = Number(budget);
  if (Number.isNaN(b) || b <= 0) return 3;
  if (b >= 1000) return 9;
  if (b >= 500) return 8;
  if (b >= 250) return 7;
  if (b >= 100) return 5;
  return 4;
}

function scoreOpportunity(input = {}) {
  const weights =
    input.weights && typeof input.weights === "object"
      ? {
          budget: Number(input.weights.budget) || DEFAULT_WEIGHTS.budget,
          urgency: Number(input.weights.urgency) || DEFAULT_WEIGHTS.urgency,
          competition: Number(input.weights.competition) || DEFAULT_WEIGHTS.competition,
          paymentReliability: Number(input.weights.paymentReliability) || DEFAULT_WEIGHTS.paymentReliability,
          deliveryComplexity: Number(input.weights.deliveryComplexity) || DEFAULT_WEIGHTS.deliveryComplexity
        }
      : DEFAULT_WEIGHTS;

  const factors = {
    budget: scoreBudget(input.budget),
    urgency: toNumber(input.urgency),
    competition: toNumber(input.competition),
    paymentReliability: toNumber(input.paymentReliability),
    deliveryComplexity: toNumber(input.deliveryComplexity)
  };

  const score = Math.round(
    factors.budget * weights.budget +
    factors.urgency * weights.urgency +
    factors.competition * weights.competition +
    factors.paymentReliability * weights.paymentReliability +
    factors.deliveryComplexity * weights.deliveryComplexity
  );

  const clamped = Math.max(1, Math.min(100, score));

  return {
    score: clamped,
    factors,
    inputs: {
      budget: input.budget,
      urgency: input.urgency,
      competition: input.competition,
      paymentReliability: input.paymentReliability,
      deliveryComplexity: input.deliveryComplexity
    },
    weights,
    verdict: clamped >= 75 ? "HOT" : clamped >= 55 ? "STRONG" : clamped >= 40 ? "POTENTIAL" : "LOW"
  };
}

module.exports = {
  DEFAULT_WEIGHTS,
  COMPETITION_RULES,
  COMPLEXITY_LEVELS,
  PAYMENT_LEVELS,
  URGENCY_MAP,
  parseBudgetText,
  scoreBudget,
  scoreOpportunity,
  toNumber,
  urgencyFromText
};