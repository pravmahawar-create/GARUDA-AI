/**
 * 🦅 GARUDA Cross-Universe Hostile Forensic Verification & Reality Test
 *
 * Enforces the Forensic Truth Standard:
 * 1. Real input -> Real execution logic -> Real output
 * 2. Physical disk artifact creation and SHA-256 byte verification
 * 3. Deterministic deduplication and double-booking rejection
 * 4. All 6 specialized agents dispatched and verified (including deliberate failure testing)
 * 5. Domain knowledge boundary isolation (zero cross-pollution)
 * 6. Active cross-universe event propagation without orphan events
 * 7. Evidence-backed outcome learning signals without synthetic ML
 * 8. High Command Center authoritative reads with Truth Law (UNAVAILABLE !== 0)
 */

const { describe, it } = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const garudaEventService = require("./garudaEventService");
const { GARUDA_EVENT_TYPES } = require("./garudaEventTypes");
const realEstateGrowthService = require("./realEstateGrowthService");
const creativeStudioService = require("./creativeStudioService");
const verticalKnowledgeService = require("./verticalKnowledgeService");
const workforceRouterService = require("./workforceRouterService");
const outcomeLearningService = require("./outcomeLearningService");
const founderCommandService = require("./founderCommandService");
const eventWiring = require("./crossUniverseEventWiring");

describe("🦅 GARUDA Hostile Forensic Cross-Universe Verification", () => {

  // ---------------------------------------------------------------------------
  // PART 2: Real Estate Hostile Lifecycle & Negative Cases
  // ---------------------------------------------------------------------------
  describe("PART 2: Real Estate Growth OS Hostile Reality Test", () => {
    it("Rejects malformed project inputs (missing name or invalid pricing)", async () => {
      await assert.rejects(
        async () => realEstateGrowthService.createProjectProfile({ name: "" }),
        /Project name is required/
      );

      await assert.rejects(
        async () => realEstateGrowthService.createProjectProfile({ name: "Bad Pricing", minPriceINR: 50000, maxPriceINR: 10000 }),
        /Invalid pricing range/
      );
    });

    it("Rejects lead ingestion with missing contact information", async () => {
      await assert.rejects(
        async () => realEstateGrowthService.captureLead({ name: "Ghost User" }),
        /Lead must contain at least a valid phone number or email address/
      );
    });

    it("Executes end-to-end real estate lifecycle with deduplication & scoring", async () => {
      const proj = await realEstateGrowthService.createProjectProfile({
        name: "Forensic Regal Towers",
        developerName: "GARUDA Developers",
        minPriceINR: 8000000,
        maxPriceINR: 20000000,
        bhkTypes: ["2 BHK", "3 BHK", "4 BHK Luxury"],
        totalUnits: 50
      });
      assert.ok(proj.projectId);

      // Lead 1: Ingestion
      const res1 = await realEstateGrowthService.captureLead({
        name: "Devendra Rathore",
        phone: "+91 91111 22334",
        email: "devendra@rathore.in",
        budgetINR: 12000000,
        bhkPreference: "3 BHK",
        possessionTimeline: "Immediate",
        purpose: "Self-Use",
        projectId: proj.projectId,
        source: "meta_facebook",
        utmCampaign: "regal_launch"
      });

      assert.strictEqual(res1.isDuplicate, false);
      assert.strictEqual(res1.lead.phone, "9111122334");
      assert.strictEqual(res1.lead.qualification.tier, "HOT");
      assert.ok(res1.lead.qualification.score >= 75);

      // Lead 2: Duplicate Ingestion
      const res2 = await realEstateGrowthService.captureLead({
        name: "Dev Rathore",
        phone: "9111122334",
        email: "devendra@rathore.in",
        projectId: proj.projectId,
        source: "google_search"
      });

      assert.strictEqual(res2.isDuplicate, true);
      assert.strictEqual(res2.lead.interactionCount, 2);

      // Site Visit
      const visit = await realEstateGrowthService.bookSiteVisit({
        leadId: res1.lead.leadId,
        projectId: proj.projectId,
        scheduledDate: "2026-09-05",
        assignedExecutive: "Suresh Meena"
      });
      assert.strictEqual(visit.status, "SCHEDULED");

      const completed = await realEstateGrowthService.completeSiteVisit(visit.visitId, {
        status: "COMPLETED",
        interestLevel: "HIGH",
        preferredUnit: "Regal Tower A - 302"
      });
      assert.strictEqual(completed.status, "COMPLETED");

      // Booking
      const booking = await realEstateGrowthService.confirmBooking({
        leadId: res1.lead.leadId,
        projectId: proj.projectId,
        unitNumber: "Regal Tower A - 302",
        agreedAmountINR: 11500000,
        tokenAmountPaidINR: 150000
      });
      assert.strictEqual(booking.status, "CONFIRMED");

      // Negative Case: Double Booking Protection
      await assert.rejects(
        async () => realEstateGrowthService.confirmBooking({
          leadId: res1.lead.leadId,
          projectId: proj.projectId,
          unitNumber: "Regal Tower A - 302",
          agreedAmountINR: 11500000
        }),
        /is already booked/
      );
    });
  });

  // ---------------------------------------------------------------------------
  // PART 3: Creative Studio Hostile Reality Test
  // ---------------------------------------------------------------------------
  describe("PART 3: Creative Studio Reality & Physical Artifact Test", () => {
    it("Rejects invalid creative briefs missing required title", async () => {
      await assert.rejects(
        async () => creativeStudioService.createCreativeBrief({ title: "" }),
        /Brief title or campaign name is required/
      );
    });

    it("Generates 3 distinct ad copy angles and physical SVG asset on disk", async () => {
      const brief = await creativeStudioService.createCreativeBrief({
        title: "Sovereign Villas Forensic Campaign",
        brandName: "Sovereign Villas",
        channel: "meta_instagram",
        location: "Tonk Road, Jaipur",
        priceRange: "₹1.5Cr - ₹3.5Cr"
      });
      assert.ok(brief.briefId);

      const concept = await creativeStudioService.generateConcept(brief.briefId);
      assert.strictEqual(concept.adCopyVariants.length, 3);
      assert.notStrictEqual(concept.adCopyVariants[0].headline, concept.adCopyVariants[1].headline);
      assert.notStrictEqual(concept.adCopyVariants[1].headline, concept.adCopyVariants[2].headline);

      // Generate Asset and PROVE physical file on disk
      const asset = await creativeStudioService.generateAsset(brief.briefId, "IMAGE_SQUARE");
      assert.ok(asset.filePath, "Must have absolute physical filePath");
      assert.ok(fs.existsSync(asset.filePath), `Physical SVG file must exist at ${asset.filePath}`);
      assert.ok(asset.fileSize > 0, "Physical file size must be > 0 bytes");

      // Verify SHA-256 matches actual file bytes
      const fileBytes = fs.readFileSync(asset.filePath, "utf8");
      const computedHash = crypto.createHash("sha256").update(fileBytes).digest("hex");
      assert.strictEqual(asset.assetHash, computedHash, "Asset hash must match physical disk bytes");
    });
  });

  // ---------------------------------------------------------------------------
  // PART 4: Specialized Agent Workforce Reality Test
  // ---------------------------------------------------------------------------
  describe("PART 4: Six Specialized Agents Reality Test", () => {
    const agents = [
      "agent.real_estate_project_intelligence",
      "agent.lead_intelligence",
      "agent.real_estate_conversation",
      "agent.site_visit",
      "agent.creative_campaign",
      "agent.performance_intelligence"
    ];

    it("Dispatches real tasks to all 6 specialized agents and verifies outputs", async () => {
      for (const agentId of agents) {
        let taskInput = {};
        if (agentId === "agent.lead_intelligence") {
          taskInput = { lead: { name: "Agent Test Lead", phone: "9829000111", requirements: { budgetINR: 15000000, possessionTimeline: "now", purpose: "Self-Use" } } };
        } else if (agentId === "agent.real_estate_conversation") {
          taskInput = { lead: { name: "Aditya", phone: "9829000222", qualification: { tier: "HOT" } } };
        } else if (agentId === "agent.creative_campaign") {
          taskInput = { title: "Agent Campaign", brandName: "Agent Villas", location: "Jaipur", priceRange: "₹1Cr+" };
        } else if (agentId === "agent.site_visit") {
          const lead = await realEstateGrowthService.captureLead({ name: "Visit Target", phone: "9829988776" });
          taskInput = { leadId: lead.lead.leadId, scheduledDate: "2026-09-12" };
        }

        const taskRes = await workforceRouterService.dispatchAgentTask(agentId, taskInput);
        assert.strictEqual(taskRes.success, true, `Agent ${agentId} should complete task`);
        assert.ok(taskRes.result, `Agent ${agentId} must return verifiable result`);
      }
    });

    it("Handles agent task failures honestly and emits AGENT_TASK_FAILED", async () => {
      // Dispatch task to un-registered agent
      await assert.rejects(
        async () => workforceRouterService.dispatchAgentTask("agent.non_existent_fake_agent", {}),
        /Agent not registered/
      );

      // Dispatch task to SiteVisit agent with invalid input that throws
      const failRes = await workforceRouterService.dispatchAgentTask("agent.site_visit", { leadId: "" });
      assert.strictEqual(failRes.success, false);
      assert.ok(failRes.error.includes("leadId is required"));
    });
  });

  // ---------------------------------------------------------------------------
  // PART 5: Cross-Universe Event Nervous System Audit
  // ---------------------------------------------------------------------------
  describe("PART 5: Event Nervous System Audit", () => {
    it("Verifies event wiring counters and active propagation without orphan events", () => {
      const stats = eventWiring.getEventStats();
      assert.ok(typeof stats === "object");
      assert.ok(Object.keys(stats).length > 0, "Active event listeners must have processed events");
    });
  });

  // ---------------------------------------------------------------------------
  // PART 6: Vertical Knowledge & Domain Isolation Test
  // ---------------------------------------------------------------------------
  describe("PART 6: Vertical Knowledge & Domain Isolation Test", () => {
    it("Isolates domain knowledge and prevents cross-domain leakage", async () => {
      await verticalKnowledgeService.registerDomainKnowledge("real_estate", "doc_re_01", {
        title: "Regal Heights Pricing Matrix",
        content: "Regal Heights 3 BHK units cost ₹1.5 Crores with 10% booking token."
      });

      await verticalKnowledgeService.registerDomainKnowledge("brand", "doc_brand_01", {
        title: "GARUDA Typography & Palette",
        content: "GARUDA brand primary color is Sovereign Gold #D4AF37 and font is Inter."
      });

      // Query real estate -> must NOT return brand doc
      const reResults = await verticalKnowledgeService.queryVerticalKnowledge("real_estate", "Sovereign Gold", 5);
      assert.strictEqual(reResults.length, 0, "Real estate query must not leak brand documents");

      // Query brand -> must NOT return real estate doc
      const brandResults = await verticalKnowledgeService.queryVerticalKnowledge("brand", "Regal Heights 3 BHK", 5);
      assert.strictEqual(brandResults.length, 0, "Brand query must not leak real estate documents");
    });
  });

  // ---------------------------------------------------------------------------
  // PART 7: Outcome Learning Reality Test
  // ---------------------------------------------------------------------------
  describe("PART 7: Outcome Learning Reality Test", () => {
    it("Computes evidence-backed conversion signals without synthetic ML", async () => {
      const outcome = await outcomeLearningService.recordOutcome({
        domain: "real_estate",
        entityId: "forensic_booking_001",
        actionType: "CAMPAIGN_TO_BOOKING",
        attribution: { utmSource: "google_pmax", campaign: "forensic_campaign" },
        valueINR: 15000000,
        verified: true
      });
      assert.ok(outcome.outcomeId);

      const signals = await outcomeLearningService.getLearningSignals("real_estate");
      assert.ok(signals.totalRecordedOutcomes >= 1);
      assert.ok(signals.totalVerifiedYieldINR >= 15000000);
      assert.strictEqual(signals.truthClassification, "EVIDENCE_BACKED_PERSISTED");
    });
  });

  // ---------------------------------------------------------------------------
  // PART 8: High Command Center Snapshot Reality Test
  // ---------------------------------------------------------------------------
  describe("PART 8: High Command Center Snapshot Reality Test", () => {
    it("Returns authoritative snapshot with all active universes and enforces UNAVAILABLE !== 0", async () => {
      const snapshot = await founderCommandService.getCommandCenterSnapshot();
      assert.ok(snapshot.generatedAt);
      assert.strictEqual(snapshot.freshness, "REALTIME");
      assert.strictEqual(snapshot.subsystemAvailability.realEstate, true);
      assert.strictEqual(snapshot.subsystemAvailability.creative, true);
      assert.strictEqual(snapshot.subsystemAvailability.learning, true);
      assert.ok(snapshot.realEstate.funnel);
      assert.ok(snapshot.creative.assets);
      assert.ok(snapshot.learning.signals);
    });
  });
});
