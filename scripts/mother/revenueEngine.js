const fs = require("fs");
const path = require("path");

const REVENUE_MODULES = Object.freeze([
  {
    name: "model",
    file: "src/models/RevenueRecord.js",
    markers: ["RevenueRecord", "REVENUE_STATUSES"]
  },
  {
    name: "service",
    file: "src/services/revenueService.js",
    markers: ["createRevenue", "getRevenueMetrics", "getSettlementSummary"]
  },
  {
    name: "controller",
    file: "src/controllers/revenueController.js",
    markers: ["revenueService", "exports.metrics", "exports.settlement"]
  },
  {
    name: "routes",
    file: "src/routes/revenueRoutes.js",
    markers: ["revenueController", 'router.get("/metrics"', 'router.get("/settlement"']
  }
]);

function inspectRevenueModules(rootDir = process.cwd()) {
  return REVENUE_MODULES.map((module) => {
    const absolutePath = path.join(rootDir, module.file);
    const exists = fs.existsSync(absolutePath);
    const source = exists ? fs.readFileSync(absolutePath, "utf8") : "";
    const missingMarkers = module.markers.filter((marker) => !source.includes(marker));

    return {
      name: module.name,
      file: module.file,
      exists,
      ready: exists && missingMarkers.length === 0,
      missingMarkers
    };
  });
}

function executeRevenueTask(task = "", options = {}) {
  const modules = inspectRevenueModules(options.rootDir);
  const missingModules = modules.filter((module) => !module.ready);
  const normalizedTask = String(task).toLowerCase();
  let taskType = "revenue_execution";

  if (normalizedTask.includes("analy")) taskType = "revenue_analysis";
  if (normalizedTask.includes("plan")) taskType = "revenue_integration_plan";
  if (normalizedTask.includes("valid")) taskType = "revenue_validation";

  return {
    success: missingModules.length === 0,
    output: {
      taskType,
      revenueEngineReady: missingModules.length === 0,
      inspectedModuleCount: modules.length,
      modules,
      issues: missingModules.map((module) => ({
        file: module.file,
        missing: module.exists ? module.missingMarkers : ["file"]
      }))
    }
  };
}

module.exports = {
  executeRevenueTask,
  inspectRevenueModules,
  REVENUE_MODULES
};
