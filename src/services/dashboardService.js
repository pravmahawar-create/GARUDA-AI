const fs = require("fs");
const path = require("path");
const Knowledge = require("../models/Knowledge");
const { getHealthStatus } = require("./healthService");

function readJsonReport(relativePath) {
  try {
    const fullPath = path.join(__dirname, "..", "..", relativePath);
    const content = fs.readFileSync(fullPath, "utf8");
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

function buildDashboardPayload({ healthStatus, knowledgeCount, agentReport, scanReport }) {
  const agentData = agentReport || {};
  const scanData = scanReport || {};
  const scanner = agentData.scanner || {};
  const planner = agentData.planner || {};
  const builder = agentData.builder || {};
  const validator = agentData.validator || {};

  return {
    success: true,
    health: {
      status: healthStatus?.status || "running",
      message: healthStatus?.message || "GARUDA AI Backend is healthy",
      service: healthStatus?.app || "GARUDA AI"
    },
    metrics: {
      revenue: {
        current: 0,
        currency: "INR",
        target: 0,
        trend: "+0%",
        source: "backend"
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

  try {
    knowledgeCount = await Knowledge.countDocuments();
  } catch (error) {
    knowledgeCount = 0;
  }

  const agentReport = readJsonReport("reports/mother-core-agent-report.json");
  const scanReport = readJsonReport("reports/mother-core-scan-report.json");

  return buildDashboardPayload({
    healthStatus,
    knowledgeCount,
    agentReport,
    scanReport
  });
}

module.exports = {
  buildDashboardPayload,
  getDashboardSnapshot
};
