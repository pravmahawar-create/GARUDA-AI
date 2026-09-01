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
    const scope = "test_scope_1_" + Date.now();
    const initial = await garudaCommandRouter.dispatchCommand("Create a premium cinematic poster for GARUDA", { projectId: scope });
    // Need to pass projectId via context for creation as well - dispatchCommand second param is context
    // Our dispatchCommand currently takes (message, context) where context is second arg, but we passed as first arg's second param? Actually dispatchCommand(message, context) where context is object with projectId
    // The test above passed {} as context, but we need to pass projectId via context correctly
    // Let's do via dispatchCommand with explicit projectId in context
    const initial2 = await garudaCommandRouter.dispatchCommand("Create a premium cinematic poster for GARUDA", { projectId: scope });
    // Use the second one for continuation
    const firstArtifact = livingArtifactService.getLivingArtifactContext(initial2.livingArtifactId);
    assert.ok(firstArtifact);

    const cont = await garudaCommandRouter.dispatchCommand("Make it more cinematic", { projectId: scope });
    assert.equal(cont.command, "creative_continuation");
    assert.equal(cont.success, true);
    assert.ok(cont.livingArtifactId);
    assert.notEqual(cont.livingArtifactId, initial2.livingArtifactId);
  });

  it("2. The continuation uses the previous artifact context", async () => {
    const scope = "test_scope_2_" + Date.now();
    const initial = await garudaCommandRouter.dispatchCommand("Create a premium cinematic poster for my product Titan", { projectId: scope });
    const cont = await garudaCommandRouter.dispatchCommand("Make it darker", { projectId: scope });
    assert.equal(cont.command, "creative_continuation");
    assert.equal(cont.sourceArtifactId, initial.livingArtifactId);
    const newArtifact = livingArtifactService.getLivingArtifactContext(cont.livingArtifactId);
    assert.ok(newArtifact.purpose.includes("Make it darker") || newArtifact.purpose.includes("darker"));
    assert.ok(newArtifact.sourceGoal.continuationOf === initial.livingArtifactId || newArtifact.sourceArtifactId === initial.livingArtifactId);
  });

  it("3. The new artifact preserves lineage/reference to the original artifact", async () => {
    const scope = "test_scope_3_" + Date.now();
    const first = await garudaCommandRouter.dispatchCommand("Create a premium cinematic poster for GARUDA", { projectId: scope });
    const second = await garudaCommandRouter.dispatchCommand("Make it more cinematic", { projectId: scope });
    const third = await garudaCommandRouter.dispatchCommand("Change the color theme to luxury gold", { projectId: scope });
    const thirdArtifact = livingArtifactService.getLivingArtifactContext(third.livingArtifactId);
    assert.equal(thirdArtifact.sourceArtifactId, second.livingArtifactId);
    assert.equal(thirdArtifact.rootArtifactId, first.livingArtifactId);
    const secondArtifact = livingArtifactService.getLivingArtifactContext(second.livingArtifactId);
    assert.equal(secondArtifact.rootArtifactId, first.livingArtifactId);
  });

  it("4. 'Make an Instagram version' produces a continuation rather than a completely contextless request", async () => {
    const scope = "test_scope_4_" + Date.now();
    await garudaCommandRouter.dispatchCommand("Create a premium cinematic poster for GARUDA", { projectId: scope });
    const cont = await garudaCommandRouter.dispatchCommand("Make an Instagram version", { projectId: scope });
    assert.equal(cont.command, "creative_continuation");
    assert.ok(cont.sourceArtifactId);
    const newArtifact = livingArtifactService.getLivingArtifactContext(cont.livingArtifactId);
    assert.ok(newArtifact.purpose.toLowerCase().includes("instagram") || String(newArtifact.sourceGoal.rawGoal).toLowerCase().includes("instagram"));
  });

  it("5. Hindi/Hinglish continuation phrasing works for at least one realistic example", async () => {
    const scope = "test_scope_5_" + Date.now();
    await garudaCommandRouter.dispatchCommand("Create a premium cinematic poster for GARUDA", { projectId: scope });
    const cont = await garudaCommandRouter.dispatchCommand("ise aur cinematic banao", { projectId: scope });
    assert.equal(cont.command, "creative_continuation");
    assert.equal(cont.success, true);
    assert.ok(cont.livingArtifactId);
  });

  it("6. No previous artifact → safe clarification/fallback, no invented context", async () => {
    livingArtifactService.clearForTesting();
    const result = await garudaCommandRouter.dispatchCommand("Make it more cinematic", { projectId: "nonexistent_scope_" + Date.now() });
    assert.equal(result.command, "creative_continuation");
    assert.equal(result.success, false);
    assert.equal(result.status, "CLARIFICATION_REQUIRED");
    assert.ok(result.message.includes("No previous creative found"));
    assert.equal(result.livingArtifactId, undefined);
  });

  it("7. Non-creative follow-up does not enter continuation path", async () => {
    const scope = "test_scope_7_" + Date.now();
    await garudaCommandRouter.dispatchCommand("Create a premium cinematic poster for GARUDA", { projectId: scope });
    const beforeCount = livingArtifactService._store.size;
    const result = await garudaCommandRouter.dispatchCommand("What is the weather today?", {});
    assert.equal(result, null);
    const afterCount = livingArtifactService._store.size;
    assert.equal(beforeCount, afterCount, "No new artifact should be created for non-creative");
  });

  it("8. Original artifact is not overwritten", async () => {
    const scope = "test_scope_8_" + Date.now();
    const first = await garudaCommandRouter.dispatchCommand("Create a premium cinematic poster for GARUDA", { projectId: scope });
    const firstId = first.livingArtifactId;
    const firstDocBefore = JSON.stringify(livingArtifactService.getLivingArtifactContext(firstId));
    await garudaCommandRouter.dispatchCommand("Make it darker", { projectId: scope });
    const firstDocAfter = JSON.stringify(livingArtifactService.getLivingArtifactContext(firstId));
    assert.equal(firstDocBefore, firstDocAfter, "Original artifact must not be overwritten");
    const second = await garudaCommandRouter.dispatchCommand("Make it more cinematic", { projectId: scope });
    assert.notEqual(firstId, second.livingArtifactId);
  });

  it("9. DRY_RUN / SIMULATED_GENERATION / PREVIEW_READY truth model remains correct", async () => {
    const scope = "test_scope_9_" + Date.now();
    const result = await garudaCommandRouter.dispatchCommand("Create a premium cinematic poster for GARUDA", { projectId: scope });
    assert.ok(["DRY_RUN",null].includes(result.generationMode) || result.generationMode === "DRY_RUN");
    assert.ok(["SIMULATED_GENERATION","VECTOR_CREATIVE"].includes(result.classification));
    assert.notEqual(result.classification, "REAL_AI_IMAGE");
    assert.ok(["PREVIEW_READY","GENERATED"].includes(result.status));
    assert.equal(result.visualQuality, "VISUAL_QUALITY_NOT_YET_VERIFIED");
    const cont = await garudaCommandRouter.dispatchCommand("Make it more cinematic", { projectId: scope });
    assert.ok(["SIMULATED_GENERATION","VECTOR_CREATIVE"].includes(cont.classification));
    assert.notEqual(cont.classification, "REAL_AI_IMAGE");
    assert.equal(cont.visualQuality, "VISUAL_QUALITY_NOT_YET_VERIFIED");
  });

  it("10. New artifact persistence failure does not falsely fail the creative continuation", async () => {
    const scope = "test_scope_10_" + Date.now();
    await garudaCommandRouter.dispatchCommand("Create a premium cinematic poster for GARUDA", { projectId: scope });
    const original = livingArtifactService.createLivingArtifactContext;
    livingArtifactService.createLivingArtifactContext = () => { throw new Error("Simulated living artifact persistence failure"); };
    const result = await garudaCommandRouter.dispatchCommand("Make it more cinematic", { projectId: scope });
    livingArtifactService.createLivingArtifactContext = original;
    assert.equal(result.success, true, "Continuation should still succeed");
    assert.equal(result.livingArtifactStatus, "PERSISTENCE_FAILED");
    assert.ok(result.livingArtifactError.includes("Simulated living artifact persistence failure"));
    assert.ok(result.assetId);
    assert.ok(["PREVIEW_READY","GENERATED"].includes(result.status));
    assert.ok(["SIMULATED_GENERATION","VECTOR_CREATIVE"].includes(result.classification));
  });
});

describe("Creative Continuation — Session Scoping (Phase E)", () => {
  beforeEach(() => {
    creativeStudioService.clearForTesting();
    livingArtifactService.clearForTesting();
  });
  afterEach(() => {
    livingArtifactService.clearForTesting();
  });

  it("same-session continuation works", async () => {
    const sessionA = "sess_A_" + Date.now();
    const first = await garudaCommandRouter.dispatchCommand("Create a premium cinematic poster for GARUDA", { sessionId: sessionA });
    assert.ok(first.livingArtifactId);
    const cont = await garudaCommandRouter.dispatchCommand("Make it more cinematic", { sessionId: sessionA });
    assert.equal(cont.command, "creative_continuation");
    assert.equal(cont.success, true);
    assert.equal(cont.sourceArtifactId, first.livingArtifactId);
  });

  it("two sessions cannot cross-contaminate", async () => {
    const sessA = "sess_A_" + Date.now();
    const sessB = "sess_B_" + Date.now();
    const a1 = await garudaCommandRouter.dispatchCommand("Create a premium cinematic poster for GARUDA", { sessionId: sessA });
    const b1 = await garudaCommandRouter.dispatchCommand("Create a premium cinematic poster for GARUDA", { sessionId: sessB });
    assert.notEqual(a1.livingArtifactId, b1.livingArtifactId);
    const aCont = await garudaCommandRouter.dispatchCommand("Make it darker", { sessionId: sessA });
    const bCont = await garudaCommandRouter.dispatchCommand("Make it darker", { sessionId: sessB });
    assert.equal(aCont.sourceArtifactId, a1.livingArtifactId);
    assert.equal(bCont.sourceArtifactId, b1.livingArtifactId);
    assert.notEqual(aCont.livingArtifactId, bCont.livingArtifactId);
    // Ensure B's continuation did not pick A's artifact
    assert.notEqual(bCont.sourceArtifactId, a1.livingArtifactId);
  });

  it("same project across multiple requests continues correctly", async () => {
    const proj = "proj_X_" + Date.now();
    const first = await garudaCommandRouter.dispatchCommand("Create a premium cinematic poster for GARUDA", { projectId: proj });
    const second = await garudaCommandRouter.dispatchCommand("Make it more cinematic", { projectId: proj });
    const third = await garudaCommandRouter.dispatchCommand("Change the color theme to luxury gold", { projectId: proj });
    assert.equal(second.sourceArtifactId, first.livingArtifactId);
    assert.equal(third.sourceArtifactId, second.livingArtifactId);
    const thirdArtifact = livingArtifactService.getLivingArtifactContext(third.livingArtifactId);
    assert.equal(thirdArtifact.rootArtifactId, first.livingArtifactId);
  });

  it("unknown/no scope continuation returns CLARIFICATION_REQUIRED", async () => {
    livingArtifactService.clearForTesting();
    // No prior artifact at all, and no scope
    const res1 = await garudaCommandRouter.dispatchCommand("Make it more cinematic", {});
    assert.equal(res1.status, "CLARIFICATION_REQUIRED");
    // With prior artifact but wrong scope, should also clarify
    const projA = "proj_clarify_" + Date.now();
    await garudaCommandRouter.dispatchCommand("Create a premium cinematic poster for GARUDA", { projectId: projA });
    const res2 = await garudaCommandRouter.dispatchCommand("Make it more cinematic", { projectId: "nonexistent_proj_" + Date.now() });
    assert.equal(res2.status, "CLARIFICATION_REQUIRED");
  });

  it("original artifact remains immutable across scoped continuations", async () => {
    const proj = "proj_immut_" + Date.now();
    const first = await garudaCommandRouter.dispatchCommand("Create a premium cinematic poster for GARUDA", { projectId: proj });
    const firstBefore = JSON.stringify(livingArtifactService.getLivingArtifactContext(first.livingArtifactId));
    await garudaCommandRouter.dispatchCommand("Make it darker", { projectId: proj });
    await garudaCommandRouter.dispatchCommand("Make an Instagram version", { projectId: proj });
    const firstAfter = JSON.stringify(livingArtifactService.getLivingArtifactContext(first.livingArtifactId));
    assert.equal(firstBefore, firstAfter);
  });

  it("lineage remains correct across 2+ continuations", async () => {
    const proj = "proj_lineage_" + Date.now();
    const a1 = await garudaCommandRouter.dispatchCommand("Create a premium cinematic poster for GARUDA", { projectId: proj });
    const a2 = await garudaCommandRouter.dispatchCommand("Make it more cinematic", { projectId: proj });
    const a3 = await garudaCommandRouter.dispatchCommand("Make it darker", { projectId: proj });
    const art3 = livingArtifactService.getLivingArtifactContext(a3.livingArtifactId);
    assert.equal(art3.sourceArtifactId, a2.livingArtifactId);
    assert.equal(art3.rootArtifactId, a1.livingArtifactId);
    assert.equal(art3.continuationInstruction, "Make it darker");
  });

  it("Hindi continuation still works with scoped session", async () => {
    const sess = "sess_hindi_" + Date.now();
    await garudaCommandRouter.dispatchCommand("Create a premium cinematic poster for GARUDA", { sessionId: sess });
    const cont = await garudaCommandRouter.dispatchCommand("ise aur cinematic banao", { sessionId: sess });
    assert.equal(cont.command, "creative_continuation");
    assert.equal(cont.success, true);
  });

  it("DRY_RUN truth model remains unchanged with scoped continuation", async () => {
    const proj = "proj_truth_" + Date.now();
    await garudaCommandRouter.dispatchCommand("Create a premium cinematic poster for GARUDA", { projectId: proj });
    const cont = await garudaCommandRouter.dispatchCommand("Make it more cinematic", { projectId: proj });
    assert.ok(["PREVIEW_READY","GENERATED"].includes(cont.status));
    assert.notEqual(cont.classification, "REAL_AI_IMAGE");
    assert.equal(cont.visualQuality, "VISUAL_QUALITY_NOT_YET_VERIFIED");
    assert.equal(cont.generationMode, "DRY_RUN");
  });
});
