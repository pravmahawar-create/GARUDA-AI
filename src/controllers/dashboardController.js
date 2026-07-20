const { getDashboardSnapshot } = require("../services/dashboardService");
const { getRevenueAnalytics } = require("../services/revenueService");

exports.snapshot = async (req, res) => {
  try {
    const snapshot = await getDashboardSnapshot();
    return res.json(snapshot);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Dashboard snapshot failed",
      error: error.message
    });
  }
};

exports.revenueAnalytics = async (req, res) => {
  try {
    const monthsBack = Number(req.query.monthsBack) || 6;
    const analytics = await getRevenueAnalytics({ monthsBack });

    return res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Revenue analytics failed"
    });
  }
};
