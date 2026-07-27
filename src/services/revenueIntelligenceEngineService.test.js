const assert = require("assert");
const {
  generateExecutiveDecisionReport,
  computeTimeEconomics,
  assessClientQuality,
  calculateProbabilities,
  generateNegotiationStrategy,
  evaluateExecutiveDecision,
  recordLearningOutcome,
  getLearningLedgerSummary,
  sha256
} = require("./revenueIntelligenceEngineService");

async function runRieTests() {
  const now = new Date("2026-07-27T10:00:00.000Z");

  const validCandidateInput = {
    url: "https://upwork.com/jobs/~0123456789abcdef",
    source: "Upwork",
    title: "Build Custom Node.js REST API & Automated Tests",
    description: "Build a custom Node.js microservice REST API endpoint with automated Jest test suite. Fixed price project, scope of work includes deliverable package and acceptance criteria.",
    company: "Acme FinTech Corp",
    salaryText: "$5,000 fixed price",
    deadlineText: "2026-08-30",
    tags: ["Node.js", "REST API", "Automated Testing"],
    attestation: {
      founderAccessedAuthorizedAccount: true,
      noPlaceholderData: true,
      rawTextUnmodified: true
    }
  };

  const validContext = { founderApproved: true };

  // 1. Full Executive Decision Report Test
  const report = generateExecutiveDecisionReport(validCandidateInput, validContext, { now });

  assert.ok(report.opportunityId);
  assert.strictEqual(report.title, "Build Custom Node.js REST API & Automated Tests");
  assert.strictEqual(report.clientCompany, "Acme FinTech Corp");
  assert.ok(["ACCEPT", "REJECT", "NEGOTIATE"].includes(report.recommendation));
  assert.ok(report.executiveSummary.includes("GARUDA Executive Decision"));
  assert.ok(report.reasoning.length > 0);
  assert.ok(report.reportHash);
  assert.ok(report.truthHash);

  // 2. Metrics & Probability Validation
  assert.ok(report.metrics.probabilityOfWinning >= 25 && report.metrics.probabilityOfWinning <= 100);
  assert.ok(report.metrics.probabilityOfPayment >= 30 && report.metrics.probabilityOfPayment <= 100);
  assert.ok(report.metrics.clientQualityScore >= 0 && report.metrics.clientQualityScore <= 100);
  assert.ok(["low", "medium", "high", "critical"].includes(report.metrics.estimatedDeliveryRisk));
  assert.ok(["low", "medium", "high", "extreme"].includes(report.metrics.technicalComplexity));

  // 3. Time Economics & AI Time Compression Validation
  const time = report.timeEconomics;
  assert.ok(time.aiExecutionHours > 0);
  assert.ok(time.recommendedClientDeliveryDays > 0);
  assert.ok(time.traditionalMarketAgencyDays > time.recommendedClientDeliveryDays);
  assert.ok(time.aiTimeCompressionRatio > 1.0);
  assert.strictEqual(
    time.aiTimeCompressionRatio,
    Math.round((time.traditionalMarketAgencyDays / time.recommendedClientDeliveryDays) * 10) / 10
  );

  // 4. Negotiation Intelligence Validation
  const neg = report.negotiationStrategy;
  assert.ok(neg.negotiationApproach);
  assert.ok(neg.leveragePoints.length >= 2);
  assert.ok(neg.concessions.length >= 1);
  assert.ok(neg.nonNegotiables.length >= 2);

  // 5. Unverified / Low-Information Client Decision (NEGOTIATE Recommendation)
  const lowInfoCandidateInput = {
    ...validCandidateInput,
    url: "https://upwork.com/jobs/~lowinfo001",
    salaryText: "not stated",
    company: "not disclosed"
  };
  const lowInfoReport = generateExecutiveDecisionReport(lowInfoCandidateInput, validContext, { now });
  assert.strictEqual(lowInfoReport.recommendation, "NEGOTIATE");
  assert.ok(lowInfoReport.metrics.clientQualityScore < 60);

  // 6. Determinism Test (on identical memory state)
  const report2 = generateExecutiveDecisionReport(validCandidateInput, validContext, { now });
  assert.strictEqual(report.reportHash, report2.reportHash);
  assert.strictEqual(report.truthHash, report2.truthHash);

  // 7. Learning Memory Ledger Test (mutates memory state and updates future summaries)
  const initialSummary = getLearningLedgerSummary("software_engineering");
  assert.ok(initialSummary.totalHistoricalProjects >= 2);

  recordLearningOutcome({
    opportunityId: "test-completed-job-001",
    category: "software_engineering",
    estimatedHours: 16,
    actualHours: 15,
    estimatedDays: 3,
    actualDays: 3,
    quotedPrice: 5000,
    actualPaidPrice: 5000,
    negotiationSuccessful: true,
    deliverySuccessful: true,
    paymentSuccessful: true,
    clientSatisfactionRating: 5
  });

  const updatedSummary = getLearningLedgerSummary("software_engineering");
  assert.strictEqual(updatedSummary.totalHistoricalProjects, initialSummary.totalHistoricalProjects + 1);

  console.log("GARUDA Revenue Intelligence Engine (RIE) unit tests PASSED cleanly.");
}

runRieTests().catch((err) => {
  console.error("Revenue Intelligence Engine test failed:", err);
  process.exit(1);
});
