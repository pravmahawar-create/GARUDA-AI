function validate(executionPlan = []) {
  console.log("[Validator] Starting...");

  const report = {
    passed: true,
    issues: []
  };

  if (!Array.isArray(executionPlan) || executionPlan.length === 0) {
    report.passed = false;
    report.issues.push("Execution plan is empty.");
  }

  executionPlan.forEach((item) => {
    if (!item || typeof item.task !== "string") {
      report.passed = false;
      report.issues.push(`Invalid task at step ${item.step}`);
    }
  });

  if (report.passed) {
    console.log("[Validator] Validation passed.");
  } else {
    console.log("[Validator] Validation failed.");
    report.issues.forEach((issue) => console.log("-", issue));
  }

  return report;
}

module.exports = { validate };