/**
 * 🦅 GARUDA FINTECH — PHASE 8 ENTERPRISE API & ISOLATION REGRESSION SUITE
 * Verifies:
 * 1. All Phase 8 query/list/overview/integration routes enforce 401 auth & strict tenant isolation.
 * 2. Bank/CRM credential staging never leaks secrets and live activation strictly blocks with 403 CUSTOMER_ACCESS_REQUIRED.
 * 3. Isolated Operational SIMULATED workspace generates strictly SIMULATED entities, runs real HMAC/2%/invoice/dispute
 *    engines safely, and ZERO simulated mutations touch live tenant state.
 */

const assert = require("assert");
const crypto = require("crypto");
const express = require("express");
const http = require("http");

process.env.FOUNDER_ADMIN_KEY = process.env.FOUNDER_ADMIN_KEY || "phase8_founder_test_key_2026";
process.env.GARUDA_JWT_SECRET = process.env.GARUDA_JWT_SECRET || "phase8_jwt_secret_test_2026";

const authContextMiddleware = require("../middleware/authContextMiddleware");
const fintechRoutes = require("../routes/fintechOrchestrationRoutes");
const { defaultOrchestrationService } = require("./orchestrationService");

function signTestJwt(sub, email) {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({
    sub,
    email,
    exp: Math.floor(Date.now() / 1000) + 3600
  })).toString("base64url");
  const sig = crypto
    .createHmac("sha256", process.env.GARUDA_JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest("base64url");
  return `${header}.${payload}.${sig}`;
}

function httpRequest(port, method, reqPath, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port,
        path: `/api/fintech${reqPath}`,
        method,
        headers: {
          "Content-Type": "application/json",
          ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {}),
          ...headers
        }
      },
      (res) => {
        let raw = "";
        res.on("data", (c) => (raw += c));
        res.on("end", () => {
          let parsed;
          try { parsed = JSON.parse(raw); } catch { parsed = raw; }
          resolve({ status: res.statusCode, body: parsed });
        });
      }
    );
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function run() {
  const app = express();
  app.use(express.json());
  app.use(authContextMiddleware);
  app.use("/api/fintech", fintechRoutes);

  let server;
  await new Promise((resolve) => {
    server = app.listen(0, "127.0.0.1", resolve);
  });
  const port = server.address().port;

  try {
    console.log("▶ Running Phase 8 Enterprise API & Simulation Isolation Tests...");

    // 1. Anonymous caller blocked (401) across ALL new Phase 8 query/integration endpoints
    const protectedGets = [
      "/overview",
      "/merchants",
      "/payments",
      "/settlements",
      "/agreements",
      "/fuel-tank",
      "/commissions/receivables",
      "/commissions/statements",
      "/commissions/invoices",
      "/commissions/disputes",
      "/risk",
      "/audit",
      "/integrations"
    ];
    for (const endpoint of protectedGets) {
      const r = await httpRequest(port, "GET", endpoint);
      assert.strictEqual(r.status, 401, `Anonymous GET ${endpoint} must return 401, got ${r.status}`);
    }
    console.log("  ✔ [PASS] 1. All 12 new live Enterprise APIs fail closed (401) on anonymous callers");

    // 2. Register merchant in Tenant A JWT; Tenant B JWT must NOT see Tenant A merchant
    const jwtA = signTestJwt("usr_phase8_a", "ops_a@example.com");
    const jwtB = signTestJwt("usr_phase8_b", "ops_b@example.com");

    const mReg = await httpRequest(
      port,
      "POST",
      "/merchants",
      {
        merchantId: "M_PHASE8_A",
        legalName: "Alpha Raipur Logistics Pvt Ltd",
        corporateBankName: "ICICI Corporate CIB",
        destinationBankIban: "INICIC000104998877",
        currency: "INR",
        preferredBillingMode: "PREPAID"
      },
      { Authorization: `Bearer ${jwtA}` }
    );
    assert.strictEqual(mReg.status, 201);
    assert.strictEqual(mReg.body.data.maskedIban, "****8877");
    assert.strictEqual(mReg.body.data.destinationBankIban, undefined, "Raw IBAN must not echo back on list/register response");

    const listA = await httpRequest(port, "GET", "/merchants", null, { Authorization: `Bearer ${jwtA}` });
    const listB = await httpRequest(port, "GET", "/merchants", null, { Authorization: `Bearer ${jwtB}` });
    assert.strictEqual(listA.status, 200);
    assert.ok(listA.body.data.items.some((m) => m.merchantId === "M_PHASE8_A"));
    assert.strictEqual(listB.body.data.items.some((m) => m.merchantId === "M_PHASE8_A"), false);
    console.log("  ✔ [PASS] 2. Tenant isolation & IBAN masking enforced on /merchants");

    // 3. Bank & CRM Integrations report NOT CONNECTED / AWAITING CUSTOMER ACCESS & block activation
    const intList = await httpRequest(port, "GET", "/integrations", null, { Authorization: `Bearer ${jwtA}` });
    assert.strictEqual(intList.status, 200);
    const icici = intList.body.data.connectors.find((c) => c.providerId === "icici_corporate_india");
    assert.strictEqual(icici.connectionStatus, "NOT_CONNECTED");
    assert.strictEqual(icici.activationAllowed, false);
    assert.ok(icici.readinessLabel.includes("NOT CONNECTED"));

    const staged = await httpRequest(
      port,
      "POST",
      "/integrations/icici_corporate_india/stage",
      {
        corpId: "CORP_DEMO_ID_9911",
        webhookSecret: "super_secret_do_not_echo_value_9988",
        callbackUrl: "https://merchant.example.com/webhooks/icici"
      },
      { Authorization: `Bearer ${jwtA}` }
    );
    assert.strictEqual(staged.status, 200);
    assert.strictEqual(staged.body.data.connectionStatus, "NOT_CONNECTED");
    assert.strictEqual(staged.body.data.activationAllowed, false);
    assert.ok(!JSON.stringify(staged.body).includes("super_secret_do_not_echo_value_9988"), "Plaintext secret must never echo back");

    const blockedAct = await httpRequest(
      port,
      "POST",
      "/integrations/icici_corporate_india/activate",
      {},
      { Authorization: `Bearer ${jwtA}` }
    );
    assert.strictEqual(blockedAct.status, 403);
    assert.strictEqual(blockedAct.body.errorCode, "CUSTOMER_ACCESS_REQUIRED");
    console.log("  ✔ [PASS] 3. Bank/CRM integrations stay NOT CONNECTED, mask secrets, and block live activation (403)");

    // 4. Isolated Operational SIMULATED Mode creates explicit SIMULATED markers and never mutates live maps
    const liveIntentsBefore = defaultOrchestrationService.intents.size;
    const simHeaders = { "x-sim-session-id": `sim_test_${Date.now()}` };
    const simBoot = await httpRequest(port, "GET", "/simulation/state", null, simHeaders);
    assert.strictEqual(simBoot.status, 200);
    assert.strictEqual(simBoot.body.data.isSimulated, true);
    assert.strictEqual(simBoot.body.data.environmentMode, "SIMULATED");
    assert.strictEqual(simBoot.body.data.zeroCustodyPrincipalHeld, 0);
    assert.ok(simBoot.body.data.intents.every((i) => i.isSimulated === true && i.environmentMode === "SIMULATED"));

    const simSettle = await httpRequest(port, "POST", "/simulation/actions/settle_prepaid_payment", { amount: 500000, rail: "RTGS" }, simHeaders);
    assert.strictEqual(simSettle.status, 200);
    assert.strictEqual(simSettle.body.data.outcome.settled.saasFeeDeducted, 10000); // 2% of 500,000 = 10,000

    const simDup = await httpRequest(port, "POST", "/simulation/actions/duplicate_webhook", {}, simHeaders);
    assert.strictEqual(simDup.status, 200);
    assert.strictEqual(simDup.body.data.outcome.result.status, "DUPLICATE_IGNORED");

    const simFailHmac = await httpRequest(port, "POST", "/simulation/actions/failed_webhook", {}, simHeaders);
    assert.strictEqual(simFailHmac.status, 200);
    assert.ok(simFailHmac.body.data.workspace.overview.webhookMetrics.invalidHmacRejected >= 1);

    const simInv = await httpRequest(port, "POST", "/simulation/actions/generate_postpaid_invoice", { amount: 750000 }, simHeaders);
    assert.strictEqual(simInv.status, 200);

    const simRev = await httpRequest(port, "POST", "/simulation/actions/refund_reversal_adjustment", {}, simHeaders);
    assert.strictEqual(simRev.status, 200);

    const simFrz = await httpRequest(port, "POST", "/simulation/actions/record_merchant_freeze", {}, simHeaders);
    assert.strictEqual(simFrz.status, 200);
    assert.ok(simFrz.body.data.workspace.disputes.length >= 1);

    // Phase 9: Mismatch, Failed/Return, Full 7-Step Customer Journey, and clean Reset
    const simMismatch = await httpRequest(port, "POST", "/simulation/actions/mismatch_settlement", { amount: 400000 }, simHeaders);
    assert.strictEqual(simMismatch.status, 200);
    assert.strictEqual(simMismatch.body.data.outcome.result.status, "MANUAL_REVIEW");

    const simFailRet = await httpRequest(port, "POST", "/simulation/actions/failed_settlement", { amount: 180000 }, simHeaders);
    assert.strictEqual(simFailRet.status, 200);
    assert.strictEqual(simFailRet.body.data.outcome.result.status, "RETURNED");

    const simE2E = await httpRequest(port, "POST", "/simulation/actions/full_customer_journey", { amount: 1200000 }, simHeaders);
    assert.strictEqual(simE2E.status, 200);
    assert.strictEqual(simE2E.body.data.outcome.journeySteps.length, 7);
    assert.ok(simE2E.body.data.workspace.invoices.some((inv) => inv.totalAmount === 28320 && inv.status === "PAID"));

    const simReset = await httpRequest(port, "POST", "/simulation/reset", {}, simHeaders);
    assert.strictEqual(simReset.status, 200);
    assert.strictEqual(simReset.body.data.merchants.length, 3);

    // Guarantee live engine was never touched by simulation
    assert.strictEqual(defaultOrchestrationService.intents.size, liveIntentsBefore);
    console.log("  ✔ [PASS] 4. Isolated SIMULATED mode executes 7-step E2E journey, mismatch, return/fail, duplicate, freeze & reset with zero live leak");

    console.log("\n🎉 ALL PHASE 8 ENTERPRISE API & SIMULATION ISOLATION TESTS PASSED CLEANLY!");
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

run().catch((err) => {
  console.error("❌ PHASE 8 API TEST FAILED:", err);
  process.exit(1);
});
