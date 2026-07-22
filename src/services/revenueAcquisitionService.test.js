const assert = require("assert");
const path = require("path");
const service = require("./revenueAcquisitionService");
const { classifySourceTruth } = require("./revenueSourceTruthService");

const rootDir = path.resolve(__dirname, "../..");
const now = new Date("2026-07-22T10:00:00.000Z");
const candidateBase = {
  _id: "507f1f77bcf86cd799439011",
  missionId: "507f191e810c19729de860ea",
  status: "approved",
  title: "Bounded production API delivery",
  company: "Prospective Client",
  description: "Request for proposal with a fixed price, scope of work, project milestone, delivery deadline, and acceptance criteria for a tested Node API.",
  source: "verified_client_portal",
  sourceAttribution: "Verified client portal",
  externalId: "opportunity-1",
  category: "contract_project",
  location: "Remote",
  url: "https://client.example/opportunity/1",
  tags: ["Node", "API", "Testing"],
  score: 92,
  opportunityChannel: "garuda_deliverable",
  capabilityAssessment: { selfEarningEligible: true, humanIdentityRequired: false, matches: [{ capabilityId: "engineering.software-implementation", name: "Governed software implementation", universe: "Engineering", score: 92 }] },
  decision: { actor: "founder", decidedAt: "2026-07-22T09:00:00.000Z" }
};
const candidate = { ...candidateBase, verification: { ...classifySourceTruth(candidateBase, now), prohibitedContentClear: true, scamSignalsClear: true } };

const draft = service.buildProposal(candidate, { proposalType: "application" }, now, { rootDir });
assert.strictEqual(draft.status, "proposal_drafted");
assert.strictEqual(draft.listing.classification, "public_listing_not_contract");
assert.strictEqual(draft.sourceRules.applicationMode, "manual_handoff_only");
assert.strictEqual(draft.proposal.governance.externalSubmissionPerformed, false);
assert.strictEqual(draft.proposal.grounding.sourceRecordHash, candidate.verification.sourceRecordHash);
assert.strictEqual(draft.proposal.grounding.listingKind, "specific_client_work");
assert.ok(draft.proposal.grounding.sourceRequirements.length > 0);
assert.match(draft.proposal.proposalHash, /^[a-f0-9]{64}$/);
assert.doesNotThrow(() => service.assertCaseSourceCurrent(draft, candidate, new Date("2026-07-22T10:01:00.000Z")));
assert.throws(() => service.assertCaseSourceCurrent(draft, { ...candidate, title: "Changed source title" }, new Date("2026-07-22T10:01:00.000Z")), /listing changed/);

const quotation = service.buildProposal(candidate, { proposalType: "quotation", commercialOffer: { amount: 1500, currency: "USD", deliveryDays: 14 } }, now, { rootDir });
assert.deepStrictEqual(quotation.proposal.commercialOffer, { amount: 1500, currency: "USD", deliveryDays: 14 });
assert.throws(() => service.buildProposal(candidate, { proposalType: "quotation", commercialOffer: { amount: 0, currency: "USD", deliveryDays: 14 } }, now, { rootDir }), /positive finite/);

const approvalInput = {
  proposalHash: draft.proposal.proposalHash,
  destination: "Authorized client application channel",
  proposalReviewed: true,
  sourceRulesReviewed: true,
  authorizedAccountConfirmed: true,
  platformEligibilityConfirmed: true,
  noMisrepresentationConfirmed: true
};
const approved = service.buildApprovedHandoff(draft, approvalInput, new Date("2026-07-22T10:05:00.000Z"));
assert.match(approved.founderApproval.decisionHash, /^[a-f0-9]{64}$/);
assert.strictEqual(approved.handoff.governance.automaticSubmissionAllowed, false);
assert.throws(() => service.buildApprovedHandoff(draft, { ...approvalInput, platformEligibilityConfirmed: false }, now), /platformEligibilityConfirmed/);

const handoffReady = { ...draft, status: "handoff_ready", ...approved };
const submissionInput = {
  handoffHash: approved.handoff.handoffHash,
  channel: "platform",
  provider: "Authorized platform account",
  reference: "submission-receipt-001",
  evidence: "Provider-confirmed submission receipt",
  occurredAt: "2026-07-22T10:06:00.000Z",
  externalSubmissionActuallyCompleted: true,
  sameApprovedPackage: true,
  platformRulesFollowed: true,
  authorizedAccountUsed: true,
  noAutomatedSubmission: true
};
const submission = service.buildSubmissionReceipt(handoffReady, submissionInput, new Date("2026-07-22T10:07:00.000Z"));
assert.strictEqual(submission.governance.automatedSubmissionPerformed, false);
assert.strictEqual(submission.governance.contractConfirmed, false);
assert.throws(() => service.buildSubmissionReceipt(handoffReady, { ...submissionInput, sameApprovedPackage: false }, now), /sameApprovedPackage/);

const submitted = { ...handoffReady, status: "submitted", submissionReceipt: submission };
const responseInput = {
  responseType: "award_offer",
  counterparty: "Verified client representative",
  reference: "award-offer-001",
  evidence: "Client award message evidence",
  occurredAt: "2026-07-22T10:08:00.000Z",
  genuineClientResponse: true,
  evidenceReviewedByFounder: true,
  responseMatchesSubmission: true
};
const response = service.buildClientResponse(submitted, responseInput, new Date("2026-07-22T10:09:00.000Z"));
assert.strictEqual(response.responseType, "award_offer");
assert.strictEqual(response.governance.awardOfferStillRequiresFullTermsVerification, true);

const first = service.buildAuditEvent({ acquisitionCaseId: "case-1", candidateId: candidate._id, sequence: 1, eventType: "proposal_drafted", actor: "garuda", details: { proposalHash: draft.proposal.proposalHash } }, now);
const second = service.buildAuditEvent({ acquisitionCaseId: "case-1", candidateId: candidate._id, sequence: 2, eventType: "submission_recorded", actor: "founder", details: { receiptHash: submission.receiptHash }, previousEventHash: first.eventHash }, new Date("2026-07-22T10:10:00.000Z"));
assert.strictEqual(second.previousEventHash, first.eventHash);
assert.notStrictEqual(second.eventHash, first.eventHash);

console.log("Real pilot acquisition proposal, approval, submission, response, award gate, and audit validation passed.");
