/**
 * 🦅 GARUDA AI — Capability Entitlement Service
 * Phase 1 Foundation — Sovereign Core Entitlement Engine
 *
 * Core Principle:
 * ONE GARUDA CORE. No separate codebase per tier.
 * Capabilities are resolved dynamically based on Plan Tier, Role, and Founder Governance.
 * No scattered `if (plan === 'enterprise')` across business services.
 */

const CANONICAL_PLANS = Object.freeze(["personal", "creator", "sme", "enterprise"]);

const CANONICAL_ROLES = Object.freeze([
  "platform_founder",
  "tenant_admin",
  "tenant_member",
  "tenant_viewer",
  "anonymous_guest"
]);

// 1. Base Anonymous / Public Guest Capabilities
const ANONYMOUS_CAPABILITIES = Object.freeze([
  "public.chat",
  "public.lead_submit",
  "capability.list",
  "capability.summary",
  "health.read"
]);

// 2. Tier Capability Baseline Matrices (Progressive Entitlement Stack)
const PERSONAL_CAPABILITIES = Object.freeze([
  ...ANONYMOUS_CAPABILITIES,
  "knowledge.query",
  "conversation.chat",
  "creative.generate_dry_run",
  "creative.living_artifact_continue",
  "repository.read_audit",
  "proposal.view"
]);

const CREATOR_CAPABILITIES = Object.freeze([
  ...PERSONAL_CAPABILITIES,
  "creative.generate_standard",
  "brand.identity_lock_basic",
  "digital_marketing.content_calendar",
  "seo.keyword_clusters",
  "scout.affiliate_view"
]);

const SME_CAPABILITIES = Object.freeze([
  ...CREATOR_CAPABILITIES,
  "creative.generate_cinematic",
  "real_estate.growth_os",
  "automation.workflow_pipelines",
  "outreach.campaign_draft",
  "billing.invoice_management",
  "tenant.member_management"
]);

const ENTERPRISE_CAPABILITIES = Object.freeze([
  ...SME_CAPABILITIES,
  "enterprise.custom_brain_models",
  "governance.multi_tenant_isolation",
  "outreach.custom_smtp_relay",
  "deployment.air_gapped_profile",
  "audit.immutable_event_ledger"
]);

const TIER_CAPABILITY_MAP = Object.freeze({
  personal: PERSONAL_CAPABILITIES,
  creator: CREATOR_CAPABILITIES,
  sme: SME_CAPABILITIES,
  enterprise: ENTERPRISE_CAPABILITIES
});

const ROLE_ADDITIONAL_CAPABILITIES = Object.freeze({
  tenant_admin: [
    "tenant.admin_settings",
    "tenant.member_invite",
    "tenant.member_revoke",
    "tenant.usage_view"
  ],
  tenant_member: [],
  tenant_viewer: [],
  anonymous_guest: []
});

/**
 * Returns canonical product tiers.
 */
function getCanonicalTiers() {
  return [...CANONICAL_PLANS];
}

/**
 * Returns canonical tenant roles.
 */
function getCanonicalRoles() {
  return [...CANONICAL_ROLES];
}

/**
 * Resolves a normalized, unique list of capability strings granted to an actor.
 *
 * @param {string} plan - 'personal' | 'creator' | 'sme' | 'enterprise'
 * @param {string} role - 'platform_founder' | 'tenant_admin' | 'tenant_member' | 'tenant_viewer' | 'anonymous_guest'
 * @param {Object} [options]
 * @returns {string[]} Resolved capability list
 */
function resolveCapabilities(plan = "personal", role = "anonymous_guest", options = {}) {
  const cleanRole = String(role || "anonymous_guest").toLowerCase();
  const cleanPlan = String(plan || "personal").toLowerCase();

  // Founder has unconditional sovereign wildcard
  if (cleanRole === "platform_founder" || options.isFounderApproved === true) {
    return ["*"];
  }

  // Unauthenticated or guest callers only get public surface
  if (cleanRole === "anonymous_guest" || cleanPlan === "anonymous") {
    return [...ANONYMOUS_CAPABILITIES];
  }

  const baseCapabilities = TIER_CAPABILITY_MAP[cleanPlan] || TIER_CAPABILITY_MAP.personal;
  const roleBonus = ROLE_ADDITIONAL_CAPABILITIES[cleanRole] || [];

  // Tenant viewer is read-restricted
  if (cleanRole === "tenant_viewer") {
    const viewerAllowed = baseCapabilities.filter((c) =>
      c.endsWith(".view") || c.endsWith(".read") || c.endsWith(".query") || c.endsWith(".list") || c.endsWith(".summary")
    );
    return Array.from(new Set([...ANONYMOUS_CAPABILITIES, ...viewerAllowed]));
  }

  return Array.from(new Set([...baseCapabilities, ...roleBonus]));
}

/**
 * Checks if a given request context possesses a required capability.
 *
 * @param {Object} context - GarudaRequestContext
 * @param {string} capabilityId - e.g. 'creative.generate_cinematic'
 * @returns {boolean}
 */
function hasCapability(context, capabilityId) {
  if (!context || !capabilityId) return false;

  const target = String(capabilityId).trim().toLowerCase();

  // 1. Platform founder checks
  if (
    context.role === "platform_founder" ||
    (context.actorType === "founder" && context.isFounderApproved === true)
  ) {
    return true;
  }

  const capabilities = Array.isArray(context.capabilities) ? context.capabilities : [];

  // 2. Exact match or wildcard in capabilities array
  if (capabilities.includes("*") || capabilities.includes(target)) {
    return true;
  }

  // 3. Namespace wildcard matching (e.g., 'creative.*' matches 'creative.generate_dry_run')
  for (const cap of capabilities) {
    if (cap.endsWith(".*")) {
      const prefix = cap.slice(0, -2);
      if (target.startsWith(prefix + ".")) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Returns structured entitlement telemetry for an active request context.
 *
 * @param {Object} context - GarudaRequestContext
 * @returns {Object}
 */
function getEntitlements(context = {}) {
  const plan = context.plan || "personal";
  const role = context.role || "anonymous_guest";
  const capabilities = Array.isArray(context.capabilities) ? context.capabilities : [];
  const isWildcard = capabilities.includes("*") || role === "platform_founder";

  return {
    plan,
    role,
    isWildcard,
    totalCapabilitiesGranted: isWildcard ? "ALL" : capabilities.length,
    capabilities: isWildcard ? ["*"] : capabilities,
    actorType: context.actorType || "anonymous"
  };
}

/**
 * Evaluates whether access should be granted and produces structured reasoning.
 *
 * @param {Object} context - GarudaRequestContext
 * @param {string} capabilityId
 * @returns {{ granted: boolean, code?: string, message?: string }}
 */
function validateCapabilityAccess(context, capabilityId) {
  if (!capabilityId) {
    return { granted: false, code: "CAPABILITY_ID_REQUIRED", message: "Capability ID is required" };
  }

  const granted = hasCapability(context, capabilityId);
  if (granted) {
    return { granted: true };
  }

  const plan = context?.plan || "personal";
  const role = context?.role || "anonymous_guest";

  return {
    granted: false,
    code: "CAPABILITY_ENTITLEMENT_REQUIRED",
    message: `Access denied. Actor with plan [${plan}] and role [${role}] lacks required capability: [${capabilityId}].`,
    requiredCapability: capabilityId,
    currentPlan: plan,
    currentRole: role
  };
}

module.exports = {
  ANONYMOUS_CAPABILITIES,
  CANONICAL_PLANS,
  CANONICAL_ROLES,
  CREATOR_CAPABILITIES,
  ENTERPRISE_CAPABILITIES,
  PERSONAL_CAPABILITIES,
  SME_CAPABILITIES,
  TIER_CAPABILITY_MAP,
  getCanonicalRoles,
  getCanonicalTiers,
  getEntitlements,
  hasCapability,
  resolveCapabilities,
  validateCapabilityAccess
};
