const registry = require("./serviceRegistry");
const { orchestrate } = require("./orchestrator");

function init() {
  return registry.initAll();
}

function execute(action, target, params = {}) {
  return orchestrate({ action, target, params });
}

function getServices() {
  return registry.listServices();
}

function getService(name) {
  return registry.getService(name);
}

function review(filePath) {
  return execute("review", filePath);
}

function plan(goalText, type = "custom") {
  return execute("plan", goalText, { type });
}

function fix(filePath) {
  return execute("fix", filePath);
}

function generate(type, options = {}) {
  return execute("generate", type, options);
}

function analyze() {
  return execute("analyze");
}

function learn(goalId) {
  return execute("learn", goalId);
}

function status() {
  return execute("status");
}

module.exports = { init, execute, getServices, getService, review, plan, fix, generate, analyze, learn, status };
