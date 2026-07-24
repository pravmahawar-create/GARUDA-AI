const assert = require("assert");
const { routeTask } = require("../../scripts/mother/router");
const { loadMemory, saveMemory, getMemoryEngine } = require("../../scripts/mother/memory");
const { Mother } = require("../../scripts/mother/mother");

async function testSprint3AutonomySlice() {
  // 1. Dynamic Intent Router Accuracy Verification
  assert.strictEqual(routeTask("Discover revenue opportunities and client candidates"), "revenue");
  assert.strictEqual(routeTask("Build Node.js API Service & Backend Automation"), "builder");
  assert.strictEqual(routeTask("Execute Mother Brain autonomy check"), "mother");
  assert.strictEqual(routeTask("Retrieve knowledge base documents"), "knowledge");
  assert.strictEqual(routeTask("Run unit test suite"), "test");
  assert.strictEqual(routeTask("Validate project artifacts"), "validator");
  assert.strictEqual(routeTask("Commit changes to git repository"), "git");
  assert.strictEqual(routeTask("Apply patch to file"), "patch");

  // 2. Unified Governed ProjectMemoryEngine Integration Verification
  const engine = getMemoryEngine();
  assert.ok(engine);

  const testRecord = {
    goal: "Sprint 3 Governed Memory Integration Test Goal",
    selectedBrains: ["architect", "builder"],
    taskPlan: {
      dependencyOrder: ["t1", "t2"],
      tasks: [
        { id: "t1", title: "Setup Memory", workerType: "builder" },
        { id: "t2", title: "Verify Memory", workerType: "validator", dependencies: ["t1"] }
      ]
    },
    workflowStatus: "Completed (3/3)",
    validationStatus: "PASSED",
    approvalStatus: "APPROVED",
    completedAt: new Date().toISOString()
  };

  saveMemory({ records: [testRecord] });

  const loaded = loadMemory();
  assert.ok(Array.isArray(loaded.records));
  const found = loaded.records.find((r) => r.goal === testRecord.goal);
  assert.ok(found);
  assert.strictEqual(found.workflowStatus, "Completed (3/3)");

  // 3. Duplicate Execution Prevention Verification
  const matchResult = engine.findSimilarGoal(testRecord.goal);
  assert.ok(matchResult);
  assert.ok(matchResult.exactMatches.length > 0);
  assert.strictEqual(matchResult.exactMatches[0].workflowStatus, "Completed (3/3)");

  // 4. Mother Class Import Cleanliness Verification (No Top-Level Side-Effects)
  assert.ok(Mother);
  const motherInstance = new Mother();
  assert.ok(motherInstance);

  console.log("Sprint 3 Mother Brain Autonomy integration test passed.");
}

testSprint3AutonomySlice().catch((err) => {
  console.error("Sprint 3 integration test failed:", err);
  process.exit(1);
});
