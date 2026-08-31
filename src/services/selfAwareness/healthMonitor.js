const fs = require("fs");
const path = require("path");
const os = require("os");

function getSystemHealth() {
  return {
    timestamp: new Date().toISOString(),
    disk: getDiskHealth(),
    memory: getMemoryHealth(),
    process: getProcessHealth(),
    uptime: getUptimeHealth()
  };
}

function getDiskHealth() {
  try {
    const stats = fs.statfsSync(process.cwd());
    const totalBytes = stats.blocks * stats.bsize;
    const freeBytes = stats.bfree * stats.bsize;
    const usedBytes = totalBytes - freeBytes;
    return {
      totalGB: (totalBytes / (1024 ** 3)).toFixed(2),
      usedGB: (usedBytes / (1024 ** 3)).toFixed(2),
      freeGB: (freeBytes / (1024 ** 3)).toFixed(2),
      usagePercent: ((usedBytes / totalBytes) * 100).toFixed(1),
      status: (usedBytes / totalBytes) > 0.9 ? "critical" : (usedBytes / totalBytes) > 0.7 ? "warning" : "healthy"
    };
  } catch {
    return { status: "unknown", error: "Could not read disk" };
  }
}

function getMemoryHealth() {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  return {
    totalGB: (totalMem / (1024 ** 3)).toFixed(2),
    usedGB: (usedMem / (1024 ** 3)).toFixed(2),
    freeGB: (freeMem / (1024 ** 3)).toFixed(2),
    usagePercent: ((usedMem / totalMem) * 100).toFixed(1),
    status: (usedMem / totalMem) > 0.9 ? "critical" : (usedMem / totalMem) > 0.7 ? "warning" : "healthy"
  };
}

function getProcessHealth() {
  const memUsage = process.memoryUsage();
  return {
    pid: process.pid,
    rssMB: (memUsage.rss / (1024 ** 2)).toFixed(2),
    heapUsedMB: (memUsage.heapUsed / (1024 ** 2)).toFixed(2),
    heapTotalMB: (memUsage.heapTotal / (1024 ** 2)).toFixed(2),
    externalMB: (memUsage.external / (1024 ** 2)).toFixed(2),
    status: memUsage.heapUsed > 500 * 1024 * 1024 ? "warning" : "healthy"
  };
}

function getUptimeHealth() {
  return {
    systemUptimeSeconds: os.uptime(),
    processUptimeSeconds: process.uptime(),
    platform: os.platform(),
    arch: os.arch(),
    nodeVersion: process.version
  };
}

function checkHealth() {
  const health = getSystemHealth();
  const issues = [];
  if (health.disk.status === "critical") issues.push("Disk usage critical");
  if (health.memory.status === "critical") issues.push("Memory usage critical");
  if (health.process.status === "warning") issues.push("Process heap high");
  return { ...health, issues, overallStatus: issues.length > 0 ? (issues.some((i) => i.includes("critical")) ? "critical" : "warning") : "healthy" };
}

module.exports = { getSystemHealth, getDiskHealth, getMemoryHealth, getProcessHealth, getUptimeHealth, checkHealth };
