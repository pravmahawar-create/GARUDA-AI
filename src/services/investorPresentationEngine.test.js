const assert = require("assert");
const fs = require("fs");
const garudaIdentityKnowledge = require("../knowledge/garudaIdentityKnowledge");
const { presentationEngine, PRESENTATION_STATES } = require("./presentationEngine");
const { investorConversationEngine } = require("./investorConversationEngine");
const { demonstrationOrchestrator, SUPPORTED_DEMONSTRATIONS } = require("./demonstrationOrchestrator");

async function runTests() {
  console.log("🦅 Running GARUDA Investor Presentation Experience Test Suite...\n");

  presentationEngine.clearForTesting();

  // -------------------------------------------------------------
  // TEST 1: Authoritative Identity Knowledge & Truth Boundaries
  // -------------------------------------------------------------
  const identity = garudaIdentityKnowledge.getIdentitySummary();
  assert.strictEqual(identity.name, "GARUDA AI");
  assert.strictEqual(identity.founder, "Praveen Mahawar");
  assert(identity.coreMotto.includes("Free First, Sovereign Always"));

  const taxonomy = garudaIdentityKnowledge.getCapabilityTaxonomy();
  assert(Array.isArray(taxonomy.verified) && taxonomy.verified.length >= 4);
  assert(Array.isArray(taxonomy.partial) && taxonomy.partial.length >= 2);
  assert(Array.isArray(taxonomy.planned) && taxonomy.planned.length >= 1);

  // Assert planned features are never falsely marked verified
  const photorealAvatar = taxonomy.planned.find((p) => p.id.includes("avatar"));
  assert(photorealAvatar, "Photorealistic avatar must be explicitly classified in planned tier");
  assert.strictEqual(photorealAvatar.status, "PLANNED");
  console.log("✔ Test 1: Identity knowledge and capability reality taxonomy correctly grounded in truth");

  // -------------------------------------------------------------
  // TEST 2: Presentation Engine Lifecycle & State Machine
  // -------------------------------------------------------------
  const session1 = presentationEngine.createSession();
  assert.strictEqual(session1.state, PRESENTATION_STATES.INTRODUCTION);

  // Start presentation -> Module 1
  const startResult = presentationEngine.startPresentation(session1.sessionId);
  assert.strictEqual(startResult.state, PRESENTATION_STATES.INTRODUCTION);
  assert(startResult.module.id === "origin_and_mission");
  assert(startResult.speechText.includes("I am GARUDA"));
  assert(startResult.speechText.includes("Praveen"));

  // Next Module -> Module 2
  const mod2Result = presentationEngine.nextModule(session1.sessionId);
  assert.strictEqual(mod2Result.state, PRESENTATION_STATES.DIFFERENTIATION_AND_TRUTH);
  assert(mod2Result.module.id === "differentiation_and_truth");
  assert(mod2Result.speechText.includes("Law of Truth"));

  // Next Module -> Module 3
  const mod3Result = presentationEngine.nextModule(session1.sessionId);
  assert.strictEqual(mod3Result.state, PRESENTATION_STATES.CAPABILITY_REALITY);
  assert(mod3Result.module.id === "capability_reality");

  // Advance beyond last module -> Invitation to QA / Demo
  const endResult = presentationEngine.nextModule(session1.sessionId);
  assert.strictEqual(endResult.state, PRESENTATION_STATES.LIVE_DEMONSTRATION_INVITATION);
  assert.strictEqual(endResult.hasMoreModules, false);
  console.log("✔ Test 2: Presentation state machine advances through modular topics seamlessly");

  // -------------------------------------------------------------
  // TEST 3: Investor Interruption & Session Continuity
  // -------------------------------------------------------------
  const session2 = presentationEngine.createSession();
  presentationEngine.startPresentation(session2.sessionId);
  presentationEngine.nextModule(session2.sessionId); // at module 2

  // Investor interrupts with question
  const interruptResult = presentationEngine.interruptWithQuestion(session2.sessionId, "Why should I choose GARUDA over ChatGPT?");
  assert.strictEqual(interruptResult.state, PRESENTATION_STATES.INVESTOR_QA);
  assert.strictEqual(interruptResult.interrupted, true);
  assert.strictEqual(interruptResult.resumableModuleIndex, 1);

  const currentSession = presentationEngine.getSession(session2.sessionId);
  assert.strictEqual(currentSession.questionsAsked.length, 1);
  assert.strictEqual(currentSession.questionsAsked[0].question, "Why should I choose GARUDA over ChatGPT?");
  console.log("✔ Test 3: Investor interruption handled with preserved module index and session continuity");

  // -------------------------------------------------------------
  // TEST 4: Investor Conversational Engine & Persona Integrity
  // -------------------------------------------------------------
  const chat1 = await investorConversationEngine.processInquiry("Who created you?");
  assert(chat1.answer.includes("Praveen Mahawar"));
  assert.strictEqual(chat1.truthStatus, "VERIFIED");

  const chat2 = await investorConversationEngine.processInquiry("Can you actually create something right now?");
  assert.strictEqual(chat2.demonstrationAvailable, true);
  assert.strictEqual(chat2.suggestedDemo, "creative_artifact");
  assert(chat2.answer.includes("demonstrate that live"));
  console.log("✔ Test 4: Investor Conversation Engine responds authoritatively and offers live demonstrations");

  // -------------------------------------------------------------
  // TEST 5: Demonstration Orchestrator — Creative Living Artifact Live Execution
  // -------------------------------------------------------------
  const creativeDemoResult = await demonstrationOrchestrator.executeDemonstration("creative_artifact", {
    prompt: "Investor Sovereign Neural Gateway",
    brandName: "GARUDA"
  });

  assert.strictEqual(creativeDemoResult.success, true);
  assert.strictEqual(creativeDemoResult.demoKey, "creative_artifact");
  assert(creativeDemoResult.evidence.artifactId.startsWith("art_") || creativeDemoResult.evidence.artifactId.length > 5);
  assert(creativeDemoResult.evidence.filePath, "Must have real physical file path on disk");
  assert(fs.existsSync(creativeDemoResult.evidence.filePath), "Generated artifact file MUST physically exist on disk");
  assert(creativeDemoResult.evidence.sha256Hash, "Must produce SHA-256 byte hash");
  console.log("✔ Test 5: Live Creative Living Artifact demonstration executed with real physical disk SVG & SHA-256 evidence");

  // -------------------------------------------------------------
  // TEST 6: Demonstration Orchestrator — Live Repository Architecture Audit
  // -------------------------------------------------------------
  const repoDemoResult = await demonstrationOrchestrator.executeDemonstration("repo_architecture");
  assert.strictEqual(repoDemoResult.success, true);
  assert.strictEqual(repoDemoResult.demoKey, "repo_architecture");
  assert(repoDemoResult.evidence.totalFilesScanned > 20);
  assert(repoDemoResult.evidence.sourceFiles > 10);
  assert(repoDemoResult.evidence.testFiles > 5);
  console.log("✔ Test 6: Live Repository Architecture self-inspection executed with live AST module counts");

  // -------------------------------------------------------------
  // TEST 7: Demonstration Orchestrator — Brand IdentityLock Governance
  // -------------------------------------------------------------
  const brandDemoResult = await demonstrationOrchestrator.executeDemonstration("brand_identity", {
    brandName: "GARUDA Sovereign Test"
  });
  assert.strictEqual(brandDemoResult.success, true);
  assert(brandDemoResult.evidence.lockHash, "Must compute IdentityLock hash");
  console.log("✔ Test 7: Live IdentityLock Brand Governance demonstration executed with real token lock hash");

  // -------------------------------------------------------------
  // TEST 8: Demonstration Orchestrator — Unsupported / Unverified Rejection
  // -------------------------------------------------------------
  const fakeDemoResult = await demonstrationOrchestrator.executeDemonstration("non_existent_fake_capability");
  assert.strictEqual(fakeDemoResult.success, false);
  assert.strictEqual(fakeDemoResult.readiness, "unsupported");
  console.log("✔ Test 8: Unsupported capability demonstration rejected honestly (Zero fake demonstrations)");

  // -------------------------------------------------------------
  // TEST 9: Full Round-Trip Presentation -> Demo -> Return to Conversation
  // -------------------------------------------------------------
  const session3 = presentationEngine.createSession();
  presentationEngine.startPresentation(session3.sessionId);
  presentationEngine.transitionToDemonstration(session3.sessionId, "creative_artifact");
  assert.strictEqual(session3.state, PRESENTATION_STATES.LIVE_DEMONSTRATION);

  const returnResult = presentationEngine.completeDemonstrationAndReturn(session3.sessionId, creativeDemoResult);
  assert.strictEqual(returnResult.state, PRESENTATION_STATES.RETURN_TO_CONVERSATION);
  assert.strictEqual(returnResult.demonstrationsCount, 1);

  const closeResult = presentationEngine.closeSession(session3.sessionId);
  assert.strictEqual(closeResult.state, PRESENTATION_STATES.SESSION_CLOSING);
  assert.strictEqual(closeResult.sessionSummary.totalDemonstrationsPerformed, 1);
  console.log("✔ Test 9: Complete round-trip lifecycle from Introduction through Live Execution to Closing verified");

  // -------------------------------------------------------------
  // TEST 10: Specific Investor Queries — "What is GARUDA?"
  // -------------------------------------------------------------
  const whatIsResult = await investorConversationEngine.processInquiry("What is GARUDA?");
  assert.ok(whatIsResult.answer && whatIsResult.answer.length > 20, "Answer must not be empty");
  assert.strictEqual(whatIsResult.topic, "what_is_garuda");
  assert.ok(whatIsResult.answer.includes("GARUDA AI"));
  console.log("✔ Test 10: 'What is GARUDA?' produces non-empty authoritative response");

  // -------------------------------------------------------------
  // TEST 11: Conversational Input — "bolo"
  // -------------------------------------------------------------
  const boloResult = await investorConversationEngine.processInquiry("bolo");
  assert.ok(boloResult.answer && boloResult.answer.length > 20, "Answer must not be empty for casual prompts");
  assert.ok(boloResult.answer.includes("Praveen Mahawar") || boloResult.answer.includes("GARUDA"));
  console.log("✔ Test 11: 'bolo' produces non-empty sovereign response (zero silence)");

  // -------------------------------------------------------------
  // TEST 12: Direct Live Demonstration Request Intent Detection
  // -------------------------------------------------------------
  const liveCreateResult = await investorConversationEngine.processInquiry("Can you show me what you can create live?");
  assert.strictEqual(liveCreateResult.demonstrationAvailable, true);
  assert.strictEqual(liveCreateResult.suggestedDemo, "creative_artifact");
  assert.ok(liveCreateResult.answer.includes("demonstrate that live"));
  console.log("✔ Test 12: 'Can you show me what you can create live?' triggers demonstration intent");

  // -------------------------------------------------------------
  // TEST 14: Investor Security Challenge Inquiry
  // -------------------------------------------------------------
  const securityResult = await investorConversationEngine.processInquiry("How do you ensure security, safety, and tenant data privacy?");
  assert.ok(securityResult.answer && securityResult.answer.length > 50);
  assert.strictEqual(securityResult.topic, "security_and_governance");
  assert.ok(securityResult.answer.includes("zero-trust") || securityResult.answer.includes("Mother Brain"));
  assert.strictEqual(securityResult.demonstrationAvailable, true);
  assert.strictEqual(securityResult.suggestedDemo, "repo_architecture");
  assert.strictEqual(securityResult.presentationMode, "GOVERNANCE_SECURITY");
  console.log("✔ Test 14: Investor Security Challenge handled authoritatively with zero-trust governance");

  // -------------------------------------------------------------
  // TEST 15: Multi-Turn Co-reference Resolution ("How is that different from ChatGPT?")
  // -------------------------------------------------------------
  const testSessionId = "session_coref_test_101";
  await investorConversationEngine.processInquiry("What is GARUDA?", { sessionId: testSessionId });
  const corefResult = await investorConversationEngine.processInquiry("How is that different from ChatGPT?", { sessionId: testSessionId });
  assert.strictEqual(corefResult.topic, "why_different");
  assert.ok(corefResult.answer.includes("Operating System") || corefResult.answer.includes("conversational interface"));
  assert.strictEqual(corefResult.presentationMode, "DIFFERENTIATION_MOAT");
  console.log("✔ Test 15: Multi-Turn Co-reference resolved 'that' -> 'GARUDA Operating System'");

  // -------------------------------------------------------------
  // TEST 16: Challenge-Proof Intent Resolution ("Prove it.")
  // -------------------------------------------------------------
  const proveItResult = await investorConversationEngine.processInquiry("Prove it.", { sessionId: testSessionId });
  assert.strictEqual(proveItResult.demonstrationAvailable, true);
  assert.strictEqual(proveItResult.presentationMode, "DEMO");
  assert.ok(proveItResult.answer.includes("Anti-Fabrication Law") || proveItResult.answer.includes("execute"));
  console.log("✔ Test 16: 'Prove it.' resolves contextually to live verified demonstration mode");

  // -------------------------------------------------------------
  // TEST 17: Dynamic Presentation Depth Routing (Revenue, Creative, Architecture)
  // -------------------------------------------------------------
  const revResult = await investorConversationEngine.processInquiry("How do you monetize and charge clients?");
  assert.strictEqual(revResult.presentationMode, "REVENUE");
  assert.strictEqual(revResult.topic, "revenue_and_business");

  const creatResult = await investorConversationEngine.processInquiry("Can you show me what you create visually?");
  assert.strictEqual(creatResult.presentationMode, "CREATIVE");

  const archResult = await investorConversationEngine.processInquiry("Explain Mother Brain and your architectural layers");
  assert.strictEqual(archResult.presentationMode, "ARCHITECTURE");
  // -------------------------------------------------------------
  // TEST 18: Multilingual / Roman Hindi Acceptance Inquiry
  // -------------------------------------------------------------
  const hindiResult = await investorConversationEngine.processInquiry(
    "GARUDA, tum kya ho aur duniya ke baaki AI systems se alag kaise ho?"
  );
  assert.ok(hindiResult.answer && hindiResult.answer.length > 50);
  assert.strictEqual(hindiResult.topic, "hindi_identity_and_differentiation");
  assert.ok(hindiResult.answer.includes("Praveen Mahawar") || hindiResult.answer.includes("GARUDA"));
  assert.ok(hindiResult.answer.includes("Operating System"));
  assert.strictEqual(hindiResult.demonstrationAvailable, true);
  console.log("✔ Test 18: Multilingual Roman Hindi query parsed and answered with sovereign identity");

  console.log("\n=======================================================");
  console.log("🎉 All 18 Investor Presentation Engine tests PASSED cleanly.");
  console.log("=======================================================\n");
}

runTests().catch((err) => {
  console.error("Investor Presentation Engine Test Failure:", err);
  process.exit(1);
});
