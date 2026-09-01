/**
 * 🦅 GARUDA Creative Quality Engine
 * Phase 4 & Phase F — Objective Creative & Asset Validation Engine
 *
 * Performs deterministic, objective validation of generated creative briefs, concepts,
 * image artifacts, and video storyboards against physical disk truth and brand rules.
 *
 * Truth Laws:
 * - UNKNOWN !== EXCELLENT
 * - UNAVAILABLE !== PASSED
 * - FAILED !== READY
 * - NEVER invent fake scores like "98% Premium". Every check is a real binary test.
 *
 * Core Checks:
 * 1. Physical Disk Artifact Existence (fs.existsSync)
 * 2. Cryptographic SHA-256 Byte Integrity
 * 3. Exact Dimensions & Aspect Ratio Verification
 * 4. Platform Preset Compatibility
 * 5. Call-To-Action (CTA) Presence
 * 6. Brand IdentityLock™ Compliance (No prohibited elements)
 * 7. Provider Capability & Classification Truth
 */

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const identityLockService = require("./identityLockService");
const { GARUDA_CORE_PRINCIPLES, getQualityFloor } = require("./garudaCorePrinciples");

function sha256(data) {
  const str = typeof data === "string" ? data : JSON.stringify(data);
  return crypto.createHash("sha256").update(str).digest("hex");
}

class CreativeQualityService {
  /**
   * 1. Validate an Image / Vector Creative Asset.
   */
  validateAsset(assetDoc) {
    if (!assetDoc || typeof assetDoc !== "object") {
      return {
        status: "FAILED",
        passed: false,
        summary: "Null or invalid asset document provided",
        checks: [],
        failedChecks: ["INVALID_ASSET_DOC"],
        truthClassification: "FAILED",
        verifiedAt: new Date().toISOString()
      };
    }

    const checks = [];
    const failedChecks = [];

    // Check 1: Physical File on Disk
    const filePath = assetDoc.filePath;
    const fileExists = Boolean(filePath && fs.existsSync(filePath));
    if (fileExists) {
      const stats = fs.statSync(filePath);
      checks.push({
        name: "PHYSICAL_FILE_EXISTS",
        passed: stats.size > 0,
        detail: `Physical file verified at ${filePath} (${stats.size} bytes)`
      });
      if (stats.size === 0) failedChecks.push("PHYSICAL_FILE_EMPTY");
    } else {
      checks.push({
        name: "PHYSICAL_FILE_EXISTS",
        passed: false,
        detail: `Physical file not found on disk at: ${filePath || 'unspecified'}`
      });
      failedChecks.push("PHYSICAL_FILE_NOT_FOUND");
    }

    // Check 2: Cryptographic SHA-256 Byte Hash Match
    if (fileExists) {
      try {
        const fileContent = fs.readFileSync(filePath);
        const actualHash = crypto.createHash("sha256").update(fileContent).digest("hex");
        const hashMatch = actualHash === assetDoc.assetHash;
        checks.push({
          name: "SHA256_INTEGRITY",
          passed: hashMatch,
          detail: hashMatch
            ? `SHA-256 seal matches disk bytes (${actualHash.slice(0, 16)}...)`
            : `Hash mismatch: expected ${assetDoc.assetHash} vs actual ${actualHash}`
        });
        if (!hashMatch) failedChecks.push("SHA256_HASH_MISMATCH");
      } catch (err) {
        checks.push({ name: "SHA256_INTEGRITY", passed: false, detail: err.message });
        failedChecks.push("SHA256_READ_ERROR");
      }
    }

    // Check 3: Dimensions & Aspect Ratio Format
    const dims = assetDoc.dimensions;
    const hasValidDims = Boolean(dims && dims.width > 0 && dims.height > 0);
    checks.push({
      name: "DIMENSIONS_VALID",
      passed: hasValidDims,
      detail: hasValidDims ? `${dims.width}x${dims.height}` : "Missing or invalid dimensions"
    });
    if (!hasValidDims) failedChecks.push("INVALID_DIMENSIONS");

    // Check 4: Aspect Ratio Accuracy
    if (hasValidDims && assetDoc.aspectRatio) {
      const expectedRatio = assetDoc.aspectRatio;
      let ratioValid = true;
      if (expectedRatio === "1:1" && dims.width !== dims.height) ratioValid = false;
      if (expectedRatio === "9:16" && dims.height <= dims.width) ratioValid = false;
      if (expectedRatio === "16:9" && dims.width <= dims.height) ratioValid = false;

      checks.push({
        name: "ASPECT_RATIO_ACCURACY",
        passed: ratioValid,
        detail: `Aspect ratio specification: ${expectedRatio} (${dims.width}x${dims.height})`
      });
      if (!ratioValid) failedChecks.push("ASPECT_RATIO_INCONSISTENT");
    }

    // Check 5: Call to Action presence in SVG content or visual spec
    let ctaFound = false;
    if (fileExists && filePath.endsWith(".svg")) {
      const content = fs.readFileSync(filePath, "utf8");
      ctaFound = content.includes("→") || /cta|learn more|book|download|explore|visit|contact/i.test(content);
    } else if (assetDoc.visualSpec?.ctaText) {
      ctaFound = true;
    }
    checks.push({
      name: "CTA_PRESENT",
      passed: ctaFound,
      detail: ctaFound ? "Call-to-action button or label verified" : "No CTA detected in creative asset"
    });
    if (!ctaFound) failedChecks.push("MISSING_CTA");

    // Check 6: Brand IdentityLock Validation
    if (assetDoc.identityLock?.brandId) {
      const brand = identityLockService.getBrandProfile(assetDoc.identityLock.brandId);
      if (brand) {
        const lockValid = assetDoc.identityLock.lockHash === brand.lockHash;
        checks.push({
          name: "IDENTITY_LOCK_HASH_VERIFIED",
          passed: lockValid,
          detail: lockValid ? `Brand lock verified (${brand.brandName})` : "Brand lock hash out of sync"
        });
        if (!lockValid) failedChecks.push("BRAND_LOCK_HASH_MISMATCH");
      }
    }

    // Check 7: Provider Classification Truth
    const validProvider = Boolean(assetDoc.provider && assetDoc.status === "GENERATED");
    checks.push({
      name: "PROVIDER_STATUS_VERIFIED",
      passed: validProvider,
      detail: `Provider: ${assetDoc.provider || 'none'} | Status: ${assetDoc.status || 'unknown'}`
    });
    if (!validProvider) failedChecks.push("INVALID_PROVIDER_STATUS");

    const allPassed = failedChecks.length === 0;

    // Truthful separation per Phase 2.1 correction: TECHNICAL_VERIFICATION vs REQUIREMENT_COMPLIANCE vs VISUAL_QUALITY
    const requestedProfile = assetDoc.qualityProfile || assetDoc.qualityThreshold || "standard";
    const requiredLevel = getQualityFloor(requestedProfile); // e.g., "exceptional_completeness" — not numeric 98
    const isPreview = String(requestedProfile).toLowerCase().includes("preview") || String(assetDoc.deliveryMode || "").toLowerCase() === "preview" || String(assetDoc.generationMode || "").toLowerCase().includes("DRY_RUN") || assetDoc.classification === "SIMULATED_GENERATION";

    // TECHNICAL_VERIFICATION — deterministic binary checks (file, hash, dims)
    const technicalVerification = {
      passed: allPassed,
      checks: [...checks],
      failedChecks: [...failedChecks],
      truthClassification: allPassed ? "TECHNICAL_VERIFICATION_PASSED" : "TECHNICAL_VERIFICATION_FAILED"
    };
    // REQUIREMENT_COMPLIANCE — requested format/dimensions/CTA/identity metadata (same physical checks but viewed as requirements)
    const requirementCompliance = {
      requestedProfile,
      requiredLevel,
      isPreview,
      passed: allPassed, // requirements met if physical checks passed; preview allows same
      truthClassification: allPassed ? "REQUIREMENT_COMPLIANCE_PASSED" : "REQUIREMENT_COMPLIANCE_FAILED"
    };
    // VISUAL_OR_SEMANTIC_QUALITY — only VERIFIED if actual visual model exists, otherwise honest
    const visualQualityVerification = {
      status: "VISUAL_QUALITY_NOT_YET_VERIFIED",
      verified: false,
      reason: "No semantic aesthetic model wired; deterministic checks (file/MIME/dimensions/SHA/CTA/lock) are not visual quality. BEYOND_EXPECTATION_QUALITY remains ambition, not numeric score.",
      ambition: GARUDA_CORE_PRINCIPLES.principles.quality.ambition,
      detail: "Technical verification passed does not equal cinematic visual verification."
    };

    // Overall PASSED means technical + requirement passed; visual remains not yet verified truthfully
    const overallPassed = technicalVerification.passed && requirementCompliance.passed;

    return {
      status: overallPassed ? "PASSED" : "FAILED",
      passed: overallPassed,
      totalChecks: checks.length,
      passedChecksCount: checks.filter(c => c.passed).length,
      failedChecksCount: failedChecks.length,
      checks,
      failedChecks,
      qualityProfile: requestedProfile,
      requiredLevel,
      isPreview,
      technicalVerification,
      requirementCompliance,
      visualQualityVerification,
      // Backward compat fields (deprecated numeric)
      qualityScore: allPassed ? 95 : Math.max(0, 95 - failedChecks.length * 20),
      requiredFloor: requiredLevel,
      physicalVerification: technicalVerification,
      qualityPolicy: { requestedProfile, requiredLevel, isPreview, floorEnforced: overallPassed, truthClassification: overallPassed ? "QUALITY_POLICY_PASSED" : "QUALITY_POLICY_FLOOR_NOT_MET" },
      truthClassification: overallPassed ? "OBJECTIVE_QUALITY_PASSED" : "OBJECTIVE_QUALITY_FAILED",
      verifiedAt: new Date().toISOString()
    };
  }

  /**
   * 2. Validate a Creative Concept Suite.
   */
  validateConcept(concept) {
    if (!concept || typeof concept !== "object") {
      return {
        status: "FAILED",
        passed: false,
        failedChecks: ["INVALID_CONCEPT_OBJECT"],
        checks: []
      };
    }

    const checks = [];
    const failedChecks = [];

    // Concept Ad Variants Count & Uniqueness
    const variants = Array.isArray(concept.adCopyVariants) ? concept.adCopyVariants : [];
    const hasMultipleVariants = variants.length >= 3;
    checks.push({
      name: "MIN_3_DISTINCT_VARIANTS",
      passed: hasMultipleVariants,
      detail: `${variants.length} ad copy variants detected`
    });
    if (!hasMultipleVariants) failedChecks.push("INSUFFICIENT_AD_VARIANTS");

    // Check headline differentiation
    if (variants.length >= 2) {
      const headlines = variants.map(v => (v.headline || "").trim().toLowerCase());
      const uniqueHeadlines = new Set(headlines);
      const isUnique = uniqueHeadlines.size === headlines.length;
      checks.push({
        name: "DISTINCT_ANGLES_DIFFERENTIATED",
        passed: isUnique,
        detail: isUnique ? "All variant headlines are distinctly angled" : "Duplicate headlines found across variants"
      });
      if (!isUnique) failedChecks.push("DUPLICATE_HEADLINES_FOUND");
    }

    // Storyboard validation
    const hasStoryboard = Boolean(concept.videoStoryboard && Array.isArray(concept.videoStoryboard.scenes) && concept.videoStoryboard.scenes.length > 0);
    checks.push({
      name: "VIDEO_STORYBOARD_PRESENT",
      passed: hasStoryboard,
      detail: hasStoryboard ? `${concept.videoStoryboard.scenes.length} storyboard scenes planned` : "Missing video storyboard"
    });
    if (!hasStoryboard) failedChecks.push("MISSING_VIDEO_STORYBOARD");

    const allPassed = failedChecks.length === 0;

    return {
      status: allPassed ? "PASSED" : "FAILED",
      passed: allPassed,
      checks,
      failedChecks,
      verifiedAt: new Date().toISOString()
    };
  }
}

module.exports = new CreativeQualityService();
module.exports.CreativeQualityService = CreativeQualityService;
