const assert = require("assert");
const service = require("./revenueProductionDeliveryService");

const truthHash = "f".repeat(64);
const mission = {
  id: "mission-1",
  missionHash: "1".repeat(64),
  status: "founder_approved",
  truthStatus: "verified_real_work",
  realWorkIntake: { truthHash },
  opportunity: {
    company: "Verified Client",
    engagementVerification: { verified: true, counterparty: "Verified Client", workAuthorizationConfirmed: true, termsAcceptedByClient: true, truthHash },
    brief: { price: { amount: 1250, currency: "INR" }, acceptanceCriteria: ["Output matches the confirmed specification", "Automated checks pass"] }
  },
  deliverableWorkspace: { status: "complete" },
  workPackages: [{ id: "task-1", status: "completed", evidence: [{ kind: "artifact", label: "Final package", reference: "workspace://mission-1/final", sha256: "a".repeat(64) }] }]
};
const qualityInput = {
  automatedTests: [{ name: "Production validation", command: "npm test", exitCode: 0, passed: true, reference: "workspace://mission-1/tests", sha256: "b".repeat(64) }],
  criterionChecks: [
    { criterion: "Output matches the confirmed specification", passed: true, reference: "workspace://mission-1/acceptance/1", sha256: "c".repeat(64) },
    { criterion: "Automated checks pass", passed: true, reference: "workspace://mission-1/acceptance/2", sha256: "d".repeat(64) }
  ],
  attestation: { productionData: true, noPlaceholderData: true, testedFinalArtifacts: true }
};

const quality = service.buildQualityReport(mission, qualityInput, new Date("2026-07-22T10:00:00.000Z"));
assert.strictEqual(quality.outcome, "passed");
assert.strictEqual(quality.criterionChecks.length, 2);
assert.strictEqual(quality.governance.externalDeliveryAuthorized, false);
let delivery = { id: "delivery-1", ...service.buildInitialDelivery(mission, quality) };
assert.strictEqual(delivery.status, "quality_passed");

const finalApproval = service.buildFinalApproval(delivery, { decision: "approved", confirmedFinalArtifacts: true, notes: "Final evidence reviewed" }, new Date("2026-07-22T10:05:00.000Z"));
delivery = { ...delivery, status: "final_approved", finalApproval };
const handoff = service.buildDeliveryHandoff(delivery, { founderAuthorized: true, channel: "client_portal", destination: "Verified client workspace", summary: "Final tested package" }, new Date("2026-07-22T10:10:00.000Z"));
assert.strictEqual(handoff.governance.externalDeliveryPerformed, false);
delivery = { ...delivery, status: "handoff_ready", deliveryHandoff: handoff };
const receipt = service.buildDeliveryReceipt(delivery, { deliveryActuallyPerformed: true, provider: "client portal", reference: "delivery-ref-1", evidence: "Portal receipt reviewed", deliveredAt: "2026-07-22T10:15:00.000Z" }, new Date("2026-07-22T10:20:00.000Z"));
assert.strictEqual(receipt.governance.clientAcceptanceNotImplied, true);
delivery = { ...delivery, status: "delivered", deliveryReceipt: receipt };
const acceptance = service.buildClientAcceptance(delivery, { clientIdentityConfirmed: true, allAcceptanceCriteriaConfirmed: true, reference: "accept-ref-1", evidence: "Client acceptance reviewed", acceptedAt: "2026-07-22T10:25:00.000Z" }, new Date("2026-07-22T10:30:00.000Z"));
delivery = { ...delivery, status: "client_accepted", clientAcceptance: acceptance };
const payment = service.buildVerifiedPayment(delivery, { verified: true, verificationMethod: "signed_provider_webhook", missionId: "mission-1", eventKey: "e".repeat(64), provider: "provider-test", providerReference: "pay-ref-1", amount: 1250, currency: "INR", receivedAt: "2026-07-22T10:35:00.000Z", payloadHash: "6".repeat(64), signatureHash: "7".repeat(64) }, new Date("2026-07-22T10:40:00.000Z"));
assert.strictEqual(payment.governance.revenueClaimAllowed, true);
assert.strictEqual(payment.governance.payoutSettlementNotImplied, true);
const records = service.buildRevenueLedgerRecords(delivery, payment);
assert.strictEqual(records.revenue.status, "received");
assert.strictEqual(records.settlement.status, "pending");
assert.strictEqual(records.settlement.payoutEligible, false);
assert.deepStrictEqual(records.settlement.eligibilityReasons, ["provider_settlement_pending", "verified_fee_receipt_pending"]);

assert.throws(() => service.buildQualityReport({ ...mission, truthStatus: "listing_only_not_contract" }, qualityInput), /verified real client/);
assert.throws(() => service.buildQualityReport(mission, { ...qualityInput, attestation: { productionData: true } }), /attestations/);
assert.throws(() => service.buildFinalApproval({ ...delivery, status: "quality_passed", qualityReport: { outcome: "failed" } }, { decision: "approved", confirmedFinalArtifacts: true }), /Passing quality/);
assert.throws(() => service.buildVerifiedPayment(delivery, { ...payment, verified: true, verificationMethod: "signed_provider_webhook", missionId: "mission-1", amount: 1 }), /amount and currency/);

console.log("Production deliverable QA, final approval, authorized delivery, client acceptance, and payment truth gates passed.");
