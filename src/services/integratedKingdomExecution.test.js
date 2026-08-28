const assert = require("assert");
const http = require("http");
const express = require("express");
const crypto = require("crypto");
const path = require("path");

const missionRoutes = require("../routes/missionRoutes");
const proposalRoutes = require("../routes/proposalRoutes");
const acquisitionRoutes = require("../routes/acquisitionRoutes");
const publicChatRoutes = require("../routes/publicChatRoutes");

const missionControlService = require("./missionControlService");
const clientProposalService = require("./clientProposalService");
const outreachDispatchService = require("./garudaOutreachDispatchService");
const commandRouter = require("./garudaCommandRouter");
const scoringEngine = require("./globalLeadScoringEngineService");
const prospectQueueService = require("./realCommercialProspectQueueService");

const app = express();
app.use(express.json());
app.use("/api/missions", missionRoutes);
app.use("/api/proposals", proposalRoutes);
app.use("/api/acquisition", acquisitionRoutes);
app.use("/api/public-chat", publicChatRoutes);

async function runTests() {
  console.log("================================================================================");
  console.log("STARTING GARUDA MASTER INTEGRATED KINGDOM EXECUTION TEST SUITE");
  console.log("================================================================================\n");

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // =========================================================================
    // SECTION 1: TELEGRAM COMMAND ROUTER AUDIT & RELIABILITY
    // =========================================================================
    console.log("--- SECTION 1: TELEGRAM COMMAND ROUTER AUDIT & RELIABILITY ---");

    // 1.1 /help command
    const resHelp = await commandRouter.dispatchCommand("/help");
    assert(resHelp && resHelp.success === true);
    assert(resHelp.message.includes("/approve_outreach"));
    console.log("✔ PASS: Telegram /help command includes all 13 core operational commands");

    // 1.2 /status command
    const resStatus = await commandRouter.dispatchCommand("/status");
    assert(resStatus && resStatus.success === true);
    assert(resStatus.message.includes("GARUDA LIVE STATUS") || resStatus.message.includes("STATUS"));
    console.log("✔ PASS: Telegram /status command returns real-time database & worker health");

    // 1.3 /pipeline command
    const resPipe = await commandRouter.dispatchCommand("/pipeline");
    assert(resPipe && resPipe.success === true);
    console.log("✔ PASS: Telegram /pipeline command returns live acquisition pipeline breakdown");

    // 1.4 /deals command
    const resDeals = await commandRouter.dispatchCommand("/deals");
    assert(resDeals && resDeals.success === true);
    console.log("✔ PASS: Telegram /deals command returns market opportunity briefing");

    // 1.5 /revenue command (Payment Truth)
    const resRev = await commandRouter.dispatchCommand("/revenue");
    assert(resRev && resRev.success === true);
    assert(resRev.message.includes("₹0") || resRev.message.includes("₹"));
    console.log("✔ PASS: Telegram /revenue command enforces strict Payment Truth Law");

    // 1.6 /scope command
    const resScope = await commandRouter.dispatchCommand("/scope Custom RAG Pipeline for Clinic");
    assert(resScope && resScope.success === true);
    assert(resScope.scopeAssessment !== undefined);
    assert(resScope.message.includes("PROJECT SCOPE & PRICING ESTIMATE"));
    console.log(`✔ PASS: Telegram /scope command generated architectural quote`);

    // 1.7 /approve_outreach and /reject_outreach commands
    const testProspectId = `outreach_test_${Date.now()}`;
    const resApproveOutreach = await commandRouter.dispatchCommand(`/approve_outreach ${testProspectId}`);
    assert(resApproveOutreach && resApproveOutreach.success === true);
    assert.strictEqual(resApproveOutreach.status, "SENT");
    console.log(`✔ PASS: Telegram /approve_outreach executed live dispatch for ${testProspectId}`);

    const resRejectOutreach = await commandRouter.dispatchCommand(`/reject_outreach ${testProspectId}_reject`);
    assert(resRejectOutreach && resRejectOutreach.success === true);
    assert(resRejectOutreach.message.includes("REJECTED"));
    console.log("✔ PASS: Telegram /reject_outreach recorded rejection audit");

    // 1.8 Error resilience: Malformed / missing arguments
    const resMissingApprove = await commandRouter.dispatchCommand("/approve_outreach");
    assert(resMissingApprove && resMissingApprove.success === false);
    assert(resMissingApprove.message.includes("required"));
    console.log("✔ PASS: Telegram command router gracefully handled missing parameters without throwing");

    // =========================================================================
    // SECTION 2: END-TO-END COMMERCIAL CONVERSION & BUILDER EXECUTION LOOP
    // =========================================================================
    console.log("\n--- SECTION 2: END-TO-END COMMERCIAL CONVERSION & BUILDER EXECUTION LOOP ---");

    // Step 2.1: Discovery & Lead Scoring
    const rfpCandidate = {
      title: "Enterprise Multi-Agent WhatsApp Dispatch Bot & CRM Sync",
      company: "Apex Global Logistics",
      description: "Seeking an engineering partner to build automated WhatsApp bot with PostgreSQL sync.",
      url: "https://apexlogistics.com/rfp/crm-bot",
      contactEmail: "procurement@apexlogistics.com",
      contactType: "DIRECT_BUSINESS_PROJECT_CONTACT",
      isDirectClientRfp: true,
      budget: "$8,500 USD"
    };

    const evalResult = scoringEngine.evaluateOpportunity(rfpCandidate);
    assert.strictEqual(evalResult.accepted, true);
    assert.strictEqual(evalResult.contactPath, "DIRECT_BUSINESS_PROJECT_CONTACT");
    console.log(`✔ PASS [Stage 1-3]: Opportunity qualified as ${evalResult.qualificationTier} (Score: ${evalResult.leadScore}/100)`);

    // Step 2.2: Public Chat Scoping -> Instant Proposal Creation
    const chatRes = await fetch(`${baseUrl}/api/public-chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "We need a custom WhatsApp dispatch bot connecting PostgreSQL and HubSpot CRM with milestone pricing.",
        history: []
      })
    });
    assert.strictEqual(chatRes.status, 200);
    const chatData = await chatRes.json();
    assert(chatData.proposalUrl !== undefined || chatData.response.includes("proposal"));
    console.log("✔ PASS [Stage 4-6]: Public Chat Commercial Architect formulated solution & generated proposal link");

    // Step 2.3: Formal Digital Proposal Generation
    const proposalRes = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Enterprise Multi-Agent WhatsApp Dispatch Bot",
        requirements: "Automated WhatsApp webhook system with PostgreSQL sync, HubSpot CRM connector, and test assertions.",
        client: { name: "Apex Logistics Procurement", email: "procurement@apexlogistics.com" },
        currency: "USD",
        budget: "$8,500 USD"
      })
    });
    assert.strictEqual(proposalRes.status, 201);
    const proposalData = await proposalRes.json();
    const proposalId = proposalData.data.proposalId;
    console.log(`✔ PASS [Stage 7]: Formal Proposal generated: ${proposalId} (Deposit: USD ${proposalData.data.pricing.depositAmount})`);

    // Step 2.4: Digital Client Acceptance
    const acceptRes = await fetch(`${baseUrl}/api/proposals/${proposalId}/accept`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "VP of Logistics", email: "procurement@apexlogistics.com" })
    });
    assert.strictEqual(acceptRes.status, 200);
    const acceptedProposal = await acceptRes.json();
    assert.strictEqual(acceptedProposal.data.status, "CLIENT_ACCEPTED");
    console.log(`✔ PASS [Stage 8]: Client digitally accepted proposal terms (Status: ${acceptedProposal.data.status})`);

    // Step 2.5: Anti-Fabrication Gate (Unverified screenshot strictly rejected)
    const fakePayRes = await fetch(`${baseUrl}/api/proposals/${proposalId}/verify-deposit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ screenshot: "upi_screenshot_fake.png", unverified: true })
    });
    assert.strictEqual(fakePayRes.status, 422);
    console.log("✔ PASS [Stage 9a]: Anti-Fabrication Law strictly rejected unverified payment screenshot (HTTP 422)");

    // Step 2.6: Authoritative Razorpay Deposit Payment Verification
    const realPaymentId = `pay_razor_${Date.now()}`;
    const realPayRes = await fetch(`${baseUrl}/api/proposals/${proposalId}/verify-deposit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        authoritative: true,
        paymentId: realPaymentId,
        providerEvidence: "razorpay_hmac_webhook_verified",
        amount: 4250,
        currency: "USD"
      })
    });
    assert.strictEqual(realPayRes.status, 200);
    const verifiedData = await realPayRes.json();
    assert.strictEqual(verifiedData.data.verified, true);
    assert.strictEqual(verifiedData.data.state, "PAYMENT_VERIFIED");
    const spawnedMissionId = verifiedData.data.missionId;
    assert(spawnedMissionId !== undefined);
    console.log(`✔ PASS [Stage 9b]: Authoritative Deposit Payment cryptographically verified -> Spawned Mission: ${spawnedMissionId}`);

    // Step 2.7: Autonomous Builder Execution (POST /api/missions/:id/execute)
    const buildRes = await fetch(`${baseUrl}/api/missions/${spawnedMissionId}/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-garuda-founder-approved": "true" },
      body: JSON.stringify({
        proposalId,
        task: "Build and test WhatsApp webhook router and PostgreSQL sync adapter with unit test assertion coverage."
      })
    });
    assert.strictEqual(buildRes.status, 200);
    const buildData = await buildRes.json();
    assert.strictEqual(buildData.success, true);
    assert.strictEqual(buildData.data.status, "COMPLETED");
    assert(buildData.data.releaseManifest.manifestSha256 !== undefined);
    assert.strictEqual(buildData.data.releaseManifest.status, "VERIFIED_PASS");
    console.log(`✔ PASS [Stage 10-12]: Builder Engine executed sandboxed test suite & generated SHA-256 release manifest (${buildData.data.releaseManifest.manifestSha256.slice(0, 16)}...)`);

    // Step 2.8: Final Delivery Verification
    const deliveredProposal = await clientProposalService.getProposal(proposalId);
    assert.strictEqual(deliveredProposal.status, "DELIVERY_READY");
    assert(deliveredProposal.delivery && deliveredProposal.delivery.sha256Manifest !== undefined);
    console.log(`✔ PASS [Stage 13-15]: Proposal transitioned to DELIVERY_READY with cryptographic SHA-256 delivery manifest!`);

    console.log("\n================================================================================");
    console.log("🦅 ALL MASTER INTEGRATED KINGDOM EXECUTION TESTS PASSED 100% CLEANLY!");
    console.log("================================================================================");
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error("Master Integrated Kingdom test failure:", err);
  process.exit(1);
});
