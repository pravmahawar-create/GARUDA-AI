const { execGit } = require("./worktreeManager");

function generateDiff(worktreePath, options = {}) {
  const { base = "HEAD", stat = false } = options;
  if (stat) {
    const result = execGit(`diff ${base} --stat`, worktreePath);
    return result.success ? { success: true, stat: result.stdout } : { success: false, error: result.error };
  }
  const result = execGit(`diff ${base}`, worktreePath);
  return result.success ? { success: true, diff: result.stdout } : { success: false, error: result.error };
}

function generateDiffSummary(worktreePath, base = "HEAD") {
  const statResult = execGit(`diff ${base} --stat`, worktreePath);
  if (!statResult.success) return { success: false, error: statResult.error };
  const lines = statResult.stdout.split("\n");
  const filesChanged = [];
  for (const line of lines) {
    const match = line.match(/^\s*(.+?)\s+\|\s+(\d+)\s+/);
    if (match) filesChanged.push({ file: match[1].trim(), changes: parseInt(match[2], 10) });
  }
  const summaryLine = lines[lines.length - 1] || "";
  const insertMatch = summaryLine.match(/(\d+) insertion/);
  const deleteMatch = summaryLine.match(/(\d+) deletion/);
  return {
    success: true,
    filesChanged,
    insertions: insertMatch ? parseInt(insertMatch[1], 10) : 0,
    deletions: deleteMatch ? parseInt(deleteMatch[1], 10) : 0,
    totalFiles: filesChanged.length,
    raw: statResult.stdout
  };
}

function getCommitLog(worktreePath, count = 10) {
  const result = execGit(`log --oneline -${count}`, worktreePath);
  if (!result.success) return [];
  return result.stdout.split("\n").filter(Boolean).map((line) => {
    const [hash, ...rest] = line.split(" ");
    return { hash, message: rest.join(" ") };
  });
}

module.exports = { generateDiff, generateDiffSummary, getCommitLog };
