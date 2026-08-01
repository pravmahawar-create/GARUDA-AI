const crypto = require("crypto");
const { promisify } = require("util");
const mongoose = require("mongoose");
const scrypt = promisify(crypto.scrypt);
const COOKIE_NAME = "garuda_customer_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const customerSchema = new mongoose.Schema({ email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true }, passwordHash: { type: String, required: true }, passwordSalt: { type: String, required: true } }, { timestamps: true });
const Customer = mongoose.models.GarudaCustomer || mongoose.model("GarudaCustomer", customerSchema);
async function connectCustomerStore() { if (!process.env.MONGODB_URI) throw new Error("Customer authentication is not configured"); if (mongoose.connection.readyState === 1) return; if (!global.garudaCustomerConnection) global.garudaCustomerConnection = mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 }); await global.garudaCustomerConnection; }
function normalizeEmail(value) { const email = String(value || "").trim().toLowerCase(); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Enter a valid email address"); return email; }
function validatePassword(value) { const password = String(value || ""); if (password.length < 12) throw new Error("Password must be at least 12 characters"); if (password.length > 128) throw new Error("Password is too long"); return password; }
async function passwordRecord(password) { const passwordSalt = crypto.randomBytes(16).toString("base64url"); const passwordHash = (await scrypt(password, passwordSalt, 64)).toString("base64url"); return { passwordSalt, passwordHash }; }
async function passwordMatches(password, customer) { const hash = await scrypt(String(password || ""), customer.passwordSalt, 64); return crypto.timingSafeEqual(hash, Buffer.from(customer.passwordHash, "base64url")); }
function cookieValue(req) { const cookie = String(req.headers.cookie || "").split(";").find((value) => value.trim().startsWith(`${COOKIE_NAME}=`)); return cookie ? decodeURIComponent(cookie.trim().slice(COOKIE_NAME.length + 1)) : ""; }
function sign(value) { return crypto.createHmac("sha256", process.env.CUSTOMER_SESSION_SECRET).update(value).digest("base64url"); }
function issueSession(res, customerId) { if (!process.env.CUSTOMER_SESSION_SECRET) throw new Error("Customer authentication is not configured"); const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000; const value = `${customerId}:${expiresAt}`; res.setHeader("Set-Cookie", `${COOKIE_NAME}=${encodeURIComponent(`${value}.${sign(value)}`)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_MAX_AGE_SECONDS}`); }
function clearSession(res) { res.setHeader("Set-Cookie", `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`); }
async function currentCustomer(req) { if (!process.env.CUSTOMER_SESSION_SECRET) return null; const [customerId, expiresAt, signature] = cookieValue(req).split(/[.:]/); const value = customerId && expiresAt ? `${customerId}:${expiresAt}` : ""; if (!value || !signature || Number(expiresAt) < Date.now()) return null; const expected = sign(value); if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null; await connectCustomerStore(); return Customer.findById(customerId).select("email createdAt").lean(); }
module.exports = { Customer, clearSession, connectCustomerStore, currentCustomer, issueSession, normalizeEmail, passwordMatches, passwordRecord, validatePassword };
