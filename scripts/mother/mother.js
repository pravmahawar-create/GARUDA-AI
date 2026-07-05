const { scan } = require("./scanner");
const { plan } = require("./planner");
const { build } = require("./builder");
const { validate } = require("./validator");
const { report } = require("./reporter");
const { think } = require("./thinker");

class Mother {
  start() {
    console.log("🦅 GARUDA Mother Started\n");

    const scanResult = scan();

   const decisions = think({
  projectClean: scanResult.clean,
  buildRequired: true,
  validateRequired: true
});

    plan(decisions);

    build();

    validate();

    report();

    console.log("\n🦅 GARUDA Mother Finished");
  }
}

new Mother().start();