const { execSync } = require("child_process");
const { evaluateConstitutionGate } = require("./constitution");

function build() {
  console.log("[Builder] Starting...");

  const constitutionGate = evaluateConstitutionGate("builder");
  if (!constitutionGate.allowed) {
    console.log("[Builder] BLOCKED_BY_CONSTITUTION constitution_validation_failed");
    return {
      status: "BLOCKED_BY_CONSTITUTION",
      reason: "constitution_validation_failed"
    };
  }

  try {
    execSync("npm run build:garuda", {
      stdio: "inherit"
    });

    console.log("[Builder] Build completed.");
    return { status: "SUCCESS" };
  } catch {
    console.log("[Builder] Build failed.");
    return { status: "FAILED" };
  }
}

module.exports = { build };