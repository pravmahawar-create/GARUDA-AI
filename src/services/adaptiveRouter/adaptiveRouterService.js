const registry = require("./modelRegistry");
const { classifyTask, estimateComplexity } = require("./taskClassifier");
const { selectModel, selectModelForGoal } = require("./routerLogic");

function init() {
  registry.registerDefaults();
}

function route(input, constraints = {}) {
  return selectModel(input, constraints);
}

function routeForGoal(goal) {
  return selectModelForGoal(goal);
}

function getModels() {
  return registry.listModels();
}

function getAvailable() {
  return registry.getAvailableModels();
}

function getModel(modelId) {
  return registry.getModel(modelId);
}

function registerModel(config) {
  return registry.registerModel(config);
}

function classify(input) {
  return classifyTask(input);
}

function complexity(input) {
  return estimateComplexity(input);
}

function getModelStats() {
  const all = registry.listModels();
  const byProvider = {};
  for (const m of all) {
    byProvider[m.provider] = (byProvider[m.provider] || 0) + 1;
  }
  return { total: all.length, available: all.filter((m) => m.available).length, byProvider };
}

module.exports = { init, route, routeForGoal, getModels, getAvailable, getModel, registerModel, classify, complexity, getModelStats };
