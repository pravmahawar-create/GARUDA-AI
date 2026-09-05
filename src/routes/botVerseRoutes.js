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

module.exports = router;
