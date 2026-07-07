const { getDashboardSnapshot } = require("../services/dashboardService");

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
