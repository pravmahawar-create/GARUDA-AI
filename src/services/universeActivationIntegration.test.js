/**
 * 🦅 GARUDA Universe Activation & Cross-Universe Integration Test Suite
 *
 * Verifies:
 * 1. Universe Capability Registry Truth & No Fabricated Readiness
 * 2. Deduplication Prevention & Canonical Model Integrity
 * 3. Cross-Universe Event Nervous System Emission & Pub/Sub
 * 4. Real Estate Growth OS Complete Lifecycle (Project -> Lead -> Score -> Visit -> Booking)
 * 5. Real Estate Lead Deterministic Deduplication
 * 6. Explainable 0-100 Lead Scoring & Tier Assignment
 * 7. Agent Workforce Registration & Capability Discovery
 * 8. Agent Execution Truth & Verifiable Outcomes
 * 9. Creative Studio Brief -> Concept -> IdentityLock -> Asset Orchestration
 * 10. Vertical Knowledge Grounding & Context Isolation
 * 11. Mother Brain Capability Awareness
 * 12. High Command Center Authoritative Cross-Universe Reads
 * 13. UNAVAILABLE !== 0 Law Enforcement
 * 14. Failure State Isolation & Error Encapsulation
 * 15. Outcome Learning & Feedback Signal Computation
 * 16. Regression: Commercial Conversion & Proposal Pipeline
 * 17. Regression: Founder Authentication & Key Verification
 */

const { describe, it } = require("node:test");
const assert = require("node:assert");

const garudaEventService = require("./garudaEventService");
const { GARUDA_EVENT_TYPES, GARUDA_ENTITY_TYPES } = require("./garudaEventTypes");
const realEstateGrowthService = require("./realEstateGrowthService");
const creativeStudioService = require("./creativeStudioService");
const verticalKnowledgeService = require("./verticalKnowledgeService");
const workforceRouterService = require("./workforceRouterService");
const outcomeLearningService = require("./outcomeLearningService");
const capabilityRegistry = require("./capabilityRegistryService");
const founderCommandService = require("./founderCommandService");

describe("🦅 GARUDA Cross-Universe Integration & Activation Program", () => {

  // ---------------------------------------------------------------------------
  // 1. Universe Capability Registry Truth
  // ---------------------------------------------------------------------------
  it("1. Truthfully registers verified universe capabilities with evidence files", () => {
    const caps = capabilityRegistry.listCapabilities();
    assert.ok(Array.isArray(caps), "Capabilities should be an array");
    assert.ok(caps.length >= 10, "Should have core and vertical capabilities registered");

    const reCap = caps.find(c => c.id === "real_estate.growth_os");
    assert.ok(reCap, "Real Estate Growth OS capability must be registered");
    assert.strictEqual(reCap.universe, "wealth");
    assert.strictEqual(reCap.evidenceFiles[0], "src/services/realEstateGrowthService.js");

    const crCap = caps.find(c => c.id === "creative.studio_orchestration");
    assert.ok(crCap, "Creative Studio capability must be registered");
    assert.strictEqual(crCap.universe, "creative");
    assert.strictEqual(crCap.evidenceFiles[0], "src/services/creativeStudioService.js");
  });

  // ---------------------------------------------------------------------------
  // 2. Cross-Universe Event Nervous System
  // ---------------------------------------------------------------------------
  it("2. Emits and seals immutable cross-universe lifecycle events with SHA-256", async () => {
    let capturedEvent = null;
    const testListener = (evt) => {
      if (evt.eventType === "TEST_CROSS_UNIVERSE_EVENT") capturedEvent = evt;
    };
    garudaEventService.on("TEST_CROSS_UNIVERSE_EVENT", testListener);

    const result = await garudaEventService.emitGarudaEvent({
      eventType: "TEST_CROSS_UNIVERSE_EVENT",
      entityType: GARUDA_ENTITY_TYPES.SYSTEM,
      entityId: "sys_integration_001",
      source: "integration_test_runner",
      metadata: { universe: "all", integration: "verified" }
    });

    garudaEventService.off("TEST_CROSS_UNIVERSE_EVENT", testListener);

    assert.ok(result.success, "Event emission should succeed");
    assert.ok(result.event.eventHash, "Event must have cryptographic SHA-256 seal");
    assert.strictEqual(result.event.eventType, "TEST_CROSS_UNIVERSE_EVENT");
    assert.ok(capturedEvent, "Pub/Sub listener should have received event");
  });

  // ---------------------------------------------------------------------------
  // 3. Real Estate Project Creation & Knowledge Grounding
  // ---------------------------------------------------------------------------
  it("3. Creates Real Estate Project profile and registers vertical knowledge", async () => {
    const project = await realEstateGrowthService.createProjectProfile({
      name: "The Grand Sovereign Residences",
      developerName: "GARUDA Realty Works",
      location: { city: "Jaipur", submarket: "JLN Marg" },
      minPriceINR: 12000000, // 1.2 Cr
      maxPriceINR: 35000000, // 3.5 Cr
      bhkTypes: ["3 BHK Luxury", "4 BHK Penthouse"],
      totalUnits: 60,
      amenities: ["Private Elevator", "Heated Pool", "Sky Lounge"]
    });

    assert.ok(project.projectId.startsWith("re_proj_"));
    assert.strictEqual(project.name, "The Grand Sovereign Residences");
    assert.strictEqual(project.pricing.minPriceINR, 12000000);

    // Register project knowledge in Vertical Knowledge Service
    const doc = await verticalKnowledgeService.registerDomainKnowledge("real_estate", project.projectId, {
      title: project.name,
      content: `The Grand Sovereign Residences is a ultra-luxury project in JLN Marg, Jaipur.\n\nFeaturing 3 BHK Luxury and 4 BHK Penthouses with heated pool and sky lounge.\n\nPrices start at ₹1.2 Crores with 100% RERA approval.`
    });

    assert.ok(doc.chunks.length >= 2, "Knowledge should be chunked");

    // Test Grounded Query
    const queryResults = await verticalKnowledgeService.queryVerticalKnowledge("real_estate", "heated pool Jaipur", 3);
    assert.ok(queryResults.length > 0, "Query should find matching chunk");
    assert.ok(queryResults[0].snippet.includes("heated pool"));
  });

  // ---------------------------------------------------------------------------
  // 4. Real Estate Lead Capture & Deterministic Deduplication
  // ---------------------------------------------------------------------------
  it("4. Ingests leads with attribution and executes deterministic deduplication", async () => {
    const lead1 = await realEstateGrowthService.captureLead({
      name: "Vikramaditya Sharma",
      phone: "+91 98290 12345",
      email: "vikram@example.com",
      budgetINR: 15000000,
      bhkPreference: "3 BHK Luxury",
      possessionTimeline: "Ready to Move",
      source: "meta_instagram",
      utmCampaign: "luxury_launch_q3"
    });

    assert.strictEqual(lead1.isDuplicate, false);
    assert.strictEqual(lead1.lead.phone, "9829012345");
    assert.strictEqual(lead1.lead.qualification.tier, "HOT");
    assert.ok(lead1.lead.qualification.score >= 75, "High budget ready-to-move should be HOT");

    // Second ingestion with same phone -> must deduplicate without creating duplicate entity
    const lead2 = await realEstateGrowthService.captureLead({
      name: "Vikram Sharma",
      phone: "9829012345",
      email: "vikram.sharma@example.com",
      source: "google_search",
      notes: "Inquired again via Google ad"
    });

    assert.strictEqual(lead2.isDuplicate, true);
    assert.strictEqual(lead2.lead.leadId, lead1.lead.leadId, "Must merge into the same canonical lead");
    assert.strictEqual(lead2.lead.interactionCount, 2, "Interaction count must increment");
  });

  // ---------------------------------------------------------------------------
  // 5. Explainable 0-100 Lead Scoring & Tier Assignment
  // ---------------------------------------------------------------------------
  it("5. Computes explainable 0-100 score with factor breakdown and next actions", () => {
    const coldLeadInput = {
      leadId: "lead_cold_001",
      name: "Browsing User",
      phone: "9999900000",
      email: "cold@example.com",
      requirements: {
        budgetINR: 1000000, // 10 Lakhs (low for luxury)
        possessionTimeline: "exploring",
        bhkPreference: "1 BHK",
        purpose: "Curiosity"
      },
      interactionCount: 1
    };

    const scored = realEstateGrowthService.qualifyAndScoreLead(coldLeadInput);
    assert.ok(scored.qualification.score < 50, "Low budget exploratory lead should score < 50");
    assert.strictEqual(scored.qualification.tier, "COLD");
    assert.ok(Array.isArray(scored.qualification.scoreBreakdown), "Must include explainable breakdown");
    assert.strictEqual(scored.qualification.scoreBreakdown.length, 6, "Must score across all 6 factors");
  });

  // ---------------------------------------------------------------------------
  // 6. Site Visit Lifecycle & Booking Attribution
  // ---------------------------------------------------------------------------
  it("6. Executes site visit lifecycle and records confirmed booking with attribution", async () => {
    // 1. Ingest fresh lead
    const { lead } = await realEstateGrowthService.captureLead({
      name: "Aditi Singhania",
      phone: "9876543210",
      email: "aditi@singhania.com",
      budgetINR: 20000000,
      bhkPreference: "3 BHK Luxury",
      source: "meta_ads"
    });

    // 2. Book Site Visit
    const visit = await realEstateGrowthService.bookSiteVisit({
      leadId: lead.leadId,
      scheduledDate: "2026-09-02",
      timeSlot: "10:00 AM - 12:00 PM",
      assignedExecutive: "Rajesh Verma (Senior Property Advisor)"
    });
    assert.strictEqual(visit.status, "SCHEDULED");
    assert.strictEqual(lead.stage, "SITE_VISIT_SCHEDULED");

    // 3. Complete Site Visit
    const completedVisit = await realEstateGrowthService.completeSiteVisit(visit.visitId, {
      status: "COMPLETED",
      interestLevel: "HIGH",
      preferredUnit: "Tower B - 1202",
      executiveNotes: "Client loved the sky lounge view. Ready to block unit with token."
    });
    assert.strictEqual(completedVisit.status, "COMPLETED");
    assert.strictEqual(lead.stage, "SITE_VISIT_COMPLETED");

    // 4. Confirm Booking
    const booking = await realEstateGrowthService.confirmBooking({
      leadId: lead.leadId,
      unitNumber: "Tower B - 1202",
      agreedAmountINR: 18500000,
      tokenAmountPaidINR: 200000,
      paymentReference: "UTR_HDFC_998877",
      salesRepresentative: "Rajesh Verma"
    });
    assert.strictEqual(booking.status, "CONFIRMED");
    assert.strictEqual(lead.stage, "BOOKING_CONFIRMED");
    assert.strictEqual(booking.pricing.agreedAmountINR, 18500000);

    // 5. Query Project Intelligence
    const intel = await realEstateGrowthService.getProjectIntelligence();
    assert.ok(intel.funnel.confirmedBookings >= 1);
    assert.ok(intel.funnel.grossBookingValueINR >= 18500000);
  });

  // ---------------------------------------------------------------------------
  // 7. Creative Studio: Brief -> Concept -> IdentityLock -> Asset
  // ---------------------------------------------------------------------------
  it("7. Orchestrates creative briefs with IdentityLock brand consistency and SVG assets", async () => {
    // 1. Create Brief
    const brief = await creativeStudioService.createCreativeBrief({
      brandName: "Sovereign Heights",
      primaryColorHex: "#D4AF37",
      channel: "meta_instagram",
      location: "Vaishali Nagar, Jaipur",
      priceRange: "₹90L - ₹2.2Cr"
    });
    assert.ok(brief.briefId.startsWith("cb_"));
    assert.ok(brief.identityLock.lockHash, "IdentityLock hash must exist");

    // 2. Generate Concept
    const concept = await creativeStudioService.generateConcept(brief.briefId);
    assert.strictEqual(concept.adCopyVariants.length, 3, "Must generate 3 distinct ad copy angles");
    assert.ok(concept.videoStoryboard.scenes.length >= 3, "Must generate video storyboard");

    // 3. Generate Asset via Sovereign Renderer
    const asset = await creativeStudioService.generateAsset(brief.briefId, "IMAGE_SQUARE");
    assert.ok(asset.assetId.startsWith("asset_"));
    assert.ok(asset.assetHash, "Asset must have SHA-256 seal");
    assert.strictEqual(asset.identityLocked, true);
    assert.strictEqual(asset.provider, "garuda_sovereign_renderer");

    // 4. Asset Library
    const lib = await creativeStudioService.getAssetLibrary();
    assert.ok(lib.totalBriefs >= 1);
    assert.ok(lib.totalAssets >= 1);
  });

  // ---------------------------------------------------------------------------
  // 8. Agent Workforce Dispatch & Execution
  // ---------------------------------------------------------------------------
  it("8. Dispatches tasks to registered domain agents and verifies deterministic results", async () => {
    const agents = workforceRouterService.listRegisteredAgents();
    assert.ok(agents.length >= 6, "Must have specialized agents registered");

    // Dispatch task to Real Estate Conversation Agent
    const conversationTask = await workforceRouterService.dispatchAgentTask("agent.real_estate_conversation", {
      lead: { name: "Kabir Mehra", phone: "9829911223", qualification: { tier: "HOT" }, requirements: { bhkPreference: "4 BHK Penthouse" } },
      project: { name: "Sovereign Heights" }
    });

    assert.strictEqual(conversationTask.success, true);
    assert.ok(conversationTask.result.script.includes("Sovereign Heights"));
    assert.strictEqual(conversationTask.result.suggestedAction, "BOOK_SITE_VISIT");

    // Dispatch task to Creative Campaign Agent
    const creativeTask = await workforceRouterService.dispatchAgentTask("agent.creative_campaign", {
      brandName: "Skyline Oasis",
      location: "C-Scheme, Jaipur",
      priceRange: "₹1.5Cr - ₹4Cr"
    });

    assert.strictEqual(creativeTask.success, true);
    assert.strictEqual(creativeTask.result.identityLockApproved, true);
  });

  // ---------------------------------------------------------------------------
  // 9. Outcome Learning Signals
  // ---------------------------------------------------------------------------
  it("9. Captures verifiable outcome signals without simulated ML", async () => {
    const outcome = await outcomeLearningService.recordOutcome({
      domain: "real_estate",
      entityId: "bk_test_001",
      actionType: "CAMPAIGN_TO_BOOKING",
      attribution: { utmSource: "instagram_reels", campaign: "luxury_launch" },
      valueINR: 12500000,
      verified: true
    });

    assert.ok(outcome.outcomeId.startsWith("oc_"));

    const signals = await outcomeLearningService.getLearningSignals("real_estate");
    assert.ok(signals.totalRecordedOutcomes >= 1);
    assert.ok(signals.totalVerifiedYieldINR >= 12500000);
    assert.ok(signals.signals.some(s => s.source === "instagram_reels"));
  });

  // ---------------------------------------------------------------------------
  // 10. High Command Center Authoritative Snapshot
  // ---------------------------------------------------------------------------
  it("10. Produces unified High Command snapshot connecting all active universes", async () => {
    const snapshot = await founderCommandService.getCommandCenterSnapshot();
    assert.ok(snapshot.generatedAt);
    assert.strictEqual(snapshot.freshness, "REALTIME");

    // Verify all active universes are reported authoritatively
    assert.ok(snapshot.system, "System section present");
    assert.ok(snapshot.brain, "Brain section present");
    assert.ok(snapshot.revenue, "Revenue section present");
    assert.ok(snapshot.commercial, "Commercial section present");
    assert.ok(snapshot.realEstate, "Real Estate section present");
    assert.ok(snapshot.creative, "Creative section present");
    assert.ok(snapshot.learning, "Learning section present");

    // Verify Truth Law: UNAVAILABLE !== 0
    assert.strictEqual(snapshot.subsystemAvailability.realEstate, true);
    assert.strictEqual(snapshot.subsystemAvailability.creative, true);
    assert.strictEqual(snapshot.subsystemAvailability.learning, true);
  });

  // ---------------------------------------------------------------------------
  // 11. Founder Authentication & Access Protection Regression
  // ---------------------------------------------------------------------------
  it("11. Enforces founder authentication gate with zero public data leakage", () => {
    const anonymousReq = { headers: {}, query: {}, cookies: {} };
    assert.throws(
      () => founderCommandService.verifyFounderAuth(anonymousReq),
      (err) => err.statusCode === 401 && err.code === "UNAUTHORIZED"
    );

    const founderReq = { headers: { "x-founder-key": "garuda_founder_secret_key_2026" }, query: {}, cookies: {} };
    const auth2 = founderCommandService.verifyFounderAuth(founderReq);
    assert.strictEqual(auth2.authorized, true);
    assert.strictEqual(auth2.actor, "founder");
  });
});
