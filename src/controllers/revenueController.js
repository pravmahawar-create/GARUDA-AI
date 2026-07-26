const revenueService = require("../services/revenueService");
const revenueConversionService = require("../services/revenueConversionService");
const settlementService = require("../services/settlementService");

function sendError(res, error, fallback) {
  return res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || fallback
  });
}

exports.list = async (req, res) => {
  try {
    const items = await revenueService.listRevenue(req.query || {});
    return res.json({
      success: true,
      data: items
    });
  } catch (error) {
    return sendError(res, error, "Failed to list revenue records");
  }
};

exports.create = async (req, res) => {
  try {
    const result = await revenueService.createRevenue(req.body || {});
    return res.status(201).json({
      success: true,
      data: result.record,
      workflow: result.workflow
    });
  } catch (error) {
    return sendError(res, error, "Failed to create revenue record");
  }
};

exports.update = async (req, res) => {
  try {
    const result = await revenueService.updateRevenue(req.params.id, req.body || {});
    return res.json({
      success: true,
      data: result.record,
      workflow: result.workflow
    });
  } catch (error) {
    return sendError(res, error, "Failed to update revenue record");
  }
};

exports.remove = async (req, res) => {
  try {
    const result = await revenueService.deleteRevenue(req.params.id);
    return res.json({
      success: true,
      ...result
    });
  } catch (error) {
    return sendError(res, error, "Failed to delete revenue record");
  }
};

exports.metrics = async (_req, res) => {
  try {
    const metrics = await revenueService.getRevenueMetrics();
    return res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    return sendError(res, error, "Failed to compute revenue metrics");
  }
};

exports.analytics = async (req, res) => {
  try {
    const monthsBack = Number(req.query.monthsBack) || 6;
    const analytics = await revenueService.getRevenueAnalytics({ monthsBack });
    return res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    return sendError(res, error, "Failed to compute revenue analytics");
  }
};

exports.settlement = async (_req, res) => {
  try {
    const summary = await revenueService.getSettlementSummary();
    return res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    return sendError(res, error, "Failed to compute settlement summary");
  }
};

exports.previewConversion = async (req, res) => {
  try {
    const preview = await revenueConversionService.previewConversion(
      req.params.opportunityId,
      req.body || {}
    );
    return res.json({ success: true, data: preview });
  } catch (error) {
    return sendError(res, error, "Failed to preview revenue conversion");
  }
};

exports.executeConversion = async (req, res) => {
  try {
    const result = await revenueConversionService.executeConversion(
      req.params.opportunityId,
      req.body || {},
      { founderApproved: req.get("x-garuda-founder-approved") }
    );
    return res.status(201).json({ success: true, data: result });
  } catch (error) {
    return sendError(res, error, "Failed to execute revenue conversion");
  }
};

exports.previewSettlement = async (req, res) => {
  try {
    const preview = await settlementService.previewSettlement(req.params.revenueRecordId, req.body || {});
    return res.json({ success: true, data: preview });
  } catch (error) {
    return sendError(res, error, "Failed to preview settlement");
  }
};

exports.createSettlement = async (req, res) => {
  try {
    const ledger = await settlementService.createSettlement(req.params.revenueRecordId, req.body || {}, { founderApproved: req.get("x-garuda-founder-approved") });
    return res.status(201).json({ success: true, data: ledger });
  } catch (error) {
    return sendError(res, error, "Failed to create settlement");
  }
};

exports.listSettlements = async (req, res) => {
  try {
    return res.json({ success: true, data: await settlementService.listSettlements(req.query || {}) });
  } catch (error) {
    return sendError(res, error, "Failed to list settlements");
  }
};

exports.updateSettlementStatus = async (req, res) => {
  try {
    const ledger = await settlementService.updateSettlementStatus(req.params.id, req.body || {}, { founderApproved: req.get("x-garuda-founder-approved") });
    return res.json({ success: true, data: ledger });
  } catch (error) {
    return sendError(res, error, "Failed to update settlement");
  }
};

const motherIntegration = require("../services/motherRevenueIntegrationService");

exports.listCandidates = async (req, res) => {
  try {
    const candidates = motherIntegration.listMissionCandidates(req.query || {});
    return res.json({ success: true, data: candidates });
  } catch (error) {
    return sendError(res, error, "Failed to list mission candidates");
  }
};

exports.getCandidate = async (req, res) => {
  try {
    const candidate = motherIntegration.getMissionCandidate(req.params.id);
    return res.json({ success: true, data: candidate });
  } catch (error) {
    return sendError(res, error, "Failed to get mission candidate");
  }
};

exports.recordCandidateDecision = async (req, res) => {
  try {
    const payload = {
      missionCandidateId: req.params.id,
      founderDecision: req.body.founderDecision || req.body.decision,
      founderReason: req.body.founderReason || req.body.reason,
      instructions: req.body.instructions
    };
    const result = motherIntegration.recordFounderDecision(payload);
    return res.json({ success: true, data: result });
  } catch (error) {
    return sendError(res, error, "Failed to record Founder decision");
  }
};

exports.getCandidateAuditTrail = async (req, res) => {
  try {
    const audit = motherIntegration.getDecisionAuditTrail(req.params.id);
    return res.json({ success: true, data: audit });
  } catch (error) {
    return sendError(res, error, "Failed to get candidate decision audit trail");
  }
};
