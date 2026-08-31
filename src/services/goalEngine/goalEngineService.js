const fs = require("fs");
const path = require("path");
const { createGoal, validateGoal, isGoalComplete } = require("./goalSchema");
const { planGoal, planGoalWithFiles, generateExecutionPlan } = require("./goalPlanner");
const { executeGoal, generateReport, createAnalysisHandler, createModifyHandler, createTestHandler, createReviewHandler } = require("./goalExecutor");

const GOALS_DIR = path.join(process.cwd(), "data", "goals");

function initGoalsDir() {
  if (!fs.existsSync(GOALS_DIR)) fs.mkdirSync(GOALS_DIR, { recursive: true });
}

function createAndPlanGoal(input) {
  const goal = createGoal(input);
  const planned = planGoal(goal);
  const validation = validateGoal(planned);
  if (!validation.valid) return { success: false, errors: validation.errors };
  saveGoal(planned);
  return { success: true, goal: planned };
}

function createGoalWithFiles(input, files) {
  const goal = createGoal(input);
  const planned = planGoalWithFiles(goal, files);
  const validation = validateGoal(planned);
  if (!validation.valid) return { success: false, errors: validation.errors };
  saveGoal(planned);
  return { success: true, goal: planned };
}

function executeGoalById(goalId, services = {}) {
  const goal = loadGoal(goalId);
  if (!goal) return { success: false, error: "Goal not found" };
  const handlers = {};
  if (services.repoIntel) handlers.analyze = createAnalysisHandler(services.repoIntel);
  if (services.safeMod) handlers.modify = createModifyHandler(services.safeMod);
  if (services.testDiscovery) handlers.test = createTestHandler(services.testDiscovery);
  if (services.codeReview) handlers.review = createReviewHandler(services.codeReview);
  const result = executeGoal(goal, handlers);
  saveGoal(result.goal);
  const report = generateReport(result.goal);
  return { success: true, ...result, report };
}

function getGoalStatus(goalId) {
  const goal = loadGoal(goalId);
  if (!goal) return null;
  return {
    id: goal.id,
    type: goal.type,
    title: goal.title,
    status: goal.status,
    progress: `${goal.steps.filter((s) => s.status === "completed").length}/${goal.steps.length}`,
    steps: goal.steps.map((s) => ({ id: s.id, type: s.type, status: s.status, description: s.description }))
  };
}

function listGoals() {
  initGoalsDir();
  const files = fs.readdirSync(GOALS_DIR).filter((f) => f.endsWith(".json"));
  return files.map((f) => {
    try {
      const data = JSON.parse(fs.readFileSync(require("path").join(GOALS_DIR, f), "utf8"));
      return { id: data.id, type: data.type, title: data.title, status: data.status, createdAt: data.createdAt };
    } catch { return null; }
  }).filter(Boolean);
}

function saveGoal(goal) {
  initGoalsDir();
  const filePath = path.join(GOALS_DIR, `${goal.id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(goal, null, 2));
}

function loadGoal(goalId) {
  initGoalsDir();
  const filePath = path.join(GOALS_DIR, `${goalId}.json`);
  if (!fs.existsSync(filePath)) return null;
  try { return JSON.parse(fs.readFileSync(filePath, "utf8")); } catch { return null; }
}

function getExecutionPlan(goalId) {
  const goal = loadGoal(goalId);
  if (!goal) return null;
  return generateExecutionPlan(goal);
}

module.exports = {
  createAndPlanGoal, createGoalWithFiles, executeGoalById,
  getGoalStatus, listGoals, getExecutionPlan, saveGoal, loadGoal
};
