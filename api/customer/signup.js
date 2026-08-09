const { friendlyAuthError, isSupabaseConfigured, issueSession, normalizeEmail, supabaseAdminClient, supabaseClient, validatePassword } = require("./_auth");

module.exports = async function signup(req, res) {
  if (req.method !== "POST") return res.status(405).json({ success: false, message: "Method not allowed" });
  if (!isSupabaseConfigured()) {
    return res.status(503).json({ success: false, message: "Customer signup is unavailable: SUPABASE_URL and a publishable key must be configured." });
  }
  try {
    const email = normalizeEmail(req.body?.email);
    const password = validatePassword(req.body?.password);
    const supabase = supabaseClient();
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      const message = friendlyAuthError(error, "Unable to create account");
      return res.status(message.includes("already exists") ? 409 : 400).json({ success: false, message });
    }
    const user = data.user;
    if (!user) return res.status(400).json({ success: false, message: "Unable to create account" });
    if (data.session) {
      issueSession(res, { accessToken: data.session.access_token, refreshToken: data.session.refresh_token });
      return res.status(201).json({ success: true, customer: { email: user.email || email } });
    }
    const admin = supabaseAdminClient();
    if (admin) {
      const { error: confirmError } = await admin.auth.admin.updateUserById(user.id, { email_confirm: true });
      if (confirmError) {
        return res.status(400).json({ success: false, message: "Account created but could not be activated. Please retry or sign in later." });
      }
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError || !signInData.session) {
        return res.status(200).json({ success: true, requiresEmailConfirmation: true, message: "Account created. Sign in to continue." });
      }
      issueSession(res, { accessToken: signInData.session.access_token, refreshToken: signInData.session.refresh_token });
      return res.status(201).json({ success: true, customer: { email: signInData.session.user.email || email } });
    }
    return res.status(200).json({ success: true, requiresEmailConfirmation: true, message: "Account created. Sign in to continue." });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message || "Unable to create account" });
  }
};