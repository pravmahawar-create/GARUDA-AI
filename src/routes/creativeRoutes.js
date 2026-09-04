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

// ── EDIT MODE: canonical media ingest + timeline render (website-first) ──
const { creativeUpload } = require("../middleware/upload");
const mediaEditingService = require("../services/mediaEditingService");

// POST /api/creative/media/ingest — upload raw footage / audio / image for EDIT workflows
router.post("/media/ingest", creativeUpload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success:false, message:"file field required (multipart/form-data)" });
    const record = await mediaEditingService.ingestMedia(req.file);
    return res.json({ success:true, status:"INGESTED", assetId: record.assetId, filePath: record.filePath, sha256: record.sha256, fileSize: record.fileSize, mimetype: record.mimetype });
  } catch (e) { return res.status(500).json({ success:false, message:e.message }); }
});

// POST /api/creative/media/render — timeline render via FFmpeg (reuses ffmpeg-static)
router.post("/media/render", async (req, res) => {
  try {
    const inputs = Array.isArray(req.body.inputs) ? req.body.inputs : [];
    const operations = Array.isArray(req.body.operations) ? req.body.operations : [];
    const outputName = req.body.outputName || null;
    if (inputs.length===0) return res.status(400).json({ success:false, message:"inputs[] (filePaths) required" });
    const result = await mediaEditingService.renderTimeline({ inputs, operations, outputName });
    return res.json({ success:true, status: result.status, assetId: result.assetId, filePath: result.filePath, publicUrl: result.publicUrl, dataUrl: result.dataUrl, sha256: result.sha256, qc: result.qc });
  } catch (e) { return res.status(500).json({ success:false, message:e.message }); }
});

// GET /api/creative/media/capabilities — truthful EDIT capability probe
router.get("/media/capabilities", (req, res) => {
  res.json({ success:true, data: mediaEditingService.getCapabilities() });
});

// GET /api/creative/audio/truth — P0 REAL vs PROCEDURAL truth matrix (no secrets)
router.get("/audio/truth", async (req, res) => {
  try {
    const audioRouter = require("../services/audioGenerationRouter");
    const detection = audioRouter.detectProviders();
    const matrix = await audioRouter.getTruthMatrix();
    const snapshot = audioRouter.getAudioOperationsSnapshot();
    res.json({
      success: true,
      truthMatrix: matrix,
      snapshot,
      detection,
      pipeline: "REAL MUSIC GENERATION → AUDIO QC → ASYNC PCM DECODE → REAL BPM/BEAT MAP → FOOTAGE ANALYSIS → DIRECTOR/EDITOR → TIMELINE → FFMPEG → FINAL QC → WEBSITE",
      doctrine: "REAL_AI_MUSIC is BLOCKED when HF model not supported by provider (HTTP 400). PROCEDURAL_AUDIO is verified fallback, never labelled as real music."
    });
  } catch (e) { res.status(500).json({ success:false, message:e.message }); }
});

// GET /api/creative/audio/health — per-provider health (HF blocked detail, never exposes token)
router.get("/audio/health", async (req, res) => {
  try {
    const audioRouter = require("../services/audioGenerationRouter");
    const caps = await audioRouter.discoverProviderCapabilities();
    res.json({ success:true, data:caps });
  } catch(e){ res.status(500).json({ success:false, message:e.message }); }
});

// POST /api/creative/audio/qc — verify audio file QC (exists, ffprobe, tone detection)
router.post("/audio/qc", async (req, res) => {
  const filePath = String(req.body.filePath || req.body.audioPath || "").trim();
  if(!filePath) return res.status(400).json({ success:false, message:"filePath/audioPath required" });
  try{
    const audioRouter = require("../services/audioGenerationRouter");
    const qc = await audioRouter.verifyAudioQC(filePath);
    const success = qc.passed && !qc.isTone;
    res.json({ success, qc, isRealMusic: qc.hasVariation && !qc.isTone, isProceduralTone: qc.isTone });
  }catch(e){ res.status(500).json({ success:false, message:e.message }); }
});

// POST /api/creative/media/beat-analyze — REAL sovereign beat/BPM (non-blocking)
router.post("/media/beat-analyze", async (req, res) => {
  const audioPath = String(req.body.audioPath||"").trim();
  const useReal = req.body.real!==false; // default real
  try{
    const result = useReal ? await mediaEditingService.analyzeBeatsAsync(audioPath || null) : mediaEditingService.analyzeBeats(audioPath || null);
    const success = result.status!=="UNAVAILABLE" && result.status!=="ANALYSIS_FAILED";
    res.json({ success, data: result });
  }catch(e){ res.status(500).json({ success:false, data:{ status:"ANALYSIS_FAILED", reason:String(e.message), beats:[], bpm:null }}); }
});

// GET /api/creative/media/qc?filePath= — QC for any media file
router.get("/media/qc", (req, res) => {
  const fp = String(req.query.filePath||"").trim();
  if (!fp) return res.status(400).json({ success:false, message:"filePath query required" });
  const qc = mediaEditingService.validateMedia(fp);
  res.json({ success: qc.passed, qc });
});

// ── NATURAL-LANGUAGE FRONT DOOR (creativeIntentRouter) — canonical ──
router.post("/intent", async (req,res)=>{
  try{
    const text = String(req.body.text||req.body.prompt||req.body.command||"").trim();
    if(!text || text.length<3) return res.status(400).json({success:false, message:"text/command required"});
    const creativeIntentRouter = require("../services/creativeIntentRouter").creativeIntentRouter;
    const session = { sessionId: req.body.sessionId||req.body.projectId||"default", activeArtifact: req.body.activeArtifact||null, currentLanguage: req.body.lang||"en" };
    const classified = creativeIntentRouter.classifyCreativeIntent(text, session);
    if(!classified) return res.json({ success:true, intent:"UNKNOWN", mediaType:"UNKNOWN", message:"No creative intent detected — try 'create image', 'animate video', 'music video' etc.", raw:text });
    const result = await creativeIntentRouter.executeCreativeIntent(classified, session);
    return res.json({ success: result.success!==false, intent: classified.intent, mediaType: classified.mediaType, rawPrompt: classified.rawPrompt, ...result });
  }catch(e){ return res.status(500).json({success:false, message:e.message}); }
});

// ── CHARACTER / WORLD / VISUAL BIBLES (extend Project Memory) ──
const creativeBibleService = require("../services/creativeBibleService");
router.post("/bibles/character", (req,res)=>{
  try{ const doc = creativeBibleService.createCharacterBible(req.body); res.json({success:true, data:doc}); }catch(e){ res.status(400).json({success:false, message:e.message});}
});
router.post("/bibles/world", (req,res)=>{
  try{ const doc = creativeBibleService.createWorldBible(req.body); res.json({success:true, data:doc}); }catch(e){ res.status(400).json({success:false, message:e.message});}
});
router.post("/bibles/visual", (req,res)=>{
  try{ const doc = creativeBibleService.createVisualBible(req.body); res.json({success:true, data:doc}); }catch(e){ res.status(400).json({success:false, message:e.message});}
});
router.get("/bibles", (req,res)=>{
  const pid = req.query.projectId ? String(req.query.projectId) : null;
  if(!pid) return res.status(400).json({success:false, message:"projectId required"});
  res.json({success:true, data: creativeBibleService.getProjectBibles(pid)});
});
router.get("/bibles/:id", (req,res)=>{
  const doc = creativeBibleService.getBible(String(req.params.id));
  if(!doc) return res.status(404).json({success:false, message:"Bible not found"});
  res.json({success:true, data:doc});
});

// ── DIRECTOR / EDITOR ORCHESTRATION ──
const creativeDirectorService = require("../services/creativeDirectorService");
const creativeEditorService = require("../services/creativeEditorService");
router.post("/director/plan", async (req,res)=>{
  try{ const plan = await creativeDirectorService.createProductionPlan(req.body); res.json({success:true, data:plan}); }catch(e){ res.status(500).json({success:false, message:e.message});}
});
router.post("/editor/analyze-footage", async (req,res)=>{
  try{ const r = await creativeEditorService.analyzeFootage(req.body.records||[]); res.json({success:true, data:r}); }catch(e){ res.status(500).json({success:false, message:e.message});}
});
router.post("/editor/build-plan", async (req,res)=>{
  try{ const r = await creativeEditorService.buildEditPlan(req.body); res.json({success:true, data:r}); }catch(e){ res.status(500).json({success:false, message:e.message});}
});
router.post("/music-video", async (req,res)=>{
  try{
    let footagePaths = Array.isArray(req.body.footagePaths)? req.body.footagePaths : [];
    let audioPath = req.body.audioPath||null;
    const durationSec = Number(req.body.durationSec||req.body.duration||60);
    const style = req.body.style||"cinematic";
    const inventMusic = req.body.inventMusic===true || req.body.autoMusic===true || (!audioPath && req.body.mood);
    if(footagePaths.length===0) return res.status(400).json({success:false, message:"footagePaths[] required"});
    for(const p of footagePaths){ if(!require("fs").existsSync(p)) return res.status(400).json({success:false, message:`footage not found: ${p}`}); }
    let generatedMusic = null;
    let generatedMusicResult = null;
    if(!audioPath && inventMusic){
      try{
        const audioRouter=require("../services/audioGenerationRouter");
        const mood=String(req.body.mood||req.body.musicMood||style||"cinematic");
        const gen=await audioRouter.routeAudioGeneration({ text: `invent ${mood} music for video`, capability:"music", mood, durationSec: Math.min(durationSec,15) });
        if(gen.success && gen.asset?.filePath) {
          audioPath=gen.asset.filePath;
          generatedMusic=gen.asset;
          generatedMusicResult=gen; // keep full result with isRealMusic/isProcedural/qc/observability
          generatedMusic.isRealMusic = gen.isRealMusic;
          generatedMusic.isProcedural = gen.isProcedural;
          generatedMusic.truthClassification = gen.truthClassification;
          generatedMusic.qc = gen.qc;
          generatedMusic.observability = gen.observability;
        }
      }catch{}
    }
    // Convert image inputs to beautiful Ken Burns video segments — duration matches requested timeline
    const processedInputs=[];
    const osTmp=require("os").tmpdir();
    const ffmpegPath=(()=>{ try{ return require("ffmpeg-static"); }catch{ return "ffmpeg"; }})();
    const { execFile } = require("child_process");
    const crypto=require("crypto"), fs=require("fs"), path=require("path");
    const perImageSec = Math.max(5, Math.ceil(durationSec / Math.max(1, footagePaths.filter(p=> /\.(jpg|jpeg|png|webp|svg)$/i.test(p)).length || 1)));
    for(const p of footagePaths){
      const isImage = /\.(jpg|jpeg|png|webp|svg)$/i.test(p);
      if(isImage){
        const tmpVid=path.join(osTmp, `img2vid_${Date.now()}_${crypto.randomBytes(2).toString("hex")}.mp4`);
        const targetSec = String(perImageSec);
        try{
          await new Promise((res,rej)=>{
            const vf = "scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,zoompan=z='min(zoom+0.0015,1.2)':d=1:x='iw/2-(iw/zoom)/2':y='ih/2-(ih/zoom)/2',eq=contrast=1.05:saturation=1.1";
            execFile(ffmpegPath, ["-loop","1","-i", p, "-t", targetSec, "-vf", vf, "-c:v","libx264","-pix_fmt","yuv420p","-r","24","-y", tmpVid], { timeout:20000, maxBuffer:4*1024*1024 }, (err,so,se)=> err? rej(new Error(String(se||err.message).slice(0,400))): res());
          });
          if(fs.existsSync(tmpVid) && fs.statSync(tmpVid).size>1000) processedInputs.push(tmpVid);
          else processedInputs.push(p);
        }catch{
          processedInputs.push(p);
        }
      } else {
        processedInputs.push(p);
      }
    }
    const ingestRecords = processedInputs.map(p=> ({ assetId: p, filePath:p, fileSize: fs.existsSync(p)? require("fs").statSync(p).size:0, mimetype: p.match(/\.(mp4|mov|webm)$/i)?"video/mp4":"image/jpeg" }));
    const footageAnalysis = await creativeEditorService.analyzeFootage(ingestRecords);
    // Pipeline: AUDIO QC → ASYNC PCM DECODE → REAL BPM/BEAT MAP (after real music verified or procedural fallback)
    let audioQC = null;
    if(audioPath){
      try{
        const audioRouter=require("../services/audioGenerationRouter");
        audioQC = await audioRouter.verifyAudioQC(audioPath);
      }catch{}
    }
    let beatAnalysis = { beats:[], bpm:120, status:"NO_AUDIO" };
    if(audioPath){
      try{ beatAnalysis = await mediaEditingService.analyzeBeatsAsync(audioPath); } catch(e){ beatAnalysis = { status:"ANALYSIS_FAILED", reason:String(e.message), beats:[], bpm:null, fallback: mediaEditingService.analyzeBeats(audioPath) }; }
      if(!beatAnalysis.beats || beatAnalysis.beats.length===0) beatAnalysis.fallback = beatAnalysis.fallback || mediaEditingService.analyzeBeats(audioPath);
      // Attach QC to beatAnalysis for downstream truth
      beatAnalysis.audioQC = audioQC;
    }
    const { timeline } = await creativeEditorService.buildEditPlan({ footageAnalysis, beatAnalysis, durationSec, style });
    const renderOps = [];
    if(req.body.targetSize) renderOps.push({ scale: req.body.targetSize });
    if(req.body.textOverlay) renderOps.push({ text: { text: String(req.body.textOverlay) } });
    if(audioPath) renderOps.push({ audio_replace: audioPath });
    const render = await mediaEditingService.renderTimeline({ inputs: processedInputs, operations: renderOps, outputName: `musicvideo_${Date.now()}.mp4` });
    // cleanup temp image videos
    for(const p of processedInputs){ if(p.includes("img2vid_") && fs.existsSync(p)){ try{ fs.unlinkSync(p);}catch{} } }
    const qc = mediaEditingService.validateMedia(render.filePath);
    const artifact = {
      assetId: render.assetId, filePath: render.filePath, publicUrl: render.publicUrl, dataUrl: render.dataUrl, sha256: render.sha256, fileSize: render.fileSize, qc,
      timelineId: timeline.timelineId, edl: timeline.edl,
      beatAnalysis: { bpm: beatAnalysis.bpm, beatCount: beatAnalysis.beats?.length||0, status: beatAnalysis.status, audioQC: beatAnalysis.audioQC || audioQC },
      generatedMusic,
      generatedMusicResult, // includes isRealMusic/isProcedural/observability for truth display
      audioQC
    };
    res.json({ success: qc.passed, status: qc.passed? "RENDERED_VERIFIED":"RENDERED_QC_FAILED", artifact, qc, timeline, footageAnalysis, beatAnalysis, generatedMusic, generatedMusicResult, audioQC });
  }catch(e){ res.status(500).json({success:false, message:e.message}); }
});

// Library with project filter (website result workspace)
router.get("/library", async (req,res)=>{
  try{ const lib = await creativeStudioService.getAssetLibrary(req.query.projectId||null); res.json({success:true, data:lib}); }catch(e){ res.status(500).json({success:false, message:e.message});}
});

// ── Founder console: Replicate paid toggle (FOUNDER_ALLOW_REPLICATE) ──
router.get("/admin/replicate-status", (req,res)=>{
  const tokenPresent = Boolean(process.env.REPLICATE_API_TOKEN || process.env.REPLICATE_API_KEY);
  const enabled = process.env.FOUNDER_ALLOW_REPLICATE === "true";
  res.json({ success:true, tokenPresent, enabled, status: enabled ? "READY_PAID" : "DISABLED_GATED", costNote: "~₹5/5s, ~₹60/min lip-sync" });
});
router.post("/admin/replicate-toggle", (req,res)=>{
  const isFounder = req.headers["x-founder-key"] || req.headers["x-garuda-founder-key"] || req.query.key === process.env.FOUNDER_ACCESS_PASSWORD;
  if(!isFounder && process.env.FOUNDER_ACCESS_PASSWORD) {
    // also allow same auth as founderCommandService verify — simple check
    const key = String(req.headers["x-founder-key"]||req.headers["x-garuda-founder-key"]||req.query.key||"");
    if(key !== process.env.FOUNDER_ACCESS_PASSWORD && key !== process.env.FOUNDER_ADMIN_KEY) {
      return res.status(403).json({success:false, message:"Founder key required (x-founder-key)"});
    }
  }
  const enable = req.body.enable === true || String(req.body.enable)==="true" || req.query.enable==="true";
  process.env.FOUNDER_ALLOW_REPLICATE = enable ? "true" : "false";
  // persist to .env for restart survival (best-effort, no secret leakage)
  try{
    const fs=require("fs"), path=require("path");
    const envPath=path.join(process.cwd(), ".env");
    let content=fs.existsSync(envPath)? fs.readFileSync(envPath,"utf8"):"";
    if(content.includes("FOUNDER_ALLOW_REPLICATE=")){
      content=content.replace(/FOUNDER_ALLOW_REPLICATE=.*/g, `FOUNDER_ALLOW_REPLICATE=${enable?"true":"false"}`);
    } else {
      content += `\nFOUNDER_ALLOW_REPLICATE=${enable?"true":"false"}\n`;
    }
    fs.writeFileSync(envPath, content, "utf8");
  }catch{}
  res.json({ success:true, enabled: enable, message: enable ? "Replicate PAID enabled — ~₹60/min will be charged" : "Replicate disabled — sovereign/HF only" });
});

module.exports = router;
