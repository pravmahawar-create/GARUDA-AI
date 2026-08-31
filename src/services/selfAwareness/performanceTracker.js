const fs = require("fs");
const path = require("path");

const PERF_FILE = path.join(process.cwd(), "data", "self-awareness", "performance.jsonl");

function ensureDir() {
  const dir = path.dirname(PERF_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function recordMetric(input) {
  ensureDir();
  const metric = {
    timestamp: new Date().toISOString(),
    capability: input.capability || "unknown",
    action: input.action || "",
    success: input.success !== false,
    durationMs: typeof input.durationMs === "number" ? input.durationMs : 0,
    error: input.error || null,
    metadata: input.metadata || {}
  };
  fs.appendFileSync(PERF_FILE, JSON.stringify(metric) + "\n", "utf8");
  return metric;
}

function recordMetrics(metrics) {
  ensureDir();
  const results = metrics.map((m) => ({
    timestamp: new Date().toISOString(),
    capability: m.capability || "unknown",
    action: m.action || "",
    success: m.success !== false,
    durationMs: typeof m.durationMs === "number" ? m.durationMs : 0,
    error: m.error || null,
    metadata: m.metadata || {}
  }));
  const lines = results.map((r) => JSON.stringify(r)).join("\n") + "\n";
  fs.appendFileSync(PERF_FILE, lines, "utf8");
  return results;
}

function readMetrics(limit = 500) {
  ensureDir();
  if (!fs.existsSync(PERF_FILE)) return [];
  const content = fs.readFileSync(PERF_FILE, "utf8").trim();
  if (!content) return [];
  return content.split("\n").filter(Boolean).slice(-limit).map((line) => {
    try { return JSON.parse(line); } catch { return null; }
  }).filter(Boolean);
}

function getMetricsByCapability(capability) {
  return readMetrics(5000).filter((m) => m.capability === capability);
}

function getSuccessRate(capability) {
  const metrics = capability ? getMetricsByCapability(capability) : readMetrics(5000);
  if (metrics.length === 0) return null;
  const successes = metrics.filter((m) => m.success).length;
  return { total: metrics.length, successes, failures: metrics.length - successes, rate: successes / metrics.length };
}

function getAvgDuration(capability) {
  const metrics = capability ? getMetricsByCapability(capability) : readMetrics(5000);
  if (metrics.length === 0) return null;
  const total = metrics.reduce((sum, m) => sum + m.durationMs, 0);
  return { avg: total / metrics.length, min: Math.min(...metrics.map((m) => m.durationMs)), max: Math.max(...metrics.map((m) => m.durationMs)), count: metrics.length };
}

function getRecentErrors(count = 10) {
  return readMetrics(5000).filter((m) => !m.success && m.error).slice(-count);
}

function getPerformanceSummary() {
  const metrics = readMetrics(5000);
  if (metrics.length === 0) return { total: 0, successRate: null, avgDuration: null };

  const successes = metrics.filter((m) => m.success).length;
  const totalDuration = metrics.reduce((sum, m) => sum + m.durationMs, 0);
  const byCapability = {};

  for (const m of metrics) {
    if (!byCapability[m.capability]) byCapability[m.capability] = { total: 0, successes: 0 };
    byCapability[m.capability].total++;
    if (m.success) byCapability[m.capability].successes++;
  }

  return {
    total: metrics.length,
    successRate: successes / metrics.length,
    avgDuration: totalDuration / metrics.length,
    byCapability
  };
}

function clearMetrics() {
  ensureDir();
  if (fs.existsSync(PERF_FILE)) fs.writeFileSync(PERF_FILE, "", "utf8");
}

module.exports = {
  recordMetric, recordMetrics, readMetrics, getMetricsByCapability,
  getSuccessRate, getAvgDuration, getRecentErrors, getPerformanceSummary, clearMetrics
};
