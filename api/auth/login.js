const { isConfigured, issueSession, safeEqual } = require("./_session");

module.exports = function login(req, res) {
  if (req.method !== "POST") return res.status(405).json({ success: false, message: "Method not allowed" });
  if (!isConfigured()) return res.status(503).json({ success: false, message: "Founder access is not configured" });
  if (!safeEqual(req.body?.password || "", process.env.FOUNDER_ACCESS_PASSWORD)) return res.status(401).json({ success: false, message: "Invalid founder password" });
  issueSession(res);
  return res.status(200).json({ success: true });
};
