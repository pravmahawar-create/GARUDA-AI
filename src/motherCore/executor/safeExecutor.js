const { requiresFounderApproval } = require("../approval/approvalPolicy");

function proposeFile(file, content) {
  const action = { type: "file_write", requiresFounderApproval: true };
  return {
    file,
    action: "proposed",
    changed: false,
    status: requiresFounderApproval(action) ? "BLOCKED_BY_APPROVAL" : "ready",
    reason: "source_changes_require_founder_approval",
    proposedContent: content
  };
}

function executeSafeActions(planner) {
  const results = [];

  if (planner.priorityTask && planner.priorityTask.type === "mother_core_expansion") {
    results.push(proposeFile("src/motherCore/approval/approvalPolicy.js", `function requiresFounderApproval(action) {
  if (!action) return true;

  const riskyTypes = [
    "delete_file",
    "git_commit",
    "git_push",
    "env_change",
    "dependency_install",
    "security_sensitive_change",
    "database_migration"
  ];

  return riskyTypes.includes(action.type) || action.requiresFounderApproval === true;
}

module.exports = { requiresFounderApproval };
`));

    results.push(proposeFile("src/motherCore/git/gitStatusEngine.js", `const { execSync } = require("child_process");

function run(cmd) {
  try {
    return { ok: true, output: execSync(cmd, { encoding: "utf8" }).trim() };
  } catch (error) {
    return { ok: false, output: String(error.stdout || error.stderr || error.message).trim() };
  }
}

function getGitStatus() {
  return {
    branch: run("git branch --show-current").output || "unknown",
    commit: run("git rev-parse --short HEAD").output || "unknown",
    status: run("git status --short").output || "",
    clean: !run("git status --short").output
  };
}

module.exports = { getGitStatus };
`));
  }

  return {
    engine: "GARUDA Safe Executor v1",
    executed: results,
    changedFiles: 0,
    approvalRequired: results.length > 0
  };
}

module.exports = { executeSafeActions };
