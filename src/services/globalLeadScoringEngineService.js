/**
 * GARUDA Global Lead Scoring & Rejection Classification Engine
 * Evaluates commercial opportunities across global markets (US, UK, EU, UAE/GCC, Canada, Australia, Singapore).
 *
 * Provides deterministic 0-100 scoring, commercial qualification tiers,
 * and transparent rejection taxonomy.
 */

const { detectCurrency, convertToINR, inspectOpportunitySafety } = require("./discoveryAdapters/baseAdapter");
const revenueValueModel = require("./revenueValueModelService");
const capabilityRegistry = require("./capabilityRegistryService");

const QUALIFICATION_TIERS = Object.freeze({
  HIGH_VALUE: "HIGH_VALUE",
  GOOD: "GOOD",
  WEAK: "WEAK",
  REJECTED: "REJECTED",
  PROHIBITED: "PROHIBITED"
});

const REJECTION_REASONS = Object.freeze({
  EMPLOYMENT_JOB_SEEKER_LISTING: "EMPLOYMENT_JOB_SEEKER_LISTING",
  BUDGET_BELOW_MINIMUM: "BUDGET_BELOW_MINIMUM",
  NO_COMMERCIAL_INTENT: "NO_COMMERCIAL_INTENT",
  INSUFFICIENT_PROJECT_INFO: "INSUFFICIENT_PROJECT_INFO",
  POOR_CAPABILITY_MATCH: "POOR_CAPABILITY_MATCH",
  SCAM_OR_UPFRONT_FEE_INDICATOR: "SCAM_OR_UPFRONT_FEE_INDICATOR",
  PROHIBITED_CATEGORY: "PROHIBITED_CATEGORY",
  DUPLICATE_FINGERPRINT: "DUPLICATE_FINGERPRINT",
  NO_ACTIONABLE_CONTACT_PATH: "NO_ACTIONABLE_CONTACT_PATH",
  SOURCE_UNRELIABLE: "SOURCE_UNRELIABLE"
});

const COMMERCIAL_KEYWORDS = [
  "build", "develop", "contract", "freelance", "project", "rfp", "custom", "saas",
  "mvp", "automation", "agent", "bot", "crm", "workflow", "pipeline", "api", "integration",
  "fixed price", "budget", "quote", "hourly rate", "bounty", "deliverable"
];

const EMPLOYMENT_SIGNALS = [
  "annual salary", "w2 only", "401k", "health insurance benefits", "full-time employee",
  "on-site daily", "w-2", "dental coverage", "paid time off"
];

const NON_SOFTWARE_TRADES = [
  "hardware assembly", "physical repair", "hvac", "plumbing", "construction",
  "warehouse worker", "cleaning", "carpentry", "electrician", "mechanic", "nurse",
  "server rack physical", "industrial air conditioning"
];

class GlobalLeadScoringEngineService {
  /**
   * Evaluates an opportunity and returns comprehensive commercial score, tier, and rejection reason if applicable.
   */
  evaluateOpportunity(opp = {}) {
    const title = String(opp.title || "").trim();
    const description = String(opp.description || "").trim();
    const salary = String(opp.salary || opp.salaryText || opp.budget || "").trim();
    const tags = Array.isArray(opp.tags) ? opp.tags.join(" ") : "";
    const searchable = `${title} ${description} ${salary} ${tags}`.toLowerCase();

    // 1. Safety & Fraud Gate
    const safety = inspectOpportunitySafety(opp);
    if (!safety.accepted) {
      let reason = REJECTION_REASONS.SCAM_OR_UPFRONT_FEE_INDICATOR;
      if (safety.rejectionReasons.includes("prohibited_or_age_restricted_category")) {
        reason = REJECTION_REASONS.PROHIBITED_CATEGORY;
      } else if (safety.rejectionReasons.includes("missing_secure_original_link")) {
        reason = REJECTION_REASONS.NO_ACTIONABLE_CONTACT_PATH;
      }

      return {
        leadScore: 0,
        qualificationTier: QUALIFICATION_TIERS.PROHIBITED,
        accepted: false,
        rejectionReason: reason,
        breakdown: { intent: 0, capability: 0, marketValue: 0, clarity: 0 }
      };
    }

    // 2. Actionable Contact / URL Gate
    const url = String(opp.url || opp.sourceUrl || "");
    if (!/^https?:\/\//i.test(url)) {
      return {
        leadScore: 10,
        qualificationTier: QUALIFICATION_TIERS.REJECTED,
        accepted: false,
        rejectionReason: REJECTION_REASONS.NO_ACTIONABLE_CONTACT_PATH,
        breakdown: { intent: 5, capability: 5, marketValue: 0, clarity: 0 }
      };
    }

    // 3. Information Sufficiency Gate
    if (description.length < 30 && title.length < 15) {
      return {
        leadScore: 15,
        qualificationTier: QUALIFICATION_TIERS.REJECTED,
        accepted: false,
        rejectionReason: REJECTION_REASONS.INSUFFICIENT_PROJECT_INFO,
        breakdown: { intent: 5, capability: 5, marketValue: 5, clarity: 0 }
      };
    }

    // 4. Physical Non-Software Trade Check
    if (NON_SOFTWARE_TRADES.some((trade) => searchable.includes(trade))) {
      return {
        leadScore: 20,
        qualificationTier: QUALIFICATION_TIERS.REJECTED,
        accepted: false,
        rejectionReason: REJECTION_REASONS.POOR_CAPABILITY_MATCH,
        breakdown: { intent: 5, capability: 0, marketValue: 5, clarity: 0 }
      };
    }

    // 5. Commercial Intent vs Traditional W2 Employment Check
    const hasEmploymentSignal = EMPLOYMENT_SIGNALS.some((sig) => searchable.includes(sig));
    const commercialSignalCount = COMMERCIAL_KEYWORDS.filter((kw) => searchable.includes(kw)).length;

    let intentScore = Math.min(30, commercialSignalCount * 6);
    if (hasEmploymentSignal && !searchable.includes("contract") && !searchable.includes("freelance")) {
      return {
        leadScore: 25,
        qualificationTier: QUALIFICATION_TIERS.REJECTED,
        accepted: false,
        rejectionReason: REJECTION_REASONS.EMPLOYMENT_JOB_SEEKER_LISTING,
        breakdown: { intent: 10, capability: 10, marketValue: 5, clarity: 0 }
      };
    }

    // 6. Capability Match Score (0 - 30)
    const capabilityMatch = capabilityRegistry.matchDemandUniversal({ title, description });
    let capabilityScore = Math.min(30, Math.round(capabilityMatch.capabilityMatchScore * 0.3));

    if (capabilityScore < 10) {
      return {
        leadScore: 28,
        qualificationTier: QUALIFICATION_TIERS.REJECTED,
        accepted: false,
        rejectionReason: REJECTION_REASONS.POOR_CAPABILITY_MATCH,
        breakdown: { intent: intentScore, capability: capabilityScore, marketValue: 0, clarity: 0 }
      };
    }

    // 6. Global Market Value & Currency Score (0 - 25)
    const currency = detectCurrency(searchable);
    const rawBudgetMatch = searchable.match(/(?:[$€£₹]|usd|inr|eur|gbp|aed|cad|aud|sgd)\s*(\d[\d,]*)/i);
    const rawBudgetNumber = rawBudgetMatch ? parseInt(rawBudgetMatch[1].replace(/,/g, ""), 10) : null;

    if (rawBudgetNumber !== null && rawBudgetNumber > 0 && rawBudgetNumber < 200 && !searchable.includes("bounty") && currency === "USD") {
      return {
        leadScore: 22,
        qualificationTier: QUALIFICATION_TIERS.REJECTED,
        accepted: false,
        rejectionReason: REJECTION_REASONS.BUDGET_BELOW_MINIMUM,
        breakdown: { intent: intentScore, capability: capabilityScore, marketValue: 2, clarity: 0 }
      };
    }

    const estimate = revenueValueModel.estimateValueFromEvidence(searchable, { valueType: "salary_contract_compensation" });
    const estimatedUSD = rawBudgetNumber && currency === "USD"
      ? rawBudgetNumber
      : (estimate.estimatedUSD || (estimate.estimatedINR ? Math.round(estimate.estimatedINR / 85) : 500));

    let marketValueScore = 10;
    if (estimatedUSD >= 5000) marketValueScore = 25;
    else if (estimatedUSD >= 2500) marketValueScore = 20;
    else if (estimatedUSD >= 1000) marketValueScore = 15;
    else if (estimatedUSD < 200 && !searchable.includes("bounty")) {
      return {
        leadScore: 24,
        qualificationTier: QUALIFICATION_TIERS.REJECTED,
        accepted: false,
        rejectionReason: REJECTION_REASONS.BUDGET_BELOW_MINIMUM,
        breakdown: { intent: intentScore, capability: capabilityScore, marketValue: 5, clarity: 5 }
      };
    }

    // 7. Clarity & Urgency Score (0 - 15)
    let clarityScore = 5;
    if (description.length > 200) clarityScore += 5;
    if (searchable.includes("immediate") || searchable.includes("urgent") || searchable.includes("mvp") || searchable.includes("weeks")) clarityScore += 5;

    // Total Score Calculation (0 - 100)
    const totalScore = Math.min(100, Math.max(0, intentScore + capabilityScore + marketValueScore + clarityScore));

    // Qualification Tier Determination
    let tier = QUALIFICATION_TIERS.WEAK;
    if (totalScore >= 75 && estimatedUSD >= 1000) {
      tier = QUALIFICATION_TIERS.HIGH_VALUE;
    } else if (totalScore >= 55) {
      tier = QUALIFICATION_TIERS.GOOD;
    }

    return {
      leadScore: totalScore,
      qualificationTier: tier,
      accepted: tier === QUALIFICATION_TIERS.HIGH_VALUE || tier === QUALIFICATION_TIERS.GOOD,
      rejectionReason: null,
      matchedCapability: capabilityMatch.bestMatch?.name || "Custom Software Development",
      currency,
      estimatedUSD,
      estimatedINR: convertToINR(estimatedUSD, "USD"),
      breakdown: {
        intent: intentScore,
        capability: capabilityScore,
        marketValue: marketValueScore,
        clarity: clarityScore
      }
    };
  }
}

module.exports = new GlobalLeadScoringEngineService();
