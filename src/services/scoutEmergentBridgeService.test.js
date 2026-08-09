const assert = require("assert");

const bridge = require("./scoutEmergentBridgeService");
const revenueWorkIntakeService = require("./revenueWorkIntakeService");

const incomeGoalId = "507f191e810c19729de860ea";

const wonScout = {
  id: "507f1f77bcf86cd799439011",
  platform: "garuda_direct",
  title: "Build an AI customer assistant for a boutique agency",
  client: "Maple Consulting",
  url: "https://client.example/opportunity/maple-ai-assistant",
  budgetText: "Budget $1,200",
  budget: 1200,
  currency: "USD",
  categoryId: "ai-customer-assistant",
  notes: "Fixed-scope assistant with retrieval and doc answers.",
  score: 82,
  status: "won"
};

const payload = {
  amount: 1200,
  currency: "USD",
  title: "AI customer assistant delivery for Maple Consulting",
  clientName: "Maple Consulting Operations",
  reference: "award-mx-9912",
  engagementChannel: "platform_message",
  evidenceKind: "accepted_quotation",
  scopeSummary: "Deliver the agreed AI assistant against the confirmed brief.",
  requiredInputs: ["Approved assistant spec"],
  acceptanceCriteria: ["Assistant answers from the approved source docs"],
  deadlineAt: "2026-09-22T10:00:00.000Z",
  engagementAt: "2026-08-08T10:00:00.000Z",
  clientIdentityVerified: true,
  evidenceReviewedByFounder: true,
  workAuthorizationConfirmed: true,
  termsAcceptedByClient: true,
  clientBriefConfirmed: true,
  priceConfirmedByClient: true,
  deadlineConfirmedByClient: true,
  sourceUrl: "https://client.example/pilot/maple-ai-assistant/brief"
};

const readyEnv = {
  RAZORPAY_LIVE_ENABLED: "false",
  RAZORPAY_KEY_ID_TEST: "rzp_test_1a2b3c4d5e6f7g8h",
  RAZORPAY_KEY_SECRET_TEST: "test-secret",
  RAZORPAY_WEBHOOK_SECRET_TEST: "webhook-secret-at-least-16-chars",
  RAZORPAY_API_TIMEOUT_MS: "2500"
};

assert.strictEqual(bridge.capabilityIdFor("ai-customer-assistant"), "ai.agent-engineering");
assert.strictEqual(bridge.capabilityIdFor("no-such-category"), "engineering.software-implementation");
assert.ok(bridge.categoryDisplayName(wonScout).length > 0);

const bareReadiness = bridge.paymentReadiness({});
assert.strictEqual(bareReadiness.ready, false);
assert.strictEqual(bareReadiness.mode, "test");
assert.strictEqual(bareReadiness.webhookSecretConfigured, false);

const configuredReadiness = bridge.paymentReadiness(readyEnv);
assert.strictEqual(configuredReadiness.mode, "test");
assert.strictEqual(configuredReadiness.ready, true, "configured test creds with valid rzp prefix should be ready");
assert.strictEqual(configuredReadiness.webhookSecretConfigured, true);

const hero = bridge.buildCandidateRecord(wonScout, { _id: incomeGoalId }, { ...payload, score: 85 });
assert.strictEqual(hero.status, "approved");
assert.strictEqual(hero.opportunityChannel, "garuda_deliverable");
assert.strictEqual(hero.missionId, incomeGoalId);
assert.strictEqual(hero.sourceAttribution, "scout/scout:507f1f77bcf86cd799439011");
assert.match(hero.verification.sourceRecordHash, /^[a-f0-9]{64}$/);
assert.ok(Array.isArray(hero.verification.rejectionReasons));
assert.strictEqual(hero.capabilityAssessment.matches[0].capabilityId, "ai.agent-engineering");
assert.strictEqual(
  bridge.buildCandidateRecord(wonScout, { _id: incomeGoalId }, { ...payload, score: 85 }).verification.sourceRecordHash,
  hero.verification.sourceRecordHash
);

async function main() {
  const candidate = {
    ...hero,
    _id: "507f1f77bcf86cd799439013",
    decision: { ...hero.decision, decidedAt: new Date("2026-08-08T10:00:00.000Z") },
    verification: { ...hero.verification, verifiedAt: new Date() }
  };
  const intakeInput = {
    attestation: { productionData: true, noPlaceholderData: true },
    engagement: {
      channel: "platform_message", evidenceKind: "accepted_quotation",
      counterparty: "Maple Consulting Operations", reference: "award-mx-9912",
      occurredAt: "2026-08-08T10:00:00.000Z",
      clientIdentityVerified: true, evidenceReviewedByFounder: true,
      workAuthorizationConfirmed: true, termsAcceptedByClient: true
    },
    brief: {
      title: "AI customer assistant delivery",
      deliverableType: "AI customer assistant",
      scopeSummary: "Deliver the agreed AI assistant against the confirmed brief.",
      requiredInputs: ["Approved assistant spec"],
      price: { amount: 1200, currency: "USD" },
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      acceptanceCriteria: ["Assistant answers from the approved source docs"],
      clientBriefConfirmed: true, priceConfirmedByClient: true, deadlineConfirmedByClient: true
    }
  };
  const path = require("path");
  const now = new Date();
  const confirmed = revenueWorkIntakeService.buildConfirmedWorkIntake(candidate, intakeInput, now, { rootDir: path.resolve(__dirname, "../..") });
  assert.strictEqual(confirmed.status, "work_confirmed");
  assert.strictEqual(confirmed.brief.price.amount, 1200);
  assert.strictEqual(confirmed.brief.price.currency, "USD");
  assert.match(confirmed.truthHash, /^[a-f0-9]{64}$/);
  assert.strictEqual(confirmed.listing.classification, "public_listing_not_contract");
  assert.strictEqual(confirmed.governance.listingIsNotContract, true);
  assert.strictEqual(confirmed.governance.automaticApplicationAllowed, false);

  let unauthorizedError = null;
  try {
    await bridge.requestPaymentForWonOpportunity("507f1f77bcf86cd799439013", payload, { founderApproved: false });
  } catch (error) {
    unauthorizedError = error;
  }
  assert.ok(unauthorizedError, "founder approval gate must reject unapproved requests");
  assert.strictEqual(unauthorizedError.statusCode, 403);

  let disconnectedError = null;
  try {
    await bridge.requestPaymentForWonOpportunity("507f1f77bcf86cd799439013", payload, { founderApproved: true });
  } catch (error) {
    disconnectedError = error;
  }
  assert.ok(disconnectedError, "bridge must require an active Mongo connection");
  assert.strictEqual(disconnectedError.statusCode, 503);

  let invalidIdError = null;
  try {
    await bridge.requestPaymentForWonOpportunity("not-an-object-id", payload, { founderApproved: true });
  } catch (error) {
    invalidIdError = error;
  }
  assert.strictEqual(invalidIdError.statusCode, 400);

  console.log("Scout-Emergent revenue bridge smoke checks passed; MongoDB write path needs a live database.");
}

main().catch((error) => {
  console.error("Scout-Emergent revenue bridge smoke checks failed:\n", error);
  process.exit(1);
});