const { clearSession, supabaseClient } = require("./_auth");

module.exports = async function logout(req, res) {
  if (req.method !== "POST") return res.status(405).json({ success: false, message: "Method not allowed" });
  try {
    const supabase = supabaseClient();
    await supabase.auth.signOut();
  } catch {
    // Best-effort server-side sign out; the session cookie is always cleared below.
  }
  clearSession(res);
  return res.status(200).json({ success: true });
};