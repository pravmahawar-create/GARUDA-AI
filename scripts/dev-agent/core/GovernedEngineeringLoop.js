const crypto = require("crypto");
const ArchitectBrain = require("./ArchitectBrain");
const EngineeringBrain = require("./EngineeringBrain");
const ReviewerBrain = require("./ReviewerBrain");
const { validateProposal } = require("./EngineeringProposalPolicy");

function providerMetadata(provider) {
  const metadata = provider && typeof provider.getMetadata === "function" ? provider.getMetadata() : null;
  if (!metadata || metadata.directWriteAllowed !== false || metadata.commandExecutionAllowed !== false || metadata.gitActionsAllowed !== false) {
    throw new Error("Engineering revision provider violates capability isolation contract");
  }
  return metadata;
}

class GovernedEngineeringLoop {
  constructor({
    rootDir = process.cwd(),
    architectBrain = new ArchitectBrain(),
    reviewerBrain = new ReviewerBrain(),
    engineeringFactory = null,
    revisionProvider = null,
    maxAttempts = 2
  } = {}) {
    this.rootDir = rootDir;
    this.architectBrain = architectBrain;
    this.reviewerBrain = reviewerBrain;
    this.engineeringFactory = engineeringFactory || (() => new EngineeringBrain({ rootDir: this.rootDir }));
    this.revisionProvider = revisionProvider;
    this.maxAttempts = Math.min(3, Math.max(1, Number(maxAttempts) || 2));
  }

  run(request = {}) {
    const architectureRequest = request.architectureRequest || request;
    const plan = this.architectBrain.plan(architectureRequest);
    if (!plan.engineeringHandoff) return this.finish("PLAN_ONLY", plan, [], null, null);
    let spec = plan.engineeringHandoff.artifactSpec;
    const attempts = [];
    let finalArtifact = null;
    let finalReview = null;

    for (let attempt = 1; attempt <= this.maxAttempts; attempt += 1) {
      const engineering = this.engineeringFactory({ attempt, spec }).build(spec);
      const review = this.reviewerBrain.review(engineering);
      attempts.push({
        attempt,
        specification: spec,
        patchSha256: engineering.patchSha256,
        evidenceIds: engineering.evidence.map((item) => item.evidenceId),
        reviewId: review.reviewId,
        verdict: review.verdict,
        requestedChanges: review.requestedChanges,
        rejectReasons: review.rejectReasons
      });
      finalArtifact = engineering;
      finalReview = review;
      if (review.verdict === "APPROVE") return this.finish("READY_FOR_FOUNDER_REVIEW", plan, attempts, finalArtifact, finalReview);
      if (review.verdict === "REJECT") return this.finish("REJECTED", plan, attempts, finalArtifact, finalReview);
      if (attempt >= this.maxAttempts || !this.revisionProvider) return this.finish("CHANGES_REQUIRED", plan, attempts, finalArtifact, finalReview);

      const metadata = providerMetadata(this.revisionProvider);
      const proposal = this.revisionProvider.revise(Object.freeze({
        attempt,
        goalId: plan.goalId,
        previousSpec: Object.freeze({ ...spec, requiredFields: [...spec.requiredFields] }),
        requestedChanges: Object.freeze([...review.requestedChanges]),
        provider: metadata
      }));
      if (proposal && typeof proposal.then === "function") throw new Error("Async revision providers require a dedicated bounded adapter");
      spec = validateProposal(proposal).artifactSpec;
    }
    return this.finish("CHANGES_REQUIRED", plan, attempts, finalArtifact, finalReview);
  }

  finish(status, plan, attempts, finalArtifact, finalReview) {
    const summary = {
      engine: "GARUDA Governed Engineering Loop v1",
      status,
      planId: plan.planId,
      attempts,
      finalPatchSha256: finalArtifact ? finalArtifact.patchSha256 : null,
      finalReviewId: finalReview ? finalReview.reviewId : null,
      founderApprovalRequired: true,
      authorizesSourceApply: false,
      authorizesCommitPushDeploy: false,
      maxAttempts: this.maxAttempts
    };
    return {
      ...summary,
      loopId: crypto.createHash("sha256").update(JSON.stringify(summary)).digest("hex"),
      plan,
      finalArtifact,
      finalReview
    };
  }
}

module.exports = GovernedEngineeringLoop;
module.exports.GovernedEngineeringLoop = GovernedEngineeringLoop;
module.exports.providerMetadata = providerMetadata;
