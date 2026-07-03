const healthService = require("../services/healthService");

exports.healthCheck = (req, res) => {
  const status = healthService.getHealthStatus();
  res.status(200).json(status);
};
