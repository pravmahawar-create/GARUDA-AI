/**
 * 🦅 GARUDA Growth Command API — Test Suite
 * Growth Stage Phase 4
 *
 * Boots the real Express app on an ephemeral port and exercises the live
 * /api/growth surface end-to-end over HTTP.
 *
 * Run: node src/routes/growthCommandRoutes.test.js
 */

const assert = require("assert");
const http = require("http");

process.env.GROWTH_TEST_SILENT = "1";

let app;
try {
  app = require("../app");
} catch (err) {
  console.error("✘ Failed to load Express app:", err.message);
  process.exit(1);
}

const BASE = "http://127.0.0.1";
let server;
let port;

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port,
        path,
        method,
        headers: {
          "Content-Type": "application/json",
          ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {})
        }
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode, json: JSON.parse(data || "{}") });
          } catch (e) {
            reject(new Error(`Non-JSON response (${res.statusCode}): ${data.slice(0, 200)}`));
          }
        });
      }
    );
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

const BRIEF = {
  businessName: "Aurum Estates",
  industry: "Real Estate",
  productOrService: "Luxury 3 & 4 BHK residences",
  targetAudience: "Affluent families and investors",
  campaignGoal: "LEAD_GENERATION",
  geography: "Jaipur, Rajasthan",
  channels: ["INSTAGRAM", "GOOGLE_SEARCH", "EMAIL"],
  brandContext: "RERA-first luxury developer"
};

async function run() {
  console.log("=== GROWTH COMMAND API — PHASE 4 TESTS (live HTTP) ===\n");

  server = app.listen(0, "127.0.0.1", () => {
    port = server.address().port;
  });
  await new Promise((r) => setTimeout(r, 300));

  // ---------------------------------------------------------------------------
  // 1. Strategy endpoints
  // ---------------------------------------------------------------------------
  console.log("--- 1. POST /api/growth/strategy + retrieval ---");
  const stratRes = await request("POST", "/api/growth/strategy", BRIEF);
  assert.strictEqual(stratRes.status, 200);
  assert.strictEqual(stratRes.json.success, true);
  const strategy = stratRes.json.data;
  assert.ok(strategy.strategyId.startsWith("gs_"));
  assert.strictEqual(strategy.engine, "DETERMINISTIC_TEMPLATE_V1");

  const stratGet = await request("GET", `/api/growth/strategy/${strategy.strategyId}`);
  assert.strictEqual(stratGet.status, 200);
  assert.strictEqual(stratGet.json.data.strategyHash, strategy.strategyHash);

  const stratList = await request("GET", "/api/growth/strategies?limit=5");
  assert.strictEqual(stratList.status, 200);
  assert.ok(Array.isArray(stratList.json.data) && stratList.json.data.length >= 1);

  const stratBad = await request("POST", "/api/growth/strategy", {});
  assert.strictEqual(stratBad.status, 400);
  assert.strictEqual(stratBad.json.success, false);
  assert.ok(stratBad.json.error.includes("businessName is required"));
  const stratMiss = await request("GET", "/api/growth/strategy/gs_missing");
  assert.strictEqual(stratMiss.status, 404);
  console.log("✔ PASS: strategy create/get/list + honest 400/404 errors");

  // ---------------------------------------------------------------------------
  // 2. Campaign lifecycle over HTTP
  // ---------------------------------------------------------------------------
  console.log("\n--- 2. Campaign create → ready → approve → execution-pending ---");
  const campRes = await request("POST", "/api/growth/campaign", { briefInput: BRIEF });
  assert.strictEqual(campRes.status, 200);
  const campaign = campRes.json.data;
  assert.ok(campaign.campaignId.startsWith("gc_"));
  assert.strictEqual(campaign.status, "STRATEGIZED");

  // campaign creation from existing strategyId
  const camp2 = await request("POST", "/api/growth/campaign", { strategyId: strategy.strategyId });
  assert.strictEqual(camp2.status, 200);
  assert.strictEqual(camp2.json.data.growthStrategyRef.strategyId, strategy.strategyId);

  // plan slices
  const planU21 = await request("GET", `/api/growth/campaign/${campaign.campaignId}/plan/U21`);
  assert.strictEqual(planU21.status, 200);
  assert.strictEqual(planU21.json.data.plan.universe, "U21");
  const planU10 = await request("GET", `/api/growth/campaign/${campaign.campaignId}/plan/U10`);
  assert.strictEqual(planU10.status, 200);
  assert.ok(planU10.json.data.plan.revenuePath.includes("VERIFIED REVENUE"));
  const planBad = await request("GET", `/api/growth/campaign/${campaign.campaignId}/plan/U99`);
  assert.strictEqual(planBad.status, 400);
  assert.ok(planBad.json.error.includes("Unknown universe"));
  console.log("✔ PASS: campaign create (brief + strategyId), plan slices U21/U10, 400 on unknown universe");

  // Invalid early approval -> 409
  const earlyApprove = await request("POST", `/api/growth/campaign/${campaign.campaignId}/approve`, { approvalToken: "tok" });
  assert.strictEqual(earlyApprove.status, 409);

  // ready-for-approval
  const rfa = await request("POST", `/api/growth/campaign/${campaign.campaignId}/ready-for-approval`, {});
  assert.strictEqual(rfa.status, 200);
  assert.strictEqual(rfa.json.data.status, "READY_FOR_APPROVAL");

  // approve without token -> 403
  const noToken = await request("POST", `/api/growth/campaign/${campaign.campaignId}/approve`, {});
  assert.strictEqual(noToken.status, 403);
  assert.ok(noToken.json.error.includes("approval token is required"));

  // approve with token -> 200 APPROVED
  const approved = await request("POST", `/api/growth/campaign/${campaign.campaignId}/approve`, {
    approvalToken: "founder-token-e2e",
    approvedBy: "founder",
    note: "Aurum Estates launch approved"
  });
  assert.strictEqual(approved.status, 200);
  assert.strictEqual(approved.json.data.status, "APPROVED");
  assert.ok(/^[a-f0-9]{64}$/.test(approved.json.data.approval.approvalTokenRef), "token hashed");

  // execution-pending
  const exec = await request("POST", `/api/growth/campaign/${campaign.campaignId}/execution-pending`, { requestedBy: "founder" });
  assert.strictEqual(exec.status, 200);
  assert.strictEqual(exec.json.data.status, "EXECUTION_PENDING");
  console.log("✔ PASS: full lifecycle with honest 409/403 gates and hash-only token storage");

  // ---------------------------------------------------------------------------
  // 3. Universe packs over HTTP
  // ---------------------------------------------------------------------------
  console.log("\n--- 3. POST /api/growth/packs/:packType ---");
  const brandPack = await request("POST", "/api/growth/packs/brand", { brandName: "Aurum Estates", industry: "Real Estate", positioning: "RERA-first" });
  assert.strictEqual(brandPack.status, 200);
  assert.strictEqual(brandPack.json.data.universe, "U21");
  assert.ok(brandPack.json.data.lockHash);

  const contentPack = await request("POST", "/api/growth/packs/content", { brandName: "Aurum Estates", campaignTheme: "Aurum Launch" });
  assert.strictEqual(contentPack.status, 200);
  assert.strictEqual(contentPack.json.data.universe, "U20");
  assert.ok(contentPack.json.data.calendar.calendarId.startsWith("cal_"));

  const presencePack = await request("POST", "/api/growth/packs/presence", { brandName: "Aurum Estates", geography: "Jaipur", primaryKeyword: "luxury apartments jaipur" });
  assert.strictEqual(presencePack.status, 200);
  assert.strictEqual(presencePack.json.data.universe, "U22");
  assert.ok(presencePack.json.data.landing.pageId.startsWith("lp_"));

  const creativePack = await request("POST", "/api/growth/packs/creative", { brandName: "Aurum Estates", objective: "Launch lead generation", targetAudience: "Affluent families" });
  assert.strictEqual(creativePack.status, 200);
  assert.strictEqual(creativePack.json.data.universe, "U19");
  assert.ok(creativePack.json.data.briefId.startsWith("cb_"));
  assert.strictEqual(creativePack.json.data.deliverableScope, "BRIEF_AND_CONCEPT_AND_FAMILY_SPEC_ONLY");

  const badPack = await request("POST", "/api/growth/packs/nonsense", {});
  assert.strictEqual(badPack.status, 400);
  assert.ok(badPack.json.error.includes("Unknown pack type"));
  console.log("✔ PASS: brand/content/presence/creative packs live over HTTP; 400 on unknown pack");

  // ---------------------------------------------------------------------------
  // 4. Legacy route compatibility (existing /api/growth endpoints intact)
  // ---------------------------------------------------------------------------
  console.log("\n--- 4. Legacy /api/growth route compatibility ---");
  const legacy = await request("POST", "/api/growth/content-pillars", { brandName: "GARUDA AI", industry: "Enterprise AI" });
  assert.strictEqual(legacy.status, 200);
  assert.ok(legacy.json.data.pillars.length >= 3);
  const legacyCal = await request("POST", "/api/growth/calendar", { brandName: "GARUDA AI" });
  assert.strictEqual(legacyCal.status, 200);
  console.log("✔ PASS: legacy growthCreativeRoutes endpoints still live after mount reorder");

  console.log("\n=== ALL GROWTH COMMAND API TESTS PASSED ===");
  server.close();
  process.exit(0);
}

run().catch(async (err) => {
  console.error("✘ TEST FAILURE:", err.message);
  if (server) server.close();
  process.exit(1);
});
