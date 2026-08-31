const fs = require("fs");
const path = require("path");

const IGNORED_DIRS = new Set(["node_modules", ".git", "dist", "build", ".next", "coverage", ".cache"]);
const TEST_PATTERNS = /\.(test|spec)\.(js|jsx|ts|tsx|mjs)$/i;

function walk(dir, root, depth = 0) {
  if (depth > 8) return [];
  let entries;
  try { entries = fs.readdirSync(dir); } catch { return []; }
  const results = [];
  for (const entry of entries) {
    if (IGNORED_DIRS.has(entry) || entry.startsWith(".")) continue;
    const full = path.join(dir, entry);
    let stat;
    try { stat = fs.statSync(full); } catch { continue; }
    if (stat.isDirectory()) {
      results.push(...walk(full, root, depth + 1));
    } else if (TEST_PATTERNS.test(entry)) {
      const relative = path.relative(root, full).replace(/\\/g, "/");
      results.push({
        path: relative,
        absolutePath: full,
        name: entry,
        size: stat.size,
        lastModified: stat.mtime.toISOString()
      });
    }
  }
  return results;
}

function scanTestFiles(root = process.cwd()) {
  const testFiles = walk(root, root);
  const byDirectory = {};
  for (const file of testFiles) {
    const dir = path.dirname(file.path);
    if (!byDirectory[dir]) byDirectory[dir] = [];
    byDirectory[dir].push(file);
  }
  return {
    scannedAt: new Date().toISOString(),
    root,
    totalTestFiles: testFiles.length,
    byDirectory,
    files: testFiles
  };
}

function findTestFileForSource(sourcePath, testFiles) {
  const sourceBase = path.basename(sourcePath).replace(/\.(js|jsx|ts|tsx)$/, "");
  const candidates = testFiles.filter((tf) => {
    const testBase = tf.name.replace(/\.(test|spec)\.(js|jsx|ts|tsx|mjs)$/, "");
    return testBase === sourceBase;
  });
  return candidates.map((c) => c.path);
}

module.exports = { scanTestFiles, findTestFileForSource, TEST_PATTERNS };
