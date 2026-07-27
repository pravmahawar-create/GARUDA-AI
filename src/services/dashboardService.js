const fs = require("fs");
const path = require("path");
const Knowledge = require("../models/Knowledge");
const { getHealthStatus } = require("./healthService");
const { getRevenueMetrics } = require("./revenueService");

function readJsonReport(relativePath) {
  try {
    const fullPath = path.join(__dirname, "..", "..", relativePath);
    const content = fs.readFileSync(fullPath, "utf8");
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

function buildDashboardPayload({ healthStatus, knowledgeCount, agentReport, scanReport, revenueMetrics }) {
  const agentData = agentReport || {};
  const scanData = scanReport || {};
  const scanner = agentData.scanner || {};
  const planner = agentData.planner || {};
  const builder = agentData.builder || {};
  const validator = agentData.validator || {};
  const metrics = revenueMetrics || {};

  return {
    success: true,
    health: {
      status: healthStatus?.status || "running",
      message: healthStatus?.message || "GARUDA AI Backend is healthy",
      service: healthStatus?.app || "GARUDA AI"
    },
    metrics: {
      revenue: {
        current: metrics.receivedRevenue || 0,
        currency: "INR",
        target: 0,
        trend: metrics.trend || "+0%",
        source: "database",
        mtdRevenue: metrics.mtdRevenue || 0,
        prevMonthRevenue: metrics.prevMonthRevenue || 0,
        pendingRevenue: metrics.pendingRevenue || 0,
        refundedRevenue: metrics.refundedRevenue || 0,
        totalRecords: metrics.totalRecords || 0
      },
      knowledgeCore: {
        count: knowledgeCount || 0,
        label: "indexed documents"
      },
      motherBrain: {
        scanner: {
          status: scanner?.status || scanData?.motherCoreDecision ? "ready" : "offline",
          totalFiles: scanner?.summary?.totalFiles || scanData?.summary?.totalFiles || 0,
          findings: scanner?.summary?.findings || scanData?.summary?.findings || 0
        },
        planner: {
          status: planner?.status || "offline",
          priorityTask: planner?.priorityTask || null
        },
        builder: {
          status: builder?.status || "offline"
        },
        validator: {
          status: validator?.status || "offline"
        }
      }
    }
  };
}

async function getDashboardSnapshot() {
  const healthStatus = getHealthStatus();
  let knowledgeCount = 0;
  let revenueMetrics = null;

  try {
    knowledgeCount = await Knowledge.countDocuments();
  } catch (error) {
    knowledgeCount = 0;
  }

  try {
    revenueMetrics = await getRevenueMetrics();
  } catch (error) {
    revenueMetrics = null;
  }

  const agentReport = readJsonReport("reports/mother-core-agent-report.json");
  const scanReport = readJsonReport("reports/mother-core-scan-report.json");

  const { getProactiveBusinessBriefing } = require("./opportunityDiscoveryService");
  let proactiveBriefing = null;
  try {
    proactiveBriefing = await getProactiveBusinessBriefing();
  } catch (e) {
    proactiveBriefing = null;
  }

  const { generateTodaysFounderExecutionMission } = require("./attackListService");
  let founderMission = null;
  try {
    founderMission = generateTodaysFounderExecutionMission([], { founderApproved: true });
  } catch (e) {
    founderMission = null;
  }

  const payload = buildDashboardPayload({
    healthStatus,
    knowledgeCount,
    agentReport,
    scanReport,
    revenueMetrics
  });

  const topItems = (proactiveBriefing?.highestRevenuePotential || []).slice(0, 3);
  const founderTodayActionItems = topItems.length > 0
    ? topItems.map((item, idx) => ({
        id: idx + 1,
        action: `Submit Rank #${item.rank} Proposal: ${item.title} at ${item.company} (USD $${item.expectedRevenueValue.toLocaleString()})`,
        urgency: idx === 0 ? "P0_IMMEDIATE" : idx === 1 ? "P1_HIGH" : "P2_MEDIUM"
      })).concat([
        { id: topItems.length + 1, action: "Check Wise / Bank Account for Milestone 1 Deposit Receipts", urgency: "P2_MEDIUM" },
        { id: topItems.length + 2, action: "Log Outbound Submissions via REST API POST /api/revenue/deals/submit", urgency: "P2_MEDIUM" }
      ]).slice(0, 5)
    : [
        { id: 1, action: "No active candidates in execution queue. Ingest client URL via Founder Intake Panel.", urgency: "P0_IMMEDIATE" },
        { id: 2, action: "Check Wise / Bank Account for Milestone 1 Deposit Receipts", urgency: "P2_MEDIUM" }
      ];

  payload.proactiveBusinessBriefing = proactiveBriefing;
  payload.todaysFounderExecutionMission = founderMission;
  payload.founderTodayActionItems = founderTodayActionItems;
  return payload;
}

module.exports = {
  buildDashboardPayload,
  getDashboardSnapshot
};
