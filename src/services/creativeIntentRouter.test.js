/**
 * 🦅 GARUDA Universal Creative Intent Router & Media Generation Universe Test Suite
 * Mandatory Verification for Section 20 & Section 21 Acceptance Tests.
 */

const fs = require("fs");
const path = require("path");
const test = require("node:test");
const assert = require("node:assert/strict");
const { creativeIntentRouter, CREATIVE_INTENTS } = require("./creativeIntentRouter");
const { conversationBrainService } = require("./conversationBrainService");
const { cinematicPresentationDirector } = require("./cinematicPresentationDirector");

test("🎬 Universal Creative Intent Router & Media Generation Universe Suite", async (t) => {

  await t.test("Regression Test 20: '20-second cinematic animated video scene' routes to TEXT_TO_VIDEO (NOT SVG Creative Artifact)", async () => {
    const sessionId = "test-video-regression-20";
    conversationBrainService.clearSession(sessionId);

    const input = "GARUDA, mujhe ek 20-second cinematic animated video scene practically generate karke dikhao. Sirf explain mat karo.";
    const res = await conversationBrainService.process(input, { sessionId });

    assert.equal(res.success, true);
    assert.equal(res.data.intent, CREATIVE_INTENTS.TEXT_TO_VIDEO, "Intent must be TEXT_TO_VIDEO, not generic CREATIVE_ARTIFACT");
    assert.equal(res.data.mediaType, "VIDEO");
    assert.ok(res.data.answer.includes("VIDEO GENERATION STATUS") || res.data.answer.includes("Storyboard"), "Must truthfully state video status and provide storyboard");
    assert.notEqual(res.data.suggestedDemo, "creative_artifact", "Must not downgrade to creative_artifact");
  });

  await t.test("Acceptance Test A: 'Ek image generate karo.' -> TEXT_TO_IMAGE with real disk file and SHA-256 seal", async () => {
    const sessionId = "test-acceptance-a";
    conversationBrainService.clearSession(sessionId);

    const res = await conversationBrainService.process("Ek image generate karo.", { sessionId });
    assert.equal(res.success, true);
    assert.equal(res.data.intent, CREATIVE_INTENTS.TEXT_TO_IMAGE);
    assert.equal(res.data.truthStatus, "VERIFIED");
    assert.ok(res.data.evidence, "Must contain physical evidence");
    assert.ok(res.data.evidence.sha256Hash, "Must contain SHA-256 evidence hash");
    assert.ok(res.data.evidence.filePath, "Must write physical file to disk");
    assert.ok(res.data.proofStage.canDownload, "Must support real download");
    assert.ok(res.data.proofStage.canShare, "Must support real share");
  });

  await t.test("Acceptance Test B: 'Ek cinematic video generate karo.' -> TEXT_TO_VIDEO with truthful status", async () => {
    const sessionId = "test-acceptance-b";
    conversationBrainService.clearSession(sessionId);

    const res = await conversationBrainService.process("Ek cinematic video generate karo.", { sessionId });
    assert.equal(res.success, true);
    assert.equal(res.data.intent, CREATIVE_INTENTS.TEXT_TO_VIDEO);
    assert.equal(res.data.mediaType, "VIDEO");
    assert.ok(res.data.answer.includes("VIDEO GENERATION STATUS") || res.data.answer.includes("Storyboard"));
  });

  await t.test("Acceptance Test C: 'Is image ko animate karo.' -> IMAGE_TO_VIDEO", async () => {
    const sessionId = "test-acceptance-c";
    conversationBrainService.clearSession(sessionId);

    const res = await conversationBrainService.process("Is image ko animate karo.", { sessionId });
    assert.equal(res.success, true);
    assert.equal(res.data.intent, CREATIVE_INTENTS.IMAGE_TO_VIDEO);
    assert.equal(res.data.mediaType, "VIDEO");
  });

  await t.test("Acceptance Test D: 'Is video ko 10 seconds extend karo.' -> VIDEO_EXTEND", async () => {
    const sessionId = "test-acceptance-d";
    conversationBrainService.clearSession(sessionId);

    // Setup active video artifact
    const session = conversationBrainService.getSession(sessionId);
    session.activeArtifact = { id: "vid_123", type: "VIDEO", prompt: "Initial scene" };

    const res = await conversationBrainService.process("Is video ko 10 seconds extend karo.", { sessionId });
    assert.equal(res.success, true);
    assert.equal(res.data.intent, CREATIVE_INTENTS.VIDEO_EXTEND);
    assert.equal(res.data.mediaType, "VIDEO");
  });

  await t.test("Acceptance Test E: 'Is character ka 3D version banao.' -> CHARACTER_DESIGN in 3D", async () => {
    const sessionId = "test-acceptance-e";
    conversationBrainService.clearSession(sessionId);

    const res = await conversationBrainService.process("Is character ka 3D version banao.", { sessionId });
    assert.equal(res.success, true);
    assert.equal(res.data.intent, CREATIVE_INTENTS.CHARACTER_DESIGN);
    assert.equal(res.data.executionResult.artifact.dimension, "3D");
  });

  await t.test("Acceptance Test F: 'Is scene ko anime-inspired look do.' -> VIDEO_RESTYLE", async () => {
    const sessionId = "test-acceptance-f";
    conversationBrainService.clearSession(sessionId);

    const session = conversationBrainService.getSession(sessionId);
    session.activeArtifact = { id: "scene_99", type: "VIDEO", prompt: "City chase" };

    const res = await conversationBrainService.process("Is scene ko anime-inspired look do.", { sessionId });
    assert.equal(res.success, true);
    assert.equal(res.data.intent, CREATIVE_INTENTS.VIDEO_RESTYLE);
  });

  await t.test("Acceptance Test G: 'Isko cinematic realistic look do.' -> VIDEO_RESTYLE", async () => {
    const sessionId = "test-acceptance-g";
    conversationBrainService.clearSession(sessionId);

    const session = conversationBrainService.getSession(sessionId);
    session.activeArtifact = { id: "scene_101", type: "VIDEO", prompt: "Mountain flight" };

    const res = await conversationBrainService.process("Isko cinematic realistic look do.", { sessionId });
    assert.equal(res.success, true);
    assert.equal(res.data.intent, CREATIVE_INTENTS.VIDEO_RESTYLE);
  });

  await t.test("Acceptance Test H: 'Is image ka background change karo.' -> IMAGE_EDIT", async () => {
    const sessionId = "test-acceptance-h";
    conversationBrainService.clearSession(sessionId);

    const session = conversationBrainService.getSession(sessionId);
    session.activeArtifact = { id: "img_55", type: "IMAGE", prompt: "Warrior portrait" };

    const res = await conversationBrainService.process("Is image ka background change karo.", { sessionId });
    assert.equal(res.success, true);
    assert.equal(res.data.intent, CREATIVE_INTENTS.IMAGE_EDIT);
    assert.equal(res.data.mediaType, "IMAGE");
  });

  await t.test("Acceptance Test I: 'Is video ka Hindi version banao.' -> VIDEO_EDIT / Localization", async () => {
    const sessionId = "test-acceptance-i";
    conversationBrainService.clearSession(sessionId);

    const session = conversationBrainService.getSession(sessionId);
    session.activeArtifact = { id: "vid_88", type: "VIDEO", prompt: "Product walkthrough" };

    const res = await conversationBrainService.process("Is video ka Hindi version banao.", { sessionId });
    assert.equal(res.success, true);
    assert.equal(res.data.intent, CREATIVE_INTENTS.VIDEO_EDIT);
  });

  await t.test("Acceptance Test J: 'Ab isko download karna hai.' -> DOWNLOAD_MEDIA returns real download link", async () => {
    const sessionId = "test-acceptance-j";
    conversationBrainService.clearSession(sessionId);

    // 1. Generate image first
    await conversationBrainService.process("Ek image generate karo.", { sessionId });

    // 2. Request download
    const res = await conversationBrainService.process("Ab isko download karna hai.", { sessionId });
    assert.equal(res.success, true);
    assert.equal(res.data.intent, CREATIVE_INTENTS.DOWNLOAD_MEDIA);
    assert.ok(res.data.answer.includes("DOWNLOAD READY"));
    assert.ok(res.data.executionResult.downloadUrl.includes("/download"));
  });

  await t.test("Acceptance Test K: 'Isko share karo.' -> SHARE_MEDIA returns shareable URL and provenance", async () => {
    const sessionId = "test-acceptance-k";
    conversationBrainService.clearSession(sessionId);

    // 1. Generate image first
    await conversationBrainService.process("Ek image generate karo.", { sessionId });

    // 2. Request share
    const res = await conversationBrainService.process("Isko share karo.", { sessionId });
    assert.equal(res.success, true);
    assert.equal(res.data.intent, CREATIVE_INTENTS.SHARE_MEDIA);
    assert.ok(res.data.answer.includes("SHAREABLE"));
    assert.ok(res.data.executionResult.shareUrl);
  });

  await t.test("Acceptance Test L: 'Isme hero ka outfit change karo.' -> IMAGE_EDIT with outfit modifier", async () => {
    const sessionId = "test-acceptance-l";
    conversationBrainService.clearSession(sessionId);

    const session = conversationBrainService.getSession(sessionId);
    session.activeArtifact = { id: "img_99", type: "IMAGE", prompt: "Guardian character" };

    const res = await conversationBrainService.process("Isme hero ka outfit change karo.", { sessionId });
    assert.equal(res.success, true);
    assert.equal(res.data.intent, CREATIVE_INTENTS.IMAGE_EDIT);
  });

  await t.test("Acceptance Test M: '30-minute animated movie banana hai.' -> FULL_MOVIE_PRODUCTION_PLAN", async () => {
    const sessionId = "test-acceptance-m";
    conversationBrainService.clearSession(sessionId);

    const res = await conversationBrainService.process("30-minute animated movie banana hai.", { sessionId });
    assert.equal(res.success, true);
    assert.equal(res.data.intent, CREATIVE_INTENTS.FULL_MOVIE_PRODUCTION_PLAN);
    assert.ok(res.data.answer.includes("30-MINUTE ANIMATED MOVIE PRODUCTION PIPELINE") || res.data.answer.includes("PIPELINE"));
    assert.ok(res.data.evidence.planId);
  });

  await t.test("IP Protection Rule: Asking for 'Disney style' returns descriptive aesthetic without false trademark replication claims", async () => {
    const sessionId = "test-ip-safety";
    conversationBrainService.clearSession(sessionId);

    const res = await conversationBrainService.process("Create an image of a cyber bird in Disney style", { sessionId });
    assert.equal(res.success, true);
    assert.ok(res.data.answer.includes("feature animation") || res.data.answer.includes("aesthetic"));
  });

  await t.test("Veo 3.1 Provider Configuration: detectProviders reports gemini_veo with valid models and durations", async () => {
    const videoRouter = require("./videoGenerationRouter");
    const detection = videoRouter.detectProviders();
    assert.ok(detection.providers.gemini_veo, "Must include gemini_veo provider");
    assert.equal(detection.providers.gemini_veo.defaultModel, "veo-3.1-generate-preview");
    assert.deepEqual(detection.providers.gemini_veo.durations, [4, 6, 8]);
    assert.equal(detection.providers.gemini_veo.configured, true);
  });

  await t.test("Veo 3.1 Intent Routing Variants (Section 10)", async () => {
    const session = {
      activeArtifact: { id: "asset_garuda_1788374991807", type: "IMAGE", filePath: "data/creative-assets/asset_garuda_1788374991807.jpg" }
    };

    const variants = [
      "Animate this image into an 8 second cinematic video.",
      "Is image ko cinematic video mein animate karo.",
      "Turn this image into a cinematic video.",
      "Make this picture move.",
      "Create an 8 second movie scene from this image."
    ];

    for (const v of variants) {
      const classified = creativeIntentRouter.classifyCreativeIntent(v, session);
      assert.ok(classified, `Variant should classify: ${v}`);
      assert.equal(classified.intent, CREATIVE_INTENTS.IMAGE_TO_VIDEO, `Variant must be IMAGE_TO_VIDEO: ${v}`);
      assert.equal(classified.mediaType, "VIDEO");
    }
  });

  await t.test("Veo 3.1 Multi-Turn Conversation Context (Section 11)", async () => {
    const sessionId = "test-veo-multiturn";
    conversationBrainService.clearSession(sessionId);
    const session = conversationBrainService.getSession(sessionId);
    session.activeArtifact = { id: "asset_garuda_1788374991807", type: "IMAGE", filePath: "data/creative-assets/asset_garuda_1788374991807.jpg" };

    // Turn 1: "Ye image animate karo."
    const turn1 = creativeIntentRouter.classifyCreativeIntent("Ye image animate karo.", session);
    assert.equal(turn1.intent, CREATIVE_INTENTS.IMAGE_TO_VIDEO);

    // Turn 2: "8 second ka."
    const turn2 = creativeIntentRouter.classifyCreativeIntent("8 second ka.", session);
    const creativeSession = creativeIntentRouter.getCreativeSession(sessionId);
    assert.equal(creativeSession.durationSeconds, 8);

    // Turn 3: "Cinematic rakho."
    const turn3 = creativeIntentRouter.classifyCreativeIntent("Cinematic rakho.", session);
    assert.equal(creativeSession.visualStyle, "cinematic");

    // Turn 4: "Veo use karo."
    const turn4 = creativeIntentRouter.classifyCreativeIntent("Veo use karo.", session);
    assert.equal(creativeSession.providerRequested, "gemini_veo");
    assert.equal(creativeSession.model, "veo-3.1-generate-preview");
  });

  await t.test("Veo 3.1 Artifact Lineage & Validation Registration: Rejects dummy 16-byte buffer", async () => {
    const videoRouter = require("./videoGenerationRouter");
    const fakeBuffer = Buffer.from("00000018667479706d70343200000000", "hex"); // Minimal dummy mp4 signature
    await assert.rejects(
      async () => {
        await videoRouter.validateAndRegisterVideoArtifact({
          videoBuffer: fakeBuffer,
          sourceImageArtifactId: "asset_garuda_1788374991807",
          prompt: "Cinematic soaring flight above futuristic Indian megacity",
          model: "veo-3.1-generate-preview",
          provider: "gemini_veo",
          durationSeconds: 8,
          aspectRatio: "16:9"
        });
      },
      /Video payload validation failed/
    );
  });

  await t.test("Hugging Face Video Provider Configuration: detectProviders reports huggingface_video", async () => {
    const videoRouter = require("./videoGenerationRouter");
    const detection = videoRouter.detectProviders();
    assert.ok(detection.providers.huggingface_video, "Must include huggingface_video provider");
    assert.equal(detection.providers.huggingface_video.defaultModel, "Lightricks/LTX-Video");
    assert.ok(detection.providers.huggingface_video.supportedModels.includes("Lightricks/LTX-Video"));
    assert.equal(detection.providers.huggingface_video.configured, true);
  });

  await t.test("Hugging Face Video Intent Routing & Multi-Turn Context (Section 11)", async () => {
    const sessionId = "test-hf-multiturn";
    conversationBrainService.clearSession(sessionId);
    const session = conversationBrainService.getSession(sessionId);
    session.activeArtifact = { id: "asset_garuda_1788374991807", type: "IMAGE", filePath: "data/creative-assets/asset_garuda_1788374991807.jpg" };

    // Turn 1: "Ye image animate karo."
    const turn1 = creativeIntentRouter.classifyCreativeIntent("Ye image animate karo.", session);
    assert.equal(turn1.intent, CREATIVE_INTENTS.IMAGE_TO_VIDEO);

    // Turn 2: "8 second ka."
    const turn2 = creativeIntentRouter.classifyCreativeIntent("8 second ka.", session);
    const creativeSession = creativeIntentRouter.getCreativeSession(sessionId);
    assert.equal(creativeSession.durationSeconds, 8);

    // Turn 3: "Cinematic rakho."
    const turn3 = creativeIntentRouter.classifyCreativeIntent("Cinematic rakho.", session);
    assert.equal(creativeSession.visualStyle, "cinematic");

    // Turn 4: "Hugging Face use karo."
    const turn4 = creativeIntentRouter.classifyCreativeIntent("Hugging Face use karo.", session);
    assert.equal(creativeSession.providerRequested, "huggingface_video");
    assert.equal(creativeSession.model, "Lightricks/LTX-Video");
  });

  await t.test("Hugging Face Artifact Lineage & Validation Registration: Rejects dummy 16-byte buffer", async () => {
    const videoRouter = require("./videoGenerationRouter");
    const fakeBuffer = Buffer.from("00000018667479706d70343200000000", "hex");
    await assert.rejects(
      async () => {
        await videoRouter.validateAndRegisterVideoArtifact({
          videoBuffer: fakeBuffer,
          sourceImageArtifactId: "asset_garuda_1788374991807",
          prompt: "Cinematic soaring flight above futuristic Indian megacity",
          model: "Lightricks/LTX-Video",
          provider: "huggingface_video",
          durationSeconds: 8,
          aspectRatio: "16:9"
        });
      },
      /Video payload validation failed/
    );
  });

  await t.test("Fal.ai Video Provider Configuration: detectProviders reports fal_video", async () => {
    const videoRouter = require("./videoGenerationRouter");
    const detection = videoRouter.detectProviders();
    assert.ok(detection.providers.fal_video, "Must include fal_video provider");
    assert.equal(detection.providers.fal_video.defaultModel, "fal-ai/ltx-video/image-to-video");
    assert.ok(detection.providers.fal_video.supportedModels.includes("fal-ai/ltx-video/image-to-video"));
    assert.equal(detection.providers.fal_video.configured, true);
  });

  await t.test("Fal.ai Video Intent Routing & Multi-Turn Context", async () => {
    const sessionId = "test-fal-multiturn";
    conversationBrainService.clearSession(sessionId);
    const session = conversationBrainService.getSession(sessionId);
    session.activeArtifact = { id: "asset_garuda_1788374991807", type: "IMAGE", filePath: "data/creative-assets/asset_garuda_1788374991807.jpg" };

    // Turn 1: "Ye image animate karo."
    const turn1 = creativeIntentRouter.classifyCreativeIntent("Ye image animate karo.", session);
    assert.equal(turn1.intent, CREATIVE_INTENTS.IMAGE_TO_VIDEO);

    // Turn 2: "8 second ka."
    const turn2 = creativeIntentRouter.classifyCreativeIntent("8 second ka.", session);
    const creativeSession = creativeIntentRouter.getCreativeSession(sessionId);
    assert.equal(creativeSession.durationSeconds, 8);

    // Turn 3: "Cinematic rakho."
    const turn3 = creativeIntentRouter.classifyCreativeIntent("Cinematic rakho.", session);
    assert.equal(creativeSession.visualStyle, "cinematic");

    // Turn 4: "Fal use karo."
    const turn4 = creativeIntentRouter.classifyCreativeIntent("Fal use karo.", session);
    assert.equal(creativeSession.providerRequested, "fal_video");
    assert.equal(creativeSession.model, "fal-ai/ltx-video/image-to-video");
  });

  await t.test("Fal.ai Artifact Lineage & Validation Registration: Rejects dummy 16-byte buffer", async () => {
    const videoRouter = require("./videoGenerationRouter");
    const fakeBuffer = Buffer.from("00000018667479706d70343200000000", "hex");
    await assert.rejects(
      async () => {
        await videoRouter.validateAndRegisterVideoArtifact({
          videoBuffer: fakeBuffer,
          sourceImageArtifactId: "asset_garuda_1788374991807",
          prompt: "Cinematic soaring flight above futuristic Indian megacity",
          model: "fal-ai/ltx-video/image-to-video",
          provider: "fal_video",
          durationSeconds: 5,
          aspectRatio: "16:9"
        });
      },
      /Video payload validation failed/
    );
  });

  await t.test("Local 2.5D Motion Provider Configuration: detectProviders reports local_25d_motion", async () => {
    const videoRouter = require("./videoGenerationRouter");
    const detection = videoRouter.detectProviders();
    assert.ok(detection.providers.local_25d_motion, "Must include local_25d_motion provider");
    assert.equal(detection.providers.local_25d_motion.configured, true);
    assert.equal(detection.providers.local_25d_motion.defaultModel, "GARUDA Sovereign 2.5D Cinematic Motion Engine");
  });

  await t.test("Local 2.5D Motion Intent Routing & Multi-Turn Context", async () => {
    const sessionId = "test-local25d-multiturn";
    conversationBrainService.clearSession(sessionId);
    const session = conversationBrainService.getSession(sessionId);
    session.activeArtifact = { id: "asset_garuda_1788374991807", type: "IMAGE", filePath: "data/creative-assets/asset_garuda_1788374991807.jpg" };

    const turn = creativeIntentRouter.classifyCreativeIntent("Is image ko local 2.5d video bana do.", session);
    assert.equal(turn.intent, CREATIVE_INTENTS.LOCAL_25D_CINEMATIC_MOTION);
    assert.equal(turn.providerRequested, "local_25d_motion");
    assert.equal(turn.model, "GARUDA Sovereign 2.5D Cinematic Motion Engine");
  });

  await t.test("Local 2.5D Motion Real Execution & MP4 Container Verification", async () => {
    const videoRouter = require("./videoGenerationRouter");
    const res = await videoRouter.routeVideoGeneration({
      prompt: "Cinematic slow push-in over futuristic guardian",
      durationSeconds: 3,
      provider: "local_25d_motion",
      imagePath: path.join(process.cwd(), "data", "creative-assets", "asset_garuda_1788374991807.jpg"),
      sourceImageArtifactId: "asset_garuda_1788374991807"
    });

    assert.equal(res.success, true);
    assert.equal(res.status, "READY");
    assert.equal(res.provider, "local_25d_motion");
    assert.equal(res.truthClassification, "LOCAL_25D_CINEMATIC_MOTION_VERIFIED");
    assert.ok(res.asset && res.asset.filePath);
    assert.ok(fs.existsSync(res.asset.filePath));
    assert.ok(res.asset.fileSizeBytes > 1000);
    assert.ok(res.asset.sha256Hash);
    assert.equal(res.asset.sourceImageArtifactId, "asset_garuda_1788374991807");
  });

  await t.test("Router Separation: 'image ko cinematic motion do' routes to LOCAL_25D_CINEMATIC_MOTION", async () => {
    const session = { activeArtifact: { id: "asset_garuda_1788374991807", type: "IMAGE" } };
    const res = creativeIntentRouter.classifyCreativeIntent("image ko cinematic motion do", session);
    assert.equal(res.intent, CREATIVE_INTENTS.LOCAL_25D_CINEMATIC_MOTION);
    assert.equal(res.providerRequested, "local_25d_motion");
    assert.equal(res.model, "GARUDA Sovereign 2.5D Cinematic Motion Engine");
  });

  await t.test("Router Separation: 'image se AI video banao' routes to REAL_AI_VIDEO_GENERATION", async () => {
    const session = { activeArtifact: { id: "asset_garuda_1788374991807", type: "IMAGE" } };
    const res = creativeIntentRouter.classifyCreativeIntent("image se real AI video banao", session);
    assert.equal(res.intent, CREATIVE_INTENTS.REAL_AI_VIDEO_GENERATION);
    assert.notEqual(res.providerRequested, "local_25d_motion");
  });

  await t.test("Temporal Motion Verifier: extracts representative frames and validates motion delta", async () => {
    const verifier = require("./temporalMotionVerifier");
    const testVideoPath = path.join(process.cwd(), "data", "creative-assets", "vid_local25d_1788380044790_47dc.mp4");
    if (fs.existsSync(testVideoPath)) {
      const audit = await verifier.verifyVideo(testVideoPath);
      assert.equal(audit.verified, true);
      assert.equal(audit.containerSignature, "ftyp");
      assert.ok(audit.temporalAnalysis.hasTemporalMotion);
      assert.ok(audit.temporalAnalysis.startToEndScore > 0.05);
    }
  });

  await t.test("End-to-End Cinematic Presentation Director turn handles visual creation cleanly", async () => {
    const sessionId = "test-cinematic-creative";
    const res = await cinematicPresentationDirector.directTurn("Ek cinematic video generate karo.", { sessionId });
    assert.equal(res.success, true);
    assert.equal(res.data.intent, CREATIVE_INTENTS.TEXT_TO_VIDEO);
  });

  await t.test("P0-4 Validator: validates legitimate local 2.5D MP4 (vid_local25d_1788380044790_47dc) as VERIFIED", async () => {
    const videoRouter = require("./videoGenerationRouter");
    const legitimatePath = path.join(process.cwd(), "data", "creative-assets", "vid_local25d_1788380044790_47dc.mp4");
    if (fs.existsSync(legitimatePath)) {
      const realBuf = fs.readFileSync(legitimatePath);
      const registered = await videoRouter.validateAndRegisterVideoArtifact({
        videoBuffer: realBuf,
        sourceImageArtifactId: "asset_garuda_1788374991807",
        prompt: "Local 2.5D Cinematic Motion Verified Test",
        model: "GARUDA Sovereign 2.5D Cinematic Motion Engine",
        provider: "local_25d_motion",
        durationSeconds: 5,
        aspectRatio: "16:9"
      });
      assert.equal(registered.status, "VERIFIED");
      assert.ok(registered.fileSizeBytes > 1000000);
      assert.ok(registered.sha256Hash);
    }
  });

});
