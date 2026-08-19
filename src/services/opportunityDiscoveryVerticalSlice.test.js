const assert = require("assert");
const { DISCOVERY_PROVIDERS, processJobsBatch, runStandaloneDiscovery, toUniversalOpportunity } = require("./opportunityDiscoveryService");
const { executeRevenueTask } = require("../../scripts/mother/revenueEngine");

async function testVerticalSlice() {
  assert.ok(DISCOVERY_PROVIDERS.job_board);
  assert.ok(DISCOVERY_PROVIDERS.direct_intake);
  assert.ok(DISCOVERY_PROVIDERS.crm);
  assert.ok(DISCOVERY_PROVIDERS.insurance_prospect);
  assert.ok(DISCOVERY_PROVIDERS.startup_mission);

  const rawJobs = [
    {
      id: "job-101",
      title: "Build Node.js API Service & Backend Automation",
      company_name: "FinTech Corp",
      description: "Implement secure Node.js REST endpoints with automated unit tests.",
      candidate_required_location: "Worldwide",
      salary: "$80,000 / yr",
      job_type: "contract",
      publication_date: new Date().toISOString(),
      tags: ["Node", "API", "Testing"],
      url: "https://example.com/job-101"
    },
    {
      id: "deliverable-102",
      title: "Custom Microservice & REST API Automation",
      company_name: "Verified Client Partner",
      description: "Deliver custom Node.js microservice deliverable.",
      candidate_required_location: "Worldwide",
      salary: "$5,000 fixed",
      job_type: "contract",
      publication_date: new Date().toISOString(),
      tags: ["Node", "Microservice"],
      url: "https://example.com/deliverable-102",
      opportunityChannel: "garuda_deliverable",
      autonomouslyDeliverable: true,
      humanInvolvementRequired: false
    },
    {
      id: "job-103",
      title: "Prohibited Casino Operator",
      company_name: "Betting Inc",
      description: "Promote online casino games.",
      candidate_required_location: "Worldwide",
      salary: "$100,000",
      job_type: "full_time",
      publication_date: new Date().toISOString(),
      tags: ["Casino", "Gambling"],
      url: "https://example.com/job-103"
    }
  ];

  const processed = processJobsBatch(rawJobs, "507f1f77bcf86cd799439011");
  assert.strictEqual(processed.fetched, 3);
  assert.strictEqual(processed.rankedCount, 2);
  assert.strictEqual(processed.rejectedCount, 1);
  assert.strictEqual(processed.channels.garuda_deliverable, 1);

  const universal = processed.universalOpportunities;
  assert.strictEqual(universal.length, 2);
  const deliverableOpp = universal.find((item) => item.opportunityId === "deliverable-102");
  assert.ok(deliverableOpp);
  assert.strictEqual(deliverableOpp.channel, "garuda_deliverable");
  assert.strictEqual(deliverableOpp.autonomouslyDeliverable, true);
  assert.strictEqual(deliverableOpp.humanInvolvementRequired, false);
  assert.ok(deliverableOpp.capabilityMatches.length > 0);

  const standaloneFallback = await runStandaloneDiscovery({ jobs: [] });
  assert.strictEqual(standaloneFallback.status, "DISCOVERY_COMPLETED");
  assert.ok(["remotive_live", "fallback_cache"].includes(standaloneFallback.source));
  assert.ok(standaloneFallback.persistence);

  const motherTaskExecution = await executeRevenueTask("Discover revenue opportunities and client candidates");
  assert.strictEqual(motherTaskExecution.success, true);
  assert.strictEqual(motherTaskExecution.output.taskType, "revenue_opportunity_discovery");
  assert.strictEqual(motherTaskExecution.output.discovery.status, "DISCOVERY_COMPLETED");
  assert.ok(motherTaskExecution.output.discovery.universalOpportunities.length > 0);
  const motherUniversal = motherTaskExecution.output.discovery.universalOpportunities;
  // Amendment 9 canonical channels: garuda_deliverable (direct) and
  // founder_garuda (human-role, founder-reviewable). Legacy human_opportunity_only
  // is still accepted for pre-Amendment callers.
  assert.ok(motherUniversal.some((item) => ["garuda_deliverable", "founder_garuda", "human_opportunity_only"].includes(item.channel)),
    "discovery must surface capability-matched opportunities (direct or founder-reviewable)");
  for (const item of motherUniversal) {
    if (["founder_garuda", "human_opportunity_only"].includes(item.channel)) {
      assert.strictEqual(item.autonomouslyDeliverable, false, "founder-reviewable opportunities must never auto-execute");
    }
    if (item.channel === "garuda_deliverable") {
      assert.strictEqual(item.autonomouslyDeliverable, true, "direct GARUDA deliverables are autonomously deliverable");
    }
  }
  assert.ok(motherUniversal.every((item) => item.requiresFounderApproval === true), "every discovered opportunity still requires Founder approval");

  console.log("Sprint 1 Opportunity Discovery CTO fixes validation passed.");
}

testVerticalSlice().catch((err) => {
  console.error("Vertical slice test failed:", err);
  process.exit(1);
});
