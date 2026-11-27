/**
 * 🦅 GARUDA OS — CANONICAL FOUNDER & TENANT AUTHENTICATION HELPERS (PHASE 4 S-08/S-09/S-10)
 * Replaces unauthenticated routes and raw client-header bypasses (`x-garuda-founder-approved`,
 * `x-garuda-test`) with cryptographically resolved `req.garudaContext` enforcement.
 */

const authContextService = require("../services/authContextService");

async function resolveContext(req) {
  if (!req.garudaContext) {
    req.garudaContext = await authContextService.resolveRequestContext(req);
  }
  return req.garudaContext;
}

/**
 * Returns true ONLY if the request passed cryptographic Platform Founder authentication
 * (env FOUNDER_ADMIN_KEY / Bearer secret / HMAC-signed founder cookie).
 * NEVER trusts `x-garuda-founder-approved` or `x-garuda-test` headers.
 */
async function isVerifiedFounderRequest(req) {
  const ctx = await resolveContext(req);
  return Boolean(ctx && ctx.role === "platform_founder" && ctx.isFounderApproved === true);
}

/**
 * Rejects unauthenticated anonymous requests with HTTP 401.
 */
async function requireAuthenticatedContext(req, res, next) {
  try {
    const ctx = await resolveContext(req);
    if (!ctx || ctx.actorType === "anonymous") {
      return res.status(401).json({
        success: false,
        error: "AUTHENTICATION_REQUIRED",
        message: "Verified tenant or founder authentication is required."
      });
    }
    return next();
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Rejects any caller who is not cryptographically authenticated as Platform Founder (HTTP 403).
 */
async function requireFounderContext(req, res, next) {
  try {
    const isFounder = await isVerifiedFounderRequest(req);
    if (!isFounder) {
      return res.status(403).json({
        success: false,
        error: "FOUNDER_AUTHORIZATION_REQUIRED",
        message: "Strict Platform Founder authentication required."
      });
    }
    return next();
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  resolveContext,
  isVerifiedFounderRequest,
  requireAuthenticatedContext,
  requireFounderContext
};
