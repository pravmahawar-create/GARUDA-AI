/**
 * 🦅 GARUDA PAWAN ASTRA™ — FOUNDER DASHBOARD INTEGRATION TEST
 * 
 * Verifies Mission 5 Acceptance Criteria:
 * - Founder Command Center snapshot includes pawanAstra section.
 * - Subsystem availability matrix includes pawanAstra.
 * - Truthful token accounting is exposed without fabricated counts.
 * - Persistent memory and continuous learning metrics are visible.
 */

const test = require("node:test");
const assert = require("node:assert");
const founderCommandService = require("./founderCommandService");

test("GARUDA PAWAN ASTRA — Founder Dashboard Integration Suite", async (t) => {
  await t.test("1. CommandCenterSnapshot exposes pawanAstra subsystem telemetry", async () => {
    const snapshot = await founderCommandService.getCommandCenterSnapshot();

    assert.ok(snapshot, "Snapshot must exist");
    assert.ok(snapshot.subsystemAvailability, "subsystemAvailability must exist");
    assert.strictEqual(snapshot.subsystemAvailability.pawanAstra, true, "pawanAstra must be marked available in matrix");

    assert.ok(snapshot.pawanAstra, "pawanAstra section must exist");
    assert.strictEqual(snapshot.pawanAstra.available, true);
    assert.ok(["ONLINE_ACTIVE", "STANDBY"].includes(snapshot.pawanAstra.status));

    // Metrics validation
    assert.strictEqual(typeof snapshot.pawanAstra.totalExecutions, "number");
    assert.strictEqual(typeof snapshot.pawanAstra.successRate, "number");
    assert.strictEqual(typeof snapshot.pawanAstra.selfHealedExecutions, "number");

    // Token policy check (100% Anti-Fabrication Law)
    assert.ok(snapshot.pawanAstra.tokenMetrics, "tokenMetrics must exist");
    assert.strictEqual(snapshot.pawanAstra.tokenMetrics.accountingMethod, "VERIFIED_TRUTH_UNKNOWN_IF_OMITTED");

    // Memory and Learning metrics
    assert.ok(snapshot.pawanAstra.memory, "memory snapshot must exist");
    assert.strictEqual(typeof snapshot.pawanAstra.memory.persistentMemoriesCount, "number");
    assert.ok(snapshot.pawanAstra.learning, "learning metrics must exist");
    assert.strictEqual(typeof snapshot.pawanAstra.learning.totalLessons, "number");
  });
});
