const assert = require("node:assert");
const { describe, it, beforeEach, afterEach } = require("node:test");
const garudaCommandRouter = require("./garudaCommandRouter");
const livingArtifactService = require("./livingArtifactService");
const creativeStudioService = require("./creativeStudioService");

describe("Creative Continuation — Living Artifact Lineage", () => {
  beforeEach(() => {
    creativeStudioService.clearForTesting();
    livingArtifactService.clearForTesting();
  });
  afterEach(() => {
    livingArtifactService.clearForTesting();
  });

  it("1. A creative request creates an initial artifact, then 'make it more cinematic' resolves and continues it", async () => {
    const initial = await garudaCommandRouter.dispatchCommand("Create a premium cinematic poster for GARUDA", {});
    assert.equal(initial.command, "creative");
    assert.ok(initial.livingArtifactId);
    const firstArtifact = livingArtifactService.getLivingArtifactContext(initial.livingArtifactId);
    assert.ok(firstArtifact);

    const cont = await garudaCommandRouter.dispatchCommand("Make it more cinematic", {});
    assert.equal(cont.command, "creative_continuation");
    assert.equal(cont.success, true);
    assert.ok(cont.livingArtifactId);
    assert.notEqual(cont.livingArtifactId, initial.livingArtifactId);
  });

  it("2. The continuation uses the previous artifact context", async () => {
    const initial = await garudaCommandRouter.dispatchCommand("Create a premium cinematic poster for my product Titan", {});
    const cont = await garudaCommandRouter.dispatchCommand("Make it darker", {});
    assert.equal(cont.command, "creative_continuation");
    assert.equal(cont.sourceArtifactId, initial.livingArtifactId);
    const newArtifact = livingArtifactService.getLivingArtifactContext(cont.livingArtifactId);
    assert.ok(newArtifact.purpose.includes("Make it darker") || newArtifact.purpose.includes("darker"));
    assert.ok(newArtifact.sourceGoal.continuationOf === initial.livingArtifactId || newArtifact.sourceArtifactId === initial.livingArtifactId);
  });

  it("3. The new artifact preserves lineage/reference to the original artifact", async () => {
    const first = await garudaCommandRouter.dispatchCommand("Create a premium cinematic poster for GARUDA", {});
    const second = await garudaCommandRouter.dispatchCommand("Make it more cinematic", {});
    const third = await garudaCommandRouter.dispatchCommand("Change the color theme to luxury gold", {});
    const thirdArtifact = livingArtifactService.getLivingArtifactContext(third.livingArtifactId);
    assert.equal(thirdArtifact.sourceArtifactId, second.livingArtifactId);
    assert.equal(thirdArtifact.rootArtifactId, first.livingArtifactId);
    // Second's root should be first
    const secondArtifact = livingArtifactService.getLivingArtifactContext(second.livingArtifactId);
    assert.equal(secondArtifact.rootArtifactId, first.livingArtifactId);
  });

  it("4. 'Make an Instagram version' produces a continuation rather than a completely contextless request", async () => {
    await garudaCommandRouter.dispatchCommand("Create a premium cinematic poster for GARUDA", {});
    const cont = await garudaCommandRouter.dispatchCommand("Make an Instagram version", {});
    assert.equal(cont.command, "creative_continuation");
    assert.ok(cont.sourceArtifactId);
    // Should have instagram platform hint preserved in new brief/asset
    const newArtifact = livingArtifactService.getLivingArtifactContext(cont.livingArtifactId);
    assert.ok(newArtifact.purpose.toLowerCase().includes("instagram") || String(newArtifact.sourceGoal.rawGoal).toLowerCase().includes("instagram"));
  });

  it("5. Hindi/Hinglish continuation phrasing works for at least one realistic example", async () => {
    await garudaCommandRouter.dispatchCommand("Create a premium cinematic poster for GARUDA", {});
    const cont = await garudaCommandRouter.dispatchCommand("ise aur cinematic banao", {});
    assert.equal(cont.command, "creative_continuation");
    assert.equal(cont.success, true);
    assert.ok(cont.livingArtifactId);
  });

  it("6. No previous artifact → safe clarification/fallback, no invented context", async () => {
    livingArtifactService.clearForTesting();
    const result = await garudaCommandRouter.dispatchCommand("Make it more cinematic", {});
    assert.equal(result.command, "creative_continuation");
    assert.equal(result.success, false);
    assert.equal(result.status, "CLARIFICATION_REQUIRED");
    assert.ok(result.message.includes("No previous creative found"));
    assert.equal(result.livingArtifactId, undefined);
  });

  it("7. Non-creative follow-up does not enter continuation path", async () => {
    await garudaCommandRouter.dispatchCommand("Create a premium cinematic poster for GARUDA", {});
    const beforeCount = livingArtifactService._store.size;
    const result = await garudaCommandRouter.dispatchCommand("What is the weather today?", {});
    assert.equal(result, null);
    const afterCount = livingArtifactService._store.size;
    assert.equal(beforeCount, afterCount, "No new artifact should be created for non-creative");
  });

  it("8. Original artifact is not overwritten", async () => {
    const first = await garudaCommandRouter.dispatchCommand("Create a premium cinematic poster for GARUDA", {});
    const firstId = first.livingArtifactId;
    const firstDocBefore = JSON.stringify(livingArtifactService.getLivingArtifactContext(firstId));
    await garudaCommandRouter.dispatchCommand("Make it darker", {});
    const firstDocAfter = JSON.stringify(livingArtifactService.getLivingArtifactContext(firstId));
    assert.equal(firstDocBefore, firstDocAfter, "Original artifact must not be overwritten");
    assert.notEqual(firstId, (await garudaCommandRouter.dispatchCommand("Make it more cinematic", {})).livingArtifactId);
  });

  it("9. DRY_RUN / SIMULATED_GENERATION / PREVIEW_READY truth model remains correct", async () => {
    const result = await garudaCommandRouter.dispatchCommand("Create a premium cinematic poster for GARUDA", {});
    assert.ok(["DRY_RUN",null].includes(result.generationMode) || result.generationMode === "DRY_RUN");
    assert.ok(["SIMULATED_GENERATION","VECTOR_CREATIVE"].includes(result.classification));
    assert.notEqual(result.classification, "REAL_AI_IMAGE");
    assert.ok(["PREVIEW_READY","GENERATED"].includes(result.status));
    assert.equal(result.visualQuality, "VISUAL_QUALITY_NOT_YET_VERIFIED");
    const cont = await garudaCommandRouter.dispatchCommand("Make it more cinematic", {});
    assert.ok(["SIMULATED_GENERATION","VECTOR_CREATIVE"].includes(cont.classification));
    assert.notEqual(cont.classification, "REAL_AI_IMAGE");
    assert.equal(cont.visualQuality, "VISUAL_QUALITY_NOT_YET_VERIFIED");
  });

  it("10. New artifact persistence failure does not falsely fail the creative continuation", async () => {
    await garudaCommandRouter.dispatchCommand("Create a premium cinematic poster for GARUDA", {});
    const original = livingArtifactService.createLivingArtifactContext;
    livingArtifactService.createLivingArtifactContext = () => { throw new Error("Simulated living artifact persistence failure"); };
    const result = await garudaCommandRouter.dispatchCommand("Make it more cinematic", {});
    livingArtifactService.createLivingArtifactContext = original;
    assert.equal(result.success, true, "Continuation should still succeed");
    assert.equal(result.livingArtifactStatus, "PERSISTENCE_FAILED");
    assert.ok(result.livingArtifactError.includes("Simulated living artifact persistence failure"));
    assert.ok(result.assetId);
    assert.ok(["PREVIEW_READY","GENERATED"].includes(result.status));
    assert.ok(["SIMULATED_GENERATION","VECTOR_CREATIVE"].includes(result.classification));
  });
});
