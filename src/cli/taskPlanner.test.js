/**
 * 🦅 GARUDA CLI — COMPLEX TASK PLANNER UNIT TESTS (PART F)
 * 
 * Verifies:
 * - Decomposition into sequential & dependent jobs (TASK-001 to TASK-007)
 * - Strict prerequisite dependency sequencing
 * - Cascade blocking (downstream tasks block if an upstream prerequisite fails)
 * - Plan tree visual rendering
 */

const assert = require("assert");
const { ComplexTaskPlanner, PlannedTask } = require("./taskPlanner");
const { TaskContract } = require("./longContext");

console.log("\n=======================================================");
console.log("🦅 GARUDA CLI COMPLEX TASK PLANNER TEST MATRIX");
console.log("=======================================================\n");

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✔ ok  ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✖ FAIL ${name}:`, err.message);
    failed++;
  }
}

// 1. Task Decomposition
test("decomposes complex prompt into sequential dependent tasks", () => {
  const contract = new TaskContract({
    rawPrompt: "Inspect the billing app, find the invoice bug, diagnose root cause, patch the code, run test suite, build artifacts, verify SHA-256, and prepare report."
  });

  const planner = ComplexTaskPlanner.planFromContract(contract);
  assert.ok(planner.tasks.length >= 6);

  const t1 = planner.getTask("TASK-001");
  const t2 = planner.getTask("TASK-002");
  const t3 = planner.getTask("TASK-003");

  assert.strictEqual(t1.type, "inspect");
  assert.strictEqual(t1.dependencies.length, 0);

  assert.strictEqual(t2.type, "diagnose");
  assert.deepStrictEqual(t2.dependencies, ["TASK-001"]);

  assert.strictEqual(t3.type, "patch");
  assert.deepStrictEqual(t3.dependencies, ["TASK-002"]);
});

// 2. Dependency Execution Sequence
test("getNextExecutableTask honors prerequisite completion order", () => {
  const planner = new ComplexTaskPlanner();
  planner.addTask({ id: "TASK-001", title: "Step 1", dependencies: [] });
  planner.addTask({ id: "TASK-002", title: "Step 2", dependencies: ["TASK-001"] });

  // First executable task must be TASK-001
  const next1 = planner.getNextExecutableTask();
  assert.strictEqual(next1.id, "TASK-001");

  // Attempting to get next before completing TASK-001 should return TASK-001 again
  assert.strictEqual(planner.getNextExecutableTask().id, "TASK-001");

  // Complete TASK-001
  planner.markTaskComplete("TASK-001", "Output 1");

  // Now TASK-002 should become executable
  const next2 = planner.getNextExecutableTask();
  assert.strictEqual(next2.id, "TASK-002");
});

// 3. Cascade Blocking on Failure
test("automatically blocks downstream dependent tasks if prerequisite fails", () => {
  const planner = new ComplexTaskPlanner();
  planner.addTask({ id: "TASK-001", title: "Step 1", dependencies: [] });
  planner.addTask({ id: "TASK-002", title: "Step 2", dependencies: ["TASK-001"] });
  planner.addTask({ id: "TASK-003", title: "Step 3", dependencies: ["TASK-002"] });

  // Mark TASK-001 as failed
  planner.markTaskFailed("TASK-001", "Syntax error in build");

  assert.strictEqual(planner.getTask("TASK-001").status, "FAILED");
  assert.strictEqual(planner.getTask("TASK-002").status, "BLOCKED");

  // getNextExecutableTask should now detect cascade blocking and return null
  const next = planner.getNextExecutableTask();
  assert.strictEqual(next, null);
  assert.strictEqual(planner.getTask("TASK-003").status, "BLOCKED");
});

// 4. Plan Tree Rendering
test("renders structured plan tree with status icons", () => {
  const planner = new ComplexTaskPlanner();
  planner.addTask({ id: "TASK-001", title: "Inspect code", dependencies: [] });
  planner.addTask({ id: "TASK-002", title: "Run tests", dependencies: ["TASK-001"] });

  planner.markTaskComplete("TASK-001");

  const tree = planner.renderPlanTree();
  assert.ok(tree.includes("TASK-001: Inspect code"));
  assert.ok(tree.includes("[✔]"));
  assert.ok(tree.includes("[⏳]"));
  assert.ok(tree.includes("TASK-002: Run tests (Depends on: TASK-001)"));
});

console.log(`\n=======================================================`);
console.log(`TASK PLANNER SUITE SUMMARY: ${passed} passed, ${failed} failed (Total: ${passed + failed})`);
console.log(`=======================================================\n`);

if (failed > 0) process.exit(1);
