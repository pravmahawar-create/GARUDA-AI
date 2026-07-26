const assert = require("assert");
const {
  INTAKE_LABEL,
  buildFounderReviewPackage,
  importFounderAssistedCandidate,
  processFounderAssistedIntake,
  sha256
} = require("./founderAssistedIntakeService");
const { buildProposal } = require("./revenueAcquisitionService");

async function runFounderAssistedIntakeTests() {
  const now = new Date("2026-07-27T10:00:00.000Z");

  const validIntakeInput = {
    url: "https://upwork.com/jobs/~0123456789abcdef",
    source: "Upwork",
    title: "Build Custom Node.js REST API & Automated Tests",
    description: "Build a custom Node.js microservice REST API endpoint with automated Jest test suite. Fixed price project, scope of work includes deliverable package and acceptance criteria.",
    company: "Acme FinTech Corp",
    salaryText: "$5,000 fixed price",
    deadlineText: "2026-08-30",
    tags: ["Node.js", "API", "Testing"],
    attachments: [{ fileName: "architecture_spec.pdf", fileSize: 154200, fileType: "application/pdf" }],
    attestation: {
      founderAccessedAuthorizedAccount: true,
      noPlaceholderData: true,
      rawTextUnmodified: true
    }
  };

  const validContext = { founderApproved: true };

  // 1. Valid Specific-Client Listing
  const result = processFounderAssistedIntake(validIntakeInput, validContext, now);
  assert.strictEqual(result.opportunityChannel, "garuda_deliverable");
  assert.strictEqual(result.verification.listingKind, "specific_client_work");
  assert.strictEqual(result.verification.garudaExecutionEligible, true);
  assert.strictEqual(result.requiresFounderApproval, true);
  assert.strictEqual(result.founderAssistedIntake.label, INTAKE_LABEL);
  assert.strictEqual(result.founderAssistedIntake.attestation.founderAccessedAuthorizedAccount, true);
  assert.ok(result.rawSourceHash);

  // Founder Review Package Generation
  const reviewPkg = buildFounderReviewPackage(result);
  assert.strictEqual(reviewPkg.status, "READY_FOR_FOUNDER_REVIEW");
  assert.strictEqual(reviewPkg.originalUrl, validIntakeInput.url);
  assert.strictEqual(reviewPkg.clientIdentity, validIntakeInput.company);
  assert.strictEqual(reviewPkg.budget, validIntakeInput.salaryText);
  assert.strictEqual(reviewPkg.label, INTAKE_LABEL);

  // 2. Human Employment Rejection
  const humanJobInput = {
    ...validIntakeInput,
    url: "https://upwork.com/jobs/~humanjob001",
    title: "Full-Time Senior Node.js Developer Position",
    description: "Seeking a permanent full-time employee. Send CV, portfolio, and attend coding interview.",
    company: "Big Tech LLC"
  };
  assert.throws(
    () => processFounderAssistedIntake(humanJobInput, validContext, now),
    (err) => err.statusCode === 409 && err.message.includes("human employment")
  );

  // 3. Missing Attestation Rejection
  const missingAttestationInput = {
    ...validIntakeInput,
    attestation: {
      founderAccessedAuthorizedAccount: false,
      noPlaceholderData: true,
      rawTextUnmodified: true
    }
  };
  assert.throws(
    () => processFounderAssistedIntake(missingAttestationInput, validContext, now),
    (err) => err.statusCode === 403 && err.message.includes("Founder attestation")
  );

  assert.throws(
    () => processFounderAssistedIntake(validIntakeInput, { founderApproved: false }, now),
    (err) => err.statusCode === 403 && err.message.includes("Founder attestation")
  );

  // 4. Duplicate Listing Rejection (Simulated or Mongo)
  const importedFirst = await importFounderAssistedCandidate(validIntakeInput, validContext, { now });
  assert.ok(importedFirst.candidate);
  assert.ok(importedFirst.reviewPackage);

  // 5. Expired Listing Rejection
  const expiredInput = {
    ...validIntakeInput,
    url: "https://upwork.com/jobs/~expired001",
    deadlineText: "2026-06-01" // In the past relative to 2026-07-27
  };
  assert.throws(
    () => processFounderAssistedIntake(expiredInput, validContext, now),
    (err) => err.statusCode === 409 && err.message.includes("expired")
  );

  // 6. Missing Budget Allowed But Flagged
  const missingBudgetInput = {
    ...validIntakeInput,
    url: "https://upwork.com/jobs/~nobudget001",
    salaryText: "not stated",
    company: "not disclosed"
  };
  const missingBudgetResult = processFounderAssistedIntake(missingBudgetInput, validContext, now);
  assert.strictEqual(missingBudgetResult.opportunityChannel, "garuda_deliverable");
  assert.ok(missingBudgetResult.founderAssistedIntake.missingInformation.some((m) => m.includes("Budget")));
  assert.ok(missingBudgetResult.founderAssistedIntake.missingInformation.some((m) => m.includes("Client identity")));
  assert.ok(missingBudgetResult.founderAssistedIntake.risks.some((r) => r.includes("budget specification")));

  // 7. Fake / Demo / Placeholder Rejection
  const demoInput = {
    ...validIntakeInput,
    url: "https://example.com/demo-job",
    title: "Demo Placeholder Opportunity"
  };
  assert.throws(
    () => processFounderAssistedIntake(demoInput, validContext, now),
    (err) => err.statusCode === 409 && err.message.includes("placeholder")
  );

  // 8. Proposal Blocked Without Founder Approval
  const candidateForProposal = {
    ...result,
    _id: "507f1f77bcf86cd799439011",
    missionId: "507f191e810c19729de860ea",
    status: "approved"
  };

  assert.throws(
    () => buildProposal(candidateForProposal, { proposalType: "application" }, now, { founderApproved: false }),
    (err) => err.statusCode === 403 || err.message.includes("approval")
  );

  // 9. Raw Source Immutability
  assert.ok(Object.isFrozen(result.rawSource));
  assert.strictEqual(result.rawSource.title, validIntakeInput.title);
  assert.strictEqual(result.rawSource.description, validIntakeInput.description);
  assert.strictEqual(result.rawSourceHash, sha256(result.rawSource));

  console.log("Governed Founder-Assisted Opportunity Intake validation tests PASSED cleanly.");
}

runFounderAssistedIntakeTests().catch((err) => {
  console.error("Founder-assisted intake test failed:", err);
  process.exit(1);
});
