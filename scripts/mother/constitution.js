const fs = require("fs");

function loadConstitution() {
  const text = fs.readFileSync("GARUDA_CONSTITUTION.md", "utf8");

  return {
    loaded: true,
    laws: text
      .split("\n")
      .filter(line => /^\d+\./.test(line))
      .map(line => line.replace(/^\d+\.\s*/, "")),
    philosophy: text.includes("One Command. Infinite Intelligence.")
      ? "One Command. Infinite Intelligence."
      : ""
  };
}

function evaluateConstitutionGate(actionType = "autonomous_change") {
  try {
    const constitution = loadConstitution();
    const laws = Array.isArray(constitution.laws) ? constitution.laws : [];
    const requiredSignals = [
      "founder-approved architecture",
      "must not self-modify permanently without founder approval",
      "must pass tests before commit"
    ];

    const normalizedLaws = laws.map((law) => String(law).toLowerCase());
    const missingSignals = requiredSignals.filter((signal) => {
      return !normalizedLaws.some((law) => law.includes(signal));
    });

    if (!constitution.loaded || laws.length === 0 || missingSignals.length > 0) {
      return {
        allowed: false,
        status: "BLOCKED_BY_CONSTITUTION",
        reason: "constitution_validation_failed",
        actionType,
        lawCount: laws.length,
        missingSignals
      };
    }

    return {
      allowed: true,
      status: "ALLOWED_BY_CONSTITUTION",
      reason: "constitution_validated",
      actionType,
      lawCount: laws.length,
      missingSignals: []
    };
  } catch {
    return {
      allowed: false,
      status: "BLOCKED_BY_CONSTITUTION",
      reason: "constitution_validation_failed",
      actionType,
      lawCount: 0,
      missingSignals: ["constitution_load_failed"]
    };
  }
}

module.exports = { loadConstitution, evaluateConstitutionGate };
