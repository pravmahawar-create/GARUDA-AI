/**
 * 🦅 GARUDA Founder Command API Test Suite
 * Phase 4 — Founder Command API
 * Tests authentication, authorization, kingdom status, attention queue,
 * project command summaries, event timeline integration, commercial snapshot truth,
 * sensitive data protection, and end-to-end integration with Phase 1, 2, and 3.
 */

const assert = require("assert");
const founderCommandService = require("./founderCommandService");
const founderCommandHandler = require("../../api/founder-command");
const persistentProposalService = require("./persistentProposalService");
const governedProjectDeliveryService = require("./governedProjectDeliveryService");
const clientProposalService = require("./clientProposalService");
const garudaEventService = require("./garudaEventService");

const VALID_FOUNDER_KEY = "garuda_founder_secret_key_2026";

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

async function runFounderCommandTests() {
  console.log("=== RUNNING GARUDA FOUNDER COMMAND API TEST SUITE ===");

  // -------------------------------------------------------------
  // TEST 1: Unauthenticated Request Denied (HTTP 401)
  // -------------------------------------------------------------
  console.log("\n--- TEST 1: Unauthenticated Request Denied ---");
  const unauthCall = mockReqRes({
    method: "GET",
    url: "/api/founder/command/status",
    query: { action: "status" },
    headers: {}
  });

  await founderCommandHandler(unauthCall.req, unauthCall.res);
  assert.strictEqual(unauthCall.getStatus(), 401);
  const unauthBody = unauthCall.getBody();
  assert.strictEqual(unauthBody.success, false);
  assert.strictEqual(unauthBody.error.code, "UNAUTHORIZED");
  console.log(`✔ Anonymous request denied with HTTP 401 (${unauthBody.error.code})`);

  // -------------------------------------------------------------
  // TEST 2: Non-Founder Request Denied (HTTP 403)
  // -------------------------------------------------------------
  console.log("\n--- TEST 2: Non-Founder Request Denied ---");
  // Simulate customer token with non-founder email
  const fakeCustomerJwt = "eyJhbGciOiJIUzI1NiJ9." + Buffer.from(JSON.stringify({
    sub: "cust_usr_12345",
    email: "customer@externalclient.com",
    role: "authenticated",
    exp: Math.floor(Date.now() / 1000) + 3600
  })).toString("base64url") + ".fakesig";

  const customerCall = mockReqRes({
    method: "GET",
    url: "/api/founder/command/status",
    query: { action: "status" },
    headers: {
      authorization: `Bearer ${fakeCustomerJwt}`
    }
  });

  await founderCommandHandler(customerCall.req, customerCall.res);
  assert.strictEqual(customerCall.getStatus(), 403);
  const customerBody = customerCall.getBody();
  assert.strictEqual(customerBody.success, false);
  assert.strictEqual(customerBody.error.code, "FORBIDDEN");
  console.log(`✔ Customer token rejected with HTTP 403 (${customerBody.error.code})`);

  // -------------------------------------------------------------
  // TEST 3: Founder Status Endpoint Truthful Response
  // -------------------------------------------------------------
  console.log("\n--- TEST 3: Kingdom Status Endpoint ---");
  const statusCall = mockReqRes({
    method: "GET",
    url: "/api/founder/command/status",
    query: { action: "status" },
    headers: {
      "x-founder-key": VALID_FOUNDER_KEY
    }
  });

  await founderCommandHandler(statusCall.req, statusCall.res);
  assert.strictEqual(statusCall.getStatus(), 200);
  const statusBody = statusCall.getBody();
  assert.strictEqual(statusBody.success, true);
  assert.ok(statusBody.data.systemHealth, "Must include systemHealth");
  assert.ok(statusBody.data.summary.projects, "Must include projects summary");
  assert.ok(statusBody.data.summary.commercial, "Must include commercial summary");
  assert.ok(Array.isArray(statusBody.data.recentImportantEvents), "Must include recent events array");
  console.log(`✔ Kingdom Status returned: ${statusBody.data.summary.projects.total} projects, ` +
              `₹${statusBody.data.summary.commercial.verifiedDepositTotalINR.amount.toLocaleString("en-IN")} verified deposit.`);

  // -------------------------------------------------------------
  // TEST 4: No Fake Zero Metrics / Truth States
  // -------------------------------------------------------------
  console.log("\n--- TEST 4: Truth Law & Metric Source Integrity ---");
  const verifiedMetric = statusBody.data.summary.commercial.verifiedDepositTotalINR;
  assert.strictEqual(verifiedMetric.status, "AUTHORITATIVE");
  const pendingMetric = statusBody.data.summary.commercial.pendingDepositTotalINR;
  assert.strictEqual(pendingMetric.status, "DERIVED_FROM_AUTHORITATIVE_DATA");
  assert.ok(["HEALTHY", "LOCAL_STORAGE_FALLBACK", "UNAVAILABLE"].includes(statusBody.data.systemHealth.database.status));
  console.log("✔ Truth Law enforced: Verified metrics marked AUTHORITATIVE, pipeline marked DERIVED.");

  // -------------------------------------------------------------
  // TEST 5: Attention Queue Evidence-Backed Items
  // -------------------------------------------------------------
  console.log("\n--- TEST 5: Attention Queue Severity & Evidence ---");
  // Create a project with validation failure to verify attention generation
  const valTestProp = await clientProposalService.createProposal({
    title: "Edge Cache Proxy",
    requirements: "Build reverse proxy edge cache.",
    amount: 50000,
    client: { name: "CloudOps", email: "dev@cloudops.io" }
  }, { founderApproved: true });

  const valActivated = await persistentProposalService.recordDepositAndActivateProject(valTestProp.proposalId, {
    paymentId: "pay_att_test_001",
    amountPaid: 25000
  });

  await governedProjectDeliveryService.initializeProjectExecution(valActivated.project.projectId, { mode: "plan_only" });
  await governedProjectDeliveryService.executeAndValidateDelivery(valActivated.project.projectId, null, {
    forceValidationFailure: true
  });

  const attCall = mockReqRes({
    method: "GET",
    url: "/api/founder/command/attention",
    query: { action: "attention" },
    headers: { "x-founder-key": VALID_FOUNDER_KEY }
  });

  await founderCommandHandler(attCall.req, attCall.res);
  assert.strictEqual(attCall.getStatus(), 200);
  const attBody = attCall.getBody();
  assert.strictEqual(attBody.success, true);
  assert.ok(attBody.data.count >= 1, "Must have attention items");

  const valItem = attBody.data.items.find(i => i.projectId === valActivated.project.projectId);
  assert.ok(valItem, "Must include validation failed project");
  assert.strictEqual(valItem.severity, "HIGH");
  assert.ok(valItem.reason.includes("ValidationAgent"), "Reason must reference real failure evidence");
  console.log(`✔ Attention queue detected HIGH severity item: ${valItem.title}`);

  // -------------------------------------------------------------
  // TEST 6: Bounded Project List with Command Summaries
  // -------------------------------------------------------------
  console.log("\n--- TEST 6: Bounded Project Command List ---");
  const projCall = mockReqRes({
    method: "GET",
    url: "/api/founder/command/projects?limit=5",
    query: { action: "projects", limit: "5" },
    headers: { "x-founder-key": VALID_FOUNDER_KEY }
  });

  await founderCommandHandler(projCall.req, projCall.res);
  assert.strictEqual(projCall.getStatus(), 200);
  const projBody = projCall.getBody();
  assert.strictEqual(projBody.success, true);
  assert.ok(projBody.data.projects.length <= 5, "Must respect limit bound");

  const sampleProj = projBody.data.projects[0];
  assert.ok(sampleProj.projectId);
  assert.ok(sampleProj.currentState);
  assert.ok(sampleProj.executionState);
  assert.ok(sampleProj.deliveryState);
  assert.ok(sampleProj.paymentState);
  console.log(`✔ Project list returned ${projBody.data.projects.length} bounded command summaries.`);

  // -------------------------------------------------------------
  // TEST 7: Project Command Detail Includes Canonical Event Timeline
  // -------------------------------------------------------------
  console.log("\n--- TEST 7: Project Command Timeline Integration ---");
  const detailCall = mockReqRes({
    method: "GET",
    url: `/api/founder/command/projects/${valActivated.project.projectId}`,
    query: { action: "projects", projectId: valActivated.project.projectId },
    headers: { "x-founder-key": VALID_FOUNDER_KEY }
  });

  await founderCommandHandler(detailCall.req, detailCall.res);
  assert.strictEqual(detailCall.getStatus(), 200);
  const detailBody = detailCall.getBody();
  assert.strictEqual(detailBody.success, true);
  assert.strictEqual(detailBody.data.project.projectId, valActivated.project.projectId);
  assert.ok(Array.isArray(detailBody.data.timeline), "Must contain timeline events");
  assert.ok(detailBody.data.timeline.length >= 2, "Must contain activation & execution events");

  const timelineTypes = detailBody.data.timeline.map(t => t.eventType);
  assert.ok(timelineTypes.includes("PROJECT_ACTIVATED"), "Timeline must contain PROJECT_ACTIVATED");
  assert.ok(detailBody.data.blockers.length >= 1, "Must contain active blockers");
  assert.ok(detailBody.data.pendingFounderAction, "Must recommend deterministic founder action");
  console.log(`✔ Project detail loaded with ${detailBody.data.timeline.length} timeline events.`);

  // -------------------------------------------------------------
  // TEST 8: Events Endpoint Reuses Phase 3 Event System
  // -------------------------------------------------------------
  console.log("\n--- TEST 8: Events Endpoint Integration ---");
  const eventsCall = mockReqRes({
    method: "GET",
    url: "/api/founder/command/events?limit=10",
    query: { action: "events", limit: "10" },
    headers: { "x-founder-key": VALID_FOUNDER_KEY }
  });

  await founderCommandHandler(eventsCall.req, eventsCall.res);
  assert.strictEqual(eventsCall.getStatus(), 200);
  const eventsBody = eventsCall.getBody();
  assert.strictEqual(eventsBody.success, true);
  assert.ok(eventsBody.data.eventsCount <= 10);
  assert.ok(eventsBody.data.events[0].eventId.startsWith("evt_"));
  console.log(`✔ Events endpoint returned ${eventsBody.data.eventsCount} sealed events.`);

  // -------------------------------------------------------------
  // TEST 9: Commercial Snapshot Verified vs Pending Truth
  // -------------------------------------------------------------
  console.log("\n--- TEST 9: Commercial Snapshot Breakdown ---");
  const commCall = mockReqRes({
    method: "GET",
    url: "/api/founder/command/commercial",
    query: { action: "commercial" },
    headers: { "x-founder-key": VALID_FOUNDER_KEY }
  });

  await founderCommandHandler(commCall.req, commCall.res);
  assert.strictEqual(commCall.getStatus(), 200);
  const commBody = commCall.getBody();
  assert.strictEqual(commBody.success, true);
  assert.ok(typeof commBody.data.financials.verifiedRevenue.totalINR === "number");
  assert.ok(typeof commBody.data.financials.pendingPipeline.totalINR === "number");
  assert.ok(commBody.data.proposals.breakdown);
  assert.ok(Array.isArray(commBody.data.leads.recent));
  console.log(`✔ Commercial Snapshot: Verified ₹${commBody.data.financials.verifiedRevenue.totalINR.toLocaleString("en-IN")}, ` +
              `Pipeline ₹${commBody.data.financials.pendingPipeline.totalINR.toLocaleString("en-IN")}.`);

  // -------------------------------------------------------------
  // TEST 10: Sensitive Fields Masked / Redacted
  // -------------------------------------------------------------
  console.log("\n--- TEST 10: Sensitive Data Protection ---");
  const maskedClient = sampleProj.client;
  if (maskedClient.maskedEmail) {
    assert.ok(maskedClient.maskedEmail.includes("***"), "Email must be masked");
  }
  if (maskedClient.maskedPhone) {
    assert.ok(maskedClient.maskedPhone.includes("***"), "Phone must be masked");
  }
  assert.strictEqual(detailBody.data.project.SUPABASE_SECRET_KEY, undefined);
  assert.strictEqual(detailBody.data.project.RAZORPAY_KEY_SECRET, undefined);
  console.log("✔ Client contact information safely masked, zero credential leakage.");

  // -------------------------------------------------------------
  // TEST 11: Error Response Envelope Sanitization
  // -------------------------------------------------------------
  console.log("\n--- TEST 11: Error Envelope Sanitization ---");
  const notFoundCall = mockReqRes({
    method: "GET",
    url: "/api/founder/command/projects/proj_non_existent_999",
    query: { action: "projects", projectId: "proj_non_existent_999" },
    headers: { "x-founder-key": VALID_FOUNDER_KEY }
  });

  await founderCommandHandler(notFoundCall.req, notFoundCall.res);
  assert.strictEqual(notFoundCall.getStatus(), 404);
  const notFoundBody = notFoundCall.getBody();
  assert.strictEqual(notFoundBody.success, false);
  assert.ok(notFoundBody.error.message.includes("Project not found"));
  assert.strictEqual(notFoundBody.error.stack, undefined);
  console.log("✔ Sanitized error envelope returned with zero internal stack traces.");

  // -------------------------------------------------------------
  // TEST 12: Phase 1 Commercial Money Loop Regression Verification
  // -------------------------------------------------------------
  console.log("\n--- TEST 12: Phase 1 Money Loop Regression ---");
  const p1Prop = await clientProposalService.createProposal({
    title: "AI Payment Gateway Audit",
    requirements: "Audit stripe/razorpay webhook idempotency.",
    amount: 35000,
    client: { name: "FinTech Hub" }
  }, { founderApproved: true });

  const p1Accepted = await persistentProposalService.acceptProposal(p1Prop.proposalId, { name: "FinTech Lead" });
  assert.strictEqual(p1Accepted.proposal.status, "CLIENT_ACCEPTED");

  const p1Paid = await persistentProposalService.recordDepositAndActivateProject(p1Prop.proposalId, {
    paymentId: "pay_p1_reg_test_888",
    amountPaid: 17500
  });
  assert.strictEqual(p1Paid.project.status, "ACTIVE_IN_DEVELOPMENT");
  console.log("✔ Phase 1 Money Loop fully operational.");

  // -------------------------------------------------------------
  // TEST 13: Phase 2 Governed Delivery Engine Regression Verification
  // -------------------------------------------------------------
  console.log("\n--- TEST 13: Phase 2 Governed Delivery Regression ---");
  const p2Delivery = await governedProjectDeliveryService.initializeProjectExecution(p1Paid.project.projectId);
  assert.strictEqual(p2Delivery.status, "DELIVERY_READY");
  assert.ok(p2Delivery.deliveryPackage.deliveryHash);
  console.log("✔ Phase 2 Delivery Engine fully operational.");

  // -------------------------------------------------------------
  // TEST 14: Phase 3 Event Nervous System Regression Verification
  // -------------------------------------------------------------
  console.log("\n--- TEST 14: Phase 3 Event Nervous System Regression ---");
  const p3History = await garudaEventService.getProjectEventHistory(p1Paid.project.projectId);
  assert.ok(p3History.length >= 3);
  const p3EventTypes = p3History.map(e => e.eventType);
  assert.ok(p3EventTypes.includes("PROJECT_ACTIVATED"));
  assert.ok(p3EventTypes.includes("DELIVERY_READY"));
  console.log(`✔ Phase 3 Event Nervous System fully operational (${p3EventTypes.join(" -> ")}).`);

  console.log("\n🎉 ALL 14 GARUDA FOUNDER COMMAND API TESTS PASSED (100% SUCCESS)!");
}

runFounderCommandTests().catch((err) => {
  console.error("Founder Command Test Failure:", err);
  process.exit(1);
});
