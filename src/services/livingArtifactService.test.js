const assert = require("node:assert");
const { describe, it, beforeEach } = require("node:test");
const livingArtifactService = require("./livingArtifactService");
const { GARUDA_CORE_PRINCIPLES } = require("./garudaCorePrinciples");
const creativeQualityService = require("./creativeQualityService");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

describe("Living Artifact & Corrected Quality Philosophy", () => {
  beforeEach(() => {
    livingArtifactService.clearForTesting();
  });

  it("A. 19 nahi 22 is NOT numeric quality scoring", () => {
    assert.equal(GARUDA_CORE_PRINCIPLES.principles.quality.philosophy, "BEYOND_EXPECTATION_QUALITY");
    assert.ok(!String(GARUDA_CORE_PRINCIPLES.principles.quality.statement).includes("98"));
    // Ensure no numeric 22 in quality floors
    assert.equal(GARUDA_CORE_PRINCIPLES.principles.quality.requirementFloors.cinematic, "exceptional_completeness");
    assert.notEqual(GARUDA_CORE_PRINCIPLES.principles.quality.requirementFloors.cinematic, 98);
    assert.notEqual(GARUDA_CORE_PRINCIPLES.principles.quality.requirementFloors.cinematic, 22);
  });

  it("B. Beyond Expectation Quality is philosophy/policy", () => {
    assert.equal(GARUDA_CORE_PRINCIPLES.principles.quality.ambition, "BEYOND_EXPECTATION_QUALITY — aim beyond basic expectation when user intent requires exceptional work");
    assert.equal(GARUDA_CORE_PRINCIPLES.principles.cinematic_quality.ambition.includes("BEYOND_EXPECTATION"), true);
  });

  it("C. Technical verification remains objective", () => {
    const tmp = path.join(__dirname, "..", "..", "data", "creative-assets", "living_test_tech.svg");
    fs.writeFileSync(tmp, "<svg>test → CTA</svg>", "utf8");
    const asset = {
      filePath: tmp,
      assetHash: crypto.createHash("sha256").update(fs.readFileSync(tmp)).digest("hex"),
      dimensions: { width: 1080, height: 1080 },
      aspectRatio: "1:1",
      provider: "garuda_sovereign_svg_renderer",
      status: "GENERATED",
      mimeType: "image/svg+xml",
      identityLock: { brandId: "garuda_default", lockHash: require("./identityLockService").getBrandProfile("garuda_default").lockHash },
      qualityProfile: "standard",
      generationMode: "DRY_RUN",
      classification: "SIMULATED_GENERATION"
    };
    const res = creativeQualityService.validateAsset(asset);
    assert.equal(res.technicalVerification.passed, true);
    assert.equal(res.technicalVerification.truthClassification, "TECHNICAL_VERIFICATION_PASSED");
    try { fs.unlinkSync(tmp); } catch {}
  });

  it("D. Physical verification does not falsely equal visual quality verification", () => {
    const tmp = path.join(__dirname, "..", "..", "data", "creative-assets", "living_test_phys.svg");
    fs.writeFileSync(tmp, "<svg>physical → CTA</svg>", "utf8");
    const asset = {
      filePath: tmp,
      assetHash: crypto.createHash("sha256").update(fs.readFileSync(tmp)).digest("hex"),
      dimensions: { width: 1080, height: 1080 },
      aspectRatio: "1:1",
      provider: "garuda_sovereign_svg_renderer",
      status: "GENERATED",
      mimeType: "image/svg+xml",
      identityLock: { brandId: "garuda_default", lockHash: require("./identityLockService").getBrandProfile("garuda_default").lockHash },
      qualityProfile: "cinematic",
      generationMode: "DRY_RUN",
      classification: "SIMULATED_GENERATION"
    };
    const res = creativeQualityService.validateAsset(asset);
    assert.equal(res.technicalVerification.passed, true);
    assert.equal(res.visualQualityVerification.status, "VISUAL_QUALITY_NOT_YET_VERIFIED");
    assert.equal(res.visualQualityVerification.verified, false);
    try { fs.unlinkSync(tmp); } catch {}
  });

  it("E. Missing visual assessment returns truthful status", () => {
    const tmp = path.join(__dirname, "..", "..", "data", "creative-assets", "living_test_visual.svg");
    fs.writeFileSync(tmp, "<svg>visual test → CTA</svg>", "utf8");
    const asset = {
      filePath: tmp,
      assetHash: crypto.createHash("sha256").update(fs.readFileSync(tmp)).digest("hex"),
      dimensions: { width: 1080, height: 1080 },
      aspectRatio: "1:1",
      provider: "garuda_sovereign_svg_renderer",
      status: "GENERATED",
      mimeType: "image/svg+xml",
      identityLock: { brandId: "garuda_default", lockHash: require("./identityLockService").getBrandProfile("garuda_default").lockHash },
      qualityProfile: "premium",
      generationMode: "DRY_RUN",
      classification: "SIMULATED_GENERATION"
    };
    const res = creativeQualityService.validateAsset(asset);
    assert.equal(res.visualQualityVerification.status, "VISUAL_QUALITY_NOT_YET_VERIFIED");
    assert.ok(res.visualQualityVerification.reason.includes("No semantic aesthetic model"));
    try { fs.unlinkSync(tmp); } catch {}
  });

  it("F. A Living Artifact context can be created", () => {
    const ctx = livingArtifactService.createLivingArtifactContext({
      artifactType: "investor_presentation",
      purpose: "Explain GARUDA to investor",
      audience: "investor",
      keyClaims: [{ claim: "GARUDA is OS", evidence: "Architecture" }],
      assumptions: ["Market size estimate is assumption"],
      projectId: "proj_test",
      briefId: "brief_test"
    });
    assert.ok(ctx.artifactId);
    assert.equal(ctx.artifactType, "investor_presentation");
    assert.equal(ctx.purpose, "Explain GARUDA to investor");
    assert.ok(ctx.narrative);
    assert.ok(Array.isArray(ctx.keyClaims));
    assert.ok(Array.isArray(ctx.anticipatedQuestions));
    assert.ok(ctx.conversationContext);
  });

  it("G. Living Artifact retains purpose, audience, narrative, key claims, assumptions, anticipated questions", () => {
    const ctx = livingArtifactService.createLivingArtifactContext({
      artifactType: "investor_presentation",
      purpose: "Test purpose",
      audience: "investor",
      narrative: "Test narrative",
      keyClaims: [{ claim: "Test claim", evidence: "Test evidence" }],
      assumptions: ["Assumption 1"],
      decisions: ["Decision 1"],
      risks: ["Risk 1"]
    });
    assert.equal(ctx.purpose, "Test purpose");
    assert.equal(ctx.audience, "investor");
    assert.equal(ctx.narrative, "Test narrative");
    assert.equal(ctx.keyClaims[0].claim, "Test claim");
    assert.equal(ctx.assumptions[0], "Assumption 1");
    assert.ok(ctx.anticipatedQuestions.length >= 5);
    assert.ok(ctx.preparedAnswers.length >= 5);
  });

  it("H. Investor presentation example creates conversational context", () => {
    const ctx = livingArtifactService.createLivingArtifactContext({
      artifactType: "investor_presentation",
      purpose: "What is GARUDA",
      audience: "investor"
    });
    assert.ok(ctx.narrative.includes("Namaste") || ctx.narrative.includes("problem"));
    assert.ok(ctx.conversationContext.nextPrompt.includes("Ask me anything"));
    assert.ok(ctx.anticipatedQuestions.some(q => q.category === "MOAT"));
    assert.ok(ctx.anticipatedQuestions.some(q => q.category === "REVENUE"));
  });

  it("I. GARUDA can retrieve artifact context", () => {
    const created = livingArtifactService.createLivingArtifactContext({
      artifactType: "investor_presentation",
      purpose: "Retrieval test",
      audience: "investor"
    });
    const retrieved = livingArtifactService.getLivingArtifactContext(created.artifactId);
    assert.ok(retrieved);
    assert.equal(retrieved.artifactId, created.artifactId);
    assert.equal(retrieved.purpose, "Retrieval test");
    const missing = livingArtifactService.getLivingArtifactContext("nonexistent_id_123");
    assert.equal(missing, null);
  });

  it("J. Question answering receives artifact context", () => {
    const ctx = livingArtifactService.createLivingArtifactContext({
      artifactType: "investor_presentation",
      purpose: "QA test",
      audience: "investor"
    });
    const ans1 = livingArtifactService.answerArtifactQuestion(ctx.artifactId, "How is GARUDA different from ChatGPT?");
    assert.ok(ans1.answer.includes("ChatGPT") || ans1.answer.includes("OS"));
    assert.equal(ans1.confidence, "REASONED_FROM_CONTEXT");
    const ans2 = livingArtifactService.answerArtifactQuestion(ctx.artifactId, "What is the moat?");
    assert.ok(ans2.answer.length > 10);
  });

  it("K. Unknown evidence is never fabricated", () => {
    const ctx = livingArtifactService.createLivingArtifactContext({
      artifactType: "investor_presentation",
      purpose: "Unknown test",
      audience: "investor"
    });
    const ans = livingArtifactService.answerArtifactQuestion(ctx.artifactId, "What is the exact revenue in 2030?");
    // Should be UNKNOWN or ASSUMPTION, never fabricate confident EVIDENCE_BACKED for unknown
    if (ans.confidence === "UNKNOWN") {
      assert.ok(ans.answer.includes("don't have enough verified information") || ans.answer.includes("Unknown"));
    } else {
      // If it returns REASONED, it must not claim EVIDENCE_BACKED for unknown revenue
      assert.notEqual(ans.confidence, "EVIDENCE_BACKED");
    }
    // Ensure evidence array does not contain fabricated verified evidence for unknown
    assert.ok(!ctx.evidence.some(e => e.verified && String(e.claim).includes("2030 revenue")));
  });

  it("L. Existing Creative Universe tests continue passing (sovereign fallback)", async () => {
    const imageGenerationRouter = require("./imageGenerationRouter");
    const res = await imageGenerationRouter.routeGeneration({
      headline: "Living artifact sovereign test",
      mode: "SOVEREIGN_LAYOUT",
      brandId: "garuda_default"
    });
    assert.equal(res.success, true);
    assert.equal(res.classification, "VECTOR_CREATIVE");
    assert.ok(require("fs").existsSync(res.asset.filePath));
  });
});
