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

const CONTACT_PATH_TYPES = Object.freeze({
  DIRECT_BUSINESS_PROJECT_CONTACT: "DIRECT_BUSINESS_PROJECT_CONTACT", // Type A
  PROCUREMENT_RFP_CONTACT: "PROCUREMENT_RFP_CONTACT",                 // Type B
  FOUNDER_OWNER_DECISION_MAKER_CONTACT: "FOUNDER_OWNER_DECISION_MAKER_CONTACT", // Type C
  BUSINESS_CONTACT_FORM: "BUSINESS_CONTACT_FORM",                     // Type D
  AGENCY_PARTNERSHIP_PATH: "AGENCY_PARTNERSHIP_PATH",                 // Type E
  JOB_BOARD_APPLICATION_ONLY: "JOB_BOARD_APPLICATION_ONLY",         // Type F (Blocked from outbound)
  NO_ACTIONABLE_CONTACT_PATH: "NO_ACTIONABLE_CONTACT_PATH"            // Type G (Blocked from outbound)
});

const REJECTION_REASONS = Object.freeze({
  EMPLOYMENT_JOB_SEEKER_LISTING: "EMPLOYMENT_JOB_SEEKER_LISTING",
  TALENT_MARKETPLACE_ROSTER_RECRUITMENT: "TALENT_MARKETPLACE_ROSTER_RECRUITMENT",
  JOB_BOARD_APPLICATION_ONLY: "JOB_BOARD_APPLICATION_ONLY",
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
  "fixed price", "budget", "quote", "hourly rate", "bounty", "deliverable", "vendor", "implementation partner"
];

const EMPLOYMENT_SIGNALS = [
  "annual salary", "w2 only", "401k", "health insurance benefits", "full-time employee",
  "on-site daily", "w-2", "dental coverage", "paid time off", "join our team", "internal team",
  "f/m/d", "maternity leave", "equity grant"
];

const TALENT_MARKETPLACE_SIGNALS = [
  "lemon.io", "toptal", "a.team", "azumo", "telus digital", "marketplace that connects you",
  "talent pool", "join our network", "roster of freelancers"
];

const NON_SOFTWARE_TRADES = [
  "hardware assembly", "physical repair", "hvac", "plumbing", "construction",
  "warehouse worker", "cleaning", "carpentry", "electrician", "mechanic", "nurse",
  "server rack physical", "industrial air conditioning"
];

class GlobalLeadScoringEngineService {
  /**
   * Classifies the decision-maker contact path into Types A-G.
   */
  classifyContactPath(opp = {}) {
    if (opp.contactType && CONTACT_PATH_TYPES[opp.contactType]) {
      return opp.contactType;
    }
    if (opp.contactEmail && typeof opp.contactEmail === "string" && opp.contactEmail.includes("@")) {
      return CONTACT_PATH_TYPES.DIRECT_BUSINESS_PROJECT_CONTACT;
    }
    if (opp.isDirectClientRfp || opp.source === "custom_software_rfp") {
      return CONTACT_PATH_TYPES.PROCUREMENT_RFP_CONTACT;
    }

    const url = String(opp.url || opp.sourceUrl || "").toLowerCase();
    if (!url || !/^https?:\/\//i.test(url)) {
      return CONTACT_PATH_TYPES.NO_ACTIONABLE_CONTACT_PATH;
    }
    if (url.includes("remotive.com") || url.includes("weworkremotely.com") || url.includes("remoteok.com") || url.includes("remote-jobs")) {
      return CONTACT_PATH_TYPES.JOB_BOARD_APPLICATION_ONLY;
    }
    if (url.includes("/contact") || url.includes("/rfp") || url.includes("/partners") || url.includes("/bounties") || url.includes("/bounty") || url.includes("/project") || url.includes("github.com")) {
      return CONTACT_PATH_TYPES.BUSINESS_CONTACT_FORM;
    }

    return CONTACT_PATH_TYPES.JOB_BOARD_APPLICATION_ONLY;
  }

  /**
   * Evaluates an opportunity and returns comprehensive commercial score, tier, and rejection reason if applicable.
   */
  evaluateOpportunity(opp = {}) {
    const title = String(opp.title || "").trim();
    const description = String(opp.description || "").trim();
    const salary = String(opp.salary || opp.salaryText || opp.budget || "").trim();
    const company = String(opp.company || "").toLowerCase();
    const tags = Array.isArray(opp.tags) ? opp.tags.join(" ") : "";
    const searchable = `${title} ${description} ${salary} ${tags} ${company}`.toLowerCase();

    const contactPath = this.classifyContactPath(opp);
    const isDirectClientOpportunity = [
      CONTACT_PATH_TYPES.DIRECT_BUSINESS_PROJECT_CONTACT,
      CONTACT_PATH_TYPES.PROCUREMENT_RFP_CONTACT,
      CONTACT_PATH_TYPES.FOUNDER_OWNER_DECISION_MAKER_CONTACT,
      CONTACT_PATH_TYPES.BUSINESS_CONTACT_FORM,
      CONTACT_PATH_TYPES.AGENCY_PARTNERSHIP_PATH
    ].includes(contactPath);

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
        contactPath,
        breakdown: { commercialIntent: 0, decisionMakerAccess: 0, vendorSuitability: 0, capability: 0, marketValue: 0 }
      };
    }

    // 2. Actionable Contact Gate
    if (contactPath === CONTACT_PATH_TYPES.NO_ACTIONABLE_CONTACT_PATH) {
      return {
        leadScore: 10,
        qualificationTier: QUALIFICATION_TIERS.REJECTED,
        accepted: false,
        rejectionReason: REJECTION_REASONS.NO_ACTIONABLE_CONTACT_PATH,
        contactPath,
        breakdown: { commercialIntent: 5, decisionMakerAccess: 0, vendorSuitability: 0, capability: 5, marketValue: 0 }
      };
    }

    // 3. Information Sufficiency Gate
    if (description.length < 30 && title.length < 15) {
      return {
        leadScore: 15,
        qualificationTier: QUALIFICATION_TIERS.REJECTED,
        accepted: false,
        rejectionReason: REJECTION_REASONS.INSUFFICIENT_PROJECT_INFO,
        contactPath,
        breakdown: { commercialIntent: 5, decisionMakerAccess: 5, vendorSuitability: 0, capability: 5, marketValue: 0 }
      };
    }

    // 4. Physical Non-Software Trade Check
    if (NON_SOFTWARE_TRADES.some((trade) => searchable.includes(trade))) {
      return {
        leadScore: 20,
        qualificationTier: QUALIFICATION_TIERS.REJECTED,
        accepted: false,
        rejectionReason: REJECTION_REASONS.POOR_CAPABILITY_MATCH,
        contactPath,
        breakdown: { commercialIntent: 5, decisionMakerAccess: 5, vendorSuitability: 0, capability: 0, marketValue: 10 }
      };
    }

    // 5. Talent Marketplace Roster Recruitment Check (e.g. Lemon.io, Toptal, A.Team)
    const isTalentMarketplace = TALENT_MARKETPLACE_SIGNALS.some((sig) => searchable.includes(sig));
    if (isTalentMarketplace && !opp.isDirectClientRfp) {
      return {
        leadScore: 30,
        qualificationTier: QUALIFICATION_TIERS.REJECTED,
        accepted: false,
        rejectionReason: REJECTION_REASONS.TALENT_MARKETPLACE_ROSTER_RECRUITMENT,
        contactPath,
        breakdown: { commercialIntent: 10, decisionMakerAccess: 5, vendorSuitability: 0, capability: 15, marketValue: 0 }
      };
    }

    // 6. Traditional W2 / Full-Time Employment Check
    const hasEmploymentSignal = EMPLOYMENT_SIGNALS.some((sig) => searchable.includes(sig));
    if (hasEmploymentSignal && !opp.isDirectClientRfp && !searchable.includes("contract") && !searchable.includes("rfp")) {
      return {
        leadScore: 25,
        qualificationTier: QUALIFICATION_TIERS.REJECTED,
        accepted: false,
        rejectionReason: REJECTION_REASONS.EMPLOYMENT_JOB_SEEKER_LISTING,
        contactPath,
        breakdown: { commercialIntent: 5, decisionMakerAccess: 5, vendorSuitability: 0, capability: 15, marketValue: 0 }
      };
    }

    // 7. Commercial Intent Scoring (0 - 30)
    const commercialSignalCount = COMMERCIAL_KEYWORDS.filter((kw) => searchable.includes(kw)).length;
    let commercialIntentScore = Math.min(30, commercialSignalCount * 6 + (isDirectClientOpportunity ? 10 : 0));

    // 8. Decision-Maker Accessibility (0 - 20)
    let decisionMakerScore = 5;
    if (contactPath === CONTACT_PATH_TYPES.DIRECT_BUSINESS_PROJECT_CONTACT || contactPath === CONTACT_PATH_TYPES.FOUNDER_OWNER_DECISION_MAKER_CONTACT) {
      decisionMakerScore = 20;
    } else if (contactPath === CONTACT_PATH_TYPES.PROCUREMENT_RFP_CONTACT || contactPath === CONTACT_PATH_TYPES.BUSINESS_CONTACT_FORM) {
      decisionMakerScore = 15;
    } else if (contactPath === CONTACT_PATH_TYPES.AGENCY_PARTNERSHIP_PATH) {
      decisionMakerScore = 12;
    }

    // 9. External-Vendor Suitability (0 - 20)
    let vendorSuitabilityScore = isDirectClientOpportunity ? 20 : 5;
    if (searchable.includes("vendor") || searchable.includes("agency") || searchable.includes("implementation partner") || searchable.includes("rfp")) {
      vendorSuitabilityScore = 20;
    }

    // 10. Capability Match Score (0 - 15)
    const capabilityMatch = capabilityRegistry.matchDemandUniversal({ title, description });
    let capabilityScore = Math.min(15, Math.round(capabilityMatch.capabilityMatchScore * 0.15));
    if (capabilityScore < 5) {
      return {
        leadScore: 28,
        qualificationTier: QUALIFICATION_TIERS.REJECTED,
        accepted: false,
        rejectionReason: REJECTION_REASONS.POOR_CAPABILITY_MATCH,
        contactPath,
        breakdown: { commercialIntent: commercialIntentScore, decisionMakerAccess: decisionMakerScore, vendorSuitability: vendorSuitabilityScore, capability: capabilityScore, marketValue: 0 }
      };
    }

    // 11. Global Market Value & Currency Score (0 - 15)
    const currency = detectCurrency(searchable);
    const rawBudgetMatch = searchable.match(/(?:[$€£₹]|usd|inr|eur|gbp|aed|cad|aud|sgd)\s*(\d[\d,]*)/i);
    const rawBudgetNumber = rawBudgetMatch ? parseInt(rawBudgetMatch[1].replace(/,/g, ""), 10) : null;

    if (rawBudgetNumber !== null && rawBudgetNumber > 0 && rawBudgetNumber < 200 && !searchable.includes("bounty") && currency === "USD") {
      return {
        leadScore: 22,
        qualificationTier: QUALIFICATION_TIERS.REJECTED,
        accepted: false,
        rejectionReason: REJECTION_REASONS.BUDGET_BELOW_MINIMUM,
        contactPath,
        breakdown: { commercialIntent: commercialIntentScore, decisionMakerAccess: decisionMakerScore, vendorSuitability: vendorSuitabilityScore, capability: capabilityScore, marketValue: 2 }
      };
    }

    const estimate = revenueValueModel.estimateValueFromEvidence(searchable, { valueType: "salary_contract_compensation" });
    const estimatedUSD = rawBudgetNumber && currency === "USD"
      ? rawBudgetNumber
      : (estimate.estimatedUSD || (estimate.estimatedINR ? Math.round(estimate.estimatedINR / 85) : 1500));

    let marketValueScore = 5;
    if (estimatedUSD >= 5000) marketValueScore = 15;
    else if (estimatedUSD >= 2500) marketValueScore = 12;
    else if (estimatedUSD >= 1000) marketValueScore = 10;

    // Total Commercial Score Calculation (0 - 100)
    const totalScore = Math.min(100, Math.max(0, commercialIntentScore + decisionMakerScore + vendorSuitabilityScore + capabilityScore + marketValueScore));

    // Qualification Tier Determination (HIGH_VALUE requires genuine commercial intent AND direct contact accessibility)
    let tier = QUALIFICATION_TIERS.WEAK;
    if (totalScore >= 70 && isDirectClientOpportunity) {
      tier = QUALIFICATION_TIERS.HIGH_VALUE;
    } else if (totalScore >= 50) {
      tier = QUALIFICATION_TIERS.GOOD;
    }

    return {
      leadScore: totalScore,
      qualificationTier: tier,
      accepted: (tier === QUALIFICATION_TIERS.HIGH_VALUE || tier === QUALIFICATION_TIERS.GOOD) && isDirectClientOpportunity,
      rejectionReason: isDirectClientOpportunity ? null : REJECTION_REASONS.JOB_BOARD_APPLICATION_ONLY,
      contactPath,
      isDirectClientOpportunity,
      matchedCapability: capabilityMatch.bestMatch?.name || "Custom Software Development",
      currency,
      estimatedUSD,
      estimatedINR: convertToINR(estimatedUSD, "USD"),
      breakdown: {
        commercialIntent: commercialIntentScore,
        decisionMakerAccess: decisionMakerScore,
        vendorSuitability: vendorSuitabilityScore,
        capability: capabilityScore,
        marketValue: marketValueScore
      }
    };
  }
}

module.exports = new GlobalLeadScoringEngineService();
