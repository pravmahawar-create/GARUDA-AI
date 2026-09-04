const { isLowRiskAutonomousAllowed } = require("./lowRiskAutonomousGate");

function requiresFounderApproval(action, context = {}) {
  if (!action) return true;

  // Founder-governed low-risk autonomous: ≤₹25k + 11 checks pass → no founder wait, governance intact for high-risk
  // Explicit founder opt-in via context.allowLowRiskAutonomous or env FOUNDER_ALLOW_LOW_RISK_AUTONOMOUS=true enables this path
  const allowLowRisk = context.allowLowRiskAutonomous === true || process.env.FOUNDER_ALLOW_LOW_RISK_AUTONOMOUS === "true";
  if (allowLowRisk) {
    const gate = isLowRiskAutonomousAllowed(action, context);
    if (gate.allowed) return false; // autonomous allowed, no founder wait
  }

  const riskyTypes = [
    "file_write",
    "delete_file",
    "git_commit",
    "git_push",
    "env_change",
    "dependency_install",
    "security_sensitive_change",
    "database_migration",
    "constitutional_change",
    "deployment",
    "external_action",
    "financial_action",
    "revenue_external_action",
    "autonomous_execution"
  ];

  return riskyTypes.includes(action.type) || action.requiresFounderApproval === true;
}

module.exports = { requiresFounderApproval };
