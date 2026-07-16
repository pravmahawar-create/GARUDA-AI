const fs = require("fs");
const path = require("path");
const { evaluateConstitutionGate } = require("../../../scripts/mother/constitution");

function ensureFile(file, content) {
  const full = path.join(process.cwd(), file);
  fs.mkdirSync(path.dirname(full), { recursive: true });

  const constitutionGate = evaluateConstitutionGate("file_write");
  if (!constitutionGate.allowed) {
    return {
      file,
      action: "blocked",
      changed: false,
      status: "BLOCKED_BY_CONSTITUTION",
      reason: "constitution_validation_failed"
    };
  }

  if (!fs.existsSync(full)) {
    fs.writeFileSync(full, content);
    return { file, action: "created", changed: true };
  }

  return { file, action: "exists", changed: false };
}

function executeSafeActions(planner) {
  const results = [];

  if (planner.priorityTask && planner.priorityTask.type === "mother_core_expansion") {
    results.push(ensureFile("src/motherCore/approval/approvalPolicy.js", `function requiresFounderApproval(action) {
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

    results.push(ensureFile("src/motherCore/git/gitStatusEngine.js", `const { execSync } = require("child_process");

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
    changedFiles: results.filter(item => item.changed).length
  };
}

module.exports = { executeSafeActions };
