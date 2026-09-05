/**
 * 🦅 GARUDA ASTRA API ROUTES
 * Endpoints for autonomous coding, self-healing, and audit trails.
 */

const express = require("express");
const router = express.Router();
const { AstraExecutionEngine } = require("../services/astraCodingAgent/astraExecutionEngine");

const engine = new AstraExecutionEngine();

/**
 * POST /api/astra/execute
 * Execute an autonomous coding or refactoring task
 */
router.post("/execute", async (req, res) => {
  try {
    const { instruction, targetFile, searchQuery, code, summary } = req.body;
    if (!instruction) {
      return res.status(400).json({ success: false, error: "instruction is required" });
    }

    const result = await engine.executeTask(instruction, {
      targetFile,
      searchQuery,
      code,
      summary
    });

    res.json({
      success: result.success,
      data: result
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * GET /api/astra/status
 * Check engine status and provider configuration
 */
router.get("/status", (req, res) => {
  res.json({
    success: true,
    engine: "GARUDA Astra Sovereign Coding Agent",
    founder: "Praveen Mahawar",
    status: "online",
    capabilities: [
      "autonomous_react_loop",
      "closed_loop_syntax_verification",
      "self_healing_recovery",
      "sha256_audit_trail",
      "multimodal_repo_reconnaissance"
    ],
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /api/astra/history
 * Retrieve recent execution audit trail
 */
router.get("/history", (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 20;
  const history = engine.getAuditHistory(limit);
  res.json({
    success: true,
    count: history.length,
    history
  });
});

/**
 * POST /api/astra/inspect
 * Inspect a file with line numbers and SHA-256
 */
router.post("/inspect", (req, res) => {
  const { filePath } = req.body;
  if (!filePath) return res.status(400).json({ success: false, error: "filePath required" });
  const inspect = engine.inspectFile(filePath);
  res.json({ success: !inspect.error, data: inspect });
});

module.exports = router;
