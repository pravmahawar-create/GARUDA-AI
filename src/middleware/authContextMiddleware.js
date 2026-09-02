/**
 * 🦅 GARUDA AI — Request Context Middleware
 * Phase 1 Foundation — Global Canonical Context Injector
 *
 * Attaches verified req.garudaContext to every incoming Express request.
 */

const authContextService = require("../services/authContextService");

async function authContextMiddleware(req, res, next) {
  try {
    const context = await authContextService.resolveRequestContext(req);
    req.garudaContext = context;
    if (res && res.locals) {
      res.locals.garudaContext = context;
    }
    // Set tracing header on response
    if (res && typeof res.setHeader === "function" && context.requestId) {
      res.setHeader("X-Request-Id", context.requestId);
    }
    next();
  } catch (error) {
    // Fail-safe: fallback to restricted anonymous guest rather than crashing
    const fallbackContext = {
      requestId: authContextService.generateRequestId(),
      actorType: "anonymous",
      actorId: "anon_guest",
      userId: null,
      tenantId: "tenant_public_guest",
      role: "anonymous_guest",
      plan: "personal",
      deploymentProfile: authContextService.resolveDeploymentProfile(),
      capabilities: ["public.chat", "public.lead_submit", "capability.list", "health.read"],
      isFounderApproved: false,
      metadata: {}
    };
    req.garudaContext = fallbackContext;
    if (res && res.locals) {
      res.locals.garudaContext = fallbackContext;
    }
    next();
  }
}

module.exports = authContextMiddleware;
