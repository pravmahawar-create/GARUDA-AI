const { scan } = require("./scanner");
const { understandGoal } = require("./goalEngine");
const { decompose } = require("./taskDecomposer");
const { prioritize } = require("./priorityEngine");
const { think } = require("./thinker");
const { decide } = require("./decision");
const { plan } = require("./planner");
const { execute } = require("./executor");
const { build } = require("./builder");
const { validate } = require("./validator");
const { loadConstitution } = require("./constitution");

console.log("?? GARUDA AUTOPILOT MODE STARTED\n");

(async () => {
  const constitution = loadConstitution();
  console.log("[Constitution]", constitution.laws.length + " laws active");

  const goal = understandGoal("autonomously improve mother brain");
  const tasks = prioritize(decompose(goal));

  const scanResult = scan();

  const decisions = think({
    projectClean: scanResult.clean,
    summary: scanResult.summary,
    buildRequired: true,
    validateRequired: true,
    tasks,
    constitution
  });

  const executionPlan = decide(scanResult, decisions);
  const plannedTasks = plan(executionPlan);
  const executedTasks = await execute(plannedTasks);

  build();
  const validation = validate(executedTasks);

  console.log("\n[Autopilot Summary]");
  console.log("Goal:", goal.rawGoal);
  console.log("Tasks:", executedTasks.length);
  console.log("Validation:", validation.passed ? "PASSED" : "FAILED");
  console.log("Founder Approval:", "REQUIRED before commit/push");

  console.log("\n?? GARUDA AUTOPILOT MODE FINISHED");
})().catch((error) => {
  console.error("\n[Autopilot Fatal]", error);
  process.exitCode = 1;
});
