/**
 * 🦅 GARUDA AI — Capability Gate Middleware
 * Phase 1 Foundation — Route-Level Capability Enforcement
 *
 * Enforces:
 * 1. Actor holds required capability entitlement for their Plan/Role.
 * 2. No scattered `if (plan === 'enterprise')` in business logic.
 * 3. Platform founder wildcard bypass.
 */

const capabilityEntitlementService = require("../services/capabilityEntitlementService");
const authContextService = require("../services/authContextService");

/**
 * Creates an Express middleware enforcing that the caller has the required capability.
 *
 * @param {string} capabilityId - e.g. 'creative.generate_cinematic'
 * @returns {Function} Express middleware (req, res, next)
 */
function requireCapability(capabilityId) {
  return async function capabilityGate(req, res, next) {
    try {
      let context = req.garudaContext;
      if (!context) {
        context = await authContextService.resolveRequestContext(req);
        req.garudaContext = context;
      }

      const validation = capabilityEntitlementService.validateCapabilityAccess(context, capabilityId);
      if (validation.granted) {
        return next();
      }

      const status = context.actorType === "anonymous" ? 401 : 403;
      return res.status(status).json({
        success: false,
        error: {
          code: validation.code || "CAPABILITY_ENTITLEMENT_REQUIRED",
          message: validation.message,
          requiredCapability: capabilityId,
          currentPlan: validation.currentPlan,
          currentRole: validation.currentRole,
          actorType: context.actorType
        }
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: {
          code: "CAPABILITY_EVALUATION_ERROR",
          message: error.message || "Failed to evaluate capability entitlement"
        }
      });
    }
  };
}

/**
 * Creates an Express middleware enforcing that the caller is either a Platform Founder or Tenant Admin.
 */
function requireFounderOrAdmin(capabilityId = null) {
  return async function founderOrAdminGate(req, res, next) {
    try {
      let context = req.garudaContext;
      if (!context) {
        context = await authContextService.resolveRequestContext(req);
        req.garudaContext = context;
      }

      const isFounder = context.role === "platform_founder" || context.isFounderApproved === true;
      const isAdmin = context.role === "tenant_admin";

      if (isFounder || isAdmin) {
        if (capabilityId) {
          const validation = capabilityEntitlementService.validateCapabilityAccess(context, capabilityId);
          if (!validation.granted) {
            return res.status(403).json({
              success: false,
              error: {
                code: "CAPABILITY_ENTITLEMENT_REQUIRED",
                message: validation.message,
                requiredCapability: capabilityId
              }
            });
          }
        }
        return next();
      }

      return res.status(403).json({
        success: false,
        error: {
          code: "ADMIN_PRIVILEGE_REQUIRED",
          message: "Operation requires Tenant Admin or Platform Founder privileges.",
          currentRole: context.role
        }
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: {
          code: "AUTHORIZATION_EVALUATION_ERROR",
          message: error.message || "Failed to evaluate authorization"
        }
      });
    }
  };
}

module.exports = {
  requireCapability,
  requireFounderOrAdmin
};
