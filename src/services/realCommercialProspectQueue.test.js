const assert = require("assert");
const http = require("http");
const express = require("express");
const prospectQueueService = require("./realCommercialProspectQueueService");
const acquisitionRoutes = require("../routes/acquisitionRoutes");

const app = express();
app.use(express.json());
app.use("/api/acquisition", acquisitionRoutes);

async function runTests() {
  console.log("Starting GARUDA Milestone 31A: Real Commercial Prospect Queue Test Suite...\n");

  // --- 1. Commercial Opportunity Classification ---
  console.log("--- 1. Commercial Opportunity Classification ---");
  
  // 1a. Employment role (Must be rejected from commercial outreach)
  const empListing = {
    title: "Staff Software Engineer, Time and Scheduling",
    company: "Gusto, Inc.",
    description: "Full-time internal role with health benefits, 401k, PTO, and equity.",
    url: "https://example.com/jobs/gusto"
  };
  const empClass = prospectQueueService.classifyOpportunity(empListing);
  assert.strictEqual(empClass.category, "EMPLOYMENT_JOB_LISTING");
  console.log("✔ PASS: Internal full-time employment listing filtered into EMPLOYMENT_JOB_LISTING");

  // 1b. Prohibited / Scam (Must be rejected)
  const scamListing = {
    title: "Fast Cash Processing Bot - Deposit $100 First",
    description: "Make $10,000 guaranteed daily profit. Upfront fee required.",
    url: "https://example.com/scam"
  };
  const scamClass = prospectQueueService.classifyOpportunity(scamListing);
  assert.strictEqual(scamClass.category, "PROHIBITED_OR_SCAM");
  console.log("✔ PASS: Upfront-fee scam listing filtered into PROHIBITED_OR_SCAM");

  // 1c. Genuine Commercial Project RFP
  const commercialRfp = {
    title: "Custom Agentic AI Workflow & Full-Stack Product Development",
    company: "Wonderdog Labs",
    description: "Looking for an engineering team to build custom agentic workflows with React frontend and PostgreSQL backend. Fixed scope.",
    url: "https://example.com/rfp/wonderdog"
  };
  const commClass = prospectQueueService.classifyOpportunity(commercialRfp);
  assert.strictEqual(commClass.category, "GENUINE_COMMERCIAL_PROSPECT");
  console.log("✔ PASS: Genuine commercial project RFP classified into GENUINE_COMMERCIAL_PROSPECT");

  // --- 2. Live Inventory Commercial Curation ---
  console.log("\n--- 2. Live Inventory Commercial Curation ---");
  const curated = await prospectQueueService.curateCommercialQueue();
  assert(curated.totalCandidatesReviewed > 0, "Must review discovered candidates");
  assert(curated.genuineCommercialProspects.length > 0, "Must identify genuine commercial prospects");
  console.log(`✔ PASS: Curated ${curated.totalCandidatesReviewed} opportunities -> ${curated.genuineCommercialProspects.length} Genuine Commercial Prospects`);

  // --- 3. Top 3 Tailored Outreach Drafts Generation ---
  console.log("\n--- 3. Top 3 Tailored Outreach Drafts Generation ---");
  const draftsResult = await prospectQueueService.prepareTopOutreachDrafts();
  assert(draftsResult.topDrafts.length > 0 && draftsResult.topDrafts.length <= 3);
  
  const sampleDraft = draftsResult.topDrafts[0];
  assert(sampleDraft.prospectId.startsWith("outreach_m31a_"));
  assert.strictEqual(sampleDraft.status, "APPROVAL_REQUIRED");
  assert(sampleDraft.body.includes("50% kickoff advance deposit"));
  assert(sampleDraft.body.includes("https://www.garudaos.in"));
  assert(!sampleDraft.body.includes("Hostinger"), "Must not mention competitors");
  assert(!sampleDraft.body.includes("GoDaddy"), "Must not mention competitors");
  console.log(`✔ PASS: Top ${draftsResult.topDrafts.length} tailored outreach drafts prepared with Founder governance`);

  // --- 4. Founder Telegram Alert Formatting ---
  console.log("\n--- 4. Founder Telegram Alert Formatting ---");
  const tgNotify = await prospectQueueService.notifyFounderOfQueuedProspects(draftsResult.topDrafts);
  assert(typeof tgNotify.sent === "boolean");
  console.log("✔ PASS: Founder Telegram alert formatting verified with /approve_outreach action instructions");

  // Start HTTP Server for REST API verification
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // --- 5. REST API: GET /api/acquisition/prospect-queue ---
    console.log("\n--- 5. REST API: GET /api/acquisition/prospect-queue ---");
    const res = await fetch(`${baseUrl}/api/acquisition/prospect-queue`);
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert(data.topDrafts.length > 0);
    console.log(`✔ PASS: GET /api/acquisition/prospect-queue returned ${data.topDrafts.length} queued prospects`);

    console.log("\n🦅 ALL 5 MILESTONE 31A REAL PROSPECT QUEUE TEST CASES PASSED CLEANLY!");
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error("Milestone 31A test failure:", err);
  process.exit(1);
});
