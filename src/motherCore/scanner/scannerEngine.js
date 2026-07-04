const fs = require("fs");
const path = require("path");

const IGNORED_DIRS = new Set(["node_modules", ".git", "dist", "build", ".next"]);

function walk(dir, root, files = []) {
  for (const item of fs.readdirSync(dir)) {
    if (IGNORED_DIRS.has(item)) continue;
    const full = path.join(dir, item);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full, root, files);
    else files.push(path.relative(root, full).replace(/\\/g, "/"));
  }
  return files;
}

function scanRepository(root = process.cwd()) {
  const files = walk(root, root);
  const required = [
    "GARUDA_CONSTITUTION.md",
    "GARUDA_ROADMAP.md",
    "GARUDA_AGENT_MANIFEST.json",
    "scripts/garuda-mother-build.js",
    "scripts/garuda-agent.js",
    "src/motherCore/scanner/scannerEngine.js",
    "src/motherCore/tasks/taskQueueEngine.js",
    "src/motherCore/agents/plannerAgent.js",
    "src/motherCore/agents/builderAgent.js",
    "src/motherCore/testing/testingAgent.js",
    "src/motherCore/memory/projectMemory.js"
  ];

  const findings = required
    .filter(file => !fs.existsSync(path.join(root, file)))
    .map(file => ({
      severity: "high",
      type: "missing_required_file",
      file,
      message: file + " missing hai."
    }));

  return {
    engine: "GARUDA Scanner Engine v2",
    scannedAt: new Date().toISOString(),
    summary: {
      totalFiles: files.length,
      jsFiles: files.filter(f => f.endsWith(".js")).length,
      jsonFiles: files.filter(f => f.endsWith(".json")).length,
      mdFiles: files.filter(f => f.endsWith(".md")).length,
      findings: findings.length
    },
    required: required.map(file => ({
      file,
      exists: fs.existsSync(path.join(root, file))
    })),
    findings
  };
}

module.exports = { scanRepository };
