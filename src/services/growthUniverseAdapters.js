/**
 * 🦅 GARUDA Cross-Universe Growth Intelligence Layer — Universe Adapters
 * Growth Stage Phase 3 — Connect Existing Universe Services
 *
 * Thin, backward-compatible adapters that let the Growth Layer INVOKE existing
 * canonical universe engines without modifying them:
 *
 *   U21 Brand            -> identityLockService
 *   U20 Content          -> digitalMarketingOsService (pillars / calendar / carousel)
 *   U22 Digital Presence -> digitalMarketingOsService (landing / clusters / profile)
 *   U19 Creative         -> creativeStudioService (brief -> concept -> family)
 *
 * Laws:
 * - NO destructive refactors. Existing services and routes remain untouched.
 * - Adapters return structured packs labeled with their truth classification
 *   (LIVE_ENGINE_OUTPUT for deterministic engine outputs).
 * - No fabricated capabilities: the creative adapter surfaces provider truth as-is
 *   and never claims image/video generation happened.
 */

const crypto = require("crypto");
const identityLockService = require("./identityLockService");
const digitalMarketingOsService = require("./digitalMarketingOsService");
const creativeStudioService = require("./creativeStudioService");

function sha256(data) {
  return crypto
    .createHash("sha256")
    .update(typeof data === "string" ? data : JSON.stringify(data))
    .digest("hex");
}

function requireBrandName(input) {
  const brandName = String(input.brandName || "").trim();
  if (!brandName) {
    const err = new Error("brandName is required");
    err.statusCode = 400;
    throw err;
  }
  return brandName;
}

class GrowthUniverseAdapters {
  // ===========================================================================
  // U21 BRAND ADAPTER
  // ===========================================================================

  /**
   * Bind (or create) the brand profile for a campaign and validate the campaign
   * master direction against IdentityLock compliance rules.
   */
  async generateBrandContextPack(input = {}) {
    const brandName = requireBrandName(input);

    let profile = identityLockService.getBrandProfile(brandName);
    let profileCreated = false;
    const resolvedIsDefault = profile && profile.brandId === "garuda_default";
    const requestedIsDefault = brandName.toLowerCase() === "garuda ai";
    if (resolvedIsDefault && !requestedIsDefault) {
      // No profile exists for this brand yet — create one from the brief context.
      profile = await identityLockService.createOrUpdateBrandProfile({
        brandName,
        industry: input.industry,
        positioning: input.positioning
      });
      profileCreated = true;
    }

    const compliance = identityLockService.validateCompliance(brandName, {
      cta: input.cta || "Learn more",
      prompt: input.masterDirection || ""
    });

    return {
      universe: "U21",
      packType: "BRAND_CONTEXT_PACK",
      brandId: profile.brandId,
      brandName: profile.brandName,
      lockHash: profile.lockHash,
      toneOfVoice: profile.toneOfVoice,
      visualIdentity: profile.visualIdentity,
      profileCreated,
      compliance,
      engine: "identityLockService",
      classification: "LIVE_ENGINE_OUTPUT",
      generatedAt: new Date().toISOString()
    };
  }

  // ===========================================================================
  // U20 CONTENT ADAPTER — LIVE deterministic engines via digitalMarketingOsService
  // ===========================================================================

  /**
   * Content pack: pillars + 4-week editorial calendar + carousel concept.
   */
  async generateContentPack(input = {}) {
    const brandName = requireBrandName(input);

    const pillars = digitalMarketingOsService.generateContentPillars(brandName, input.industry);
    const calendar = await digitalMarketingOsService.generateEditorialCalendar({
      brandId: brandName,
      brandName,
      campaignTheme: input.campaignTheme,
      weeksCount: input.weeksCount || 4,
      location: input.geography
    });
    const carousel = digitalMarketingOsService.generateCarouselConcept({
      brandId: brandName,
      brandName,
      title: input.carouselTitle
    });

    return {
      universe: "U20",
      packType: "CONTENT_PACK",
      brandName: pillars.brandName,
      pillars,
      calendar,
      carousel,
      engine: "digitalMarketingOsService (DETERMINISTIC_TEMPLATE engines)",
      classification: "LIVE_ENGINE_OUTPUT",
      truthNotice: "Deterministic template engines — structured planning output, not AI-generated copy. Editorial calendar is persisted (marketing-calendars.jsonl).",
      generatedAt: new Date().toISOString()
    };
  }

  // ===========================================================================
  // U19 CREATIVE ADAPTER
  // ===========================================================================

  /**
   * Creative pack: brief -> concept -> campaign family spec. Surfaces provider
   * truth: the family lists asset specs to be produced; actual rendering requires
   * a connected generation provider (or the local sovereign SVG engine).
   * NEVER claims image/video generation happened unless the engine says so.
   */
  async generateCreativePack(input = {}) {
    const brandName = requireBrandName(input);
    const objective = String(input.objective || "").trim();
    if (!objective) {
      const err = new Error("objective is required for creative pack generation");
      err.statusCode = 400;
      throw err;
    }

    const brief = await creativeStudioService.createCreativeBrief({
      title: input.campaignTheme || `${brandName} — ${objective.slice(0, 60)}`,
      brandName,
      industry: input.industry,
      targetAudience: input.targetAudience,
      objective,
      channel: input.channel || "meta_instagram",
      geographicMarket: input.geography
    });

    const concept = await creativeStudioService.generateConcept(brief.briefId);
    const family = await creativeStudioService.generateCampaignFamily(brief.briefId);

    return {
      universe: "U19",
      packType: "CREATIVE_PACK",
      brandName,
      briefId: brief.briefId,
      brief,
      concept,
      family,
      engine: "creativeStudioService",
      classification: "LIVE_ENGINE_OUTPUT",
      deliverableScope: "BRIEF_AND_CONCEPT_AND_FAMILY_SPEC_ONLY",
      truthNotice: "Brief, concept and family spec are engine outputs. Asset rendering requires a connected generation provider (currently UNAVAILABLE) or the local sovereign SVG engine; no rendering is implied by this pack.",
      briefHash: sha256({ briefId: brief.briefId, title: brief.title || brief.name }),
      generatedAt: new Date().toISOString()
    };
  }

  // ===========================================================================
  // U22 PRESENCE ADAPTER
  // ===========================================================================

  /**
   * Presence pack: landing blueprint + SEO clusters + digital presence profile.
   */
  async generatePresencePack(input = {}) {
    const brandName = requireBrandName(input);

    const landing = digitalMarketingOsService.generateLandingPageBlueprint({
      brandId: brandName,
      brandName,
      projectName: input.projectName,
      location: input.geography,
      startingPrice: input.startingPrice
    });
    const clusters = digitalMarketingOsService.generateTopicClusters(
      input.primaryKeyword || `${input.industry || brandName} ${input.geography || ""}`.trim()
    );
    const presence = digitalMarketingOsService.generateDigitalPresenceProfile(brandName);

    return {
      universe: "U22",
      packType: "PRESENCE_PACK",
      landing,
      clusters,
      presence,
      engine: "digitalMarketingOsService presence engines (DETERMINISTIC_TEMPLATE)",
      classification: "LIVE_ENGINE_OUTPUT",
      truthNotice: "Blueprints are strategy/planning outputs. Live SERP metrics require connected search data sources (declared UNAVAILABLE until then).",
      generatedAt: new Date().toISOString()
    };
  }
}

module.exports = new GrowthUniverseAdapters();
module.exports.GrowthUniverseAdapters = GrowthUniverseAdapters;
