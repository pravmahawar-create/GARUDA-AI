const assert = require("assert");
const http = require("http");
const express = require("express");
const discoveryRegistry = require("./discoveryAdapters/adapterRegistry");
const scoringEngine = require("./globalLeadScoringEngineService");
const outreachDispatch = require("./garudaOutreachDispatchService");
const conversionService = require("./customerConversionService");
const acquisitionRoutes = require("../routes/acquisitionRoutes");

const app = express();
app.use(express.json());
app.use("/api/acquisition", acquisitionRoutes);

async function runTests() {
  console.log("Starting GARUDA Milestone 31: First Real Customer Acquisition Test Suite...\n");

  // --- 1. Real Commercial Lead Inventory & Ranking ---
  console.log("--- 1. Real Commercial Lead Inventory & Ranking ---");
  const liveResults = await discoveryRegistry.fetchAllOpportunities();
  assert(liveResults.totalRawFetched > 0, "Must fetch opportunities from active adapters");
  assert(liveResults.uniqueCount > 0, "Must have unique normalized opportunities");

  const qualifiedLeads = [];
  for (const opp of liveResults.opportunities) {
    const evalRes = scoringEngine.evaluateOpportunity(opp);
    if (evalRes.accepted) {
      qualifiedLeads.push({
        title: opp.title,
        company: opp.company,
        score: evalRes.leadScore,
        tier: evalRes.qualificationTier,
        estimatedUSD: evalRes.estimatedUSD
      });
    }
  }

  assert(qualifiedLeads.length > 0, "Must identify qualified deliverable commercial opportunities");
  qualifiedLeads.sort((a, b) => b.score - a.score);
  console.log(`✔ PASS: Ranked ${qualifiedLeads.length} real commercial opportunities (Top Score: ${qualifiedLeads[0].score}/100)`);

  // --- 2. Outbound Relay Configuration & Blocker Exposure ---
  console.log("\n--- 2. Outbound Relay Configuration & Blocker Exposure ---");
  const relayStatus = outreachDispatch.getRelayConfigurationStatus();
  assert(typeof relayStatus.configured === "boolean");
  assert(typeof relayStatus.activeProvider === "string");
  if (!relayStatus.configured) {
    assert.strictEqual(relayStatus.remediation.code, "OUTBOUND_CREDENTIAL_MISSING");
    assert(relayStatus.remediation.requiredAction.includes("RESEND_API_KEY"));
  }
  console.log(`✔ PASS: Outbound relay status evaluated (Provider: ${relayStatus.activeProvider}, Configured: ${relayStatus.configured})`);

  // --- 3. Truthful Personalized Outreach Brief Generation ---
  console.log("\n--- 3. Truthful Personalized Outreach Brief Generation ---");
  const sampleProspect = {
    company: "Pinnacle Logistics Corp (TEST / SIMULATION)",
    serviceMatch: "business-workflow-ai-automation",
    leadScore: 88,
    prospectId: "outreach_m31_test_99"
  };
  const brief = outreachDispatch.generatePersonalizedOutreachBrief(sampleProspect);
  assert.strictEqual(brief.company, sampleProspect.company);
  assert(brief.portalLink.includes("business-workflow-ai-automation"));
  assert(brief.valueProposition.includes("SHA-256"));
  assert(!brief.valueProposition.includes("Google ranked"), "Must not make unsubstantiated marketing claims");
  console.log("✔ PASS: Truthful capability-grounded outreach brief generated without hyperbole");

  // --- 4. End-to-End Customer Conversion Cycle (Test Isolation) ---
  console.log("\n--- 4. End-to-End Customer Conversion Cycle (Test Isolation) ---");
  const initResult = await conversionService.initiateConversionFromOpportunity({
    company: "SaaS Alpha Systems (TEST / SIMULATION)",
    title: "Full-Stack Custom SaaS Billing Engine",
    description: "Looking for development team to build Stripe subscription billing and PostgreSQL user dashboard. Fixed budget $3,500.",
    url: "https://example.com/rfp/saas-alpha",
    salary: "$3,500",
    isTest: true
  }, { isTest: true });

  assert.strictEqual(initResult.success, true);
  const convId = initResult.conversionId;

  // Dispatch -> Response -> Scope -> Accept
  await conversionService.approveAndDispatchOutreach(convId, { actor: "founder", overrideFounderApproval: true });
  await conversionService.handleProspectResponse(convId, { message: "Ready to proceed. Please send proposal." });
  const scopeRes = await conversionService.scopeAndCreateProposal(convId, { totalAmount: 25000, currency: "INR" });
  await conversionService.clientAcceptProposal(convId, { signerName: "Founder Alpha" });

  // Payment Truth: Unverified fake payment rejected
  const fakePay = await conversionService.processAuthoritativeDeposit(convId, { rawClaimText: "Paid via UPI" });
  assert.strictEqual(fakePay.verified, false);

  // Authoritative Razorpay Webhook Verification
  const validPay = await conversionService.processAuthoritativeDeposit(convId, {
    paymentMethod: "razorpay_webhook",
    razorpayPaymentId: "pay_m31_valid_deposit_202",
    amountINR: 12500,
    isTest: true
  });
  assert.strictEqual(validPay.verified, true);
  assert(validPay.record.missionId.startsWith("mission_"));

  // Delivery & Final Settlement
  const settleRes = await conversionService.deliverAndSettleProject(convId, {
    paymentMethod: "razorpay_webhook",
    razorpayPaymentId: "pay_m31_final_settle_203",
    amountINR: 12500,
    isTest: true
  });
  assert.strictEqual(settleRes.success, true);
  assert.strictEqual(settleRes.record.stage, "CLOSED_REVENUE_REALIZED");
  console.log("✔ PASS: Complete 15-stage conversion cycle executed with strict Payment Truth");

  // Start HTTP Server for REST API verification
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // --- 5. REST API: GET /api/acquisition/outreach/metrics ---
    console.log("\n--- 5. REST API: GET /api/acquisition/outreach/metrics ---");
    const resOut = await fetch(`${baseUrl}/api/acquisition/outreach/metrics`);
    const outData = await resOut.json();
    assert.strictEqual(resOut.status, 200);
    assert(outData.metrics.relayStatus !== undefined);
    console.log("✔ PASS: GET /api/acquisition/outreach/metrics returns active relay configuration telemetry");

    // --- 6. REST API: GET /api/acquisition/command-center ---
    console.log("\n--- 6. REST API: GET /api/acquisition/command-center ---");
    const resCC = await fetch(`${baseUrl}/api/acquisition/command-center`, {
      headers: { "x-garuda-test": "true" }
    });
    const ccData = await resCC.json();
    assert.strictEqual(resCC.status, 200);
    assert(ccData.conversions !== undefined);
    assert(ccData.failureIntelligence !== undefined);
    assert.strictEqual(ccData.truthDeclaration.realCustomerRevenue, "₹0");
    console.log("✔ PASS: Acquisition Command Center verified with strict revenue truth (realCustomerRevenue: ₹0)");

    console.log("\n🦅 ALL 6 MILESTONE 31 FIRST CUSTOMER ACQUISITION TEST CASES PASSED CLEANLY!");
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error("Milestone 31 test failure:", err);
  process.exit(1);
});
