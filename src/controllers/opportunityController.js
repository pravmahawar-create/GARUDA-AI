const opportunityService = require("../services/opportunityService");

function sendError(res, error, fallback) {
  return res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || fallback
  });
}

exports.list = async (req, res) => {
  try {
    const items = await opportunityService.listOpportunities(req.query || {});
    return res.json({ success: true, data: items });
  } catch (error) {
    return sendError(res, error, "Failed to list opportunities");
  }
};

exports.create = async (req, res) => {
  try {
    const item = await opportunityService.createOpportunity(req.body || {});
    return res.status(201).json({ success: true, data: item });
  } catch (error) {
    return sendError(res, error, "Failed to create opportunity");
  }
};

exports.update = async (req, res) => {
  try {
    const item = await opportunityService.updateOpportunity(req.params.id, req.body || {});
    return res.json({ success: true, data: item });
  } catch (error) {
    return sendError(res, error, "Failed to update opportunity");
  }
};

exports.metrics = async (_req, res) => {
  try {
    const metrics = await opportunityService.getOpportunityMetrics();
    return res.json({ success: true, data: metrics });
  } catch (error) {
    return sendError(res, error, "Failed to compute opportunity metrics");
  }
};
