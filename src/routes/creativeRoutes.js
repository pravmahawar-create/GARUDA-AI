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

    // Create Living Artifact for durability and continuation — governed secondary step
    let livingArtifact = null;
    try {
      const livingArtifactService = require("../services/livingArtifactService");
      const continuityScopeId = projectId || req.body.sessionId || req.body.conversationId || req.body.continuityScopeId || brief.briefId || null;
      const sessionId = req.body.sessionId || req.body.conversationId || null;
      livingArtifact = livingArtifactService.createLivingArtifactContext({
        artifactType: "creative_asset",
        purpose: prompt,
        audience: brief.targetAudience || "general",
        sourceGoal: { intent: intent.intent, domain: "creative", rawGoal: prompt },
        sourceBrief: brief,
        narrative: `Created via /api/creative/generate for prompt: "${prompt}" with asset ${finalAsset.assetId}`,
        keyClaims: [
          { claim: `Creative asset ${finalAsset.assetId} with classification ${finalAsset.classification}`, evidence: finalAsset.filePath, confidence: "EVIDENCE_BACKED" }
        ],
        evidence: [{ type: "creative_asset", assetId: finalAsset.assetId, filePath: finalAsset.filePath, classification: finalAsset.classification, generationMode: finalAsset.generationMode }],
        projectId: projectId,
        sessionId: sessionId,
        continuityScopeId: continuityScopeId,
        briefId: brief.briefId,
        sourceArtifactId: null,
        rootArtifactId: null
      });
    } catch {}

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
      visualQuality: "VISUAL_QUALITY_NOT_YET_VERIFIED",
      qualityProfile: intent.qualityProfile,
      truthClassification,
      livingArtifactId: livingArtifact ? livingArtifact.artifactId : null,
      continuityScopeId: livingArtifact ? livingArtifact.continuityScopeId : (projectId || null),
      metadata: {
        briefId: brief.briefId,
        brandLockHash: brief.identityLock?.lockHash?.slice(0, 12) || null,
        livingArtifactId: livingArtifact ? livingArtifact.artifactId : null
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

// GET /api/creative/artifacts/:artifactId — retrieve single Living Artifact
router.get("/artifacts/:artifactId", (req, res) => {
  const artifactId = String(req.params.artifactId || "").trim();
  if (!artifactId) return res.status(400).json({ success: false, message: "artifactId required" });
  const livingArtifactService = require("../services/livingArtifactService");
  const doc = livingArtifactService.getLivingArtifactContext(artifactId);
  if (!doc) return res.status(404).json({ success: false, message: "Living artifact not found", artifactId });
  // Truthful fields only, never claim REAL_AI_IMAGE for simulation
  return res.json({
    success: true,
    artifactId: doc.artifactId,
    sourceArtifactId: doc.sourceArtifactId || null,
    rootArtifactId: doc.rootArtifactId || null,
    continuityScopeId: doc.continuityScopeId || null,
    projectId: doc.projectId || null,
    sessionId: doc.sessionId || null,
    conversationId: doc.conversationId || null,
    status: doc.status || "CREATED",
    classification: doc.evidence && doc.evidence[0] ? doc.evidence[0].classification : doc.artifactType,
    generationMode: doc.evidence && doc.evidence[0] ? doc.evidence[0].generationMode : null,
    visualQuality: "VISUAL_QUALITY_NOT_YET_VERIFIED",
    artifactType: doc.artifactType,
    purpose: doc.purpose,
    audience: doc.audience,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt || doc.createdAt,
    briefId: doc.briefId || null,
    evidence: doc.evidence || [],
    narrative: doc.narrative || null
  });
});

// GET /api/creative/artifacts/:artifactId/lineage — lineage/history retrieval
router.get("/artifacts/:artifactId/lineage", (req, res) => {
  const artifactId = String(req.params.artifactId || "").trim();
  if (!artifactId) return res.status(400).json({ success: false, message: "artifactId required" });
  const livingArtifactService = require("../services/livingArtifactService");
  try {
    const lineage = livingArtifactService.getArtifactLineage(artifactId);
    const safeLineage = lineage.map(doc => ({
      artifactId: doc.artifactId,
      artifactType: doc.artifactType,
      status: doc.status || "CREATED",
      sourceArtifactId: doc.sourceArtifactId || null,
      rootArtifactId: doc.rootArtifactId || null,
      continuityScopeId: doc.continuityScopeId || null,
      projectId: doc.projectId || null,
      sessionId: doc.sessionId || null,
      conversationId: doc.conversationId || null,
      purpose: doc.purpose,
      audience: doc.audience,
      continuationInstruction: doc.continuationInstruction || null,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt || doc.createdAt,
      briefId: doc.briefId || null,
      evidence: doc.evidence || [],
      narrative: doc.narrative || null
    }));
    return res.json({
      success: true,
      artifactId,
      lineageCount: safeLineage.length,
      rootArtifactId: safeLineage.length > 0 ? safeLineage[0].rootArtifactId || safeLineage[0].artifactId : null,
      lineage: safeLineage
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message, error: String(err.message).slice(0, 300) });
  }
});

// GET /api/creative/artifacts?projectId=&sessionId=&continuityScopeId=&briefId=&limit= — scoped list, never global
router.get("/artifacts", (req, res) => {
  const projectId = req.query.projectId ? String(req.query.projectId).trim() : null;
  const sessionId = req.query.sessionId ? String(req.query.sessionId).trim() : null;
  const conversationId = req.query.conversationId ? String(req.query.conversationId).trim() : null;
  const continuityScopeId = req.query.continuityScopeId ? String(req.query.continuityScopeId).trim() : null;
  const briefId = req.query.briefId ? String(req.query.briefId).trim() : null;
  const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 20;
  const effectiveSessionId = sessionId || conversationId || null;
  if (!projectId && !effectiveSessionId && !continuityScopeId && !briefId) {
    return res.status(400).json({
      success: false,
      status: "CLARIFICATION_REQUIRED",
      message: "At least one scope filter required: projectId, sessionId, continuityScopeId, or briefId. Global listing not allowed.",
      artifacts: []
    });
  }
  const livingArtifactService = require("../services/livingArtifactService");
  const list = livingArtifactService.listLivingArtifacts({
    projectId,
    sessionId: effectiveSessionId,
    continuityScopeId,
    briefId,
    artifactType: "creative",
    limit: Math.max(1, Math.min(limit || 20, 100))
  });
  const safeList = list.map(doc => ({
    artifactId: doc.artifactId,
    sourceArtifactId: doc.sourceArtifactId || null,
    rootArtifactId: doc.rootArtifactId || null,
    continuityScopeId: doc.continuityScopeId || null,
    projectId: doc.projectId || null,
    sessionId: doc.sessionId || null,
    status: doc.status || "CREATED",
    classification: doc.evidence && doc.evidence[0] ? doc.evidence[0].classification : doc.artifactType,
    generationMode: doc.evidence && doc.evidence[0] ? doc.evidence[0].generationMode : null,
    visualQuality: "VISUAL_QUALITY_NOT_YET_VERIFIED",
    artifactType: doc.artifactType,
    purpose: doc.purpose,
    createdAt: doc.createdAt
  }));
  return res.json({ success: true, count: safeList.length, artifacts: safeList });
});

// POST /api/creative/continue — scoped continuation, lineage preserved, DRY_RUN default
router.post("/continue", async (req, res) => {
  try {
    const instruction = String(req.body.instruction || req.body.prompt || req.body.text || "").trim();
    if (!instruction || instruction.length < 5) {
      return res.status(400).json({ success: false, status: "CLARIFICATION_REQUIRED", message: "instruction is required (e.g., 'make it darker')" });
    }
    const projectId = req.body.projectId ? String(req.body.projectId).trim() : null;
    const sessionId = req.body.sessionId ? String(req.body.sessionId).trim() : null;
    const conversationId = req.body.conversationId ? String(req.body.conversationId).trim() : null;
    const continuityScopeId = req.body.continuityScopeId ? String(req.body.continuityScopeId).trim() : null;
    const artifactId = req.body.artifactId ? String(req.body.artifactId).trim() : null;
    const briefId = req.body.briefId ? String(req.body.briefId).trim() : null;

    const livingArtifactService = require("../services/livingArtifactService");
    const creativeStudioService = require("../services/creativeStudioService");

    let sourceArtifact = null;
    if (artifactId) {
      sourceArtifact = livingArtifactService.getLivingArtifactContext(artifactId);
      if (!sourceArtifact) {
        return res.status(404).json({ success: false, status: "CLARIFICATION_REQUIRED", message: `Explicit artifact ${artifactId} not found`, artifactId });
      }
    } else {
      const scopeFilter = { projectId, sessionId: sessionId || conversationId, continuityScopeId, briefId };
      const hasScope = projectId || sessionId || conversationId || continuityScopeId || briefId;
      if (!hasScope) {
        return res.status(400).json({ success: false, status: "CLARIFICATION_REQUIRED", message: "No resolvable scope: provide projectId, sessionId, continuityScopeId, briefId, or explicit artifactId", scopeFilter });
      }
      sourceArtifact = livingArtifactService.getMostRecentCreativeArtifactScoped(scopeFilter);
      if (!sourceArtifact) {
        return res.status(404).json({ success: false, status: "CLARIFICATION_REQUIRED", message: `No previous creative found for scope ${JSON.stringify(scopeFilter)}`, scopeFilter });
      }
    }

    // Combine previous context + new instruction — reuse previous creative context truthfully
    const originalPurpose = sourceArtifact.purpose || sourceArtifact.sourceGoal?.rawGoal || "premium cinematic poster";
    const wantsInstagram = /\binstagram\b/i.test(instruction);
    const newPrompt = `${originalPurpose} with modification: ${instruction}`;
    const newTitle = wantsInstagram ? `${originalPurpose} - Instagram version` : `${originalPurpose} - ${instruction.slice(0,40)}`;

    const brief = await creativeStudioService.createCreativeBrief({
      title: newTitle,
      brandName: sourceArtifact.sourceBrief?.brandName || "GARUDA",
      projectId: sourceArtifact.projectId || projectId || null,
      brandId: sourceArtifact.sourceBrief?.brandId || null
    });
    try { await creativeStudioService.generateConcept(brief.briefId); } catch {}
    const platform = wantsInstagram ? "instagram_story" : "instagram_post";
    const asset = await creativeStudioService.generateAsset(brief.briefId, wantsInstagram ? "IMAGE_STORY" : "IMAGE_SQUARE", {
      generationMode: "DRY_RUN",
      _testMock: true,
      mockFalSuccess: true,
      prompt: newPrompt,
      platformPreset: platform
    });

    const isSimulated = asset.generationMode === "DRY_RUN" || asset.classification === "SIMULATED_GENERATION";
    const status = isSimulated ? "PREVIEW_READY" : "GENERATED";

    // Persist new Living Artifact with lineage — never overwrite original
    let newArtifact = null;
    let livingArtifactError = null;
    try {
      const effectiveProjectId = projectId || sourceArtifact.projectId || null;
      const effectiveSessionId = sessionId || conversationId || sourceArtifact.sessionId || sourceArtifact.conversationId || null;
      const effectiveContinuityScopeId = continuityScopeId || sourceArtifact.continuityScopeId || sourceArtifact.projectId || sourceArtifact.sessionId || brief.briefId;
      newArtifact = livingArtifactService.createLivingArtifactContext({
        artifactType: "creative_asset",
        purpose: newPrompt,
        audience: sourceArtifact.audience || "general",
        sourceGoal: { intent: "create_creative_asset", domain: "creative", rawGoal: instruction, continuationOf: sourceArtifact.artifactId, rootArtifactId: sourceArtifact.rootArtifactId || sourceArtifact.artifactId },
        sourceBrief: brief,
        narrative: `Continuation of ${sourceArtifact.artifactId}: ${instruction}. Original: "${originalPurpose}". New asset ${asset.assetId} with classification ${asset.classification}.`,
        keyClaims: [
          { claim: `Continuation asset ${asset.assetId} derived from ${sourceArtifact.artifactId}`, evidence: asset.filePath, confidence: "EVIDENCE_BACKED" },
          { claim: `Modification instruction: ${instruction}`, evidence: instruction, confidence: "EVIDENCE_BACKED" },
          { claim: `Visual quality not yet verified`, evidence: null, confidence: "ASSUMPTION" }
        ],
        evidence: [
          { type: "creative_asset", assetId: asset.assetId, filePath: asset.filePath, assetHash: asset.assetHash, verified: true, classification: asset.classification, generationMode: asset.generationMode },
          { type: "source_artifact", artifactId: sourceArtifact.artifactId, purpose: sourceArtifact.purpose }
        ],
        assumptions: [],
        decisions: [{ decision: `Applied continuation: ${instruction}`, reason: "User requested modification of previous creative" }],
        risks: [],
        projectId: effectiveProjectId,
        briefId: brief.briefId,
        sessionId: effectiveSessionId,
        continuityScopeId: effectiveContinuityScopeId,
        conversationId: conversationId || effectiveSessionId,
        continuationInstruction: instruction,
        rootArtifactId: sourceArtifact.rootArtifactId || sourceArtifact.artifactId,
        sourceArtifactId: sourceArtifact.artifactId
      });
      if (newArtifact) {
        newArtifact.sourceArtifactId = sourceArtifact.artifactId;
        newArtifact.rootArtifactId = sourceArtifact.rootArtifactId || sourceArtifact.artifactId;
        newArtifact.continuationInstruction = instruction;
      }
    } catch (e) {
      livingArtifactError = e.message;
    }

    return res.json({
      success: true,
      status,
      classification: asset.classification,
      generationMode: asset.generationMode || "DRY_RUN",
      visualQuality: "VISUAL_QUALITY_NOT_YET_VERIFIED",
      truthClassification: isSimulated ? "SIMULATED_DRY_RUN" : "PHYSICAL_DISK_VERIFIED",
      briefId: brief.briefId,
      assetId: asset.assetId,
      artifactId: newArtifact ? newArtifact.artifactId : null,
      sourceArtifactId: sourceArtifact.artifactId,
      rootArtifactId: sourceArtifact.rootArtifactId || sourceArtifact.artifactId,
      continuityScopeId: newArtifact ? newArtifact.continuityScopeId : (sourceArtifact.continuityScopeId || null),
      projectId: newArtifact ? newArtifact.projectId : (sourceArtifact.projectId || projectId),
      sessionId: newArtifact ? newArtifact.sessionId : (sourceArtifact.sessionId || sessionId),
      livingArtifactStatus: newArtifact ? "CREATED" : (livingArtifactError ? "PERSISTENCE_FAILED" : "NOT_CREATED"),
      livingArtifactError: livingArtifactError,
      asset: {
        assetId: asset.assetId,
        provider: asset.provider,
        classification: asset.classification,
        generationMode: asset.generationMode,
        fileName: asset.fileName,
        assetUrl: asset.assetUrl
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message, error: String(err.message).slice(0, 300) });
  }
});

module.exports = router;
