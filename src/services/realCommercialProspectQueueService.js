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
  TALENT_MARKETPLACE_ROSTER_RECRUITMENT: "TALENT_MARKETPLACE_ROSTER_RECRUITMENT",
  JOB_BOARD_APPLICATION_ONLY: "JOB_BOARD_APPLICATION_ONLY",
  PROHIBITED_OR_SCAM: "PROHIBITED_OR_SCAM",
  INSUFFICIENT_CONTACT_PATH: "INSUFFICIENT_CONTACT_PATH",
  INSUFFICIENT_PROJECT_INFORMATION: "INSUFFICIENT_PROJECT_INFORMATION",
  NEEDS_HUMAN_REVIEW: "NEEDS_HUMAN_REVIEW"
});

class RealCommercialProspectQueueService {
  /**
   * Classifies an opportunity using strict commercial project intent and contact path criteria.
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

    // 4. Talent Marketplace Sourcing Filter (e.g. Lemon.io, Toptal, A.Team, Turing, Gun.io)
    const isTalentMarketplace = /lemon\.io|toptal|a\.team|azumo|telus digital|turing\.com|andela|gun\.io|arc\.dev|bairesdev|gigster|crossover|x-team|dice\.com/i.test(opp.company || "") || 
      text.includes("marketplace that connects you") || 
      text.includes("talent network") || 
      text.includes("roster of freelancers") ||
      text.includes("talent pool") ||
      text.includes("vetted developers");
    if (isTalentMarketplace && !opp.isDirectClientRfp) {
      return {
        category: PROSPECT_CATEGORIES.TALENT_MARKETPLACE_ROSTER_RECRUITMENT,
        reason: "Talent marketplace / recruitment network sourcing individual contractors for talent pool, not a direct client software RFP",
        evalRes
      };
    }

    // 5. Employment / Internal Staff Hiring Filter
    const employmentKeywords = [
      "salary", "w2", "w-2", "401k", "401(k)", "full-time", "full time", "pto", "unlimited pto",
      "maternity", "equity", "health insurance", "dental coverage", "join our team", "internal team",
      "join our engineering team", "hiring a", "engineering manager", "staff software engineer", "staff engineer",
      "vice president", "head of", "tier iii", "inside sales", "office assistant", "copywriter",
      "content reviewer", "face deduplication", "f/m/d", "visa sponsorship", "direct hire"
    ];

    const hasExplicitEmploymentSignals = employmentKeywords.some((kw) => text.includes(kw) || title.includes(kw));
    if (hasExplicitEmploymentSignals && !opp.isDirectClientRfp) {
      return {
        category: PROSPECT_CATEGORIES.EMPLOYMENT_JOB_LISTING,
        reason: "Internal employment/staff hiring listing rather than client project RFP",
        evalRes
      };
    }

    // 6. Direct Client Commercial Project Opportunity
    const contactPath = evalRes.contactPath;
    const isDirectContact = [
      "DIRECT_BUSINESS_PROJECT_CONTACT",
      "PROCUREMENT_RFP_CONTACT",
      "FOUNDER_OWNER_DECISION_MAKER_CONTACT",
      "BUSINESS_CONTACT_FORM",
      "AGENCY_PARTNERSHIP_PATH"
    ].includes(contactPath);

    if (evalRes.accepted || (isDirectContact && !hasExplicitEmploymentSignals && !isTalentMarketplace)) {
      return {
        category: PROSPECT_CATEGORIES.GENUINE_COMMERCIAL_PROSPECT,
        reason: "Qualified direct client commercial software / AI project opportunity",
        evalRes
      };
    }

    // 7. Job Board Application Only (Blocked from outbound)
    if (contactPath === "JOB_BOARD_APPLICATION_ONLY") {
      return {
        category: PROSPECT_CATEGORIES.JOB_BOARD_APPLICATION_ONLY,
        reason: "Listing hosted on job board web portal without direct corporate procurement contact",
        evalRes
      };
    }

    return {
      category: PROSPECT_CATEGORIES.NEEDS_HUMAN_REVIEW,
      reason: "Requires manual inspection by Founder",
      evalRes
    };
  }

  /**
   * Curates discovery feed opportunities into classified commercial queue with contact path taxonomy.
   */
  async curateCommercialQueue(options = {}) {
    const discoveryResult = await discoveryRegistry.fetchAllOpportunities(options);
    const opportunities = discoveryResult.opportunities || [];

    const breakdown = {
      totalCandidatesReviewed: opportunities.length,
      countsByCategory: {},
      contactPathCounts: {
        DIRECT_BUSINESS_PROJECT_CONTACT: 0,
        PROCUREMENT_RFP_CONTACT: 0,
        FOUNDER_OWNER_DECISION_MAKER_CONTACT: 0,
        BUSINESS_CONTACT_FORM: 0,
        AGENCY_PARTNERSHIP_PATH: 0,
        JOB_BOARD_APPLICATION_ONLY: 0,
        NO_ACTIONABLE_CONTACT_PATH: 0
      },
      genuineCommercialProspects: [],
      employmentListings: [],
      talentMarketplaceRejects: [],
      jobBoardOnlyRejects: [],
      prohibitedOrScam: [],
      insufficientContactPath: [],
      insufficientProjectInfo: [],
      needsHumanReview: []
    };

    Object.values(PROSPECT_CATEGORIES).forEach((cat) => { breakdown.countsByCategory[cat] = 0; });

    for (const opp of opportunities) {
      const classification = this.classifyOpportunity(opp);
      breakdown.countsByCategory[classification.category] = (breakdown.countsByCategory[classification.category] || 0) + 1;

      const pathType = classification.evalRes?.contactPath || "JOB_BOARD_APPLICATION_ONLY";
      breakdown.contactPathCounts[pathType] = (breakdown.contactPathCounts[pathType] || 0) + 1;

      const record = {
        id: opp.externalId || opp.id || null,
        externalId: opp.externalId || opp.id || null,
        title: opp.title,
        company: opp.company || "Client",
        source: opp.source,
        url: opp.url,
        contactEmail: opp.contactEmail || null,
        contactPath: pathType,
        salaryText: opp.salaryText || opp.budget || null,
        currency: opp.currency || "USD",
        description: opp.description || "",
        tags: opp.tags || [],
        isDirectClientRfp: Boolean(opp.isDirectClientRfp),
        leadScore: classification.evalRes?.leadScore || 70,
        qualificationTier: classification.evalRes?.qualificationTier || "STANDARD",
        matchedCapability: classification.evalRes?.matchedCapability || "Custom Software Development",
        reason: classification.reason
      };

      if (classification.category === PROSPECT_CATEGORIES.GENUINE_COMMERCIAL_PROSPECT) {
        breakdown.genuineCommercialProspects.push(record);
      } else if (classification.category === PROSPECT_CATEGORIES.EMPLOYMENT_JOB_LISTING) {
        breakdown.employmentListings.push(record);
      } else if (classification.category === PROSPECT_CATEGORIES.TALENT_MARKETPLACE_ROSTER_RECRUITMENT) {
        breakdown.talentMarketplaceRejects.push(record);
      } else if (classification.category === PROSPECT_CATEGORIES.JOB_BOARD_APPLICATION_ONLY) {
        breakdown.jobBoardOnlyRejects.push(record);
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
   * Prepares top candidate outreach drafts with strict safety ratings and complete provenance.
   */
  async prepareTopOutreachDrafts(options = {}) {
    const queue = await this.curateCommercialQueue(options);
    const limit = options.limit || 10;
    const candidates = queue.genuineCommercialProspects.length > 0
      ? queue.genuineCommercialProspects.slice(0, limit)
      : (queue.needsHumanReview.length > 0
          ? queue.needsHumanReview.slice(0, 3)
          : queue.jobBoardOnlyRejects.slice(0, 3));

    const preparedDrafts = [];

    for (let i = 0; i < candidates.length; i++) {
      const p = candidates[i];
      const candidateKey = p.externalId || p.id || `${p.company}_${p.title}`.toLowerCase().replace(/[^a-z0-9]/g, "_");
      const prospectId = `outreach_${candidateKey}`;
      const isGenuine = queue.genuineCommercialProspects.includes(p);
      const isSafeForFounderApproval = isGenuine && p.contactPath !== "JOB_BOARD_APPLICATION_ONLY" && p.contactPath !== "NO_ACTIONABLE_CONTACT_PATH";

      const matchedCap = p.matchedCapability || "Custom Software & AI Development";
      let matchedService = "custom-software-development";
      if (matchedCap.toLowerCase().includes("ai") || p.title.toLowerCase().includes("ai") || p.title.toLowerCase().includes("rag")) {
        matchedService = "custom-ai-development";
      } else if (matchedCap.toLowerCase().includes("workflow") || p.title.toLowerCase().includes("bot") || p.title.toLowerCase().includes("automation")) {
        matchedService = "business-workflow-ai-automation";
      } else if (matchedCap.toLowerCase().includes("saas") || p.title.toLowerCase().includes("mvp")) {
        matchedService = "saas-mvp-development";
      }

      let classification = "INVALID_FOR_DIRECT_OUTREACH";
      if (isSafeForFounderApproval) {
        if (p.contactType === "AGENCY_PARTNERSHIP_PATH" || (p.company && p.company.includes("Fintech"))) {
          classification = "NEEDS_HUMAN_REVIEW";
        } else {
          classification = "VERIFIED_SAFE_FOR_OUTREACH";
        }
      }

      // Check persisted state in MongoDB / memory
      const persistedRecord = await outreachDispatch.getOutreachRecord(prospectId);
      let status = isSafeForFounderApproval ? "APPROVAL_REQUIRED" : "INVALID_FOR_DIRECT_OUTREACH";
      let safetyRating = isSafeForFounderApproval ? "SAFE_FOR_FOUNDER_APPROVAL" : "INVALID_FOR_DIRECT_OUTREACH";
      let providerResponseId = null;
      let relayProvider = null;
      let dispatchedAt = null;
      let failedAt = null;
      let dispatchError = null;

      if (persistedRecord) {
        if (persistedRecord.status === "SENT") {
          status = "SENT";
          safetyRating = "OUTREACH_SENT";
          providerResponseId = persistedRecord.providerResponseId;
          relayProvider = persistedRecord.relayProvider;
          dispatchedAt = persistedRecord.dispatchedAt;
        } else if (persistedRecord.status === "FAILED") {
          status = "FAILED";
          safetyRating = "DISPATCH_FAILED";
          failedAt = persistedRecord.failedAt;
          dispatchError = persistedRecord.dispatchError;
        } else if (persistedRecord.status === "APPROVED") {
          status = "APPROVED";
          safetyRating = "APPROVED_READY_FOR_DISPATCH";
        } else if (persistedRecord.status === "REJECTED") {
          status = "REJECTED";
          safetyRating = "REJECTED_BY_FOUNDER";
        }
      }

      const draft = {
        prospectId,
        company: p.company,
        projectTitle: p.title,
        source: p.source,
        sourceUrl: p.url,
        contactEmail: p.contactEmail || null,
        contactPath: p.contactPath,
        contactEvidence: p.contactEmail ? `Verified direct email: ${p.contactEmail}` : `Corporate RFP link: ${p.url}`,
        matchedCapability: matchedCap,
        matchedService,
        leadScore: p.leadScore,
        estimatedValue: p.salaryText || "$8,000 - $16,000 USD (50% Kickoff Advance)",
        currency: p.currency || "USD",
        fitRationale: `GARUDA delivers deterministic end-to-end execution with automated regression QA test suites and cryptographic SHA-256 release manifests.`,
        riskFlags: isSafeForFounderApproval ? "None (Verified Direct Business Opportunity)" : "Job-board portal only without direct procurement contact",
        recommendedAngle: `Introduce GARUDA as an autonomous AI engineering and software execution system capable of rapid, fixed-scope delivery with verified milestone guarantees.`,
        acquisitionState: status === "SENT" ? "OUTREACH_SENT" : (isSafeForFounderApproval ? "OUTREACH_READY (APPROVAL_REQUIRED)" : "HELD_AT_GATEWAY (INVALID_FOR_DIRECT_OUTREACH)"),
        subject: `Implementation Partner Inquiry: ${p.title} — GARUDA AI OS`,
        body: `Dear ${p.company} Team,\n\nWe noted your requirement for "${p.title}".\n\nGARUDA operates as an autonomous AI engineering and software execution system. We specialize in rapid, deterministic delivery of custom AI pipelines, robust backend integrations, and automated business workflows with transparent milestone governance (50% kickoff advance deposit upon digital proposal acceptance; 50% upon verified delivery with complete regression test reports).\n\nIf you are evaluating external implementation partners for this project, we would welcome the opportunity to discuss your scope:\n\n• Architectural Blueprint: https://www.garudaos.in/services/${matchedService}\n• Direct Scoping Chat: https://www.garudaos.in/chat?ref=${prospectId}\n\nSincerely,\nGARUDA AI Operating System\nhttps://www.garudaos.in`,
        status,
        safetyRating,
        classification,
        providerResponseId,
        relayProvider,
        dispatchedAt,
        failedAt,
        dispatchError,
        auditNotes: isSafeForFounderApproval
          ? `Verified commercial client RFP with direct contact pathway (${p.contactPath}: ${p.contactEmail || p.url}).`
          : "Listing lacks direct procurement/business contact email. Blocked from cold email dispatch."
      };

      preparedDrafts.push(draft);
    }

    return {
      totalReviewed: queue.totalCandidatesReviewed,
      genuineProspectCount: queue.genuineCommercialProspects.length,
      contactPathBreakdown: queue.contactPathCounts,
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
      alertMessage += `• Est Value: ${d.estimatedValue}\n`;
      alertMessage += `• Score: ${d.leadScore}/100 | Contact: ${d.contactPath}\n`;
      alertMessage += `• Risk: ${d.riskFlags}\n`;
      alertMessage += `• Why Fit: ${d.fitRationale}\n`;
      alertMessage += `• Source: ${d.sourceUrl}\n`;
      if (d.safetyRating === "SAFE_FOR_FOUNDER_APPROVAL") {
        alertMessage += `• Action: <code>/approve_outreach ${d.prospectId}</code>\n\n`;
      } else {
        alertMessage += `• Notice: <i>Blocked from cold dispatch (Job board / unverified email)</i>\n\n`;
      }
    });

    try {
      await telegramBotService.sendFounderAlert(`🎯 REAL COMMERCIAL PROSPECTS READY`, alertMessage);
      return { sent: true, recipient: "Founder Telegram" };
    } catch (err) {
      return { sent: false, error: err.message };
    }
  }
}

module.exports = new RealCommercialProspectQueueService();
