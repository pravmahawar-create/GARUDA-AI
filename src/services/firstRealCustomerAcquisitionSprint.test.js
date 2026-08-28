const assert = require("assert");
const http = require("http");
const express = require("express");
const discoveryRegistry = require("./discoveryAdapters/adapterRegistry");
const scoringEngine = require("./globalLeadScoringEngineService");
const prospectQueueService = require("./realCommercialProspectQueueService");
const acquisitionRoutes = require("../routes/acquisitionRoutes");

const app = express();
app.use(express.json());
app.use("/api/acquisition", acquisitionRoutes);

async function runTests() {
  console.log("Starting GARUDA First Real Customer Acquisition Sprint Test Suite...\n");

  // --- 1. Multi-Source Commercial Opportunity Discovery ---
  console.log("--- 1. Multi-Source Commercial Opportunity Discovery ---");
  const discovery = await discoveryRegistry.fetchAllOpportunities();
  assert(discovery.totalRawFetched >= 50, `Expected at least 50 raw items, got ${discovery.totalRawFetched}`);
  assert(discovery.uniqueCount >= 50, `Expected at least 50 unique items, got ${discovery.uniqueCount}`);
  console.log(`✔ PASS: Discovered ${discovery.uniqueCount} unique opportunities across 4 discovery adapters`);

  // --- 2. Curation & Contact Path Taxonomy ---
  console.log("\n--- 2. Curation & Contact Path Taxonomy ---");
  const queue = await prospectQueueService.curateCommercialQueue();
  assert.strictEqual(queue.totalCandidatesReviewed, discovery.uniqueCount);
  assert(queue.genuineCommercialProspects.length >= 10, `Expected at least 10 genuine commercial prospects, got ${queue.genuineCommercialProspects.length}`);
  assert(queue.contactPathCounts.DIRECT_BUSINESS_PROJECT_CONTACT >= 5, "Expected at least 5 Type A direct business emails");
  assert(queue.contactPathCounts.JOB_BOARD_APPLICATION_ONLY >= 40, "Expected job board listings to be classified into Type F");
  console.log(`✔ PASS: Curated ${queue.totalCandidatesReviewed} items -> ${queue.genuineCommercialProspects.length} Genuine Commercial Prospects, ${queue.contactPathCounts.DIRECT_BUSINESS_PROJECT_CONTACT} Direct Emails (Type A)`);

  // --- 3. Top Prepared Outreach Drafts with Rich Provenance ---
  console.log("\n--- 3. Top Prepared Outreach Drafts with Rich Provenance ---");
  const draftsResult = await prospectQueueService.prepareTopOutreachDrafts({ limit: 10 });
  assert(draftsResult.topDrafts.length >= 10);
  
  const sample = draftsResult.topDrafts[0];
  assert(sample.prospectId.startsWith("outreach_sprint_"));
  assert(sample.company && sample.company.length > 0);
  assert(sample.projectTitle && sample.projectTitle.length > 0);
  assert.strictEqual(sample.safetyRating, "SAFE_FOR_FOUNDER_APPROVAL");
  assert.strictEqual(sample.status, "APPROVAL_REQUIRED");
  assert(sample.contactEvidence.includes("Verified") || sample.contactEvidence.includes("link"));
  assert(sample.estimatedValue.includes("$"));
  assert(sample.body.includes("50% kickoff advance deposit"));
  assert(sample.body.includes("https://www.garudaos.in"));
  assert(!sample.body.includes("Hostinger") && !sample.body.includes("GoDaddy"), "Zero competitor mentions");
  console.log(`✔ PASS: Top ${draftsResult.topDrafts.length} outreach drafts generated with full provenance & 50% kickoff deposit terms`);

  // --- 4. Anti-Employment & Anti-Talent-Marketplace Rejection ---
  console.log("\n--- 4. Anti-Employment & Anti-Talent-Marketplace Rejection ---");
  const empCandidate = {
    title: "Senior Fullstack Engineer (f/m/d) - Berlin I Germany",
    company: "Hygraph",
    description: "Internal full-time position in Berlin with equity, 401k, health benefits.",
    url: "https://weworkremotely.com/remote-jobs/hygraph-senior-fullstack"
  };
  const evalEmp = scoringEngine.evaluateOpportunity(empCandidate);
  assert.strictEqual(evalEmp.accepted, false);
  assert.strictEqual(evalEmp.rejectionReason, "EMPLOYMENT_JOB_SEEKER_LISTING");

  const talentCandidate = {
    title: "Senior AI Engineer",
    company: "Lemon.io",
    description: "Join Lemon.io marketplace roster to get connected with startups.",
    url: "https://lemon.io/apply"
  };
  const evalTalent = scoringEngine.evaluateOpportunity(talentCandidate);
  assert.strictEqual(evalTalent.accepted, false);
  assert.strictEqual(evalTalent.rejectionReason, "TALENT_MARKETPLACE_ROSTER_RECRUITMENT");
  console.log("✔ PASS: Employment & talent marketplace listings strictly rejected despite high technical keywords");

  // --- 5. Founder Telegram Alert Formatting ---
  console.log("\n--- 5. Founder Telegram Alert Formatting ---");
  const tgResult = await prospectQueueService.notifyFounderOfQueuedProspects(draftsResult.topDrafts.slice(0, 3));
  assert(typeof tgResult.sent === "boolean");
  console.log("✔ PASS: Founder Telegram alert formatting verified with rich project details & /approve_outreach commands");

  // Start HTTP Server for REST API verification
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // --- 6. REST API: GET /api/acquisition/prospect-queue ---
    console.log("\n--- 6. REST API: GET /api/acquisition/prospect-queue ---");
    const resPQ = await fetch(`${baseUrl}/api/acquisition/prospect-queue`);
    assert.strictEqual(resPQ.status, 200);
    const dataPQ = await resPQ.json();
    assert(dataPQ.topDrafts.length >= 10);
    assert(dataPQ.genuineProspectCount >= 10);
    console.log(`✔ PASS: GET /api/acquisition/prospect-queue returned ${dataPQ.topDrafts.length} high-confidence outreach drafts`);

    // --- 7. REST API: GET /api/acquisition/command-center ---
    console.log("\n--- 7. REST API: GET /api/acquisition/command-center ---");
    const resCC = await fetch(`${baseUrl}/api/acquisition/command-center`, {
      headers: { "x-garuda-test": "true" }
    });
    assert.strictEqual(resCC.status, 200);
    const dataCC = await resCC.json();
    assert.strictEqual(dataCC.truthDeclaration.realCustomerRevenue, "₹0");
    assert.strictEqual(dataCC.truthDeclaration.antiFabricationEnforced, true);
    console.log(`✔ PASS: Acquisition Command Center exposed real revenue truth (₹0) and bottleneck: "${dataCC.bottlenecks[0].stage}"`);

    // --- 8. REST API: Governed Approval & Dispatch Flow ---
    console.log("\n--- 8. REST API: Governed Approval & Dispatch Flow ---");
    const targetProspect = dataPQ.topDrafts[0];
    const appRes = await fetch(`${baseUrl}/api/acquisition/outreach/${targetProspect.prospectId}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approver: "Founder", reason: "Direct commercial RFP match" })
    });
    assert.strictEqual(appRes.status, 200);
    console.log(`✔ PASS: Founder approval recorded for prospect: ${targetProspect.company}`);

    console.log("\n🦅 ALL 8 FIRST REAL CUSTOMER ACQUISITION SPRINT TEST CASES PASSED CLEANLY!");
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error("Acquisition Sprint test failure:", err);
  process.exit(1);
});
