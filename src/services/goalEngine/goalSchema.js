const VALID_GOAL_TYPES = ["bugfix", "feature", "refactor", "test", "review", "custom"];
const VALID_STEP_TYPES = ["analyze", "plan", "modify", "test", "review", "commit", "report"];
const VALID_STATUSES = ["pending", "running", "completed", "failed", "skipped"];
const VALID_PRIORITIES = ["low", "medium", "high", "critical"];

function createGoal(input) {
  const goal = {
    id: input.id || generateGoalId(),
    type: validateGoalType(input.type),
    title: input.title || "Untitled Goal",
    description: input.description || "",
    status: "created",
    priority: VALID_PRIORITIES.includes(input.priority) ? input.priority : "medium",
    steps: [],
    createdAt: new Date().toISOString(),
    completedAt: null,
    evidence: []
  };
  return goal;
}

function createStep(input) {
  return {
    id: input.id || generateStepId(),
    type: validateStepType(input.type),
    description: input.description || "",
    status: "pending",
    dependsOn: Array.isArray(input.dependsOn) ? input.dependsOn : [],
    filePath: input.filePath || null,
    result: null,
    error: null,
    startedAt: null,
    completedAt: null,
    evidence: []
  };
}

function generateGoalId() {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `goal-${ts}-${rand}`;
}

function generateStepId() {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `step-${ts}-${rand}`;
}

function validateGoalType(type) {
  return VALID_GOAL_TYPES.includes(type) ? type : "custom";
}

function validateStepType(type) {
  return VALID_STEP_TYPES.includes(type) ? type : "custom";
}

function validateGoal(goal) {
  const errors = [];
  if (!goal.id) errors.push("Goal must have an id");
  if (!goal.type) errors.push("Goal must have a type");
  if (!goal.title) errors.push("Goal must have a title");
  if (!Array.isArray(goal.steps)) errors.push("Goal must have steps array");
  return { valid: errors.length === 0, errors };
}

function validateStep(step) {
  const errors = [];
  if (!step.id) errors.push("Step must have an id");
  if (!step.type) errors.push("Step must have a type");
  if (!Array.isArray(step.dependsOn)) errors.push("Step must have dependsOn array");
  return { valid: errors.length === 0, errors };
}

function getStepDependencies(goal, stepId) {
  const step = goal.steps.find((s) => s.id === stepId);
  if (!step) return [];
  return step.dependsOn.map((depId) => goal.steps.find((s) => s.id === depId)).filter(Boolean);
}

function areDependenciesMet(goal, stepId) {
  const step = goal.steps.find((s) => s.id === stepId);
  if (!step) return false;
  return step.dependsOn.every((depId) => {
    const dep = goal.steps.find((s) => s.id === depId);
    return dep && dep.status === "completed";
  });
}

function getNextSteps(goal) {
  return goal.steps.filter((s) => s.status === "pending" && areDependenciesMet(goal, s.id));
}

function isGoalComplete(goal) {
  return goal.steps.every((s) => s.status === "completed" || s.status === "skipped");
}

function isGoalFailed(goal) {
  return goal.steps.some((s) => s.status === "failed");
}

module.exports = {
  createGoal, createStep, generateGoalId, generateStepId,
  validateGoal, validateStep, getStepDependencies, areDependenciesMet,
  getNextSteps, isGoalComplete, isGoalFailed,
  VALID_GOAL_TYPES, VALID_STEP_TYPES, VALID_STATUSES, VALID_PRIORITIES
};
