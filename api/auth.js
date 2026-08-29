const crypto = require("crypto");
const { promisify } = require("util");
const mongoose = require("mongoose");
const scrypt = promisify(crypto.scrypt);

const COOKIE_NAME = "garuda_founder_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;
const COLLECTION_NAME = "garuda_founder_secret";
const KIND = "founder_access";

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
  if (!process.env.FOUNDER_SESSION_SECRET) return false;
  const [expiresAt, signature] = cookieValue(req, COOKIE_NAME).split(".");
  if (!expiresAt || !signature || Number(expiresAt) < Date.now()) return false;
  return safeEqual(signature, sign(expiresAt));
}

async function connectCredentialStore() {
  if (!process.env.MONGODB_URI) return false;
  if (mongoose.connection.readyState === 1) return true;
  if (!global.garudaFounderCredentialConnection) {
    global.garudaFounderCredentialConnection = mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });
  }
  try {
    await global.garudaFounderCredentialConnection;
    return true;
  } catch {
    return false;
  }
}

async function getSecretDoc() {
  const connected = await connectCredentialStore();
  if (!connected) return null;
  const collection = mongoose.connection.db.collection(COLLECTION_NAME);
  return collection.findOne({ kind: KIND });
}

async function passwordMatches(password) {
  const doc = await getSecretDoc();
  if (!doc) return false;
  try {
    const hash = await scrypt(String(password || ""), doc.passwordSalt, 64);
    return crypto.timingSafeEqual(hash, Buffer.from(doc.passwordHash, "base64url"));
  } catch {
    return false;
  }
}

async function setFounderPassword(password) {
  const connected = await connectCredentialStore();
  if (!connected) return { stored: false, message: "MongoDB is not configured for founder credential storage" };
  if (typeof password !== "string" || password.length < 12) {
    return { stored: false, message: "Password must be at least 12 characters" };
  }
  const passwordSalt = crypto.randomBytes(16).toString("base64url");
  const passwordHash = (await scrypt(password, passwordSalt, 64)).toString("base64url");
  const collection = mongoose.connection.db.collection(COLLECTION_NAME);
  await collection.updateOne(
    { kind: KIND },
    { $set: { passwordHash, passwordSalt, updatedAt: new Date().toISOString() } },
    { upsert: true }
  );
  return { stored: true };
}

async function loginHandler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ success: false, message: "Method not allowed" });
  const password = String(req.body?.password || "");
  const mongoReady = Boolean(process.env.MONGODB_URI);
  const envConfigured = Boolean(process.env.FOUNDER_ACCESS_PASSWORD && process.env.FOUNDER_SESSION_SECRET);
  if (!mongoReady && !envConfigured) return res.status(503).json({ success: false, message: "Founder access is not configured" });

  let accepted = false;
  if (mongoReady) accepted = await passwordMatches(password);
  if (!accepted && envConfigured) accepted = safeEqual(password, process.env.FOUNDER_ACCESS_PASSWORD);
  if (!accepted) return res.status(401).json({ success: false, message: "Invalid founder password" });

  issueSession(res);
  return res.status(200).json({ success: true });
}

function sessionHandler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ success: false, message: "Method not allowed" });
  return res.status(200).json({ authenticated: hasValidSession(req) });
}

function logoutHandler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ success: false, message: "Method not allowed" });
  clearSession(res);
  return res.status(200).json({ success: true });
}

function statusHandler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ success: false, message: "Method not allowed" });
  return res.status(200).json({
    success: true,
    authenticated: hasValidSession(req),
    mode: "password",
    config: {
      loginEndpoint: "/api/auth/login",
      sessionEndpoint: "/api/auth/session",
      managementEndpoint: "/api/auth/manage-password"
    }
  });
}

async function managePasswordHandler(req, res) {
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

  clearSession(res);
  return res.status(200).json({ success: true, message: "Founder password updated. Sign in again with the new password.", action });
}

const HANDLERS = {
  login: loginHandler,
  session: sessionHandler,
  logout: logoutHandler,
  status: statusHandler,
  "manage-password": managePasswordHandler
};

module.exports = async function authRouter(req, res) {
  const pathFromQuery = String(req.query && req.query.path ? req.query.path : "");
  const pathFromUrl = String(req.path || req.url || "").replace(/^\/api\/auth\/?/, "").replace(/^\//, "").split(/[/?]/)[0];
  const path = (pathFromQuery || pathFromUrl || "session").toLowerCase();
  const handler = HANDLERS[path] || HANDLERS.session;
  return handler(req, res);
};