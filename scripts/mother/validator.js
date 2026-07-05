const { execSync } = require("child_process");

function validate() {
  console.log("[Validator] Starting...");

  try {
    execSync("node -c scripts/build-garuda.js", {
      stdio: "inherit"
    });

    console.log("[Validator] Validation passed.");
  } catch {
    console.log("[Validator] Validation failed.");
  }
}

module.exports = { validate };