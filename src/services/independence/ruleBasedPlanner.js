const { evaluate } = require("./ruleEngine");
const { matchPatterns } = require("./patternMatcher");

function planGoal(goal, codebase) {
  const plan = { goalId: goal.id, steps: [], analysis: {}, reasoning: [] };

  const analysis = analyzeGoal(goal, codebase);
  plan.analysis = analysis;

  const rulesInput = { goal, analysis, codebase };
  const ruleResults = evaluate(rulesInput);

  for (const r of ruleResults) {
    if (r.result && r.result.steps) {
      plan.steps.push(...r.result.steps);
    }
    if (r.result && r.result.reasoning) {
      plan.reasoning.push(r.result.reasoning);
    }
  }

  if (plan.steps.length === 0) {
    plan.steps = getDefaultPlan(goal);
    plan.reasoning.push("No rules matched — using default plan");
  }

  plan.steps = addDependencies(plan.steps);
  return plan;
}

function analyzeGoal(goal, codebase) {
  const analysis = {
    type: goal.type || "custom",
    affectedFiles: [],
    hasTests: false,
    complexity: "medium",
    patterns: []
  };

  if (codebase && codebase.files) {
    analysis.affectedFiles = codebase.files.filter((f) => {
      const name = (f.name || f.path || "").toLowerCase();
      if (goal.type === "bugfix") return name.includes("bug") || name.includes("fix") || name.includes("error");
      if (goal.type === "test") return name.includes(".test.") || name.includes(".spec.");
      return true;
    }).slice(0, 10);

    analysis.hasTests = codebase.files.some((f) => (f.name || "").includes(".test."));
    analysis.complexity = analysis.affectedFiles.length > 5 ? "high" : analysis.affectedFiles.length > 2 ? "medium" : "low";
  }

  return analysis;
}

function getDefaultPlan(goal) {
  const plans = {
    bugfix: [
      { type: "analyze", description: "Analyze error logs and affected files" },
      { type: "plan", description: "Identify root cause" },
      { type: "modify", description: "Apply fix" },
      { type: "test", description: "Verify fix with tests" },
      { type: "report", description: "Document fix" }
    ],
    feature: [
      { type: "analyze", description: "Analyze requirements" },
      { type: "plan", description: "Design implementation" },
      { type: "modify", description: "Implement feature" },
      { type: "test", description: "Write and run tests" },
      { type: "report", description: "Document feature" }
    ],
    refactor: [
      { type: "analyze", description: "Analyze current structure" },
      { type: "plan", description: "Plan refactoring steps" },
      { type: "modify", description: "Apply refactoring" },
      { type: "test", description: "Verify no regressions" },
      { type: "report", description: "Document changes" }
    ],
    review: [
      { type: "analyze", description: "Analyze code for issues" },
      { type: "review", description: "Apply review rules" },
      { type: "report", description: "Generate review report" }
    ]
  };
  return plans[goal.type] || plans.feature;
}

function addDependencies(steps) {
  if (steps.length === 0) return steps;
  const result = [steps[0]];
  for (let i = 1; i < steps.length; i++) {
    result.push({ ...steps[i], dependsOn: [steps[i - 1].type] });
  }
  return result;
}

function suggestFiles(goal, codebase) {
  if (!codebase || !codebase.files) return [];
  return codebase.files.filter((f) => {
    const name = (f.name || "").toLowerCase();
    if (goal.type === "bugfix") return name.includes(".js") && !name.includes(".test.");
    if (goal.type === "test") return name.includes(".test.") || name.includes(".spec.");
    if (goal.type === "review") return name.includes(".js") && !name.includes("node_modules");
    return name.includes(".js") && !name.includes(".test.");
  }).slice(0, 5);
}

module.exports = { planGoal, analyzeGoal, getDefaultPlan, suggestFiles };
