const assert = require("assert");
const { understandGoal } = require("./goalEngine");
const { Mother } = require("./mother");

(async () => {
  console.log("=== STEP 4: READ-ONLY VS WRITE GOVERNANCE MATRIX REGRESSION SUITE ===\n");

  // CASE A
  const promptA = "Inspect the repository and report its executable capabilities. Do not modify any file.";
  const goalA = understandGoal(promptA);
  assert.strictEqual(goalA.actionType, "analysis");
  assert.strictEqual(goalA.intent, "read_only_audit");
  const motherA = new Mother();
  const outcomeA = await motherA.runMissionToCompletion(promptA, { founderApproved: true, maxCycles: 1 });
  assert.strictEqual(outcomeA.status, "MISSION_COMPLETED");
  console.log("✔ CASE A Passed: READ_ONLY / NO WRITE APPROVAL (status: MISSION_COMPLETED)");

  // CASE B
  const promptB = "Audit the Revenue Engine implementation without changing files.";
  const goalB = understandGoal(promptB);
  assert.strictEqual(goalB.actionType, "analysis");
  assert.strictEqual(goalB.intent, "read_only_audit");
  const motherB = new Mother();
  const outcomeB = await motherB.runMissionToCompletion(promptB, { founderApproved: true, maxCycles: 1 });
  assert.strictEqual(outcomeB.status, "MISSION_COMPLETED");
  console.log("✔ CASE B Passed: READ_ONLY / NO WRITE APPROVAL (status: MISSION_COMPLETED)");

  // CASE C
  const promptC = "Inspect src/services and explain what is implemented. Do not create, delete, commit, or push anything.";
  const goalC = understandGoal(promptC);
  assert.strictEqual(goalC.actionType, "analysis");
  assert.strictEqual(goalC.intent, "read_only_audit");
  const motherC = new Mother();
  const outcomeC = await motherC.runMissionToCompletion(promptC, { founderApproved: true, maxCycles: 1 });
  assert.strictEqual(outcomeC.status, "MISSION_COMPLETED");
  console.log("✔ CASE C Passed: READ_ONLY / NO WRITE APPROVAL (status: MISSION_COMPLETED)");

  // CASE D
  const promptD = "Modify the repository to repair the Revenue Engine.";
  const goalD = understandGoal(promptD);
  assert.strictEqual(goalD.actionType, "modification");
  const motherD = new Mother();
  const outcomeD = await motherD.runMissionToCompletion(promptD, { founderApproved: false, maxCycles: 1 });
  assert.strictEqual(outcomeD.status, "FOUNDER_ACTION_REQUIRED");
  console.log("✔ CASE D Passed: WRITE / FOUNDER APPROVAL REQUIRED (status: FOUNDER_ACTION_REQUIRED)");

  // CASE E
  const promptE = "Create a new revenue worker and commit it.";
  const goalE = understandGoal(promptE);
  assert.strictEqual(goalE.actionType, "creation");
  const motherE = new Mother();
  const outcomeE = await motherE.runMissionToCompletion(promptE, { founderApproved: false, maxCycles: 1 });
  assert.strictEqual(outcomeE.status, "FOUNDER_ACTION_REQUIRED");
  console.log("✔ CASE E Passed: WRITE / FOUNDER APPROVAL REQUIRED (status: FOUNDER_ACTION_REQUIRED)");

  // CASE F
  const promptF = "Inspect the repository and then fix the problems you find.";
  const goalF = understandGoal(promptF);
  assert.ok(goalF.actionType === "modification" || goalF.actionType === "creation");
  const motherF = new Mother();
  const outcomeF = await motherF.runMissionToCompletion(promptF, { founderApproved: false, maxCycles: 1 });
  assert.strictEqual(outcomeF.status, "FOUNDER_ACTION_REQUIRED");
  console.log("✔ CASE F Passed: WRITE/MIXED / FOUNDER APPROVAL REQUIRED (status: FOUNDER_ACTION_REQUIRED)");

  console.log("\nALL READ-ONLY VS WRITE GOVERNANCE MATRIX TESTS PASSED CLEANLY!");
})();
