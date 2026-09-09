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
router.post("/magic-delegation/:token/approve", async (req, res) => {
  try {
    const magicDelegationService = require("../services/magicDelegationService");
    const telegramBotService = require("../services/telegramBotService");
    const { authorizedPlatforms } = req.body || {};
    const updated = magicDelegationService.updateStatus(req.params.token, "APPROVED", {
      authorizedPlatforms: Array.isArray(authorizedPlatforms) ? authorizedPlatforms : []
    });
    if (!updated) {
      return res.status(404).json({ success: false, message: "Delegation record not found or expired." });
    }

    // Send instant alert to Founder Telegram with sound notification
    try {
      if (telegramBotService.isConfigured()) {
        const platformsList = (updated.authorizedPlatforms && updated.authorizedPlatforms.length > 0)
          ? updated.authorizedPlatforms.join(", ")
          : "YouTube";
        const message = 
          `🚨 NEW CLIENT AUTHORIZATION RECEIVED!\n\n` +
          `👤 Client: ${updated.clientName || "Valued Client"}\n` +
          `📧 Email: ${updated.clientEmail || "Not provided"}\n` +
          `🎯 Asset: ${updated.videoTitle || "Direct Asset"}\n` +
          `🌐 Platforms: ${platformsList}\n` +
          `⏰ Time: ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}\n\n` +
          `⚡ Status: Autopilot pipeline activated. Inspect studio.youtube.com to confirm Editor invite.`;
        await telegramBotService.sendMessage(message);
      }
    } catch (e) {
      console.error("[Delegation] Telegram alert error:", e.message);
    }

    return res.json({
      success: true,
      message: "Optimization package approved and authorized. GARUDA Autopilot activated.",
      pipelineStatus: "ACTIVE_OPTIMIZATION",
      deliverables: {
        seoMetadataReady: true,
        shortsReady: 3,
        suggestedTitle: "Sara Zamana Haseeno Ka Deewana | Live Stage Performance by Praveen Mahawar",
        targetPlatforms: updated.authorizedPlatforms || ["youtube"]
      },
      delegation: updated
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * ⚡ YOUTUBE AUTONOMOUS DIRECT PUSH ENDPOINTS
 */
const youtubeDirectPush = require("../services/youtubeDirectPushService");

router.get("/youtube/status", (req, res) => {
  try {
    return res.json({ success: true, ...youtubeDirectPush.getStatus() });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/youtube/auth-url", (req, res) => {
  try {
    const host = req.headers["x-forwarded-host"] || req.headers.host || "www.garudaos.in";
    const proto = req.headers["x-forwarded-proto"] || "https";
    const redirectUri = `${proto}://${host}/api/bot-verse/youtube/callback`;
    const result = youtubeDirectPush.getAuthUrl(redirectUri);
    if (req.query.redirect === "true" && result.success && result.authUrl) {
      return res.redirect(result.authUrl);
    }
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/youtube/callback", async (req, res) => {
  try {
    const { code, error, state } = req.query;
    if (error) {
      return res.redirect(`/bot-verse?youtube_error=${encodeURIComponent(error)}`);
    }
    if (!code) {
      return res.redirect(`/bot-verse?youtube_error=No+authorization+code+received`);
    }

    let channelProfile = "garuda";
    if (state) {
      try {
        const parsed = JSON.parse(state);
        if (parsed.profile) channelProfile = parsed.profile;
      } catch {
        if (String(state).includes("praveen")) channelProfile = "praveen";
      }
    }

    const host = req.headers["x-forwarded-host"] || req.headers.host || "www.garudaos.in";
    const proto = req.headers["x-forwarded-proto"] || "https";
    const redirectUri = `${proto}://${host}/api/bot-verse/youtube/callback`;
    const authResult = await youtubeDirectPush.handleCallback(code, redirectUri, channelProfile);

    // Persist to MongoDB Atlas so local machine uploader can sync automatically
    try {
      const mongoose = require("mongoose");
      const connectDB = require("../database/db");
      if (!mongoose.connection || mongoose.connection.readyState !== 1) {
        await connectDB();
      }
      if (mongoose.connection && mongoose.connection.readyState === 1) {
        const coll = mongoose.connection.db.collection("garuda_youtube_tokens");
        const tokens = youtubeDirectPush.getStoredTokens(channelProfile);
        await coll.updateOne(
          { _id: channelProfile },
          { $set: { ...tokens, channelProfile, updatedAt: new Date() } },
          { upsert: true }
        );
      }
    } catch (mErr) {
      console.warn("[botVerseRoutes] MongoDB token sync note:", mErr.message);
    }

    return res.redirect(`/bot-verse?youtube_connected=true&profile=${encodeURIComponent(channelProfile)}`);
  } catch (error) {
    return res.redirect(`/bot-verse?youtube_error=${encodeURIComponent(error.message)}`);
  }
});

router.get("/youtube/token-transfer", async (req, res) => {
  try {
    const fs = require("fs");
    const path = require("path");
    const tokensFile = path.join(__dirname, "..", "..", "data", "youtube-tokens.json");
    if (!fs.existsSync(tokensFile)) {
      return res.json({ success: false, message: "No tokens file on disk" });
    }
    const raw = JSON.parse(fs.readFileSync(tokensFile, "utf8"));
    const mongoose = require("mongoose");
    const connectDB = require("../database/db");
    if (!mongoose.connection || mongoose.connection.readyState !== 1) {
      await connectDB();
    }
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      const coll = mongoose.connection.db.collection("garuda_youtube_tokens");
      const profile = raw.channelId === "UC68_XAkGvyU95T1VrTnrw0Q" ? "praveen" : (raw.channelProfile || "garuda");
      await coll.updateOne(
        { _id: profile },
        { $set: { ...raw, channelProfile: profile, updatedAt: new Date() } },
        { upsert: true }
      );
      return res.json({ success: true, message: `Synced ${profile} token to MongoDB Atlas!`, profile, channelTitle: raw.channelTitle });
    }
    return res.json({ success: false, message: "MongoDB unavailable" });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/youtube/push", async (req, res) => {
  try {
    const { videoId, title, description, tags, categoryId } = req.body || {};
    const result = await youtubeDirectPush.pushVideoUpdate({
      videoId,
      title,
      description,
      tags,
      categoryId
    });
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/youtube/upload", async (req, res) => {
  try {
    const { videoFilePath, title, description, tags, privacyStatus, categoryId } = req.body || {};
    const result = await youtubeDirectPush.uploadVideo({
      videoFilePath,
      title,
      description,
      tags,
      privacyStatus,
      categoryId
    });
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

