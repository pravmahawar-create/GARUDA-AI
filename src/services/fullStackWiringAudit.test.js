/**
 * 🦅 GARUDA Full-Stack Intelligence & Wiring Verification Test Suite
 * End-to-End Verification across:
 * 1. Public Chat Intent Layer (Greeting vs General vs Business vs Scope vs Proposal)
 * 2. Founder / High Command Center Truth Architecture
 * 3. Express App Route Wiring & Handlers
 * 4. Truth Laws (UNAVAILABLE !== 0, No fake metrics, No simulated cognition)
 */

const assert = require("assert");
const app = require("../app");
const founderCommandService = require("./founderCommandService");
const publicChatCommercialAgent = require("./publicChatCommercialAgentService");
const insuranceAdvisorService = require("./insuranceAdvisorService");

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

// In-memory test helper for Express app
async function callExpress(app, { method = "GET", path = "/", headers = {}, body = null }) {
  return new Promise((resolve) => {
    const req = {
      method,
      url: path,
      path,
      headers: { "content-type": "application/json", ...headers },
      body,
      query: {},
      socket: { remoteAddress: "127.0.0.1" },
      get: (h) => headers[h.toLowerCase()] || headers[h]
    };

    let statusCode = 200;
    let resHeaders = {};
    let resBody = null;

    const res = {
      statusCode: 200,
      setHeader: (k, v) => { resHeaders[k] = v; },
      getHeader: (k) => resHeaders[k],
      status: (code) => { statusCode = code; return res; },
      json: (data) => { resBody = data; resolve({ status: statusCode, headers: resHeaders, body: resBody }); },
      send: (data) => { resBody = data; resolve({ status: statusCode, headers: resHeaders, body: resBody }); },
      end: (data) => { if (data) resBody = data; resolve({ status: statusCode, headers: resHeaders, body: resBody }); }
    };

    app.handle(req, res);
  });
}

async function runAudit() {
  console.log("================================================================================");
  console.log("🦅 GARUDA FULL-STACK INTELLIGENCE & WIRING AUDIT — VERIFICATION RUN");
  console.log("================================================================================\n");

  console.log("--- PART A: PUBLIC CHAT INTENT & CONVERSATIONAL TRUTH ---");

  await test('A1: "Hi" returns natural conversational AI greeting without commercial sales pitch', async () => {
    const res = await callExpress(app, {
      method: "POST",
      path: "/api/public-chat",
      body: { message: "Hi" }
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.proposalUrl, undefined);
    assert.strictEqual(res.body.proposalId, undefined);
    assert.ok(!res.body.reply.includes("Estimated Investment:"), "Must NOT dump investment quote on Hi");
    assert.ok(!res.body.reply.includes("Milestone Schedule:"), "Must NOT dump milestone schedule on Hi");
  });

  await test('A2: "Hello" returns natural greeting without commercial quote', async () => {
    const res = await callExpress(app, {
      method: "POST",
      path: "/api/public-chat",
      body: { message: "Hello, how are you?" }
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.proposalUrl, undefined);
    assert.ok(!res.body.reply.includes("Estimated Investment:"));
  });

  await test('A3: "What can you do?" returns capability overview without pricing', async () => {
    const res = await callExpress(app, {
      method: "POST",
      path: "/api/public-chat",
      body: { message: "What can you do?" }
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.proposalUrl, undefined);
    assert.ok(!res.body.reply.includes("Estimated Investment:"));
  });

  await test('A4: Technical question is answered directly without sales intrusion', async () => {
    const res = await callExpress(app, {
      method: "POST",
      path: "/api/public-chat",
      body: { message: "Explain how React reconciliation works under the hood" }
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.proposalUrl, undefined);
    assert.ok(!res.body.reply.includes("Estimated Investment:"));
  });

  await test('A5: "I want to build an AI app" enters progressive discovery (NEEDS_CLARIFICATION)', async () => {
    const commercialResult = await publicChatCommercialAgent.processCommercialTurn({
      message: "I want to build an AI app",
      history: []
    });
    assert.strictEqual(commercialResult.handled, true);
    assert.strictEqual(commercialResult.qualification, "NEEDS_CLARIFICATION");
    assert.ok(!commercialResult.reply.includes("Estimated Investment:"), "Must NOT dump premature pricing");
    assert.strictEqual(commercialResult.proposalUrl, null);
  });

  await test('A6: Complete project requirements yield structured architectural scope & quote', async () => {
    const commercialResult = await publicChatCommercialAgent.processCommercialTurn({
      message: "I want to build an iOS and Android mobile app with User Auth, Stripe payments, and PostgreSQL for ₹75,000 in 3 weeks",
      history: []
    });
    assert.strictEqual(commercialResult.handled, true);
    assert.strictEqual(commercialResult.qualification, "CLEARLY_DELIVERABLE");
    assert.ok(commercialResult.reply.includes("Estimated Investment:"));
    assert.ok(commercialResult.reply.includes("Milestone Schedule:"));
    assert.ok(commercialResult.reply.includes("75,000"));
  });

  await test('A7: Explicit quote request returns clear milestone pricing', async () => {
    const commercialResult = await publicChatCommercialAgent.processCommercialTurn({
      message: "What is your quote to build a custom SaaS MVP dashboard?",
      history: []
    });
    assert.strictEqual(commercialResult.handled, true);
    assert.strictEqual(commercialResult.qualification, "CLEARLY_DELIVERABLE");
    assert.ok(commercialResult.reply.includes("Estimated Investment:"));
  });

  console.log("\n--- PART B: FOUNDER HIGH COMMAND & TRUTH ARCHITECTURE ---");

  await test("B1: High Command Center Snapshot API requires Founder Authentication (401)", async () => {
    const res = await callExpress(app, {
      method: "GET",
      path: "/api/founder/command-center"
    });
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error.code, "UNAUTHORIZED");
  });

  await test("B2: Non-founder JWT token is rejected with 403 Forbidden", async () => {
    const fakeCustomerJwt = "eyJhbGciOiJIUzI1NiJ9." + Buffer.from(JSON.stringify({
      sub: "cust_777",
      email: "visitor@external.com",
      role: "authenticated"
    })).toString("base64url") + ".fakesig";

    const res = await callExpress(app, {
      method: "GET",
      path: "/api/founder/command-center",
      headers: { authorization: `Bearer ${fakeCustomerJwt}` }
    });
    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error.code, "FORBIDDEN");
  });

  await test("B3: Authorized Founder key loads complete Command Center Snapshot", async () => {
    const res = await callExpress(app, {
      method: "GET",
      path: "/api/founder/command-center",
      headers: { "x-founder-key": "garuda_founder_secret_key_2026" }
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data, "Snapshot data must be present");
    assert.ok(res.body.data.system, "System section must be present");
    assert.ok(res.body.data.brain, "Brain section must be present");
    assert.ok(res.body.data.revenue, "Revenue section must be present");
    assert.ok(res.body.data.commercial, "Commercial section must be present");
    assert.ok(res.body.data.approvals, "Approvals section must be present");
    assert.ok(res.body.data.alerts, "Alerts section must be present");
    assert.ok(res.body.data.activity, "Activity section must be present");
  });

  await test("B4: Truth Law Enforced: Verified Won is AUTHORITATIVE, Pipeline is DERIVED", async () => {
    const snapshot = await founderCommandService.getCommandCenterSnapshot();
    assert.strictEqual(snapshot.revenue.verifiedWonINR.status, "AUTHORITATIVE");
    assert.strictEqual(snapshot.revenue.pipelineValueINR.status, "DERIVED_FROM_AUTHORITATIVE_DATA");
  });

  await test("B5: Failure Isolation: Faulty Subsystems report UNAVAILABLE/UNKNOWN, never fake 0", async () => {
    const isolatedService = new (founderCommandService.constructor)({
      proposalService: {
        listProjects: async () => { throw new Error("DB_PROJECTS_DISCONNECTED"); },
        listProposals: async () => [],
        listLeads: async () => []
      },
      eventService: {
        getRecentGarudaEvents: async () => []
      }
    });

    const brokenSnapshot = await isolatedService.getCommandCenterSnapshot();
    assert.strictEqual(brokenSnapshot.brain.available, false);
    assert.strictEqual(brokenSnapshot.brain.truthClassification, "UNKNOWN");
    assert.strictEqual(brokenSnapshot.subsystemAvailability.brain, false);
    assert.strictEqual(brokenSnapshot.brain.error, "DB_PROJECTS_DISCONNECTED");
  });

  console.log("\n--- PART C: ROUTE WIRING & DISPATCH ---");

  await test("C1: /api/health reports system health", async () => {
    const res = await callExpress(app, { method: "GET", path: "/api/health" });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, "healthy");
  });

  await test("C2: /api/founder-command alias correctly maps to founder handler", async () => {
    const res = await callExpress(app, {
      method: "GET",
      path: "/api/founder-command/command-center",
      headers: { "x-founder-key": "garuda_founder_secret_key_2026" }
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
  });

  await test("C3: /api/auth/status route returns auth configuration", async () => {
    const res = await callExpress(app, { method: "GET", path: "/api/auth/status" });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.mode, "password");
  });

  await test("C4: /api/customer/session route returns unauthenticated for anonymous calls", async () => {
    const res = await callExpress(app, { method: "GET", path: "/api/customer/session" });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.authenticated, false);
  });

  console.log("\n================================================================================");
  console.log(`📊 AUDIT SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("================================================================================\n");

  if (failed > 0) process.exit(1);
}

runAudit().catch((err) => {
  console.error("Audit run failed:", err);
  process.exit(1);
});
