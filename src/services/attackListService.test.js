const assert = require("assert");
const {
  evaluateAttackOpportunity,
  generateTodaysAttackList
} = require("./attackListService");
const { processFounderAssistedIntake } = require("./founderAssistedIntakeService");

async function runAttackListTests() {
  const now = new Date("2026-07-27T10:00:00.000Z");

  const sampleCandidate = {
    url: "https://upwork.com/jobs/~0123456789abcdef",
    source: "Upwork",
    title: "Build Custom Node.js REST API & Automated Tests",
    description: "Build a custom Node.js microservice REST API endpoint with automated Jest test suite. Full-time client engagement or fixed price project.",
    company: "Acme FinTech Corp",
    salaryText: "$5,000 fixed price",
    tags: ["Node.js", "REST API", "Automated Testing"],
    attestation: {
      founderAccessedAuthorizedAccount: true,
      noPlaceholderData: true,
      rawTextUnmodified: true
    }
  };

  const validContext = { founderApproved: true };

  // 1. Founder + GARUDA Opportunity Intake Validation (Amendment 1 & 2)
  const intakeResult = processFounderAssistedIntake(sampleCandidate, validContext, now);
  assert.strictEqual(intakeResult.opportunityChannel, "founder_garuda");
  assert.strictEqual(intakeResult.verification.garudaExecutionEligible, true);

  // 2. Attack Opportunity Evaluation (Amendment 3 & 4)
  const evalResult = evaluateAttackOpportunity(sampleCandidate, validContext, { now });
  assert.strictEqual(evalResult.classification, "founder_garuda");
  assert.ok(evalResult.revenueScore >= 50 && evalResult.revenueScore <= 100);
  assert.ok(evalResult.executionScore >= 50 && evalResult.executionScore <= 100);
  assert.strictEqual(evalResult.founderEffort, "low");
  assert.ok(evalResult.expectedDeliveryTime.humanRealityDays >= 1);
  assert.ok(evalResult.expectedDeliveryTime.aiExecutionHours >= 1);
  assert.ok(evalResult.expectedProfit.amount > 0);
  assert.ok(evalResult.aiAutomationPercent >= 70);
  assert.ok(["✅ Submit Immediately", "⚠️ Negotiate First", "🟡 Ask Questions", "❌ Reject", "ATTACK_IMMEDIATELY", "FOUNDER_SUBMIT", "NEGOTIATE", "PASS"].includes(evalResult.recommendedAction));

  // 3. Today's Attack List Generation (Amendment 4)
  const attackListResult = generateTodaysAttackList([sampleCandidate], validContext, { now });
  assert.ok(attackListResult.attackListDate);
  assert.ok(attackListResult.summary.totalOpportunitiesEvaluated >= 1);
  assert.ok(attackListResult.summary.totalPotentialRevenue.amount > 0);
  assert.ok(attackListResult.attackList.length >= 1);
  assert.strictEqual(attackListResult.attackList[0].rank, 1);
  assert.ok(attackListResult.attackList[0].attackReasoning.includes("Opportunity Score") || attackListResult.attackList[0].attackReasoning.includes("Revenue Score"));

  console.log("GARUDA Today's Attack List & Constitutional Amendments unit tests PASSED cleanly.");
}

runAttackListTests().catch((err) => {
  console.error("Attack List test failed:", err);
  process.exit(1);
});
