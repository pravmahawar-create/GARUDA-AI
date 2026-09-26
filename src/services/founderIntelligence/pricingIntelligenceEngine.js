/**
 * GARUDA FOUNDER INTELLIGENCE — Deterministic Pricing Intelligence Engine (Phase 4)
 *
 * Rules (Founder correction #1):
 *  - Pure, deterministic math. NO LLM in the number path.
 *  - Every price line carries source + evidence label.
 *  - Verified live anchors (garudaos.in/pricing) are preferred.
 *  - Unanchored services are ESTIMATEs built from DECLARED internal
 *    methodology constants (transparent, versioned, labeled ESTIMATE).
 *  - Missing required inputs → UNKNOWN + missingInputs list. NEVER invented.
 *  - Stale snapshots surface warnings; never silently trusted.
 */

const { LABELS, makeEvidence, unknownEvidence, combineLabels } = require("./evidenceLabels");
const pricingEvidenceStore = require("./pricingEvidenceStore");

const CURRENCY = "INR";

/**
 * Service tag aliases → normalized serviceType.
 */
const SERVICE_ALIASES = Object.freeze({
  custom_ai: "custom_ai",
  ai: "custom_ai",
  "ai automation": "custom_ai",
  "ai project": "custom_ai",
  saas_mvp: "saas_mvp",
  mvp: "saas_mvp",
  "saas mvp": "saas_mvp",
  business_automation: "business_automation",
  automation: "business_automation",
  "business automation": "business_automation",
  saas_subscription: "saas_subscription",
  saas: "saas_subscription",
  subscription: "saas_subscription",
  website_seo: "website_seo",
  website: "website_seo",
  seo: "website_seo",
  "website + seo": "website_seo",
  "website and seo": "website_seo",
  mobile_pwa: "mobile_pwa",
  mobile: "mobile_pwa",
  pwa: "mobile_pwa",
  app: "mobile_pwa",
  "mobile app": "mobile_pwa",
  whatsapp_bot: "whatsapp_bot",
  bot: "whatsapp_bot",
  chatbot: "whatsapp_bot",
  "whatsapp bot": "whatsapp_bot",
});

const COMPLEXITY_MULTIPLIERS = Object.freeze({
  basic: 1.0,
  standard: 1.25,
  complex: 1.6,
});

/**
 * DECLARED internal estimation methodology (labeled ESTIMATE).
 * These are transparent GARUDA pricing-model constants, NOT market data,
 * NOT customer-specific, and never presented as verified prices.
 */
const EFFORT_MODEL = Object.freeze({
  modelId: "founderIntelligence.pricingMethodology.v1",
  baseBuildINR: 25000,
  perPageINR: 2500,
  perFeatureINR: 5000,
  minQuoteINR: 15000,
  rangeSpread: 0.35, // ±35% band around midpoint
});

/**
 * Required inputs per service. Missing → UNKNOWN (no invention).
 */
const REQUIRED_INPUTS = Object.freeze({
  website_seo: [(s) => (Number.isFinite(s?.pages) ? null : "scope.pages")],
  mobile_pwa: [
    (s) =>
      Number.isFinite(s?.pages) || Number.isFinite(s?.features)
        ? null
        : "scope.pages|scope.features",
  ],
  whatsapp_bot: [(s) => (typeof s?.flows === "number" || Number.isFinite(s?.features) ? null : "scope.flows|scope.features")],
});

function normalizeServiceType(input) {
  const raw = String(input || "").trim().toLowerCase();
  if (!raw) return null;
  if (SERVICE_ALIASES[raw]) return SERVICE_ALIASES[raw];
  const compact = raw.replace(/[_-]+/g, " ");
  if (SERVICE_ALIASES[compact]) return SERVICE_ALIASES[compact];
  return null;
}

function missingInputsFor(serviceType, scope) {
  const checks = REQUIRED_INPUTS[serviceType] || [];
  const missing = [];
  for (const check of checks) {
    const field = check(scope || {});
    if (field) missing.push(field);
  }
  return missing;
}

function roundINR(value) {
  return Math.round(value / 100) * 100;
}

function modelSource() {
  return { type: "model", ref: EFFORT_MODEL.modelId, retrievedAt: null, version: "v1" };
}

function effortEstimate(scope, complexity) {
  const pages = Number.isFinite(scope?.pages) ? scope.pages : 0;
  const features = Number.isFinite(scope?.features) ? scope.features : 0;
  const flows = Number.isFinite(scope?.flows) ? scope.flows : 0;
  const base = EFFORT_MODEL.baseBuildINR;
  const effort =
    base +
    pages * EFFORT_MODEL.perPageINR +
    (features + flows) * EFFORT_MODEL.perFeatureINR;
  const mult = COMPLEXITY_MULTIPLIERS[complexity] || COMPLEXITY_MULTIPLIERS.standard;
  const mid = Math.max(EFFORT_MODEL.minQuoteINR, effort * mult);
  return {
    minINR: roundINR(mid * (1 - EFFORT_MODEL.rangeSpread)),
    maxINR: roundINR(mid * (1 + EFFORT_MODEL.rangeSpread)),
    midINR: roundINR(mid),
  };
}

/**
 * §5/§6 derived business outputs — every block carries its OWN label.
 * These blocks never feed the quote label (they are not quote evidence),
 * but they fully satisfy the evidence-metadata contract internally.
 *
 * founderFloor rule (CRITICAL): if a true floor cannot be calculated from
 * founder-defined cost + margin data → founderFloor.label = UNKNOWN.
 * NEVER an arbitrary number. NEVER the public list price.
 */
function founderFloorFor(input = {}) {
  const cost = Number(input.founderCostINR);
  const marginPct = Number(input.targetMarginPct);
  if (Number.isFinite(cost) && cost > 0 && Number.isFinite(marginPct) && marginPct >= 0 && marginPct < 100) {
    return {
      valueINR: roundINR(cost / (1 - marginPct / 100)),
      label: LABELS.FOUNDER_JUDGMENT,
      source: { type: "founder_input", ref: "founderCostINR+targetMarginPct", retrievedAt: new Date().toISOString() },
      basis: "founder_defined_cost_and_margin",
    };
  }
  return {
    valueINR: null,
    label: LABELS.UNKNOWN,
    source: null,
    reason: "NO_VERIFIED_COST_OR_MARGIN_DATA",
    note: "Floor must be founder-defined from verified cost/margin — never invented",
  };
}

function recurringFor(serviceType, anchors, input = {}) {
  const monthlyInput = Number(input.recurringMonthlyINR);
  if (Number.isFinite(monthlyInput) && monthlyInput >= 0) {
    return {
      monthlyINR: roundINR(monthlyInput),
      annualINR: roundINR(monthlyInput * 12),
      label: LABELS.FOUNDER_JUDGMENT,
      source: { type: "founder_input", ref: "recurringMonthlyINR", retrievedAt: new Date().toISOString() },
    };
  }
  if (serviceType === "saas_subscription" && anchors.length > 0) {
    const fresh = anchors.filter((a) => !a.isStale).map((a) => a.amountINR);
    const use = fresh.length > 0 ? fresh : anchors.map((a) => a.amountINR);
    const min = Math.min(...use);
    const max = Math.max(...use);
    const stale = anchors.some((a) => a.isStale);
    return {
      monthlyINR: roundINR(min),
      monthlyMaxINR: roundINR(max),
      annualINR: roundINR(min * 12),
      annualMaxINR: roundINR(max * 12),
      label: stale ? LABELS.PARTIAL : LABELS.VERIFIED,
      source: { type: "url", ref: "https://www.garudaos.in/pricing", retrievedAt: anchors[0].source?.retrievedAt || null },
    };
  }
  return {
    monthlyINR: null,
    annualINR: null,
    label: LABELS.UNKNOWN,
    source: null,
    reason: "NO_RECURRING_COMPONENT_IDENTIFIED",
  };
}

function costBlock(valueINR, ref) {
  if (Number.isFinite(valueINR)) {
    return {
      valueINR: roundINR(valueINR),
      label: LABELS.FOUNDER_JUDGMENT,
      source: { type: "founder_input", ref, retrievedAt: new Date().toISOString() },
    };
  }
  return { valueINR: null, label: LABELS.UNKNOWN, source: null, reason: `NO_${ref.toUpperCase()}_DATA` };
}

/**
 * Contradiction detector (pure, unit-testable):
 * same-tag fixed anchors whose amounts differ by more than 30% of the min
 * are contradictory evidence → warning + CONTRADICTED evidence (downgrades
 * the quote label via combineLabels).
 */
function detectContradiction(anchors = []) {
  const fixed = anchors.filter((a) => a.kind === "fixed" || a.kind === "subscription").map((a) => a.amountINR).filter((n) => Number.isFinite(n) && n > 0);
  if (fixed.length < 2) return { contradicted: false, evidence: null };
  const min = Math.min(...fixed);
  const max = Math.max(...fixed);
  if (max / min > 1.3) {
    return {
      contradicted: true,
      evidence: makeEvidence({
        field: "price_evidence_contradiction",
        label: LABELS.CONTRADICTED,
        value: { minINR: min, maxINR: max, anchorCount: fixed.length },
        source: { type: "model", ref: "pricingIntelligenceEngine.detectContradiction", retrievedAt: null },
        note: "Verified anchors disagree by >30% — surface as PARTIAL, never silent",
      }),
    };
  }
  return { contradicted: false, evidence: null };
}

function buildDerived(input, quote, label, serviceType, anchors) {
  const derived = {
    founderFloor: founderFloorFor(input),
    recurring: recurringFor(serviceType, anchors, input),
    thirdPartyCosts: costBlock(Number(input.thirdPartyCostsINR), "thirdPartyCosts"),
    infrastructureCosts: costBlock(Number(input.infrastructureCostsINR), "infrastructureCosts"),
    supportCosts: costBlock(Number(input.supportMonthlyINR), "supportMonthly"),
    negotiationRange: quote ? { minINR: quote.minINR, maxINR: quote.maxINR, label } : { minINR: null, maxINR: null, label: LABELS.UNKNOWN },
    recommendedQuote: null,
    assumptions: [],
  };
  if (quote) {
    const mid = quote.basis === "verified_fixed_price"
      ? quote.minINR
      : roundINR((quote.minINR + quote.maxINR) / 2);
    derived.recommendedQuote = { valueINR: mid, label, basis: quote.basis === "verified_fixed_price" ? "verified_fixed" : "band_midpoint" };
  } else {
    derived.recommendedQuote = { valueINR: null, label: LABELS.UNKNOWN, reason: "NO_QUOTE" };
  }
  if (!input.complexity) derived.assumptions.push('complexity defaults to "standard" unless stated');
  if (quote?.basis === "effort_model_v1") derived.assumptions.push("Range built from declared methodology v1 (ESTIMATE, not market data)");
  if (quote?.basis?.startsWith("verified")) derived.assumptions.push("Anchored to verified garudaos.in/pricing snapshot");
  derived.assumptions.push("Founding inputs (cost/margin/recurring/third-party/support) used only when founder-supplied");
  return derived;
}

/**
 * Main deterministic entry point.
 *
 * @param {object} input
 * @param {string} input.serviceType   alias or normalized tag
 * @param {object} [input.scope]       { pages, features, flows }
 * @param {string} [input.complexity]  basic|standard|complex
 * @param {number} [input.timelineDays]
 * @param {object} [options]           { nowMs } for deterministic staleness tests
 * @returns {object} pricing result (see return shape below)
 */
function quote(input = {}, options = {}) {
  const nowMs = options.nowMs || Date.now();
  const warnings = [];
  const evidence = [];

  const serviceType = normalizeServiceType(
    input.serviceType || input.service || input.tag
  );
  if (!serviceType) {
    return {
      success: false,
      reason: "UNSUPPORTED_SERVICE_TYPE",
      serviceType: input.serviceType || null,
      label: LABELS.UNKNOWN,
      quote: null,
      lineItems: [],
      derived: buildDerived(input, null, LABELS.UNKNOWN, null, []),
      evidence: [unknownEvidence("serviceType", "No supported service mapping")],
      missingInputs: ["serviceType"],
      warnings,
    };
  }

  const scope = input.scope || {};
  const complexity = COMPLEXITY_MULTIPLIERS[input.complexity] ? input.complexity : "standard";
  const missing = missingInputsFor(serviceType, scope);

  // Resolve verified anchors from evidence store
  const anchors = pricingEvidenceStore.findEntries(serviceType, { nowMs });
  const staleAnchor = anchors.find((a) => a.isStale);
  if (staleAnchor) warnings.push("PRICE_SNAPSHOT_STALE");

  if (anchors.length > 0) {
    for (const a of anchors) {
      evidence.push(
        makeEvidence({
          field: `anchor:${a.id}`,
          label: a.isStale ? LABELS.PARTIAL : LABELS.VERIFIED,
          value: { amountINR: a.amountINR, title: a.title, kind: a.kind, period: a.period },
          source: a.source,
          note: a.isStale ? "STALE_SNAPSHOT" : null,
        })
      );
    }
  } else if (missing.length > 0) {
    // Only the true UNKNOWN path records a missing-anchor as evidence;
    // the effort-model path documents itself via its own ESTIMATE evidence.
    evidence.push(unknownEvidence(`anchor:${serviceType}`, "No verified catalog anchor for this service"));
  }

  // ---------- UNKNOWN path: no anchor AND cannot estimate ----------
  if (anchors.length === 0 && missing.length > 0) {
    return {
      success: false,
      reason: "INSUFFICIENT_VERIFIABLE_INPUTS",
      serviceType,
      label: LABELS.UNKNOWN,
      quote: null,
      lineItems: [],
      derived: buildDerived(input, null, LABELS.UNKNOWN, serviceType, anchors),
      evidence,
      missingInputs: missing,
      warnings,
    };
  }

  // ---------- Deterministic quote construction ----------
  const lineItems = [];
  let quoteLabel;
  let quote;

  if (serviceType === "saas_subscription" && anchors.length > 0 && missing.length === 0) {
    // Subscription → verified range across tiers (not a single point)
    const amounts = anchors.map((a) => a.amountINR);
    const anyStale = anchors.some((a) => a.isStale);
    quoteLabel = anyStale ? LABELS.PARTIAL : LABELS.VERIFIED;
    quote = {
      minINR: Math.min(...amounts),
      maxINR: Math.max(...amounts),
      currency: CURRENCY,
      basis: "verified_subscription_range",
      period: "month",
    };
    for (const a of anchors) {
      lineItems.push({
        name: a.title,
        amountINR: a.amountINR,
        amountType: "monthly",
        label: a.isStale ? LABELS.PARTIAL : LABELS.VERIFIED,
        source: a.source,
      });
    }
  } else {
  const fixedAnchor = anchors.find((a) => a.kind === "fixed" || a.kind === "subscription");
  const fromAnchor = anchors.find((a) => a.kind === "project_from");

  if (fromAnchor && missing.length === 0) {
    // Verified "from" price + declared complexity scaling → PARTIAL honesty
    const mult = COMPLEXITY_MULTIPLIERS[complexity];
    const minINR = fromAnchor.amountINR;
    const maxINR = roundINR(minINR * mult * (1 + EFFORT_MODEL.rangeSpread));
    quoteLabel =
      anchors.every((a) => !a.isStale) && complexity === "basic"
        ? LABELS.VERIFIED
        : LABELS.PARTIAL;
    quote = { minINR, maxINR, currency: CURRENCY, basis: "verified_from_price" };
    lineItems.push({
      name: `${fromAnchor.title}`,
      amountINR: minINR,
      amountType: "floor_from_price",
      label: fromAnchor.isStale ? LABELS.PARTIAL : LABELS.VERIFIED,
      source: fromAnchor.source,
    });
    if (complexity !== "basic") {
      lineItems.push({
        name: `Scope scaling (${complexity} ×${mult})`,
        amountINR: maxINR - minINR,
        amountType: "complexity_band",
        label: LABELS.ESTIMATE,
        source: modelSource(),
      });
      evidence.push(
        makeEvidence({
          field: "complexity_scaling",
          label: LABELS.ESTIMATE,
          value: { complexity, multiplier: mult },
          source: modelSource(),
        })
      );
    }
    if (anchors.length > 1) {
      quoteLabel = combineLabels([quoteLabel, LABELS.PARTIAL]);
    }
  } else if (fixedAnchor && missing.length === 0) {
    // Fixed/subscription verified price
    quoteLabel = fixedAnchor.isStale ? LABELS.PARTIAL : LABELS.VERIFIED;
    quote = {
      minINR: fixedAnchor.amountINR,
      maxINR: fixedAnchor.amountINR,
      currency: CURRENCY,
      basis: "verified_fixed_price",
      period: fixedAnchor.period,
    };
    lineItems.push({
      name: fixedAnchor.title,
      amountINR: fixedAnchor.amountINR,
      amountType: fixedAnchor.period === "month" ? "monthly" : "fixed",
      label: fixedAnchor.isStale ? LABELS.PARTIAL : LABELS.VERIFIED,
      source: fixedAnchor.source,
    });
  } else {
    // No anchor (or anchor stale+missing) → declared-methodology ESTIMATE
    const est = effortEstimate(scope, complexity);
    quoteLabel = LABELS.ESTIMATE;
    quote = { minINR: est.minINR, maxINR: est.maxINR, currency: CURRENCY, basis: "effort_model_v1" };
    lineItems.push({
      name: "Scoped build estimate (declared methodology)",
      amountINR: est.midINR,
      amountType: "midpoint",
      label: LABELS.ESTIMATE,
      source: modelSource(),
    });
    evidence.push(
      makeEvidence({
        field: "effort_model",
        label: LABELS.ESTIMATE,
        value: { ...EFFORT_MODEL, scope, complexity },
        source: modelSource(),
        note: "Internal methodology — NOT a verified market price",
      })
    );
  }
  } // end non-subscription branch

  // Anchor with missing required inputs → downgrade to PARTIAL + keep missing list
  if (missing.length > 0 && quote) {
    quoteLabel = LABELS.PARTIAL;
  }

  const label = combineLabels([
    quoteLabel,
    ...(missing.length > 0 ? [LABELS.UNKNOWN] : []),
  ]);

  // ---------- Contradictory evidence (§23C) ----------
  const contradiction = detectContradiction(anchors);
  if (contradiction.contradicted) {
    warnings.push("PRICE_EVIDENCE_CONTRADICTED");
    evidence.push(contradiction.evidence);
  }

  return {
    success: true,
    serviceType,
    complexity,
    label,
    quote,
    lineItems,
    derived: buildDerived(input, quote, label, serviceType, anchors),
    evidence,
    missingInputs: missing,
    warnings,
    methodology: EFFORT_MODEL.modelId,
    snapshot: pricingEvidenceStore.getSnapshotStatus({ nowMs }).live,
  };
}

/**
 * SaaS subscription tier listing (verified range, deterministic).
 */
function subscriptionTiers(options = {}) {
  const entries = pricingEvidenceStore
    .getLiveEntries(options)
    .filter((e) => e.tag === "saas_subscription");
  if (entries.length === 0) {
    return { label: LABELS.UNKNOWN, tiers: [], missingInputs: ["saas_tiers"] };
  }
  const min = Math.min(...entries.map((e) => e.amountINR));
  const max = Math.max(...entries.map((e) => e.amountINR));
  return {
    label: entries.some((e) => e.isStale) ? LABELS.PARTIAL : LABELS.VERIFIED,
    range: { minINR: min, maxINR: max, period: "month", currency: CURRENCY },
    tiers: entries.map((e) => ({
      id: e.id,
      title: e.title,
      amountINR: e.amountINR,
      period: e.period,
      source: e.source,
      isStale: e.isStale,
    })),
    warnings: entries.some((e) => e.isStale) ? ["PRICE_SNAPSHOT_STALE"] : [],
  };
}

module.exports = {
  quote,
  subscriptionTiers,
  normalizeServiceType,
  detectContradiction,
  founderFloorFor,
  SERVICE_ALIASES,
  COMPLEXITY_MULTIPLIERS,
  EFFORT_MODEL,
  REQUIRED_INPUTS,
};
