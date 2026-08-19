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

  async runGenericCodeTask(request = {}) {
    const task = String(request.task || request.goal || "").trim();
    if (!task) return this.finishGeneric("EXECUTION_FAILED", null, [], null, null, { reason: "GENERIC_CODE_TASK_REQUIRED" });
    if (task.length > 2000) return this.finishGeneric("EXECUTION_FAILED", null, [], null, null, { reason: "GENERIC_CODE_TASK_TOO_LONG" });

    const plan = this.architectBrain.plan({ goal: task, goalId: request.goalId, domain: request.domain });
    if (!plan.governance) return this.finishGeneric("EXECUTION_FAILED", plan, [], null, null, { reason: "PLAN_GOVERNANCE_MISSING" });

    const engineering = this.engineeringFactory({ attempt: 1, spec: null, request });
    if (!engineering || typeof engineering.buildGenericCodeFromTask !== "function") {
      return this.finishGeneric("EXECUTION_FAILED", plan, [], null, null, { reason: "ENGINEERING_BRAIN_LACKS_GENERIC_TASK_ADAPTER" });
    }

    let generation;
    try {
      generation = await engineering.buildGenericCodeFromTask({
        task,
        intentId: request.intentId || `${plan.goalId}-generic`,
        llm: request.llm || null
      });
    } catch (err) {
      return this.finishGeneric("EXECUTION_FAILED", plan, [], null, null, { reason: err.message || "GENERIC_CODE_TASK_GENERATION_FAILED" });
    }

    if (!generation || generation.status !== "ARTIFACT_READY_FOR_REVIEW") {
      return this.finishGeneric("EXECUTION_FAILED", plan, [], generation || null, null, {
        reason: generation && generation.status ? `GENERATION_${generation.status}` : "GENERATION_REJECTED"
      });
    }

    const buildResult = generation.buildResult;
    const review = this.reviewerBrain.review(buildResult);
    const stages = ["PROPOSAL_GENERATED"];
    const attemptRecord = {
      attempt: 1,
      kind: "generic_code_task",
      task,
      patchSha256: buildResult.patchSha256,
      evidenceIds: buildResult.evidence.map((item) => item.evidenceId),
      reviewId: review.reviewId,
      verdict: review.verdict,
      requestedChanges: review.requestedChanges,
      rejectReasons: review.rejectReasons
    };

    if (review.verdict !== "APPROVE") {
      return this.finishGeneric(review.verdict === "REJECT" ? "REJECTED" : "CHANGES_REQUIRED", plan, [attemptRecord], generation, review, { stages });
    }

    if (request.founderApproved !== true) {
      return this.finishGeneric("BLOCKED_BY_APPROVAL", plan, [attemptRecord], generation, review, { stages });
    }

    let applied;
    try {
      applied = engineering.applyPatchToWorkspace(buildResult, { founderApproved: true });
    } catch (err) {
      return this.finishGeneric("EXECUTION_FAILED", plan, [attemptRecord], generation, review, { stages, reason: err.message || "APPLY_FAILED" });
    }

    if (applied && applied.status === "PATCH_APPLIED_AND_VERIFIED") {
      return this.finishGeneric("COMPLETED_AND_APPLIED", plan, [attemptRecord], generation, review, {
        stages: [...stages, "PATCH_APPLIED_AND_VERIFIED", "COMPLETED_AND_APPLIED"],
        appliedResult: applied,
        appliedFiles: applied.appliedFiles || []
      });
    }
    if (applied && applied.status === "PATCH_REJECTED") {
      return this.finishGeneric("ROLLED_BACK", plan, [attemptRecord], generation, review, {
        stages: [...stages, "PATCH_REJECTED", "ROLLED_BACK"],
        appliedResult: applied,
        reason: applied.reason || "verification_failed_rollback_completed"
      });
    }
    return this.finishGeneric("EXECUTION_FAILED", plan, [attemptRecord], generation, review, {
      stages: [...stages, "EXECUTION_FAILED"],
      appliedResult: applied,
      reason: applied && applied.status ? `UNEXPECTED_APPLY_STATUS_${applied.status}` : "APPLY_UNKNOWN"
    });
  }

  finishGeneric(status, plan, attempts, generation, finalReview, extra = {}) {
    const finalArtifact = generation && generation.buildResult ? generation.buildResult : generation;
    const summary = {
      engine: "GARUDA Governed Engineering Loop v1",
      status,
      planId: plan ? plan.planId : null,
      attempts,
      finalPatchSha256: finalArtifact ? finalArtifact.patchSha256 : null,
      finalReviewId: finalReview ? finalReview.reviewId : null,
      founderApprovalRequired: true,
      authorizesSourceApply: false,
      authorizesCommitPushDeploy: false,
      maxAttempts: this.maxAttempts,
      ...extra
    };
    return {
      ...summary,
      loopId: crypto.createHash("sha256").update(JSON.stringify(summary)).digest("hex"),
      plan,
      finalArtifact,
      finalReview,
      generation
    };
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
