/**
 * GARUDA FOUNDER INTELLIGENCE — Business Calculator (Phase 8)
 * Pure deterministic arithmetic. Every result labeled ESTIMATE
 * unless inputs themselves carry VERIFIED evidence.
 * NEVER invents costs — missing cost inputs → UNKNOWN fields.
 */

const { LABELS, unknownEvidence } = require("./evidenceLabels");

function roundINR(v) {
  return Math.round(v);
}

/**
 * Margin analysis: founder supplies actual cost inputs.
 * @param {{revenueINR:number, costINR:number}} input
 */
function margin({ revenueINR, costINR } = {}) {
  const missing = [];
  if (!Number.isFinite(revenueINR)) missing.push("revenueINR");
  if (!Number.isFinite(costINR)) missing.push("costINR");
  if (missing.length > 0) {
    return { success: false, label: LABELS.UNKNOWN, missingInputs: missing, unknowns: missing.map((f) => unknownEvidence(f)) };
  }
  const grossINR = revenueINR - costINR;
  const marginPct = revenueINR > 0 ? (grossINR / revenueINR) * 100 : null;
  return {
    success: true,
    label: LABELS.ESTIMATE,
    revenueINR: roundINR(revenueINR),
    costINR: roundINR(costINR),
    grossProfitINR: roundINR(grossINR),
    marginPct: marginPct === null ? null : Math.round(marginPct * 100) / 100,
    basis: "founder-provided inputs (FOUNDER_JUDGMENT in, ESTIMATE out)",
    missingInputs: [],
  };
}

/**
 * Discount impact from list price to final price.
 * @param {{listINR:number, discountPct:number}} input
 */
function discountImpact({ listINR, discountPct } = {}) {
  const missing = [];
  if (!Number.isFinite(listINR)) missing.push("listINR");
  if (!Number.isFinite(discountPct)) missing.push("discountPct");
  if (missing.length > 0) {
    return { success: false, label: LABELS.UNKNOWN, missingInputs: missing };
  }
  if (discountPct < 0 || discountPct > 100) {
    return { success: false, label: LABELS.UNKNOWN, missingInputs: [], error: "DISCOUNT_OUT_OF_RANGE" };
  }
  const discountINR = (listINR * discountPct) / 100;
  return {
    success: true,
    label: LABELS.ESTIMATE,
    listINR: roundINR(listINR),
    discountPct,
    discountINR: roundINR(discountINR),
    finalINR: roundINR(listINR - discountINR),
  };
}

/**
 * Milestone split: deposit % at start, rest on delivery.
 * Default GARUDA governance: 50% deposit (verified on pricing page).
 * @param {{totalINR:number, depositPct?:number}} input
 */
function milestoneSplit({ totalINR, depositPct = 50 } = {}) {
  if (!Number.isFinite(totalINR)) {
    return { success: false, label: LABELS.UNKNOWN, missingInputs: ["totalINR"] };
  }
  if (depositPct < 0 || depositPct > 100) {
    return { success: false, label: LABELS.UNKNOWN, missingInputs: [], error: "DEPOSIT_PCT_OUT_OF_RANGE" };
  }
  const depositINR = (totalINR * depositPct) / 100;
  return {
    success: true,
    label: LABELS.ESTIMATE,
    totalINR: roundINR(totalINR),
    depositPct,
    depositINR: roundINR(depositINR),
    balanceINR: roundINR(totalINR - depositINR),
    governanceNote:
      depositPct === 50
        ? "Matches verified GARUDA 50% milestone governance (garudaos.in/pricing)"
        : "Non-standard split — founder decision required",
    governanceLabel: depositPct === 50 ? LABELS.VERIFIED : LABELS.FOUNDER_JUDGMENT,
  };
}

/**
 * Break-even units: how many units to recover fixed cost at unit economics.
 * @param {{fixedCostINR:number, unitPriceINR:number, unitCostINR:number}} input
 */
function breakEven({ fixedCostINR, unitPriceINR, unitCostINR } = {}) {
  const missing = [];
  if (!Number.isFinite(fixedCostINR)) missing.push("fixedCostINR");
  if (!Number.isFinite(unitPriceINR)) missing.push("unitPriceINR");
  if (!Number.isFinite(unitCostINR)) missing.push("unitCostINR");
  if (missing.length > 0) {
    return { success: false, label: LABELS.UNKNOWN, missingInputs: missing };
  }
  const contribution = unitPriceINR - unitCostINR;
  if (contribution <= 0) {
    return { success: false, label: LABELS.UNKNOWN, missingInputs: [], error: "NON_POSITIVE_CONTRIBUTION" };
  }
  return {
    success: true,
    label: LABELS.ESTIMATE,
    contributionPerUnitINR: roundINR(contribution),
    breakEvenUnits: Math.ceil(fixedCostINR / contribution),
    basis: "founder-provided unit economics",
  };
}

// ---------------- §10 ADDITIONAL DETERMINISTIC CALCULATORS ----------------

function monthsOf(months, fallback = 12) {
  return Number.isFinite(months) && months > 0 ? Math.round(months) : fallback;
}

/** Recurring revenue over a period from a monthly figure. */
function recurringRevenue({ monthlyINR, months } = {}) {
  if (!Number.isFinite(monthlyINR)) {
    return { success: false, label: LABELS.UNKNOWN, missingInputs: ["monthlyINR"] };
  }
  const m = monthsOf(months);
  return {
    success: true,
    label: LABELS.ESTIMATE,
    monthlyINR: roundINR(monthlyINR),
    months: m,
    periodTotalINR: roundINR(monthlyINR * m),
    annualINR: roundINR(monthlyINR * 12),
    basis: "founder-provided monthly recurring",
  };
}

/** Annual Contract Value — from annual figure or normalized monthly. */
function acv({ monthlyINR, annualINR, months } = {}) {
  if (Number.isFinite(annualINR)) {
    return {
      success: true,
      label: LABELS.ESTIMATE,
      acvINR: roundINR(annualINR),
      basis: "founder-provided annual value",
      missingInputs: [],
    };
  }
  if (Number.isFinite(monthlyINR)) {
    const m = monthsOf(months);
    return {
      success: true,
      label: LABELS.ESTIMATE,
      acvINR: roundINR(monthlyINR * m),
      normalizedFromMonthly: roundINR(monthlyINR),
      months: m,
      basis: "monthly × months normalization",
      missingInputs: [],
    };
  }
  return { success: false, label: LABELS.UNKNOWN, missingInputs: ["annualINR|monthlyINR"] };
}

/** Support cost over a period. */
function supportCost({ monthlySupportINR, months } = {}) {
  if (!Number.isFinite(monthlySupportINR)) {
    return { success: false, label: LABELS.UNKNOWN, missingInputs: ["monthlySupportINR"] };
  }
  const m = monthsOf(months);
  return {
    success: true,
    label: LABELS.ESTIMATE,
    monthlyINR: roundINR(monthlySupportINR),
    months: m,
    totalINR: roundINR(monthlySupportINR * m),
    basis: "founder-provided support cost",
  };
}

/** Setup (one-time) + recurring model — total contract economics. */
function setupRecurring({ setupINR, monthlyINR, months } = {}) {
  const missing = [];
  if (!Number.isFinite(setupINR)) missing.push("setupINR");
  if (!Number.isFinite(monthlyINR)) missing.push("monthlyINR");
  if (missing.length > 0) {
    return { success: false, label: LABELS.UNKNOWN, missingInputs: missing };
  }
  const m = monthsOf(months);
  const recurringTotal = monthlyINR * m;
  return {
    success: true,
    label: LABELS.ESTIMATE,
    setupINR: roundINR(setupINR),
    monthlyINR: roundINR(monthlyINR),
    months: m,
    recurringTotalINR: roundINR(recurringTotal),
    contractTotalINR: roundINR(setupINR + recurringTotal),
    basis: "setup + (monthly × months)",
  };
}

/** Monthly vs annual comparison with saving delta. */
function monthlyVsAnnual({ monthlyINR, annualINR } = {}) {
  const missing = [];
  if (!Number.isFinite(monthlyINR)) missing.push("monthlyINR");
  if (!Number.isFinite(annualINR)) missing.push("annualINR");
  if (missing.length > 0) {
    return { success: false, label: LABELS.UNKNOWN, missingInputs: missing };
  }
  const monthlyAnnualized = monthlyINR * 12;
  const savingINR = monthlyAnnualized - annualINR;
  const savingPct = monthlyAnnualized > 0 ? (savingINR / monthlyAnnualized) * 100 : null;
  return {
    success: true,
    label: LABELS.ESTIMATE,
    monthlyAnnualizedINR: roundINR(monthlyAnnualized),
    annualINR: roundINR(annualINR),
    savingINR: roundINR(savingINR),
    savingPct: savingPct === null ? null : Math.round(savingPct * 100) / 100,
    cheaper: savingINR > 0 ? "annual" : savingINR < 0 ? "monthly" : "equal",
  };
}

/** Infrastructure cost — sum of founder-provided components only. */
function infrastructureCost({ components } = {}) {
  if (!Array.isArray(components) || components.length === 0) {
    return { success: false, label: LABELS.UNKNOWN, missingInputs: ["components[]"] };
  }
  const valid = components.filter((c) => c && Number.isFinite(c.amountINR));
  if (valid.length === 0) {
    return { success: false, label: LABELS.UNKNOWN, missingInputs: ["components[].amountINR"] };
  }
  const total = valid.reduce((s, c) => s + c.amountINR, 0);
  return {
    success: true,
    label: LABELS.FOUNDER_JUDGMENT,
    totalINR: roundINR(total),
    components: valid.map((c) => ({ name: String(c.name || "component").slice(0, 60), amountINR: roundINR(c.amountINR) })),
    droppedInvalid: components.length - valid.length,
    basis: "founder-provided components (invalid entries dropped, never invented)",
  };
}

module.exports = {
  margin,
  discountImpact,
  milestoneSplit,
  breakEven,
  recurringRevenue,
  acv,
  supportCost,
  setupRecurring,
  monthlyVsAnnual,
  infrastructureCost,
};
