const express = require("express");
const router = express.Router();
const { executeMission } = require("../services/engineeringPipeline/engineeringPipeline");

// In-memory mission tracker (persists across requests in same process)
const activeMissions = new Map();

// POST /api/engineering/mission — Submit an engineering mission
router.post("/mission", async (req, res) => {
  try {
    const { mission, dryRun, maxRetries, founderApproved } = req.body || {};
    if (!mission || typeof mission !== "string" || mission.trim().length < 5) {
      return res.status(400).json({ success: false, message: "Mission must be at least 5 characters" });
    }

    const options = {
      rootDir: req.body.rootDir || process.cwd(),
      dryRun: dryRun === true,
      maxRetries: Math.min(Number(maxRetries) || 2, 5),
      founderApproval: founderApproved === true,
    };

    // Execute pipeline (async — return immediately with mission ID)
    const missionId = `eng_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    activeMissions.set(missionId, { status: "running", startedAt: new Date().toISOString(), mission, options });

    // Run pipeline in background
    executeMission(mission, options)
      .then((result) => {
        activeMissions.set(missionId, {
          status: result.status,
          completedAt: new Date().toISOString(),
          mission,
          result,
        });
      })
      .catch((err) => {
        activeMissions.set(missionId, {
          status: "failed",
          completedAt: new Date().toISOString(),
          mission,
          error: err.message,
        });
      });

    return res.status(202).json({
      success: true,
      missionId,
      status: "running",
      message: "Mission accepted. Poll GET /api/engineering/mission/:id for status.",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/engineering/mission/:id — Get mission status and result
router.get("/mission/:id", (req, res) => {
  const entry = activeMissions.get(req.params.id);
  if (!entry) {
    return res.status(404).json({ success: false, message: "Mission not found" });
  }
  return res.json({ success: true, data: entry });
});

// GET /api/engineering/missions — List all missions
router.get("/missions", (req, res) => {
  const missions = [];
  for (const [id, entry] of activeMissions) {
    missions.push({ id, status: entry.status, mission: entry.mission?.substring(0, 100), startedAt: entry.startedAt, completedAt: entry.completedAt });
  }
  return res.json({ success: true, count: missions.length, data: missions });
});

// GET /api/engineering/pipeline-log — Get recent pipeline log entries
router.get("/pipeline-log", (req, res) => {
  try {
    const fs = require("fs");
    const path = require("path");
    const logPath = path.join(__dirname, "..", "..", "data", "engineering", "pipeline-log.jsonl");
    if (!fs.existsSync(logPath)) {
      return res.json({ success: true, count: 0, data: [] });
    }
    const lines = fs.readFileSync(logPath, "utf8").trim().split("\n").filter(Boolean);
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const entries = lines.slice(-limit).map((l) => {
      try { return JSON.parse(l); } catch { return null; }
    }).filter(Boolean);
    return res.json({ success: true, count: entries.length, data: entries });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
