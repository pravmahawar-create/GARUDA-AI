const capMapper = require("./capabilityMapper");
const perfTracker = require("./performanceTracker");
const healthMonitor = require("./healthMonitor");

function initDefaults() {
  capMapper.clearCapabilities();
  const defaults = [
    { id: "repo-intel", name: "Repository Intelligence", category: "engineering", maturity: "production", testCount: 27 },
    { id: "safe-mod", name: "Safe File Modification", category: "engineering", maturity: "production", testCount: 19 },
    { id: "test-discovery", name: "Test Discovery", category: "engineering", maturity: "production", testCount: 14 },
    { id: "git-isolation", name: "Git Worktree Isolation", category: "engineering", maturity: "production", testCount: 16 },
    { id: "code-review", name: "Semantic Code Review", category: "engineering", maturity: "production", testCount: 17 },
    { id: "goal-engine", name: "Autonomous Goal Engine", category: "engineering", maturity: "production", testCount: 23 },
    { id: "persistent-memory", name: "Persistent Memory", category: "self-evolution", maturity: "production", testCount: 20 },
    { id: "adaptive-router", name: "Adaptive Model Router", category: "self-evolution", maturity: "production", testCount: 24 }
  ];
  for (const cap of defaults) capMapper.registerCapability(cap);
  return defaults;
}

function getStatus() {
  const caps = capMapper.getCapabilitySummary();
  const perf = perfTracker.getPerformanceSummary();
  const health = healthMonitor.checkHealth();
  return { capabilities: caps, performance: perf, health, timestamp: new Date().toISOString() };
}

function getSelfReport() {
  const status = getStatus();
  const strengths = [];
  const weaknesses = [];
  const recommendations = [];

  for (const [cat, count] of Object.entries(status.capabilities.byCategory || {})) {
    strengths.push(`${cat}: ${count} capabilities`);
  }

  if (status.performance.total === 0) {
    weaknesses.push("No performance data yet");
    recommendations.push("Start recording metrics to track performance");
  } else if (status.performance.successRate < 0.8) {
    weaknesses.push(`Low success rate: ${(status.performance.successRate * 100).toFixed(1)}%`);
    recommendations.push("Investigate failing operations");
  }

  if (status.health.issues.length > 0) {
    weaknesses.push(...status.health.issues);
    recommendations.push("Address health issues");
  }

  return { status, strengths, weaknesses, recommendations, timestamp: new Date().toISOString() };
}

function recordCapabilityUse(capId, success, durationMs, error = null) {
  perfTracker.recordMetric({ capability: capId, action: "use", success, durationMs, error });
  const cap = capMapper.getCapability(capId);
  if (cap) {
    const metrics = perfTracker.getMetricsByCapability(capId);
    const successes = metrics.filter((m) => m.success).length;
    capMapper.updateCapability(capId, {
      lastUsed: new Date().toISOString(),
      successRate: metrics.length > 0 ? successes / metrics.length : null,
      testCount: metrics.length
    });
  }
}

module.exports = {
  initDefaults, getStatus, getSelfReport, recordCapabilityUse,
  registerCapability: capMapper.registerCapability,
  getCapability: capMapper.getCapability,
  listCapabilities: capMapper.listCapabilities,
  getCapabilitySummary: capMapper.getCapabilitySummary,
  recordMetric: perfTracker.recordMetric,
  getPerformanceSummary: perfTracker.getPerformanceSummary,
  checkHealth: healthMonitor.checkHealth,
  getSystemHealth: healthMonitor.getSystemHealth
};
