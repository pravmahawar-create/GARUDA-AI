const { scan } = require("./scanner");
const { think } = require("./thinker");
const { decide } = require("./decision");
const { plan } = require("./planner");
const { execute } = require("./executor");
const { build } = require("./builder");
const { validate } = require("./validator");
const { report } = require("./reporter");
const { loadConstitution } = require("./constitution");
const { getContext } = require("./context");

const { understandGoal } = require("./goalEngine");
const { decompose } = require("./taskDecomposer");
const { prioritize } = require("./priorityEngine");

class Mother {
  start() {
    console.log("🦅 GARUDA Mother Started\n");

    const constitution = loadConstitution();
    const context = getContext();

    console.log("[Constitution]", constitution.laws.length + " laws loaded");
    console.log("[Context]", context.platform, context.node);

    const goal = understandGoal("make mother brain more autonomous");
    const tasks = prioritize(decompose(goal));

    console.log("[Goal]", goal);
    console.log("[Tasks]", tasks);

    const scanResult = scan();

    const decisions = think({
      projectClean: scanResult.clean,
      summary: scanResult.summary,
      buildRequired: true,
      validateRequired: true,
      tasks
    });

    const executionPlan = decide(scanResult, decisions);
    const plannedTasks = plan(executionPlan);

    const preflight = validate(plannedTasks);
    const cycle = {
      goal,
      context,
      scanResult,
      decisions,
      executionPlan,
      plannedTasks,
      validation: preflight,
      executedTasks: [],
      governance: {
        status: preflight.passed ? "ready" : "blocked_by_validation"
      },
      nextAction: preflight.passed
        ? "continue_safe_execution"
        : "fix_validation_issues"
    };

    if (preflight.passed) {
      cycle.executedTasks = execute(plannedTasks);
      cycle.validation = validate(cycle.executedTasks);
      cycle.governance.status = cycle.executedTasks.some((task) => task.status === "BLOCKED_BY_APPROVAL")
        ? "approval_required"
        : "approved_for_safe_execution";

      build();
    }

    report(cycle);

    console.log("\n🦅 GARUDA Mother Finished");
  }
}

new Mother().start();



