const assert = require("node:assert");
const { describe, it, beforeEach } = require("node:test");
const { understandGoal } = require("../../scripts/mother/goalEngine");
const garudaCommandRouter = require("./garudaCommandRouter");
const creativeStudioService = require("./creativeStudioService");

describe("Mother Brain → Creative Universe Routing (Phase D)", () => {
  beforeEach(() => {
    creativeStudioService.clearForTesting();
  });

  it("1. Natural-language creative request reaches CreativeStudioService via Mother Brain", async () => {
    const goal = understandGoal("Create a premium cinematic poster for my product");
    assert.equal(goal.intent, "create_creative_asset");
    assert.equal(goal.domain, "creative");
    assert.equal(goal.actionType, "creation");

    const cmd = garudaCommandRouter.detectCommand("Create a premium cinematic poster for my product");
    assert.ok(cmd);
    assert.equal(cmd.command, "creative");

    const result = await garudaCommandRouter.dispatchCommand("Create a premium cinematic poster for my product", {});
    assert.ok(result);
    assert.equal(result.command, "creative");
    assert.equal(result.success, true);
    assert.ok(result.assetId);
    assert.ok(result.asset);
  });

  it("2. Correct intent routes to Creative path — Hindi premium cinematic", async () => {
    const goal = understandGoal("Ek premium cinematic image bana do GARUDA ke liye");
    assert.equal(goal.intent, "create_creative_asset");
    assert.equal(goal.domain, "creative");

    const result = await garudaCommandRouter.dispatchCommand("Ek premium cinematic image bana do GARUDA ke liye", {});
    assert.equal(result.command, "creative");
    assert.equal(result.success, true);
    // DRY_RUN truthful: either PREVIEW_READY (Fal mock) or GENERATED with VECTOR_CREATIVE (sovereign) — both truthful, never REAL_AI_IMAGE
    assert.ok(["PREVIEW_READY","GENERATED"].includes(result.status));
    assert.notEqual(result.classification, "REAL_AI_IMAGE");
    assert.equal(result.visualQuality, "VISUAL_QUALITY_NOT_YET_VERIFIED");
  });

  it("3. Non-creative request does NOT enter Creative path", async () => {
    const goal = understandGoal("What is the weather today?");
    assert.notEqual(goal.intent, "create_creative_asset");

    const cmd = garudaCommandRouter.detectCommand("What is the weather today?");
    assert.equal(cmd, null);

    const result = await garudaCommandRouter.dispatchCommand("What is the weather today?", {});
    assert.equal(result, null);
  });

  it("4. Low-confidence/ambiguous request remains clarification or safe fallback", async () => {
    // Single word poster without premium/cinematic qualifier should not trigger creative (requires premium/cinematic context)
    const cmdAmbiguous = garudaCommandRouter.detectCommand("poster");
    // Our creative signal requires premium/cinematic qualifier, so single word should be null (safe fallback)
    assert.equal(cmdAmbiguous, null);

    const goalAmbiguous = understandGoal("poster");
    // Should not be creative intent
    assert.notEqual(goalAmbiguous.intent, "create_creative_asset");

    // Dispatch should return null → Mother will fallback to normal clarification/LLM, not creative
    const result = await garudaCommandRouter.dispatchCommand("poster", {});
    assert.equal(result, null);
  });

  it("5. DRY_RUN result preserves truthful generation status", async () => {
    const result = await garudaCommandRouter.dispatchCommand("Generate a luxury social media image", {});
    assert.equal(result.command, "creative");
    assert.equal(result.success, true);
    // Must never be presented as REAL_AI_IMAGE for DRY_RUN
    assert.notEqual(result.classification, "REAL_AI_IMAGE");
    assert.ok(["PREVIEW_READY","GENERATED"].includes(result.status));
    // Truthful: either simulated Fal or sovereign vector — both have visual not yet verified
    assert.equal(result.visualQuality, "VISUAL_QUALITY_NOT_YET_VERIFIED");
    assert.ok(["SIMULATED_DRY_RUN","PHYSICAL_DISK_VERIFIED"].includes(result.truthClassification) || result.truthClassification === "SIMULATED_DRY_RUN");
  });

  it("6. Existing Creative tests still pass — sovereign fallback intact", async () => {
    // Verify sovereign fallback still works via direct router
    const imageGenerationRouter = require("./imageGenerationRouter");
    const res = await imageGenerationRouter.routeGeneration({
      headline: "Sovereign test after Mother wiring",
      mode: "SOVEREIGN_LAYOUT",
      brandId: "garuda_default"
    });
    assert.equal(res.success, true);
    assert.equal(res.classification, "VECTOR_CREATIVE");
    assert.ok(res.asset.filePath);
  });
});
