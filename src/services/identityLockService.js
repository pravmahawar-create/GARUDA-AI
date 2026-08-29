/**
 * 🦅 GARUDA IdentityLock™ Service
 * Phase 4 & 5 — Brand Intelligence Profiles & Brand Consistency Engine
 *
 * Enforces brand governance, design tokens, typography, tone of voice,
 * and negative constraints across all generated creative concepts and assets.
 *
 * Core Capabilities:
 * - Brand Intelligence Profiles (Colors, Typography, Tone, Prohibitions, Messaging)
 * - Cryptographic Lock Hash for Brand State Integrity
 * - Objective Brand Compliance Validation (Scanning for prohibited elements & brand violations)
 * - Campaign Family Governance (Master direction -> multi-variant consistency)
 * - Multi-Tier Memory & File System Persistence (data/brand-profiles.jsonl)
 *
 * Doctrine: UNAVAILABLE !== 0. REAL ASSET VERIFICATION ALWAYS.
 */

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const garudaEventService = require("./garudaEventService");
const { GARUDA_EVENT_TYPES, GARUDA_ENTITY_TYPES } = require("./garudaEventTypes");

const DATA_DIR = path.join(__dirname, "..", "..", "data");
const BRAND_PROFILES_FILE = path.join(DATA_DIR, "brand-profiles.jsonl");

function ensureDirs() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch {}
}

const brandProfilesStore = new Map();

function sha256(data) {
  const str = typeof data === "string" ? data : JSON.stringify(data);
  return crypto.createHash("sha256").update(str).digest("hex");
}

function loadFromDisk() {
  ensureDirs();
  try {
    if (fs.existsSync(BRAND_PROFILES_FILE)) {
      const lines = fs.readFileSync(BRAND_PROFILES_FILE, "utf8").split("\n").filter(Boolean);
      for (const line of lines) {
        try {
          const doc = JSON.parse(line);
          if (doc && doc.brandId) brandProfilesStore.set(doc.brandId, doc);
        } catch {}
      }
    }
  } catch {}
}

loadFromDisk();

function appendDocToFile(filePath, doc) {
  ensureDirs();
  try {
    fs.appendFileSync(filePath, JSON.stringify(doc) + "\n", "utf8");
  } catch {}
}

class IdentityLockService {
  constructor() {
    this.profiles = brandProfilesStore;
    this.initDefaultProfile();
  }

  clearForTesting() {
    this.profiles.clear();
    this.initDefaultProfile();
  }

  initDefaultProfile() {
    if (!this.profiles.has("garuda_default")) {
      const defaultProfile = {
        brandId: "garuda_default",
        brandName: "GARUDA AI",
        industry: "Enterprise AI & Sovereign Operating Systems",
        positioning: "Sovereign, High-Performance Autonomous AI Operating System for Enterprise Growth",
        visualIdentity: {
          primaryColorHex: "#D4AF37", // Sovereign Gold
          secondaryColorHex: "#0B0F16", // Aerospace Obsidian
          accentColorHex: "#1E3A8A", // Deep Navy
          backgroundColorHex: "#05070B",
          textColorHex: "#F9FAFB",
          palette: ["#D4AF37", "#0B0F16", "#1E3A8A", "#05070B", "#F9FAFB"]
        },
        typography: {
          headingFont: "Inter, -apple-system, sans-serif",
          bodyFont: "Inter, -apple-system, sans-serif",
          fontSizeBase: 16,
          letterSpacing: "0.05em"
        },
        toneOfVoice: {
          primary: "Authoritative, sovereign, precise, ambitious, truthful",
          avoid: ["casual slang", "unverified hype", "generic buzzwords", "apologetic tone"],
          styleRules: ["Direct and concise", "Evidence-backed claims only", "Zero hallucinated metrics"]
        },
        prohibitedElements: {
          visual: [
            "distorted shapes",
            "blurry low-res renders",
            "cluttered compositions",
            "cartoonish elements",
            "cheap neon gradients"
          ],
          copy: [
            "100% guaranteed billionaire overnight",
            "click here now for free money",
            "fake testimonials",
            "unverified returns"
          ]
        },
        approvedMessaging: {
          taglines: [
            "Autonomous Execution. Truthful Intelligence. Sovereign Growth.",
            "Engineered for Highest Commercial Leverage."
          ],
          usps: [
            "Cryptographically verified deliverables",
            "Deterministic multi-agent execution",
            "Zero fake metrics governance"
          ],
          disclaimers: [
            "All performance figures subject to authoritative verified records."
          ]
        },
        logoAssets: {
          primaryLogoSvg: "/assets/garuda-logo-gold.svg",
          iconMarkSvg: "/assets/garuda-icon.svg",
          preferredPlacement: "top_right",
          clearspacePx: 24
        },
        referenceAssets: [],
        qualityRules: {
          minImageResolution: { width: 1080, height: 1080 },
          maxFileSizeMB: 15,
          requireCtaButton: true,
          requireBrandMark: true
        },
        lockHash: sha256({
          brandName: "GARUDA AI",
          primaryColorHex: "#D4AF37",
          secondaryColorHex: "#0B0F16"
        }),
        status: "ACTIVE",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.profiles.set(defaultProfile.brandId, defaultProfile);
    }
  }

  /**
   * 1. Register or update a reusable Brand Intelligence Profile.
   */
  async createOrUpdateBrandProfile(profileInput = {}) {
    const brandName = String(profileInput.brandName || profileInput.name || "").trim();
    if (!brandName) {
      throw new Error("Brand name is required to create a Brand Intelligence Profile");
    }

    const brandId = String(profileInput.brandId || `brand_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`).trim();
    const primaryColorHex = profileInput.visualIdentity?.primaryColorHex || profileInput.primaryColorHex || "#D4AF37";
    const secondaryColorHex = profileInput.visualIdentity?.secondaryColorHex || profileInput.secondaryColorHex || "#0B0F16";
    const accentColorHex = profileInput.visualIdentity?.accentColorHex || profileInput.accentColorHex || "#1E3A8A";

    const visualIdentity = {
      primaryColorHex,
      secondaryColorHex,
      accentColorHex,
      backgroundColorHex: profileInput.visualIdentity?.backgroundColorHex || "#05070B",
      textColorHex: profileInput.visualIdentity?.textColorHex || "#FFFFFF",
      palette: Array.isArray(profileInput.visualIdentity?.palette) && profileInput.visualIdentity.palette.length
        ? profileInput.visualIdentity.palette
        : [primaryColorHex, secondaryColorHex, accentColorHex]
    };

    const typography = {
      headingFont: profileInput.typography?.headingFont || profileInput.headingFont || "Inter, sans-serif",
      bodyFont: profileInput.typography?.bodyFont || profileInput.bodyFont || "Inter, sans-serif",
      fontSizeBase: Number(profileInput.typography?.fontSizeBase || 16),
      letterSpacing: profileInput.typography?.letterSpacing || "normal"
    };

    const toneOfVoice = {
      primary: profileInput.toneOfVoice?.primary || profileInput.toneOfVoice || "Professional, modern, trustworthy, high-value",
      avoid: Array.isArray(profileInput.toneOfVoice?.avoid) ? profileInput.toneOfVoice.avoid : ["cheap buzzwords", "spammy urgency"],
      styleRules: Array.isArray(profileInput.toneOfVoice?.styleRules) ? profileInput.toneOfVoice.styleRules : ["Direct value proposition", "Clear CTA"]
    };

    const prohibitedElements = {
      visual: Array.isArray(profileInput.prohibitedElements?.visual) ? profileInput.prohibitedElements.visual : ["distorted rendering", "low contrast"],
      copy: Array.isArray(profileInput.prohibitedElements?.copy) ? profileInput.prohibitedElements.copy : ["misleading guarantees", "spam phrasing"]
    };

    const approvedMessaging = {
      taglines: Array.isArray(profileInput.approvedMessaging?.taglines) ? profileInput.approvedMessaging.taglines : [],
      usps: Array.isArray(profileInput.approvedMessaging?.usps) ? profileInput.approvedMessaging.usps : (profileInput.usps || []),
      disclaimers: Array.isArray(profileInput.approvedMessaging?.disclaimers) ? profileInput.approvedMessaging.disclaimers : []
    };

    const logoAssets = {
      primaryLogoSvg: profileInput.logoAssets?.primaryLogoSvg || null,
      iconMarkSvg: profileInput.logoAssets?.iconMarkSvg || null,
      preferredPlacement: profileInput.logoAssets?.preferredPlacement || "top_right",
      clearspacePx: Number(profileInput.logoAssets?.clearspacePx || 20)
    };

    const qualityRules = {
      minImageResolution: profileInput.qualityRules?.minImageResolution || { width: 1080, height: 1080 },
      maxFileSizeMB: Number(profileInput.qualityRules?.maxFileSizeMB || 10),
      requireCtaButton: profileInput.qualityRules?.requireCtaButton !== false,
      requireBrandMark: profileInput.qualityRules?.requireBrandMark !== false
    };

    const lockHash = sha256({
      brandName,
      primaryColorHex,
      secondaryColorHex,
      headingFont: typography.headingFont,
      prohibitedVisual: prohibitedElements.visual
    });

    const brandProfile = {
      brandId,
      brandName,
      industry: String(profileInput.industry || "General Commercial").trim(),
      positioning: String(profileInput.positioning || "Premium Industry Leader").trim(),
      visualIdentity,
      typography,
      toneOfVoice,
      prohibitedElements,
      approvedMessaging,
      logoAssets,
      referenceAssets: Array.isArray(profileInput.referenceAssets) ? profileInput.referenceAssets : [],
      qualityRules,
      lockHash,
      status: "ACTIVE",
      createdAt: profileInput.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.profiles.set(brandId, brandProfile);
    appendDocToFile(BRAND_PROFILES_FILE, brandProfile);

    await garudaEventService.emitGarudaEvent({
      eventType: GARUDA_EVENT_TYPES.BRAND_PROFILE_UPDATED || "BRAND_PROFILE_UPDATED",
      entityType: "brand_profile",
      entityId: brandId,
      source: "identity_lock_engine",
      newState: "ACTIVE",
      metadata: {
        brandName,
        lockHash,
        primaryColorHex
      }
    }).catch(() => {});

    return brandProfile;
  }

  /**
   * 2. Retrieve a Brand Profile by ID or fallback to default.
   */
  getBrandProfile(brandId = null) {
    if (brandId && this.profiles.has(brandId)) {
      return this.profiles.get(brandId);
    }
    // Try to find matching profile by brand name
    if (brandId) {
      for (const prof of this.profiles.values()) {
        if (prof.brandName.toLowerCase() === String(brandId).toLowerCase()) {
          return prof;
        }
      }
    }
    return this.profiles.get("garuda_default") || null;
  }

  /**
   * 3. List all Brand Profiles.
   */
  listBrandProfiles() {
    return Array.from(this.profiles.values());
  }

  /**
   * 4. Objective Compliance Validation against Brand Profile.
   * Scans creative copy, concepts, or visual prompts for brand violations.
   */
  validateCompliance(brandProfileOrId, creativeContent = {}) {
    const brand = typeof brandProfileOrId === "string"
      ? this.getBrandProfile(brandProfileOrId)
      : (brandProfileOrId || this.getBrandProfile());

    if (!brand) {
      return {
        compliant: false,
        violations: ["Brand profile not found"],
        identityLockHash: null,
        score: 0
      };
    }

    const violations = [];
    const textCorpus = [
      creativeContent.headline || "",
      creativeContent.primaryText || "",
      creativeContent.hook || "",
      creativeContent.cta || "",
      creativeContent.prompt || "",
      creativeContent.visualDescription || ""
    ].join(" ").toLowerCase();

    // Check 1: Prohibited Copy Words
    const prohibitedCopy = brand.prohibitedElements?.copy || [];
    for (const forbidden of prohibitedCopy) {
      if (forbidden && textCorpus.includes(String(forbidden).toLowerCase())) {
        violations.push(`Prohibited copy term detected: "${forbidden}"`);
      }
    }

    // Check 2: Visual Prompt Prohibitions
    const prohibitedVisual = brand.prohibitedElements?.visual || [];
    for (const forbidden of prohibitedVisual) {
      if (forbidden && textCorpus.includes(String(forbidden).toLowerCase())) {
        violations.push(`Prohibited visual element detected in prompt: "${forbidden}"`);
      }
    }

    // Check 3: CTA requirement
    if (brand.qualityRules?.requireCtaButton) {
      const cta = String(creativeContent.cta || "").trim();
      if (!cta && !creativeContent.prompt) {
        violations.push("Missing required Call to Action (CTA) string");
      }
    }

    const compliant = violations.length === 0;

    return {
      compliant,
      violations,
      identityLockHash: brand.lockHash,
      brandName: brand.brandName,
      checkedAt: new Date().toISOString()
    };
  }

  /**
   * 5. Generate Campaign Family Blueprint.
   * Derives a coordinated suite of asset specifications that share brand identity locks.
   */
  buildCampaignFamilySpec(brandProfile, campaignTheme, masterDirection) {
    const brand = typeof brandProfile === "string" ? this.getBrandProfile(brandProfile) : brandProfile;
    const theme = campaignTheme || "Master Performance Campaign";

    return {
      familyId: `fam_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`,
      brandName: brand.brandName,
      brandId: brand.brandId,
      lockHash: brand.lockHash,
      campaignTheme: theme,
      masterCreativeDirection: masterDirection || `Elevate ${brand.brandName} through high-contrast sovereign aesthetics and bold messaging.`,
      colorTokens: brand.visualIdentity,
      typographyTokens: brand.typography,
      assetSpecs: [
        { variant: "MASTER_AD_VARIANT_A", format: "IMAGE_SQUARE", aspectRatio: "1:1", dimensions: { width: 1080, height: 1080 }, channel: "meta_feed" },
        { variant: "AD_VARIANT_B_LIFESTYLE", format: "IMAGE_SQUARE", aspectRatio: "1:1", dimensions: { width: 1080, height: 1080 }, channel: "meta_feed" },
        { variant: "AD_VARIANT_C_ROI", format: "IMAGE_SQUARE", aspectRatio: "1:1", dimensions: { width: 1080, height: 1080 }, channel: "meta_feed" },
        { variant: "STORY_VERTICAL", format: "IMAGE_STORY", aspectRatio: "9:16", dimensions: { width: 1080, height: 1920 }, channel: "instagram_story" },
        { variant: "REEL_STORYBOARD", format: "VIDEO_REEL", aspectRatio: "9:16", durationSeconds: 15, channel: "instagram_reels" },
        { variant: "CAROUSEL_CARD_SET", format: "CAROUSEL", cardCount: 5, aspectRatio: "1:1", channel: "meta_carousel" },
        { variant: "LANDING_PAGE_HERO", format: "IMAGE_HERO", aspectRatio: "16:9", dimensions: { width: 1920, height: 1080 }, channel: "web_hero" }
      ],
      createdAt: new Date().toISOString()
    };
  }
}

module.exports = new IdentityLockService();
module.exports.IdentityLockService = IdentityLockService;
