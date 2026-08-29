/**
 * 🦅 GARUDA Growth OS — Canonical Shared Contracts & Types
 * Phase 1, 2, 3, 4 & Creative Activation Shared Architecture
 *
 * Central repository for all canonical contracts across Creative Generation,
 * IdentityLock™, Image/Video Generation, Performance Marketing, and Client Onboarding.
 *
 * Enforces strict provider lifecycle states:
 * REQUESTED -> QUEUED -> PROCESSING -> GENERATED -> VALIDATING -> READY
 * Failures: FAILED | PROVIDER_UNAVAILABLE
 *
 * Provider Health Statuses:
 * READY | NOT_CONFIGURED | UNREACHABLE | AUTH_FAILED | RATE_LIMITED | UNSUPPORTED
 *
 * Generation Output Classifications:
 * REAL_AI_IMAGE | VECTOR_CREATIVE | PROVIDER_UNAVAILABLE | GENERATION_FAILED |
 * PRODUCTION_PROMPT_READY | VECTOR_CREATIVE_READY
 *
 * Doctrine: UNAVAILABLE !== 0. NEVER COLLAPSE STATES.
 */

const crypto = require("crypto");

/**
 * Canonical Provider Lifecycle States
 */
const PROVIDER_LIFECYCLE_STATES = Object.freeze({
  REQUESTED: "REQUESTED",
  QUEUED: "QUEUED",
  PROCESSING: "PROCESSING",
  GENERATED: "GENERATED",
  VALIDATING: "VALIDATING",
  READY: "READY",
  FAILED: "FAILED",
  PROVIDER_UNAVAILABLE: "PROVIDER_UNAVAILABLE"
});

/**
 * Canonical Provider Health Statuses
 */
const PROVIDER_HEALTH_STATUSES = Object.freeze({
  READY: "READY",
  NOT_CONFIGURED: "NOT_CONFIGURED",
  UNREACHABLE: "UNREACHABLE",
  AUTH_FAILED: "AUTH_FAILED",
  RATE_LIMITED: "RATE_LIMITED",
  UNSUPPORTED: "UNSUPPORTED"
});

/**
 * Canonical Generation Output Classifications
 */
const GENERATION_OUTPUT_TYPES = Object.freeze({
  REAL_AI_IMAGE: "REAL_AI_IMAGE",
  VECTOR_CREATIVE: "VECTOR_CREATIVE",
  PROVIDER_UNAVAILABLE: "PROVIDER_UNAVAILABLE",
  GENERATION_FAILED: "GENERATION_FAILED",
  PRODUCTION_PROMPT_READY: "PRODUCTION_PROMPT_READY",
  VECTOR_CREATIVE_READY: "VECTOR_CREATIVE_READY"
});

/**
 * Metric Truth Classifications
 */
const METRIC_TRUTH_CLASSIFICATIONS = Object.freeze({
  AUTHORITATIVE_PLATFORM_DATA: "AUTHORITATIVE_PLATFORM_DATA",
  AUTHORITATIVE_INTERNAL_DATA: "AUTHORITATIVE_INTERNAL_DATA",
  DERIVED: "DERIVED",
  UNAVAILABLE: "UNAVAILABLE",
  UNKNOWN: "UNKNOWN"
});

/**
 * Client Onboarding Readiness Categories
 */
const ONBOARDING_READINESS_CATEGORIES = Object.freeze({
  BUSINESS_PROFILE_READY: "BUSINESS_PROFILE_READY",
  BRAND_PROFILE_READY: "BRAND_PROFILE_READY",
  PROJECT_DATA_READY: "PROJECT_DATA_READY",
  CREATIVE_READY: "CREATIVE_READY",
  LANDING_PAGE_READY: "LANDING_PAGE_READY",
  TRACKING_READY: "TRACKING_READY",
  AD_PLATFORM_READY: "AD_PLATFORM_READY",
  CAMPAIGN_LAUNCH_READY: "CAMPAIGN_LAUNCH_READY"
});

/**
 * Helper to create a canonical CreativeGenerationJob.
 */
function createCreativeGenerationJob({
  jobId = null,
  briefId = null,
  campaignId = null,
  type = "IMAGE", // IMAGE | VIDEO | VECTOR
  mode = "SOVEREIGN_LAYOUT", // SOVEREIGN_LAYOUT | AI_PHOTOREALISTIC | CINEMATIC_STORYBOARD | AI_VIDEO
  provider = null,
  requestSpec = {},
  status = PROVIDER_LIFECYCLE_STATES.REQUESTED
} = {}) {
  return {
    jobId: jobId || `job_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`,
    briefId,
    campaignId,
    type,
    mode,
    provider,
    requestSpec,
    status,
    progressPercent: status === PROVIDER_LIFECYCLE_STATES.READY ? 100 : 0,
    artifact: null,
    error: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

/**
 * Helper to format a canonical CreativeAsset.
 */
function createCreativeAsset({
  assetId = null,
  jobId = null,
  briefId = null,
  campaignId = null,
  projectId = null,
  title = "Creative Asset",
  format = "SVG_VECTOR_LAYOUT", // SVG_VECTOR_LAYOUT | IMAGE_PNG | IMAGE_JPEG | VIDEO_MP4 | STORYBOARD_BLUEPRINT
  classification = "VECTOR_CREATIVE", // REAL_AI_IMAGE | VECTOR_CREATIVE | PROVIDER_UNAVAILABLE
  mimeType = "image/svg+xml",
  dimensions = { width: 1080, height: 1080 },
  aspectRatio = "1:1",
  fileName = "",
  filePath = "",
  fileSize = 0,
  assetUrl = "",
  assetHash = "",
  provider = "garuda_sovereign_svg_renderer",
  status = "GENERATED",
  identityLock = null,
  qualityValidation = null
} = {}) {
  return {
    assetId: assetId || `asset_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`,
    jobId,
    briefId,
    campaignId,
    projectId,
    title,
    format,
    classification,
    mimeType,
    dimensions,
    aspectRatio,
    fileName,
    filePath,
    fileSize,
    assetUrl,
    assetHash,
    provider,
    status,
    identityLock: identityLock || {},
    qualityValidation: qualityValidation || null,
    generatedAt: new Date().toISOString()
  };
}

module.exports = {
  PROVIDER_LIFECYCLE_STATES,
  PROVIDER_HEALTH_STATUSES,
  GENERATION_OUTPUT_TYPES,
  METRIC_TRUTH_CLASSIFICATIONS,
  ONBOARDING_READINESS_CATEGORIES,
  createCreativeGenerationJob,
  createCreativeAsset
};
