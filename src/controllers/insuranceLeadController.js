const { InsuranceLead, LEAD_STATUSES } = require("../models/InsuranceLead");
const telegramInsuranceWorker = require("../services/telegramInsuranceWorkerService");

function sendError(res, error, fallback) {
  return res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || fallback
  });
}

exports.list = async (req, res) => {
  try {
    const query = {};
    if (req.query.status && LEAD_STATUSES.includes(req.query.status)) query.status = req.query.status;
    if (req.query.source) query.source = String(req.query.source).trim();
    const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50));
    const items = await InsuranceLead.find(query).sort({ createdAt: -1 }).limit(limit);
    return res.json({ success: true, data: items.map((item) => item.toJSON()) });
  } catch (error) {
    return sendError(res, error, "Failed to list insurance leads");
  }
};

// Founder-gated InsuranceLead -> Opportunity handoff. Requires
// x-garuda-founder-approved header.
exports.promote = async (req, res) => {
  try {
    const result = await telegramInsuranceWorker.promoteLeadToOpportunity(req.params.id, {
      founderApproved: req.get("x-garuda-founder-approved")
    });
    if (!result.promoted) {
      return res.status(result.reason === "founder_approval_required" ? 403 : 400).json({ success: false, reason: result.reason });
    }
    return res.json({ success: true, data: result });
  } catch (error) {
    return sendError(res, error, "Failed to promote insurance lead to opportunity");
  }
};