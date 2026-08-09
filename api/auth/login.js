const { isConfigured, issueSession, safeEqual } = require("./_session");
const { isFounderCredentialReady, passwordMatches } = require("./_founderCredential");

module.exports = async function login(req, res) {
  if (req.method !== "POST") return res.status(405).json({ success: false, message: "Method not allowed" });
  const password = String(req.body?.password || "");

  const mongoReady = await isFounderCredentialReady();
  const envConfigured = isConfiguredEnv();
  if (!mongoReady && !envConfigured) return res.status(503).json({ success: false, message: "Founder access is not configured" });

  let accepted = false;
  if (mongoReady) accepted = await passwordMatches(password);
  if (!accepted && envConfigured) accepted = safeEqual(password, process.env.FOUNDER_ACCESS_PASSWORD);
  if (!accepted) return res.status(401).json({ success: false, message: "Invalid founder password" });

  issueSession(res);
  return res.status(200).json({ success: true });
};

function isConfiguredEnv() {
  return Boolean(process.env.FOUNDER_ACCESS_PASSWORD && process.env.FOUNDER_SESSION_SECRET);
}