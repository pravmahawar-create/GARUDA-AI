const { createStep, VALID_STEP_TYPES } = require("./goalSchema");

const STEP_TEMPLATES = {
  bugfix: [
    { type: "analyze", description: "Analyze bug report and identify affected files" },
    { type: "plan", description: "Plan fix approach and affected scope" },
    { type: "modify", description: "Apply targeted fix" },
    { type: "test", description: "Run tests to verify fix" },
    { type: "review", description: "Review fix for correctness" },
    { type: "report", description: "Generate fix report with evidence" }
  ],
  feature: [
    { type: "analyze", description: "Analyze requirements and existing patterns" },
    { type: "plan", description: "Plan implementation approach" },
    { type: "modify", description: "Implement feature" },
    { type: "test", description: "Write and run tests" },
    { type: "review", description: "Review implementation" },
    { type: "report", description: "Generate feature report" }
  ],
  refactor: [
    { type: "analyze", description: "Analyze current code structure" },
    { type: "plan", description: "Plan refactoring steps" },
    { type: "modify", description: "Apply refactoring" },
    { type: "test", description: "Run tests to verify no regressions" },
    { type: "review", description: "Review refactored code" },
    { type: "report", description: "Generate refactoring report" }
  ],
  test: [
    { type: "analyze", description: "Analyze untested code" },
    { type: "plan", description: "Plan test cases" },
    { type: "modify", description: "Write tests" },
    { type: "test", description: "Run tests" },
    { type: "report", description: "Generate test report" }
  ],
  review: [
    { type: "analyze", description: "Analyze code to review" },
    { type: "review", description: "Perform code review" },
    { type: "report", description: "Generate review report" }
  ],
  custom: [
    { type: "analyze", description: "Analyze task requirements" },
    { type: "plan", description: "Plan execution approach" },
    { type: "modify", description: "Execute planned changes" },
    { type: "test", description: "Verify changes" },
    { type: "report", description: "Generate execution report" }
  ]
};

function planGoal(goal) {
  const templates = STEP_TEMPLATES[goal.type] || STEP_TEMPLATES.custom;
  const steps = [];
  let prevStepId = null;

  for (const template of templates) {
    const dependsOn = prevStepId ? [prevStepId] : [];
    const step = createStep({
      type: template.type,
      description: template.description,
      dependsOn
    });
    steps.push(step);
    prevStepId = step.id;
  }

  goal.steps = steps;
  goal.status = "planned";
  return goal;
}

function planGoalWithFiles(goal, files) {
  const baseSteps = planGoal(goal);
  const fileSteps = [];

  for (const file of files) {
    const analyzeStep = createStep({
      type: "analyze",
      description: `Analyze ${file}`,
      dependsOn: baseSteps.steps.length > 0 ? [baseSteps.steps[0].id] : []
    });
    const modifyStep = createStep({
      type: "modify",
      description: `Modify ${file}`,
      dependsOn: [analyzeStep.id]
    });
    fileSteps.push(analyzeStep, modifyStep);
  }

  baseSteps.steps.push(...fileSteps);
  return baseSteps;
}

function generateExecutionPlan(goal) {
  const phases = [];
  const stepsByType = {};

  for (const step of goal.steps) {
    if (!stepsByType[step.type]) stepsByType[step.type] = [];
    stepsByType[step.type].push(step);
  }

  if (stepsByType.analyze) phases.push({ name: "Analysis", steps: stepsByType.analyze });
  if (stepsByType.plan) phases.push({ name: "Planning", steps: stepsByType.plan });
  if (stepsByType.modify) phases.push({ name: "Execution", steps: stepsByType.modify });
  if (stepsByType.test) phases.push({ name: "Verification", steps: stepsByType.test });
  if (stepsByType.review) phases.push({ name: "Review", steps: stepsByType.review });
  if (stepsByType.report) phases.push({ name: "Reporting", steps: stepsByType.report });

  return { goalId: goal.id, totalSteps: goal.steps.length, phases };
}

module.exports = { planGoal, planGoalWithFiles, generateExecutionPlan, STEP_TEMPLATES };
