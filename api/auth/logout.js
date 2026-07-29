const { clearSession } = require("./_session");

module.exports = function logout(req, res) {
  if (req.method !== "POST") return res.status(405).json({ success: false, message: "Method not allowed" });
  clearSession(res);
  return res.status(200).json({ success: true });
};
