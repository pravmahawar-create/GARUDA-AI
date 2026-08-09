const { DEMO_EMAIL, DEMO_PASSWORD, friendlyAuthError, isSupabaseConfigured, issueSession, supabaseAdminClient, supabaseClient } = require("./_auth");

async function demoSignIn(req, res) {
  if (req.method !== "POST") return res.status(405).json({ success: false, message: "Method not allowed" });
  if (!isSupabaseConfigured()) {
    return res.status(503).json({ success: false, message: "Demo sign in is unavailable: SUPABASE_URL and a publishable key must be configured." });
  }

  const email = String(DEMO_EMAIL).trim().toLowerCase();
  const password = String(DEMO_PASSWORD);
  const supabase = supabaseClient();

  const attempt = await signInWithPassword(supabase, email, password);
  if (attempt.session) {
    issueSession(res, { accessToken: attempt.session.access_token, refreshToken: attempt.session.refresh_token });
    return res.status(200).json({ success: true, demo: true, customer: { email: attempt.session.user.email || email } });
  }

  const admin = supabaseAdminClient();
  if (admin) {
    const provisioned = await provisionDemoAccount(admin, email, password);
    if (provisioned.ok) {
      const retry = await signInWithPassword(supabase, email, password);
      if (retry.session) {
        issueSession(res, { accessToken: retry.session.access_token, refreshToken: retry.session.refresh_token });
        return res.status(200).json({ success: true, demo: true, customer: { email: retry.session.user.email || email } });
      }
      return res.status(401).json({ success: false, message: "Unable to sign into the demo account. Please try again." });
    }
    return res.status(400).json({ success: false, message: provisioned.message || "Unable to prepare the demo account." });
  }

  const signup = await supabase.auth.signUp({ email, password });
  if (signup.data && signup.data.session) {
    issueSession(res, {
      accessToken: signup.data.session.access_token,
      refreshToken: signup.data.session.refresh_token
    });
    return res.status(201).json({ success: true, demo: true, customer: { email: signup.data.session.user.email || email } });
  }
  const message = friendlyAuthError(signup.error || attempt.error, "Unable to sign into the demo account");
  return res.status(message.includes("already exists") ? 409 : 400).json({ success: false, message });
}

async function signInWithPassword(supabase, email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { session: null, error };
  return { session: data.session || null, error: null };
}

async function provisionDemoAccount(admin, email, password) {
  try {
    const { data: existing } = await admin.auth.admin.listUsers({ page: 1, perPage: 10000 });
    const found = existing && existing.users
      ? existing.users.find((user) => String(user.email || "").toLowerCase() === String(email).toLowerCase())
      : null;
    if (found) {
      const { error } = await admin.auth.admin.updateUserById(found.id, { password });
      if (error) return { ok: false, message: error.message || "Unable to refresh the demo account password." };
      return { ok: true };
    }
    const { error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
    if (error) return { ok: false, message: error.message || "Unable to create the demo account." };
    return { ok: true };
  } catch (error) {
    return { ok: false, message: error && error.message ? error.message : "Unable to prepare the demo account." };
  }
}

module.exports = demoSignIn;