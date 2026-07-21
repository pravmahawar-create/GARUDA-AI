const incomeGoalService = require("../services/incomeGoalService");

function sendError(res, error, fallback) {
  return res.status(error.statusCode || 500).json({ success: false, message: error.message || fallback });
}

exports.preview = async (req, res) => {
  try {
    return res.json({ success: true, data: await incomeGoalService.previewIncomeGoal(req.body || {}) });
  } catch (error) {
    return sendError(res, error, "Failed to preview income mission");
  }
};

exports.create = async (req, res) => {
  try {
    const result = await incomeGoalService.createIncomeGoal(req.body || {}, {
      founderApproved: req.get("x-garuda-founder-approved")
    });
    return res.status(201).json({ success: true, data: result.goal, workflow: result.workflow, optimizationTargetOnly: true });
  } catch (error) {
    return sendError(res, error, "Failed to start income mission");
  }
};

exports.list = async (req, res) => {
  try {
    return res.json({ success: true, data: await incomeGoalService.listIncomeGoals(req.query || {}) });
  } catch (error) {
    return sendError(res, error, "Failed to list income missions");
  }
};

exports.get = async (req, res) => {
  try {
    return res.json({ success: true, data: await incomeGoalService.getIncomeGoal(req.params.id) });
  } catch (error) {
    return sendError(res, error, "Failed to get income mission");
  }
};
