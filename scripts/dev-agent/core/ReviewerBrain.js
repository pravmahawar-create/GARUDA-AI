const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function evidenceHash(evidence) {
  const value = { ...evidence };
  delete value.evidenceId;
  return sha256(JSON.stringify(value));
}

function inspectPatch(patch, artifacts) {
  const findings = [];
  const headers = String(patch || "").match(/^diff --git a\/(.+) b\/(.+)$/gm) || [];
  if (headers.length !== artifacts.length) findings.push("patch_file_count_mismatch");
  for (const artifact of artifacts) {
    const escaped = artifact.path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const blockPattern = new RegExp(`diff --git a/${escaped} b/${escaped}\\nnew file mode 100644\\n--- /dev/null\\n\\+\\+\\+ b/${escaped}\\n`);
    if (!blockPattern.test(patch)) findings.push(`patch_not_new_file_only:${artifact.path}`);
  }
  if (/^(?:deleted file mode|rename from|rename to) /m.test(patch)) findings.push("patch_contains_destructive_change");
  return findings;
}

class ReviewerBrain {
  review(engineeringOutput = {}) {
    const reject = [];
    const requestChanges = [];
    const verified = [];
    if (!engineeringOutput || typeof engineeringOutput !== "object") reject.push("missing_engineering_output");
    const artifacts = Array.isArray(engineeringOutput.artifacts) ? engineeringOutput.artifacts : [];
    const evidence = Array.isArray(engineeringOutput.evidence) ? engineeringOutput.evidence : [];
    if (!artifacts.length) reject.push("missing_artifacts");
    if (!engineeringOutput.workspace || !fs.existsSync(engineeringOutput.workspace)) reject.push("missing_isolated_workspace");

    if (!reject.length) {
      const workspace = fs.realpathSync(engineeringOutput.workspace);
      for (const artifact of artifacts) {
        const target = path.resolve(workspace, artifact.path || "");
        if (!fs.existsSync(target) || !fs.statSync(target).isFile()) {
          reject.push(`artifact_missing:${artifact.path}`);
          continue;
        }
        const realTarget = fs.realpathSync(target);
        const relative = path.relative(workspace, realTarget);
        if (relative.startsWith("..") || path.isAbsolute(relative)) {
          reject.push(`artifact_outside_workspace:${artifact.path}`);
          continue;
        }
        if (sha256(fs.readFileSync(realTarget)) !== artifact.sha256) reject.push(`artifact_hash_mismatch:${artifact.path}`);
        else verified.push(`artifact_hash:${artifact.path}`);
      }
    }

    if (!engineeringOutput.patch || sha256(engineeringOutput.patch || "") !== engineeringOutput.patchSha256) reject.push("patch_hash_mismatch");
    else verified.push("patch_hash");
    reject.push(...inspectPatch(engineeringOutput.patch, artifacts));
    if (engineeringOutput.sourceTreeModified !== false) reject.push("source_tree_modified");
    if (engineeringOutput.requiresFounderApprovalToApply !== true) reject.push("founder_approval_gate_missing");
    if (engineeringOutput.commitPushDeployAllowed !== false) reject.push("write_authority_exposed");

    if (!evidence.length) requestChanges.push("missing_test_evidence");
    const coveredTargets = new Set();
    let realTestCount = 0;
    for (const item of evidence) {
      if (!item.evidenceId || evidenceHash(item) !== item.evidenceId) reject.push(`evidence_integrity_failed:${item.targetFile || "unknown"}`);
      if (item.shellUsed !== false) reject.push(`shell_execution_detected:${item.targetFile || "unknown"}`);
      if (item.status !== "PASSED" || item.exitCode !== 0 || item.targetModified !== false) requestChanges.push(`validation_not_passed:${item.targetFile || "unknown"}`);
      if (item.targetFile) coveredTargets.add(String(item.targetFile).replace(/\\/g, "/"));
      if (Array.isArray(item.arguments) && !item.arguments.includes("--check")) realTestCount += 1;
    }
    for (const artifact of artifacts) {
      if (!coveredTargets.has(artifact.path)) requestChanges.push(`artifact_without_evidence:${artifact.path}`);
    }
    if (!realTestCount) requestChanges.push("missing_real_test_execution");
    if (engineeringOutput.status !== "ARTIFACT_READY_FOR_REVIEW") requestChanges.push("engineering_artifact_not_ready");

    const verdict = reject.length ? "REJECT" : requestChanges.length ? "REQUEST_CHANGES" : "APPROVE";
    const report = {
      engine: "GARUDA Reviewer Brain v1",
      verdict,
      scope: "TECHNICAL_ARTIFACT_REVIEW_ONLY",
      verified: Array.from(new Set(verified)),
      rejectReasons: Array.from(new Set(reject)),
      requestedChanges: Array.from(new Set(requestChanges)),
      authorizesSourceApply: false,
      authorizesCommitPushDeploy: false,
      founderApprovalStillRequired: true,
      reviewedPatchSha256: engineeringOutput.patchSha256 || null,
      reviewedAt: new Date().toISOString()
    };
    report.reviewId = sha256(JSON.stringify(report));
    return report;
  }
}

module.exports = ReviewerBrain;
module.exports.ReviewerBrain = ReviewerBrain;
module.exports.evidenceHash = evidenceHash;
module.exports.inspectPatch = inspectPatch;
