const express = require("express");
const router = express.Router();
const creativeStudioService = require("../services/creativeStudioService");
const imageGenerationRouter = require("../services/imageGenerationRouter");
const videoGenerationRouter = require("../services/videoGenerationRouter");
const audioGenerationRouter = require("../services/audioGenerationRouter");
const { getQualityFloor } = require("../services/garudaCorePrinciples");

// Minimal natural-language intent extraction — reuses Garuda simplicity principle
function inferCreativeIntent(prompt = "") {
  const text = String(prompt).toLowerCase();
  let assetType = "IMAGE"; // default
  if (/\b(video|reel|film|trailer|cinematic video|ad video)\b/.test(text)) assetType = "VIDEO";
  else if (/\b(voice|audio|tts|speak|narration|music)\b/.test(text)) assetType = "AUDIO";
  else if (/\b(poster|image|visual|creative|banner|poster|photo)\b/.test(text)) assetType = "IMAGE";

  let qualityProfile = "standard";
  if (/\b(cinematic|flagship|brand film|premium|marketing campaign|high[- ]?quality)\b/.test(text)) qualityProfile = "cinematic";
  else if (/\b(premium)\b/.test(text)) qualityProfile = "premium";
  else if (/\b(draft|preview|rough)\b/.test(text)) qualityProfile = "preview";

  const brandHint = text.includes("garuda") ? "GARUDA" : null;

  return {
    intent: "CREATE_CREATIVE_ASSET",
    assetType,
    qualityProfile,
    requiredFloor: getQualityFloor(qualityProfile),
    brandHint,
    userExperience: "SIMPLE",
    originalPrompt: String(prompt).trim()
  };
}

// POST /api/creative/generate — simple natural language
router.post("/generate", async (req, res) => {
  try {
    const prompt = String(req.body.prompt || req.body.text || req.body.message || "").trim();
    if (!prompt || prompt.length < 5) {
      return res.status(400).json({ success: false, message: "prompt is required (e.g., 'Ek premium cinematic image bana do GARUDA ke liye')" });
    }

    const projectId = req.body.projectId || null;
    const brandId = req.body.brandId || null;
    const identityId = req.body.identityId || null;
    const styleProfileId = req.body.styleProfileId || null;
    const continuityRequired = Boolean(req.body.continuityRequired);

    const intent = inferCreativeIntent(prompt);

    // Create brief via CreativeStudioService (reuses existing orchestration, hides technical complexity)
    const brief = await creativeStudioService.createCreativeBrief({
      title: prompt.slice(0, 120),
      brandName: intent.brandHint || req.body.brandName || "GARUDA",
      projectId,
      brandId,
      identityId,
      styleProfileId,
      continuityRequired,
      qualityProfile: intent.qualityProfile
    });

    // Ensure concept exists for asset generation (needed by imageGenerationRouter via brief)
    try { await creativeStudioService.generateConcept(brief.briefId); } catch {}

    // Decide generation mode truthfully — default DRY_RUN safe
    const requestedLive = String(req.body.generationMode || "").toUpperCase() === "LIVE_GENERATION";
    const founderLiveApproved = process.env.FOUNDER_APPROVED_LIVE_GENERATION === "true";
    const generationMode = requestedLive && founderLiveApproved ? "LIVE_GENERATION" : "DRY_RUN";

    let assetResult = null;
    let asset = null;

    if (intent.assetType === "VIDEO") {
      const videoRes = await creativeStudioService.generateVideoStoryboard(brief.briefId, "REEL_9_16");
      // Video always storyboard unless live Runway approved — truthful
      return res.json({
        success: true,
        status: "PREVIEW_READY",
        message: generationMode === "LIVE_GENERATION" ? "Video storyboard ready. Live MP4 requires founder-approved Runway generation." : "Cinematic storyboard ready. Live video generation requires founder approval.",
        intent,
        briefId: brief.briefId,
        asset: null,
        storyboard: videoRes.storyboard,
        generationMode,
        fallbackUsed: false,
        verification: { physicalVerification: "STORYBOARD_BLUEPRINT_AUTHORITATIVE", visualQuality: "VISUAL_QUALITY_NOT_YET_VERIFIED" },
        qualityProfile: intent.qualityProfile,
        truthClassification: "PREVIEW_READY"
      });
    }

    if (intent.assetType === "AUDIO") {
      const audioRes = await audioGenerationRouter.routeAudioGeneration({
        text: prompt,
        briefId: brief.briefId,
        projectId,
        brandId: brief.identityLock?.brandId || brandId,
        identityId,
        styleProfileId,
        continuityRequired,
        qualityProfile: intent.qualityProfile
      });
      return res.json({
        success: !audioRes.error || audioRes.status.includes("UNAVAILABLE") ? true : false,
        status: audioRes.status === "AUDIO_GENERATION_PROVIDER_UNAVAILABLE" ? "PREVIEW_READY" : audioRes.status,
        message: audioRes.error || "Audio generation truthful response",
        intent,
        briefId: brief.briefId,
        generationMode,
        verification: { physicalVerification: "NOT_APPLICABLE", visualQuality: "VISUAL_QUALITY_NOT_YET_VERIFIED" },
        qualityProfile: intent.qualityProfile,
        truthClassification: audioRes.truthClassification || "TRUTHFUL_UNAVAILABLE",
        metadata: { provider: audioRes.provider, costEstimate: null }
      });
    }

    // IMAGE golden path — via CreativeStudioService → imageGenerationRouter
    // Do not expose provider/model to user; internal routing only
    assetResult = await creativeStudioService.generateAsset(brief.briefId, "IMAGE_SQUARE", {
      mode: undefined, // let service auto-select AI vs sovereign based on quality + provider availability
      generationMode,
      prompt,
      projectId,
      brandId: brief.identityLock.brandId,
      identityId,
      styleProfileId,
      continuityRequired,
      qualityProfile: intent.qualityProfile,
      mockFalSuccess: generationMode === "DRY_RUN" ? true : false,
      _testMock: generationMode === "DRY_RUN" ? true : false
    });

    // Also handle direct imageGenerationRouter result shape (asset vs fallback)
    const finalAsset = assetResult.asset || assetResult.fallbackAsset || assetResult;
    const isSimulated = finalAsset.generationMode === "DRY_RUN" || finalAsset.classification === "SIMULATED_GENERATION";
    const isReal = finalAsset.classification === "REAL_AI_IMAGE" && finalAsset.generationMode === "LIVE_GENERATION";

    // Truthful status per generationMode
    const status = isReal ? "GENERATED" : "PREVIEW_READY";
    const message = isReal
      ? "Premium creative generated successfully."
      : "Creative concept ready. Live premium generation requires founder approval.";
    const truthClassification = isReal ? "PHYSICAL_DISK_VERIFIED" : "SIMULATED_DRY_RUN";

    return res.json({
      success: true,
      status,
      message,
      intent,
      briefId: brief.briefId,
      asset: {
        assetId: finalAsset.assetId,
        provider: finalAsset.provider,
        classification: finalAsset.classification,
        generationMode: finalAsset.generationMode || generationMode,
        model: finalAsset.model || null,
        fileName: finalAsset.fileName,
        assetUrl: finalAsset.assetUrl,
        dimensions: finalAsset.dimensions,
        aspectRatio: finalAsset.aspectRatio,
        fileSize: finalAsset.fileSize,
        projectId: finalAsset.projectId || projectId,
        brandId: finalAsset.identityLock?.brandId || brandId,
        identityId: identityId || null,
        continuityRequired
      },
      generationMode: finalAsset.generationMode || generationMode,
      provider: finalAsset.provider,
      costEstimate: finalAsset.costEstimate ?? null,
      fallbackUsed: Boolean(assetResult.fallbackUsed),
      verification: {
        physicalVerification: finalAsset.filePath ? "PHYSICAL_DISK_VERIFIED" : "NOT_VERIFIED",
        visualQuality: "VISUAL_QUALITY_NOT_YET_VERIFIED",
        qualityProfile: intent.qualityProfile,
        requiredFloor: intent.requiredFloor
      },
      qualityProfile: intent.qualityProfile,
      truthClassification,
      metadata: {
        briefId: brief.briefId,
        brandLockHash: brief.identityLock?.lockHash?.slice(0, 12) || null
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message, error: String(err.message).slice(0, 300) });
  }
});

// GET /api/creative/assets/:id — retrieval, never expose secrets
router.get("/assets/:id", (req, res) => {
  const id = String(req.params.id).trim();
  let asset = null;
  // Search all routers + studio
  asset = imageGenerationRouter.getAsset(id) || imageGenerationRouter.assets?.get?.(id) || null;
  if (!asset) asset = videoGenerationRouter.getStoryboard ? videoGenerationRouter.getStoryboard(id) : null;
  if (!asset) {
    // Try creativeStudioService assets
    try { asset = creativeStudioService.assets?.get?.(id) || null; } catch {}
  }
  if (!asset) {
    // Try audio jobs
    try { asset = require("../services/audioGenerationRouter").getStatus(id) || null; } catch {}
  }
  if (!asset) return res.status(404).json({ success: false, message: "Asset not found", assetId: id });

  // Strip any secret fields before return
  const safeAsset = { ...asset };
  delete safeAsset.apiKey;
  delete safeAsset.authorization;
  delete safeAsset.secret;

  return res.json({
    success: true,
    assetId: id,
    status: safeAsset.status || "GENERATED",
    classification: safeAsset.classification || safeAsset.status,
    provider: safeAsset.provider,
    generationMode: safeAsset.generationMode || null,
    verification: safeAsset.qualityValidation || safeAsset.verification || null,
    qualityProfile: safeAsset.qualityProfile || null,
    fallbackUsed: Boolean(safeAsset.fallbackUsed),
    asset: {
      assetId: safeAsset.assetId,
      provider: safeAsset.provider,
      classification: safeAsset.classification,
      generationMode: safeAsset.generationMode,
      fileName: safeAsset.fileName,
      assetUrl: safeAsset.assetUrl,
      dimensions: safeAsset.dimensions,
      fileSize: safeAsset.fileSize,
      projectId: safeAsset.projectId,
      brandId: safeAsset.identityLock?.brandId || safeAsset.brandId
    }
  });
});

module.exports = router;
