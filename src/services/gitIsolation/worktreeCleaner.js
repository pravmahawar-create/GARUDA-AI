const fs = require("fs");
const { listWorktrees, removeWorktree, WORKTREE_DIR } = require("./worktreeManager");

function findAbandonedWorktrees() {
  if (!fs.existsSync(WORKTREE_DIR)) return [];
  const onDisk = fs.readdirSync(WORKTREE_DIR).filter((d) => {
    try { return fs.statSync(require("path").join(WORKTREE_DIR, d)).isDirectory(); } catch { return false; }
  });
  const registered = listWorktrees().map((w) => {
    const parts = w.path.split(/[/\\]/);
    return parts[parts.length - 1];
  });
  return onDisk.filter((d) => !registered.includes(d));
}

function cleanupAbandoned() {
  const abandoned = findAbandonedWorktrees();
  const results = [];
  for (const dir of abandoned) {
    const fullPath = require("path").join(WORKTREE_DIR, dir);
    try {
      fs.rmSync(fullPath, { recursive: true, force: true });
      results.push({ directory: dir, status: "removed" });
    } catch (err) {
      results.push({ directory: dir, status: "failed", error: err.message });
    }
  }
  return { cleaned: results.length, results };
}

function cleanupOldWorktrees(maxAgeMs = 86400000) {
  const worktrees = listWorktrees();
  const results = [];
  for (const wt of worktrees) {
    try {
      const stat = fs.statSync(wt.path);
      const age = Date.now() - stat.mtimeMs;
      if (age > maxAgeMs) {
        const removeResult = removeWorktree(require("path").basename(wt.path));
        results.push({ path: wt.path, status: removeResult.success ? "removed" : "failed", age });
      }
    } catch {}
  }
  return { cleaned: results.length, results };
}

module.exports = { findAbandonedWorktrees, cleanupAbandoned, cleanupOldWorktrees };
