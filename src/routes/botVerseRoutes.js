/**
 * 🦅 GARUDA BOT-VERSE API ROUTES (Digital Marketing Universe)
 * Exposes endpoints to generate, inspect, and manage omni-channel Bot-Verse growth campaigns.
 */

const express = require("express");
const router = express.Router();
const botVerseEngine = require("../services/botVerseEngineService");

/**
 * GET /api/bot-verse/status
 */
router.get("/status", (req, res) => {
  return res.json({
    success: true,
    universe: "U20_CONTENT_U22_PRESENCE_DIGITAL_MARKETING",
    engine: "GARUDA_BOT_VERSE_OMNICHANNEL_V1",
    activeBots: [
      { id: "youtube_apex", name: "YouTube Apex Bot", role: "Search SEO, High-CTR Hooks, Shorts Factory" },
      { id: "instagram_viral", name: "Instagram Viral Bot", role: "Reels Hooks, Kinetic Captions, Automated DM Comment Funnels" },
      { id: "facebook_omni", name: "Facebook Omni Bot", role: "Native Video Uploads, B2B Community Infiltration" },
      { id: "linkedin_exec", name: "LinkedIn Executive Bot", role: "Transcript to 5-Slide PDF Carousels, Thought Leadership" },
      { id: "google_semantic", name: "Google Semantic SEO Bot", role: "JSON-LD VideoObject Schema, Search Key Moments" },
      { id: "unified_bridge", name: "Unified Conversion Bridge", role: "Trackable chat routing to garudaos.in & WhatsApp" }
    ]
  });
});

/**
 * GET /api/bot-verse/oembed?url=...
 * Real-time video preview metadata (YouTube, etc.)
 */
router.get("/oembed", async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ success: false, error: "Missing url parameter" });
    const videoReachBooster = require("../services/videoReachBoosterService");
    const meta = await videoReachBooster.fetchVideoMetadata(url);
    return res.json({ success: true, metadata: meta });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/bot-verse/generate
 * Generate a complete 6-platform Bot-Verse campaign
 */
router.post("/generate", async (req, res) => {
  try {
    const campaign = await botVerseEngine.generateBotVerseCampaign(req.body || {});
    return res.status(201).json({
      success: true,
      message: "BOT-VERSE omni-channel growth campaign generated successfully.",
      campaign
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/bot-verse/revive-video
 * Optimize and revive an underperforming video
 */
router.post("/revive-video", async (req, res) => {
  try {
    const campaign = await botVerseEngine.optimizeExistingVideo(req.body || {});
    return res.status(200).json({
      success: true,
      message: "Video revival blueprint generated across all 6 bot vectors.",
      campaign
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/bot-verse/campaigns
 * List all generated Bot-Verse campaigns
 */
router.get("/campaigns", (req, res) => {
  try {
    const campaigns = botVerseEngine.listCampaigns();
    return res.json({
      success: true,
      count: campaigns.length,
      campaigns
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/bot-verse/campaigns/:id
 */
router.get("/campaigns/:id", (req, res) => {
  try {
    const campaigns = botVerseEngine.listCampaigns();
    const found = campaigns.find(c => c.campaignId === req.params.id);
    if (!found) {
      return res.status(404).json({ success: false, message: "Bot-Verse campaign not found" });
    }
    return res.json({ success: true, campaign: found });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/bot-verse/pricing-quote
 * Calculate market rate vs GARUDA autonomous rate for social media management
 */
router.get("/pricing-quote", (req, res) => {
  try {
    const magicDelegationService = require("../services/magicDelegationService");
    const platformsQuery = req.query.platforms ? req.query.platforms.split(",").map(p => p.trim()) : ["youtube", "instagram", "facebook"];
    const quote = magicDelegationService.calculateOmniQuote(platformsQuery);
    return res.json({
      success: true,
      supportedPlatforms: magicDelegationService.SUPPORTED_PLATFORMS,
      quote
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/bot-verse/magic-delegation
 * Create and dispatch a 1-click magic delegation invite (email + WhatsApp)
 */
router.post("/magic-delegation", async (req, res) => {
  try {
    const magicDelegationService = require("../services/magicDelegationService");
    const { clientName, clientEmail, clientPhone, videoUrl, videoTitle, videoThumbnail, campaignId, proposedPackage, selectedPlatforms } = req.body || {};
    
    const record = magicDelegationService.createDelegation({
      clientName,
      clientEmail,
      clientPhone,
      selectedPlatforms: selectedPlatforms || ["youtube", "instagram", "facebook"],
      videoUrl,
      videoTitle,
      videoThumbnail,
      campaignId,
      proposedPackage
    });

    const hostUrl = req.headers["x-forwarded-host"]
      ? `${req.headers["x-forwarded-proto"] || "https"}://${req.headers["x-forwarded-host"]}`
      : "https://www.garudaos.in";

    const dispatchResult = await magicDelegationService.dispatchInvitation(record, hostUrl);
    return res.status(201).json({
      success: true,
      message: "Magic delegation invitation created and dispatched successfully.",
      record,
      dispatch: dispatchResult
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/bot-verse/magic-delegation/:token
 * Fetch delegation details for client review portal
 */
router.get("/magic-delegation/:token", (req, res) => {
  try {
    const magicDelegationService = require("../services/magicDelegationService");
    const delegation = magicDelegationService.getDelegationByToken(req.params.token);
    if (!delegation) {
      return res.status(404).json({ success: false, message: "Delegation record not found or expired." });
    }
    magicDelegationService.updateStatus(req.params.token, "OPENED");
    return res.json({
      success: true,
      delegation,
      supportedPlatforms: magicDelegationService.SUPPORTED_PLATFORMS
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/bot-verse/magic-delegation/:token/approve
 * Client approves proposed SEO package and authorizes selected platforms
 */
router.post("/magic-delegation/:token/approve", (req, res) => {
  try {
    const magicDelegationService = require("../services/magicDelegationService");
    const { authorizedPlatforms } = req.body || {};
    const updated = magicDelegationService.updateStatus(req.params.token, "APPROVED", {
      authorizedPlatforms: Array.isArray(authorizedPlatforms) ? authorizedPlatforms : []
    });
    if (!updated) {
      return res.status(404).json({ success: false, message: "Delegation record not found or expired." });
    }
    return res.json({
      success: true,
      message: "Optimization package approved and authorized. GARUDA Autopilot activated.",
      delegation: updated
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
