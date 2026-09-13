/**
 * GARUDA Self-Analytics Service
 *
 * GARUDA apna kaam analyze karta hai:
 * - Kitna kaam kiya
 * - Kitna effective raha
 * - Kya gadbad hui
 * - Kya improve kar sakta hai
 */

const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "..", "data");
const ANALYTICS_LOG = path.join(DATA_DIR, "self-analytics.json");

// ──────────────────────────────────────────────────────────────────────────────
// 1. TRACK ACTIVITY — What GARUDA did
// ──────────────────────────────────────────────────────────────────────────────

function trackActivity({ action, target, result, duration, error }) {
  const log = loadLog();
  log.push({
    id: `act_${Date.now()}`,
    action,
    target,
    result,
    duration,
    error: error || null,
    timestamp: new Date().toISOString()
  });
  // Keep last 500 entries
  if (log.length > 500) log.splice(0, log.length - 500);
  saveLog(log);
}

function loadLog() {
  try {
    if (!fs.existsSync(ANALYTICS_LOG)) return [];
    return JSON.parse(fs.readFileSync(ANALYTICS_LOG, "utf8"));
  } catch {
    return [];
  }
}

function saveLog(log) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(ANALYTICS_LOG, JSON.stringify(log, null, 2));
}

// ──────────────────────────────────────────────────────────────────────────────
// 2. PRODUCTIVITY ANALYSIS — How much GARUDA accomplished
// ──────────────────────────────────────────────────────────────────────────────

function analyzeProductivity() {
  const log = loadLog();
  const now = Date.now();

  const last24h = log.filter(e => now - new Date(e.timestamp).getTime() < 86400000);
  const last7d = log.filter(e => now - new Date(e.timestamp).getTime() < 604800000);

  const successRate = log.length > 0
    ? ((log.filter(e => e.result === "success").length / log.length) * 100).toFixed(1)
    : 0;

  const errorRate = log.length > 0
    ? ((log.filter(e => e.error).length / log.length) * 100).toFixed(1)
    : 0;

  // Action breakdown
  const actionCounts = {};
  for (const e of log) {
    actionCounts[e.action] = (actionCounts[e.action] || 0) + 1;
  }

  // Most active hours
  const hourCounts = {};
  for (const e of log) {
    const hour = new Date(e.timestamp).getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  }

  return {
    totalActions: log.length,
    last24h: last24h.length,
    last7d: last7d.length,
    successRate: `${successRate}%`,
    errorRate: `${errorRate}%`,
    actionBreakdown: actionCounts,
    peakHours: hourCounts,
    avgActionsPerDay: last7d.length > 0 ? (last7d.length / 7).toFixed(1) : 0
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// 3. EFFECTIVENESS ANALYSIS — What worked, what didn't
// ──────────────────────────────────────────────────────────────────────────────

function analyzeEffectiveness() {
  const log = loadLog();

  // Group by action type
  const byAction = {};
  for (const e of log) {
    if (!byAction[e.action]) byAction[e.action] = { total: 0, success: 0, failed: 0 };
    byAction[e.action].total++;
    if (e.result === "success") byAction[e.action].success++;
    else byAction[e.action].failed++;
  }

  // Calculate success rates
  for (const [action, data] of Object.entries(byAction)) {
    data.successRate = data.total > 0 ? ((data.success / data.total) * 100).toFixed(1) : 0;
  }

  // Find most/least effective
  const sorted = Object.entries(byAction).sort((a, b) => parseFloat(b[1].successRate) - parseFloat(a[1].successRate));
  const mostEffective = sorted[0];
  const leastEffective = sorted[sorted.length - 1];

  return {
    byAction,
    mostEffective: mostEffective ? { action: mostEffective[0], ...mostEffective[1] } : null,
    leastEffective: leastEffective ? { action: leastEffective[0], ...leastEffective[1] } : null
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// 4. HEALTH CHECK — Is GARUDA functioning well?
// ──────────────────────────────────────────────────────────────────────────────

function healthCheck() {
  const log = loadLog();
  const now = Date.now();

  const last1h = log.filter(e => now - new Date(e.timestamp).getTime() < 3600000);
  const last24h = log.filter(e => now - new Date(e.timestamp).getTime() < 86400000);
  const errors = last24h.filter(e => e.error);

  const issues = [];

  if (last1h.length === 0 && last24h.length > 0) {
    issues.push({ severity: "WARNING", message: "No activity in last hour — GARUDA might be idle" });
  }

  if (errors.length > 5) {
    issues.push({ severity: "CRITICAL", message: `${errors.length} errors in last 24h — needs attention` });
  }

  const errorRate = last24h.length > 0 ? (errors.length / last24h.length) * 100 : 0;
  if (errorRate > 20) {
    issues.push({ severity: "CRITICAL", message: `Error rate: ${errorRate.toFixed(1)}% — something is broken` });
  }

  // Check for repeated errors
  const errorMessages = errors.map(e => e.error).filter(Boolean);
  const errorCounts = {};
  for (const msg of errorMessages) {
    const short = msg.slice(0, 50);
    errorCounts[short] = (errorCounts[short] || 0) + 1;
  }
  for (const [msg, count] of Object.entries(errorCounts)) {
    if (count >= 3) {
      issues.push({ severity: "WARNING", message: `Repeated error (${count}x): ${msg}` });
    }
  }

  return {
    status: issues.length === 0 ? "HEALTHY" : issues.some(i => i.severity === "CRITICAL") ? "CRITICAL" : "DEGRADED",
    issues,
    lastActivity: log.length > 0 ? log[log.length - 1].timestamp : null,
    uptime: log.length > 0 ? `${((now - new Date(log[0].timestamp).getTime()) / 3600000).toFixed(1)}h` : "N/A"
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// 5. DASHBOARD — Everything in one view
// ──────────────────────────────────────────────────────────────────────────────

function getDashboard() {
  return {
    productivity: analyzeProductivity(),
    effectiveness: analyzeEffectiveness(),
    health: healthCheck(),
    generatedAt: new Date().toISOString()
  };
}

module.exports = {
  trackActivity,
  analyzeProductivity,
  analyzeEffectiveness,
  healthCheck,
  getDashboard
};
