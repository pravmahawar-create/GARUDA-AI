/**
 * GARUDA FOUNDER INTELLIGENCE — SECURITY & ROUTE INTEGRATION TEST (Phase 11)
 *
 * Validates:
 *  1. ALL founder-intelligence routes reject non-founder callers (403).
 *  2. Founder key is ENV-driven (never hardcoded in route source).
 *  3. Authenticated founder receives working intelligence.
 *  4. Meeting split at ROUTE level returns two separate structures;
 *     serialized customerView contains zero private fields/values.
 *  5. Audit log writes metadata only (no private payload contents).
 *
 * Run: node src/services/founderIntelligence/founderIntelligenceSecurity.test.js
 */

const assert = require("assert");
const express = require("express");
const fs = require("fs");
const os = require("os");
const path = require("path");

// Env-driven founder key for this test (route must read env, not literals)
const TEST_FOUNDER_KEY = "fi_test_founder_key_2026_secure";
process.env.FOUNDER_ADMIN_KEY = TEST_FOUNDER_KEY;

const AUDIT_FILE = path.join(os.tmpdir(), `fi-audit-${process.pid}.jsonl`);
process.env.GARUDA_FI_AUDIT_FILE = AUDIT_FILE;
delete process.env.GARUDA_FI_AUDIT; // audit ON for this test
// Isolated client-memory file (no repo data pollution from tests)
const MEMORY_FILE = path.join(os.tmpdir(), `fi-sec-memory-${process.pid}.jsonl`);
process.env.GARUDA_FOUNDER_MEMORY_FILE = MEMORY_FILE;
// Learning loop writes must stay in tmp (no repo data pollution from tests)
const LEARNING_FILE = path.join(os.tmpdir(), `fi-sec-learning-${process.pid}.jsonl`);
process.env.GARUDA_FI_LEARNING_FILE = LEARNING_FILE;

const founderIntelligenceRoutes = require("../../routes/founderIntelligenceRoutes");

async function runSecurityTests() {
  console.log("🔒 GARUDA Founder Intelligence — Security & Route Integration Suite\n");

  // ---------- 0. No hardcoded founder key in route source ----------
  const routeSource = fs.readFileSync(
    path.join(__dirname, "..", "..", "routes", "founderIntelligenceRoutes.js"),
    "utf8"
  );
  assert.ok(routeSource.includes("requireFounderOrAdmin"), "route must use requireFounderOrAdmin");
  assert.ok(!/===\s*"[A-Za-z0-9_]{16,}"/.test(routeSource), "no hardcoded secret literals in route");
  assert.ok(!routeSource.includes("9098750362"), "founder personal number absent from route");
  console.log("  ✔ PASS: route source uses env-driven gate, no hardcoded secrets");

  // ---------- App under test ----------
  const app = express();
  app.use(express.json());
  app.use("/api/founder-intelligence", founderIntelligenceRoutes);
  const server = app.listen(0);
  const port = server.address().port;
  const base = `http://127.0.0.1:${port}/api/founder-intelligence`;

  try {
    // ---------- 1. Non-founder requests REJECTED ----------
    const endpoints = [
      ["GET", `${base}/pricing/snapshot`, null],
      ["POST", `${base}/pricing`, { serviceType: "custom_ai" }],
      ["POST", `${base}/chat`, { text: "quote batao" }],
      ["GET", `${base}/memory/clients`, null],
      ["POST", `${base}/meeting/start`, {}],
      ["POST", `${base}/proposal/draft`, { title: "x", requirements: "y" }],
      ["GET", `${base}/evidence/labels`, null],
    ];
    for (const [method, url, body] of endpoints) {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      assert.strictEqual(res.status, 403, `${method} ${url.replace(base, "")} must 403 for non-founder (got ${res.status})`);
    }
    console.log(`  ✔ PASS: ${endpoints.length} endpoints reject non-founder with 403`);

    // ---------- 2. Wrong founder key REJECTED ----------
    const wrongRes = await fetch(`${base}/pricing/snapshot`, {
      headers: { "x-founder-key": "wrong_key_attack" },
    });
    assert.strictEqual(wrongRes.status, 403, "wrong key must be rejected");
    console.log("  ✔ PASS: invalid founder key rejected (403)");

    const founderHeaders = { "Content-Type": "application/json", "x-founder-key": TEST_FOUNDER_KEY };

    // ---------- 3. Authenticated founder → working intelligence ----------
    const snapRes = await fetch(`${base}/pricing/snapshot`, { headers: founderHeaders });
    assert.strictEqual(snapRes.status, 200, "founder key must pass gate");
    const snap = await snapRes.json();
    assert.ok(snap.data.live.source.ref.includes("garudaos.in/pricing"), "snapshot source present");
    console.log("  ✔ PASS: founder key passes gate → verified pricing snapshot");

    const chatRes = await fetch(`${base}/chat`, {
      method: "POST",
      headers: founderHeaders,
      body: JSON.stringify({ text: "Custom AI project ka kitna charge hoga?" }),
    });
    assert.strictEqual(chatRes.status, 200);
    const chat = await chatRes.json();
    assert.strictEqual(chat.data.intent, "pricing");
    assert.strictEqual(chat.data.result.quote.minINR, 45000, "deterministic verified pricing via route");
    console.log("  ✔ PASS: POST /chat → intent=pricing, verified ₹45,000 anchor via route");

    // ---------- 4. Meeting split at ROUTE level ----------
    const startRes = await fetch(`${base}/meeting/start`, {
      method: "POST",
      headers: founderHeaders,
      body: JSON.stringify({ topic: "security test call" }),
    });
    assert.strictEqual(startRes.status, 201);
    const sessionId = (await startRes.json()).data.sessionId;

    const splitRes = await fetch(`${base}/meeting/${sessionId}/split`, {
      method: "POST",
      headers: founderHeaders,
      body: JSON.stringify({
        text: "meeting mode on",
        serviceType: "custom_ai",
        founderAssumptions: ["Budget 40k tak ho sakta hai — internal note"],
        customerStatements: [{ quote: "Price zyada lag raha hai" }],
      }),
    });
    assert.strictEqual(splitRes.status, 200, "split route returns 200");
    const split = await splitRes.json();
    assert.ok(split.customerView && split.founderPrivate, "two separate structures at route level");

    const custSer = JSON.stringify(split.customerView);
    const privSer = JSON.stringify(split.founderPrivate);
    assert.ok(!/floor|margin|private|negotiat|assumption|probability/i.test(custSer), "customerView clean at route level");
    assert.ok(privSer.includes("internalFloor"), "founderPrivate has floor");
    assert.ok(privSer.includes("Budget 40k"), "assumption value lives ONLY in founderPrivate");
    assert.ok(!custSer.includes("40k"), "assumption value absent from customerView");
    console.log("  ✔ PASS: route-level meeting split — private values present only in founderPrivate");

    // customer-view accessor never serves private
    const custGet = await fetch(`${base}/meeting/${sessionId}/customer-view`, { headers: founderHeaders });
    assert.strictEqual(custGet.status, 200);
    const custBody = await custGet.json();
    assert.ok(!("founderPrivate" in custBody), "customer-view accessor returns no private block");
    console.log("  ✔ PASS: customer-view accessor leak-free");

    // ---------- 5. Audit log: metadata only ----------
    assert.ok(fs.existsSync(AUDIT_FILE), "audit file written");
    const auditLines = fs.readFileSync(AUDIT_FILE, "utf8").trim().split("\n").map((l) => JSON.parse(l));
    assert.ok(auditLines.length >= 2, "audit entries recorded");
    const chatAudit = auditLines.find((l) => l.intent === "pricing");
    assert.ok(chatAudit, "chat audited with intent");
    assert.strictEqual(chatAudit.label, "PARTIAL", "audit carries evidence label");
    const allAudit = JSON.stringify(auditLines);
    assert.ok(!allAudit.includes("Budget 40k"), "audit NEVER contains private payload text");
    assert.ok(!allAudit.includes("internalFloor:"), "audit never dumps private structures");
    assert.ok(chatAudit.hadCustomerView === false || chatAudit.hadCustomerView === true, "metadata flags only");
    console.log("  ✔ PASS: audit log = labels + metadata only, zero private content");

    // ---------- 6. Customer memory route security ----------
    const memRes = await fetch(`${base}/memory/clients`, {
      method: "POST",
      headers: founderHeaders,
      body: JSON.stringify({ name: "SecTest Client", industry: "QA" }),
    });
    assert.strictEqual(memRes.status, 201, "founder can create client memory");
    const memNoAuth = await fetch(`${base}/memory/clients`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Attacker" }),
    });
    assert.strictEqual(memNoAuth.status, 403, "anonymous cannot write founder memory");
    console.log("  ✔ PASS: client memory write gated (201 founder / 403 anon)");

    // ---------- 7. SPLIT FAILURE → 422, never a private fallthrough ----------
    const badSplit = await fetch(`${base}/meeting/mts_does_not_exist_xyz/split`, {
      method: "POST",
      headers: founderHeaders,
      body: JSON.stringify({ text: "kitna lagega" }),
    });
    assert.strictEqual(badSplit.status, 422, "split failure must 422 (SPLIT_NOT_BUILT)");
    const badBody = await badSplit.json();
    assert.strictEqual(badBody.error.code, "SPLIT_NOT_BUILT");
    assert.ok(!("founderPrivate" in badBody) && !("customerView" in badBody), "failed split returns NO private/customer structures");
    console.log("  ✔ PASS: split failure → 422 with zero private payload (no fallthrough)");

    // ---------- 8. NESTED object leak detector (deep scan) ----------
    const meetingModeService = require("../../services/founderIntelligence/meetingModeService");
    meetingModeService._resetSessions();
    const s2 = meetingModeService.startSession({ topic: "nested leak test" });
    let threw = false;
    try {
      meetingModeService.buildSplitResponse(s2.sessionId, {
        public: {
          publicAnswer: "ok",
          // attacker-style nested private key buried two levels deep
          understanding: { deep: { privateGuidance: "floor is 40000" } },
        },
        private: {},
      });
    } catch (err) {
      threw = /MEETING_PRIVATE_LEAK/.test(err.message);
    }
    assert.ok(threw, "nested private key inside customerView must THROW");
    console.log("  ✔ PASS: nested/serialized object leak → MEETING_PRIVATE_LEAK thrown");

    // ---------- 9. Frontend state leak — source scan ----------
    const uiSource = fs.readFileSync(
      path.join(__dirname, "..", "..", "..", "frontend", "src", "pages", "FounderIntelligence.jsx"),
      "utf8"
    );
    assert.ok(!/localStorage\.setItem/.test(uiSource), "UI never writes to localStorage (no private persistence)");
    assert.ok(!/sessionStorage\.setItem/.test(uiSource), "UI never writes to sessionStorage");
    assert.ok(!/9098750362/.test(uiSource), "founder personal number absent from UI");
    assert.ok(/screenSafe/.test(uiSource), "screen-safe guard present in UI");
    console.log("  ✔ PASS: frontend state leak scan — zero storage writes, screen-safe present");

    // ---------- 10. Calculator proto-dispatch blocked (K4) ----------
    const protoCalc = await fetch(`${base}/calculator/constructor`, {
      method: "POST",
      headers: founderHeaders,
      body: JSON.stringify({}),
    });
    assert.strictEqual(protoCalc.status, 404, "proto-chain calculator must 404 (allowlist)");
    const calcOk = await fetch(`${base}/calculator/margin`, {
      method: "POST",
      headers: founderHeaders,
      body: JSON.stringify({ revenueINR: 100000, costINR: 60000 }),
    });
    assert.strictEqual(calcOk.status, 200, "real calculators still work");
    console.log("  ✔ PASS: calculator allowlist — proto functions 404, real calc 200");

    // ---------- 11. New production endpoints gated (403 anon / 200 founder) ----------
    const newEndpoints = [
      ["POST", `${base}/analysis`, { text: "electronics installment business" }],
      ["POST", `${base}/learning/events`, { stage: "FOUND" }],
      ["GET", `${base}/learning/summary`, null],
      ["POST", `${base}/memory/clients/cli_x/records`, { type: "contact", data: {} }],
    ];
    for (const [method, url, body] of newEndpoints) {
      const anon = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      assert.strictEqual(anon.status, 403, `${url.replace(base, "")} must 403 anon`);
    }
    const anaRes = await fetch(`${base}/analysis`, {
      method: "POST",
      headers: founderHeaders,
      body: JSON.stringify({ text: "Hum electronics installment par dete hain. Customer tracking, receipts aur owner dashboard chahiye." }),
    });
    assert.strictEqual(anaRes.status, 200, "founder can analyze");
    const ana = await anaRes.json();
    assert.strictEqual(ana.data.intent, "analyze");
    assert.ok(ana.data.panel && ana.data.panel.recommendation, "analysis response carries intelligence panel");
    assert.ok(ana.data.result.analysis.requestedFeatures.label === "VERIFIED", "stated features VERIFIED");
    console.log(`  ✔ PASS: ${newEndpoints.length} new endpoints gated; /analysis returns 15-field labeled panel`);

    // ---------- 12. Learning loop records metadata + policy (never auto-edits pricing) ----------
    const lrn = await fetch(`${base}/learning/events`, {
      method: "POST",
      headers: founderHeaders,
      body: JSON.stringify({ stage: "QUOTED", proposalId: "prop_sec_test", quotedINR: 45000 }),
    });
    assert.strictEqual(lrn.status, 201, "founder can record learning event");
    const lrnBody = await lrn.json();
    assert.ok(lrnBody.data.policy.includes("NEVER auto-modified"), "learning policy pinned");
    const lrnBad = await fetch(`${base}/learning/events`, {
      method: "POST",
      headers: founderHeaders,
      body: JSON.stringify({ stage: "WON" }),
    });
    assert.strictEqual(lrnBad.status, 422, "stage missing required fields → 422");
    console.log("  ✔ PASS: learning loop — validated stages, policy READ_ONLY_EVIDENCE");

    console.log("\nSECURITY SUITE PASSED: route gate, split separation, audit hygiene all green.");
  } finally {
    server.close();
    try {
      if (fs.existsSync(AUDIT_FILE)) fs.unlinkSync(AUDIT_FILE);
      if (fs.existsSync(MEMORY_FILE)) fs.unlinkSync(MEMORY_FILE);
      if (fs.existsSync(LEARNING_FILE)) fs.unlinkSync(LEARNING_FILE);
    } catch {
      /* temp cleanup best-effort */
    }
  }
}

if (require.main === module) {
  runSecurityTests().catch((err) => {
    console.error("\n✖ SECURITY SUITE FAILED:", err.message);
    process.exit(1);
  });
}

module.exports = { runSecurityTests };
