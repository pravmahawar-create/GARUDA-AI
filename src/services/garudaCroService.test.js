const assert = require("assert");
const {
  evaluateCroDealStrategy,
  learnFromDealOutcome,
  getCroLearningHistory,
  sha256
} = require("./garudaCroService");

async function runCroTests() {
  const now = new Date("2026-07-27T10:00:00.000Z");

  const sampleCandidate = {
    externalId: "cro-test-opp-001",
    url: "https://upwork.com/jobs/~0123456789abcdef",
    source: "Upwork",
    title: "Build Custom Node.js REST API & Automated Tests",
    description: "Build a custom Node.js microservice REST API endpoint with automated Jest test suite.",
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

  // 1. CRO Deal Strategy Evaluation Test (Solid Deal -> shouldNegotiate = NO)
  const croStrategy = evaluateCroDealStrategy(sampleCandidate, validContext, { now });

  assert.ok(croStrategy.whyClientWillBuy.includes("Acme FinTech Corp"));
  assert.ok(croStrategy.whyClientWillNotBuy);
  assert.ok(croStrategy.emotionalTrigger.includes("Certainty"));
  assert.ok(croStrategy.commercialTrigger.includes("50/50"));
  assert.ok(croStrategy.proofRequired.length >= 2);
  assert.ok(croStrategy.proofUnnecessary.length >= 2);
  assert.strictEqual(croStrategy.shouldNegotiate, "NO");
  assert.ok(croStrategy.directAcceptanceMessage.includes("Commercial Proposal"));
  assert.strictEqual(croStrategy.negotiationConversation, null);
  assert.ok(croStrategy.croDecisionHash);

  // 2. CRO Deal Strategy Evaluation Test (Low Info / Missing Budget -> shouldNegotiate = YES)
  const missingBudgetCandidate = {
    ...sampleCandidate,
    salaryText: "not stated",
    company: "not disclosed"
  };
  const negotiateStrategy = evaluateCroDealStrategy(missingBudgetCandidate, validContext, { now });
  assert.strictEqual(negotiateStrategy.shouldNegotiate, "YES");
  assert.ok(negotiateStrategy.negotiationConversation.founderOpeningMessage.includes("50/50"));
  assert.ok(negotiateStrategy.negotiationConversation.lowestAcceptablePrice);

  // 2. Determinism Test
  const croStrategy2 = evaluateCroDealStrategy(sampleCandidate, validContext, { now });
  assert.strictEqual(croStrategy.croDecisionHash, croStrategy2.croDecisionHash);

  // 3. Outcome Learning Engine Test (WON Deal)
  const initialHistory = getCroLearningHistory("software_engineering");
  const wonResult = learnFromDealOutcome({
    dealId: "real-job-001",
    title: "Node.js API Project",
    category: "software_engineering",
    outcome: "WON",
    reasonForOutcome: "Client accepted 3-day delivery and 50/50 milestone deposit.",
    objectionsEncountered: ["price_concern"],
    agreedPrice: 4800,
    discountGiven: 200,
    deliveryDays: 3,
    clientSatisfaction: 5
  });

  assert.strictEqual(wonResult.recorded, true);
  assert.strictEqual(wonResult.outcome, "WON");
  assert.ok(wonResult.updatedHistory.totalEvaluatedDeals > initialHistory.totalEvaluatedDeals);

  // 4. Outcome Learning Engine Test (LOST Deal)
  const lostResult = learnFromDealOutcome({
    dealId: "real-job-002",
    title: "Legacy Refactoring",
    category: "software_engineering",
    outcome: "LOST",
    reasonForOutcome: "Client selected offshore $5/hr agency willing to start without deposit.",
    objectionsEncountered: ["price_concern", "deposit_refusal"],
    agreedPrice: 0,
    discountGiven: 0,
    deliveryDays: 0,
    clientSatisfaction: 1
  });

  assert.strictEqual(lostResult.recorded, true);
  assert.strictEqual(lostResult.outcome, "LOST");
  assert.ok(lostResult.updatedHistory.topLossFactors.some((f) => f.includes("offshore")));

  console.log("GARUDA CRO (Chief Revenue Officer) Service unit tests PASSED cleanly.");
}

runCroTests().catch((err) => {
  console.error("GARUDA CRO test failed:", err);
  process.exit(1);
});
