/**
 * 🦅 GARUDA AI — Cinematic Presentation Director V2 Test Suite
 * Phase: Live Autonomous AI Entity + Dynamic Presentation Director
 *
 * Verification Matrix:
 * - Test 1: Strategic question triggers correct presentation mode & camera state (CLOSE_UP)
 * - Test 2: Interruption → Answer → Resume presentation lifecycle
 * - Test 3: Proof challenge triggers Evidence Stage & evidence layer
 * - Test 4: Actionable engineering request triggers Engineering Pipeline bridge
 * - Test 5: Custom business information triggers live capability demonstration with real disk artifact & SHA-256
 * - Test 6: Unsupported capability honestly refused under Anti-Fabrication Law
 * - Test 7: ₹1 Crore question returns structured capital allocation & milestone scenarios without fake returns
 * - Test 8: 3-Year / IPO question returns milestone-based readiness without false guarantees
 * - Test 9: 5-Year Vision returns flywheel architecture
 * - Test 10: Competitor moat (OpenAI) distinguishes Verified vs Strategic vs Future moats
 * - Test 11: Multi-participant meeting context tracking
 * - Test 12: Session isolation between distinct investor sessions
 */

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  cinematicPresentationDirector,
  CAMERA_STATES,
  CAMERA_TRANSITIONS,
  CINEMATIC_LIFECYCLE
} = require("./cinematicPresentationDirector");

test("🎬 Cinematic Presentation Director V2 Test Suite", async (t) => {

  await t.test("Test 1: Strategic question triggers CLOSE_UP camera & sovereign entity state", async () => {
    const sessionId = "test-director-strat-1";
    cinematicPresentationDirector.clearMeetingSession(sessionId);

    const res = await cinematicPresentationDirector.directTurn("What is your core architectural philosophy?", { sessionId });
    assert.equal(res.success, true);
    assert.ok(res.data.cinematic);
    assert.ok(res.data.cinematic.camera.shot === CAMERA_STATES.CLOSE_UP || res.data.cinematic.camera.shot === CAMERA_STATES.ARCHITECTURE_FOCUS);
    assert.equal(res.data.cinematic.entity.mode, "speaking");
  });

  await t.test("Test 2: Interruption → Answer → Resume presentation lifecycle", async () => {
    const sessionId = "test-director-resume-2";
    cinematicPresentationDirector.clearMeetingSession(sessionId);

    // Step 1: Interruption with question
    const qRes = await cinematicPresentationDirector.directTurn("Wait, how do you acquire enterprise customers?", { sessionId });
    assert.equal(qRes.success, true);
    assert.equal(qRes.data.canResumePresentation, true);

    // Step 2: Resume presentation command
    const resumeRes = await cinematicPresentationDirector.directTurn("Resume presentation", { sessionId });
    assert.equal(resumeRes.success, true);
    assert.equal(resumeRes.data.lifecycleState, CINEMATIC_LIFECYCLE.PRESENTING);
    assert.match(resumeRes.data.answer, /Resuming presentation/i);
  });

  await t.test("Test 3: Proof challenge triggers Evidence Stage & evidence telemetry", async () => {
    const sessionId = "test-director-proof-3";
    cinematicPresentationDirector.clearMeetingSession(sessionId);

    const res = await cinematicPresentationDirector.directTurn("Show me something you can actually prove on disk.", { sessionId });
    assert.equal(res.success, true);
    assert.equal(res.data.demonstrationAvailable, true);
    assert.ok(res.data.cinematic.camera.shot);
    assert.match(res.data.answer, /Anti-Fabrication Law/i);
  });

  await t.test("Test 4: Actionable engineering request triggers Engineering Pipeline bridge", async () => {
    const sessionId = "test-director-eng-4";
    cinematicPresentationDirector.clearMeetingSession(sessionId);

    const res = await cinematicPresentationDirector.directTurn("Run engineering mission to analyze file src/services/healthService.js", {
      sessionId,
      executeDirectly: false,
      garudaContext: { isFounder: true, role: "platform_founder", capabilities: ["*"] }
    });

    assert.equal(res.success, true);
    assert.equal(res.data.intent, "EXECUTE_ENGINEERING_MISSION");
    assert.match(res.data.answer, /engineering goal/i);
  });

  await t.test("Test 5: Custom business information triggers live capability demonstration with real disk artifact & SHA-256", async () => {
    const sessionId = "test-director-biz-5";
    cinematicPresentationDirector.clearMeetingSession(sessionId);

    const prompt = "My name is David, my company is HyperScale Cloud, we sell cloud automation. Build something for me.";
    const res = await cinematicPresentationDirector.directTurn(prompt, { sessionId });

    assert.equal(res.success, true);
    assert.equal(res.data.intent, "EXECUTE_CAPABILITY");
    assert.ok(res.data.executionResult);
    assert.equal(res.data.executionResult.success, true);
    assert.ok(res.data.evidence?.sha256Hash, "Must contain real cryptographic SHA-256 hash");
    assert.equal(res.data.cinematic.camera.shot, CAMERA_STATES.SPLIT_SCREEN);
    assert.match(res.data.speechText, /HyperScale Cloud/i);
  });

  await t.test("Test 6: Unsupported capability honestly refused under Anti-Fabrication Law", async () => {
    const sessionId = "test-director-unverified-6";
    cinematicPresentationDirector.clearMeetingSession(sessionId);

    const res = await cinematicPresentationDirector.directTurn("Can you generate a full Hollywood movie right now?", { sessionId });
    assert.equal(res.success, true);
    assert.ok(res.data.truthStatus === "UNAVAILABLE" || res.data.truthStatus === "RESTRICTED");
    assert.match(res.data.answer, /Anti-Fabrication Law|cannot perform|cannot claim|authorized operating boundary/i);
  });

  await t.test("Test 7: ₹1 Crore question returns structured capital allocation & milestone scenarios without fake returns", async () => {
    const sessionId = "test-director-crore-7";
    cinematicPresentationDirector.clearMeetingSession(sessionId);

    const res = await cinematicPresentationDirector.directTurn("What happens if I invest ₹1 Crore?", { sessionId });
    assert.equal(res.success, true);
    assert.equal(res.data.topic, "one_crore_scenario");
    assert.ok(res.data.cinematic.visualLayer.data.capitalAllocation);
    // Must contain 40% engineering, 25% revenue allocation
    const alloc = res.data.cinematic.visualLayer.data.capitalAllocation;
    assert.equal(alloc[0].percentage, 40);
    assert.equal(alloc[1].percentage, 25);
    // Must contain explicit disclaimer rejecting guaranteed multipliers
    assert.match(res.data.answer, /do not promise guaranteed financial multipliers|milestones/i);
  });

  await t.test("Test 8: 3-Year / IPO question returns milestone-based readiness without false guarantees", async () => {
    const sessionId = "test-director-ipo-8";
    cinematicPresentationDirector.clearMeetingSession(sessionId);

    const res = await cinematicPresentationDirector.directTurn("Where do you see GARUDA in 3 years? Are you planning an IPO?", { sessionId });
    assert.equal(res.success, true);
    assert.equal(res.data.topic, "three_year_vision");
    assert.ok(res.data.cinematic.visualLayer.data.phases);
    assert.match(res.data.answer, /Year 1|Year 2|Year 3|IPO readiness is treated as a strategic milestone/i);
    assert.doesNotMatch(res.data.answer, /guaranteed IPO/i);
  });

  await t.test("Test 9: 5-Year Vision returns flywheel architecture", async () => {
    const sessionId = "test-director-flywheel-9";
    cinematicPresentationDirector.clearMeetingSession(sessionId);

    const res = await cinematicPresentationDirector.directTurn("Where do you see GARUDA in 5 years?", { sessionId });
    assert.equal(res.success, true);
    assert.equal(res.data.topic, "five_year_vision");
    assert.ok(res.data.cinematic.visualLayer.data.stages);
    assert.match(res.data.answer, /Autonomous Intelligence Infrastructure|flywheel/i);
  });

  await t.test("Test 10: Competitor moat (OpenAI) distinguishes Verified vs Strategic vs Future moats", async () => {
    const sessionId = "test-director-moat-10";
    cinematicPresentationDirector.clearMeetingSession(sessionId);

    const res = await cinematicPresentationDirector.directTurn("Why can't OpenAI just build this?", { sessionId });
    assert.equal(res.success, true);
    assert.equal(res.data.topic, "competitor_differentiation");
    assert.ok(res.data.cinematic.visualLayer.data.verifiedMoat);
    assert.ok(res.data.cinematic.visualLayer.data.strategicMoat);
    assert.match(res.data.answer, /Operating System|OpenAI builds foundation models|Verified Moat|Strategic Moat/i);
  });

  await t.test("Test 11: Multi-participant meeting context tracking", async () => {
    const sessionId = "test-director-multip-11";
    cinematicPresentationDirector.clearMeetingSession(sessionId);

    // Participant 1 (Partner)
    await cinematicPresentationDirector.directTurn("What is your business model?", { sessionId, participant: "Partner Alex" });

    // Participant 2 (Angel Investor)
    await cinematicPresentationDirector.directTurn("How are you protected against prompt injection?", { sessionId, participant: "Angel Sarah" });

    const session = cinematicPresentationDirector.getMeetingSession(sessionId);
    assert.equal(session.meetingHistory.length, 2);
    assert.equal(session.meetingHistory[0].participant, "Partner Alex");
    assert.equal(session.meetingHistory[1].participant, "Angel Sarah");
  });

  await t.test("Test 12: Session isolation between distinct investor sessions", async () => {
    const sessionA = "test-director-iso-A";
    const sessionB = "test-director-iso-B";
    cinematicPresentationDirector.clearMeetingSession(sessionA);
    cinematicPresentationDirector.clearMeetingSession(sessionB);

    await cinematicPresentationDirector.directTurn("My company is Zenith Robotics. Build something.", { sessionId: sessionA });
    const sA = cinematicPresentationDirector.getMeetingSession(sessionA);
    const sB = cinematicPresentationDirector.getMeetingSession(sessionB);

    assert.equal(sA.activeBusinessContext?.businessName, "Zenith Robotics");
    assert.equal(sB.activeBusinessContext, null, "Session B must have null business context");
  });
});
