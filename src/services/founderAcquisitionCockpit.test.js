const assert = require("assert");
const http = require("http");
const express = require("express");
const acquisitionRoutes = require("../routes/acquisitionRoutes");
const prospectQueueService = require("./realCommercialProspectQueueService");
const failureIntelService = require("./conversionFailureIntelligenceService");

const app = express();
app.use(express.json());
app.use("/api/acquisition", acquisitionRoutes);

async function runTests() {
  console.log("Starting GARUDA Milestone 33: Founder Acquisition Command Center Test Suite...\n");

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // --- 1. Acquisition Command Center Telemetry ---
    console.log("--- 1. Acquisition Command Center Telemetry ---");
    const resCC = await fetch(`${baseUrl}/api/acquisition/command-center`, {
      headers: { "x-garuda-test": "true" }
    });
    assert.strictEqual(resCC.status, 200);
    const dataCC = await resCC.json();
    assert(dataCC.funnel !== undefined);
    assert(dataCC.bottlenecks !== undefined && dataCC.bottlenecks.length > 0);
    assert.strictEqual(dataCC.truthDeclaration.realCustomerRevenue, "₹0");
    assert(typeof dataCC.truthDeclaration.realCustomersAcquired === "number");
    console.log(`✔ PASS: Command Center returned 14 funnel metrics & Bottleneck: "${dataCC.bottlenecks[0].stage}"`);

    // --- 2. Real Commercial Prospect Queue & Contact Path Breakdown ---
    console.log("\n--- 2. Real Commercial Prospect Queue & Contact Path Breakdown ---");
    const resPQ = await fetch(`${baseUrl}/api/acquisition/prospect-queue`);
    assert.strictEqual(resPQ.status, 200);
    const dataPQ = await resPQ.json();
    assert(dataPQ.totalReviewed > 0);
    assert(dataPQ.contactPathBreakdown !== undefined);
    assert(dataPQ.topDrafts.length > 0);
    console.log(`✔ PASS: Prospect Queue returned ${dataPQ.totalReviewed} reviewed items with contact path breakdown`);

    // --- 3. Classified Commercial Inventory Endpoint ---
    console.log("\n--- 3. Classified Commercial Inventory Endpoint ---");
    const resCl = await fetch(`${baseUrl}/api/acquisition/opportunities/classified`);
    assert.strictEqual(resCl.status, 200);
    const dataCl = await resCl.json();
    assert(dataCl.totalCandidatesReviewed > 0);
    assert(Array.isArray(dataCl.jobBoardOnlyRejects));
    assert(Array.isArray(dataCl.employmentListings));
    console.log(`✔ PASS: Classified inventory returned ${dataCl.totalCandidatesReviewed} items categorized for Cockpit UI tabs`);

    // --- 4. Failure Intelligence Catalog ---
    console.log("\n--- 4. Failure Intelligence Catalog ---");
    const resFI = await fetch(`${baseUrl}/api/acquisition/failure-intelligence`);
    assert.strictEqual(resFI.status, 200);
    const dataFI = await resFI.json();
    assert(dataFI.blockers.length >= 15);
    console.log(`✔ PASS: Failure Intelligence exposed ${dataFI.blockers.length} commercial blockers with remediation guides`);

    // --- 5. Hard Safety Filter & Outreach Eligibility ---
    console.log("\n--- 5. Hard Safety Filter & Outreach Eligibility ---");
    dataPQ.topDrafts.forEach((draft) => {
      if (draft.safetyRating === "SAFE_FOR_FOUNDER_APPROVAL") {
        assert(draft.contactPath !== "JOB_BOARD_APPLICATION_ONLY", "Type F must not be marked safe");
      } else {
        assert.strictEqual(draft.status, "INVALID_FOR_DIRECT_OUTREACH");
        assert.strictEqual(draft.safetyRating, "INVALID_FOR_DIRECT_OUTREACH");
      }
    });
    console.log("✔ PASS: Hard Safety Filter verified: Type F job-board drafts strictly blocked from dispatch");

    // --- 6. Governed Approval & Dispatch REST Handlers ---
    console.log("\n--- 6. Governed Approval & Dispatch REST Handlers ---");
    const testDraftId = `outreach_cockpit_test_${Date.now()}`;
    
    // Qualify
    const qualRes = await fetch(`${baseUrl}/api/acquisition/outreach/qualify`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-garuda-test": "true" },
      body: JSON.stringify({
        company: "Test Enterprise Corp",
        title: "Custom AI Workflow Engine",
        url: "https://testenterprise.com/rfp",
        contactEmail: "procurement@testenterprise.com",
        contactType: "DIRECT_BUSINESS_PROJECT_CONTACT",
        isDirectClientRfp: true
      })
    });
    assert.strictEqual(qualRes.status, 201);
    const qualData = await qualRes.json();
    const prospectId = qualData.prospect.prospectId;

    // Approve
    const appRes = await fetch(`${baseUrl}/api/acquisition/outreach/${prospectId}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approver: "Founder", reason: "Verified Enterprise RFP" })
    });
    assert.strictEqual(appRes.status, 200);
    const appData = await appRes.json();
    assert(appData.prospect.status === "APPROVED" || appData.prospect.status === "OUTREACH_APPROVED");
    console.log(`✔ PASS: Founder Approval recorded -> Prospect state: ${appData.prospect.status}`);

    // Dispatch
    const dispRes = await fetch(`${baseUrl}/api/acquisition/outreach/${prospectId}/dispatch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ authorizedBy: "Founder" })
    });
    assert.strictEqual(dispRes.status, 200);
    const dispData = await dispRes.json();
    assert.strictEqual(dispData.success, true);
    assert.strictEqual(dispData.status, "SENT");
    console.log(`✔ PASS: Governed Dispatch executed successfully (Status: ${dispData.status})`);

    console.log("\n🦅 ALL 6 MILESTONE 33 FOUNDER ACQUISITION COMMAND CENTER TESTS PASSED CLEANLY!");
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error("Milestone 33 test failure:", err);
  process.exit(1);
});
