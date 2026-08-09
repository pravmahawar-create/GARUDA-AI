const { clearSession, hasValidSession, safeEqual } = require("./_session");
const { clearCredential, passwordMatches, setFounderPassword } = require("./_founderCredential");

module.exports = async function managePassword(req, res) {
  if (req.method !== "POST") return res.status(405).json({ success: false, message: "Method not allowed" });
  const action = String(req.body?.action || "").toLowerCase();
  if (!["set", "change"].includes(action)) return res.status(400).json({ success: false, message: "action must be set or change" });

  const newPassword = String(req.body?.newPassword || "");
  const currentPassword = String(req.body?.currentPassword || "");
  const setupToken = String(req.body?.setupToken || "");
  if (newPassword.length < 12) return res.status(400).json({ success: false, message: "Password must be at least 12 characters" });

  const sessionGranted = hasValidSession(req);
  let currentAccepted = false;
  try {
    currentAccepted = await passwordMatches(currentPassword);
  } catch {
    currentAccepted = false;
  }
  const setupAccepted = action === "set" && setupToken && process.env.GARUDA_FOUNDER_SETUP_TOKEN && safeEqual(setupToken, process.env.GARUDA_FOUNDER_SETUP_TOKEN);

  if (!sessionGranted && !currentAccepted && !setupAccepted) {
    return res.status(403).json({ success: false, message: "A current founder password, active session, or setup token is required" });
  }

  const stored = await setFounderPassword(newPassword);
  if (!stored.stored) return res.status(400).json({ success: false, message: stored.message || "Unable to update founder password" });

  const { clearSession } = require("./_session");
  clearSession(res);
  return res.status(200).json({ success: true, message: "Founder password updated. Sign in again with the new password.", action });
};