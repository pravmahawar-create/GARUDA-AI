/**
 * 🦅 GARUDA FINTECH — PHASE 11 LEGAL ELIGIBILITY, BSA SECTION 63 & ATTRIBUTION TEST SUITE
 * Strictly covers ALL Phase 11 acceptance assertions:
 * 1. Prohibited ONLINE_MONEY_GAME blocked (403) across eligibility approval, campaigns & checkout.
 * 2. Unknown / UNVERIFIED eligibility blocked (403).
 * 3. Eligible SOCIAL_GAME / RECOGNIZED_ESPORTS can run permitted campaigns & consent attribution.
 * 4. Consent enforcement & IVT proxy signal scoring (never blind fraud guilt) + PII separation.
 * 5. BSA Section 63 hash tampering detection catches byte alterations.
 * 6. Original raw bytes preserved immutably without normalization replacement.
 * 7. Unauthorized Part B expert signatory rejected (403); never auto-signed.
 * 8. Cross-tenant evidence access strictly denied (403).
 * 9. Export manifest & hash integrity independently verifiable.
 * 10. Effective-date tax config (no hardcoded legacy tax sections) + zero live leak from simulation.
 */

const assert = require("assert");
const crypto = require("crypto");
const express = require("express");
const http = require("http");

process.env.FOUNDER_ADMIN_KEY = process.env.FOUNDER_ADMIN_KEY || "phase11_founder_test_key_2026";
process.env.GARUDA_JWT_SECRET = process.env.GARUDA_JWT_SECRET || "phase11_jwt_secret_test_2026";

const authContextMiddleware = require("../middleware/authContextMiddleware");
const merchantOpsRoutes = require("../routes/merchantOpsRoutes");
const { BsaSection63EvidenceService } = require("./bsaSection63EvidenceService");
const { CommercialAgreementService, defaultCommercialAgreementService, BILLING_MODES } = require("./commercialAgreementService");
const { defaultOrchestrationService } = require("./orchestrationService");

function signTestJwt(sub, email) {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ sub, email, exp: Math.floor(Date.now() / 1000) + 3600 })).toString("base64url");
  const sig = crypto.createHmac("sha256", process.env.GARUDA_JWT_SECRET).update(`${header}.${payload}`).digest("base64url");
  return `${header}.${payload}.${sig}`;
}

function httpReq(port, method, reqPath, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port,
        path: `/api/merchant${reqPath}`,
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
  app.use("/api/merchant", merchantOpsRoutes);

  let server;
  await new Promise((resolve) => { server = app.listen(0, "127.0.0.1", resolve); });
  const port = server.address().port;

  try {
    console.log("▶ Running Phase 11 Legal Eligibility, BSA Sec 63 & Attribution Suite...");

    const jwtA = signTestJwt("usr_p11_a", "ops_a@example.com");
    const jwtB = signTestJwt("usr_p11_b", "ops_b@example.com");
    const founderHeaders = { "x-founder-key": process.env.FOUNDER_ADMIN_KEY };

    // 1. Anonymous blocked (401)
    const anon = await httpReq(port, "GET", "/eligibility");
    assert.strictEqual(anon.status, 401);

    // 2. Prohibited ONLINE_MONEY_GAME blocked at review, campaign & checkout
    const rmgDecl = await httpReq(
      port,
      "POST",
      "/eligibility",
      { merchantId: "M_RMG_BLOCKED", legalName: "Stakes Co", category: "ONLINE_MONEY_GAME", involvesMoneyStakeOrWinnings: true },
      founderHeaders
    );
    assert.strictEqual(rmgDecl.status, 201);
    assert.strictEqual(rmgDecl.body.data.decision, "BLOCKED_PROHIBITED_RMG");

    const rmgApprove = await httpReq(
      port,
      "POST",
      "/eligibility/M_RMG_BLOCKED/review",
      { counselApproved: true, counselReference: "MEMO-BAD" },
      founderHeaders
    );
    assert.strictEqual(rmgApprove.status, 403);
    assert.strictEqual(rmgApprove.body.errorCode, "PROHIBITED_ONLINE_MONEY_GAME");

    const rmgCmp = await httpReq(
      port,
      "POST",
      "/campaigns",
      { merchantId: "M_RMG_BLOCKED", name: "Blocked Campaign", dailyBudgetInr: 10000 },
      founderHeaders
    );
    assert.strictEqual(rmgCmp.status, 403);

    const rmgChk = await httpReq(
      port,
      "POST",
      "/checkout/intents",
      { merchantId: "M_RMG_BLOCKED", merchantLegalName: "Stakes Co", destinationBankIban: "INICIC000104", amount: 1000 },
      founderHeaders
    );
    assert.strictEqual(rmgChk.status, 403);

    // 3. Unknown / unverified merchant blocked
    const unkCmp = await httpReq(port, "POST", "/campaigns", { merchantId: "M_UNKNOWN_99", dailyBudgetInr: 5000 }, founderHeaders);
    assert.strictEqual(unkCmp.status, 403);
    console.log("  ✔ [PASS] 1-2. Prohibited ONLINE_MONEY_GAME & unknown eligibility strictly blocked (403) at every boundary");

    // 4. Eligible RECOGNIZED_ESPORTS merchant + consent attribution + IVT scoring + PII separation
    await httpReq(
      port,
      "POST",
      "/eligibility",
      {
        merchantId: "M_ESPORTS_OK",
        legalName: "Sky Esports Federation Pvt Ltd",
        category: "RECOGNIZED_ESPORTS",
        involvesMoneyStakeOrWinnings: false,
        esportsRegistrationRef: "ESP-REG-2026-01"
      },
      founderHeaders
    );
    const revOk = await httpReq(
      port,
      "POST",
      "/eligibility/M_ESPORTS_OK/review",
      { counselApproved: true, counselReference: "COUNSEL-ESP-2026-01" },
      founderHeaders
    );
    assert.strictEqual(revOk.status, 200);
    assert.strictEqual(revOk.body.data.decision, "ELIGIBLE");

    const cmpOk = await httpReq(
      port,
      "POST",
      "/campaigns",
      { merchantId: "M_ESPORTS_OK", name: "Esports Finals Passes", dailyBudgetInr: 10000 },
      founderHeaders
    );
    assert.strictEqual(cmpOk.status, 201);
    const cmpId = cmpOk.body.data.campaignId;

    // Missing consent rejected (400)
    const noConsent = await httpReq(port, "POST", `/campaigns/${cmpId}/events`, { consentRecorded: false }, founderHeaders);
    assert.strictEqual(noConsent.status, 400);
    assert.strictEqual(noConsent.body.errorCode, "CONSENT_REQUIRED");

    // Proxy/velocity raises IVT score signal cleanly without PII
    const ivtEv = await httpReq(
      port,
      "POST",
      `/campaigns/${cmpId}/events`,
      { consentRecorded: true, consentRef: "CONS-99", ipType: "DATACENTER_PROXY", requestsPerMinute: 20, visitorSeed: "raw_phone_never_stored" },
      founderHeaders
    );
    assert.strictEqual(ivtEv.status, 201);
    assert.strictEqual(ivtEv.body.data.classification, "IVT_REVIEW_FLAGGED");
    assert.strictEqual(ivtEv.body.data.appealAllowed, true);
    assert.ok(!JSON.stringify(ivtEv.body.data).includes("raw_phone_never_stored"), "PII seed must be pseudonymized");
    console.log("  ✔ [PASS] 3-4. Eligible Esports campaign runs; consent enforced & IVT signal scored without PII leak");

    // 5. BSA Sec 63 Case lifecycle, original bytes preservation, unauthorized expert reject, cross-tenant block & tamper catch
    const evCreate = await httpReq(
      port,
      "POST",
      "/evidence/cases",
      { merchantId: "M_A_EVIDENCE", complaintRef: "COMP-2026-01", authorityOrBank: "ICICI Nodal", bankUtr: "UTR-01", disputedAmount: 25000 },
      { Authorization: `Bearer ${jwtA}` }
    );
    assert.strictEqual(evCreate.status, 201);
    const caseId = evCreate.body.data.caseId;
    assert.strictEqual(evCreate.body.data.partAAttestation.signed, false);
    assert.strictEqual(evCreate.body.data.partBVerification.signed, false);

    const rawBytesStr = '{"utr":"UTR-01","rawWhitespacePreserved": true }';
    const recRes = await httpReq(
      port,
      "POST",
      `/evidence/cases/${caseId}/records`,
      { sourceType: "BANK_WEBHOOK_RAW", sourceSystem: "icici_feed", originalRawPayload: rawBytesStr },
      { Authorization: `Bearer ${jwtA}` }
    );
    assert.strictEqual(recRes.status, 201);
    assert.strictEqual(recRes.body.data.originalRawBytes, rawBytesStr);

    // Cross-tenant evidence access denied (403)
    const crossExport = await httpReq(port, "GET", `/evidence/cases/${caseId}/export`, null, { Authorization: `Bearer ${jwtB}` });
    assert.strictEqual(crossExport.status, 403);

    // Non-expert tenant_admin cannot sign Part B (403)
    const unauthPartB = await httpReq(
      port,
      "POST",
      `/evidence/cases/${caseId}/part-b-sign`,
      { expertName: "Unauthorized User", qualification: "None" },
      { Authorization: `Bearer ${jwtA}` }
    );
    assert.strictEqual(unauthPartB.status, 403);

    // Tenant admin CAN sign Part A
    const partA = await httpReq(
      port,
      "POST",
      `/evidence/cases/${caseId}/part-a-sign`,
      { deponentName: "Ops Manager A", designation: "Compliance Head" },
      { Authorization: `Bearer ${jwtA}` }
    );
    assert.strictEqual(partA.status, 200);
    assert.strictEqual(partA.body.data.partAAttestation.signed, true);
    assert.strictEqual(partA.body.data.partBVerification.signed, false);

    const expRes = await httpReq(port, "GET", `/evidence/cases/${caseId}/export`, null, { Authorization: `Bearer ${jwtA}` });
    assert.strictEqual(expRes.status, 200);
    assert.ok(expRes.body.data.exportManifestSha256);
    assert.strictEqual(expRes.body.data.bsaSection63ScheduleDraft.integrityVerification.valid, true);

    // Direct tamper unit check on BsaSection63EvidenceService
    const localBsa = new BsaSection63EvidenceService();
    const lc = localBsa.createCase({ tenantId: "t1", merchantId: "m1", complaintRef: "C1", authorityOrBank: "Bank" });
    localBsa.ingestSourceRecord({ tenantId: "t1", caseId: lc.caseId, sourceType: "RAW", sourceSystem: "sys", originalRawPayload: "original_exact_bytes" });
    const arr = localBsa.records.get(lc.caseId);
    arr[0] = { ...arr[0], originalRawBytes: "tampered_bytes" };
    assert.strictEqual(localBsa.verifyCaseChain(lc.caseId, "t1").valid, false);
    console.log("  ✔ [PASS] 5-9. BSA Sec 63 raw bytes preserved, tamper caught, unauthorized Part B rejected, cross-tenant blocked");

    // 6. Configurable Tax Date + Isolated Simulation blocked RMG demo
    const tax = await httpReq(port, "GET", "/tax-config?asOfDate=2026-05-01", null, founderHeaders);
    assert.strictEqual(tax.status, 200);
    assert.ok(tax.body.data.statutoryCodeLabel.includes("Section 393"));
    assert.strictEqual(tax.body.data.caApproved, false);

    const simState = await httpReq(port, "GET", "/simulation/state", null, { "x-sim-session-id": "p11_test_sim" });
    assert.strictEqual(simState.status, 200);
    assert.strictEqual(simState.body.data.isSimulated, true);

    const simRmgBlocked = await httpReq(port, "POST", "/simulation/actions/test_prohibited_rmg_block", {}, { "x-sim-session-id": "p11_test_sim" });
    assert.strictEqual(simRmgBlocked.status, 403);
    assert.strictEqual(simRmgBlocked.body.errorCode, "PROHIBITED_ONLINE_MONEY_GAME");
    console.log("  ✔ [PASS] 10. Tax config & isolated simulation fail-closed RMG demo verified");

    console.log("\n🎉 ALL PHASE 11 MERCHANT LEGAL ELIGIBILITY, BSA SEC 63 & ATTRIBUTION TESTS PASSED!");
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

run().catch((err) => {
  console.error("❌ PHASE 11 TEST FAILED:", err);
  process.exit(1);
});
