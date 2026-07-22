const assert = require("assert");
const path = require("path");
const service = require("./revenueWorkIntakeService");

const rootDir = path.resolve(__dirname, "../..");
const now = new Date("2026-07-22T10:00:00.000Z");
const candidate = {
  _id: "507f1f77bcf86cd799439011",
  missionId: "507f191e810c19729de860ea",
  status: "approved",
  title: "Production API integration",
  company: "Verified Client",
  source: "verified-source",
  url: "https://example.com/opportunity/1",
  score: 91,
  opportunityChannel: "garuda_deliverable",
  verification: { sourceVerified: true, originalLinkPresent: true, prohibitedContentClear: true, scamSignalsClear: true },
  capabilityAssessment: { selfEarningEligible: true, humanIdentityRequired: false, matches: [{ capabilityId: "engineering.software-implementation", score: 91 }] },
  decision: { actor: "founder", decidedAt: "2026-07-21T12:00:00.000Z" }
};

const realInput = {
  engagement: {
    counterparty: "Verified Client Operations",
    channel: "platform_message",
    evidenceKind: "platform_award",
    reference: "platform-award-78421",
    occurredAt: "2026-07-22T09:00:00.000Z",
    clientIdentityVerified: true,
    evidenceReviewedByFounder: true,
    workAuthorizationConfirmed: true,
    termsAcceptedByClient: true
  },
  brief: {
    title: "Production integration delivery",
    deliverableType: "Node API integration",
    scopeSummary: "Implement the client-approved API integration and validation package.",
    requiredInputs: ["Approved API specification", "Authorized sandbox credentials"],
    price: { amount: 75000, currency: "INR" },
    deadline: "2026-08-22T10:00:00.000Z",
    acceptanceCriteria: ["All approved API checks pass", "Client receives the agreed validation report"],
    clientBriefConfirmed: true,
    priceConfirmedByClient: true,
    deadlineConfirmedByClient: true
  },
  attestation: { productionData: true, noPlaceholderData: true }
};

const intake = service.buildConfirmedWorkIntake(candidate, realInput, now, { rootDir });
assert.strictEqual(intake.status, "work_confirmed");
assert.strictEqual(intake.listing.classification, "public_listing_not_contract");
assert.strictEqual(intake.engagement.workAuthorizationConfirmed, true);
assert.deepStrictEqual(intake.brief.price, { amount: 75000, currency: "INR" });
assert.match(intake.truthHash, /^[a-f0-9]{64}$/);
assert.doesNotThrow(() => service.validateConfirmedIntake(intake, candidate._id));
assert.throws(() => service.validateConfirmedIntake({ ...intake, brief: { ...intake.brief, deadline: "2026-09-22T10:00:00.000Z" } }, candidate._id), /does not match/);

assert.throws(() => service.buildConfirmedWorkIntake(candidate, { ...realInput, attestation: {} }, now, { rootDir }), /genuine/);
assert.throws(() => service.buildConfirmedWorkIntake(candidate, { ...realInput, engagement: { ...realInput.engagement, workAuthorizationConfirmed: false } }, now, { rootDir }), /workAuthorizationConfirmed/);
assert.throws(() => service.buildConfirmedWorkIntake(candidate, { ...realInput, brief: { ...realInput.brief, price: { amount: 0, currency: "INR" } } }, now, { rootDir }), /positive finite/);
assert.throws(() => service.validateConfirmedIntake({ status: "handoff_ready", candidateId: candidate._id }, candidate._id), /real-work intake/);

const handoff = service.buildHandoffPreview(candidate, { handoffType: "quotation", destination: "Verified client platform", summary: "Submit the bounded quotation for client review", founderAuthorized: true, attestation: { productionData: true, noPlaceholderData: true } }, now, { rootDir });
assert.strictEqual(handoff.status, "handoff_ready");
assert.strictEqual(handoff.handoff.governance.externalExecutionPerformed, false);
assert.strictEqual(handoff.handoff.governance.contractConfirmed, false);
assert.throws(() => service.buildHandoffPreview(candidate, { handoffType: "application", destination: "Client platform", summary: "Prepare application", founderAuthorized: false, attestation: { productionData: true, noPlaceholderData: true } }, now, { rootDir }), /Founder authorization/);

const first = service.buildAuditEvent({ intakeId: "intake-1", candidateId: candidate._id, sequence: 1, eventType: "work_confirmed", actor: "founder", details: { truthHash: intake.truthHash } }, now);
const second = service.buildAuditEvent({ intakeId: "intake-1", candidateId: candidate._id, sequence: 2, eventType: "mission_created", actor: "garuda", details: { missionHash: "m".repeat(64) }, previousEventHash: first.eventHash }, new Date("2026-07-22T10:01:00.000Z"));
assert.strictEqual(second.previousEventHash, first.eventHash);
assert.notStrictEqual(second.eventHash, first.eventHash);

console.log("Real-work intake truth gates, authorized handoff, mission eligibility, and audit chain passed.");
