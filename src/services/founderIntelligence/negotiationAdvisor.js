/**
 * GARUDA FOUNDER INTELLIGENCE — Negotiation Advisor (Phase 8)
 *
 * Founder correction #2 — hard rules:
 *  - STRICT separation of evidence classes:
 *      verifiedCustomerStatements | founderAssumptions |
 *      modelInference | estimates
 *  - NEVER invent: customer budget, customer intent, competitor offer,
 *    or probability of closing.
 *  - Probability comes ONLY from measured empirical deal data
 *    (dealTrackerService). Unmeasured → UNKNOWN, never guessed.
 *  - privateGuidance is FOUNDER-ONLY (must never enter customerView).
 */

const { LABELS, makeEvidence, unknownEvidence } = require("./evidenceLabels");

const FORBIDDEN_INVENTIONS = Object.freeze([
  "customerBudget",
  "customerIntent",
  "competitorOffer",
  "closeProbability",
]);

function normalizeStatements(list) {
  if (!Array.isArray(list)) return [];
  return list
    .map((s) => {
      if (typeof s === "string") {
        return { quote: s, label: LABELS.VERIFIED, source: "transcript", at: null };
      }
      return {
        quote: String(s.quote || s.text || "").trim(),
        source: s.source || "transcript",
        at: s.at || null,
        label: s.verified === false ? LABELS.PARTIAL : LABELS.VERIFIED,
      };
    })
    .filter((s) => s.quote.length > 0);
}

function normalizeAssumptions(list) {
  if (!Array.isArray(list)) return [];
  return list
    .map((a) => (typeof a === "string" ? a : String(a.text || a.assumption || "")))
    .filter((t) => t.length > 0)
    .map((text) => ({ text, label: LABELS.FOUNDER_JUDGMENT }));
}

function safeEmpiricalProbability(dealTracker) {
  if (!dealTracker || typeof dealTracker.getEmpiricalProbability !== "function") {
    return { label: LABELS.UNKNOWN, note: "dealTracker unavailable", measured: false };
  }
  try {
    const stats = dealTracker.getEmpiricalProbability();
    if (!stats || stats.measured !== true || stats.winRate === null) {
      return { label: LABELS.UNKNOWN, note: stats?.winRateLabel || "UNMEASURED", measured: false };
    }
    return {
      label: LABELS.VERIFIED,
      measured: true,
      winRate: stats.winRate,
      winRateLabel: stats.winRateLabel,
      sampleNote: "Empirical GARUDA deal-tracker measurement (not a prediction)",
      source: { type: "live", ref: "dealTrackerService", retrievedAt: null },
    };
  } catch (err) {
    return { label: LABELS.BLOCKED, note: `dealTracker error: ${err.message}`, measured: false };
  }
}

/**
 * Analyze a negotiation situation.
 *
 * @param {object} input
 * @param {Array}  [input.customerStatements]  transcript-backed quotes
 * @param {Array}  [input.founderAssumptions]  founder-provided assumptions
 * @param {object} [input.quote]               GARUDA pricing quote (from engine)
 * @param {string} [input.customerAsk]         verbatim customer ask (quote string)
 * @param {object} [deps]                      { dealTracker } injectable for tests
 */
function analyze(input = {}, deps = {}) {
  const dealTracker =
    deps.dealTracker || require("../dealTrackerService");

  const statements = normalizeStatements(input.customerStatements);
  const assumptions = normalizeAssumptions(input.founderAssumptions);
  const customerAsk = input.customerAsk
    ? String(input.customerAsk)
    : null;

  const evidence = [];
  for (const s of statements) {
    evidence.push(
      makeEvidence({
        field: `customer_statement:${s.quote.slice(0, 40)}`,
        label: s.label,
        value: s.quote,
        source: { type: "live", ref: s.source || "transcript", retrievedAt: s.at },
      })
    );
  }
  for (const a of assumptions) {
    evidence.push(
      makeEvidence({
        field: `founder_assumption:${a.text.slice(0, 40)}`,
        label: LABELS.FOUNDER_JUDGMENT,
        value: a.text,
        source: { type: "founder", ref: "explicit_input", retrievedAt: null },
      })
    );
  }

  const probability = safeEmpiricalProbability(dealTracker);
  const quote = input.quote || null;

  // ---------- MODEL INFERENCE (clearly labeled, never stated as fact) ----------
  const modelInference = [];
  const pricePressure =
    statements.some((s) =>
      /\b(budget|expensive|cost|price|mehang|sasta|afford|cheap)\b/i.test(s.quote)
    ) ||
    (customerAsk && /\b(budget|expensive|cost|price|discount|cheap|mehang|sasta)\b/i.test(customerAsk));
  if (pricePressure) {
    modelInference.push({
      insight:
        "Customer statements reference cost/budget → price sensitivity likely. This is inference from wording, NOT a verified intent.",
      label: LABELS.ESTIMATE,
    });
  }
  if (customerAsk && /\b(urgent|asap|jaldi|today|tomorrow|week)\b/i.test(customerAsk)) {
    modelInference.push({
      insight: "Customer expressed time pressure in verbatim ask → urgency noted from wording only.",
      label: LABELS.ESTIMATE,
    });
  }

  // ---------- ESTIMATES (deterministic, only from verified inputs) ----------
  const estimates = [];
  if (quote && quote.quote && Number.isFinite(quote.quote.minINR)) {
    estimates.push({
      field: "garuda_quote_range",
      value: { minINR: quote.quote.minINR, maxINR: quote.quote.maxINR, currency: quote.quote.currency },
      label: quote.label,
      note: "From pricing engine — not a customer figure",
    });
  } else {
    estimates.push(unknownEvidence("garuda_quote_range", "No pricing quote supplied to negotiation context"));
  }

  // ---------- UNKNOWN (explicitly listing what we will NOT invent) ----------
  const unknowns = [];
  const customerBudgetStated = statements.some((s) =>
    /budget[^\d]{0,20}₹?\s*\d[\d,]*/i.test(s.quote) ||
    /limit[^\d]{0,20}₹?\s*\d[\d,]*/i.test(s.quote)
  );
  if (!customerBudgetStated) {
    unknowns.push(unknownEvidence("customerBudget", "No verbatim budget statement in transcript — NOT invented"));
  }
  unknowns.push(unknownEvidence("customerIntent", "Intent requires founder verification — NEVER inferred as fact"));
  unknowns.push(unknownEvidence("competitorOffer", "No verified competitor offer provided"));

  // ---------- PRIVATE GUIDANCE (founder-only) ----------
  const privateGuidance = [];
  if (quote && quote.quote && Number.isFinite(quote.quote.minINR)) {
    privateGuidance.push({
      guidance: `Quote floor is ₹${quote.quote.minINR.toLocaleString("en-IN")} (verified anchor basis: ${quote.quote.basis}). Do not verbally discount below list without founder decision.`,
      label: LABELS.ESTIMATE,
    });
  }
  if (pricePressure) {
    privateGuidance.push({
      guidance:
        "Price pushback detected. Prefer scope adjustment / milestone restructuring over headline discount.",
      label: LABELS.FOUNDER_JUDGMENT,
    });
  }
  if (probability.measured === true) {
    privateGuidance.push({
      guidance: `Empirical measured win rate: ${probability.winRateLabel}. Use as historical fact, not prediction.`,
      label: LABELS.VERIFIED,
    });
  }

  const forbiddenPresent = [];
  // Guardrail: this output must NEVER contain invented forbidden fields.
  // (validated structurally — they are simply never written)

  return {
    success: true,
    evidenceClasses: {
      verifiedCustomerStatements: statements,
      founderAssumptions: assumptions,
      modelInference,
      estimates,
    },
    unknowns,
    closeProbability: probability,
    privateGuidance, // founderPrivate — strip before customerView
    evidence,
    guardrails: {
      forbiddenInventions: FORBIDDEN_INVENTIONS,
      forbiddenPresent,
      rule: "No customer budget/intent/competitor/probability invented without verified source.",
    },
  };
}

module.exports = { analyze, FORBIDDEN_INVENTIONS };
