const assert = require("assert");
const capMapper = require("./capabilityMapper");
const perfTracker = require("./performanceTracker");
const healthMonitor = require("./healthMonitor");
const service = require("./selfAwarenessService");

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    const result = fn();
    if (result && typeof result.then === "function") {
      return result.then(() => { passed++; console.log(`  ok  ${name}`); }).catch((err) => { failed++; console.log(`  xx  ${name}: ${err.message}`); });
    }
    passed++;
    console.log(`  ok  ${name}`);
  } catch (err) {
    failed++;
    console.log(`  xx  ${name}: ${err.message}`);
  }
}

function cleanup() {
  capMapper.clearCapabilities();
  perfTracker.clearMetrics();
}

async function main() {
  console.log("\n=== Self-Awareness Engine Tests ===\n");
  cleanup();

  console.log("--- Capability Mapper ---");
  await test("registerCapability adds capability", () => {
    const cap = capMapper.registerCapability({ id: "test-cap", name: "Test", category: "engineering", maturity: "production" });
    assert.strictEqual(cap.id, "test-cap");
    assert.strictEqual(cap.maturity, "production");
  });

  await test("getCapability returns by id", () => {
    const cap = capMapper.getCapability("test-cap");
    assert.ok(cap);
    assert.strictEqual(cap.name, "Test");
  });

  await test("listCapabilities returns all", () => {
    const caps = capMapper.listCapabilities();
    assert.ok(caps.length >= 1);
  });

  await test("getCapabilitiesByCategory filters", () => {
    capMapper.registerCapability({ id: "eng-1", name: "Eng", category: "engineering" });
    capMapper.registerCapability({ id: "self-1", name: "Self", category: "self-evolution" });
    const eng = capMapper.getCapabilitiesByCategory("engineering");
    assert.ok(eng.length >= 1);
    assert.ok(eng.every((c) => c.category === "engineering"));
  });

  await test("updateCapability updates fields", () => {
    capMapper.registerCapability({ id: "upd-cap", name: "Old" });
    capMapper.updateCapability("upd-cap", { name: "New" });
    const cap = capMapper.getCapability("upd-cap");
    assert.strictEqual(cap.name, "New");
  });

  await test("getCapabilitySummary counts", () => {
    const summary = capMapper.getCapabilitySummary();
    assert.ok(summary.total >= 1);
    assert.ok(summary.byCategory);
  });

  console.log("\n--- Performance Tracker ---");
  await test("recordMetric writes metric", () => {
    const m = perfTracker.recordMetric({ capability: "test-cap", action: "run", success: true, durationMs: 150 });
    assert.ok(m.timestamp);
    assert.strictEqual(m.success, true);
  });

  await test("recordMetrics writes multiple", () => {
    perfTracker.clearMetrics();
    const metrics = perfTracker.recordMetrics([
      { capability: "a", action: "run", success: true, durationMs: 100 },
      { capability: "a", action: "run", success: false, durationMs: 200, error: "fail" }
    ]);
    assert.strictEqual(metrics.length, 2);
  });

  await test("getSuccessRate calculates", () => {
    perfTracker.clearMetrics();
    perfTracker.recordMetrics([
      { capability: "x", success: true, durationMs: 10 },
      { capability: "x", success: true, durationMs: 10 },
      { capability: "x", success: false, durationMs: 10 }
    ]);
    const rate = perfTracker.getSuccessRate("x");
    assert.ok(rate);
    assert.strictEqual(rate.total, 3);
    assert.ok(Math.abs(rate.rate - 0.667) < 0.01);
  });

  await test("getAvgDuration calculates", () => {
    perfTracker.clearMetrics();
    perfTracker.recordMetrics([
      { capability: "y", success: true, durationMs: 100 },
      { capability: "y", success: true, durationMs: 200 }
    ]);
    const avg = perfTracker.getAvgDuration("y");
    assert.ok(avg);
    assert.strictEqual(avg.avg, 150);
  });

  await test("getRecentErrors returns errors", () => {
    perfTracker.clearMetrics();
    perfTracker.recordMetric({ capability: "z", success: false, durationMs: 10, error: "boom" });
    const errors = perfTracker.getRecentErrors(5);
    assert.ok(errors.length >= 1);
    assert.strictEqual(errors[0].error, "boom");
  });

  await test("getPerformanceSummary works", () => {
    perfTracker.clearMetrics();
    perfTracker.recordMetric({ capability: "sum", success: true, durationMs: 50 });
    const summary = perfTracker.getPerformanceSummary();
    assert.ok(summary.total >= 1);
    assert.ok(typeof summary.successRate === "number");
  });

  console.log("\n--- Health Monitor ---");
  await test("checkHealth returns health status", () => {
    const health = healthMonitor.checkHealth();
    assert.ok(health.disk);
    assert.ok(health.memory);
    assert.ok(health.process);
    assert.ok(health.uptime);
    assert.ok(health.overallStatus);
  });

  await test("getMemoryHealth returns memory info", () => {
    const mem = healthMonitor.getMemoryHealth();
    assert.ok(mem.totalGB);
    assert.ok(mem.usagePercent);
    assert.ok(["healthy", "warning", "critical"].includes(mem.status));
  });

  await test("getDiskHealth returns disk info", () => {
    const disk = healthMonitor.getDiskHealth();
    assert.ok(disk.totalGB);
    assert.ok(["healthy", "warning", "critical", "unknown"].includes(disk.status));
  });

  await test("getProcessHealth returns process info", () => {
    const proc = healthMonitor.getProcessHealth();
    assert.ok(proc.pid);
    assert.ok(proc.rssMB);
  });

  console.log("\n--- Service (Facade) ---");
  await test("initDefaults registers all capabilities", () => {
    const defaults = service.initDefaults();
    assert.strictEqual(defaults.length, 8);
    const caps = service.listCapabilities();
    assert.strictEqual(caps.length, 8);
  });

  await test("getStatus returns full status", () => {
    service.initDefaults();
    const status = service.getStatus();
    assert.ok(status.capabilities);
    assert.ok(status.performance);
    assert.ok(status.health);
  });

  await test("getSelfReport generates report", () => {
    service.initDefaults();
    const report = service.getSelfReport();
    assert.ok(report.strengths.length > 0);
    assert.ok(report.timestamp);
  });

  await test("recordCapabilityUse tracks usage", () => {
    service.initDefaults();
    service.recordCapabilityUse("repo-intel", true, 100);
    service.recordCapabilityUse("repo-intel", false, 200, "error");
    const perf = service.getPerformanceSummary();
    assert.ok(perf.total >= 2);
  });

  console.log("\n=== Summary ===");
  console.log(`  passed: ${passed}`);
  console.log(`  failed: ${failed}`);
  console.log(`  total:  ${passed + failed}\n`);

  cleanup();
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error("FATAL:", err);
  cleanup();
  process.exit(1);
});
