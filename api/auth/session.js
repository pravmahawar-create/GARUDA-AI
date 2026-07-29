const { hasValidSession } = require("./_session");

module.exports = function session(req, res) {
  if (req.method !== "GET") return res.status(405).json({ success: false, message: "Method not allowed" });
  return res.status(200).json({ authenticated: hasValidSession(req) });
};
