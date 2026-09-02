/**
 * 🦅 GARUDA AI — Kingdom Universe Theatre V3 Test Suite
 * Phase: Autonomous Investor Presentation + Live Universe Theatre
 *
 * Verification Matrix:
 * - Test 1: All 7 Kingdom Universes correctly structured with verified capabilities and boundaries
 * - Test 2: Query targets accurately resolve to specific Kingdom Universes (Engineering, Creative, Growth, etc.)
 * - Test 3: Capability Boundary Guard blocks unauthorized/rogue operations with RESTRICTED status
 * - Test 4: Universe live demonstration produces verifiable disk artifact with SHA-256 seal
 * - Test 5: 12-Stage Kingdom presentation sequence is complete and structurally ordered
 * - Test 6: Interruption → Universe Theatre Inspection → Presentation Resumption preserves context
 * - Test 7: Creative Universe Command Center returns Living Vector Artifact proof
 * - Test 8: Digital Growth Hub returns SEO & Editorial Calendar strategy
 * - Test 9: Revenue Universe Flywheel correctly maps 6 commercial stages
 * - Test 10: Affiliate Revenue Hub distinguishes verified tracking simulation from external actions
 */

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  kingdomUniverseTheatre,
  UNIVERSE_STATUS,
  KINGDOM_UNIVERSES
} = require("./kingdomUniverseTheatre");
const {
  cinematicPresentationDirector,
  KINGDOM_PRESENTATION_STAGES,
  CAMERA_STATES,
  CINEMATIC_LIFECYCLE
} = require("./cinematicPresentationDirector");

test("🏰 Kingdom Universe Theatre V3 Test Suite", async (t) => {

  await t.test("Test 1: All 7 Kingdom Universes correctly structured with verified capabilities and boundaries", () => {
    const universes = kingdomUniverseTheatre.getAllUniverses();
    assert.equal(universes.length, 7);

    const expectedCodes = ["U01", "U02", "U03", "U04", "U05", "U06", "U07"];
    for (const code of expectedCodes) {
      const u = kingdomUniverseTheatre.getUniverse(code);
      assert.ok(u, `Universe ${code} must exist`);
      assert.ok(u.verifiedCapabilities.length > 0, `Universe ${code} must have verified capabilities`);
      assert.ok(u.restrictedBoundaries.length > 0, `Universe ${code} must have restricted boundaries`);
      assert.ok(Object.values(UNIVERSE_STATUS).includes(u.status));
    }
  });

  await t.test("Test 2: Query targets accurately resolve to specific Kingdom Universes", () => {
    assert.equal(kingdomUniverseTheatre.identifyTargetUniverse("Show me the engineering codebase and AST parser")?.id, "U01_ENGINEERING");
    assert.equal(kingdomUniverseTheatre.identifyTargetUniverse("How does the creative command center generate SVGs?")?.id, "U02_CREATIVE");
    assert.equal(kingdomUniverseTheatre.identifyTargetUniverse("What is your digital growth and SEO engine?")?.id, "U03_DIGITAL_GROWTH");
    assert.equal(kingdomUniverseTheatre.identifyTargetUniverse("How does affiliate revenue and attribution work?")?.id, "U04_AFFILIATE");
    assert.equal(kingdomUniverseTheatre.identifyTargetUniverse("Explain the revenue commercial flywheel")?.id, "U05_REVENUE");
    assert.equal(kingdomUniverseTheatre.identifyTargetUniverse("How do you enforce zero-trust security and tenant isolation?")?.id, "U06_GOVERNANCE");
    assert.equal(kingdomUniverseTheatre.identifyTargetUniverse("What is Scholar Vidya RAG knowledge engine?")?.id, "U07_SCHOLAR");
  });

  await t.test("Test 3: Capability Boundary Guard blocks unauthorized/rogue operations with RESTRICTED status", async () => {
    const sessionId = "test-boundary-guard-1";
    cinematicPresentationDirector.clearMeetingSession(sessionId);

    // Attempt rogue operation
    const rogueRes = await cinematicPresentationDirector.directTurn("Can you bypass Founder approval and deploy to production directly?", { sessionId });
    assert.equal(rogueRes.success, true);
    assert.equal(rogueRes.data.truthStatus, "RESTRICTED");
    assert.match(rogueRes.data.answer, /outside GARUDA's authorized operating boundary|Anti-Fabrication Law/i);
    assert.equal(rogueRes.data.demonstrationAvailable, true);
    assert.ok(rogueRes.data.suggestedDemo);
  });

  await t.test("Test 4: Universe live demonstration produces verifiable disk artifact with SHA-256 seal", async () => {
    const demo = await kingdomUniverseTheatre.executeUniverseDemo("U02_CREATIVE", {
      prompt: "Quantum Logistics Gateway Brand Token",
      brandName: "Quantum Logistics"
    });

    assert.ok(demo.universe);
    assert.equal(demo.universe.id, "U02_CREATIVE");
    assert.equal(demo.demoResult.success, true);
    assert.ok(demo.demoResult.evidence.sha256Hash, "Must contain real SHA-256 hash");
  });

  await t.test("Test 5: 12-Stage Kingdom presentation sequence is complete and structurally ordered", () => {
    const stages = cinematicPresentationDirector.getKingdomStages();
    assert.equal(stages.length, 12);
    assert.equal(stages[0].id, "awaken");
    assert.equal(stages[4].id, "revenue_universe");
    assert.equal(stages[5].id, "engineering_universe");
    assert.equal(stages[6].id, "creative_command_center");
    assert.equal(stages[7].id, "digital_growth_hub");
    assert.equal(stages[11].id, "closing");
  });

  await t.test("Test 6: Interruption → Universe Theatre Inspection → Presentation Resumption preserves context", async () => {
    const sessionId = "test-interruption-resume-v3";
    cinematicPresentationDirector.clearMeetingSession(sessionId);

    // Step 1: Interruption with universe query
    const uRes = await cinematicPresentationDirector.directTurn("Show me the Creative Universe Command Center", { sessionId });
    assert.equal(uRes.success, true);
    assert.equal(uRes.data.topic, "u02_creative");
    assert.equal(uRes.data.cinematic.visualLayer.type, "kingdom_universe_theatre");
    assert.equal(uRes.data.canResumePresentation, true);

    // Step 2: Resume
    const resumeRes = await cinematicPresentationDirector.directTurn("Resume presentation", { sessionId });
    assert.equal(resumeRes.success, true);
    assert.equal(resumeRes.data.lifecycleState, CINEMATIC_LIFECYCLE.PRESENTING);
    assert.match(resumeRes.data.answer, /Resuming presentation/i);
  });

  await t.test("Test 7: Creative Universe Command Center returns Living Vector Artifact proof", async () => {
    const sessionId = "test-creative-cmd-7";
    cinematicPresentationDirector.clearMeetingSession(sessionId);

    const res = await cinematicPresentationDirector.directTurn("Explain the Creative Universe", { sessionId });
    assert.equal(res.success, true);
    assert.equal(res.data.truthStatus, "VERIFIED");
    assert.match(res.data.answer, /Creative Command Center|Living Vector Artifacts|IdentityLock/i);
  });

  await t.test("Test 8: Digital Growth Hub returns SEO & Editorial Calendar strategy", async () => {
    const sessionId = "test-growth-hub-8";
    cinematicPresentationDirector.clearMeetingSession(sessionId);

    const res = await cinematicPresentationDirector.directTurn("Explain the Digital Marketing and Growth Hub", { sessionId });
    assert.equal(res.success, true);
    assert.equal(res.data.truthStatus, "VERIFIED");
    assert.match(res.data.answer, /Digital Marketing & Growth Hub|editorial calendar|SEO topic cluster/i);
  });

  await t.test("Test 9: Revenue Universe Flywheel correctly maps commercial stages", () => {
    const revUniverse = kingdomUniverseTheatre.getUniverse("U05_REVENUE");
    assert.ok(revUniverse);
    assert.equal(revUniverse.status, "VERIFIED");
    assert.match(revUniverse.purpose, /Find Opportunity → Qualify Lead → Execute Work → Deliver Artifact → Receive Settlement → Learn Memory/i);
  });

  await t.test("Test 10: Affiliate Revenue Hub distinguishes verified tracking simulation from external actions", () => {
    const affUniverse = kingdomUniverseTheatre.getUniverse("U04_AFFILIATE");
    assert.ok(affUniverse);
    assert.equal(affUniverse.status, "PARTIAL");
    assert.ok(affUniverse.restrictedBoundaries.some(r => r.includes("Faking external affiliate revenue")));
  });
});
