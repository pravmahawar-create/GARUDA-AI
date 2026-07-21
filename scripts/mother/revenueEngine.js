const fs = require("fs");
const path = require("path");

const REVENUE_MODULES = Object.freeze([
  { name: "capability-registry", file: "src/services/capabilityRegistryService.js", markers: ["CAPABILITY_DEFINITIONS", "eligibleForMatching", "evidenceFiles"] },
  { name: "revenue-orchestrator", file: "src/services/revenueOrchestratorService.js", markers: ["matchDemand", "human_opportunity_channel_only", "automaticApplicationAllowed"] },
  { name: "capability-controller", file: "src/controllers/capabilityController.js", markers: ["capabilityRegistry", "revenueOrchestrator", "exports.match"] },
  { name: "capability-routes", file: "src/routes/capabilityRoutes.js", markers: ["controller.list", "controller.summary", "controller.match"] },
  { name: "discovery-model", file: "src/models/DiscoveryCandidate.js", markers: ["DiscoveryCandidate", "requiresFounderApproval", "sourceAttribution", "OPPORTUNITY_CHANNELS", "opportunityChannel"] },
  { name: "discovery-service", file: "src/services/opportunityDiscoveryService.js", markers: ["runDiscoveryCycle", "scoreCandidate", "inspectCandidate", "REMOTIVE_URL"] },
  { name: "discovery-worker", file: "src/workers/discoveryWorker.js", markers: ["startDiscoveryWorker", "setInterval", "DISCOVERY_ENABLED"] },
  { name: "discovery-routes", file: "src/routes/discoveryRoutes.js", markers: ["controller.list", "controller.run"] },
  {
    name: "income-goal-model",
    file: "src/models/IncomeGoal.js",
    markers: ["IncomeGoal", "INCOME_GOAL_STATUSES", "milestones"]
  },
  {
    name: "income-goal-service",
    file: "src/services/incomeGoalService.js",
    markers: ["DEFAULT_TARGET_AMOUNT", "buildMissionPlan", "createIncomeGoal", "lawfulOnly", "continuousDiscovery", "mobile_first"]
  },
  {
    name: "income-goal-controller",
    file: "src/controllers/incomeGoalController.js",
    markers: ["incomeGoalService", "exports.preview", "exports.create"]
  },
  {
    name: "income-goal-routes",
    file: "src/routes/incomeGoalRoutes.js",
    markers: ["incomeGoalController", "router.post", "router.get"]
  },
  {
    name: "opportunity-model",
    file: "src/models/Opportunity.js",
    markers: ["Opportunity", "OPP_STAGES"]
  },
  {
    name: "opportunity-service",
    file: "src/services/opportunityService.js",
    markers: ["createOpportunity", "getOpportunityMetrics", "validateOpportunityInput"]
  },
  {
    name: "opportunity-controller",
    file: "src/controllers/opportunityController.js",
    markers: ["opportunityService", "exports.create", "exports.metrics"]
  },
  {
    name: "opportunity-routes",
    file: "src/routes/opportunityRoutes.js",
    markers: ["opportunityController", "router.post", "router.get"]
  },
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
    name: "conversion-service",
    file: "src/services/revenueConversionService.js",
    markers: ["previewConversion", "executeConversion", "founderApprovalGranted"]
  },
  {
    name: "settlement-model",
    file: "src/models/SettlementLedger.js",
    markers: ["SettlementLedger", "SETTLEMENT_STATUSES", "auditTrail"]
  },
  {
    name: "settlement-service",
    file: "src/services/settlementService.js",
    markers: ["previewSettlement", "createSettlement", "updateSettlementStatus", "assessPayoutEligibility"]
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
