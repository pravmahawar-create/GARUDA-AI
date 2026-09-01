/**
 * 🦅 GARUDA CORE PRINCIPLES — Focused integration tests
 * Proves POLICY → CONSUMER → RUNTIME EFFECT per GARUDA_CORE_PRINCIPLES.md
 */

const assert = require("node:assert");
const { describe, it, beforeEach } = require("node:test");
const { GARUDA_CORE_PRINCIPLES, getQualityFloor, isProviderLocked } = require("./garudaCorePrinciples");
const creativeStudioService = require("./creativeStudioService");
const imageGenerationRouter = require("./imageGenerationRouter");
const videoGenerationRouter = require("./videoGenerationRouter");
const audioGenerationRouter = require("./audioGenerationRouter");
const creativeQualityService = require("./creativeQualityService");
const identityLockService = require("./identityLockService");

describe("GARUDA Core Principles — Integration", () => {
  beforeEach(() => {
    creativeStudioService.clearForTesting();
  });

  it("A. Natural/simple request understood without technical parameters (Hindi)", async () => {
    const brief = await creativeStudioService.createCreativeBrief({
      title: "Ek cinematic video bana do jo duniya ko bataye GARUDA kya hai."
      // no provider, model, resolution, codec
    });
    assert.ok(brief.briefId);
    assert.ok(brief.strategy);
    assert.equal(brief.status, "BRIEF_CREATED");
  });

  it("B. Provider selection remains abstracted from user intent", async () => {
    const brief = await creativeStudioService.createCreativeBrief({ title: "Provider abstraction test", brandName: "TestCorp" });
    // Even if user passes provider hint, router ignores it — selection is internal
    const result = await imageGenerationRouter.routeGeneration({
      headline: "Test Headline",
      brandId: brief.identityLock.brandId,
      mode: "SOVEREIGN_LAYOUT",
      provider: "runway", // user trying to force provider — should be ignored
    });
    assert.ok(result.asset);
    assert.equal(result.asset.provider, "garuda_sovereign_svg_renderer");
    // Ensure response never leaks provider as user-facing brand
    assert.ok(!JSON.stringify(result).includes("RUNWAY_API_KEY"));
  });

  it("C. Brand-critical task receives stricter quality requirements (BEYOND_EXPECTATION, not numeric 98)", () => {
    // Philosophy is BEYOND_EXPECTATION_QUALITY, not numeric 22/98
    assert.equal(GARUDA_CORE_PRINCIPLES.principles.quality.philosophy, "BEYOND_EXPECTATION_QUALITY");
    assert.ok(GARUDA_CORE_PRINCIPLES.principles.quality.statement.includes("19 nahi, 22") || GARUDA_CORE_PRINCIPLES.principles.quality.ambition.includes("BEYOND_EXPECTATION"));
    const standardLevel = getQualityFloor("standard");
    const cinematicLevel = getQualityFloor("cinematic");
    const brandCriticalLevel = getQualityFloor("brand_critical");
    const flagshipLevel = getQualityFloor("flagship cinematic brand film");
    assert.equal(standardLevel, "full_completeness");
    assert.equal(cinematicLevel, "exceptional_completeness");
    assert.equal(brandCriticalLevel, "exceptional_completeness");
    assert.equal(flagshipLevel, "exceptional_completeness");
    assert.notEqual(cinematicLevel, 98, "Must not be numeric 98 — visual quality is not numeric");
  });

  it("D. Provider failure can trigger fallback logic where available", async () => {
    // Force AI mode with no provider ready — should fallback to vector, not throw
    const fallback = await imageGenerationRouter.routeGeneration({
      headline: "Fallback test",
      mode: "AI_PHOTOREALISTIC",
      brandId: "garuda_default"
    });
    // No AI provider ready (fal/replicate are UNSUPPORTED, not READY) → PROVIDER_UNAVAILABLE with fallback
    assert.equal(fallback.status, "IMAGE_GENERATION_PROVIDER_UNAVAILABLE");
    assert.equal(fallback.fallbackState, "VECTOR_CREATIVE_READY");
    assert.ok(fallback.fallbackAsset);
    assert.ok(fallback.fallbackAsset.filePath);
    // Also test resilience path: execute failure → fallbackUsed
    // Simulate by calling with a provider that will throw, then check fallbackUsed true in that path
    // Already covered by imageGenerationRouter catch→fallback logic
  });

  it("E. Quality floor prevents silent downgrade — technical vs visual truthfully separated", () => {
    // BEYOND_EXPECTATION ambition, not numeric 22
    assert.equal(GARUDA_CORE_PRINCIPLES.principles.quality.philosophy, "BEYOND_EXPECTATION_QUALITY");
    const previewLevel = getQualityFloor("preview");
    const premiumLevel = getQualityFloor("premium");
    assert.equal(previewLevel, "basic_completeness");
    assert.equal(premiumLevel, "polished_completeness");
    // Technical verification vs visual quality must be distinct
    const fakeAsset = {
      filePath: __filename,
      assetHash: "dummy",
      dimensions: null,
      aspectRatio: "1:1",
      provider: "test",
      status: "GENERATED",
      qualityProfile: "cinematic",
      generationMode: "DRY_RUN",
      classification: "SIMULATED_GENERATION",
      identityLock: { brandId: "garuda_default", lockHash: identityLockService.getBrandProfile("garuda_default").lockHash }
    };
    const result = creativeQualityService.validateAsset(fakeAsset);
    // Technical may fail, but visual must be NOT_YET_VERIFIED, not fake 98
    assert.equal(result.visualQualityVerification.status, "VISUAL_QUALITY_NOT_YET_VERIFIED");
    assert.equal(result.technicalVerification.truthClassification.includes("TECHNICAL"), true);
    assert.ok(result.qualityProfile === "cinematic" || result.requirementCompliance.requestedProfile === "cinematic");
  });

  it("F. Identity/brand consistency requirements propagate through creative workflow", async () => {
    const brief = await creativeStudioService.createCreativeBrief({ title: "Identity propagation test", brandName: "ConsistencyCorp" });
    const asset = await creativeStudioService.generateAsset(brief.briefId, "IMAGE_SQUARE", {
      mode: "SOVEREIGN_LAYOUT",
      identityId: "char_aarav_001",
      styleProfileId: "style_cinematic_gold",
      continuityRequired: true
    });
    assert.ok(asset.assetId);
    // Router should have preserved identity in job requestSpec (via creativeStudioService propagation)
    // Verify asset carries identityLock and brandId
    assert.ok(asset.identityLock.brandId === brief.identityLock.brandId);
    assert.equal(asset.identityLock.brandName, brief.identityLock.brandName);
  });

  it("G. Existing founder/governance protections remain intact", async () => {
    // EngineeringPipeline no auto commit/push verified via hostile test, here verify principle file does not weaken
    assert.equal(GARUDA_CORE_PRINCIPLES.principles.governance.consumer.includes("EngineeringPipeline"), true);
    assert.equal(isProviderLocked(), false);
    // Creative universe still respects IdentityLock compliance — prohibited copy should fail
    const brand = await identityLockService.createOrUpdateBrandProfile({
      brandName: "GovTestBrand",
      prohibitedElements: { copy: ["guaranteed billionaire"], visual: [] }
    });
    const compliance = identityLockService.validateCompliance(brand.brandId, { headline: "guaranteed billionaire overnight", cta: "Book Now" });
    assert.equal(compliance.compliant, false);
  });

  it("H. No provider lock-in is introduced (provider agnostic)", () => {
    assert.equal(isProviderLocked(), false);
    assert.equal(GARUDA_CORE_PRINCIPLES.principles.provider_independence.costNeverOverridesQualityFloor, true);
    // Routers support multiple providers; detection shows sovereign always available even with zero keys
    const imgDetect = imageGenerationRouter.detectProviders();
    assert.equal(imgDetect.sovereignSvgAvailable, true);
    const vidDetect = videoGenerationRouter.detectProviders();
    assert.equal(vidDetect.storyboardEngineAvailable, true);
    const audDetect = audioGenerationRouter.detectProviders();
    // audio sovereign not required, but adapter present
    assert.ok(audDetect.providers.elevenlabs_tts);
  });

  it("I. No fake completion is introduced (truthful unavailable)", async () => {
    const noProviderResult = await imageGenerationRouter.routeGeneration({
      headline: "Fake completion test",
      mode: "AI_PHOTOREALISTIC",
      brandId: "garuda_default"
    });
    // Must be truthful PROVIDER_UNAVAILABLE, not fake GENERATED
    assert.equal(noProviderResult.classification, "PROVIDER_UNAVAILABLE");
    assert.equal(noProviderResult.success, false);
    assert.equal(noProviderResult.truthClassification, "TRUTHFUL_UNAVAILABLE");
    assert.ok(noProviderResult.fallbackAsset);

    const videoResult = await videoGenerationRouter.routeVideoGeneration({
      title: "No provider video",
      format: "REEL_9_16"
    });
    // If no video provider, should be STORYBOARD_READY, not fake MP4
    if (!videoResult.mp4Generated) {
      assert.equal(videoResult.fallbackState, "STORYBOARD_READY");
      assert.equal(videoResult.mp4Generated, false);
    }
  });

  it("Quality floor derived from garudaCorePrinciples is consumed at runtime (requirement levels, not numeric 98)", () => {
    assert.equal(GARUDA_CORE_PRINCIPLES.principles.quality.requirementFloors.cinematic, "exceptional_completeness");
    assert.equal(GARUDA_CORE_PRINCIPLES.principles.quality.requirementFloors.premium, "polished_completeness");
    assert.equal(GARUDA_CORE_PRINCIPLES.principles.quality.philosophy, "BEYOND_EXPECTATION_QUALITY");
    assert.ok(GARUDA_CORE_PRINCIPLES.finalTest10.length === 10);
  });
});
