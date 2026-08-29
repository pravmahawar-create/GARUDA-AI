/**
 * 🦅 GARUDA Production Live Smoke Test Suite
 * Executes live HTTP requests against https://www.garudaos.in
 */

const assert = require("assert");

const BASE_URL = "https://www.garudaos.in";

async function postJson(url, body, headers = {}) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "GARUDA-Production-SmokeTester/1.0",
      ...headers
    },
    body: JSON.stringify(body)
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {}
  return { status: res.status, headers: res.headers, text, json };
}

async function getUrl(url, headers = {}) {
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "User-Agent": "GARUDA-Production-SmokeTester/1.0",
      ...headers
    }
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {}
  return { status: res.status, headers: res.headers, text, json };
}

async function runLiveSmokeTests() {
  console.log("================================================================================");
  console.log(`🦅 RUNNING LIVE PRODUCTION SMOKE TESTS ON ${BASE_URL}`);
  console.log("================================================================================\n");

  let passed = 0;
  let failed = 0;

  async function check(name, fn) {
    try {
      await fn();
      passed += 1;
      console.log(`  ✔ PASS: ${name}`);
    } catch (err) {
      failed += 1;
      console.error(`  ✖ FAIL: ${name}\n    ${err.message}`);
    }
  }

  // ---------------------------------------------------------------------------
  // Check 1: Health & Base Availability
  // ---------------------------------------------------------------------------
  console.log("--- 1. Base Connectivity & Health ---");
  await check("GET /api/health", async () => {
    const res = await getUrl(`${BASE_URL}/api/health`);
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    assert.ok(res.json && res.json.status === "healthy", "Expected { status: 'healthy' }");
    console.log(`    Response: ${JSON.stringify(res.json)}`);
  });

  // ---------------------------------------------------------------------------
  // Check 2: Public Chat "Hi" (Greeting - No Sales Pitch, No 25k Quote)
  // ---------------------------------------------------------------------------
  console.log("\n--- 2. Public Production Chat: Fresh Conversation ('Hi') ---");
  await check("POST /api/public-chat with 'Hi'", async () => {
    const res = await postJson(`${BASE_URL}/api/public-chat`, {
      message: "Hi",
      history: []
    });
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    assert.ok(res.json, "Expected JSON response");
    assert.ok(res.json.reply, "Expected reply field in response");
    assert.strictEqual(res.json.proposalUrl, undefined, "proposalUrl must be undefined on 'Hi'");
    assert.strictEqual(res.json.proposalId, undefined, "proposalId must be undefined on 'Hi'");
    assert.ok(!res.json.reply.includes("Estimated Investment"), "Must NOT include investment quote");
    assert.ok(!res.json.reply.includes("₹25,000"), "Must NOT include ₹25,000 quote");
    assert.ok(!res.json.reply.includes("Milestone Schedule"), "Must NOT include milestone schedule");
    assert.ok(!res.json.reply.includes("50% advance"), "Must NOT request 50% advance");
    console.log(`    Reply snippet: "${res.json.reply.slice(0, 120)}..."`);
  });

  // ---------------------------------------------------------------------------
  // Check 3: General Question (Normal Intelligence Behavior)
  // ---------------------------------------------------------------------------
  console.log("\n--- 3. Public Production Chat: General Question ---");
  await check("POST /api/public-chat with 'What can GARUDA do?'", async () => {
    const res = await postJson(`${BASE_URL}/api/public-chat`, {
      message: "What can GARUDA do?",
      history: []
    });
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    assert.ok(res.json && res.json.reply, "Expected reply");
    assert.strictEqual(res.json.proposalUrl, undefined);
    assert.ok(!res.json.reply.includes("Estimated Investment:"));
    console.log(`    Reply snippet: "${res.json.reply.slice(0, 140)}..."`);
  });

  // ---------------------------------------------------------------------------
  // Check 4: Technical Question (No accidental insurance / commercial routing)
  // ---------------------------------------------------------------------------
  console.log("\n--- 4. Public Production Chat: Technical Question ---");
  await check("POST /api/public-chat with 'Explain short term memory vs long term memory in AI agents'", async () => {
    const res = await postJson(`${BASE_URL}/api/public-chat`, {
      message: "Explain short term memory vs long term memory in AI agents",
      history: []
    });
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    assert.ok(res.json && res.json.reply, "Expected reply");
    assert.strictEqual(res.json.proposalUrl, undefined);
    assert.ok(!res.json.reply.toLowerCase().includes("aditya birla"), "Must NOT route to ABSLI insurance");
    assert.ok(!res.json.reply.toLowerCase().includes("absli"), "Must NOT route to ABSLI insurance");
    assert.ok(!res.json.reply.includes("Estimated Investment:"), "Must NOT route to commercial quote");
    console.log(`    Reply snippet: "${res.json.reply.slice(0, 140)}..."`);
  });

  // ---------------------------------------------------------------------------
  // Check 5: Incomplete Business Inquiry (Discovery Questions Activated)
  // ---------------------------------------------------------------------------
  console.log("\n--- 5. Public Production Chat: Business Inquiry ('I want to build an AI app') ---");
  await check("POST /api/public-chat with 'I want to build an AI app'", async () => {
    const res = await postJson(`${BASE_URL}/api/public-chat`, {
      message: "I want to build an AI app",
      history: []
    });
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    assert.ok(res.json && res.json.reply, "Expected reply");
    assert.strictEqual(res.json.qualification, "NEEDS_CLARIFICATION", "Should be NEEDS_CLARIFICATION");
    assert.ok(!res.json.reply.includes("Estimated Investment:"), "Must NOT dump investment quote prematurely");
    assert.strictEqual(res.json.proposalUrl, null, "Must NOT have proposalUrl on clarification");
    console.log(`    Qualification: ${res.json.qualification}`);
    console.log(`    Reply snippet: "${res.json.reply.slice(0, 140)}..."`);
  });

  // ---------------------------------------------------------------------------
  // Check 6: Explicit Commercial Inquiry (Scope & Quote Activated)
  // ---------------------------------------------------------------------------
  console.log("\n--- 6. Public Production Chat: Explicit Commercial Scoping ---");
  await check("POST /api/public-chat with explicit quote request", async () => {
    const res = await postJson(`${BASE_URL}/api/public-chat`, {
      message: "What is your quote and timeline to build an iOS & Android app with User Auth and Stripe payments for ₹50,000?",
      history: []
    });
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    assert.ok(res.json && res.json.reply, "Expected reply");
    assert.strictEqual(res.json.qualification, "CLEARLY_DELIVERABLE", "Should be CLEARLY_DELIVERABLE");
    assert.ok(res.json.reply.includes("GARUDA Architectural Scope"), "Must include Architectural Scope");
    assert.ok(res.json.reply.includes("Estimated Investment:"), "Must include Estimated Investment");
    assert.ok(res.json.reply.includes("Milestone Schedule:"), "Must include Milestone Schedule");
    console.log(`    Qualification: ${res.json.qualification}`);
    console.log(`    Proposal Link: ${res.json.proposalUrl || 'In conversation'}`);
  });

  // ---------------------------------------------------------------------------
  // Check 7: Founder Command Center Gate (401 Unauthorized for Anonymous)
  // ---------------------------------------------------------------------------
  console.log("\n--- 7. Founder Production Gate: Anonymous Access Protection ---");
  await check("GET /api/founder/command-center (Anonymous)", async () => {
    const res = await getUrl(`${BASE_URL}/api/founder/command-center`);
    assert.strictEqual(res.status, 401, `Expected 401, got ${res.status}`);
    assert.strictEqual(res.json.success, false);
    assert.strictEqual(res.json.error.code, "UNAUTHORIZED");
    console.log(`    Response status: ${res.status} (Protected as expected)`);
  });

  // ---------------------------------------------------------------------------
  // Check 8: Founder Command Center with Authorized Founder Key
  // ---------------------------------------------------------------------------
  console.log("\n--- 8. Founder Production Gate: Authorized Snapshot Retrieval ---");
  await check("GET /api/founder/command-center (Authorized Founder Key)", async () => {
    const res = await getUrl(`${BASE_URL}/api/founder/command-center`, {
      "x-founder-key": "garuda_founder_secret_key_2026"
    });
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    assert.strictEqual(res.json.success, true);
    assert.ok(res.json.data, "Snapshot data present");
    assert.ok(res.json.data.system, "System section present");
    assert.ok(res.json.data.brain, "Brain section present");
    assert.ok(res.json.data.revenue, "Revenue section present");
    assert.strictEqual(res.json.data.revenue.verifiedWonINR.status, "AUTHORITATIVE", "Verified Won must be AUTHORITATIVE");
    assert.strictEqual(res.json.data.revenue.pipelineValueINR.status, "DERIVED_FROM_AUTHORITATIVE_DATA", "Pipeline must be DERIVED");
    console.log(`    System Status: ${res.json.data.system.overallStatus}`);
    console.log(`    Brain State: ${res.json.data.brain.executionState}`);
    console.log(`    Verified Revenue: ₹${res.json.data.revenue.verifiedWonINR.amount.toLocaleString()}`);
  });

  // ---------------------------------------------------------------------------
  // Check 9: Prerendered HTML / Public Page Data Leakage Check
  // ---------------------------------------------------------------------------
  console.log("\n--- 9. Production Prerender & Data Leakage Protection ---");
  await check("GET /chat & GET /command-center HTML page checks", async () => {
    const chatHtml = await getUrl(`${BASE_URL}/chat`);
    assert.strictEqual(chatHtml.status, 200, `Expected 200 for /chat, got ${chatHtml.status}`);
    assert.ok(chatHtml.text.includes("GARUDA"), "/chat HTML should contain GARUDA title/content");

    const cmdHtml = await getUrl(`${BASE_URL}/command-center`);
    assert.strictEqual(cmdHtml.status, 200, `Expected 200 for /command-center, got ${cmdHtml.status}`);
    assert.ok(!cmdHtml.text.includes("garuda_founder_secret_key"), "Must NEVER leak secret keys in HTML");
    assert.ok(!cmdHtml.text.includes("DATABASE_URL"), "Must NEVER leak database URLs in HTML");
    console.log(`    /chat HTTP: ${chatHtml.status}, /command-center HTTP: ${cmdHtml.status}`);
  });

  console.log("\n================================================================================");
  console.log(`📊 LIVE PRODUCTION SMOKE TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("================================================================================\n");

  if (failed > 0) process.exit(1);
}

runLiveSmokeTests().catch((err) => {
  console.error("Live test execution error:", err);
  process.exit(1);
});
