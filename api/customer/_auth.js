const { createClient } = require("@supabase/supabase-js");

const COOKIE_NAME = "garuda_customer_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const DEMO_EMAIL = process.env.GARUDA_DEMO_EMAIL || "demo@garudaos.in";
const DEMO_PASSWORD = process.env.GARUDA_DEMO_PASSWORD || "GarudaDemo2026!";
// The Supabase project URL and publishable key are PUBLIC by design (Supabase docs:
// "Publishable keys are safe to expose in a browser"). They act as fallbacks so the
// deployment works out-of-the-box; override them via SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY.
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

// Decode the "sub" claim (the auth.users id) from a Supabase access token JWT.
function authUserId(accessToken) {
  try {
    const payload = String(accessToken || "").split(".")[1];
    if (!payload) return "";
    const json = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return String(json.sub || "");
  } catch {
    return "";
  }
}

// A Supabase client that impersonates the signed-in customer via their access token.
// PostgREST resolves auth.uid() from the Bearer token, so row-level security applies per user.
function authenticatedDbClient(req) {
  const { accessToken } = cookieTokens(req);
  if (!accessToken) return null;
  const { url, key } = supabaseConfig();
  return createClient(String(url).trim(), String(key).trim(), {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } }
  });
}

// auth.users id of the signed-in customer (from the session cookie's access token).
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

function cookieTokens(req) {
  const token = cookieValue(req);
  if (!token) return { accessToken: "", refreshToken: "" };
  const [accessToken, refreshToken] = token.split("~");
  return { accessToken: accessToken || "", refreshToken: refreshToken || "" };
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

module.exports = {
  COOKIE_NAME,
  DEMO_EMAIL,
  DEMO_PASSWORD,
  authUserId,
  authenticatedDbClient,
  authenticatedUserId,
  clearSession,
  cookieTokens,
  currentCustomer,
  friendlyAuthError,
  isSupabaseConfigured,
  issueSession,
  normalizeEmail,
  supabaseAdminClient,
  supabaseClient,
  validatePassword
};