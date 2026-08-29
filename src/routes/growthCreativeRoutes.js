/**
 * 🦅 GARUDA Creative & Growth OS API Routes
 * Endpoints for Creative Studio, IdentityLock™, Digital Marketing OS,
 * Performance Marketing Attribution, and Client Production Onboarding.
 */

const express = require("express");
const router = express.Router();

const creativeStudioService = require("../services/creativeStudioService");
const identityLockService = require("../services/identityLockService");
const imageGenerationRouter = require("../services/imageGenerationRouter");
const videoGenerationRouter = require("../services/videoGenerationRouter");
const creativeQualityService = require("../services/creativeQualityService");
const digitalMarketingOsService = require("../services/digitalMarketingOsService");
const performanceMarketingService = require("../services/performanceMarketingService");
const realEstateGrowthService = require("../services/realEstateGrowthService");
const clientProductionPipelineService = require("../services/clientProductionPipelineService");

// ===========================================================================
// CREATIVE STUDIO & ASSET GENERATION
// ===========================================================================

router.post("/creative/brief", async (req, res) => {
  try {
    const brief = await creativeStudioService.createCreativeBrief(req.body);
    res.json({ success: true, data: brief });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.post("/creative/concept", async (req, res) => {
  try {
    const briefId = req.body.briefId;
    if (!briefId) return res.status(400).json({ success: false, error: "briefId is required" });
    const concept = await creativeStudioService.generateConcept(briefId);
    res.json({ success: true, data: concept });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.post("/creative/asset", async (req, res) => {
  try {
    const { briefId, format, mode } = req.body;
    if (!briefId) return res.status(400).json({ success: false, error: "briefId is required" });
    const result = await creativeStudioService.generateAsset(briefId, format, { mode });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.post("/creative/video-storyboard", async (req, res) => {
  try {
    const { briefId, format } = req.body;
    if (!briefId) return res.status(400).json({ success: false, error: "briefId is required" });
    const result = await creativeStudioService.generateVideoStoryboard(briefId, format);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.post("/creative/campaign-family", async (req, res) => {
  try {
    const { briefId } = req.body;
    if (!briefId) return res.status(400).json({ success: false, error: "briefId is required" });
    const family = await creativeStudioService.generateCampaignFamily(briefId);
    res.json({ success: true, data: family });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.get("/creative/library", async (req, res) => {
  try {
    const library = await creativeStudioService.getAssetLibrary(req.query.projectId || null);
    res.json({ success: true, data: library });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/creative/providers", (req, res) => {
  try {
    const imageProviders = imageGenerationRouter.detectProviders();
    const videoProviders = videoGenerationRouter.detectProviders();
    res.json({
      success: true,
      data: {
        imageProviders,
        videoProviders,
        truthNotice: "Providers reporting configured: false will return truthful UNAVAILABLE states on generation attempts."
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/creative/image-providers/health/:id", async (req, res) => {
  try {
    const health = await imageGenerationRouter.checkProviderHealth(req.params.id);
    res.json({ success: true, data: health });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/creative/video-providers/health/:id", async (req, res) => {
  try {
    const health = await videoGenerationRouter.checkProviderHealth(req.params.id);
    res.json({ success: true, data: health });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ===========================================================================
// IDENTITYLOCK™ BRAND PROFILES
// ===========================================================================

router.post("/creative/brand-profile", async (req, res) => {
  try {
    const profile = await identityLockService.createOrUpdateBrandProfile(req.body);
    res.json({ success: true, data: profile });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.get("/creative/brand-profiles", (req, res) => {
  try {
    const profiles = identityLockService.listBrandProfiles();
    res.json({ success: true, data: profiles });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/creative/brand-profile/:id", (req, res) => {
  try {
    const profile = identityLockService.getBrandProfile(req.params.id);
    if (!profile) return res.status(404).json({ success: false, error: "Brand profile not found" });
    res.json({ success: true, data: profile });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/creative/validate-compliance", (req, res) => {
  try {
    const { brandId, content } = req.body;
    const validation = identityLockService.validateCompliance(brandId, content || {});
    res.json({ success: true, data: validation });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ===========================================================================
// DIGITAL MARKETING OS
// ===========================================================================

router.post("/growth/content-pillars", (req, res) => {
  try {
    const pillars = digitalMarketingOsService.generateContentPillars(req.body.brandName, req.body.industry);
    res.json({ success: true, data: pillars });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.post("/growth/calendar", async (req, res) => {
  try {
    const calendar = await digitalMarketingOsService.generateEditorialCalendar(req.body);
    res.json({ success: true, data: calendar });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.post("/growth/carousel", (req, res) => {
  try {
    const carousel = digitalMarketingOsService.generateCarouselConcept(req.body);
    res.json({ success: true, data: carousel });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.post("/growth/seo/clusters", (req, res) => {
  try {
    const clusters = digitalMarketingOsService.generateTopicClusters(req.body.keyword);
    res.json({ success: true, data: clusters });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.post("/growth/seo/article-brief", (req, res) => {
  try {
    const brief = digitalMarketingOsService.generateArticleBrief(req.body.keyword);
    res.json({ success: true, data: brief });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.post("/growth/landing-page", (req, res) => {
  try {
    const blueprint = digitalMarketingOsService.generateLandingPageBlueprint(req.body);
    res.json({ success: true, data: blueprint });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.post("/growth/reviews/draft", (req, res) => {
  try {
    const { reviewText, reviewerName, rating } = req.body;
    const response = digitalMarketingOsService.generateReviewResponses(reviewText, reviewerName, rating);
    res.json({ success: true, data: response });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.get("/growth/digital-presence", (req, res) => {
  try {
    const presence = digitalMarketingOsService.generateDigitalPresenceProfile(req.query.brandId);
    res.json({ success: true, data: presence });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ===========================================================================
// PERFORMANCE MARKETING & REAL ESTATE ORCHESTRATION
// ===========================================================================

router.post("/growth/campaigns", async (req, res) => {
  try {
    const campaign = await performanceMarketingService.createCampaign(req.body);
    res.json({ success: true, data: campaign });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.get("/growth/campaigns", async (req, res) => {
  try {
    const performance = await performanceMarketingService.getAggregatePerformance(req.query.projectId);
    res.json({ success: true, data: performance });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/growth/campaigns/:id", async (req, res) => {
  try {
    const report = await performanceMarketingService.getCampaignPerformance(req.params.id);
    res.json({ success: true, data: report });
  } catch (err) {
    res.status(404).json({ success: false, error: err.message });
  }
});

router.get("/growth/campaigns/:id/meta-mapping", (req, res) => {
  try {
    const mapping = performanceMarketingService.buildMetaCampaignMapping(req.params.id);
    res.json({ success: true, data: mapping });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.get("/growth/campaigns/:id/google-mapping", (req, res) => {
  try {
    const mapping = performanceMarketingService.buildGoogleCampaignMapping(req.params.id);
    res.json({ success: true, data: mapping });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.post("/growth/conversions", async (req, res) => {
  try {
    const conversion = await performanceMarketingService.recordConversionEvent(req.body);
    res.json({ success: true, data: conversion });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.get("/growth/real-estate/buyer-personas", (req, res) => {
  try {
    const personas = realEstateGrowthService.getBuyerPersonas(req.query.projectId);
    res.json({ success: true, data: personas });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/growth/real-estate/orchestrate", async (req, res) => {
  try {
    const { projectId, campaignName, budgetINR } = req.body;
    if (!projectId) return res.status(400).json({ success: false, error: "projectId is required" });
    const result = await realEstateGrowthService.orchestrateProjectGrowthCampaign(projectId, { campaignName, budgetINR });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ===========================================================================
// CLIENT PRODUCTION ONBOARDING PIPELINE
// ===========================================================================

router.post("/growth/clients/register", async (req, res) => {
  try {
    const client = await clientProductionPipelineService.registerClient(req.body);
    res.json({ success: true, data: client });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.post("/growth/clients/onboard", async (req, res) => {
  try {
    const result = await clientProductionPipelineService.onboardRealClient(req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.get("/growth/clients/:id", (req, res) => {
  try {
    const client = clientProductionPipelineService.getClient(req.params.id);
    if (!client) return res.status(404).json({ success: false, error: "Client not found" });
    res.json({ success: true, data: client });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/growth/clients/:id/readiness", (req, res) => {
  try {
    const readiness = clientProductionPipelineService.evaluateLaunchReadiness(req.params.id);
    res.json({ success: true, data: readiness });
  } catch (err) {
    res.status(404).json({ success: false, error: err.message });
  }
});

module.exports = router;
