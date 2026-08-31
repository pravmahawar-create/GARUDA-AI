const fs = require("fs");
const path = require("path");

const IGNORED_DIRS = new Set([
  "node_modules", ".git", "dist", "build", ".next",
  "coverage", ".cache", "tmp", "temp"
]);

const SOURCE_EXTENSIONS = new Set([".js", ".jsx", ".ts", ".tsx", ".mjs"]);
const TEST_EXTENSIONS = new Set([".test.js", ".test.jsx", ".test.ts", ".test.tsx", ".spec.js", ".spec.jsx"]);
const CONFIG_EXTENSIONS = new Set([".json", ".yaml", ".yml", ".toml", ".env", ".env.example"]);
const DOC_EXTENSIONS = new Set([".md", ".txt", ".rst"]);
const DATA_EXTENSIONS = new Set([".jsonl", ".csv"]);

function categorizeFile(filePath) {
  const basename = path.basename(filePath);
  const ext = path.extname(filePath);

  if (TEST_EXTENSIONS.has(basename) || basename.includes(".test.") || basename.includes(".spec.")) {
    return "test";
  }
  if (filePath.includes("test") && ext === ".js") {
    return "test";
  }
  if (CONFIG_EXTENSIONS.has(ext)) {
    return "config";
  }
  if (basename === ".env" || basename.startsWith(".env.")) {
    return "config";
  }
  if (basename === "Dockerfile" || basename === "docker-compose.yml" || basename === "Makefile") {
    return "config";
  }
  if (DOC_EXTENSIONS.has(ext)) {
    return "doc";
  }
  if (DATA_EXTENSIONS.has(ext)) {
    return "data";
  }
  if (filePath.includes("dist/") || filePath.includes("build/") || filePath.includes(".next/")) {
    return "build";
  }
  if (SOURCE_EXTENSIONS.has(ext)) {
    return "source";
  }
  return "unknown";
}

function countLines(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    return content.split("\n").length;
  } catch {
    return 0;
  }
}

function walk(dir, root, files = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir);
  } catch {
    return files;
  }
  for (const entry of entries) {
    if (IGNORED_DIRS.has(entry)) continue;
    if (entry.startsWith(".")) continue;
    const fullPath = path.join(dir, entry);
    let stat;
    try {
      stat = fs.statSync(fullPath);
    } catch {
      continue;
    }
    if (stat.isDirectory()) {
      walk(fullPath, root, files);
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

function buildFileGraph(root = process.cwd()) {
  const absoluteFiles = walk(root, root);
  const files = absoluteFiles.map((absolutePath) => {
    const relativePath = path.relative(root, absolutePath).replace(/\\/g, "/");
    const ext = path.extname(relativePath);
    return {
      path: relativePath,
      absolutePath,
      extension: ext,
      category: categorizeFile(relativePath),
      lines: countLines(absolutePath),
      size: (() => {
        try { return fs.statSync(absolutePath).size; } catch { return 0; }
      })()
    };
  });

  const byCategory = {};
  for (const file of files) {
    byCategory[file.category] = (byCategory[file.category] || 0) + 1;
  }

  return {
    scannedAt: new Date().toISOString(),
    root,
    totalFiles: files.length,
    byCategory,
    files
  };
}

module.exports = { buildFileGraph, categorizeFile, IGNORED_DIRS };
