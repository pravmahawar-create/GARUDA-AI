const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");

const COOKIE_NAME = "garuda_customer_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const DEMO_EMAIL = process.env.GARUDA_DEMO_EMAIL || "demo@garudaos.in";
const DEMO_PASSWORD = process.env.GARUDA_DEMO_PASSWORD || "GarudaDemo2026!";
const DEFAULT_SUPABASE_URL = "https://gcifzzuyswrcwvkcfqbr.supabase.co";
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_uYLXTH4M1PFyem5pQSMJtQ_7YqZ2rFp";

function supabaseConfig() {
  const url = process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || DEFAULT_SUPABASE_PUBLISHABLE_KEY;
  return { url, key };
}

function isSupabaseConfigured() {
  const { url, key } = supabaseConfig();
  return Boolean(url && key);
}

function supabaseClient() {
  const { url, key } = supabaseConfig();
  return createClient(String(url).trim(), String(key).trim(), {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });
}

function supabaseAdminClient() {
  if (!isSupabaseConfigured()) return null;
  const secret = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) return null;
  const { url } = supabaseConfig();
  return createClient(String(url).trim(), String(secret).trim(), {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });
}

function normalizeEmail(value) {
  const email = String(value || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Enter a valid email address");
  return email;
}

function validatePassword(value) {
  const password = String(value || "");
  if (password.length < 12) throw new Error("Password must be at least 12 characters");
  if (password.length > 128) throw new Error("Password is too long");
  return password;
}

function cookieValue(req) {
  const cookie = String(req.headers.cookie || "")
    .split(";")
    .find((value) => value.trim().startsWith(`${COOKIE_NAME}=`));
  return cookie ? decodeURIComponent(cookie.trim().slice(COOKIE_NAME.length + 1)) : "";
}

function authUserId(accessToken) {
  try {
    const payload = String(accessToken || "").split(".")[1];
    if (!payload) return "";
    const json = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (json.exp && Number(json.exp) * 1000 < Date.now()) {
      return ""; // Token is expired
    }
    return String(json.sub || "");
  } catch {
    return "";
  }
}

function cookieTokens(req) {
  // 1. Check Authorization header (Bearer token)
  const authHeader = String(req?.headers?.authorization || "").trim();
  if (authHeader.startsWith("Bearer ")) {
    const headerToken = authHeader.slice(7).trim();
    if (headerToken) {
      return { accessToken: headerToken, refreshToken: "" };
    }
  }

  // 2. Check Cookie
  const token = cookieValue(req);
  if (!token) return { accessToken: "", refreshToken: "" };
  const [accessToken, refreshToken] = token.split("~");
  return { accessToken: accessToken || "", refreshToken: refreshToken || "" };
}

function authenticatedDbClient(req) {
  const { accessToken } = cookieTokens(req);
  if (!accessToken || !authUserId(accessToken)) return null;
  const { url, key } = supabaseConfig();
  return createClient(String(url).trim(), String(key).trim(), {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } }
  });
}

function authenticatedUserId(req) {
  return authUserId(cookieTokens(req).accessToken);
}

function issueSession(res, session) {
  const accessToken = String(session.accessToken || "");
  const refreshToken = String(session.refreshToken || "");
  if (!accessToken) throw new Error("Missing Supabase session token");
  res.setHeader("Set-Cookie", `${COOKIE_NAME}=${accessToken}~${refreshToken}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_MAX_AGE_SECONDS}`);
}

function clearSession(res) {
  res.setHeader("Set-Cookie", `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`);
}

async function currentCustomer(req) {
  const { accessToken, refreshToken } = cookieTokens(req);
  if (!accessToken) return null;
  const supabase = supabaseClient();
  const { data, error } = await supabase.auth.getUser(accessToken);
  if (!error && data && data.user) {
    return { customer: { id: data.user.id, email: data.user.email || "" }, refreshedSession: null };
  }
  if (!refreshToken) return null;
  const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession({ refresh_token: refreshToken });
  if (refreshError || !refreshed || !refreshed.session) return null;
  return {
    customer: { id: refreshed.session.user.id, email: refreshed.session.user.email || "" },
    refreshedSession: refreshed.session
  };
}

function friendlyAuthError(err, fallback) {
  const message = String(err && err.message ? err.message : "");
  const code = String(err && err.code ? err.code : "");
  if (code === "invalid_credentials" || /invalid login credentials/i.test(message)) {
    return "Invalid email or password";
  }
  if (code === "email_exists" || code === "user_already_exists" || /already registered/i.test(message)) {
    return "An account already exists for this email";
  }
  if (code === "weak_password" || /password should be at least/i.test(message)) {
    return "Password is too weak — use at least 12 characters";
  }
  if (code === "email_not_confirmed" || /email not confirmed/i.test(message)) {
    return "Please confirm your email address before signing in";
  }
  return fallback;
}

async function signupHandler(req, res) {
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
}

async function loginHandler(req, res) {
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
}

async function sessionHandler(req, res) {
  try {
    const result = await currentCustomer(req);
    if (!result || !result.customer) return res.status(200).json({ authenticated: false });
    if (result.refreshedSession) {
      issueSession(res, {
        accessToken: result.refreshedSession.access_token,
        refreshToken: result.refreshedSession.refresh_token
      });
    }
    return res.status(200).json({ authenticated: true, customer: { email: result.customer.email } });
  } catch (error) {
    return res.status(200).json({ authenticated: false });
  }
}

async function logoutHandler(req, res) {
  try {
    const supabase = supabaseClient();
    await supabase.auth.signOut();
  } catch {
    // Best-effort server-side sign out; the session cookie is always cleared below.
  }
  clearSession(res);
  return res.status(200).json({ success: true });
}

async function conversationsHandler(req, res) {
  const db = authenticatedDbClient(req);
  const userId = authenticatedUserId(req);
  if (!db || !userId) return res.status(401).json({ success: false, message: "Sign in required" });

  if (req.method === "GET") {
    const { data, error } = await db
      .from("conversation_previews")
      .select("id, title, created_at, updated_at, message_count, last_message")
      .order("updated_at", { ascending: false })
      .limit(50);
    if (error) return res.status(400).json({ success: false, message: error.message });
    return res.status(200).json({ success: true, conversations: data || [] });
  }

  if (req.method === "POST") {
    const title = String(req.body?.title || "New conversation").trim().slice(0, 200);
    const { data, error } = await db
      .from("conversations")
      .insert({ user_id: userId, title })
      .select("id, title, created_at, updated_at")
      .single();
    if (error) return res.status(400).json({ success: false, message: error.message });
    return res.status(201).json({ success: true, conversation: data });
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}

async function messagesHandler(req, res) {
  const db = authenticatedDbClient(req);
  const userId = authenticatedUserId(req);
  if (!db || !userId) return res.status(401).json({ success: false, message: "Sign in required" });

  const conversationId = String(
    (req.method === "GET" ? req.query?.conversation_id : null) ||
    req.body?.conversation_id ||
    ""
  ).trim();

  if (req.method === "GET") {
    if (!conversationId) return res.status(400).json({ success: false, message: "conversation_id is required" });
    const { data, error } = await db
      .from("messages")
      .select("id, role, content, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(500);
    if (error) return res.status(400).json({ success: false, message: error.message });
    return res.status(200).json({ success: true, messages: data || [] });
  }

  if (req.method === "POST") {
    if (!conversationId) return res.status(400).json({ success: false, message: "conversation_id is required" });
    const role = String(req.body?.role || "").trim();
    const content = String(req.body?.content || "").trim();
    if (!["user", "assistant"].includes(role)) return res.status(400).json({ success: false, message: "role must be user or assistant" });
    if (!content) return res.status(400).json({ success: false, message: "content is required" });
    const { data, error } = await db
      .from("messages")
      .insert({ conversation_id: conversationId, user_id: userId, role, content })
      .select("id, conversation_id, role, content, created_at")
      .single();
    if (error) return res.status(400).json({ success: false, message: error.message });
    return res.status(201).json({ success: true, message: data });
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}

function randomDemoEmail() {
  const suffix = crypto.randomBytes(6).toString("hex");
  return `${String(DEMO_EMAIL).trim().toLowerCase().replace(/@.*$/, "")}-${suffix}@${String(DEMO_EMAIL).trim().toLowerCase().replace(/^.*@/, "")}`;
}

async function demoSignInHandler(req, res) {
  // Per-visitor isolation: every demo sign-in gets a FRESH random account so no
  // public user ever sees another user's conversations or dashboard data.
  const email = randomDemoEmail();
  const password = `${String(DEMO_PASSWORD)}!${Date.now()}`;
  const supabase = supabaseClient();

  const admin = supabaseAdminClient();
  if (admin) {
    const provisioned = await provisionDemoAccount(admin, email, password);
    if (provisioned.ok) {
      const attempt = await signInWithPassword(supabase, email, password);
      if (attempt.session) {
        issueSession(res, { accessToken: attempt.session.access_token, refreshToken: attempt.session.refresh_token });
        return res.status(200).json({ success: true, demo: true, customer: { email: attempt.session.user.email || email } });
      }
      return res.status(401).json({ success: false, message: "Unable to sign into the demo account. Please try again." });
    }
    return res.status(400).json({ success: false, message: provisioned.message || "Unable to prepare the demo account." });
  }

  // Fallback (no service role): sign up a fresh random account directly.
  const signup = await supabase.auth.signUp({ email, password });
  if (signup.data && signup.data.session) {
    issueSession(res, {
      accessToken: signup.data.session.access_token,
      refreshToken: signup.data.session.refresh_token
    });
    return res.status(201).json({ success: true, demo: true, customer: { email: signup.data.session.user.email || email } });
  }
  const message = friendlyAuthError(signup.error, "Unable to sign into the demo account");
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

const HANDLERS = {
  conversations: conversationsHandler,
  demo: demoSignInHandler,
  login: loginHandler,
  logout: logoutHandler,
  messages: messagesHandler,
  session: sessionHandler,
  signup: signupHandler
};

module.exports = async function customerRouter(req, res) {
  const pathFromQuery = String(req.query && req.query.path ? req.query.path : "");
  const pathFromUrl = String(req.path || req.url || "").replace(/^\/api\/customer\/?/, "").replace(/^\//, "").split(/[/?]/)[0];
  const path = (pathFromQuery || pathFromUrl || "session").toLowerCase();
  const handler = HANDLERS[path] || HANDLERS.session;

  if (req.method === "POST" && ["signup", "login", "logout", "demo"].includes(path)) {
    return handler(req, res);
  }
  return handler(req, res);
};