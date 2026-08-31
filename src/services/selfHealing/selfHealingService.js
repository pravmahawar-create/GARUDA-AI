const fs = require("fs");
const path = require("path");
const os = require("os");

const HEALING_LOG = path.join(process.cwd(), "data", "self-healing", "healing-log.jsonl");

function ensureDir() {
  const dir = path.dirname(HEALING_LOG);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function checkDiskHealth() {
  try {
    const stats = fs.statfsSync(process.cwd());
    const totalGB = (stats.blocks * stats.bsize) / (1024 ** 3);
    const freeGB = (stats.bfree * stats.bsize) / (1024 ** 3);
    const usage = ((totalGB - freeGB) / totalGB) * 100;
    return { status: usage > 90 ? "critical" : usage > 75 ? "warning" : "healthy", usage: usage.toFixed(1), freeGB: freeGB.toFixed(2) };
  } catch { return { status: "unknown", error: "Cannot read disk" }; }
}

function checkMemoryHealth() {
  const total = os.totalmem();
  const free = os.freemem();
  const usage = ((total - free) / total) * 100;
  return { status: usage > 90 ? "critical" : usage > 75 ? "warning" : "healthy", usage: usage.toFixed(1), freeGB: (free / (1024 ** 3)).toFixed(2) };
}

function checkProcessHealth() {
  const mem = process.memoryUsage();
  const heapMB = mem.heapUsed / (1024 ** 2);
  return { status: heapMB > 500 ? "warning" : "healthy", heapMB: heapMB.toFixed(2), rssMB: (mem.rss / (1024 ** 2)).toFixed(2) };
}

function checkFileHealth(filePath) {
  if (!fs.existsSync(filePath)) return { status: "missing", path: filePath };
  try {
    const stat = fs.statSync(filePath);
    const content = fs.readFileSync(filePath, "utf8");
    return { status: "healthy", path: filePath, size: stat.size, lines: content.split("\n").length };
  } catch (err) {
    return { status: "corrupted", path: filePath, error: err.message };
  }
}

function diagnoseAll() {
  const disk = checkDiskHealth();
  const memory = checkMemoryHealth();
  const process_ = checkProcessHealth();
  const issues = [];

  if (disk.status !== "healthy") issues.push({ type: "disk", severity: disk.status, message: `Disk usage: ${disk.usage}%` });
  if (memory.status !== "healthy") issues.push({ type: "memory", severity: memory.status, message: `Memory usage: ${memory.usage}%` });
  if (process_.status !== "healthy") issues.push({ type: "process", severity: process_.status, message: `Heap: ${process_.heapMB}MB` });

  return { disk, memory, process: process_, issues, overallStatus: issues.some((i) => i.severity === "critical") ? "critical" : issues.some((i) => i.severity === "warning") ? "warning" : "healthy" };
}

function attemptHeal(issues) {
  const healed = [];
  for (const issue of issues) {
    if (issue.type === "process" && issue.severity === "warning") {
      if (global.gc) { global.gc(); healed.push({ type: issue.type, action: "gc", status: "done" }); }
      else healed.push({ type: issue.type, action: "gc", status: "unavailable", message: "gc not exposed" });
    }
    if (issue.type === "disk" && issue.severity === "critical") {
      const cleaned = cleanupTempFiles();
      healed.push({ type: issue.type, action: "cleanup", status: "done", filesRemoved: cleaned });
    }
  }
  return healed;
}

function cleanupTempFiles() {
  let count = 0;
  const tmpDir = path.join(process.cwd(), "data", "tmp");
  if (fs.existsSync(tmpDir)) {
    const files = fs.readdirSync(tmpDir);
    for (const f of files) {
      try { fs.unlinkSync(path.join(tmpDir, f)); count++; } catch {}
    }
  }
  const backupDir = path.join(process.cwd(), "data", "backups");
  if (fs.existsSync(backupDir)) {
    const files = fs.readdirSync(backupDir).sort();
    const toRemove = files.slice(0, Math.floor(files.length / 2));
    for (const f of toRemove) {
      try { fs.unlinkSync(path.join(backupDir, f)); count++; } catch {}
    }
  }
  return count;
}

function logHealing(action) {
  ensureDir();
  const entry = { timestamp: new Date().toISOString(), ...action };
  fs.appendFileSync(HEALING_LOG, JSON.stringify(entry) + "\n", "utf8");
  return entry;
}

function getHealingLog(limit = 50) {
  ensureDir();
  if (!fs.existsSync(HEALING_LOG)) return [];
  return fs.readFileSync(HEALING_LOG, "utf8").trim().split("\n").filter(Boolean).slice(-limit).map((line) => {
    try { return JSON.parse(line); } catch { return null; }
  }).filter(Boolean);
}

function heal() {
  const diagnosis = diagnoseAll();
  if (diagnosis.issues.length === 0) return { status: "no_issues", diagnosis };
  const healed = attemptHeal(diagnosis.issues);
  for (const h of healed) logHealing(h);
  return { status: "healed", diagnosis, healed };
}

function watchHealth(intervalMs = 30000) {
  const interval = setInterval(() => {
    const result = heal();
    if (result.status === "healed") console.log(`[HEAL] ${new Date().toISOString()} — healed ${result.healed.length} issues`);
  }, intervalMs);
  return { stop: () => clearInterval(interval) };
}

module.exports = { checkDiskHealth, checkMemoryHealth, checkProcessHealth, checkFileHealth, diagnoseAll, attemptHeal, cleanupTempFiles, logHealing, getHealingLog, heal, watchHealth };
