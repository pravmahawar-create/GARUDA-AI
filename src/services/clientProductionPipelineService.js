/**
 * 🦅 GARUDA Client Production Onboarding Pipeline Service
 * Phase 4 — Real Client Onboarding & Launch Readiness Engine
 *
 * Coordinates end-to-end commercial onboarding for real enterprise / real estate clients:
 *
 * CLIENT
 *  ↓
 * Business Profile
 *  ↓
 * Brand Profile (IdentityLock™)
 *  ↓
 * Real Estate Project Profile & Inventory
 *  ↓
 * Buyer Personas
 *  ↓
 * Campaign Objective & Budget
 *  ↓
 * Creative Strategy & Asset Production (Images/SVG + Video Storyboard)
 *  ↓
 * High-Converting Landing Page Blueprint
 *  ↓
 * Multi-Channel Tracking Configuration (UTM, Pixel, Tags)
 *  ↓
 * Ad Platform Connection (Meta / Google Ads Adapters)
 *  ↓
 * Launch Readiness Evaluation (8-Step Checklist & Blocker Exposure)
 *  ↓
 * Lead Capture → Deduplication → 0-100 Scoring → Site Visit → Booking → Revenue Attribution → Outcome Learning
 *
 * Truth Law:
 * Never pretend a campaign is launched or launchable when prerequisites (e.g. Ad account, pixel) are missing.
 * Exposes exact blockers truthfully.
 */

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const garudaEventService = require("./garudaEventService");
const { GARUDA_EVENT_TYPES, GARUDA_ENTITY_TYPES } = require("./garudaEventTypes");
const identityLockService = require("./identityLockService");
const realEstateGrowthService = require("./realEstateGrowthService");
const creativeStudioService = require("./creativeStudioService");
const digitalMarketingOsService = require("./digitalMarketingOsService");
const performanceMarketingService = require("./performanceMarketingService");
const { ONBOARDING_READINESS_CATEGORIES } = require("./growthSharedContracts");

const DATA_DIR = path.join(__dirname, "..", "..", "data");
const CLIENTS_FILE = path.join(DATA_DIR, "client-onboarding.jsonl");

function ensureDirs() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch {}
}

const clientsStore = new Map();

function loadFromDisk() {
  ensureDirs();
  try {
    if (fs.existsSync(CLIENTS_FILE)) {
      const lines = fs.readFileSync(CLIENTS_FILE, "utf8").split("\n").filter(Boolean);
      for (const line of lines) {
        try {
          const doc = JSON.parse(line);
          if (doc && doc.clientId) clientsStore.set(doc.clientId, doc);
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

class ClientProductionPipelineService {
  constructor() {
    this.clients = clientsStore;
  }

  clearForTesting() {
    this.clients.clear();
  }

  /**
   * 1. Register Client Business Profile.
   */
  async registerClient(clientInput = {}) {
    const businessName = String(clientInput.businessName || clientInput.name || "").trim();
    if (!businessName) {
      throw new Error("Client business name is required");
    }

    const clientId = clientInput.clientId || `client_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
    const industry = clientInput.industry || "Real Estate & Luxury Living";
    const contactEmail = clientInput.contactEmail || clientInput.email || "";
    const contactPhone = clientInput.contactPhone || clientInput.phone || "";

    const clientRecord = {
      clientId,
      businessName,
      industry,
      contactPerson: clientInput.contactPerson || "Managing Director",
      contactEmail,
      contactPhone,
      website: clientInput.website || null,
      status: "ONBOARDING", // ONBOARDING | READY_FOR_REVIEW | LAUNCHABLE | ACTIVE
      brandProfileId: null,
      projectId: null,
      campaignId: null,
      briefId: null,
      landingPageId: null,
      readinessChecklist: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.clients.set(clientId, clientRecord);
    appendDocToFile(CLIENTS_FILE, clientRecord);

    return clientRecord;
  }

  /**
   * 2. Configure Brand Identity via IdentityLock™.
   */
  async configureClientBrand(clientId, brandData = {}) {
    const client = this.clients.get(clientId);
    if (!client) throw new Error(`Client not found: ${clientId}`);

    const brand = await identityLockService.createOrUpdateBrandProfile({
      brandId: `brand_${clientId}`,
      brandName: brandData.brandName || client.businessName,
      industry: brandData.industry || client.industry,
      primaryColorHex: brandData.primaryColorHex || "#D4AF37",
      secondaryColorHex: brandData.secondaryColorHex || "#0B0F16",
      accentColorHex: brandData.accentColorHex || "#38BDF8",
      prohibitedElements: brandData.prohibitedElements || {
        copy: ["cheap discount offer", "100% guaranteed billionaire overnight"],
        visual: ["low-res renderings", "watermarked competitor stock"]
      }
    });

    client.brandProfileId = brand.brandId;
    client.updatedAt = new Date().toISOString();
    return brand;
  }

  /**
   * 3. Attach Project Profile via Real Estate Growth OS.
   */
  async attachRealEstateProject(clientId, projectData = {}) {
    const client = this.clients.get(clientId);
    if (!client) throw new Error(`Client not found: ${clientId}`);

    const project = await realEstateGrowthService.createProjectProfile({
      ...projectData,
      name: projectData.name || `${client.businessName} Flagship Tower`,
      developerName: client.businessName
    });

    client.projectId = project.projectId;
    client.updatedAt = new Date().toISOString();
    return project;
  }

  /**
   * 4. Complete End-to-End Client Onboarding Workflow.
   */
  async onboardRealClient(clientInput = {}) {
    // Step 1: Register Business
    const client = await this.registerClient(clientInput);

    // Step 2: Configure Brand Profile
    const brand = await this.configureClientBrand(client.clientId, clientInput.brand || {});

    // Step 3: Configure Project Profile
    const project = await this.attachRealEstateProject(client.clientId, clientInput.project || {
      name: `${client.businessName} Sovereign Residences`,
      minPriceINR: clientInput.minPriceINR || 8500000,
      maxPriceINR: clientInput.maxPriceINR || 22500000,
      city: clientInput.city || "Jaipur",
      submarket: clientInput.submarket || "JLN Marg Corridor"
    });

    // Step 4: Generate Buyer Personas
    const buyerPersonas = realEstateGrowthService.getBuyerPersonas(project.projectId);

    // Step 5: Create Campaign Strategy & Brief
    const brief = await creativeStudioService.createCreativeBrief({
      projectId: project.projectId,
      brandName: client.businessName,
      industry: client.industry,
      title: `${client.businessName} Commercial Performance Launch`,
      location: `${project.location.submarket}, ${project.location.city}`,
      priceRange: `₹${(project.pricing.minPriceINR / 100000).toFixed(0)} Lakhs - ₹${(project.pricing.maxPriceINR / 10000000).toFixed(1)} Crores`,
      targetAudience: "High-income families & luxury investors seeking capital growth"
    });
    client.briefId = brief.briefId;

    // Step 6: Generate Creative Concepts & Assets
    const concept = await creativeStudioService.generateConcept(brief.briefId);
    const asset = await creativeStudioService.generateAsset(brief.briefId, "IMAGE_SQUARE", { mode: "SOVEREIGN_LAYOUT" });
    const videoStoryboard = await creativeStudioService.generateVideoStoryboard(brief.briefId);

    // Step 7: Generate Landing Page Blueprint
    const landingPage = digitalMarketingOsService.generateLandingPageBlueprint({
      projectName: project.name,
      location: `${project.location.submarket}, ${project.location.city}`,
      startingPrice: `₹${(project.pricing.minPriceINR / 100000).toFixed(0)} Lakhs`
    });
    client.landingPageId = landingPage.pageId;

    // Step 8: Create Performance Marketing Campaign
    const campaign = await performanceMarketingService.createCampaign({
      projectId: project.projectId,
      brandId: brand.brandId,
      name: `${client.businessName} Q3 Launch`,
      channel: clientInput.channel || "meta_ads",
      budgetINR: clientInput.budgetINR || 150000,
      utmCampaign: client.businessName.toLowerCase().replace(/[^a-z0-9]+/g, "_")
    });
    client.campaignId = campaign.campaignId;

    if (asset && asset.assetId) {
      await performanceMarketingService.attachCreativeToCampaign(campaign.campaignId, {
        assetId: asset.assetId,
        title: asset.title,
        format: asset.format
      });
    }

    // Step 9: Evaluate Canonical Launch Readiness
    const readiness = this.evaluateLaunchReadiness(client.clientId);
    client.readinessChecklist = readiness;
    client.status = readiness.canLaunchCampaign ? "LAUNCHABLE" : "BLOCKED_PENDING_CONFIG";
    client.updatedAt = new Date().toISOString();

    return {
      success: true,
      client,
      brand,
      project,
      buyerPersonas,
      brief,
      conceptCount: concept.concepts.length,
      generatedAsset: asset,
      videoStoryboard: videoStoryboard.storyboard,
      landingPage,
      campaign,
      launchReadiness: readiness
    };
  }

  /**
   * 5. Truthful 8-Step Launch Readiness Checklist & Blocker Exposure.
   */
  evaluateLaunchReadiness(clientId) {
    const client = this.clients.get(clientId);
    if (!client) throw new Error(`Client not found: ${clientId}`);

    const brand = client.brandProfileId ? identityLockService.getBrandProfile(client.brandProfileId) : null;
    const project = client.projectId ? realEstateGrowthService.projects.get(client.projectId) : null;
    const campaign = client.campaignId ? performanceMarketingService.campaigns.get(client.campaignId) : null;

    const checklist = {};
    const blockers = [];

    // 1. Business Profile
    checklist.BUSINESS_PROFILE_READY = {
      ready: Boolean(client.businessName && client.industry),
      status: client.businessName ? "PASSED" : "MISSING_BUSINESS_DATA",
      blockers: client.businessName ? [] : ["BUSINESS_NAME_REQUIRED"]
    };
    if (!checklist.BUSINESS_PROFILE_READY.ready) blockers.push("BUSINESS_PROFILE_INCOMPLETE");

    // 2. Brand Profile (IdentityLock)
    checklist.BRAND_PROFILE_READY = {
      ready: Boolean(brand && brand.lockHash),
      status: brand ? "PASSED" : "MISSING_BRAND_IDENTITY",
      lockHash: brand?.lockHash || null,
      blockers: brand ? [] : ["BRAND_PROFILE_AND_LOCKHASH_REQUIRED"]
    };
    if (!checklist.BRAND_PROFILE_READY.ready) blockers.push("BRAND_PROFILE_INCOMPLETE");

    // 3. Project Data (Real Estate OS)
    checklist.PROJECT_DATA_READY = {
      ready: Boolean(project && project.pricing?.minPriceINR > 0),
      status: project ? "PASSED" : "MISSING_PROJECT_INVENTORY",
      blockers: project ? [] : ["PROJECT_INVENTORY_PRICING_REQUIRED"]
    };
    if (!checklist.PROJECT_DATA_READY.ready) blockers.push("PROJECT_DATA_INCOMPLETE");

    // 4. Creative Production
    const creativesCount = campaign?.creatives?.length || 0;
    checklist.CREATIVE_READY = {
      ready: creativesCount > 0,
      status: creativesCount > 0 ? "PASSED" : "NO_CREATIVES_ATTACHED",
      creativesCount,
      blockers: creativesCount > 0 ? [] : ["AT_LEAST_1_VERIFIED_CREATIVE_REQUIRED"]
    };
    if (!checklist.CREATIVE_READY.ready) blockers.push("CREATIVE_ASSETS_MISSING");

    // 5. Landing Page
    checklist.LANDING_PAGE_READY = {
      ready: Boolean(client.landingPageId),
      status: client.landingPageId ? "PASSED" : "LANDING_PAGE_NOT_CONFIGURED",
      blockers: client.landingPageId ? [] : ["LANDING_PAGE_BLUEPRINT_REQUIRED"]
    };
    if (!checklist.LANDING_PAGE_READY.ready) blockers.push("LANDING_PAGE_MISSING");

    // 6. Tracking Configuration
    const trackingReady = Boolean(campaign?.tracking?.utmCampaign);
    const pixelReady = Boolean(process.env.META_PIXEL_ID || process.env.GOOGLE_CONVERSION_TAG);
    checklist.TRACKING_READY = {
      ready: trackingReady && pixelReady,
      status: trackingReady && pixelReady ? "PASSED" : "PIXEL_OR_TAG_UNCONFIGURED",
      utmCampaign: campaign?.tracking?.utmCampaign || null,
      pixelConfigured: pixelReady,
      blockers: pixelReady ? [] : ["PIXEL_OR_CONVERSION_TAG_CREDENTIAL_REQUIRED"]
    };
    if (!checklist.TRACKING_READY.ready) blockers.push("PIXEL_CONFIGURATION_MISSING");

    // 7. Ad Platform Connection
    const platformStatus = performanceMarketingService.detectPlatformAdapterStatus(campaign?.channel || "meta_ads");
    checklist.AD_PLATFORM_READY = {
      ready: platformStatus.connected,
      status: platformStatus.status,
      adAccountId: platformStatus.adAccountId,
      blockers: platformStatus.connected ? [] : [`AD_ACCOUNT_API_CONNECTION_REQUIRED: ${platformStatus.status}`]
    };
    if (!checklist.AD_PLATFORM_READY.ready) blockers.push(`${platformStatus.platform.toUpperCase()}_CONNECTION_MISSING`);

    // 8. Overall Campaign Launch Readiness
    const canLaunch = blockers.length === 0;
    checklist.CAMPAIGN_LAUNCH_READY = {
      ready: canLaunch,
      status: canLaunch ? "LAUNCHABLE" : "CAMPAIGN_NOT_LAUNCHABLE",
      blockersCount: blockers.length,
      blockers
    };

    return {
      clientId,
      businessName: client.businessName,
      canLaunchCampaign: canLaunch,
      overallStatus: canLaunch ? "READY_TO_LAUNCH" : "BLOCKED_PENDING_PREREQUISITES",
      checklist,
      blockers,
      evaluatedAt: new Date().toISOString()
    };
  }

  /**
   * 6. Retrieve Client Onboarding Summary.
   */
  getClient(clientId) {
    return this.clients.get(clientId) || null;
  }
}

module.exports = new ClientProductionPipelineService();
module.exports.ClientProductionPipelineService = ClientProductionPipelineService;
