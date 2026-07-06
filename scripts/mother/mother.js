const { scan } = require("./scanner");
const { think } = require("./thinker");
const { decide } = require("./decision");
const { plan } = require("./planner");
const { build } = require("./builder");
const { validate } = require("./validator");
const { report } = require("./reporter");
const { understandGoal } = require("./goalEngine");
const { decompose } = require("./taskDecomposer");

class Mother {
  start() {
    console.log("🦅 GARUDA Mother Started\n");

    // STEP 0 - Understand Founder Goal
    const goal = understandGoal("make mother brain more autonomous");
    const tasks = decompose(goal);

    console.log("[Goal]", goal);
    console.log("[Tasks]", tasks);

    // STEP 1 - Scan Project
    const scanResult = scan();

    // STEP 2 - Think
    const decisions = think({
      projectClean: scanResult.clean,
      buildRequired: true,
      validateRequired: true
    });

    // STEP 3 - Decide
    const executionPlan = decide(scanResult, decisions);

    // STEP 4 - Plan
    plan(executionPlan);

    // STEP 5 - Build
    build();

    // STEP 6 - Validate
    validate();

    // STEP 7 - Report
    report();

    console.log("\n🦅 GARUDA Mother Finished");
  }
}

new Mother().start();