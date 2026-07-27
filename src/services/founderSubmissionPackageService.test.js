const assert = require("assert");
const {
  analyzeRequirements,
  estimateEffort,
  recommendPricing,
  identifyRisks,
  prepareDeliverables,
  generateProposalText,
  buildFounderSubmissionPackage,
  sha256
} = require("./founderSubmissionPackageService");

async function runFounderSubmissionPackageTests() {
  const now = new Date("2026-07-27T10:00:00.000Z");

  const sampleCandidate = {
    externalId: "founder-assisted-test-001",
    url: "https://upwork.com/jobs/~0123456789abcdef",
    title: "Build Custom Node.js REST API & Automated Tests",
    company: "Acme FinTech Corp",
    description: "Build a custom Node.js microservice REST API endpoint with automated Jest test suite. Fixed price project, scope of work includes deliverable package and acceptance criteria.",
    salaryText: "$5,000 fixed price",
    tags: ["Node.js", "REST API", "Automated Testing"],
    verification: {
      listingKind: "specific_client_work"
    },
    founderAssistedIntake: {
      risks: ["Missing client architectural blueprint"],
      missingInformation: ["Database schema specification pending"]
    }
  };

  // 1. Requirement Analysis Test
  const reqs = analyzeRequirements(sampleCandidate);
  assert.ok(reqs.technicalStack.includes("Node.js"));
  assert.ok(reqs.technicalStack.includes("REST API"));
  assert.ok(reqs.technicalStack.includes("Automated Testing"));
  assert.ok(reqs.groundedRequirements.length > 0);
  assert.strictEqual(reqs.clientConstraints.hasFixedBudget, true);
  assert.strictEqual(reqs.clientConstraints.testingRequired, true);

  // 2. Effort Estimation Test
  const effort = estimateEffort(sampleCandidate, reqs);
  assert.ok(effort.totalEstimatedHours >= 16);
  assert.ok(effort.estimatedDeliveryDays >= 1);
  assert.ok(["low", "medium", "high"].includes(effort.complexityRating));
  assert.strictEqual(effort.phaseBreakdown.length, 4);

  // 3. Pricing Recommendation Engine Test
  const risks = identifyRisks(sampleCandidate);
  const pricing = recommendPricing(sampleCandidate, effort, risks.findings);
  assert.strictEqual(pricing.currency, "USD");
  assert.strictEqual(pricing.targetClientBudget, 5000);
  assert.strictEqual(pricing.recommendedPrice, 5000);
  assert.strictEqual(pricing.minimumAcceptableFloorPrice, 4000);
  assert.ok(pricing.milestones.length >= 1);

  // 4. Pricing Recommendation with Missing Budget
  const noBudgetCandidate = {
    ...sampleCandidate,
    salaryText: "not stated",
    company: "not disclosed"
  };
  const noBudgetPricing = recommendPricing(noBudgetCandidate, effort, risks.findings);
  assert.strictEqual(noBudgetPricing.targetClientBudget, null);
  assert.ok(noBudgetPricing.riskBufferPercent >= 25);
  assert.ok(noBudgetPricing.recommendedPrice > noBudgetPricing.baseCost);

  // 5. Risk Identification Test
  assert.ok(risks.findings.length >= 2);
  assert.ok(risks.findings.every((f) => f.risk && f.mitigation));

  // 6. Deliverable Preparation Test
  const deliverables = prepareDeliverables(sampleCandidate, reqs);
  assert.strictEqual(deliverables.length, 3);
  assert.ok(deliverables.every((d) => d.title && d.description && d.acceptanceCriteria));

  // 7. Proposal Text Generation Test
  const proposalText = generateProposalText(sampleCandidate, reqs, effort, pricing, deliverables);
  assert.ok(proposalText.includes("Commercial Proposal for Acme FinTech Corp"));
  assert.ok(proposalText.includes("Node.js"));
  assert.ok(proposalText.includes("Quoted Investment"));

  // 8. Complete Submission Package Assembly Test
  const submissionPackage = buildFounderSubmissionPackage(sampleCandidate, { founderApproved: true }, { now });
  assert.strictEqual(submissionPackage.status, "READY_FOR_FOUNDER_SUBMISSION");
  assert.ok(submissionPackage.packageHash);
  assert.ok(submissionPackage.truthHash);
  assert.ok(submissionPackage.formattedSubmissionText.includes("PROPOSAL SUBMISSION PACKAGE"));
  assert.strictEqual(submissionPackage.governance.founderApprovalRequiredBeforeSubmission, true);
  assert.strictEqual(submissionPackage.governance.manualSubmissionRequired, true);

  // 9. Determinism Test
  const submissionPackage2 = buildFounderSubmissionPackage(sampleCandidate, { founderApproved: true }, { now });
  assert.strictEqual(submissionPackage.packageHash, submissionPackage2.packageHash);
  assert.strictEqual(submissionPackage.truthHash, submissionPackage2.truthHash);

  console.log("Founder Submission Package Service unit tests PASSED cleanly.");
}

runFounderSubmissionPackageTests().catch((err) => {
  console.error("Founder Submission Package test failed:", err);
  process.exit(1);
});
