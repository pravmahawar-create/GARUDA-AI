const { execSync } = require("child_process");

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
