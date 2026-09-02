/**
 * 🦅 GARUDA AI — Intelligent Conversation Brain V1 Test Suite
 *
 * Mandatory Verification Matrix:
 * - Test 1: General Question ("What is SHA-256?" → Explains SHA-256 without forced identity boilerplate)
 * - Test 2: Follow-up Context ("Why do you use it?" → Resolves 'it' to SHA-256)
 * - Test 3: Language + Context ("Explain that in Hindi" → Retains SHA-256 topic in Hindi)
 * - Test 4: GARUDA Knowledge ("tumhara architecture kya hai?" → Authoritative Mother Brain knowledge)
 * - Test 5: Truth-Aware Differentiation ("How are you different from ChatGPT?" → Show > Tell, AST, Truth Law)
 * - Test 6: Unverified Capability ("Can you generate a full Hollywood movie right now?" → Honest rejection)
 * - Test 7: Verified Demonstration ("Show me something you can actually prove" → Offers verified demo)
 * - Test 8: Contextual Proof ("Prove it." → Contextually resolves to proof challenge)
 * - Test 9: Execution Context ("Do it." → Executes verified capability live on disk with SHA-256 evidence)
 * - Test 10: Provider Failure Fallback (Simulated failure → Non-empty grounded fallback)
 * - Test 11: Session Isolation (Session A context is strictly isolated from Session B)
 * - Test 12: Multi-Turn Language Switch (English → Hindi → Roman Hindi → English retains topic)
 * - Test 13: Engineering Mission Bridge (Recognizes engineering intent and structures mission)
 */

const test = require("node:test");
const assert = require("node:assert/strict");
const { conversationBrainService, CONVERSATION_INTENTS } = require("./conversationBrainService");

test("🧠 Intelligent Conversation Brain V1 Test Suite", async (t) => {

  await t.test("Test 1: General Question — What is SHA-256? produces accurate conceptual explanation", async () => {
    const sessionId = "test-session-general-1";
    conversationBrainService.clearSession(sessionId);

    const res = await conversationBrainService.process("What is SHA-256?", { sessionId });
    assert.equal(res.success, true);
    assert.equal(res.data.intent, CONVERSATION_INTENTS.ANSWER_ONLY);
    assert.equal(res.data.topic, "sha_256");

    // Must contain cryptographic explanation of SHA-256
    assert.match(res.data.answer, /cryptographic hash function|256-bit|Secure Hash Algorithm/i);
    // Must NOT start with generic forced identity boilerplate
    assert.doesNotMatch(res.data.answer.slice(0, 50), /^GARUDA is an autonomous/i);
  });

  await t.test("Test 2: Follow-up Context — 'Why do you use it?' resolves 'it' to SHA-256", async () => {
    const sessionId = "test-session-coref-2";
    conversationBrainService.clearSession(sessionId);

    // Turn 1
    await conversationBrainService.process("What is SHA-256?", { sessionId });

    // Turn 2
    const res2 = await conversationBrainService.process("Why do you use it?", { sessionId });
    assert.equal(res2.success, true);
    assert.equal(res2.data.topic, "sha_256");
    assert.match(res2.data.answer, /Anti-Fabrication Law|evidence|hash|Living Artifact/i);
  });

  await t.test("Test 3: Language + Context — 'Explain that in Hindi' retains SHA-256 topic in Hindi", async () => {
    const sessionId = "test-session-lang-3";
    conversationBrainService.clearSession(sessionId);

    // Turn 1
    await conversationBrainService.process("What is SHA-256?", { sessionId });

    // Turn 2
    const res2 = await conversationBrainService.process("Explain that in Hindi.", { sessionId });
    assert.equal(res2.success, true);
    assert.equal(res2.data.topic, "sha_256");
    assert.ok(res2.data.language === "hi" || res2.data.language === "roman_hindi");
    // Hindi content should explain SHA-256
    assert.match(res2.data.answer, /256|हैश|क्रिप्टोग्राफिक|फंक्शन|hash/i);
  });

  await t.test("Test 4: GARUDA Knowledge — 'tumhara architecture kya hai?' returns authoritative Mother Brain knowledge", async () => {
    const sessionId = "test-session-arch-4";
    conversationBrainService.clearSession(sessionId);

    const res = await conversationBrainService.process("tumhara architecture kya hai?", { sessionId });
    assert.equal(res.success, true);
    assert.ok(res.data.topic === "mother_brain" || res.data.topic === "architecture_and_mother_brain");
    assert.equal(res.data.language, "roman_hindi");
    assert.match(res.data.answer, /Mother Brain|Praveen Mahawar|universes|governance/i);
  });

  await t.test("Test 5: Truth-Aware Differentiation — 'How are you different from ChatGPT?' returns factual capabilities", async () => {
    const sessionId = "test-session-diff-5";
    conversationBrainService.clearSession(sessionId);

    const res = await conversationBrainService.process("How are you different from ChatGPT?", { sessionId });
    assert.equal(res.success, true);
    assert.ok(res.data.topic === "why_different" || res.data.topic === "vs_chatgpt_or_wrappers");
    assert.equal(res.data.truthStatus, "VERIFIED");
    assert.match(res.data.answer, /Operating System|codebase|test|execute|Show > Tell|Anti-Fabrication/i);
  });

  await t.test("Test 6: Unverified Capability — 'Can you generate a full Hollywood movie right now?' honestly rejected", async () => {
    const sessionId = "test-session-unverified-6";
    conversationBrainService.clearSession(sessionId);

    const res = await conversationBrainService.process("Can you generate a full Hollywood movie right now?", { sessionId });
    assert.equal(res.success, true);
    assert.equal(res.data.truthStatus, "UNAVAILABLE");
    assert.match(res.data.answer, /Anti-Fabrication Law|cannot claim|verified creative capabilities|Living Vector Artifacts/i);
  });

  await t.test("Test 7: Verified Demonstration — 'Show me something you can actually prove' offers verified demo", async () => {
    const sessionId = "test-session-demo-7";
    conversationBrainService.clearSession(sessionId);

    const res = await conversationBrainService.process("Show me something you can actually prove.", { sessionId });
    assert.equal(res.success, true);
    assert.equal(res.data.intent, CONVERSATION_INTENTS.OFFER_DEMONSTRATION);
    assert.equal(res.data.demonstrationAvailable, true);
    assert.ok(res.data.suggestedDemo);
    assert.match(res.data.answer, /Anti-Fabrication Law|physical verification|execute/i);
  });

  await t.test("Test 8: Contextual Proof — 'Prove it.' resolves contextually to proof challenge", async () => {
    const sessionId = "test-session-prove-8";
    conversationBrainService.clearSession(sessionId);

    // Turn 1
    await conversationBrainService.process("What is your repository architecture?", { sessionId });

    // Turn 2
    const res2 = await conversationBrainService.process("Prove it.", { sessionId });
    assert.equal(res2.success, true);
    assert.equal(res2.data.intent, CONVERSATION_INTENTS.OFFER_DEMONSTRATION);
    assert.equal(res2.data.demonstrationAvailable, true);
  });

  await t.test("Test 9: Execution Context — 'Do it.' executes verified capability live on disk with SHA-256 evidence", async () => {
    const sessionId = "test-session-exec-9";
    conversationBrainService.clearSession(sessionId);

    // Turn 1: Set capability context
    await conversationBrainService.process("Show me what you can create live", { sessionId });

    // Turn 2: Trigger execution
    const res2 = await conversationBrainService.process("Do it.", { sessionId });
    assert.equal(res2.success, true);
    assert.equal(res2.data.intent, CONVERSATION_INTENTS.EXECUTE_CAPABILITY);
    assert.ok(res2.data.executionResult);
    assert.equal(res2.data.executionResult.success, true);
    assert.ok(res2.data.evidence?.sha256Hash, "Must provide real cryptographic SHA-256 evidence");
    assert.match(res2.data.answer, /Execution complete|SHA-256/i);
  });

  await t.test("Test 10: Provider Failure Fallback — returns non-empty honest grounded response", async () => {
    const sessionId = "test-session-fallback-10";
    conversationBrainService.clearSession(sessionId);

    // Unindexed custom query with no external LLM configured
    const res = await conversationBrainService.process("What are the cosmological dynamics of quantum strings?", { sessionId });
    assert.equal(res.success, true);
    assert.ok(res.data.answer && res.data.answer.length > 20);
    assert.equal(res.data.truthStatus, "VERIFIED");
    assert.equal(res.data.observability.fallbackUsed, true);
  });

  await t.test("Test 11: Session Isolation — Session A context is strictly isolated from Session B", async () => {
    const sessionA = "test-session-isolation-A";
    const sessionB = "test-session-isolation-B";
    conversationBrainService.clearSession(sessionA);
    conversationBrainService.clearSession(sessionB);

    // Session A talks about SHA-256
    await conversationBrainService.process("What is SHA-256?", { sessionId: sessionA });

    // Session B asks a bare pronoun question without prior context
    const resB = await conversationBrainService.process("Why do you use it?", { sessionId: sessionB });
    assert.equal(resB.success, true);
    // Session B should not know about SHA-256 from Session A
    const sB = conversationBrainService.getSession(sessionB);
    assert.notEqual(sB.currentTopic, "sha_256", "Session B must not inherit Session A's topic");
  });

  await t.test("Test 12: Multi-Turn Language Switch — English → Hindi → Roman Hindi → English retains topic", async () => {
    const sessionId = "test-session-multilang-12";
    conversationBrainService.clearSession(sessionId);

    // Turn 1: English
    const turn1 = await conversationBrainService.process("What is SHA-256?", { sessionId });
    assert.equal(turn1.data.topic, "sha_256");

    // Turn 2: Hindi
    const turn2 = await conversationBrainService.process("Explain that in Hindi.", { sessionId });
    assert.equal(turn2.data.topic, "sha_256");
    assert.ok(turn2.data.language === "hi" || turn2.data.language === "roman_hindi");

    // Turn 3: Roman Hindi
    const turn3 = await conversationBrainService.process("ab Roman Hindi me batao.", { sessionId });
    assert.equal(turn3.data.topic, "sha_256");
    assert.equal(turn3.data.language, "roman_hindi");

    // Turn 4: Back to English
    const turn4 = await conversationBrainService.process("English please.", { sessionId });
    assert.equal(turn4.data.topic, "sha_256");
    assert.equal(turn4.data.language, "en");
  });

  await t.test("Test 13: Engineering Mission Bridge — recognizes engineering intent and structures mission", async () => {
    const sessionId = "test-session-eng-13";
    conversationBrainService.clearSession(sessionId);

    const res = await conversationBrainService.process("Fix the bug in src/services/revenueService.js", { sessionId });
    assert.equal(res.success, true);
    assert.equal(res.data.intent, CONVERSATION_INTENTS.EXECUTE_ENGINEERING_MISSION);
    assert.equal(res.data.capabilitySelected, "engineering.execute_mission");
    assert.match(res.data.answer, /engineering goal|worktree/i);
  });

  await t.test("Test 14: Arbitrary Investor Questions — reasons from architecture rather than generic greetings", async () => {
    const sessionId = "test-session-arbitrary-14";
    conversationBrainService.clearSession(sessionId);

    const r1 = await conversationBrainService.process("Tum sirf answer dete ho ya actual kaam bhi karte ho?", { sessionId });
    assert.equal(r1.data.topic, "real_work_vs_answers");
    assert.match(r1.data.answer, /worktrees|execute|disk/i);

    const r2 = await conversationBrainService.process("Agar tum galat ho jao to kaise pata chalega?", { sessionId });
    assert.equal(r2.data.topic, "error_handling_and_self_correction");
    assert.match(r2.data.answer, /rollback|regression|backup/i);

    const r3 = await conversationBrainService.process("Tumhari sabse badi limitation kya hai?", { sessionId });
    assert.equal(r3.data.topic, "limitations_and_boundaries");
    assert.match(r3.data.answer, /Anti-Fabrication|PLANNED|PARTIAL/i);

    const r4 = await conversationBrainService.process("Agar founder approval na mile to kya karoge?", { sessionId });
    assert.equal(r4.data.topic, "founder_approval_gate");
    assert.match(r4.data.answer, /RESTRICTED|halt|read-only/i);

    const r5 = await conversationBrainService.process("Agar main tumhe ek logistics company doon to tum practically kya karoge?", { sessionId });
    assert.equal(r5.data.topic, "practical_business_logistics");
    assert.match(r5.data.answer, /fleet|tracking|logistics/i);
  });

  await t.test("Test 15: Artifact Lineage Recall — 'What did you just create?' describes the preceding materialized deliverable", async () => {
    const sessionId = "test-session-lineage-15";
    conversationBrainService.clearSession(sessionId);

    // Turn 1: Propose demo
    await conversationBrainService.process("Show me what you can create live", { sessionId });

    // Turn 2: Execute
    const execRes = await conversationBrainService.process("Do it.", { sessionId });
    assert.equal(execRes.data.intent, CONVERSATION_INTENTS.EXECUTE_CAPABILITY);
    assert.ok(execRes.data.evidence?.sha256Hash);

    // Turn 3: Follow-up on created artifact
    const recallRes = await conversationBrainService.process("What did you just create?", { sessionId });
    assert.equal(recallRes.data.topic, "created_artifact_summary");
    assert.match(recallRes.data.answer, /materialized|physical disk|evidence seal|SHA-256/i);
    assert.ok(recallRes.data.evidence?.sha256Hash);
  });
});
