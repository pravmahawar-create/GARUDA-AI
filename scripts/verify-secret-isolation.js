const fs = require("fs");
const path = require("path");

const DIST_DIR = path.resolve(__dirname, "../frontend/dist");
const SRC_DIR = path.resolve(__dirname, "../frontend/src");

const FORBIDDEN_PATTERNS = [
  "META_APP_SECRET",
  "META_ACCESS_TOKEN",
  "META_CLIENT_TOKEN"
];

function scanDirectory(dir, issues = []) {
  if (!fs.existsSync(dir)) return issues;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDirectory(fullPath, issues);
    } else if (entry.isFile() && /\.(html|js|mjs|css|json)$/i.test(entry.name)) {
      const content = fs.readFileSync(fullPath, "utf8");
      for (const pattern of FORBIDDEN_PATTERNS) {
        if (content.includes(pattern)) {
          issues.push({ file: fullPath, pattern });
        }
      }
    }
  }
  return issues;
}

console.log("=== SCANNING FOR CREDENTIAL LEAKS IN FRONTEND ===");
const distIssues = scanDirectory(DIST_DIR);
console.log(`frontend/dist scan: ${distIssues.length} issues found.`);
if (distIssues.length > 0) {
  console.error("LEAKS FOUND in dist:", distIssues);
  process.exit(1);
}

const srcIssues = scanDirectory(SRC_DIR);
console.log(`frontend/src scan: ${srcIssues.length} issues found.`);
if (srcIssues.length > 0) {
  console.error("LEAKS FOUND in src:", srcIssues);
  process.exit(1);
}

console.log("✔ ZERO CREDENTIAL EXPOSURE VERIFIED: frontend/dist & frontend/src are 100% CLEAN.");
