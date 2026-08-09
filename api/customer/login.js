const { friendlyAuthError, isSupabaseConfigured, issueSession, normalizeEmail, supabaseClient } = require("./_auth");

module.exports = async function login(req, res) {
  if (req.method !== "POST") return res.status(405).json({ success: false, message: "Method not allowed" });
  if (!isSupabaseConfigured()) {
    return res.status(503).json({ success: false, message: "Customer sign in is unavailable: SUPABASE_URL and a publishable key must be configured." });
  }
  try {
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || "");
    const supabase = supabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.session) {
      const message = friendlyAuthError(error, "Invalid email or password");
      return res.status(401).json({ success: false, message });
    }
    issueSession(res, { accessToken: data.session.access_token, refreshToken: data.session.refresh_token });
    return res.status(200).json({ success: true, customer: { email: data.session.user.email || email } });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message || "Unable to sign in" });
  }
};