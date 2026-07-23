function requiresFounderApproval(action) {
  if (!action) return true;

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
