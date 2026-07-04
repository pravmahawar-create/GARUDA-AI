const { execSync } = require("child_process");

function runCommand(command) {
  try {
    return {
      ok: true,
      output: execSync(command, { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }).trim()
    };
  } catch (error) {
    return {
      ok: false,
      output: String(error.stdout || error.stderr || error.message).trim()
    };
  }
}

function getGitSummary() {
  const branch = runCommand("git branch --show-current");
  const commit = runCommand("git rev-parse --short HEAD");
  const status = runCommand("git status --short");

  return {
    branch: branch.output || "unknown",
    commit: commit.output || "unknown",
    clean: !status.output,
    status: status.output || "Clean working tree"
  };
}

function detectPhase(branch = "") {
  if (branch.includes("phase-2.4")) {
    return "Phase 2.4 Retrieval Intelligence";
  }

  if (branch.includes("phase-2.3")) {
    return "Phase 2.3 LLM Adapter";
  }

  return "Unknown Phase";
}

function getRecommendedNextAction({ branch, gitStatus }) {
  if (!gitStatus.clean) {
    return "Review current working tree before continuing. Run: git status";
  }

  if (branch.includes("phase-2.4")) {
    return "Continue Retrieval Intelligence. Next: implement query expansion and hybrid retrieval modules.";
  }

  return "Run npm run garuda and inspect project status.";
}

module.exports = {
  runCommand,
  getGitSummary,
  detectPhase,
  getRecommendedNextAction
};
