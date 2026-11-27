/**
 * 🦅 GARUDA AEGIS — OPERATIONAL COMMAND & WAR ROOM ROUTES
 * 
 * Exposes founder evaluation endpoints:
 * - GET  /api/aegis/status        — Live AEGIS system health & capability summary
 * - GET  /api/aegis/scenarios     — Scenario pack definitions and metadata
 * - GET  /api/aegis/defects       — Ledger of detected defects & regression status
 * - GET  /api/aegis/reports/:id   — Retrieve JSON/Markdown report for a specific mission
 * - POST /api/aegis/evaluate      — Dispatch an authorized evaluation mission (Founder Gated)
 * 
 * Core Doctrine: 100% Anti-Fabrication Law ("Show > Tell")
 */

const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

const {
  MissionController,
  ScenarioEngine,
  RegressionEngine,
  BASE_REPORTS_DIR
} = require("../aegis");

const scenarioEngine = new ScenarioEngine();
const regressionEngine = new RegressionEngine();
const missionController = new MissionController();

// 1. GET /api/aegis/status
router.get("/status", (req, res) => {
  const openDefects = regressionEngine.getOpenDefects();
  const reportsDir = BASE_REPORTS_DIR;
  let reportCount = 0;
  if (fs.existsSync(reportsDir)) {
    reportCount = fs.readdirSync(reportsDir).filter(f => f.endsWith(".json")).length;
  }

  res.json({
    success: true,
    system: "GARUDA AEGIS — Autonomous External Agent Evaluation System",
    operationalStatus: "ACTIVE",
    engineVersion: "1.0.0",
    totalScenarios: scenarioEngine.getAllScenarios().length,
    categories: scenarioEngine.getCategories(),
    openDefectsCount: openDefects.length,
    missionsArchived: reportCount,
    timestamp: new Date().toISOString()
  });
});

// 2. GET /api/aegis/scenarios
router.get("/scenarios", (req, res) => {
  const { category } = req.query;
  const scenarios = category 
    ? scenarioEngine.getScenariosByCategory(category)
    : scenarioEngine.getAllScenarios();

  res.json({
    success: true,
    total: scenarios.length,
    scenarios
  });
});

// 3. GET /api/aegis/defects
router.get("/defects", (req, res) => {
  const { targetUrl } = req.query;
  const defects = regressionEngine.getOpenDefects(targetUrl);

  res.json({
    success: true,
    total: defects.length,
    defects
  });
});

// 4. GET /api/aegis/reports/:missionId
router.get("/reports/:missionId", (req, res) => {
  const { missionId } = req.params;
  const format = req.query.format || "json";
  const filename = format === "markdown" || format === "md" 
    ? `aegis-${missionId}.md`
    : `aegis-${missionId}.json`;
  const filePath = path.join(BASE_REPORTS_DIR, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, error: `Report '${filename}' not found on disk.` });
  }

  if (format === "markdown" || format === "md") {
    res.setHeader("Content-Type", "text/markdown; charset=utf-8");
    return res.sendFile(filePath);
  }

  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  res.json({ success: true, report: data });
});

// 5. POST /api/aegis/evaluate (Founder Gated - cryptographic founder auth only)
router.post("/evaluate", async (req, res) => {
  try {
    const { isVerifiedFounderRequest } = require("../middleware/founderAuthHelper");
    const isFounder = await isVerifiedFounderRequest(req);

    const { targetUrl, category, scenarioIds, maxScenarios, headless } = req.body || {};

    if (!targetUrl) {
      return res.status(400).json({ success: false, error: "Missing required 'targetUrl' in request body." });
    }

    const missionResult = await missionController.executeMission(
      {
        targetUrl,
        category,
        scenarioIds,
        maxScenarios: maxScenarios ? Number(maxScenarios) : 10,
        headless: headless !== undefined ? headless : "new"
      },
      { founderApproved: isFounder }
    );

    const statusCode = missionResult.success ? 200 : 403;
    res.status(statusCode).json(missionResult);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
