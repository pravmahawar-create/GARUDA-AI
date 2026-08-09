const crypto = require("crypto");

const COOKIE_NAME = "garuda_founder_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

function cookieValue(req, name) {
  const cookie = String(req.headers.cookie || "").split(";").find((value) => value.trim().startsWith(`${name}=`));
  return cookie ? decodeURIComponent(cookie.trim().slice(name.length + 1)) : "";
}

function sign(value) {
  return crypto.createHmac("sha256", process.env.FOUNDER_SESSION_SECRET).update(value).digest("base64url");
}

function safeEqual(left, right) {
  const leftHash = crypto.createHash("sha256").update(String(left)).digest();
  const rightHash = crypto.createHash("sha256").update(String(right)).digest();
  return crypto.timingSafeEqual(leftHash, rightHash);
}

function isConfigured() {
  return Boolean(process.env.FOUNDER_SESSION_SECRET);
}

function issueSession(res) {
  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const value = String(expiresAt);
  const token = `${value}.${sign(value)}`;
  res.setHeader("Set-Cookie", `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_MAX_AGE_SECONDS}`);
}

function clearSession(res) {
  res.setHeader("Set-Cookie", `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`);
}

function hasValidSession(req) {
  if (!isConfigured()) return false;
  const [expiresAt, signature] = cookieValue(req, COOKIE_NAME).split(".");
  if (!expiresAt || !signature || Number(expiresAt) < Date.now()) return false;
  return safeEqual(signature, sign(expiresAt));
}

module.exports = { clearSession, hasValidSession, isConfigured, issueSession, safeEqual };
