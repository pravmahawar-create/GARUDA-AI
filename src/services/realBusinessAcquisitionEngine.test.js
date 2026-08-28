const assert = require("assert");
const http = require("http");
const express = require("express");
const scoringEngine = require("./globalLeadScoringEngineService");
const prospectQueueService = require("./realCommercialProspectQueueService");
const CustomSoftwareRfpDiscoveryAdapter = require("./discoveryAdapters/customSoftwareRfpAdapter");
const acquisitionRoutes = require("../routes/acquisitionRoutes");

const app = express();
app.use(express.json());
app.use("/api/acquisition", acquisitionRoutes);

async function runTests() {
  console.log("Starting GARUDA Milestone 32: Real Business / Decision-Maker Acquisition Test Suite...\n");

  // --- 1. Decision-Maker / Contact Path Classification (Types A-G) ---
  console.log("--- 1. Decision-Maker / Contact Path Classification (Types A-G) ---");

  // 1a. Type A: Direct Business Email
  const typeA = scoringEngine.classifyContactPath({ contactEmail: "cto@fintechcorp.io" });
  assert.strictEqual(typeA, "DIRECT_BUSINESS_PROJECT_CONTACT");
  console.log("✔ PASS: Direct business email classified into DIRECT_BUSINESS_PROJECT_CONTACT (Type A)");

  // 1b. Type B: Procurement RFP Contact
  const typeB = scoringEngine.classifyContactPath({ isDirectClientRfp: true, source: "custom_software_rfp" });
  assert.strictEqual(typeB, "PROCUREMENT_RFP_CONTACT");
  console.log("✔ PASS: Procurement RFP classified into PROCUREMENT_RFP_CONTACT (Type B)");

  // 1c. Type D: Business Contact Form
  const typeD = scoringEngine.classifyContactPath({ url: "https://innovations.ai/contact-us" });
  assert.strictEqual(typeD, "BUSINESS_CONTACT_FORM");
  console.log("✔ PASS: Company contact page classified into BUSINESS_CONTACT_FORM (Type D)");

  // 1d. Type F: Job Board Application (Must be blocked from outbound)
  const typeF = scoringEngine.classifyContactPath({ url: "https://remotive.com/remote-jobs/engineering/senior-dev-123" });
  assert.strictEqual(typeF, "JOB_BOARD_APPLICATION_ONLY");
  console.log("✔ PASS: Job board posting classified into JOB_BOARD_APPLICATION_ONLY (Type F)");

  // 1e. Type G: No Actionable Contact Path
  const typeG = scoringEngine.classifyContactPath({});
  assert.strictEqual(typeG, "NO_ACTIONABLE_CONTACT_PATH");
  console.log("✔ PASS: Missing URL/email classified into NO_ACTIONABLE_CONTACT_PATH (Type G)");

  // --- 2. Anti-Employment & Talent Marketplace Rejection Law ---
  console.log("\n--- 2. Anti-Employment & Talent Marketplace Rejection Law ---");

  // High technical match MUST NOT override employment rejection
  const highTechJob = {
    title: "Senior AI & RAG Pipeline Architect",
    company: "Big Enterprise Corp",
    description: "Full-time position with 401k, comprehensive healthcare benefits, and annual salary. Must join internal team.",
    url: "https://example.com/careers/ai-architect"
  };
  const evalTechJob = scoringEngine.evaluateOpportunity(highTechJob);
  assert.strictEqual(evalTechJob.accepted, false);
  assert.strictEqual(evalTechJob.rejectionReason, "EMPLOYMENT_JOB_SEEKER_LISTING");
  console.log("✔ PASS: High technical match strictly overridden by EMPLOYMENT_JOB_SEEKER_LISTING rejection");

  // Talent Marketplace Sourcing Rejection
  const talentListing = {
    title: "Senior AI Engineer",
    company: "Lemon.io",
    description: "Lemon.io is a marketplace that connects you with hand-picked startups in the US.",
    url: "https://lemon.io/apply"
  };
  const evalTalent = scoringEngine.evaluateOpportunity(talentListing);
  assert.strictEqual(evalTalent.accepted, false);
  assert.strictEqual(evalTalent.rejectionReason, "TALENT_MARKETPLACE_ROSTER_RECRUITMENT");
  console.log("✔ PASS: Talent marketplace candidate pool recruitment strictly rejected");

  // --- 3. Genuine Commercial Project RFP Qualification ---
  console.log("\n--- 3. Genuine Commercial Project RFP Qualification ---");
  const commercialRfp = {
    id: "rfp_biz_2026_01",
    title: "Enterprise WhatsApp Automation & CRM Sync Engine",
    company: "Apex Global Logistics",
    description: "Looking for an external technology partner to build multi-agent WhatsApp webhook bot syncing with PostgreSQL and HubSpot CRM. Fixed price contract $8,500.",
    budget: "$8,500",
    url: "https://apexlogistics.com/rfp/crm-bot",
    contactEmail: "procurement@apexlogistics.com",
    contactType: "DIRECT_BUSINESS_PROJECT_CONTACT",
    isDirectClientRfp: true
  };

  const evalRfp = scoringEngine.evaluateOpportunity(commercialRfp);
  assert.strictEqual(evalRfp.accepted, true);
  assert.strictEqual(evalRfp.qualificationTier, "HIGH_VALUE");
  assert.strictEqual(evalRfp.isDirectClientOpportunity, true);
  assert(evalRfp.leadScore >= 70);
  console.log(`✔ PASS: Real business RFP qualified into HIGH_VALUE (Score: ${evalRfp.leadScore}/100, Est USD: $${evalRfp.estimatedUSD})`);

  // --- 4. Custom Software RFP Adapter Ingestion ---
  console.log("\n--- 4. Custom Software RFP Adapter Ingestion ---");
  const rfpAdapter = new CustomSoftwareRfpDiscoveryAdapter();
  rfpAdapter.registerRfp(commercialRfp);
  const fetchedRfps = await rfpAdapter.fetchAndNormalize();
  assert.strictEqual(fetchedRfps.length, 1);
  assert.strictEqual(fetchedRfps[0].contactEmail, "procurement@apexlogistics.com");
  assert.strictEqual(fetchedRfps[0].isDirectClientRfp, true);
  console.log("✔ PASS: Custom Software RFP Adapter successfully ingested and preserved direct business contact path");

  // --- 5. Prospect Queue Curation & Safety Ratings ---
  console.log("\n--- 5. Prospect Queue Curation & Safety Ratings ---");
  const queueResult = await prospectQueueService.prepareTopOutreachDrafts();
  assert(queueResult.contactPathBreakdown !== undefined);
  assert(queueResult.topDrafts.length > 0);

  // Verify that any draft marked SAFE_FOR_FOUNDER_APPROVAL has a direct contact path
  queueResult.topDrafts.forEach((d) => {
    if (d.safetyRating === "SAFE_FOR_FOUNDER_APPROVAL") {
      assert(d.contactPath !== "JOB_BOARD_APPLICATION_ONLY");
    } else {
      assert.strictEqual(d.status, "INVALID_FOR_DIRECT_OUTREACH");
    }
  });
  console.log("✔ PASS: Prospect Queue enforces strict safety ratings based on verified contact path");

  // Start HTTP Server for REST API verification
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // --- 6. REST API: GET /api/acquisition/prospect-queue ---
    console.log("\n--- 6. REST API: GET /api/acquisition/prospect-queue ---");
    const resQ = await fetch(`${baseUrl}/api/acquisition/prospect-queue`);
    const dataQ = await resQ.json();
    assert.strictEqual(resQ.status, 200);
    assert(dataQ.contactPathBreakdown !== undefined);
    console.log("✔ PASS: GET /api/acquisition/prospect-queue returned complete contact path taxonomy");

    // --- 7. REST API: GET /api/acquisition/command-center ---
    console.log("\n--- 7. REST API: GET /api/acquisition/command-center ---");
    const resCC = await fetch(`${baseUrl}/api/acquisition/command-center`, {
      headers: { "x-garuda-test": "true" }
    });
    const dataCC = await resCC.json();
    assert.strictEqual(resCC.status, 200);
    assert.strictEqual(dataCC.truthDeclaration.realCustomerRevenue, "₹0");
    console.log("✔ PASS: Acquisition Command Center unified decision-maker acquisition telemetry");

    console.log("\n🦅 ALL 7 MILESTONE 32 REAL BUSINESS ACQUISITION TEST CASES PASSED CLEANLY!");
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error("Milestone 32 test failure:", err);
  process.exit(1);
});
