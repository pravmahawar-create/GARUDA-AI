const reviewService = require("../services/revenuePermissionReviewService");

function sendError(res, error, fallback) {
  return res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || fallback
  });
}

exports.list = async (req, res) => {
  try {
    return res.json({ success: true, data: await reviewService.listPendingReviews(req.query || {}) });
  } catch (error) {
    return sendError(res, error, "Failed to list permission review queue");
  }
};

exports.stats = async (_req, res) => {
  try {
    return res.json({ success: true, data: await reviewService.queueStats() });
  } catch (error) {
    return sendError(res, error, "Failed to compute permission review statistics");
  }
};

exports.get = async (req, res) => {
  try {
    return res.json({ success: true, data: await reviewService.getReview(req.params.id) });
  } catch (error) {
    return sendError(res, error, "Failed to get permission review detail");
  }
};

exports.history = async (req, res) => {
  try {
    return res.json({ success: true, data: await reviewService.listHistory(req.params.id) });
  } catch (error) {
    return sendError(res, error, "Failed to list permission review history");
  }
};

exports.decide = async (req, res) => {
  try {
    const result = await reviewService.recordDecision(req.params.id, req.body || {}, {
      founderApproved: req.get("x-garuda-founder-approved"),
      actor: "founder"
    });
    return res.json({ success: true, data: result });
  } catch (error) {
    return sendError(res, error, "Failed to record permission review decision");
  }
};

exports.batchDecide = async (req, res) => {
  try {
    const result = await reviewService.recordBatchDecisions(
      (req.body && req.body.candidateIds) || [],
      (req.body && req.body.payload) || {},
      {
        founderApproved: req.get("x-garuda-founder-approved"),
        actor: "founder"
      }
    );
    return res.json({ success: true, data: result });
  } catch (error) {
    return sendError(res, error, "Failed to record batch permission review decision");
  }
};