/**
 * 🦅 GARUDA High Command Center Shell Test Suite
 * Phase 5.2A — Mobile-First Founder Command Shell Verification
 */

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const founderCommandService = require("./founderCommandService");
const founderCommandHandler = require("../../api/founder-command");
const persistentProposalService = require("./persistentProposalService");

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

async function runHighCommandCenterShellTests() {
  console.log("=== RUNNING GARUDA HIGH COMMAND CENTER SHELL TEST SUITE (PHASE 5.2A) ===");

  // -------------------------------------------------------------
  // TEST 1: Protected Private Access Gate (401 Unauthorized)
  // -------------------------------------------------------------
  console.log("\n--- TEST 1: Protected Private Access Gate (401 UNAUTHORIZED) ---");
  const unauthCall = mockReqRes({
    method: "GET",
    url: "/api/founder/command-center",
    query: { action: "command-center" },
    headers: {}
  });

  await founderCommandHandler(unauthCall.req, unauthCall.res);
  assert.strictEqual(unauthCall.getStatus(), 401);
  const unauthBody = unauthCall.getBody();
  assert.strictEqual(unauthBody.success, false);
  assert.strictEqual(unauthBody.error.code, "UNAUTHORIZED");
  console.log("✔ Private gate verified: Unauthorized request rejected with HTTP 401.");

  // -------------------------------------------------------------
  // TEST 2: Non-Founder Rejection (403 Forbidden)
  // -------------------------------------------------------------
  console.log("\n--- TEST 2: Non-Founder Rejection (403 FORBIDDEN) ---");
  const fakeCustomerJwt = "eyJhbGciOiJIUzI1NiJ9." + Buffer.from(JSON.stringify({
    sub: "cust_999",
    email: "customer@company.com",
    role: "authenticated"
  })).toString("base64url") + ".fakesig";

  const customerCall = mockReqRes({
    method: "GET",
    url: "/api/founder/command-center",
    query: { action: "command-center" },
    headers: { authorization: `Bearer ${fakeCustomerJwt}` }
  });

  await founderCommandHandler(customerCall.req, customerCall.res);
  assert.strictEqual(customerCall.getStatus(), 403);
  assert.strictEqual(customerCall.getBody().error.code, "FORBIDDEN");
  console.log("✔ Access control verified: Non-founder customer rejected with HTTP 403.");

  // -------------------------------------------------------------
  // TEST 3: Authorized Boss Command Snapshot Payload
  // -------------------------------------------------------------
  console.log("\n--- TEST 3: Authorized Boss Command Snapshot Payload ---");
  const bossCall = mockReqRes({
    method: "GET",
    url: "/api/founder/command-center",
    query: { action: "command-center" },
    headers: { "x-founder-key": VALID_FOUNDER_KEY }
  });

  await founderCommandHandler(bossCall.req, bossCall.res);
  assert.strictEqual(bossCall.getStatus(), 200);
  const snapshot = bossCall.getBody().data;
  assert.ok(snapshot.generatedAt);
  assert.strictEqual(snapshot.freshness, "REALTIME");
  assert.ok(snapshot.system);
  assert.ok(snapshot.brain);
  assert.ok(snapshot.workforce);
  assert.ok(snapshot.commercial);
  assert.ok(snapshot.revenue);
  assert.ok(snapshot.approvals);
  assert.ok(snapshot.alerts);
  assert.ok(snapshot.activity);
  console.log("✔ Command API verified: Returned unified snapshot with 8 core intelligence sections.");

  // -------------------------------------------------------------
  // TEST 4: Truth Law & Status Indicator Accuracy
  // -------------------------------------------------------------
  console.log("\n--- TEST 4: Truth Law: Verified Revenue vs Derived Pipeline ---");
  assert.strictEqual(snapshot.revenue.verifiedWonINR.status, "AUTHORITATIVE");
  assert.strictEqual(snapshot.revenue.pipelineValueINR.status, "DERIVED_FROM_AUTHORITATIVE_DATA");
  assert.ok(["LIVE_PERSISTED", "LOCAL_ONLY"].includes(snapshot.system.truthClassification));
  assert.strictEqual(snapshot.commercial.truthClassification, "LIVE_PERSISTED");
  console.log(`✔ Truth Law verified: Verified Won = ${snapshot.revenue.verifiedWonINR.amount} (AUTHORITATIVE), Pipeline = ${snapshot.revenue.pipelineValueINR.amount} (DERIVED).`);

  // -------------------------------------------------------------
  // TEST 5: Failure Isolation (Unavailable !== Zero)
  // -------------------------------------------------------------
  console.log("\n--- TEST 5: Failure Isolation (Unavailable !== 0) ---");
  const faultyService = new (founderCommandService.constructor)({
    proposalService: {
      listProjects: () => Promise.reject(new Error("Database offline")),
      listProposals: () => Promise.resolve([]),
      listLeads: () => Promise.resolve([])
    },
    eventService: founderCommandService.eventService
  });

  const faultySnapshot = await faultyService.getCommandCenterSnapshot();
  assert.strictEqual(faultySnapshot.brain.available, false);
  assert.strictEqual(faultySnapshot.brain.truthClassification, "UNKNOWN");
  assert.strictEqual(faultySnapshot.brain.error, "Database offline");
  assert.strictEqual(faultySnapshot.brain.activeMissions, undefined);
  console.log("✔ Failure isolation verified: Disconnected subsystem reports UNKNOWN with reason, never fake 0.");

  // -------------------------------------------------------------
  // TEST 6: Mobile-First Stylesheet & Component Files
  // -------------------------------------------------------------
  console.log("\n--- TEST 6: Mobile-First Component & CSS Assets ---");
  const cssPath = path.join(__dirname, "..", "..", "frontend", "src", "styles", "high-command.css");
  const jsxPath = path.join(__dirname, "..", "..", "frontend", "src", "pages", "HighCommandCenter.jsx");
  assert.ok(fs.existsSync(cssPath), "high-command.css must exist");
  assert.ok(fs.existsSync(jsxPath), "HighCommandCenter.jsx must exist");

  const cssContent = fs.readFileSync(cssPath, "utf8");
  assert.ok(cssContent.includes("--hcc-bg: #06080d"), "Obsidian base color defined");
  assert.ok(cssContent.includes("--hcc-gold-500: #f59e0b"), "Sovereign gold accent defined");
  assert.ok(cssContent.includes(".hcc-command-orb"), "Command Orb styling defined");
  assert.ok(cssContent.includes(".hcc-bottom-nav"), "Mobile bottom nav defined");

  const jsxContent = fs.readFileSync(jsxPath, "utf8");
  assert.ok(jsxContent.includes("HIGH COMMAND"), "High Command header present");
  assert.ok(jsxContent.includes("Welcome, Boss"), "Personality addressing rule enforced");
  assert.ok(jsxContent.includes("Verified Won"), "Authoritative revenue widget present");
  console.log("✔ Visual & component architecture verified: Sovereign aerospace assets created.");

  // -------------------------------------------------------------
  // TEST 7: Route Integration in App.jsx
  // -------------------------------------------------------------
  console.log("\n--- TEST 7: Route Integration in App.jsx (Canonical /command-center) ---");
  const appPath = path.join(__dirname, "..", "..", "frontend", "src", "App.jsx");
  const appContent = fs.readFileSync(appPath, "utf8");
  assert.ok(appContent.includes('import HighCommandCenter from "./pages/HighCommandCenter";'));
  assert.ok(appContent.includes('<Route path="/command-center" element={commandCenterRoute} />'));
  assert.ok(appContent.includes('<Route path="/command" element={<Navigate to="/command-center" replace />} />'));
  assert.ok(appContent.includes('<Route path="/high-command" element={<Navigate to="/command-center" replace />} />'));
  console.log("✔ Route mapping verified: /command-center canonical, /command + /high-command redirect to canonical route.");

  console.log("\n🎉 ALL 7 GARUDA HIGH COMMAND CENTER SHELL TESTS PASSED (100% SUCCESS)!");
}

runHighCommandCenterShellTests().catch((err) => {
  console.error("High Command Center Shell Test Failure:", err);
  process.exit(1);
});
