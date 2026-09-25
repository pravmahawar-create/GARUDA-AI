const express = require("express");
const router = express.Router();
const { revenueFunnelSecurityService } = require("../services/revenueFunnelSecurityService");
const inboundResponseService = require("../services/inboundResponseService");

// 1. Inbound Project Scope Submission (Phase 5.8 Hardened Public Trust Boundary)
router.post("/project-scope", async (req, res) => {
  try {
    const result = await revenueFunnelSecurityService.handleInboundSubmission(req.body, {
      req,
      headers: req.headers
    });
    return res.status(result.statusCode || 201).json(result.body);
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || "Failed to generate project scope."
    });
  }
});

// 2. Retrieve Project Scope by ID
router.get("/project-scope/:id", async (req, res) => {
  try {
    const scope = await revenueFunnelSecurityService.getScopeById(req.params.id);
    if (!scope) {
      return res.status(404).json({ success: false, message: "Project scope not found." });
    }
    return res.json({ success: true, proposal: scope });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 3. Telemetry & Funnel Observability
router.get("/metrics", (req, res) => {
  const metrics = revenueFunnelSecurityService.getTelemetryMetrics();
  return res.json({ success: true, metrics, data: metrics });
});

// 4. Inbound Client Message Intent Processing
router.post("/response", async (req, res) => {
  try {
    const result = await inboundResponseService.processInboundResponse(req.body, {
      founderApproved: req.get("x-garuda-founder-approved") === "true"
    });
    return res.status(201).json({ success: true, data: result });
  } catch (err) {
    return res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
});

module.exports = router;
