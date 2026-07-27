const assert = require("assert");
const {
  manageClientConversation,
  evaluateNegotiationObjection,
  generateProofPackage,
  assertAssetAccessPermission,
  createProjectClosingState,
  updateProjectClosingState,
  getExecutiveClosingDashboardData,
  recordClosingOutcome,
  getClosingLearningSummary,
  sha256
} = require("./revenueClosingSystemService");
const { generateExecutiveDecisionReport } = require("./revenueIntelligenceEngineService");

async function runClosingSystemTests() {
  const now = new Date("2026-07-27T10:00:00.000Z");

  const sampleCandidate = {
    url: "https://upwork.com/jobs/~0123456789abcdef",
    source: "Upwork",
    title: "Build Custom Node.js REST API & Automated Tests",
    description: "Build a custom Node.js microservice REST API endpoint with automated Jest test suite.",
    company: "Acme FinTech Corp",
    salaryText: "$5,000 fixed price",
    attestation: {
      founderAccessedAuthorizedAccount: true,
      noPlaceholderData: true,
      rawTextUnmodified: true
    }
  };

  const rieReport = generateExecutiveDecisionReport(sampleCandidate, { founderApproved: true }, { now });

  // 1. Client Conversation Manager Test
  const convCase = { candidate: sampleCandidate, rieReport, messages: [] };
  const conv1 = manageClientConversation(convCase, { sender: "client", text: "Your price is too high, can we get a discount?" }, { now });
  assert.strictEqual(conv1.clientMood, "demanding");
  assert.ok(conv1.suggestedReply.includes("quoted investment"));

  const conv2 = manageClientConversation(convCase, { sender: "client", text: "Looks great, how do we start? Send invoice." }, { now });
  assert.strictEqual(conv2.clientMood, "ready_to_close");
  assert.ok(conv2.suggestedReply.includes("Milestone 1"));

  // 2. Negotiation Strategy Engine Test
  const priceObjection = evaluateNegotiationObjection({ objectionText: "This quote of $5,000 is way above our budget." }, rieReport, { now });
  assert.strictEqual(priceObjection.objectionCategory, "price_concern");
  assert.strictEqual(priceObjection.lowestAcceptablePrice, 4000);
  assert.ok(priceObjection.recommendedCounterOfferPrice >= 4000);
  assert.ok(priceObjection.scopeReductionSuggestions.length > 0);

  const speedObjection = evaluateNegotiationObjection({ objectionText: "We need this delivered urgently in 2 days." }, rieReport, { now });
  assert.strictEqual(speedObjection.objectionCategory, "delivery_speed");
  assert.ok(speedObjection.timelineAdjustmentSuggestions.length > 0);

  // 3. Proof Before Delivery Engine & Security Asset Access Test
  let projectState = createProjectClosingState(rieReport, { now });
  assert.strictEqual(projectState.paymentState, "unpaid");
  assert.strictEqual(projectState.unlockState, "locked");

  const proofPackage = generateProofPackage(projectState);
  assert.strictEqual(proofPackage.proofStatus, "DEMO_UNLOCKED_ASSETS_PROTECTED");
  assert.strictEqual(proofPackage.assetAccessPermissions.sourceCodeLocked, true);
  assert.strictEqual(proofPackage.assetAccessPermissions.apiKeysLocked, true);
  assert.ok(proofPackage.proofItems.progressEvidence.testSuiteExecution.includes("PASSED"));

  // Asset Access Blocked for Unpaid Project
  assert.throws(
    () => assertAssetAccessPermission(projectState, "source_code"),
    (err) => err.statusCode === 403 && err.message.includes("LOCKED")
  );

  // 4. Payment Protection Workflow & State Machine Test
  // Step A: Milestone 1 Paid
  projectState = updateProjectClosingState(projectState, { actionType: "deposit_received" }, { founderApproved: true });
  assert.strictEqual(projectState.paymentState, "milestone_1_paid");
  assert.strictEqual(projectState.unlockState, "demo_unlocked");
  assert.strictEqual(projectState.financials.amountPaid, 2500);

  // Step B: Full Payment Released
  projectState = updateProjectClosingState(projectState, { actionType: "payment_completed" }, { founderApproved: true });
  assert.strictEqual(projectState.paymentState, "fully_paid");
  assert.strictEqual(projectState.unlockState, "fully_unlocked");
  assert.strictEqual(projectState.financials.amountRemaining, 0);

  // Asset Access Granted After Full Payment
  const accessCheck = assertAssetAccessPermission(projectState, "source_code");
  assert.strictEqual(accessCheck.allowed, true);

  // 5. Executive Dashboard Data Test
  const dashboardData = getExecutiveClosingDashboardData(projectState, conv1, rieReport);
  assert.strictEqual(dashboardData.probabilityOfClosing, rieReport.metrics.probabilityOfWinning);
  assert.ok(dashboardData.expectedProfit > 0);
  assert.ok(dashboardData.expectedDeliveryDate);
  assert.strictEqual(dashboardData.projectStates.paymentState, "fully_paid");

  // 6. Learning Loop Test
  const initialClosingSummary = getClosingLearningSummary();
  recordClosingOutcome({
    closingCaseId: "test-case-001",
    negotiationOutcome: "won_negotiated_price",
    discountGiven: 200,
    clientObjections: ["price_concern"],
    actualDeliveryTimeDays: 3,
    clientSatisfaction: 5
  });

  const updatedClosingSummary = getClosingLearningSummary();
  assert.strictEqual(updatedClosingSummary.totalClosingCases, initialClosingSummary.totalClosingCases + 1);

  console.log("GARUDA Revenue Closing System unit tests PASSED cleanly.");
}

runClosingSystemTests().catch((err) => {
  console.error("Revenue Closing System test failed:", err);
  process.exit(1);
});
