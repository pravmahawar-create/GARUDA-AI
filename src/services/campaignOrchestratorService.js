/**
 * 🦅 GARUDA Cross-Universe Growth Intelligence Layer — Campaign Orchestrator
 * Growth Stage Phase 2 — Campaign Orchestration
 *
 * The Campaign is the coordinated cross-universe execution object. It binds a
 * business brief and a Growth Strategy (growthStrategyService) into per-universe
 * plans for Brand (U21), Content (U20), Creative (U19), Digital Presence (U22),
 * Communication (U07) and Revenue (U10).
 *
 * This is orchestration tooling of the CROSS-UNIVERSE GROWTH INTELLIGENCE LAYER.
 * It is NOT a universe. The canonical universe count remains 27.
 *
 * Lifecycle (truth law: no autonomous execution, no spend, no dispatch):
 *   DRAFT -> STRATEGIZED -> READY_FOR_APPROVAL -> APPROVED -> EXECUTION_PENDING
 * - Transition to APPROVED requires explicit founder approval token.
 * - EXECUTION_PENDING means "awaiting per-universe execution"; actual execution is
 *   performed by the owning universe services under their own governance.
 * - Communication drafts and ad spend are NEVER triggered by this service.
 *
 * Persistence: JSONL append-only (data/growth-campaigns.jsonl), Mongo-degraded safe.
 */

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const garudaEventService = require("./garudaEventService");
const { GARUDA_EVENT_TYPES, GARUDA_ENTITY_TYPES } = require("./garudaEventTypes");
const growthStrategyService = require("./growthStrategyService");

const DATA_DIR = path.join(__dirname, "..", "..", "data");
const CAMPAIGNS_FILE = path.join(DATA_DIR, "growth-campaigns.jsonl");

const CAMPAIGN_STATUS = Object.freeze({
  DRAFT: "DRAFT",
  STRATEGIZED: "STRATEGIZED",
  READY_FOR_APPROVAL: "READY_FOR_APPROVAL",
  APPROVED: "APPROVED",
  EXECUTION_PENDING: "EXECUTION_PENDING"
});

const CAMPAIGN_STATUS_FLOW = Object.freeze({
  [CAMPAIGN_STATUS.DRAFT]: [CAMPAIGN_STATUS.STRATEGIZED],
  [CAMPAIGN_STATUS.STRATEGIZED]: [CAMPAIGN_STATUS.READY_FOR_APPROVAL],
  [CAMPAIGN_STATUS.READY_FOR_APPROVAL]: [CAMPAIGN_STATUS.APPROVED],
  [CAMPAIGN_STATUS.APPROVED]: [CAMPAIGN_STATUS.EXECUTION_PENDING],
  [CAMPAIGN_STATUS.EXECUTION_PENDING]: []
});

const DATA_DIR_GUARD = () => {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch {}
};

function loadCampaignsFromDisk() {
  DATA_DIR_GUARD();
  const store = new Map();
  try {
    if (fs.existsSync(CAMPAIGNS_FILE)) {
      const lines = fs.readFileSync(CAMPAIGNS_FILE, "utf8").split("\n").filter(Boolean);
      for (const line of lines) {
        try {
          const doc = JSON.parse(line);
          if (doc && doc.campaignId) store.set(doc.campaignId, doc);
        } catch {}
      }
    }
  } catch {}
  return store;
}

function appendCampaignToFile(doc) {
  DATA_DIR_GUARD();
  try {
    fs.appendFileSync(CAMPAIGNS_FILE, JSON.stringify(doc) + "\n", "utf8");
  } catch {}
}

function sha256(data) {
  return crypto.createHash("sha256").update(typeof data === "string" ? data : JSON.stringify(data)).digest("hex");
}

class CampaignOrchestratorService {
  constructor() {
    this.campaigns = loadCampaignsFromDisk();
  }

  clearForTesting() {
    this.campaigns.clear();
  }

  // ===========================================================================
  // CAMPAIGN CREATION
  // ===========================================================================

  /**
   * Create a cross-universe Campaign. Accepts either a business brief (a Growth
   * Strategy is synthesized) or an existing strategyId.
   */
  async createCampaign(input = {}) {
    const { briefInput, strategyId } = input;

    let strategy = null;
    if (strategyId) {
      strategy = growthStrategyService.getStrategy(strategyId);
      if (!strategy) {
        const err = new Error(`Growth strategy not found: ${strategyId}`);
        err.statusCode = 404;
        throw err;
      }
    } else if (briefInput) {
      strategy = await growthStrategyService.generateStrategy(briefInput);
    } else {
      const err = new Error("Campaign requires either briefInput or strategyId");
      err.statusCode = 400;
      throw err;
    }

    const campaignId = `gc_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
    const now = new Date().toISOString();

    const campaign = {
      campaignId,
      status: CAMPAIGN_STATUS.STRATEGIZED,
      businessBrief: strategy.businessBrief,
      growthStrategyRef: {
        strategyId: strategy.strategyId,
        engine: strategy.engine,
        strategyHash: strategy.strategyHash
      },
      growthStrategy: strategy, // embedded for cross-universe consumers; ref above is the identity anchor
      brandContext: this.buildBrandContext(strategy),
      contentPlan: this.buildContentPlan(strategy),
      creativeBriefs: this.buildCreativeBriefs(strategy),
      presencePlan: this.buildPresencePlan(strategy),
      communicationPlan: this.buildCommunicationPlan(strategy),
      revenueHandoff: this.buildRevenueHandoff(strategy),
      measurementPlan: strategy.measurementPlan,
      lifecycleLog: [{ status: CAMPAIGN_STATUS.STRATEGIZED, actor: "growth_layer", at: now, note: "Campaign created with synthesized strategy" }],
      statusHash: sha256({ campaignId, status: CAMPAIGN_STATUS.STRATEGIZED, strategyHash: strategy.strategyHash }),
      createdAt: now,
      updatedAt: now
    };

    this.campaigns.set(campaignId, campaign);
    appendCampaignToFile(campaign);

    garudaEventService.emitGarudaEvent({
      eventType: GARUDA_EVENT_TYPES.CAMPAIGN_CREATED,
      entityType: GARUDA_ENTITY_TYPES.MARKETING_CAMPAIGN,
      entityId: campaignId,
      source: "growth_intelligence_layer",
      newState: CAMPAIGN_STATUS.STRATEGIZED,
      metadata: { businessName: campaign.businessBrief.businessName, strategyId: strategy.strategyId }
    }).catch(() => {});

    return campaign;
  }

  // ===========================================================================
  // PER-UNIVERSE PLAN BUILDERS (structured contracts, not execution)
  // ===========================================================================

  buildBrandContext(strategy) {
    const brief = strategy.businessBrief;
    return {
      universe: "U21",
      brandName: brief.businessName,
      industry: brief.industry,
      positioning: strategy.positioning,
      brandContextNote: brief.brandContext,
      requiredArtifacts: ["BRAND_PROFILE_ACTIVE", "IDENTITY_LOCK_HASH", "TONE_OF_VOICE_RULES"],
      identityLockNotice: "Campaign creative and content MUST validate against the active IdentityLock brand profile (U21) before any asset is produced. Brand profile creation/selection happens via identityLockService.",
      readiness: "PENDING_BRAND_PROFILE_BINDING"
    };
  }

  buildContentPlan(strategy) {
    const req = strategy.contentRequirements;
    return {
      universe: "U20",
      pillarThemes: req.pillarThemes,
      editorialCadence: req.editorialCadence,
      formatAdaptation: req.formatAdaptation,
      repurposingRule: req.repurposing,
      deliverables: [
        "EDITORIAL_CALENDAR_4WEEK",
        "CONTENT_PILLARS",
        "CAROUSEL_CONCEPTS",
        "CHANNEL_FORMAT_ADAPTATIONS"
      ],
      engineBinding: "digitalMarketingOsService (U20/U22 deterministic engines, LIVE via /api/growth/*)",
      readiness: "READY_FOR_GENERATION"
    };
  }

  buildCreativeBriefs(strategy) {
    const req = strategy.creativeRequirements;
    return req.assetFamilies.map((family) => ({
      universe: "U19",
      family,
      masterDirection: req.masterDirection,
      identityLockRequired: req.identityLockRequired,
      deliverable: "CREATIVE_BRIEF_AND_STORYBOARD_ONLY",
      truthNotice: req.generationTruthNotice,
      readiness: "READY_FOR_BRIEF_GENERATION"
    }));
  }

  buildPresencePlan(strategy) {
    const req = strategy.presenceRequirements;
    return {
      universe: "U22",
      landingPageBlueprint: req.landingPageBlueprint,
      topicClusters: req.topicClusters,
      visitorJourney: req.visitorJourney,
      conversionSurface: req.conversionSurface,
      deliverables: ["LANDING_PAGE_BLUEPRINT", "SEO_TOPIC_CLUSTERS", "DIGITAL_PRESENCE_PROFILE"],
      engineBinding: "digitalMarketingOsService presence engines (LIVE via /api/growth/*)",
      readiness: "READY_FOR_GENERATION"
    };
  }

  buildCommunicationPlan(strategy) {
    const req = strategy.communicationRequirements;
    return {
      universe: "U07",
      sequence: req.sequence,
      governanceNotice: req.governanceNotice,
      dispatchContract: "Drafts are created via outboundCommunicationService and remain APPROVAL_REQUIRED until founder approval. The growth layer NEVER dispatches.",
      readiness: "CONTRACT_ONLY_PENDING_LEADS"
    };
  }

  buildRevenueHandoff(contract) {
    const req = contract.revenueHandoffRequirements;
    return {
      universe: "U10",
      qualificationContext: req.qualificationContext,
      offerFraming: req.offerFraming,
      attribution: req.attribution,
      revenuePath: req.revenuePath,
      governanceNotice: req.governanceNotice,
      handoffContract: "Leads captured by this campaign enter the revenue pipeline with campaign attribution identifiers. Proposals/payments are produced ONLY by U10 services from verified records.",
      readiness: "CONTRACT_ONLY_PENDING_LEADS"
    };
  }

  // ===========================================================================
  // LIFECYCLE TRANSITIONS
  // ===========================================================================

  assertTransition(fromStatus, toStatus) {
    const allowed = CAMPAIGN_STATUS_FLOW[fromStatus] || [];
    if (!allowed.includes(toStatus)) {
      const err = new Error(`Invalid campaign transition: ${fromStatus} -> ${toStatus}. Allowed: ${allowed.join(", ") || "none"}`);
      err.statusCode = 409;
      throw err;
    }
  }

  /**
   * Stage a strategized campaign for founder review (STRATEGIZED -> READY_FOR_APPROVAL).
   */
  markReadyForApproval(campaignId) {
    const campaign = this.getCampaign(campaignId);
    if (!campaign) {
      const err = new Error(`Campaign not found: ${campaignId}`);
      err.statusCode = 404;
      throw err;
    }
    this.assertTransition(campaign.status, CAMPAIGN_STATUS.READY_FOR_APPROVAL);

    const now = new Date().toISOString();
    campaign.status = CAMPAIGN_STATUS.READY_FOR_APPROVAL;
    campaign.lifecycleLog.push({
      status: CAMPAIGN_STATUS.READY_FOR_APPROVAL,
      actor: "growth_layer",
      at: now,
      note: "Cross-universe plan assembled; awaiting founder review"
    });
    campaign.statusHash = sha256({ campaignId, status: campaign.status, strategyHash: campaign.growthStrategyRef.strategyHash });
    campaign.updatedAt = now;

    appendCampaignToFile(campaign);
    return campaign;
  }

  /**
   * Founder approval gate. REQUIRED before a campaign may move toward execution.
   * No dispatch, no spend, no communication is triggered here.
   */
  approveCampaign(campaignId, approvalInput = {}) {
    const campaign = this.getCampaign(campaignId);
    if (!campaign) {
      const err = new Error(`Campaign not found: ${campaignId}`);
      err.statusCode = 404;
      throw err;
    }
    this.assertTransition(campaign.status, CAMPAIGN_STATUS.APPROVED);

    const approvalToken = String(approvalInput.approvalToken || "").trim();
    if (!approvalToken) {
      const err = new Error("Founder approval token is required to approve a campaign (governance law)");
      err.statusCode = 403;
      throw err;
    }

    const now = new Date().toISOString();
    campaign.status = CAMPAIGN_STATUS.APPROVED;
    campaign.approval = {
      approvedBy: String(approvalInput.approvedBy || "founder"),
      approvalTokenRef: sha256(approvalToken), // hash only — token never stored verbatim
      approvedAt: now,
      note: String(approvalInput.note || "").trim() || null
    };
    campaign.lifecycleLog.push({ status: CAMPAIGN_STATUS.APPROVED, actor: "founder", at: now, note: "Founder approval granted" });
    campaign.statusHash = sha256({ campaignId, status: campaign.status, strategyHash: campaign.growthStrategyRef.strategyHash });
    campaign.updatedAt = now;

    appendCampaignToFile(campaign);

    garudaEventService.emitGarudaEvent({
      eventType: GARUDA_EVENT_TYPES.CAMPAIGN_UPDATED,
      entityType: GARUDA_ENTITY_TYPES.MARKETING_CAMPAIGN,
      entityId: campaignId,
      source: "growth_intelligence_layer",
      newState: CAMPAIGN_STATUS.APPROVED,
      metadata: { approvedBy: campaign.approval.approvedBy }
    }).catch(() => {});

    return campaign;
  }

  /**
   * Move an approved campaign to EXECUTION_PENDING. Execution itself is performed
   * by the owning universe services under their own governance (never auto-run).
   */
  markExecutionPending(campaignId, executorContext = {}) {
    const campaign = this.getCampaign(campaignId);
    if (!campaign) {
      const err = new Error(`Campaign not found: ${campaignId}`);
      err.statusCode = 404;
      throw err;
    }
    this.assertTransition(campaign.status, CAMPAIGN_STATUS.EXECUTION_PENDING);

    const now = new Date().toISOString();
    campaign.status = CAMPAIGN_STATUS.EXECUTION_PENDING;
    campaign.executionContext = {
      requestedBy: String(executorContext.requestedBy || "growth_layer"),
      requestedAt: now,
      notice: "Campaign is staged for per-universe execution. Each universe service executes under its own approval/governance contracts. No automatic spend or dispatch."
    };
    campaign.lifecycleLog.push({ status: CAMPAIGN_STATUS.EXECUTION_PENDING, actor: "growth_layer", at: now, note: "Staged for per-universe execution" });
    campaign.statusHash = sha256({ campaignId, status: campaign.status, strategyHash: campaign.growthStrategyRef.strategyHash });
    campaign.updatedAt = now;

    appendCampaignToFile(campaign);
    return campaign;
  }

  // ===========================================================================
  // RETRIEVAL
  // ===========================================================================

  getCampaign(campaignId) {
    return this.campaigns.get(campaignId) || null;
  }

  listCampaigns(limit = 50) {
    return Array.from(this.campaigns.values())
      .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
      .slice(0, limit);
  }
}

function briefFromStrategy(strategy) {
  return strategy.businessBrief || {};
}

module.exports = new CampaignOrchestratorService();
module.exports.CampaignOrchestratorService = CampaignOrchestratorService;
module.exports.CAMPAIGN_STATUS = CAMPAIGN_STATUS;
module.exports.CAMPAIGN_STATUS_FLOW = CAMPAIGN_STATUS_FLOW;
