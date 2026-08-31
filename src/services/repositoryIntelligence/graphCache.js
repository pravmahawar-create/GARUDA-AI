const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const DEFAULT_CACHE_PATH = path.join(process.cwd(), "data", "repo-intel-graph.json");

function fileHash(filePath) {
  try {
    const content = fs.readFileSync(filePath);
    return crypto.createHash("sha256").update(content).digest("hex");
  } catch {
    return null;
  }
}

function loadCache(cachePath = DEFAULT_CACHE_PATH) {
  try {
    const raw = fs.readFileSync(cachePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveCache(graphData, cachePath = DEFAULT_CACHE_PATH) {
  const dir = path.dirname(cachePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(cachePath, JSON.stringify(graphData, null, 2), "utf8");
}

function buildFileHashes(files) {
  const hashes = {};
  for (const file of files) {
    const absolutePath = file.absolutePath || file.path;
    hashes[file.path] = fileHash(absolutePath);
  }
  return hashes;
}

function detectChangedFiles(oldHashes, newHashes) {
  const changed = [];
  const added = [];
  const removed = [];

  for (const [file, hash] of Object.entries(newHashes)) {
    if (!oldHashes[file]) {
      added.push(file);
    } else if (oldHashes[file] !== hash) {
      changed.push(file);
    }
  }

  for (const file of Object.keys(oldHashes)) {
    if (!newHashes[file]) {
      removed.push(file);
    }
  }

  return { changed, added, removed };
}

function isCacheFresh(cachePath = DEFAULT_CACHE_PATH, maxAgeMs = 300000) {
  try {
    const stat = fs.statSync(cachePath);
    const age = Date.now() - stat.mtimeMs;
    return age < maxAgeMs;
  } catch {
    return false;
  }
}

module.exports = { loadCache, saveCache, buildFileHashes, detectChangedFiles, isCacheFresh, fileHash };
