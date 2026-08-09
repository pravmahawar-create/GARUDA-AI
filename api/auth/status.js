const { hasValidSession } = require("./_session");

module.exports = function founderStatus(req, res) {
  if (req.method !== "GET") return res.status(405).json({ success: false, message: "Method not allowed" });
  return res.status(200).json({
    success: true,
    authenticated: hasValidSession(req),
    mode: "password",
    config: {
      loginEndpoint: "/api/auth/login",
      sessionEndpoint: "/api/auth/session",
      managementEndpoint: "/api/auth/manage-password"
    }
  });
};