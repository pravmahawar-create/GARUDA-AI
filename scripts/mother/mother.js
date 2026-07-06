const { scan } = require("./scanner");
const { think } = require("./thinker");
const { decide } = require("./decision");
const { plan } = require("./planner");
const { build } = require("./builder");
const { validate } = require("./validator");
const { report } = require("./reporter");

const { understandGoal } = require("./goalEngine");
const { decompose } = require("./taskDecomposer");
const { prioritize } = require("./priorityEngine");

class Mother {
  start() {
    console.log("🦅 GARUDA Mother Started\n");

    const goal = understandGoal("make mother brain more autonomous");
    const tasks = prioritize(decompose(goal));

    console.log("[Goal]", goal);
    console.log("[Tasks]", tasks);

    const scanResult = scan();

    const decisions = think({
      projectClean: scanResult.clean,
      buildRequired: true,
      validateRequired: true,
      tasks
    });

    const executionPlan = decide(scanResult, decisions);

    const plannedTasks = plan(executionPlan);

    build();

    validate(plannedTasks);

    report();

    console.log("\n🦅 GARUDA Mother Finished");
  }
}

new Mother().start();