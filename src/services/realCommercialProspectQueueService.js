/**
 * GARUDA Real Commercial Prospect Queue Engine (Milestone 31A)
 * Curates discovery inventory into high-probability genuine commercial software/AI RFPs,
 * filters out internal employment/job-seeker listings, and queues top candidates
 * for explicit Founder Telegram approval.
 */

const crypto = require("crypto");
const discoveryRegistry = require("./discoveryAdapters/adapterRegistry");
const scoringEngine = require("./globalLeadScoringEngineService");
const outreachDispatch = require("./garudaOutreachDispatchService");
const telegramBotService = require("./telegramBotService");

const PROSPECT_CATEGORIES = Object.freeze({
  GENUINE_COMMERCIAL_PROSPECT: "GENUINE_COMMERCIAL_PROSPECT",
  EMPLOYMENT_JOB_LISTING: "EMPLOYMENT_JOB_LISTING",
  PROHIBITED_OR_SCAM: "PROHIBITED_OR_SCAM",
  INSUFFICIENT_CONTACT_PATH: "INSUFFICIENT_CONTACT_PATH",
  INSUFFICIENT_PROJECT_INFORMATION: "INSUFFICIENT_PROJECT_INFORMATION",
  NEEDS_HUMAN_REVIEW: "NEEDS_HUMAN_REVIEW"
});

class RealCommercialProspectQueueService {
  /**
   * Classifies an opportunity using strict commercial project intent criteria.
   */
  classifyOpportunity(opp = {}) {
    const text = `${opp.title || ""} ${opp.description || ""} ${opp.requirements || ""}`.toLowerCase();
    const title = String(opp.title || "").toLowerCase();

    // 1. Prohibited / Fraud Filter
    const evalRes = scoringEngine.evaluateOpportunity(opp);
    const isScamOrProhibited = /upfront fee|deposit.*first|guaranteed.*profit|casino|gambling|adult|escort|pay us to work|wire transfer/i.test(text);

    if (isScamOrProhibited || evalRes.rejectionReason === "PROHIBITED_CATEGORY" || evalRes.rejectionReason === "SCAM_OR_UPFRONT_FEE_INDICATOR" || evalRes.qualificationTier === "PROHIBITED") {
      return { category: PROSPECT_CATEGORIES.PROHIBITED_OR_SCAM, reason: evalRes.rejectionReason || "Scam, upfront-fee, or prohibited category indicator detected", evalRes };
    }

    // 2. Missing Contact Path
    if (!opp.url && !opp.contactEmail && !opp.sourceUrl) {
      return { category: PROSPECT_CATEGORIES.INSUFFICIENT_CONTACT_PATH, reason: "No actionable URL or email found", evalRes };
    }

    // 3. Insufficient Project Info
    if (!opp.title || opp.title.length < 5) {
      return { category: PROSPECT_CATEGORIES.INSUFFICIENT_PROJECT_INFORMATION, reason: "Title too brief or unmeasured", evalRes };
    }

    // 4. Employment & Talent Marketplace Sourcing Filter
    const employmentKeywords = [
      "salary", "w2", "benefits", "401k", "full-time", "full time", "pto",
      "maternity", "equity", "health insurance", "join our team", "internal team",
      "hiring a", "engineering manager", "staff software engineer", "vice president",
      "head of", "tier iii", "inside sales", "office assistant", "copywriter",
      "content reviewer", "face deduplication", "marketplace that connects you",
      "recruiting", "talent pool", "join lemon.io", "join a.team", "f/m/d"
    ];

    const isTalentMarketplace = /lemon\.io|toptal|a\.team|azumo|telus digital/i.test(opp.company || "") || text.includes("marketplace that connects you");
    const hasExplicitEmploymentSignals = employmentKeywords.some((kw) => text.includes(kw) || title.includes(kw));

    if (isTalentMarketplace || hasExplicitEmploymentSignals) {
      return {
        category: PROSPECT_CATEGORIES.EMPLOYMENT_JOB_LISTING,
        reason: isTalentMarketplace
          ? "Talent marketplace / recruitment network sourcing individual contractors for talent pool, not a direct client software RFP"
          : "Internal employment/staff hiring listing rather than client project RFP",
        evalRes
      };
    }

    // 5. Genuine Commercial Project Opportunity
    const isDirectClientProject = Boolean(opp.isDirectClientRfp || opp.contactEmail || opp.isCustomRfp);
    const projectKeywords = [
      "rfp", "custom", "integration", "migration", "mvp", "bot", "agentic", "crm", "workflow"
    ];
    const hasProjectSignals = projectKeywords.some((kw) => title.includes(kw) || text.includes(kw));

    if (hasProjectSignals && isDirectClientProject) {
      return {
        category: PROSPECT_CATEGORIES.GENUINE_COMMERCIAL_PROSPECT,
        reason: "Qualified direct client commercial software / AI project opportunity",
        evalRes
      };
    }

    return {
      category: PROSPECT_CATEGORIES.NEEDS_HUMAN_REVIEW,
      reason: "Job-board listing with general title; requires manual verification before outreach",
      evalRes
    };
  }

  /**
   * Curates discovery feed opportunities into classified commercial queue.
   */
  async curateCommercialQueue(options = {}) {
    const discoveryResult = await discoveryRegistry.fetchAllOpportunities(options);
    const opportunities = discoveryResult.opportunities || [];

    const breakdown = {
      totalCandidatesReviewed: opportunities.length,
      countsByCategory: {},
      genuineCommercialProspects: [],
      employmentListings: [],
      prohibitedOrScam: [],
      insufficientContactPath: [],
      insufficientProjectInfo: [],
      needsHumanReview: []
    };

    Object.values(PROSPECT_CATEGORIES).forEach((cat) => { breakdown.countsByCategory[cat] = 0; });

    for (const opp of opportunities) {
      const classification = this.classifyOpportunity(opp);
      breakdown.countsByCategory[classification.category] = (breakdown.countsByCategory[classification.category] || 0) + 1;

      const record = {
        title: opp.title,
        company: opp.company || "Client",
        source: opp.source,
        url: opp.url,
        leadScore: classification.evalRes?.leadScore || 70,
        qualificationTier: classification.evalRes?.qualificationTier || "STANDARD",
        matchedCapability: classification.evalRes?.matchedCapability || "Custom Software Development",
        reason: classification.reason
      };

      if (classification.category === PROSPECT_CATEGORIES.GENUINE_COMMERCIAL_PROSPECT) {
        breakdown.genuineCommercialProspects.push(record);
      } else if (classification.category === PROSPECT_CATEGORIES.EMPLOYMENT_JOB_LISTING) {
        breakdown.employmentListings.push(record);
      } else if (classification.category === PROSPECT_CATEGORIES.PROHIBITED_OR_SCAM) {
        breakdown.prohibitedOrScam.push(record);
      } else if (classification.category === PROSPECT_CATEGORIES.INSUFFICIENT_CONTACT_PATH) {
        breakdown.insufficientContactPath.push(record);
      } else if (classification.category === PROSPECT_CATEGORIES.INSUFFICIENT_PROJECT_INFORMATION) {
        breakdown.insufficientProjectInfo.push(record);
      } else {
        breakdown.needsHumanReview.push(record);
      }
    }

    // Sort genuine prospects by lead score descending
    breakdown.genuineCommercialProspects.sort((a, b) => b.leadScore - a.leadScore);

    return breakdown;
  }

  /**
   * Prepares top candidate outreach drafts with strict safety ratings.
   */
  async prepareTopOutreachDrafts(options = {}) {
    const queue = await this.curateCommercialQueue(options);
    const candidates = queue.genuineCommercialProspects.length > 0
      ? queue.genuineCommercialProspects.slice(0, 3)
      : queue.needsHumanReview.slice(0, 3);

    const preparedDrafts = [];

    for (let i = 0; i < candidates.length; i++) {
      const p = candidates[i];
      const prospectId = `outreach_m31a_${Date.now()}_${i + 1}`;
      const isGenuine = queue.genuineCommercialProspects.includes(p);
      const isSafeForFounderApproval = isGenuine && Boolean(p.url && !p.url.includes("remote-jobs"));

      const draft = {
        prospectId,
        company: p.company,
        projectTitle: p.title,
        source: p.source,
        sourceUrl: p.url,
        matchedService: p.matchedCapability === "Custom AI Solutions" ? "custom-ai-development" : "business-workflow-ai-automation",
        leadScore: p.leadScore,
        estimatedValue: "$3,000 - $12,000 USD (50% Kickoff Advance)",
        fitRationale: `GARUDA delivers deterministic end-to-end execution with automated regression QA test suites and cryptographic SHA-256 release manifests.`,
        subject: `Tailored Architectural Proposal: ${p.title} for ${p.company}`,
        body: `Dear ${p.company} Team,\n\nWe noted your requirement for "${p.title}".\n\nGARUDA delivers bespoke, premium software and AI systems engineered with deterministic quality assurance and transparent milestone governance (50% kickoff advance deposit upon digital proposal acceptance; 50% upon verified delivery).\n\nExplore our service blueprint: https://www.garudaos.in/services/custom-ai-development\nDirect Scoping Chat: https://www.garudaos.in/chat?ref=${prospectId}\n\nSincerely,\nGARUDA AI Operating System\nhttps://www.garudaos.in`,
        status: isSafeForFounderApproval ? "APPROVAL_REQUIRED" : "INVALID_FOR_DIRECT_OUTREACH",
        safetyRating: isSafeForFounderApproval ? "SAFE_FOR_FOUNDER_APPROVAL" : "INVALID_FOR_DIRECT_OUTREACH",
        auditNotes: isSafeForFounderApproval
          ? "Verified commercial client RFP with direct contact pathway."
          : "Listing is hosted on a remote employment/job board aggregator without a verified direct client procurement email. Cold dispatch would be misaligned."
      };

      preparedDrafts.push(draft);
    }

    return {
      totalReviewed: queue.totalCandidatesReviewed,
      genuineProspectCount: queue.genuineCommercialProspects.length,
      topDrafts: preparedDrafts
    };
  }

  /**
   * Sends Founder Telegram Alert for queued commercial prospects.
   */
  async notifyFounderOfQueuedProspects(topDrafts = []) {
    if (!telegramBotService.isConfigured() || topDrafts.length === 0) {
      return { sent: false, reason: "Telegram not configured or no drafts" };
    }

    let alertMessage = `🎯 <b>GARUDA REAL COMMERCIAL PROSPECT QUEUE</b>\n\n`;
    alertMessage += `Top ${topDrafts.length} high-probability commercial prospects queued for Founder approval:\n\n`;

    topDrafts.forEach((d, idx) => {
      alertMessage += `<b>[${idx + 1}] ${d.company}</b>\n`;
      alertMessage += `• Project: <i>${d.projectTitle}</i>\n`;
      alertMessage += `• Score: ${d.leadScore}/100 | Est Value: ${d.estimatedValue}\n`;
      alertMessage += `• Source: ${d.sourceUrl}\n`;
      alertMessage += `• Action: <code>/approve_outreach ${d.prospectId}</code>\n\n`;
    });

    alertMessage += `⚡ Reply with <code>/approve_outreach &lt;id&gt;</code> to authorize live dispatch via Brevo HTTPS relay.`;

    try {
      await telegramBotService.sendFounderAlert(`🎯 REAL COMMERCIAL PROSPECTS READY`, alertMessage);
      return { sent: true, recipient: "Founder Telegram" };
    } catch (err) {
      return { sent: false, error: err.message };
    }
  }
}

module.exports = new RealCommercialProspectQueueService();
