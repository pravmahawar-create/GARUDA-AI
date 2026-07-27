const assert = require("assert");
const {
  recordDealSubmission,
  recordClientResponse,
  recordDealOutcome,
  getRealityMetrics,
  getEmpiricalProbability,
  clearDealTrackerStore
} = require("./dealTrackerService");

async function runDealTrackerTests() {
  clearDealTrackerStore();

  // 1. Initial State (0 Submissions -> UNMEASURED)
  const initialMetrics = getRealityMetrics();
  assert.strictEqual(initialMetrics.submissionCount, 0);
  assert.strictEqual(initialMetrics.winRatePercent, null);
  assert.strictEqual(initialMetrics.winRateLabel, "UNMEASURED (Awaiting empirical deal data)");

  const initialEmpirical = getEmpiricalProbability();
  assert.strictEqual(initialEmpirical.measured, false);
  assert.strictEqual(initialEmpirical.winRateLabel, "UNMEASURED (Awaiting empirical deal data)");

  // 2. Record Deal Submissions (Phase 1)
  const sub1 = recordDealSubmission({
    dealId: "deal-001",
    client: "Coalition Technologies",
    platform: "Remotive",
    submissionDate: "2026-07-27T10:00:00.000Z",
    quotedPrice: 1540,
    floorPrice: 1232,
    currency: "USD",
    estimatedDeliveryDays: 5
  });
  assert.strictEqual(sub1.success, true);
  assert.strictEqual(sub1.currentStatus, "NO_REPLY");
  assert.ok(sub1.dealRecordHash);

  const sub2 = recordDealSubmission({
    dealId: "deal-002",
    client: "Clipster",
    platform: "Remotive",
    submissionDate: "2026-07-27T10:30:00.000Z",
    quotedPrice: 1890,
    floorPrice: 1512,
    currency: "USD",
    estimatedDeliveryDays: 5
  });
  assert.strictEqual(sub2.success, true);

  // 3. Record Client Responses (Phase 2)
  const resp1 = recordClientResponse({
    dealId: "deal-001",
    status: "INTERVIEW",
    responseDate: "2026-07-27T14:00:00.000Z", // 4 hours later
    clientMessage: "We are interested in your proposal. Can we discuss Milestone 1?"
  });
  assert.strictEqual(resp1.success, true);
  assert.strictEqual(resp1.currentStatus, "INTERVIEW");
  assert.strictEqual(resp1.responseTimeHours, 4.0);

  // 4. Record Outcome (Phase 3 & 4)
  const outcome1 = recordDealOutcome({
    dealId: "deal-001",
    outcome: "WON",
    actualPaymentCollected: 1540,
    agreedPrice: 1540,
    reason: "Client accepted 50/50 milestone terms."
  });
  assert.strictEqual(outcome1.recorded, true);
  assert.strictEqual(outcome1.outcome, "WON");

  const metricsAfter1 = getRealityMetrics();
  assert.strictEqual(metricsAfter1.submissionCount, 2);
  assert.strictEqual(metricsAfter1.replyCount, 1);
  assert.strictEqual(metricsAfter1.replyRatePercent, 50); // 1 / 2
  assert.strictEqual(metricsAfter1.winRatePercent, 50);   // 1 / 2
  assert.strictEqual(metricsAfter1.revenueCollected, 1540);
  assert.strictEqual(metricsAfter1.averageDealSize, 1540);
  assert.strictEqual(metricsAfter1.averageReplyTimeHours, 4.0);

  const empirical = getEmpiricalProbability();
  assert.strictEqual(empirical.measured, true);
  assert.strictEqual(empirical.winRate, 50);
  assert.strictEqual(empirical.winRateLabel, "50% (Empirical)");

  console.log("GARUDA Deal Tracker & Reality Feedback Engine tests PASSED cleanly.");
}

runDealTrackerTests().catch((err) => {
  console.error("Deal Tracker test failed:", err);
  process.exit(1);
});
