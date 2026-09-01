const assert = require("node:assert");
const { describe, it, beforeEach, afterEach } = require("node:test");

const garudaCommandRouter = require("./garudaCommandRouter");
const livingArtifactService = require("./livingArtifactService");
const creativeStudioService = require("./creativeStudioService");

describe("Creative Universe — Genuine End-to-End Integration", () => {
  beforeEach(() => {
    creativeStudioService.clearForTesting();
    livingArtifactService.clearForTesting();
  });
  afterEach(() => {
    livingArtifactService.clearForTesting();
  });

  it("1. Mother Brain natural-language create persists Living Artifact with full context", async () => {
    const projectId = "e2e_proj_" + Date.now();
    const sessionId = "e2e_sess_" + Date.now();
    const result = await garudaCommandRouter.dispatchCommand(
      "Create a premium cinematic poster for GARUDA",
      { projectId, sessionId }
    );
    assert.equal(result.command, "creative");
    assert.equal(result.success, true);
    assert.ok(result.livingArtifactId, "Must persist a Living Artifact");
    assert.equal(result.livingArtifactStatus, "CREATED");
    assert.equal(result.continuityScopeId, projectId);
    assert.equal(result.projectId, projectId);
    assert.equal(result.sessionId, sessionId);
    const artifact = livingArtifactService.getLivingArtifactContext(result.livingArtifactId);
    assert.ok(artifact);
    assert.equal(artifact.artifactType, "creative_asset");
    assert.equal(artifact.projectId, projectId);
    assert.equal(artifact.sessionId, sessionId);
    assert.equal(artifact.continuityScopeId, projectId);
    assert.ok(artifact.sourceBrief);
    assert.ok(artifact.sourceGoal.rawGoal.includes("premium cinematic"));
  });

  it("2. Scoped listing and retrieval work across project/session/conversation", async () => {
    const projectId = "e2e_list_proj_" + Date.now();
    const sessionId = "e2e_list_sess_" + Date.now();
    await garudaCommandRouter.dispatchCommand("Create a premium cinematic poster for GARUDA", { projectId, sessionId });
    await garudaCommandRouter.dispatchCommand("Create a luxury social media image for Titan", { projectId, sessionId });

    const listByProject = livingArtifactService.listLivingArtifacts({ projectId, limit: 10 });
    assert.equal(listByProject.length, 2, "Should list both artifacts by projectId");

    const listBySession = livingArtifactService.listLivingArtifacts({ sessionId, limit: 10 });
    assert.equal(listBySession.length, 2, "Should list both artifacts by sessionId");

    const firstArtifact = listByProject[0];
    const retrieved = livingArtifactService.getLivingArtifactContext(firstArtifact.artifactId);
    assert.ok(retrieved);
    assert.equal(retrieved.artifactId, firstArtifact.artifactId);
  });

  it("3. Explicit artifact continuation preserves lineage and does not overwrite original", async () => {
    const projectId = "e2e_explicit_proj_" + Date.now();
    const first = await garudaCommandRouter.dispatchCommand("Create a premium cinematic poster for GARUDA", { projectId });
    const firstId = first.livingArtifactId;

    const cont = await garudaCommandRouter.dispatchCommand("Make it darker and more dramatic", {
      projectId,
      artifactId: firstId
    });
    assert.equal(cont.command, "creative_continuation");
    assert.equal(cont.success, true);
    assert.equal(cont.sourceArtifactId, firstId);
    assert.notEqual(cont.livingArtifactId, firstId);

    const firstAfter = livingArtifactService.getLivingArtifactContext(firstId);
    const second = livingArtifactService.getLivingArtifactContext(cont.livingArtifactId);
    assert.equal(second.sourceArtifactId, firstId);
    assert.equal(second.rootArtifactId, firstId);
    assert.equal(second.continuationInstruction, "Make it darker and more dramatic");
    assert.equal(firstAfter.status, "CREATED", "Original must remain unmodified");
  });

  it("4. Scoped latest-artifact continuation works via Mother Brain natural language", async () => {
    const projectId = "e2e_scoped_proj_" + Date.now();
    await garudaCommandRouter.dispatchCommand("Create a premium cinematic poster for GARUDA", { projectId });
    await garudaCommandRouter.dispatchCommand("Make it more cinematic", { projectId });

    const cont = await garudaCommandRouter.dispatchCommand("Change the color theme to luxury gold", { projectId });
    assert.equal(cont.command, "creative_continuation");
    assert.equal(cont.success, true);
    assert.ok(cont.sourceArtifactId, "Should resolve latest artifact by scope");
    assert.equal(cont.continuityScopeId, projectId);
  });

  it("5. Lineage/history retrieval walks the full parent chain", async () => {
    const projectId = "e2e_lineage_proj_" + Date.now();
    const a1 = await garudaCommandRouter.dispatchCommand("Create a premium cinematic poster for GARUDA", { projectId });
    const a2 = await garudaCommandRouter.dispatchCommand("Make it more cinematic", { projectId });
    const a3 = await garudaCommandRouter.dispatchCommand("Make it darker", { projectId });

    const lineage = livingArtifactService.getArtifactLineage(a3.livingArtifactId);
    assert.ok(Array.isArray(lineage));
    assert.equal(lineage.length, 3, "Should have 3 generations");
    assert.equal(lineage[0].artifactId, a1.livingArtifactId, "Root should be first");
    assert.equal(lineage[1].artifactId, a2.livingArtifactId);
    assert.equal(lineage[2].artifactId, a3.livingArtifactId);
    assert.equal(lineage[2].sourceArtifactId, a2.livingArtifactId);
    assert.equal(lineage[1].sourceArtifactId, a1.livingArtifactId);
  });

  it("6. Lineage/history retrieval walks the full parent chain via HTTP-style response", async () => {
    const projectId = "e2e_lineage_http_" + Date.now();
    const a1 = await garudaCommandRouter.dispatchCommand("Create a premium cinematic poster for GARUDA", { projectId });
    const a2 = await garudaCommandRouter.dispatchCommand("Make it more cinematic", { projectId });

    const lineage = livingArtifactService.getArtifactLineage(a2.livingArtifactId);
    const safeLineage = lineage.map(doc => ({
      artifactId: doc.artifactId,
      sourceArtifactId: doc.sourceArtifactId || null,
      rootArtifactId: doc.rootArtifactId || null,
      continuityScopeId: doc.continuityScopeId || null,
      projectId: doc.projectId || null,
      purpose: doc.purpose,
      continuationInstruction: doc.continuationInstruction || null,
      createdAt: doc.createdAt
    }));
    assert.equal(safeLineage.length, 2);
    assert.equal(safeLineage[0].artifactId, a1.livingArtifactId);
    assert.equal(safeLineage[1].artifactId, a2.livingArtifactId);
    assert.equal(safeLineage[0].rootArtifactId, a1.livingArtifactId);
    assert.equal(safeLineage[1].sourceArtifactId, a1.livingArtifactId);
  });

  it("7. Durable restart recovery: artifacts survive process-restart simulation", async () => {
    const projectId = "e2e_restart_proj_" + Date.now();
    const first = await garudaCommandRouter.dispatchCommand("Create a premium cinematic poster for GARUDA", { projectId });
    const firstId = first.livingArtifactId;

    // Simulate full restart: clear in-memory store
    livingArtifactService._store.clear();
    const storeSizeAfterClear = livingArtifactService._store.size;
    assert.equal(storeSizeAfterClear, 0);

    // Scoped lookup must recover from file
    const recovered = livingArtifactService.getMostRecentCreativeArtifactScoped({ projectId });
    assert.ok(recovered, "Must recover from file after restart");
    assert.equal(recovered.artifactId, firstId);

    // Continuation must work after restart
    const cont = await garudaCommandRouter.dispatchCommand("Make it darker", { projectId });
    assert.equal(cont.command, "creative_continuation");
    assert.equal(cont.success, true);
    assert.equal(cont.sourceArtifactId, firstId);
  });

  it("8. Strict cross-project/session isolation — no global fallback, no cross-contamination", async () => {
    const projA = "e2e_iso_A_" + Date.now();
    const projB = "e2e_iso_B_" + Date.now();
    const sessX = "e2e_sess_X_" + Date.now();
    const sessY = "e2e_sess_Y_" + Date.now();

    const a1 = await garudaCommandRouter.dispatchCommand("Create a premium cinematic poster for GARUDA", { projectId: projA, sessionId: sessX });
    const b1 = await garudaCommandRouter.dispatchCommand("Create a luxury social media image for Titan", { projectId: projB, sessionId: sessY });
    assert.notEqual(a1.livingArtifactId, b1.livingArtifactId);

    // Session A continues with A's artifact
    const aCont = await garudaCommandRouter.dispatchCommand("Make it darker", { projectId: projA, sessionId: sessX });
    assert.equal(aCont.sourceArtifactId, a1.livingArtifactId);
    assert.notEqual(aCont.sourceArtifactId, b1.livingArtifactId);

    // Session B continues with B's artifact
    const bCont = await garudaCommandRouter.dispatchCommand("Make it darker", { projectId: projB, sessionId: sessY });
    assert.equal(bCont.sourceArtifactId, b1.livingArtifactId);
    assert.notEqual(bCont.sourceArtifactId, a1.livingArtifactId);

    // Proj A continuation must NOT pick B's artifact even if B's is newer
    assert.notEqual(aCont.sourceArtifactId, b1.livingArtifactId);

    // No scope → CLARIFICATION_REQUIRED
    const noScope = await garudaCommandRouter.dispatchCommand("Make it darker", {});
    assert.equal(noScope.status, "CLARIFICATION_REQUIRED");
    assert.equal(noScope.success, false);
  });

  it("9. Hindi/Hinglish natural-language create and continuation work end-to-end", async () => {
    const projectId = "e2e_hindi_proj_" + Date.now();
    const create = await garudaCommandRouter.dispatchCommand("Ek premium cinematic poster GARUDA ke liye banao", { projectId });
    assert.equal(create.command, "creative");
    assert.equal(create.success, true);
    assert.ok(create.livingArtifactId);

    const cont = await garudaCommandRouter.dispatchCommand("Ise aur cinematic aur darker banao", { projectId });
    assert.equal(cont.command, "creative_continuation");
    assert.equal(cont.success, true);
    assert.equal(cont.sourceArtifactId, create.livingArtifactId);
  });

  it("10. Truth model is never violated: DRY_RUN stays truthful, REAL_AI_IMAGE is never fabricated", async () => {
    const projectId = "e2e_truth_proj_" + Date.now();
    const create = await garudaCommandRouter.dispatchCommand("Create a premium cinematic poster for GARUDA", { projectId });
    assert.ok(["PREVIEW_READY", "GENERATED"].includes(create.status));
    assert.notEqual(create.classification, "REAL_AI_IMAGE");
    assert.equal(create.visualQuality, "VISUAL_QUALITY_NOT_YET_VERIFIED");
    const artifact = livingArtifactService.getLivingArtifactContext(create.livingArtifactId);
    const ev = artifact.evidence.find(e => e.type === "creative_asset");
    assert.ok(["SIMULATED_GENERATION", "VECTOR_CREATIVE"].includes(ev.classification));
    assert.notEqual(ev.classification, "REAL_AI_IMAGE");
  });
});
