const revenueService = require("../services/revenueService");
const revenueConversionService = require("../services/revenueConversionService");

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
