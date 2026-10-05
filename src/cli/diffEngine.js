/**
 * 🦅 GARUDA CLI — COLORED UNIFIED DIFF ENGINE
 * 
 * Computes unified diffs between file revisions, tracks line metrics (+N / -M),
 * formats clean ANSI terminal renderings, and logs cryptographic SHA-256 evidence.
 */

const crypto = require("crypto");

// ANSI Terminal Colors
const C = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  gold: "\x1b[38;5;220m",
  gray: "\x1b[90m"
};

/**
 * Computes SHA-256 hex digest of a string or buffer.
 */
function computeSha256(content) {
  if (content === null || content === undefined) return null;
  return crypto.createHash("sha256").update(Buffer.from(content)).digest("hex");
}

/**
 * Basic binary detection heuristic (detects null bytes or non-text content).
 */
function isBinary(bufferOrString) {
  if (!bufferOrString) return false;
  const buf = Buffer.isBuffer(bufferOrString) ? bufferOrString : Buffer.from(bufferOrString);
  const sample = buf.slice(0, 1024);
  for (let i = 0; i < sample.length; i++) {
    if (sample[i] === 0) return true; // Null byte indicates binary
  }
  return false;
}

/**
 * Computes Longest Common Subsequence line diff.
 */
function computeLineDiff(oldLines, newLines) {
  const m = oldLines.length;
  const n = newLines.length;

  // Build DP table for line diff
  const dp = Array.from({ length: m + 1 }, () => new Uint16Array(n + 1));
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (oldLines[i] === newLines[j]) {
        dp[i + 1][j + 1] = dp[i][j] + 1;
      } else {
        dp[i + 1][j + 1] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  // Backtrack to build diff ops
  let i = m;
  let j = n;
  const rawDiff = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      rawDiff.push({ type: "same", line: oldLines[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      rawDiff.push({ type: "add", line: newLines[j - 1] });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      rawDiff.push({ type: "del", line: oldLines[i - 1] });
      i--;
    }
  }

  return rawDiff.reverse();
}

/**
 * Generates unified diff structure.
 */
function generateUnifiedDiff(oldContent, newContent, filePath, options = {}) {
  const oldSha256 = computeSha256(oldContent);
  const newSha256 = computeSha256(newContent);

  if (isBinary(oldContent) || isBinary(newContent)) {
    return {
      filePath,
      isBinary: true,
      oldSha256,
      newSha256,
      additions: 0,
      deletions: 0,
      lines: []
    };
  }

  const oldLines = (oldContent || "").split("\n");
  const newLines = (newContent || "").split("\n");

  const diffItems = computeLineDiff(oldLines, newLines);

  let additions = 0;
  let deletions = 0;

  for (const item of diffItems) {
    if (item.type === "add") additions++;
    if (item.type === "del") deletions++;
  }

  return {
    filePath,
    isBinary: false,
    oldSha256,
    newSha256,
    additions,
    deletions,
    lines: diffItems
  };
}

/**
 * Renders unified diff to ANSI-colored terminal string.
 */
function renderTerminalDiff(diff, maxDisplayLines = 60) {
  if (!diff) return "";

  if (diff.isBinary) {
    return [
      `\x1b[33m📝 BINARY FILE MODIFIED: ${diff.filePath}\x1b[0m`,
      `  Before: ${diff.oldSha256}`,
      `  After:  ${diff.newSha256}`
    ].join("\n");
  }

  if (diff.additions === 0 && diff.deletions === 0) {
    return `${C.gray}ℹ️ No changes made to ${diff.filePath} (Identical content)${C.reset}`;
  }

  const header = [
    `${C.bright}${C.gold}📝 FILE CHANGED:${C.reset} ${C.cyan}${diff.filePath}${C.reset}`,
    `  ${C.green}+${diff.additions} additions${C.reset}  |  ${C.red}-${diff.deletions} deletions${C.reset}`,
    `  ${C.gray}SHA-256 (before): ${diff.oldSha256}${C.reset}`,
    `  ${C.gray}SHA-256 (after):  ${diff.newSha256}${C.reset}`,
    `${C.dim}${"-".repeat(70)}${C.reset}`
  ];

  // Filter diff items: show additions, deletions and a few surrounding context lines
  const displayLines = [];
  const lines = diff.lines;

  for (let idx = 0; idx < lines.length; idx++) {
    const item = lines[idx];
    if (item.type === "add") {
      displayLines.push(`${C.green}+ ${item.line}${C.reset}`);
    } else if (item.type === "del") {
      displayLines.push(`${C.red}- ${item.line}${C.reset}`);
    } else {
      // Include context only if near an add/del
      const nearChange = 
        (lines[idx - 1] && lines[idx - 1].type !== "same") ||
        (lines[idx + 1] && lines[idx + 1].type !== "same");
      if (nearChange) {
        displayLines.push(`${C.gray}  ${item.line}${C.reset}`);
      }
    }

    if (displayLines.length >= maxDisplayLines) {
      displayLines.push(`${C.yellow}... [${lines.length - idx} lines omitted for terminal brevity] ...${C.reset}`);
      break;
    }
  }

  return [...header, ...displayLines].join("\n");
}

module.exports = {
  generateUnifiedDiff,
  renderTerminalDiff,
  computeSha256,
  isBinary
};
