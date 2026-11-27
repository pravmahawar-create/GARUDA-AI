/**
 * 🦅 GARUDA OS — PERMITTED GROWTH & ACQUISITION ATTRIBUTION SERVICE (PHASE 11)
 *
 * Strictly Enforces:
 * - Legal eligibility check via MerchantEligibilityService before ANY campaign creation
 *   or attribution ingestion (blocks ONLINE_MONEY_GAME & UNVERIFIED fail-closed).
 * - Consent-aware pseudonymous lineage:
 *   campaign_id -> click_id (consent_ref) -> session_id -> payment_intent_id -> verified_settlement_id
 * - IVT Risk Scoring signals (ASN/proxy/velocity) flagged ONLY as risk scores (never blind guilt).
 * - Zero personally identifiable customer info mixed with marketing analytics.
 */

const crypto = require("crypto");
const { defaultMerchantEligibilityService } = require("./merchantEligibilityService");

class GrowthAttributionError extends Error {
  constructor(message, errorCode = "GROWTH_ATTRIBUTION_ERROR", httpStatus = 400) {
    super(`[GROWTH_ATTRIBUTION] ${message} (${errorCode})`);
    this.name = "GrowthAttributionError";
    this.errorCode = errorCode;
    this.httpStatus = httpStatus;
  }
}

class GrowthAttributionService {
  constructor(options = {}) {
    this.eligibilityService = options.eligibilityService || defaultMerchantEligibilityService;
    this.campaigns = new Map(); // campaignId -> campaign
    this.attributionEvents = []; // append-only lineage events
  }

  _requireTenant(tenantId) {
    const clean = String(tenantId || "").trim();
    if (!clean) throw new GrowthAttributionError("Tenant ID required", "TENANT_REQUIRED", 401);
    return clean;
  }

  createCampaign({
    tenantId,
    merchantId,
    name,
    dailyBudgetInr = 10000,
    managementFeeRate = 0.15,
    channels = [
      { id: "OPEN_GAMING_PUBLISHERS", label: "Authorized Gaming & Utility Publishers", sharePercent: 40 },
      { id: "CREATOR_COMMUNITIES", label: "Verified Esports & Creator Channels", sharePercent: 35 },
      { id: "APPROVED_SOCIAL_REELS", label: "Platform-Approved Social & IVT Shielded", sharePercent: 25 }
    ],
    ageGateConfirmed = true
  }) {
    const cleanTenant = this._requireTenant(tenantId);
    // Strict Legal Eligibility Gate
    const merchantProfile = this.eligibilityService.assertEligible(cleanTenant, merchantId, "CAMPAIGN_CREATE");
    if (!ageGateConfirmed) {
      throw new GrowthAttributionError("Explicit age/policy compliance confirmation required", "AGE_POLICY_REQUIRED", 400);
    }

    const budget = Number(dailyBudgetInr || 0);
    if (!Number.isFinite(budget) || budget <= 0) {
      throw new GrowthAttributionError("dailyBudgetInr must be positive", "INVALID_BUDGET", 400);
    }

    const campaignId = `cmp_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
    const campaign = {
      campaignId,
      tenantId: cleanTenant,
      merchantId: String(merchantId),
      legalCategory: merchantProfile.category,
      name: String(name || `${merchantProfile.legalName} Acquisition Funnel`).trim(),
      dailyBudgetInr: budget,
      monthlyMediaBudgetInr: budget * 30,
      managementFeeRate: Number(managementFeeRate),
      dailyManagementFeeInr: Math.round(budget * Number(managementFeeRate)),
      channels: channels.map((c) => ({
        ...c,
        dailyAllocationInr: Math.round((budget * Number(c.sharePercent || 0)) / 100)
      })),
      status: "ACTIVE_PERMITTED",
      stats: {
        clicks: 0,
        consentVerifiedClicks: 0,
        flaggedIvtSignals: 0,
        registrations: 0,
        paymentIntentsLinked: 0,
        verifiedConversions: 0,
        verifiedSettledRevenueInr: 0
      },
      createdAt: new Date().toISOString()
    };

    this.campaigns.set(campaignId, campaign);
    return campaign;
  }

  recordAttributionEvent({
    tenantId,
    campaignId,
    channelId = "OPEN_GAMING_PUBLISHERS",
    consentRecorded = false,
    consentRef = null,
    ipType = "RESIDENTIAL_MOBILE", // RESIDENTIAL_MOBILE | DATACENTER_PROXY | UNKNOWN
    requestsPerMinute = 1,
    stage = "CLICK", // CLICK | REGISTRATION | PAYMENT_INTENT | VERIFIED_SETTLEMENT
    paymentIntentId = null,
    verifiedSettlementRef = null,
    settledAmountInr = 0,
    visitorSeed = ""
  }) {
    const cleanTenant = this._requireTenant(tenantId);
    const campaign = this.campaigns.get(campaignId);
    if (!campaign || campaign.tenantId !== cleanTenant) {
      throw new GrowthAttributionError(`Campaign "${campaignId}" not found for tenant`, "CAMPAIGN_NOT_FOUND", 404);
    }

    // Re-assert eligibility at event ingestion time
    this.eligibilityService.assertEligible(cleanTenant, campaign.merchantId, "ATTRIBUTION_EVENT");

    if (!consentRecorded || !consentRef) {
      throw new GrowthAttributionError(
        "Attribution rejected: user consent_record is mandatory prior to pseudonymous click tracking",
        "CONSENT_REQUIRED",
        400
      );
    }

    // IVT Scoring: network/ASN treated as risk score signal ONLY (not automated accusation)
    let ivtRiskScore = 10;
    const riskSignals = [];
    if (ipType === "DATACENTER_PROXY") {
      ivtRiskScore += 55;
      riskSignals.push("DATACENTER_ASN_SIGNAL");
    }
    if (Number(requestsPerMinute) > 12) {
      ivtRiskScore += 30;
      riskSignals.push("HIGH_CLICK_VELOCITY");
    }
    const reviewRecommended = ivtRiskScore >= 60;

    // Pseudonymize visitor ID so zero PII enters attribution ledger
    const pseudonymousVisitorHash = crypto
      .createHash("sha256")
      .update(`${cleanTenant}:${visitorSeed || consentRef}`)
      .digest("hex")
      .slice(0, 16);

    const event = Object.freeze({
      eventId: `att_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`,
      tenantId: cleanTenant,
      campaignId,
      merchantId: campaign.merchantId,
      channelId,
      stage: String(stage).toUpperCase(),
      clickId: `clk_${crypto.randomBytes(4).toString("hex")}`,
      consentRef: String(consentRef),
      pseudonymousVisitorHash,
      ivtRiskScore: Math.min(100, ivtRiskScore),
      riskSignals,
      classification: reviewRecommended ? "IVT_REVIEW_FLAGGED" : "QUALIFIED_TRAFFIC",
      appealAllowed: true,
      paymentIntentId,
      verifiedSettlementRef,
      settledAmountInr: Number(settledAmountInr || 0),
      recordedAt: new Date().toISOString()
    });

    this.attributionEvents.push(event);

    campaign.stats.clicks += 1;
    campaign.stats.consentVerifiedClicks += 1;
    if (reviewRecommended) campaign.stats.flaggedIvtSignals += 1;
    if (event.stage === "REGISTRATION") campaign.stats.registrations += 1;
    if (paymentIntentId) campaign.stats.paymentIntentsLinked += 1;
    if (event.stage === "VERIFIED_SETTLEMENT" && verifiedSettlementRef) {
      campaign.stats.verifiedConversions += 1;
      campaign.stats.verifiedSettledRevenueInr += Number(settledAmountInr || 0);
    }

    return event;
  }

  listCampaigns(tenantId) {
    const cleanTenant = this._requireTenant(tenantId);
    return Array.from(this.campaigns.values()).filter((c) => c.tenantId === cleanTenant);
  }

  listAttributionEvents(tenantId, campaignId = null) {
    const cleanTenant = this._requireTenant(tenantId);
    return this.attributionEvents
      .filter((e) => e.tenantId === cleanTenant && (!campaignId || e.campaignId === campaignId))
      .slice()
      .reverse();
  }
}

const defaultGrowthAttributionService = new GrowthAttributionService();

module.exports = {
  GrowthAttributionError,
  GrowthAttributionService,
  defaultGrowthAttributionService
};
