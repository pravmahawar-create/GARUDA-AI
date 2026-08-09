const crypto = require("crypto");
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

function sessionSecret() {
  const secret = process.env.CUSTOMER_SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("Customer sessions are not configured: set CUSTOMER_SESSION_SECRET to a long random value.");
  }
  return secret;
}

function sign(value) {
  return crypto.createHmac("sha256", sessionSecret()).update(value).digest("base64url");
}

function cookieValue(req) {
  const cookie = String(req.headers.cookie || "")
    .split(";")
    .find((value) => value.trim().startsWith(`${COOKIE_NAME}=`));
  return cookie ? decodeURIComponent(cookie.trim().slice(COOKIE_NAME.length + 1)) : "";
}

function issueSession(res, session) {
  const sessionSecretValue = sessionSecret();
  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const emailEncoded = Buffer.from(String(session.email || ""), "utf8").toString("base64url");
  const value = `${session.userId}|${emailEncoded}|${expiresAt}`;
  const token = `${value}.${sign(value)}`;
  res.setHeader("Set-Cookie", `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_MAX_AGE_SECONDS}`);
}

function clearSession(res) {
  res.setHeader("Set-Cookie", `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`);
}

function safeEqual(left, right) {
  const leftHash = crypto.createHash("sha256").update(String(left)).digest();
  const rightHash = crypto.createHash("sha256").update(String(right)).digest();
  return crypto.timingSafeEqual(leftHash, rightHash);
}

async function currentCustomer(req) {
  if (!process.env.CUSTOMER_SESSION_SECRET) return null;
  const token = cookieValue(req);
  if (!token) return null;
  const [value, signature] = token.split(".");
  if (!value || !signature) return null;
  const [userId, emailEncoded, expiresAt] = value.split("|");
  if (!userId || !emailEncoded || !expiresAt || Number(expiresAt) < Date.now()) return null;
  if (!safeEqual(signature, sign(value))) return null;
  const email = Buffer.from(emailEncoded, "base64url").toString("utf8");
  const admin = supabaseAdminClient();
  if (admin) {
    const { data, error } = await admin.auth.admin.getUserById(userId);
    if (error || !data || !data.user) return null;
    return { id: userId, email: data.user.email || email };
  }
  return { id: userId, email };
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
  clearSession,
  currentCustomer,
  friendlyAuthError,
  isSupabaseConfigured,
  issueSession,
  normalizeEmail,
  supabaseAdminClient,
  supabaseClient,
  validatePassword
};