const express = require("express");
const router = express.Router();
const missionControlService = require("../services/missionControlService");

// Helper error response
function sendError(res, error, defaultMsg = "Mission request failed") {
  const statusCode = error.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    message: defaultMsg,
    error: String(error && error.message ? error.message : error)
  });
}

// POST /api/missions — Create a new Mission
router.post("/", async (req, res) => {
  try {
    const goal = req.body.goal || req.body.message || "";
    const founderApproved = req.body.founderApproved === true || req.get("x-garuda-founder-approved") === "true";
    const priority = req.body.priority || "P1";

    const mission = await missionControlService.createMission(goal, { founderApproved, priority });
    return res.status(201).json({ success: true, data: mission });
  } catch (error) {
    return sendError(res, error, "Failed to create mission");
  }
});

// GET /api/missions — List all Missions
router.get("/", async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const missions = await missionControlService.listMissions(limit);
    return res.json({ success: true, count: missions.length, data: missions });
  } catch (error) {
    return sendError(res, error, "Failed to list missions");
  }
});

// GET /api/missions/:id — Get Mission details with task graph & evidence
router.get("/:id", async (req, res) => {
  try {
    const mission = await missionControlService.findMissionById(req.params.id);
    if (!mission) {
      return res.status(404).json({ success: false, message: "Mission not found" });
    }
    return res.json({ success: true, data: mission });
  } catch (error) {
    return sendError(res, error, "Failed to fetch mission details");
  }
});

// POST /api/missions/:id/action — Governed Mission Action (approve/reject/retry/cancel)
router.post("/:id/action", async (req, res) => {
  try {
    const action = req.body.action || "approve";
    const payload = req.body.payload || {};

    const updatedMission = await missionControlService.handleAction(req.params.id, action, payload);
    return res.json({ success: true, data: updatedMission });
  } catch (error) {
    return sendError(res, error, "Failed to execute mission action");
  }
});

// POST /api/missions/:id/execute — Autonomous Builder Execution with QA & SHA-256 Manifest
router.post("/:id/execute", async (req, res) => {
  try {
    const founderApproved = req.body.founderApproved === true || req.get("x-garuda-founder-approved") === "true";
    const options = {
      founderApproved,
      proposalId: req.body.proposalId || null,
      customTask: req.body.task || null,
      maxAttempts: Number(req.body.maxAttempts) || 3
    };

    const result = await missionControlService.executeMissionWithBuilder(req.params.id, options);
    return res.json({ success: true, data: result });
  } catch (error) {
    return sendError(res, error, "Failed to execute builder mission");
  }
});

module.exports = router;
