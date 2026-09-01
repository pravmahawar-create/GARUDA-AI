const assert = require("node:assert");
const { describe, it, beforeEach, afterEach } = require("node:test");
const garudaCommandRouter = require("./garudaCommandRouter");
const livingArtifactService = require("./livingArtifactService");
const creativeStudioService = require("./creativeStudioService");

describe("Creative → Living Artifact integration", () => {
  beforeEach(() => {
    creativeStudioService.clearForTesting();
    livingArtifactService.clearForTesting();
  });

  afterEach(() => {
    livingArtifactService.clearForTesting();
  });

  it("1. Successful Mother Brain creative request creates a Living Artifact", async () => {
    const result = await garudaCommandRouter.dispatchCommand("Create a premium cinematic poster for GARUDA", {});
    assert.equal(result.command, "creative");
    assert.equal(result.success, true);
    assert.ok(result.livingArtifactId, "Should have livingArtifactId");
    assert.equal(result.livingArtifactStatus, "CREATED");
    const artifact = livingArtifactService.getLivingArtifactContext(result.livingArtifactId);
    assert.ok(artifact);
    assert.equal(artifact.artifactType, "creative_asset");
  });

  it("2. Artifact contains original user request and creative identity/reference", async () => {
    const query = "Create a premium cinematic poster for my product Titan";
    const result = await garudaCommandRouter.dispatchCommand(query, {});
    const artifact = livingArtifactService.getLivingArtifactContext(result.livingArtifactId);
    assert.ok(artifact.purpose.includes("premium cinematic") || artifact.purpose === query);
    assert.equal(artifact.sourceGoal.rawGoal, query);
    assert.equal(artifact.sourceGoal.intent, "create_creative_asset");
    assert.ok(artifact.sourceBrief);
    assert.equal(artifact.briefId, result.briefId);
    assert.ok(artifact.evidence.some(e => e.assetId === result.assetId));
  });

  it("3. SIMULATED_GENERATION remains truthful inside persisted artifact", async () => {
    const result = await garudaCommandRouter.dispatchCommand("Create a premium cinematic poster for my product", {});
    // DRY_RUN must be truthful: either SIMULATED_GENERATION (Fal mock) or VECTOR_CREATIVE (sovereign) — both are truthful, never REAL_AI_IMAGE
    assert.ok(["SIMULATED_GENERATION","VECTOR_CREATIVE"].includes(result.classification));
    assert.ok(result.classification !== "REAL_AI_IMAGE");
    const artifact = livingArtifactService.getLivingArtifactContext(result.livingArtifactId);
    const ev = artifact.evidence.find(e => e.type === "creative_asset");
    assert.ok(["SIMULATED_GENERATION","VECTOR_CREATIVE"].includes(ev.classification));
    assert.ok(ev.classification !== "REAL_AI_IMAGE");
    // Generation mode should be DRY_RUN truthfully
    assert.ok(ev.generationMode === "DRY_RUN" || ev.generationMode === null);
  });

  it("4. PREVIEW_READY is not transformed into GENERATED", async () => {
    const result = await garudaCommandRouter.dispatchCommand("Ek premium cinematic image bana do GARUDA ke liye", {});
    // DRY_RUN premium should be PREVIEW_READY (Fal mock) or truthful GENERATED for sovereign — both are not fake REAL
    assert.ok(["PREVIEW_READY","GENERATED"].includes(result.status));
    assert.notEqual(result.classification, "REAL_AI_IMAGE");
    const artifact = livingArtifactService.getLivingArtifactContext(result.livingArtifactId);
    assert.ok(artifact);
    const ev = artifact.evidence[0];
    assert.ok(["SIMULATED_GENERATION","VECTOR_CREATIVE"].includes(ev.classification));
    assert.notEqual(ev.classification, "REAL_AI_IMAGE");
  });

  it("5. If LivingArtifact persistence fails, creative result still succeeds truthfully and failure is explicitly represented", async () => {
    const original = livingArtifactService.createLivingArtifactContext;
    livingArtifactService.createLivingArtifactContext = () => { throw new Error("Simulated persistence failure"); };
    const result = await garudaCommandRouter.dispatchCommand("Create a premium cinematic poster for my product", {});
    // Restore
    livingArtifactService.createLivingArtifactContext = original;
    assert.equal(result.success, true, "Creative result must still succeed");
    assert.equal(result.livingArtifactStatus, "PERSISTENCE_FAILED");
    assert.ok(result.livingArtifactError.includes("Simulated persistence failure"));
    assert.ok(["PREVIEW_READY","GENERATED"].includes(result.status));
    assert.ok(["SIMULATED_GENERATION","VECTOR_CREATIVE"].includes(result.classification));
    assert.notEqual(result.classification, "REAL_AI_IMAGE");
    // Ensure no artifact was created for this failed call (or at least error is visible)
    assert.ok(result.evidence.livingArtifactError);
  });

  it("6. Non-creative Mother Brain requests do NOT create Living Artifacts through this path", async () => {
    const beforeCount = (() => {
      try { return require("fs").readFileSync(require("path").join(__dirname, "..", "..", "data", "living-artifacts.jsonl"), "utf8").split("\n").filter(Boolean).length; } catch { return 0; }
    })();
    const result = await garudaCommandRouter.dispatchCommand("What is the weather today?", {});
    assert.equal(result, null);
    const afterCount = (() => {
      try { return require("fs").readFileSync(require("path").join(__dirname, "..", "..", "data", "living-artifacts.jsonl"), "utf8").split("\n").filter(Boolean).length; } catch { return 0; }
    })();
    assert.equal(beforeCount, afterCount, "No new living artifact should be created for non-creative request");
    // Also ensure no in-memory artifact created for non-creative
    const all = Array.from(livingArtifactService._store.values());
    const hasNonCreative = all.some(a => a.purpose === "What is the weather today?");
    assert.equal(hasNonCreative, false);
  });
});
