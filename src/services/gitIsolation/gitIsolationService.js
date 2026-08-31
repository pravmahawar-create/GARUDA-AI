const { createWorktree, removeWorktree, listWorktrees, getWorktreePath, isWorktreeClean, execGit } = require("./worktreeManager");
const { generateBranchName, parseBranchName, generateEvidenceId } = require("./branchNaming");
const { generateDiff, generateDiffSummary, getCommitLog } = require("./diffGenerator");
const { findAbandonedWorktrees, cleanupAbandoned, cleanupOldWorktrees } = require("./worktreeCleaner");

module.exports = {
  createWorktree,
  removeWorktree,
  listWorktrees,
  getWorktreePath,
  isWorktreeClean,
  execGit,
  generateBranchName,
  parseBranchName,
  generateEvidenceId,
  generateDiff,
  generateDiffSummary,
  getCommitLog,
  findAbandonedWorktrees,
  cleanupAbandoned,
  cleanupOldWorktrees
};
