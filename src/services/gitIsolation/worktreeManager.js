const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const WORKTREE_DIR = path.join(process.cwd(), "data", "worktrees");

function execGit(args, cwd = process.cwd()) {
  try {
    const stdout = execSync(`git ${args}`, { cwd, encoding: "utf8", timeout: 30000, stdio: ["pipe", "pipe", "pipe"] });
    return { success: true, stdout: stdout.trim() };
  } catch (err) {
    return { success: false, error: err.stderr || err.message || "git command failed" };
  }
}

function ensureWorktreeDir() {
  if (!fs.existsSync(WORKTREE_DIR)) {
    fs.mkdirSync(WORKTREE_DIR, { recursive: true });
  }
}

function createWorktree(taskId, branchName) {
  ensureWorktreeDir();
  const worktreePath = path.join(WORKTREE_DIR, taskId);
  if (fs.existsSync(worktreePath)) {
    return { success: false, error: "Worktree path already exists", path: worktreePath };
  }
  const createResult = execGit(`worktree add "${worktreePath}" -b ${branchName}`);
  if (!createResult.success) {
    const fallback = execGit(`worktree add "${worktreePath}" HEAD`);
    if (!fallback.success) {
      return { success: false, error: `Failed to create worktree: ${fallback.error}` };
    }
  }
  return {
    success: true,
    path: worktreePath,
    branch: branchName,
    taskId,
    createdAt: new Date().toISOString()
  };
}

function removeWorktree(taskId) {
  const worktreePath = path.join(WORKTREE_DIR, taskId);
  if (!fs.existsSync(worktreePath)) {
    return { success: false, error: "Worktree not found", path: worktreePath };
  }
  const removeResult = execGit(`worktree remove "${worktreePath}" --force`);
  if (!removeResult.success) {
    return { success: false, error: `Failed to remove worktree: ${removeResult.error}` };
  }
  return { success: true, path: worktreePath, removed: true };
}

function listWorktrees() {
  const result = execGit("worktree list --porcelain");
  if (!result.success) return [];
  const worktrees = [];
  const lines = result.stdout.split("\n");
  let current = {};
  for (const line of lines) {
    if (line.startsWith("worktree ")) {
      if (current.path) worktrees.push(current);
      current = { path: line.substring("worktree ".length) };
    } else if (line.startsWith("HEAD ")) {
      current.head = line.substring("HEAD ".length);
    } else if (line.startsWith("branch ")) {
      current.branch = line.substring("branch ".length);
    }
  }
  if (current.path) worktrees.push(current);
  return worktrees.filter((w) => w.path.includes("worktrees"));
}

function getWorktreePath(taskId) {
  return path.join(WORKTREE_DIR, taskId);
}

function isWorktreeClean(taskId) {
  const worktreePath = getWorktreePath(taskId);
  if (!fs.existsSync(worktreePath)) return null;
  const result = execGit("status --porcelain", worktreePath);
  if (!result.success) return null;
  return result.stdout.length === 0;
}

module.exports = { createWorktree, removeWorktree, listWorktrees, getWorktreePath, isWorktreeClean, WORKTREE_DIR, execGit };
