/**
 * 🦅 GARUDA Event Nervous System Test Suite
 * Phase 3 — State & Event Architecture
 * Tests event contracts, multi-tier persistence, idempotency, chronological ordering,
 * metadata sanitization, and end-to-end integration with Phase 1 and Phase 2.
 */

const assert = require("assert");
const garudaEventService = require("./garudaEventService");
const { GARUDA_EVENT_TYPES, GARUDA_ENTITY_TYPES } = require("./garudaEventTypes");
const persistentProposalService = require("./persistentProposalService");
const governedProjectDeliveryService = require("./governedProjectDeliveryService");
const clientProposalService = require("./clientProposalService");
const proposalsHandler = require("../../api/proposals");

function mockReqRes(options = {}) {
  let statusCode = 200;
  let headers = {};
  let body = null;
  let ended = false;

  const req = {
    method: options.method || "GET",
    url: options.url || "/",
    headers: options.headers || {},
    query: options.query || {},
    body: options.body || {},
    socket: { remoteAddress: "127.0.0.1" }
  };

  const res = {
    setHeader: (k, v) => { headers[k] = v; },
    status: (code) => {
      statusCode = code;
      return res;
    },
    json: (data) => {
      body = data;
      ended = true;
      return data;
    },
    end: (d) => {
      if (d) body = d;
      ended = true;
    }
  };

  return { req, res, getStatus: () => statusCode, getBody: () => body, isEnded: () => ended };
}

async function runEventNervousSystemTests() {
  console.log("=== RUNNING GARUDA EVENT NERVOUS SYSTEM TEST SUITE ===");

  // -------------------------------------------------------------
  // TEST 1: Valid GARUDA Event Persisted Successfully
  // -------------------------------------------------------------
  console.log("\n--- TEST 1: Valid GARUDA Event Persistence ---");
  const emitRes = await garudaEventService.emitGarudaEvent({
    eventType: GARUDA_EVENT_TYPES.LEAD_CREATED,
    entityType: GARUDA_ENTITY_TYPES.LEAD,
    entityId: "lead_test_001",
    source: "unit_test",
    actor: { type: "system", id: "tester" },
    metadata: { service: "Custom Software", estimatedINR: 50000 }
  });

  assert.strictEqual(emitRes.success, true);
  assert.ok(emitRes.event.eventId.startsWith("evt_"), "Event ID must have standard prefix");
  assert.strictEqual(emitRes.event.eventType, "LEAD_CREATED");
  assert.ok(/^[a-f0-9]{64}$/i.test(emitRes.event.eventHash), "Event must have SHA-256 seal");
  console.log(`✔ Event Emitted & Sealed: ${emitRes.event.eventId} (Hash: ${emitRes.event.eventHash.slice(0, 16)}…)`);

  // -------------------------------------------------------------
  // TEST 2: Required Contract Fields Validated
  // -------------------------------------------------------------
  console.log("\n--- TEST 2: Event Contract Field Validation ---");
  let caughtMissingType = false;
  try {
    await garudaEventService.emitGarudaEvent({ entityType: "lead", entityId: "lead_123" });
  } catch (err) {
    caughtMissingType = true;
    assert.ok(err.message.includes("eventType"), "Must require eventType");
  }
  assert.strictEqual(caughtMissingType, true);

  let caughtMissingEntity = false;
  try {
    await garudaEventService.emitGarudaEvent({ eventType: "TEST_EVENT", entityId: "" });
  } catch (err) {
    caughtMissingEntity = true;
    assert.ok(err.message.includes("entityId"), "Must require entityId");
  }
  assert.strictEqual(caughtMissingEntity, true);
  console.log("✔ Strict contract validation enforced for mandatory fields.");

  // -------------------------------------------------------------
  // TEST 3: Historical Events Are Immutable
  // -------------------------------------------------------------
  console.log("\n--- TEST 3: Event Immutability ---");
  const originalOccurredAt = emitRes.event.occurredAt;
  const history = await garudaEventService.getEntityEventHistory("lead", "lead_test_001");
  assert.ok(history.length >= 1);
  const found = history.find(e => e.eventId === emitRes.event.eventId);
  assert.ok(found);
  assert.strictEqual(found.occurredAt, originalOccurredAt);
  assert.strictEqual(found.eventHash, emitRes.event.eventHash);
  console.log("✔ Historical event retrieved with identical cryptographic seal.");

  // -------------------------------------------------------------
  // TEST 4: Idempotency & Deduplication
  // -------------------------------------------------------------
  console.log("\n--- TEST 4: Idempotency & Deduplication ---");
  const idemKey = "pay_webhook_razorpay_998877";
  const firstEmit = await garudaEventService.emitGarudaEvent({
    eventType: GARUDA_EVENT_TYPES.PAYMENT_VERIFIED,
    entityType: GARUDA_ENTITY_TYPES.PAYMENT,
    entityId: "pay_998877",
    idempotencyKey: idemKey,
    metadata: { amount: 25000 }
  });
  assert.strictEqual(firstEmit.alreadyProcessed, false);

  // Second duplicate emit with same idempotency key
  const secondEmit = await garudaEventService.emitGarudaEvent({
    eventType: GARUDA_EVENT_TYPES.PAYMENT_VERIFIED,
    entityType: GARUDA_ENTITY_TYPES.PAYMENT,
    entityId: "pay_998877",
    idempotencyKey: idemKey,
    metadata: { amount: 25000 }
  });
  assert.strictEqual(secondEmit.alreadyProcessed, true);
  assert.strictEqual(secondEmit.event.eventId, firstEmit.event.eventId);
  console.log("✔ Duplicate event call handled idempotently with identical eventId.");

  // -------------------------------------------------------------
  // TEST 5 & 6: Real Payment Verified & Project Activated Emissions
  // -------------------------------------------------------------
  console.log("\n--- TEST 5 & 6: PAYMENT_VERIFIED & PROJECT_ACTIVATED Integration ---");
  const proposal = await clientProposalService.createProposal({
    title: "High-Throughput Telemetry Pipeline",
    requirements: "Build node.js telemetry ingestion service with HMAC signatures.",
    amount: 60000,
    currency: "INR",
    client: { name: "AdTech Global", email: "ops@adtech.com" }
  }, { founderApproved: true });

  const activated = await persistentProposalService.recordDepositAndActivateProject(proposal.proposalId, {
    paymentId: "pay_test_event_deposit_777",
    amountPaid: 30000,
    currency: "INR",
    provider: "razorpay"
  });

  const projectId = activated.project.projectId;

  // Retrieve event history for proposal
  const propEvents = await garudaEventService.getGarudaEvents({ proposalId: proposal.proposalId });
  const eventTypes = propEvents.map(e => e.eventType);
  assert.ok(eventTypes.includes("PROPOSAL_CREATED"), "Must contain PROPOSAL_CREATED");
  assert.ok(eventTypes.includes("PAYMENT_VERIFIED"), "Must contain PAYMENT_VERIFIED");
  assert.ok(eventTypes.includes("PROJECT_ACTIVATED"), "Must contain PROJECT_ACTIVATED");
  console.log(`✔ Proposal ${proposal.proposalId} emitted: ${eventTypes.join(" -> ")}`);

  // -------------------------------------------------------------
  // TEST 7: Governed Execution Planning Emits EXECUTION_PLANNED
  // -------------------------------------------------------------
  console.log("\n--- TEST 7: EXECUTION_PLANNED Emission ---");
  await governedProjectDeliveryService.initializeProjectExecution(projectId, { mode: "plan_only" });
  const projEvents = await garudaEventService.getProjectEventHistory(projectId);
  const projEventTypes = projEvents.map(e => e.eventType);
  assert.ok(projEventTypes.includes("EXECUTION_PLANNED"), "Must contain EXECUTION_PLANNED");
  console.log(`✔ Project ${projectId} event history contains EXECUTION_PLANNED`);

  // -------------------------------------------------------------
  // TEST 8: DELIVERY_READY Cannot Emit Without Evidence
  // -------------------------------------------------------------
  console.log("\n--- TEST 8: Anti-Fabrication Safeguard on DELIVERY_READY ---");
  let caughtFakeDelivery = false;
  try {
    await governedProjectDeliveryService.executeAndValidateDelivery(projectId, null, {
      executionOutput: { artifacts: [], testResults: [] }
    });
  } catch (err) {
    caughtFakeDelivery = true;
  }
  assert.strictEqual(caughtFakeDelivery, true, "Empty deliverables must reject before emitting DELIVERY_READY");

  // Now execute valid delivery
  const deliveryResult = await governedProjectDeliveryService.executeAndValidateDelivery(projectId);
  assert.strictEqual(deliveryResult.status, "DELIVERY_READY");

  const finalProjEvents = await garudaEventService.getProjectEventHistory(projectId);
  const finalTypes = finalProjEvents.map(e => e.eventType);
  assert.ok(finalTypes.includes("EXECUTION_RUNNING"));
  assert.ok(finalTypes.includes("DELIVERY_READY"));
  console.log(`✔ Truthful DELIVERY_READY emitted with verified seal.`);

  // -------------------------------------------------------------
  // TEST 9: Chronological Event History
  // -------------------------------------------------------------
  console.log("\n--- TEST 9: Chronological Ordering ---");
  const chronological = await garudaEventService.getProjectEventHistory(projectId);
  for (let i = 1; i < chronological.length; i++) {
    const prevTime = new Date(chronological[i - 1].occurredAt).getTime();
    const currTime = new Date(chronological[i].occurredAt).getTime();
    assert.ok(prevTime <= currTime, "Events must be in ascending chronological order");
  }
  console.log(`✔ ${chronological.length} project events verified in strict chronological order.`);

  // -------------------------------------------------------------
  // TEST 10: Recent Event Queries Are Bounded
  // -------------------------------------------------------------
  console.log("\n--- TEST 10: Bounded Recent Events ---");
  const recent = await garudaEventService.getRecentGarudaEvents(5);
  assert.ok(recent.length <= 5, "Must respect limit bound");
  console.log(`✔ Bounded query returned ${recent.length} recent events.`);

  // -------------------------------------------------------------
  // TEST 11: Sensitive Metadata Redaction
  // -------------------------------------------------------------
  console.log("\n--- TEST 11: Sensitive Metadata Redaction ---");
  const sensitiveEmit = await garudaEventService.emitGarudaEvent({
    eventType: "USER_AUTH_TEST",
    entityType: "system",
    entityId: "sec_test_01",
    metadata: {
      accountNumber: "ACC123",
      secretPassword: "MySuperSecretPassword123!",
      apiToken: "sk_live_998877665544",
      card_number: "4111222233334444"
    }
  });
  assert.strictEqual(sensitiveEmit.event.metadata.secretPassword, "[REDACTED]");
  assert.strictEqual(sensitiveEmit.event.metadata.apiToken, "[REDACTED]");
  assert.strictEqual(sensitiveEmit.event.metadata.card_number, "[REDACTED]");
  assert.strictEqual(sensitiveEmit.event.metadata.accountNumber, "ACC123");
  console.log("✔ Sensitive credentials redacted from event envelope.");

  // -------------------------------------------------------------
  // TEST 12: Existing Phase 1 Money Loop Remains Fully Working
  // -------------------------------------------------------------
  console.log("\n--- TEST 12: Phase 1 Money Loop Regression Verification ---");
  const testProp = await clientProposalService.createProposal({
    title: "AI Chatbot Integration",
    requirements: "Build customer service AI agent with WhatsApp webhook.",
    amount: 45000,
    client: { name: "RetailCorp" }
  }, { founderApproved: true });

  const acceptRes = await persistentProposalService.acceptProposal(testProp.proposalId, {
    name: "RetailCorp Founder"
  });
  assert.strictEqual(acceptRes.proposal.status, "CLIENT_ACCEPTED");

  const depositRes = await persistentProposalService.recordDepositAndActivateProject(testProp.proposalId, {
    paymentId: "pay_test_phase1_reg_001",
    amountPaid: 22500
  });
  assert.strictEqual(depositRes.project.status, "ACTIVE_IN_DEVELOPMENT");
  console.log("✔ Phase 1 Money Loop fully operational with zero regression.");

  // -------------------------------------------------------------
  // TEST 13: Query Events Via HTTP API (GET /api/proposals/:id/events)
  // -------------------------------------------------------------
  console.log("\n--- TEST 13: HTTP Event History API ---");
  const apiCall = mockReqRes({
    method: "GET",
    url: `/api/proposals/${testProp.proposalId}/events`,
    query: { proposalId: testProp.proposalId, action: "events" }
  });
  await proposalsHandler(apiCall.req, apiCall.res);
  assert.strictEqual(apiCall.getStatus(), 200);
  const apiBody = apiCall.getBody();
  assert.strictEqual(apiBody.success, true);
  assert.ok(apiBody.eventsCount >= 3, "Must have PROPOSAL_CREATED, PROPOSAL_ACCEPTED, PAYMENT_VERIFIED");
  console.log(`✔ HTTP Event Query API returned ${apiBody.eventsCount} verified events.`);

  console.log("\n🎉 ALL 13 GARUDA EVENT NERVOUS SYSTEM TESTS PASSED (100% SUCCESS)!");
}

runEventNervousSystemTests().catch((err) => {
  console.error("Event Nervous System Test Failure:", err);
  process.exit(1);
});
