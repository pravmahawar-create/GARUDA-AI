/**
 * GARUDA Public Chat Intelligence & Non-Commercial Greeting Verification Test Suite
 *
 * Verifies that:
 * 1. "Hi" / "Hello" / casual greetings do NOT trigger commercial proposals, quotes, or milestone scopes.
 * 2. General / technical questions are answered conversationally without unsolicited sales pitches.
 * 3. Initial incomplete project requests trigger progressive clarification (NEEDS_CLARIFICATION)
 *    without dumping premature quotes.
 * 4. Mature requirements or explicit proposal requests trigger structured scopes and proposals.
 * 5. Payment truth gate flags unverified payment claims properly.
 */

const assert = require("assert");
const publicChatCommercialAgent = require("./publicChatCommercialAgentService");
const publicChatHandler = require("../../api/public-chat");

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    passed += 1;
    console.log(`  ✔ PASS: ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`  ✖ FAIL: ${name}\n    ${error.stack || error.message}`);
  }
}

// Mock Express Req/Res
function createMockReqRes(body = {}, headers = {}) {
  const req = {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body,
    query: {}
  };
  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(k, v) { this.headers[k] = v; },
    status(code) { this.statusCode = code; return this; },
    json(data) { this.body = data; return this; },
    end() { return this; }
  };
  return { req, res };
}

async function runAllTests() {
  console.log("================================================================================");
  console.log("🦅 GARUDA PUBLIC CHAT INTELLIGENCE TEST SUITE");
  console.log("================================================================================\n");

  // ---------------------------------------------------------------------------
  // 1. "Hi" -> Natural Greeting, NOT commercial
  // ---------------------------------------------------------------------------
  await test('1. "Hi" does not trigger commercial proposal or quote', async () => {
    const commercialResult = await publicChatCommercialAgent.processCommercialTurn({ message: "Hi", history: [] });
    assert.strictEqual(commercialResult.handled, false, 'processCommercialTurn should return handled: false for "Hi"');

    const { req, res } = createMockReqRes({ message: "Hi", history: [] });
    await publicChatHandler(req, res);
    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.body && res.body.reply, "Response should have reply");
    assert.strictEqual(res.body.proposalUrl, undefined, 'No proposal URL on "Hi"');
    assert.strictEqual(res.body.proposalId, undefined, 'No proposal ID on "Hi"');
    assert.ok(!res.body.reply.includes("Estimated Investment"), 'Must not output investment estimate on "Hi"');
    assert.ok(!res.body.reply.includes("Milestone Schedule"), 'Must not output milestone schedule on "Hi"');
    assert.ok(/hello|hi|garuda|help/i.test(res.body.reply), "Should naturally greet the user");
  });

  // ---------------------------------------------------------------------------
  // 2. "Hello" -> Natural Greeting, NOT commercial
  // ---------------------------------------------------------------------------
  await test('2. "Hello" does not trigger commercial proposal or quote', async () => {
    const commercialResult = await publicChatCommercialAgent.processCommercialTurn({ message: "Hello", history: [] });
    assert.strictEqual(commercialResult.handled, false, 'processCommercialTurn should return handled: false for "Hello"');

    const { req, res } = createMockReqRes({ message: "Hello", history: [] });
    await publicChatHandler(req, res);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.proposalUrl, undefined);
    assert.ok(!res.body.reply.includes("Estimated Investment"));
    assert.ok(!res.body.reply.includes("Milestone Schedule"));
  });

  // ---------------------------------------------------------------------------
  // 3. "What can you do?" -> Capability explanation, NOT commercial proposal
  // ---------------------------------------------------------------------------
  await test('3. "What can you do?" explains capabilities without dumping a quote', async () => {
    const commercialResult = await publicChatCommercialAgent.processCommercialTurn({ message: "What can you do?", history: [] });
    assert.strictEqual(commercialResult.handled, false);

    const { req, res } = createMockReqRes({ message: "What can you do?", history: [] });
    await publicChatHandler(req, res);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.proposalUrl, undefined);
    assert.ok(!res.body.reply.includes("Estimated Investment: INR"));
    assert.ok(res.body.reply.toLowerCase().includes("garuda") || res.body.reply.toLowerCase().includes("ai"), "Should introduce capabilities");
  });

  // ---------------------------------------------------------------------------
  // 4. Casual Conversation ("How are you?") -> Friendly response
  // ---------------------------------------------------------------------------
  await test('4. "How are you?" handles casual conversation naturally', async () => {
    const commercialResult = await publicChatCommercialAgent.processCommercialTurn({ message: "How are you?", history: [] });
    assert.strictEqual(commercialResult.handled, false);

    const { req, res } = createMockReqRes({ message: "How are you?", history: [] });
    await publicChatHandler(req, res);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.proposalUrl, undefined);
    assert.ok(!res.body.reply.includes("Estimated Investment"));
  });

  // ---------------------------------------------------------------------------
  // 5. Technical Question ("Explain vector database in RAG") -> Answer intelligently
  // ---------------------------------------------------------------------------
  await test('5. Technical question answered intelligently without commercial sales flow', async () => {
    const commercialResult = await publicChatCommercialAgent.processCommercialTurn({
      message: "Explain how vector databases work in RAG systems",
      history: []
    });
    assert.strictEqual(commercialResult.handled, false);

    const { req, res } = createMockReqRes({ message: "Explain how vector databases work in RAG systems", history: [] });
    await publicChatHandler(req, res);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.proposalUrl, undefined);
    assert.ok(!res.body.reply.includes("Estimated Investment: INR"));
  });

  // ---------------------------------------------------------------------------
  // 6. "I want to build an AI app" -> Progressive clarification (NEEDS_CLARIFICATION)
  // ---------------------------------------------------------------------------
  await test('6. "I want to build an AI app" asks clarifying discovery questions without dumping a quote', async () => {
    const commercialResult = await publicChatCommercialAgent.processCommercialTurn({
      message: "I want to build an AI app",
      history: []
    });
    assert.strictEqual(commercialResult.handled, true, "Commercial intent must be detected");
    assert.strictEqual(commercialResult.qualification, "NEEDS_CLARIFICATION", "Should qualify as NEEDS_CLARIFICATION");
    assert.ok(commercialResult.reply.includes("clarity on a couple of details") || commercialResult.reply.includes("core features"), "Must ask discovery questions");
    assert.ok(!commercialResult.reply.includes("Estimated Investment:"), "Must NOT dump an investment quote before requirements are gathered");
    assert.strictEqual(commercialResult.proposalUrl, null, "Must NOT generate a proposal link prematurely");
  });

  // ---------------------------------------------------------------------------
  // 7. Incomplete Business Requirement ("Need a custom website") -> Requirements Gathering
  // ---------------------------------------------------------------------------
  await test('7. Incomplete business requirement triggers structured discovery questions', async () => {
    const commercialResult = await publicChatCommercialAgent.processCommercialTurn({
      message: "Need a custom website for my business",
      history: []
    });
    assert.strictEqual(commercialResult.handled, true);
    assert.strictEqual(commercialResult.qualification, "NEEDS_CLARIFICATION");
    assert.ok(!commercialResult.reply.includes("Estimated Investment:"));
  });

  // ---------------------------------------------------------------------------
  // 8. Explicit Pricing Request ("How much does a SaaS MVP cost?") -> Scoping & Pricing
  // ---------------------------------------------------------------------------
  await test('8. Explicit pricing request provides transparent architectural scope & price', async () => {
    const commercialResult = await publicChatCommercialAgent.processCommercialTurn({
      message: "How much would it cost to build a custom SaaS MVP with user auth and Stripe payments?",
      history: []
    });
    assert.strictEqual(commercialResult.handled, true);
    assert.ok(commercialResult.reply.includes("Estimated Investment:"), "Must provide estimated investment for explicit pricing query");
    assert.ok(commercialResult.reply.includes("Milestone Schedule:"), "Must include milestone schedule");
    assert.strictEqual(commercialResult.qualification, "CLEARLY_DELIVERABLE");
  });

  // ---------------------------------------------------------------------------
  // 9. Explicit Proposal Request ("Send me a proposal for a WhatsApp bot") -> Formal Proposal
  // ---------------------------------------------------------------------------
  await test('9. Explicit proposal request generates a formal proposal with link', async () => {
    const commercialResult = await publicChatCommercialAgent.processCommercialTurn({
      message: "Please send me a proposal to build an automated WhatsApp bot for booking appointments",
      history: []
    });
    assert.strictEqual(commercialResult.handled, true);
    assert.strictEqual(commercialResult.qualification, "CLEARLY_DELIVERABLE");
    assert.ok(commercialResult.reply.includes("GARUDA Architectural Scope"), "Must output architectural scope");
    assert.ok(commercialResult.proposalUrl || commercialResult.reply.includes("proposal"), "Must include proposal link or proposal confirmation");
  });

  // ---------------------------------------------------------------------------
  // 10. Multi-turn Conversation (Greeting -> Requirement -> Details -> Scope)
  // ---------------------------------------------------------------------------
  await test('10. Multi-turn conversation flows naturally from greeting to requirements to scope', async () => {
    // Turn 1: Greeting
    const turn1 = await publicChatCommercialAgent.processCommercialTurn({ message: "Hi there", history: [] });
    assert.strictEqual(turn1.handled, false, "Turn 1 greeting must be handled by conversational AI");

    // Turn 2: User expresses intent
    const historyAfterTurn1 = [
      { role: "user", text: "Hi there" },
      { role: "assistant", text: "Hello! I am GARUDA. How can I help you today?" }
    ];
    const turn2 = await publicChatCommercialAgent.processCommercialTurn({
      message: "I want to build a mobile app for grocery delivery",
      history: historyAfterTurn1
    });
    assert.strictEqual(turn2.handled, true);
    assert.strictEqual(turn2.qualification, "NEEDS_CLARIFICATION", "Turn 2 should ask discovery questions");

    // Turn 3: User provides specific requirements
    const historyAfterTurn2 = [
      ...historyAfterTurn1,
      { role: "user", text: "I want to build a mobile app for grocery delivery" },
      { role: "assistant", text: turn2.reply }
    ];
    const turn3 = await publicChatCommercialAgent.processCommercialTurn({
      message: "It should be for iOS and Android with user auth, Razorpay payments, real-time tracking, and our budget is ₹60,000",
      history: historyAfterTurn2
    });
    assert.strictEqual(turn3.handled, true);
    assert.strictEqual(turn3.qualification, "CLEARLY_DELIVERABLE", "Turn 3 with complete requirements qualifies as clearly deliverable");
    assert.ok(turn3.reply.includes("Estimated Investment:"), "Turn 3 should provide architectural scope and quote");
    assert.ok(turn3.reply.includes("60,000"), "Turn 3 should reflect user budget");
  });

  // ---------------------------------------------------------------------------
  // 11. Payment Truth Gate
  // ---------------------------------------------------------------------------
  await test('11. Payment claims are intercepted by Payment Truth Gate', async () => {
    const paymentClaim = await publicChatCommercialAgent.processCommercialTurn({
      message: "I have paid the 50% deposit via UPI ref 123456789",
      history: []
    });
    assert.strictEqual(paymentClaim.handled, true);
    assert.strictEqual(paymentClaim.qualification, "PAYMENT_CLAIM_UNVERIFIED");
    assert.ok(paymentClaim.reply.includes("PAYMENT_EVIDENCE_UNVERIFIED"), "Must enforce unverified evidence state");
  });

  console.log("\n================================================================================");
  console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("================================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
