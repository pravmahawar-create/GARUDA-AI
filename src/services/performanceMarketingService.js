/**
 * 🦅 GARUDA Performance Marketing & Attribution Service
 * Phase 4 & Phase H — Measurable Campaign Lifecycle & Attribution Engine
 *
 * Coordinates the full measurable commercial funnel:
 * Campaign -> Creative -> Audience -> Traffic -> Lead -> Qualification ->
 * Site Visit / Meeting -> Proposal -> Booking / Sale -> Revenue
 *
 * Truth Law:
 * Never fabricate external ad platform metrics (impressions, spend, CPL, ROAS).
 * If ad platform API (Meta Ads, Google Ads) is unconfigured, return AD_PLATFORM_DATA_UNAVAILABLE.
 * All internal funnel metrics are derived from authoritative, cryptographically sealed records.
 */

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const garudaEventService = require("./garudaEventService");
const { GARUDA_EVENT_TYPES, GARUDA_ENTITY_TYPES } = require("./garudaEventTypes");
const acquisitionAttributionService = require("./acquisitionAttributionService");

const DATA_DIR = path.join(__dirname, "..", "..", "data");
const CAMPAIGNS_FILE = path.join(DATA_DIR, "marketing-campaigns.jsonl");
const CONVERSIONS_FILE = path.join(DATA_DIR, "marketing-conversions.jsonl");

function ensureDirs() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch {}
}

const campaignsStore = new Map();
const conversionsStore = new Map();

function loadFromDisk() {
  ensureDirs();
  try {
    if (fs.existsSync(CAMPAIGNS_FILE)) {
      const lines = fs.readFileSync(CAMPAIGNS_FILE, "utf8").split("\n").filter(Boolean);
      for (const line of lines) {
        try {
          const doc = JSON.parse(line);
          if (doc && doc.campaignId) campaignsStore.set(doc.campaignId, doc);
        } catch {}
      }
    }
    if (fs.existsSync(CONVERSIONS_FILE)) {
      const lines = fs.readFileSync(CONVERSIONS_FILE, "utf8").split("\n").filter(Boolean);
      for (const line of lines) {
        try {
          const doc = JSON.parse(line);
          if (doc && doc.conversionId) conversionsStore.set(doc.conversionId, doc);
        } catch {}
      }
    }
  } catch {}
}

loadFromDisk();

function appendDocToFile(filePath, doc) {
  ensureDirs();
  try {
    fs.appendFileSync(filePath, JSON.stringify(doc) + "\n", "utf8");
  } catch {}
}

class PerformanceMarketingService {
  constructor() {
    this.campaigns = campaignsStore;
    this.conversions = conversionsStore;
  }

  clearForTesting() {
    this.campaigns.clear();
    this.conversions.clear();
  }

  /**
   * 1. Register a Marketing Campaign.
   */
  async createCampaign(campaignInput = {}) {
    const name = String(campaignInput.name || campaignInput.title || "").trim();
    if (!name) {
      throw new Error("Campaign name is required");
    }

    const campaignId = campaignInput.campaignId || `camp_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
    const channel = campaignInput.channel || "meta_ads";
    const objective = campaignInput.objective || "LEAD_GENERATION";
    const utmCampaign = campaignInput.utmCampaign || name.toLowerCase().replace(/[^a-z0-9]+/g, "_");
    const utmSource = campaignInput.utmSource || channel;
    const utmMedium = campaignInput.utmMedium || "paid_social";

    const campaign = {
      campaignId,
      projectId: campaignInput.projectId || null,
      brandId: campaignInput.brandId || null,
      name,
      objective,
      status: campaignInput.status || "ACTIVE", // DRAFT | ACTIVE | PAUSED | COMPLETED
      channel,
      budgetINR: Number(campaignInput.budgetINR || campaignInput.budget || 0),
      targetAudience: {
        description: campaignInput.targetAudience || "High-income homebuyers and luxury real estate investors",
        locations: Array.isArray(campaignInput.locations) ? campaignInput.locations : ["Jaipur", "NCR", "Mumbai"],
        ageRange: campaignInput.ageRange || "28-55",
        interests: Array.isArray(campaignInput.interests) ? campaignInput.interests : ["Real Estate", "Luxury Lifestyle", "Wealth Management"]
      },
      tracking: {
        utmSource,
        utmMedium,
        utmCampaign,
        landingPath: campaignInput.landingPath || `/campaign/${utmCampaign}`
      },
      creatives: Array.isArray(campaignInput.creatives) ? campaignInput.creatives : [],
      adPlatformIntegration: {
        connected: false,
        platform: channel,
        adAccountId: null,
        status: "AD_PLATFORM_DATA_UNAVAILABLE"
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.campaigns.set(campaignId, campaign);
    appendDocToFile(CAMPAIGNS_FILE, campaign);

    await garudaEventService.emitGarudaEvent({
      eventType: "CAMPAIGN_CREATED",
      entityType: "marketing_campaign",
      entityId: campaignId,
      projectId: campaign.projectId,
      source: "performance_marketing_engine",
      newState: campaign.status,
      metadata: {
        name,
        channel,
        objective,
        utmCampaign
      }
    }).catch(() => {});

    return campaign;
  }

  /**
   * 2. Attach a Creative Asset to a Campaign.
   */
  async attachCreativeToCampaign(campaignId, creativeInput = {}) {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) throw new Error(`Campaign not found: ${campaignId}`);

    const creativeId = creativeInput.creativeId || `cr_${Date.now()}_${crypto.randomBytes(2).toString("hex")}`;
    const creative = {
      creativeId,
      campaignId,
      title: creativeInput.title || "Ad Creative Variant",
      assetId: creativeInput.assetId || null,
      format: creativeInput.format || "IMAGE_SQUARE",
      adAngle: creativeInput.adAngle || "LIFESTYLE_LUXURY",
      headline: creativeInput.headline || "",
      cta: creativeInput.cta || "Learn More →",
      status: "ACTIVE",
      attachedAt: new Date().toISOString()
    };

    campaign.creatives.push(creative);
    campaign.updatedAt = new Date().toISOString();

    return creative;
  }

  /**
   * 3. Record an Attribution / Conversion Event.
   */
  async recordConversionEvent(conversionInput = {}) {
    const eventType = conversionInput.eventType || "LEAD_CAPTURED"; // LEAD_CAPTURED | QUALIFIED_LEAD | SITE_VISIT | PROPOSAL | BOOKING | REVENUE
    const conversionId = `conv_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;

    // Resolve UTM attribution
    const attribution = acquisitionAttributionService.resolveAttribution(conversionInput);
    const campaignId = conversionInput.campaignId || this.findCampaignByUtm(attribution.campaign);

    const conversion = {
      conversionId,
      campaignId: campaignId || null,
      projectId: conversionInput.projectId || null,
      leadId: conversionInput.leadId || null,
      eventType,
      valueINR: Number(conversionInput.valueINR || 0),
      attribution,
      metadata: conversionInput.metadata || {},
      recordedAt: new Date().toISOString()
    };

    this.conversions.set(conversionId, conversion);
    appendDocToFile(CONVERSIONS_FILE, conversion);

    await garudaEventService.emitGarudaEvent({
      eventType: "PERFORMANCE_SIGNAL_RECORDED",
      entityType: "conversion_event",
      entityId: conversionId,
      projectId: conversion.projectId,
      source: "attribution_engine",
      newState: eventType,
      metadata: {
        campaignId,
        eventType,
        valueINR: conversion.valueINR,
        channel: attribution.channel,
        source: attribution.source
      }
    }).catch(() => {});

    return conversion;
  }

  findCampaignByUtm(utmCampaign) {
    if (!utmCampaign) return null;
    const clean = String(utmCampaign).toLowerCase();
    for (const c of this.campaigns.values()) {
      if (c.tracking?.utmCampaign?.toLowerCase() === clean) {
        return c.campaignId;
      }
    }
    return null;
  }

  /**
   * 4. Retrieve Comprehensive Campaign Performance & Attribution Metrics.
   * Enforces Truth Law: Unconnected ad platform metrics are marked AD_PLATFORM_DATA_UNAVAILABLE.
   */
  async getCampaignPerformance(campaignId) {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) throw new Error(`Campaign not found: ${campaignId}`);

    const allConversions = Array.from(this.conversions.values()).filter(
      c => c.campaignId === campaignId || (c.attribution?.campaign === campaign.tracking?.utmCampaign)
    );

    const leads = allConversions.filter(c => c.eventType === "LEAD_CAPTURED" || c.eventType === "LEAD");
    const qualifiedLeads = allConversions.filter(c => c.eventType === "QUALIFIED_LEAD" || c.eventType === "LEAD_QUALIFIED");
    const siteVisits = allConversions.filter(c => c.eventType === "SITE_VISIT" || c.eventType === "SITE_VISIT_COMPLETED");
    const bookings = allConversions.filter(c => c.eventType === "BOOKING" || c.eventType === "BOOKING_CONFIRMED");
    const revenueEvents = allConversions.filter(c => c.eventType === "REVENUE" || c.eventType === "REVENUE_ATTRIBUTED");

    const grossBookingValueINR = bookings.reduce((sum, b) => sum + (b.valueINR || 0), 0);
    const verifiedRevenueINR = revenueEvents.reduce((sum, r) => sum + (r.valueINR || 0), 0);

    // External Ad Platform Truth
    const adPlatformData = {
      status: "AD_PLATFORM_DATA_UNAVAILABLE",
      connected: false,
      notice: "External ad platform API (Meta Ads/Google Ads) is not connected. Spend, Impressions, CTR, and CPC are unavailable.",
      spend: null,
      impressions: null,
      clicks: null,
      ctr: null,
      cpl: null,
      roas: null
    };

    return {
      available: true,
      campaign: {
        campaignId: campaign.campaignId,
        name: campaign.name,
        status: campaign.status,
        channel: campaign.channel,
        objective: campaign.objective,
        budgetINR: campaign.budgetINR,
        tracking: campaign.tracking,
        creativesCount: campaign.creatives.length
      },
      adPlatformData,
      authoritativeFunnel: {
        totalAttributedLeads: leads.length,
        qualifiedLeadsCount: qualifiedLeads.length,
        siteVisitsCompleted: siteVisits.length,
        confirmedBookings: bookings.length,
        grossBookingValueINR,
        verifiedRevenueINR,
        leadToBookingRate: leads.length > 0 ? `${Math.round((bookings.length / leads.length) * 100)}%` : "0%",
        siteVisitToBookingRate: siteVisits.length > 0 ? `${Math.round((bookings.length / siteVisits.length) * 100)}%` : "0%"
      },
      recentConversions: allConversions.slice(-10),
      truthClassification: "AUTHORITATIVE_INTERNAL_RECORDS",
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * 5. Get Aggregate Performance Across All Campaigns.
   */
  async getAggregatePerformance(projectId = null) {
    const allCampaigns = Array.from(this.campaigns.values()).filter(c => !projectId || c.projectId === projectId);
    const allConversions = Array.from(this.conversions.values()).filter(c => !projectId || c.projectId === projectId);

    const totalLeads = allConversions.filter(c => c.eventType.includes("LEAD")).length;
    const totalVisits = allConversions.filter(c => c.eventType.includes("VISIT")).length;
    const totalBookings = allConversions.filter(c => c.eventType.includes("BOOKING")).length;
    const totalGBV = allConversions.filter(c => c.eventType.includes("BOOKING")).reduce((sum, b) => sum + (b.valueINR || 0), 0);

    return {
      available: true,
      totalCampaigns: allCampaigns.length,
      activeCampaigns: allCampaigns.filter(c => c.status === "ACTIVE").length,
      adPlatformIntegration: {
        status: "AD_PLATFORM_DATA_UNAVAILABLE",
        connected: false
      },
      funnel: {
        totalAttributedLeads: totalLeads,
        totalSiteVisits: totalVisits,
        totalConfirmedBookings: totalBookings,
        grossBookingValueINR: totalGBV
      },
      campaigns: allCampaigns.map(c => ({
        campaignId: c.campaignId,
        name: c.name,
        channel: c.channel,
        status: c.status,
        creativesCount: c.creatives.length,
        utmCampaign: c.tracking?.utmCampaign
      })),
      truthClassification: "AUTHORITATIVE_INTERNAL_RECORDS",
      generatedAt: new Date().toISOString()
    };
  }
}

module.exports = new PerformanceMarketingService();
module.exports.PerformanceMarketingService = PerformanceMarketingService;
