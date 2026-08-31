const crypto = require("crypto");

function generateBranchName(taskId, prefix = "garuda") {
  const sanitized = taskId.replace(/[^a-zA-Z0-9-_]/g, "-").substring(0, 50);
  const timestamp = Date.now().toString(36);
  return `${prefix}/task/${sanitized}-${timestamp}`;
}

function parseBranchName(branchName) {
  const match = branchName.match(/^([^/]+)\/task\/(.+?)(?:-([a-z0-9]+))?$/);
  if (!match) return null;
  return { prefix: match[1], taskId: match[2], timestamp: match[3] ? parseInt(match[3], 36) : null };
}

function generateEvidenceId() {
  return crypto.randomBytes(8).toString("hex");
}

module.exports = { generateBranchName, parseBranchName, generateEvidenceId };
