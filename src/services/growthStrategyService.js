/**
 * 🦅 GARUDA Cross-Universe Growth Intelligence Layer — Strategy Engine
 * Growth Stage Phase 1 — Growth Domain Foundation
 *
 * Converts a structured business brief into a canonical GrowthStrategy object that
 * coordinates Brand (U21), Content (U20), Creative (U19), Digital Presence (U22),
 * Communication (U07) and Revenue (U10) requirements for a single campaign.
 *
 * This is the strategy tier of the CROSS-UNIVERSE GROWTH INTELLIGENCE LAYER.
 * It is NOT a universe. The canonical universe count remains 27.
 *
 * Engine truth law:
 * - The current engine is DETERMINISTIC_TEMPLATE_V1 (rule/template based, no LLM).
 * - Output is labeled with its engine classification at generation time.
 * - An explicit intelligence hook (generateWithIntelligence) exists for an LLM
 *   provider to be plugged in later WITHOUT changing the service contract.
 * - No fabricated metrics: the strategy contains plans and requirements, never
 *   invented numbers (no fake rankings, traffic, leads, revenue or conversions).
 *
 * Persistence: JSONL append-only store (data/growth-strategies.jsonl) following the
 * repository's singleton + JSONL convention so it works in Mongo-degraded mode.
 */

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "..", "data");
const STRATEGIES_FILE = path.join(DATA_DIR, "growth-strategies.jsonl");

const STRATEGY_ENGINE = Object.freeze({
  DETERMINISTIC_TEMPLATE_V1: "DETERMINISTIC_TEMPLATE_V1",
  LLM_ASSISTED: "LLM_ASSISTED" // reserved — not yet operational; do not emit until wired
});

const CAMPAIGN_GOALS = Object.freeze({
  LEAD_GENERATION: "LEAD_GENERATION",
  BRAND_AWARENESS: "BRAND_AWARENESS",
  LAUNCH: "LAUNCH",
  SALES_CONVERSION: "SALES_CONVERSION",
  SEO_AUTHORITY: "SEO_AUTHORITY"
});

const FUNNEL_STAGES = Object.freeze([
  "AWARENESS",
  "INTEREST",
  "CONSIDERATION",
  "CONVERSION",
  "RETENTION",
  "ADVOCACY"
]);

const CHANNELS = Object.freeze({
  INSTAGRAM: "INSTAGRAM",
  LINKEDIN: "LINKEDIN",
  FACEBOOK: "FACEBOOK",
  GOOGLE_SEARCH: "GOOGLE_SEARCH",
  EMAIL: "EMAIL",
  WHATSAPP: "WHATSAPP",
  TELEGRAM: "TELEGRAM",
  SEO_WEB: "SEO_WEB"
});

const DATA_DIR_GUARD = () => {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch {}
};

function loadStrategiesFromDisk() {
  DATA_DIR_GUARD();
  const store = new Map();
  try {
    if (fs.existsSync(STRATEGIES_FILE)) {
      const lines = fs.readFileSync(STRATEGIES_FILE, "utf8").split("\n").filter(Boolean);
      for (const line of lines) {
        try {
          const doc = JSON.parse(line);
          if (doc && doc.strategyId) store.set(doc.strategyId, doc);
        } catch {}
      }
    }
  } catch {}
  return store;
}

function appendStrategyToFile(doc) {
  DATA_DIR_GUARD();
  try {
    fs.appendFileSync(STRATEGIES_FILE, JSON.stringify(doc) + "\n", "utf8");
  } catch {}
}

function sha256(data) {
  return crypto.createHash("sha256").update(typeof data === "string" ? data : JSON.stringify(data)).digest("hex");
}

class GrowthStrategyService {
  constructor() {
    this.strategies = loadStrategiesFromDisk();
  }

  clearForTesting() {
    this.strategies.clear();
  }

  // ===========================================================================
  // BRIEF VALIDATION
  // ===========================================================================

  /**
   * Validates and normalizes a business brief. Throws with statusCode 400 on
   * missing mandatory fields so callers (API/UI) surface honest errors.
   */
  validateBusinessBrief(briefInput = {}) {
    const businessName = String(briefInput.businessName || "").trim();
    const productOrService = String(briefInput.productOrService || briefInput.product_service || "").trim();
    const targetAudience = String(briefInput.targetAudience || "").trim();
    const campaignGoal = String(briefInput.campaignGoal || CAMPAIGN_GOALS.LEAD_GENERATION).trim().toUpperCase();

    const errors = [];
    if (!businessName) errors.push("businessName is required");
    if (!productOrService) errors.push("productOrService is required");
    if (!targetAudience) errors.push("targetAudience is required");
    if (!Object.values(CAMPAIGN_GOALS).includes(campaignGoal)) {
      errors.push(`campaignGoal must be one of: ${Object.values(CAMPAIGN_GOALS).join(", ")}`);
    }
    if (errors.length > 0) {
      const err = new Error(`Invalid business brief: ${errors.join("; ")}`);
      err.statusCode = 400;
      throw err;
    }

    return {
      businessName,
      industry: String(briefInput.industry || "General Business").trim(),
      productOrService,
      targetAudience,
      campaignGoal,
      geography: String(briefInput.geography || "").trim() || null,
      channels: Array.isArray(briefInput.channels) && briefInput.channels.length
        ? briefInput.channels.map((c) => String(c).trim().toUpperCase()).filter((c) => Object.values(CHANNELS).includes(c))
        : [CHANNELS.INSTAGRAM, CHANNELS.GOOGLE_SEARCH, CHANNELS.EMAIL],
      budgetLevel: String(briefInput.budgetLevel || "UNSPECIFIED").trim().toUpperCase(),
      website: String(briefInput.website || "").trim() || null,
      brandContext: String(briefInput.brandContext || "").trim() || null,
      notes: String(briefInput.notes || "").trim() || null
    };
  }

  // ===========================================================================
  // DETERMINISTIC STRATEGY ENGINE (DETERMINISTIC_TEMPLATE_V1)
  // ===========================================================================

  /**
   * Deterministic strategy synthesis from a validated brief.
   * Pure function of the brief — same input always yields the same strategy body.
   */
  synthesizeDeterministicStrategy(brief) {
    const goal = brief.campaignGoal;
    const geo = brief.geography || "the target market";

    // Objective framing per goal — plan language only, no invented numbers.
    const objectiveByGoal = {
      [CAMPAIGN_GOALS.LEAD_GENERATION]: `Generate qualified inquiries for ${brief.productOrService} among ${brief.targetAudience} in ${geo}, routed to founder-approved follow-up and revenue handoff.`,
      [CAMPAIGN_GOALS.BRAND_AWARENESS]: `Establish ${brief.businessName} as the recognized authority for ${brief.productOrService} among ${brief.targetAudience} in ${geo}.`,
      [CAMPAIGN_GOALS.LAUNCH]: `Drive launch-window awareness and first qualified demand for ${brief.productOrService} among ${brief.targetAudience} in ${geo}.`,
      [CAMPAIGN_GOALS.SALES_CONVERSION]: `Convert existing interest into closed revenue for ${brief.productOrService} through proof-led sequencing for ${brief.targetAudience}.`,
      [CAMPAIGN_GOALS.SEO_AUTHORITY]: `Build durable organic authority for ${brief.productOrService} topics that ${brief.targetAudience} search for in ${geo}.`
    };

    // Funnel emphasis per goal (stage -> requirement sentence).
    const funnelEmphasis = {
      [CAMPAIGN_GOALS.LEAD_GENERATION]: { AWARENESS: "Reach", INTEREST: "Engage", CONSIDERATION: "Nurture", CONVERSION: "Capture lead via gated intent action", RETENTION: "Follow-up sequence", ADVOCACY: "Testimonial + referral capture" },
      [CAMPAIGN_GOALS.BRAND_AWARENESS]: { AWARENESS: "Maximum credible reach", INTEREST: "Story-led engagement", CONSIDERATION: "Proof content", CONVERSION: "Soft capture only", RETENTION: "Community continuity", ADVOCACY: "Shareable proof stories" },
      [CAMPAIGN_GOALS.LAUNCH]: { AWARENESS: "Announcement burst", INTEREST: "Waitlist / early-access interest", CONSIDERATION: "Comparison + objection content", CONVERSION: "Early-access conversion path", RETENTION: "Onboarding sequence", ADVOCACY: "Founder-launch amplification" },
      [CAMPAIGN_GOALS.SALES_CONVERSION]: { AWARENESS: "Retargeting reach", INTEREST: "Offer clarity", CONSIDERATION: "Objection dissolution", CONVERSION: "Direct offer + payment path", RETENTION: "Post-purchase sequence", ADVOCACY: "Review generation" },
      [CAMPAIGN_GOALS.SEO_AUTHORITY]: { AWARENESS: "Topical cluster coverage", INTEREST: "In-depth guides", CONSIDERATION: "Comparison pages", CONVERSION: "Service page conversion path", RETENTION: "Newsletter continuity", ADVOCACY: "Citable reference assets" }
    }[goal];

    const funnelStages = FUNNEL_STAGES.map((stage) => ({
      stage,
      requirement: funnelEmphasis[stage] || "Progress prospect toward the next stage"
    }));

    // Channel strategy derived from the brief's declared channels.
    const channelPlaybook = {
      [CHANNELS.INSTAGRAM]: { role: "Visual storytelling + reels/carousels for emotional engagement", contentFormats: ["REEL", "CAROUSEL", "STORY"] },
      [CHANNELS.LINKEDIN]: { role: "Authority positioning + decision-maker reach", contentFormats: ["THOUGHT_LEADERSHIP_POST", "CASE_STUDY"] },
      [CHANNELS.FACEBOOK]: { role: "Broad local reach + community proof", contentFormats: ["STATIC_CREATIVE", "EVENT_POST"] },
      [CHANNELS.GOOGLE_SEARCH]: { role: "High-intent capture on commercial search queries", contentFormats: ["SEARCH_AD_COPY", "LANDING_PAGE"] },
      [CHANNELS.EMAIL]: { role: "Owned nurturing + conversion sequencing", contentFormats: ["NEWSLETTER", "SEQUENCE_EMAIL"] },
      [CHANNELS.WHATSAPP]: { role: "Direct follow-up + broadcast updates", contentFormats: ["BROADCAST_MESSAGE", "CATALOG_CARD"] },
      [CHANNELS.TELEGRAM]: { role: "Community + announcement channel", contentFormats: ["ANNOUNCEMENT_POST"] },
      [CHANNELS.SEO_WEB]: { role: "Durable organic capture via topic clusters and service pages", contentFormats: ["PILLAR_ARTICLE", "CLUSTER_ARTICLE", "SERVICE_PAGE"] }
    };

    const channelStrategy = brief.channels.map((ch) => ({
      channel: ch,
      ...channelPlaybook[ch]
    }));

    // Content requirements derived from channels + goal.
    const contentRequirements = {
      pillarThemes: [
        `Authority: engineering/quality standards behind ${brief.productOrService}`,
        `Proof: outcomes, demonstrations and verifiable evidence`,
        `Education: buying guidance for ${brief.targetAudience}`,
        `Offer: transparent ${goal === CAMPAIGN_GOALS.SALES_CONVERSION ? "direct" : "value-first"} positioning of ${brief.productOrService}`
      ],
      editorialCadence: "Weekly editorial calendar with per-channel format adaptation (source: U20 Content engine contract)",
      formatAdaptation: channelStrategy.flatMap((c) => c.contentFormats).filter((v, i, a) => a.indexOf(v) === i),
      repurposing: "Each pillar asset is adapted into at least two other channel formats before new topics are commissioned",
      ownedByUniverse: "U20"
    };

    const creativeRequirements = {
      masterDirection: `Sovereign, high-contrast, evidence-led visual language consistent with the locked brand identity for ${brief.businessName}`,
      assetFamilies: ["MASTER_AD_VARIANT_A", "AD_VARIANT_B_PROOF", "STORY_VERTICAL", "CAROUSEL_SET", "LANDING_HERO"],
      identityLockRequired: true,
      generationTruthNotice: "Creative briefs/storyboards are strategy outputs. Actual image/video rendering requires a connected generation provider; local vector (SVG) generation is available without external providers.",
      ownedByUniverse: "U19"
    };

    const presenceRequirements = {
      landingPageBlueprint: `High-conversion landing surface for ${brief.productOrService} with trust signals, lead-capture schema and FAQ`,
      topicClusters: `SEO topic cluster architecture around the primary commercial query space for ${brief.industry}`,
      visitorJourney: `${goal === CAMPAIGN_GOALS.SEO_AUTHORITY ? "Organic entry" : "Campaign entry"} → value surface → trust surface → capture surface → follow-up`,
      conversionSurface: brief.website ? `Primary capture surface: ${brief.website}` : "GARUDA-hosted landing surface (no external website provided in brief)",
      ownedByUniverse: "U22"
    };

    const communicationRequirements = {
      sequence: [
        { step: 1, trigger: "New lead captured", channel: CHANNELS.EMAIL, purpose: "Instant value confirmation + next-step CTA", approvalRequired: true },
        { step: 2, trigger: "No response after 48h", channel: brief.channels.includes(CHANNELS.WHATSAPP) ? CHANNELS.WHATSAPP : CHANNELS.EMAIL, purpose: "Gentle proof-forward follow-up", approvalRequired: true },
        { step: 3, trigger: "No response after 7 days", channel: CHANNELS.EMAIL, purpose: "Final availability-based nudge", approvalRequired: true }
      ],
      governanceNotice: "All outbound communication drafts require explicit founder approval before dispatch (U07 governed outbound contract). No autonomous sending.",
      ownedByUniverse: "U07"
    };

    const revenueHandoffRequirements = {
      qualificationContext: `Lead intent, source campaign and offer context are passed to Revenue (U10) for proposal generation`,
      offerFraming: `Clear, truthful offer framing for ${brief.productOrService} with milestone-based commercial structure where applicable`,
      attribution: `Campaign source identifiers (campaignId + channel + UTM) travel with every lead into the revenue pipeline`,
      revenuePath: "LEAD → QUALIFICATION → PROPOSAL → PAYMENT → VERIFIED REVENUE",
      governanceNotice: "Revenue figures are only ever reported from verified payment/settlement records. This plan contains NO projected revenue numbers.",
      ownedByUniverse: "U10"
    };

    const measurementPlan = {
      attributionModel: "First-touch campaign source + last-conversion landing surface, joined by campaignId",
      trackedEvents: ["IMPRESSION_RECORDED", "CLICK_RECORDED", "LEAD_CAPTURED", "APPROVAL_GRANTED", "PROPOSAL_SENT", "PAYMENT_VERIFIED"],
      truthNotice: "Platform metrics (impressions/spend/CPL/ROAS) are ONLY reported when the ad platform API is connected (performanceMarketingService truth law). Until then they are reported as UNAVAILABLE — never zero, never fabricated.",
      cadence: "Reviewed at every campaign checkpoint; metrics classified per growthSharedContracts.METRIC_TRUTH_CLASSIFICATIONS",
      ownedByUniverse: "U22 + performanceMarketingService"
    };

    const positioning = brief.brandContext
      ? `${brief.brandContext} — reinforced as the decisive proof layer across every funnel stage for ${brief.targetAudience}.`
      : `${brief.businessName} is positioned on verifiable delivery and transparent execution of ${brief.productOrService} for ${brief.targetAudience} in ${geo}.`;

    return {
      audience: {
        primary: brief.targetAudience,
        geography: brief.geography,
        definitionBasis: "Derived from brief.targetAudience; persona enrichment requires U11 client intelligence integration (BLUEPRINT)"
      },
      positioning,
      campaignObjective: objectiveByGoal[goal],
      funnelStages,
      channelStrategy,
      contentRequirements,
      creativeRequirements,
      presenceRequirements,
      communicationRequirements,
      revenueHandoffRequirements,
      measurementPlan
    };
  }

  // ===========================================================================
  // PUBLIC API
  // ===========================================================================

  /**
   * Generate a Growth Strategy from a business brief.
   * Currently deterministic (DETERMINISTIC_TEMPLATE_V1).
   */
  async generateStrategy(briefInput = {}) {
    const brief = this.validateBusinessBrief(briefInput);
    const body = this.synthesizeDeterministicStrategy(brief);
    const strategyId = `gs_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
    const generatedAt = new Date().toISOString();

    const strategy = {
      strategyId,
      engine: STRATEGY_ENGINE.DETERMINISTIC_TEMPLATE_V1,
      engineNotice: "Deterministic template synthesis. Structured for a future LLM intelligence hook; no AI generation claim is made.",
      businessBrief: brief,
      ...body,
      strategyHash: null, // filled below (hash of body without itself)
      createdAt: generatedAt
    };
    strategy.strategyHash = sha256({ brief, body });

    this.strategies.set(strategyId, strategy);
    appendStrategyToFile(strategy);

    return strategy;
  }

  getStrategy(strategyId) {
    return this.strategies.get(strategyId) || null;
  }

  listStrategies(limit = 50) {
    return Array.from(this.strategies.values())
      .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
      .slice(0, limit);
  }

  /**
   * INTELLIGENCE HOOK (contract only — not yet operational).
   * When an LLM strategy generator is implemented it must:
   *  - accept (brief, deterministicDraft),
   *  - return a body with the SAME SHAPE as synthesizeDeterministicStrategy,
   *  - set engine: STRATEGY_ENGINE.LLM_ASSISTED and a provider-verified notice,
   *  - never fabricate metrics (truth law).
   * Until then, calling this throws — callers must not fake LLM output.
   */
  async generateWithIntelligence() {
    const err = new Error("LLM strategy intelligence is not yet connected. Deterministic strategy (DETERMINISTIC_TEMPLATE_V1) is the only operational engine.");
    err.statusCode = 501;
    err.code = "STRATEGY_INTELLIGENCE_NOT_CONNECTED";
    throw err;
  }
}

module.exports = new GrowthStrategyService();
module.exports.GrowthStrategyService = GrowthStrategyService;
module.exports.STRATEGY_ENGINE = STRATEGY_ENGINE;
module.exports.CAMPAIGN_GOALS = CAMPAIGN_GOALS;
module.exports.FUNNEL_STAGES = FUNNEL_STAGES;
module.exports.CHANNELS = CHANNELS;
