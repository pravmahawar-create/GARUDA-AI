/**
 * 🦅 GARUDA MISSION INTELLIGENCE DASHBOARD TEST SUITE
 * 
 * Verifies mission tracking, workforce registration, dependency graphs,
 * failure recovery, result aggregation, and ASCII dashboard rendering.
 */

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { MissionDashboard } = require("../src/dashboard/missionDashboard");

async function runDashboardTests() {
  console.log("================================================================================");
  console.log("🦅 GARUDA MISSION INTELLIGENCE DASHBOARD TEST SUITE");
  console.log("Standard: 100% Anti-Fabrication Law — Real Functional Verification");
  console.log("================================================================================\n");

  const testDir = path.resolve(".garuda", "test-missions");
  const dashboard = new MissionDashboard({ storageDir: testDir });

  // 1. Mission Creation
  console.log("--- 1. MISSION CREATION ---");
  const mission = dashboard.createMission({
    objective: "Build Customer Analytics Module with Multi-Agent Team",
    teamSize: 5
  });
  assert(mission.missionId.startsWith("MISSION-"), "Mission ID should start with MISSION-");
  assert.strictEqual(mission.objective, "Build Customer Analytics Module with Multi-Agent Team");
  assert.strictEqual(mission.status, "INITIALIZED");
  console.log("  ✔ Mission created successfully:", mission.missionId);

  // 2. Agent Registration
  console.log("\n--- 2. AGENT REGISTRATION ---");
  const architect = dashboard.registerAgent(mission.missionId, { role: "ARCHITECT", model: "gemini-2.5-flash" });
  const engineer = dashboard.registerAgent(mission.missionId, { role: "ENGINEER", model: "gemini-2.5-flash" });
  const tester = dashboard.registerAgent(mission.missionId, { role: "TESTER", model: "gemini-2.5-flash" });
  const security = dashboard.registerAgent(mission.missionId, { role: "SECURITY_AGENT", model: "gemini-2.5-flash" });

  assert.strictEqual(mission.agents.length, 4, "Should have 4 registered agents");
  assert.strictEqual(architect.role, "ARCHITECT");
  assert.strictEqual(engineer.role, "ENGINEER");
  console.log("  ✔ 4 Agents registered cleanly");

  // 3. Task Assignment with Dependencies
  console.log("\n--- 3. TASK ASSIGNMENT & DEPENDENCY GRAPH ---");
  const t1 = dashboard.assignTask(mission.missionId, {
    taskId: "TASK-001",
    title: "Design Analytics Schema",
    role: "ARCHITECT",
    assignedAgentId: architect.agentId,
    dependencies: []
  });

  const t2 = dashboard.assignTask(mission.missionId, {
    taskId: "TASK-002",
    title: "Implement Analytics Service",
    role: "ENGINEER",
    assignedAgentId: engineer.agentId,
    dependencies: ["TASK-001"]
  });

  const t3 = dashboard.assignTask(mission.missionId, {
    taskId: "TASK-003",
    title: "Run Analytics Test Suite",
    role: "TESTER",
    assignedAgentId: tester.agentId,
    dependencies: ["TASK-002"]
  });

  assert.strictEqual(mission.tasks.length, 3);
  assert.deepStrictEqual(t2.dependencies, ["TASK-001"]);
  console.log("  ✔ 3 Dependent tasks assigned cleanly");

  // 4. Task Execution Lifecycle & Live Status
  console.log("\n--- 4. TASK LIFECYCLE & LIVE STATUS ---");
  dashboard.updateTaskStatus(mission.missionId, "TASK-001", "RUNNING");
  let status = dashboard.getMissionStatus(mission.missionId);
  assert.strictEqual(status.status, "RUNNING");
  assert.strictEqual(status.tasksRunning, 1);

  dashboard.updateTaskStatus(mission.missionId, "TASK-001", "COMPLETED", {
    output: "Analytics schema defined with UserMetrics and RevenueAggregates",
    durationMs: 450
  });

  dashboard.updateTaskStatus(mission.missionId, "TASK-002", "COMPLETED", {
    output: "Analytics service implemented in src/services/customerAnalytics.js",
    durationMs: 820
  });

  status = dashboard.getMissionStatus(mission.missionId);
  assert.strictEqual(status.tasksCompleted, 2);
  assert.strictEqual(status.percentComplete, 67);
  console.log("  ✔ Live status metrics verified (67% complete)");

  // 5. Deliberate Failure & Recovery (Section 8)
  console.log("\n--- 5. CONTROLLED FAILURE & RECOVERY ---");
  dashboard.updateTaskStatus(mission.missionId, "TASK-003", "FAILED", {
    error: "AssertionError: Expected metric 'churnRate' not found in calculation",
    durationMs: 310
  });

  status = dashboard.getMissionStatus(mission.missionId);
  assert.strictEqual(status.status, "FAILED");
  assert.strictEqual(status.tasksFailed, 1);
  console.log("  ✔ Controlled failure detected: status = FAILED");

  // Simulate recovery
  dashboard.updateTaskStatus(mission.missionId, "TASK-003", "RECOVERED", {
    output: "Corrective patch applied: churnRate metric added and verified with exit code 0",
    durationMs: 512
  });

  status = dashboard.getMissionStatus(mission.missionId);
  assert.strictEqual(status.status, "COMPLETED");
  assert.strictEqual(status.tasksCompleted, 3);
  assert.strictEqual(status.percentComplete, 100);
  console.log("  ✔ Recovery successful: status = COMPLETED (100% complete)");

  // 6. Result Aggregation
  console.log("\n--- 6. RESULT AGGREGATION ---");
  const deliverable = dashboard.aggregateResults(mission.missionId);
  assert.strictEqual(deliverable.verified, true);
  assert(deliverable.deliverables["TASK-001"], "Task 1 output should be aggregated");
  assert(deliverable.deliverables["TASK-002"], "Task 2 output should be aggregated");
  assert(deliverable.deliverables["TASK-003"], "Task 3 output should be aggregated");
  console.log("  ✔ Deliverables aggregated across all tasks");

  // 7. ASCII Dashboard Rendering
  console.log("\n--- 7. ASCII DASHBOARD RENDERING ---");
  const rendered = dashboard.renderAsciiDashboard(mission.missionId);
  assert(rendered.includes("GARUDA MISSION INTELLIGENCE DASHBOARD"));
  assert(rendered.includes("TASK-001"));
  assert(rendered.includes("100%"));
  console.log("Rendered Dashboard Preview:\n");
  console.log(rendered);

  // 8. Execution History
  console.log("\n--- 8. EXECUTION HISTORY ---");
  const history = dashboard.getExecutionHistory(5);
  assert(history.length >= 1, "Should have at least 1 mission in history");
  console.log("  ✔ Execution history lists:", history.length, "missions");

  console.log("\n================================================================================");
  console.log("✔ ALL MISSION INTELLIGENCE DASHBOARD TESTS PASSED CLEANLY!");
  console.log("================================================================================");

  // Cleanup test storage
  try {
    fs.rmSync(testDir, { recursive: true, force: true });
  } catch (_) {}
}

runDashboardTests().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
