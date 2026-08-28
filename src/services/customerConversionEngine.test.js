const assert = require("assert");
const http = require("http");
const express = require("express");
const conversionService = require("./customerConversionService");
const failureIntel = require("./conversionFailureIntelligenceService");
const acquisitionRoutes = require("../routes/acquisitionRoutes");

const app = express();
app.use(express.json());
app.use("/api/acquisition", acquisitionRoutes);

async function runTests() {
  console.log("Starting GARUDA Milestone 30: Complete Customer Conversion & Failure Intelligence Test Suite...\n");

  // --- 1. Failure Intelligence Catalog Verification ---
  console.log("--- 1. Failure Intelligence Catalog Verification ---");
  const blockers = failureIntel.getAllBlockerDefinitions();
  assert(blockers.length >= 15, `Must have at least 15 blocker definitions, found ${blockers.length}`);
  const sample = failureIntel.diagnoseBlocker("OUTBOUND_CREDENTIAL_MISSING");
  assert.strictEqual(sample.code, "OUTBOUND_CREDENTIAL_MISSING");
  assert.strictEqual(sample.severity, "HIGH");
  assert(sample.nextAction.includes("SMTP"));
  console.log(`✔ PASS: 15 Commercial Blocker definitions verified with actionable remediation guidance`);

  // --- 2. Lead Discovery & Qualification (Stage 1-3) ---
  console.log("\n--- 2. Lead Discovery & Qualification (Stage 1-3) ---");
  const leadOpp = {
    company: "Nexus AI Healthcare (TEST / SIMULATION)",
    title: "Need Custom Medical Document RAG & Vector Search MVP",
    description: "Looking for an engineering team to develop a HIPAA-compliant document embedding pipeline with PostgreSQL and Next.js portal. Fixed budget $4,500 USD.",
    url: "https://example.com/rfp/nexus-health",
    salary: "$4,500",
    tags: ["rag", "ai", "postgres", "next.js"],
    isTest: true
  };

  const initResult = await conversionService.initiateConversionFromOpportunity(leadOpp, { isTest: true });
  assert.strictEqual(initResult.success, true);
  assert(initResult.conversionId.startsWith("conv_"));
  assert.strictEqual(initResult.record.stage, "OUTREACH_READY");
  assert.strictEqual(initResult.record.blocker.code, "FOUNDER_APPROVAL_REQUIRED");
  const convId = initResult.conversionId;
  console.log(`✔ PASS: Lead qualified and conversion pipeline initialized: ${convId} (Status: OUTREACH_READY)`);

  // --- 3. Governed Outreach Dispatch (Stage 4) ---
  console.log("\n--- 3. Governed Outreach Dispatch (Stage 4) ---");
  const dispatchResult = await conversionService.approveAndDispatchOutreach(convId, { actor: "founder" });
  assert.strictEqual(dispatchResult.success, true);
  assert.strictEqual(dispatchResult.record.stage, "OUTREACH_SENT");
  assert.strictEqual(dispatchResult.record.blocker.code, "CLIENT_NOT_RESPONDED");
  console.log("✔ PASS: Founder approval recorded and outreach dispatched (Status: OUTREACH_SENT)");

  // --- 4. Inbound Prospect Response (Stage 5) ---
  console.log("\n--- 4. Inbound Prospect Response (Stage 5) ---");
  const responseResult = await conversionService.handleProspectResponse(convId, {
    message: "We are interested in the RAG pipeline. Can you share exact milestones and deposit details?"
  });
  assert.strictEqual(responseResult.success, true);
  assert.strictEqual(responseResult.record.stage, "CONVERSATION_ACTIVE");
  assert.strictEqual(responseResult.record.blocker.code, "SCOPE_INCOMPLETE");
  console.log("✔ PASS: Prospect response captured into conversation state (Status: CONVERSATION_ACTIVE)");

  // --- 5. Commercial Scoping & Formal Proposal Generation (Stage 6-7) ---
  console.log("\n--- 5. Commercial Scoping & Formal Proposal Generation (Stage 6-7) ---");
  const scopeResult = await conversionService.scopeAndCreateProposal(convId, {
    projectTitle: "Healthcare Document RAG Search MVP",
    clientEmail: "contact@nexushealth.ai",
    totalAmount: 25000,
    currency: "INR"
  });
  assert.strictEqual(scopeResult.success, true);
  assert(scopeResult.proposal.proposalId.startsWith("prop_"));
  assert.strictEqual(scopeResult.record.stage, "PROPOSAL_READY");
  assert.strictEqual(scopeResult.record.blocker.code, "PROPOSAL_NOT_ACCEPTED");
  console.log(`✔ PASS: Solution Architect scope formulated -> Proposal: ${scopeResult.proposal.proposalId}`);

  // --- 6. Digital Client Acceptance (Stage 8) ---
  console.log("\n--- 6. Digital Client Acceptance (Stage 8) ---");
  const acceptResult = await conversionService.clientAcceptProposal(convId, {
    signerName: "Dr. Elena Rostova",
    signerEmail: "elena@nexushealth.ai"
  });
  assert.strictEqual(acceptResult.success, true);
  assert.strictEqual(acceptResult.record.stage, "CLIENT_ACCEPTED");
  assert.strictEqual(acceptResult.record.blocker.code, "PAYMENT_PENDING");
  console.log("✔ PASS: Client terms signed digitally (Status: CLIENT_ACCEPTED | Blocker: PAYMENT_PENDING)");

  // --- 7. Payment Truth Law: Fake Payment Claim Strictly Rejected ---
  console.log("\n--- 7. Payment Truth Law: Fake Payment Claim Strictly Rejected ---");
  const fakeDeposit = await conversionService.processAuthoritativeDeposit(convId, {
    rawClaimText: "I paid via UPI ref 99998888, please start work immediately"
  });
  assert.strictEqual(fakeDeposit.verified, false);
  assert.strictEqual(fakeDeposit.record.blocker.code, "PAYMENT_UNVERIFIED");
  console.log("✔ PASS: Unverified payment claim strictly rejected by Anti-Fabrication Law (Blocker: PAYMENT_UNVERIFIED)");

  // --- 8. Authoritative Deposit Payment & ≤ ₹25k Autonomous Execution (Stage 9-11) ---
  console.log("\n--- 8. Authoritative Deposit Payment & Autonomous Execution (Stage 9-11) ---");
  const validDeposit = await conversionService.processAuthoritativeDeposit(convId, {
    paymentMethod: "razorpay_webhook",
    razorpayPaymentId: "pay_test_m30_valid_deposit_101",
    amountINR: 12500,
    isTest: true
  });
  assert.strictEqual(validDeposit.verified, true);
  assert.strictEqual(validDeposit.record.stage, "PAYMENT_VERIFIED");
  assert(validDeposit.record.missionId.startsWith("mission_"));
  console.log(`✔ PASS: Authoritative deposit verified -> Governed Mission initialized: ${validDeposit.record.missionId}`);

  // --- 9. Delivery Manifest & Final Revenue Settlement (Stage 12-14) ---
  console.log("\n--- 9. Delivery Manifest & Final Revenue Settlement (Stage 12-14) ---");
  const deliveryResult = await conversionService.deliverAndSettleProject(convId, {
    paymentMethod: "razorpay_webhook",
    razorpayPaymentId: "pay_test_m30_final_settlement_102",
    amountINR: 12500,
    isTest: true
  });
  assert.strictEqual(deliveryResult.success, true);
  assert.strictEqual(deliveryResult.record.stage, "CLOSED_REVENUE_REALIZED");
  console.log("✔ PASS: Cryptographic delivery manifest verified & final settlement closed (Status: CLOSED_REVENUE_REALIZED)");

  // Start HTTP Server for REST API verification
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // --- 10. REST API: GET /api/acquisition/failure-intelligence ---
    console.log("\n--- 10. REST API: GET /api/acquisition/failure-intelligence ---");
    const resFail = await fetch(`${baseUrl}/api/acquisition/failure-intelligence`);
    const failData = await resFail.json();
    assert.strictEqual(resFail.status, 200);
    assert(failData.count >= 15);
    console.log("✔ PASS: GET /api/acquisition/failure-intelligence returned full blocker catalog");

    // --- 11. REST API: GET /api/acquisition/conversions/telemetry ---
    console.log("\n--- 11. REST API: GET /api/acquisition/conversions/telemetry ---");
    const resConv = await fetch(`${baseUrl}/api/acquisition/conversions/telemetry`);
    const convData = await resConv.json();
    assert.strictEqual(resConv.status, 200);
    assert(convData.telemetry.totalConversions >= 1);
    console.log("✔ PASS: GET /api/acquisition/conversions/telemetry returned active conversion records");

    // --- 12. REST API: GET /api/acquisition/command-center ---
    console.log("\n--- 12. REST API: GET /api/acquisition/command-center ---");
    const resCC = await fetch(`${baseUrl}/api/acquisition/command-center`, {
      headers: { "x-garuda-test": "true" }
    });
    const ccData = await resCC.json();
    assert.strictEqual(resCC.status, 200);
    assert(ccData.conversions !== undefined);
    assert(ccData.failureIntelligence !== undefined);
    assert.strictEqual(ccData.truthDeclaration.realCustomerRevenue, "₹0");
    console.log("✔ PASS: Acquisition Command Center unified conversion telemetry, failure intel, and revenue truth");

    console.log("\n🦅 ALL 12 MILESTONE 30 CUSTOMER CONVERSION TEST CASES PASSED CLEANLY!");
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error("Milestone 30 test failure:", err);
  process.exit(1);
});
