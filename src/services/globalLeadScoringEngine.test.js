const assert = require("assert");
const scoringEngine = require("./globalLeadScoringEngineService");
const acquisitionEngine = require("./garudaAcquisitionEngineService");
const outreachDispatch = require("./garudaOutreachDispatchService");

async function runTests() {
  console.log("Starting GARUDA Milestone 29: Global Lead Scoring & Rejection Taxonomy Test Suite...\n");

  // --- 1. High-Value Global Commercial Opportunity ---
  console.log("--- 1. High-Value Global Commercial Opportunity ---");
  const highValueOpp = {
    title: "Need Custom AI Multi-Agent SaaS Platform with Stripe Billing",
    description: "Looking for an expert development team to build a production Next.js web application with multi-agent RAG pipelines, Postgres database, and automated billing. Fixed budget $6,000 USD. Immediate kickoff.",
    url: "https://example.com/rfp/saas-ai-101",
    salary: "$6,000",
    tags: ["react", "next.js", "ai", "llm", "postgres"]
  };

  const highResult = scoringEngine.evaluateOpportunity(highValueOpp);
  assert.strictEqual(highResult.accepted, true);
  assert.strictEqual(highResult.qualificationTier, "HIGH_VALUE");
  assert(highResult.leadScore >= 75, `Lead score should be >= 75, got ${highResult.leadScore}`);
  assert.strictEqual(highResult.currency, "USD");
  assert(highResult.estimatedUSD >= 2500, "Estimated value should reflect budget");
  console.log(`✔ PASS: Qualified as HIGH_VALUE (Score: ${highResult.leadScore}, Valued: $${highResult.estimatedUSD})`);

  // --- 2. Good Quality Deliverable RFP ---
  console.log("\n--- 2. Good Quality Deliverable RFP ---");
  const goodOpp = {
    title: "Build automated WhatsApp customer support bot",
    description: "Need a developer to connect WhatsApp Business Cloud API to our CRM and handle auto-replies for order status inquiries. Deliverable in 1 week.",
    url: "https://example.com/bounties/bot-44",
    salary: "$1,200",
    tags: ["whatsapp", "automation", "api"]
  };

  const goodResult = scoringEngine.evaluateOpportunity(goodOpp);
  assert.strictEqual(goodResult.accepted, true);
  assert(goodResult.qualificationTier === "GOOD" || goodResult.qualificationTier === "HIGH_VALUE");
  assert(goodResult.leadScore >= 55);
  console.log(`✔ PASS: Qualified as GOOD / Deliverable (Score: ${goodResult.leadScore})`);

  // --- 3. Rejection: Employment / W2 Job Seeker Listing ---
  console.log("\n--- 3. Rejection: Employment / W2 Job Seeker Listing ---");
  const employmentOpp = {
    title: "Senior Software Engineer (Full-Time W2 Employee)",
    description: "Seeking a full-time employee on-site daily in Chicago. Annual salary $140,000 with 401k, dental coverage, and health insurance benefits.",
    url: "https://example.com/jobs/emp-99",
    salary: "$140,000 / year"
  };

  const empResult = scoringEngine.evaluateOpportunity(employmentOpp);
  assert.strictEqual(empResult.accepted, false);
  assert.strictEqual(empResult.qualificationTier, "REJECTED");
  assert.strictEqual(empResult.rejectionReason, "EMPLOYMENT_JOB_SEEKER_LISTING");
  console.log("✔ PASS: W2 internal employment listing rejected with EMPLOYMENT_JOB_SEEKER_LISTING");

  // --- 4. Rejection: Budget Below Minimum ---
  console.log("\n--- 4. Rejection: Budget Below Minimum ---");
  const microBudgetOpp = {
    title: "Fix simple CSS color on WordPress page",
    description: "Change button color from blue to green. Budget $15.",
    url: "https://example.com/micro/12",
    salary: "$15"
  };

  const microResult = scoringEngine.evaluateOpportunity(microBudgetOpp);
  assert.strictEqual(microResult.accepted, false);
  assert.strictEqual(microResult.rejectionReason, "BUDGET_BELOW_MINIMUM");
  console.log("✔ PASS: Micro-budget opportunity filtered with BUDGET_BELOW_MINIMUM");

  // --- 5. Rejection: Poor Capability Match ---
  console.log("\n--- 5. Rejection: Poor Capability Match ---");
  const unrelatedOpp = {
    title: "Onsite Hardware Assembly and Physical HVAC Repair",
    description: "Need technician to assemble physical server racks and replace industrial air conditioning filters in warehouse.",
    url: "https://example.com/trade/55",
    salary: "$3,000"
  };

  const unrelatedResult = scoringEngine.evaluateOpportunity(unrelatedOpp);
  assert.strictEqual(unrelatedResult.accepted, false);
  assert.strictEqual(unrelatedResult.rejectionReason, "POOR_CAPABILITY_MATCH");
  console.log("✔ PASS: Non-software physical trade filtered with POOR_CAPABILITY_MATCH");

  // --- 6. Rejection: Prohibited / Scam Indicators ---
  console.log("\n--- 6. Rejection: Prohibited / Scam Indicators ---");
  const scamOpp = {
    title: "Online Casino Betting Script (Pay Upfront Registration Fee)",
    description: "Deposit $50 registration fee to access casino betting automation script.",
    url: "https://example.com/scam/00"
  };

  const scamResult = scoringEngine.evaluateOpportunity(scamOpp);
  assert.strictEqual(scamResult.accepted, false);
  assert.strictEqual(scamResult.qualificationTier, "PROHIBITED");
  console.log("✔ PASS: Prohibited and upfront-fee scam listing filtered cleanly");

  // --- 7. Rejection: Missing Secure Actionable Contact Path ---
  console.log("\n--- 7. Rejection: Missing Secure Actionable Contact Path ---");
  const brokenUrlOpp = {
    title: "Custom SaaS Portal Development",
    description: "Looking for development team to build portal. Budget $5,000.",
    url: "invalid-broken-url"
  };

  const brokenResult = scoringEngine.evaluateOpportunity(brokenUrlOpp);
  assert.strictEqual(brokenResult.accepted, false);
  assert.strictEqual(brokenResult.rejectionReason, "NO_ACTIONABLE_CONTACT_PATH");
  console.log("✔ PASS: Broken URL opportunity filtered with NO_ACTIONABLE_CONTACT_PATH");

  // --- 8. Acquisition Command Center Diagnostic Telemetry ---
  console.log("\n--- 8. Acquisition Command Center Diagnostic Telemetry ---");
  const metrics = await acquisitionEngine.getAcquisitionMetrics({ isTest: true });
  assert.strictEqual(metrics.success, true);
  assert(metrics.leadQuality !== undefined, "Command Center must include lead quality breakdown");
  assert(typeof metrics.leadQuality.averageLeadScore === "number");
  assert(metrics.leadQuality.rejectionBreakdown.EMPLOYMENT_JOB_SEEKER_LISTING !== undefined);
  assert(Array.isArray(metrics.globalMarkets) && metrics.globalMarkets.length >= 3);
  assert.strictEqual(metrics.truthDeclaration.realCustomerRevenue, "₹0");
  console.log("✔ PASS: Acquisition Command Center telemetry exposes rejection reasons and global markets");

  // --- 9. Automated High-Value Lead -> Governed Outreach Pipeline ---
  console.log("\n--- 9. Automated High-Value Lead -> Governed Outreach Pipeline ---");
  const prospectRecord = await outreachDispatch.qualifyProspectForOutreach({
    company: "Global SaaS Alpha (TEST / SIMULATION)",
    source: "US RFP Feed",
    sourceUrl: highValueOpp.url,
    serviceMatch: "custom-ai-development",
    requirements: highValueOpp.description,
    leadScore: highResult.leadScore,
    isTest: true
  });

  assert.strictEqual(prospectRecord.status, "APPROVAL_REQUIRED");
  assert.strictEqual(prospectRecord.leadScore, highResult.leadScore);
  console.log("✔ PASS: HIGH_VALUE lead transitioned directly to OUTREACH_READY (APPROVAL_REQUIRED)");

  console.log("\n🦅 ALL 9 GLOBAL LEAD SCORING & REJECTION TAXONOMY TEST CASES PASSED CLEANLY!");
}

runTests().catch((err) => {
  console.error("Milestone 29 test failure:", err);
  process.exit(1);
});
