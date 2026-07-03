exports.getHealthStatus = () => {
  return {
    success: true,
    app: "GARUDA AI",
    version: "1.0.0",
    status: "running",
    message: "GARUDA AI Backend is healthy"
  };
};
