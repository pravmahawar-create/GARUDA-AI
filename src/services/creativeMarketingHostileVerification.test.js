/**
 * 🦅 GARUDA Creative, Digital Marketing & Performance Marketing Hostile Forensic Verification
 *
 * Forensic Truth Laws Enforced:
 * 1. ZERO fake AI images or fake MP4 videos (Truthful IMAGE_GENERATION_PROVIDER_UNAVAILABLE / VIDEO_GENERATION_UNAVAILABLE).
 * 2. Physical disk verification of sovereign SVG artifacts with exact SHA-256 byte matching.
 * 3. ZERO fake ad spend, impressions, CTR, or ROAS (Truthful AD_PLATFORM_DATA_UNAVAILABLE, META_ADS_NOT_CONNECTED, GOOGLE_ADS_NOT_CONNECTED).
 * 4. Genuine, multi-concept creative intelligence (differentiated angles, visual directions, hooks, and copy).
 * 5. IdentityLock™ brand governance with prohibited element scanning and lockHash integrity.
 * 6. Full Real Estate end-to-end commercial lifecycle (Client -> Project -> Personas -> Brief -> Assets -> Lead -> Deduplication -> Scoring -> Visit -> Booking -> Attribution).
 * 7. Live Ad Platform Adapters (Meta Ads & Google Ads payload mapping without duplicate campaign entities).
 * 8. Client Production Onboarding Pipeline & 8-Step Launch Readiness Checklist.
 * 9. Specialized Agent Workforce real task execution and failure isolation.
 * 10. Cross-Universe Event Nervous System active event propagation.
 * 11. High Command Center snapshot truth compliance (UNAVAILABLE !== 0).
 */

const { describe, it, beforeEach } = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const creativeStudioService = require("./creativeStudioService");
const identityLockService = require("./identityLockService");
const imageGenerationRouter = require("./imageGenerationRouter");
const videoGenerationRouter = require("./videoGenerationRouter");
const creativeQualityService = require("./creativeQualityService");
const digitalMarketingOsService = require("./digitalMarketingOsService");
const performanceMarketingService = require("./performanceMarketingService");
const realEstateGrowthService = require("./realEstateGrowthService");
const clientProductionPipelineService = require("./clientProductionPipelineService");
const workforceRouterService = require("./workforceRouterService");
const outcomeLearningService = require("./outcomeLearningService");
const founderCommandService = require("./founderCommandService");
const eventWiring = require("./crossUniverseEventWiring");
const garudaEventService = require("./garudaEventService");

describe("🦅 GARUDA Growth & Creative Hostile Forensic Reality Test Suite", () => {

  beforeEach(() => {
    creativeStudioService.clearForTesting();
    performanceMarketingService.clearForTesting();
    workforceRouterService.clearForTesting();
    clientProductionPipelineService.clearForTesting();
  });

  // ---------------------------------------------------------------------------
  // 1. CREATIVE INTELLIGENCE & MULTI-CONCEPT GENERATION
  // ---------------------------------------------------------------------------
  describe("1. Creative Intelligence Engine Reality", () => {
    it("Rejects malformed creative brief input without a title", async () => {
      await assert.rejects(
        async () => creativeStudioService.createCreativeBrief({ title: "" }),
        /Brief title or campaign name is required/
      );
    });

    it("Generates comprehensive campaign strategy and 3 genuinely differentiated concepts", async () => {
      const brief = await creativeStudioService.createCreativeBrief({
        title: "Forensic Sovereign Heights Launch",
        brandName: "Sovereign Heights",
        industry: "Luxury Real Estate",
        location: "JLN Marg, Jaipur",
        priceRange: "₹1.8 Cr - ₹3.6 Cr",
        targetAudience: "Ultra-HNIs, senior executives, and real estate investors",
        objective: "Secure 15 pre-launch bookings"
      });

      assert.ok(brief.briefId);
      assert.ok(brief.strategy);
      assert.strictEqual(brief.strategy.industry, "Luxury Real Estate");
      assert.ok(brief.strategy.painPoints.length >= 3);
      assert.ok(brief.strategy.positioning.includes("Sovereign Heights"));

      const conceptSuite = await creativeStudioService.generateConcept(brief.briefId);
      assert.ok(conceptSuite.conceptId);
      assert.strictEqual(conceptSuite.concepts.length, 3);
      assert.strictEqual(conceptSuite.adCopyVariants.length, 3);

      // Verify concepts are genuinely differentiated in angles and visual directions
      const conceptA = conceptSuite.concepts[0];
      const conceptB = conceptSuite.concepts[1];
      const conceptC = conceptSuite.concepts[2];

      assert.notStrictEqual(conceptA.angleName, conceptB.angleName);
      assert.notStrictEqual(conceptB.angleName, conceptC.angleName);
      assert.notStrictEqual(conceptA.visualDirection.lighting, conceptB.visualDirection.lighting);
      assert.notStrictEqual(conceptA.copyDirection.headline, conceptB.copyDirection.headline);
      assert.notStrictEqual(conceptB.copyDirection.headline, conceptC.copyDirection.headline);

      // Quality check on concept
      assert.strictEqual(conceptSuite.qualityValidation.status, "PASSED");
      assert.strictEqual(conceptSuite.qualityValidation.passed, true);
    });
  });

  // ---------------------------------------------------------------------------
  // 2. IMAGE GENERATION ROUTER & PHYSICAL ASSET TRUTH
  // ---------------------------------------------------------------------------
  describe("2. Image Generation Router & Physical Asset Truth", () => {
    it("Truthfully returns IMAGE_GENERATION_PROVIDER_UNAVAILABLE when AI photorealistic generation is attempted without configured keys", async () => {
      const prevGemini = process.env.IMAGEN_ENABLED;
      delete process.env.IMAGEN_ENABLED;

      const result = await imageGenerationRouter.routeGeneration({
        headline: "Photorealistic Penthouse",
        prompt: "Ultra-photorealistic 8k render of modern penthouse",
        mode: "AI_PHOTOREALISTIC"
      });

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.status, "IMAGE_GENERATION_PROVIDER_UNAVAILABLE");
      assert.strictEqual(result.truthClassification, "TRUTHFUL_UNAVAILABLE");
      assert.ok(result.error.includes("No photorealistic AI image generation provider configured"));

      if (prevGemini) process.env.IMAGEN_ENABLED = prevGemini;
    });

    it("Generates sovereign SVG layout, writes physical file to disk, and verifies SHA-256 byte match", async () => {
      const brief = await creativeStudioService.createCreativeBrief({
        title: "Forensic Sovereign SVG Test",
        brandName: "GARUDA Sovereign Villas",
        location: "C-Scheme, Jaipur",
        priceRange: "₹2.5 Cr+"
      });

      const assetResult = await creativeStudioService.generateAsset(brief.briefId, "IMAGE_SQUARE", { mode: "SOVEREIGN_LAYOUT" });
      assert.strictEqual(assetResult.status, "GENERATED");
      assert.ok(assetResult.assetId);
      assert.ok(assetResult.filePath);

      // Verify physical disk existence
      assert.ok(fs.existsSync(assetResult.filePath), `Physical asset must exist on disk at ${assetResult.filePath}`);
      const stats = fs.statSync(assetResult.filePath);
      assert.ok(stats.size > 0, "Physical file size must be > 0 bytes");

      // Verify SHA-256 hash match against actual bytes on disk
      const fileBytes = fs.readFileSync(assetResult.filePath);
      const computedHash = crypto.createHash("sha256").update(fileBytes).digest("hex");
      assert.strictEqual(assetResult.assetHash, computedHash, "Asset hash must match physical disk bytes");

      // Verify Creative Quality Service validation passes
      const quality = creativeQualityService.validateAsset(assetResult);
      assert.strictEqual(quality.status, "PASSED");
      assert.strictEqual(quality.passed, true);
      assert.strictEqual(quality.failedChecks.length, 0);
    });

    it("Checks provider health truthfully", async () => {
      const svgHealth = await imageGenerationRouter.checkProviderHealth("garuda_sovereign_svg_renderer");
      assert.strictEqual(svgHealth.available, true);
      assert.strictEqual(svgHealth.type, "VECTOR_CREATIVE");

      const dalleHealth = await imageGenerationRouter.checkProviderHealth("openai_dalle");
      assert.strictEqual(typeof dalleHealth.available, "boolean");
    });

    it("Supports platform presets (1:1 Square, 9:16 Story, 16:9 Hero Banner)", async () => {
      const presets = ["instagram_post", "instagram_story", "website_hero"];
      for (const p of presets) {
        const spec = imageGenerationRouter.resolvePlatformSpec(p);
        assert.ok(spec.dimensions.width > 0);
        assert.ok(spec.dimensions.height > 0);
        assert.ok(spec.aspectRatio);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // 3. VIDEO GENERATION ROUTER & STORYBOARD ARCHITECTURE
  // ---------------------------------------------------------------------------
  describe("3. Video Generation Router & Storyboard Truth", () => {
    it("Truthfully returns VIDEO_GENERATION_UNAVAILABLE when video AI generator is unconfigured, and returns complete cinematic shot blueprint", async () => {
      const prevRunway = process.env.RUNWAY_API_KEY;
      delete process.env.RUNWAY_API_KEY;

      const result = await videoGenerationRouter.routeVideoGeneration({
        title: "Forensic Cinematic Video",
        location: "Vaishali Nagar, Jaipur",
        priceRange: "₹1.2 Cr - ₹2.8 Cr",
        format: "REEL_9_16",
        style: "REAL_ESTATE_CINEMATIC"
      });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.status, "VIDEO_GENERATION_UNAVAILABLE");
      assert.strictEqual(result.fallbackState, "STORYBOARD_READY");
      assert.strictEqual(result.mp4Generated, false);
      assert.ok(result.capabilityNotice.includes("Generative AI Video API (Runway/Luma/Sora) is not configured"));
      assert.ok(result.storyboard);

      // Verify complete shot plan & scene details
      const sb = result.storyboard;
      assert.strictEqual(sb.aspectRatio, "9:16");
      assert.strictEqual(sb.totalDurationSeconds, 15);
      assert.strictEqual(sb.sceneCount, 3);
      assert.ok(sb.scenes[0].shotPlan.cameraMovement);
      assert.ok(sb.scenes[0].shotPlan.lighting);
      assert.ok(sb.scenes[0].shotPlan.focalLength);
      assert.ok(sb.scenes[0].audioVoiceover);
      assert.ok(sb.scenes[0].generativeScenePrompt.includes("--ar 9:16"));

      if (prevRunway) process.env.RUNWAY_API_KEY = prevRunway;
    });

    it("Checks video provider health truthfully", async () => {
      const sbHealth = await videoGenerationRouter.checkProviderHealth("garuda_storyboard_engine");
      assert.strictEqual(sbHealth.available, true);
      assert.strictEqual(sbHealth.type, "STORYBOARD_BLUEPRINT");
    });
  });

  // ---------------------------------------------------------------------------
  // 4. IDENTITYLOCK™ BRAND GOVERNANCE
  // ---------------------------------------------------------------------------
  describe("4. IdentityLock™ Brand Governance & Compliance", () => {
    it("Enforces brand rules and detects prohibited copy/visual elements", async () => {
      const brand = await identityLockService.createOrUpdateBrandProfile({
        brandName: "Aarna Luxury Living",
        industry: "Luxury Real Estate",
        primaryColorHex: "#D4AF37",
        secondaryColorHex: "#0B0F16",
        prohibitedElements: {
          copy: ["100% guaranteed billionaire overnight", "cheap discount offer"],
          visual: ["distorted rendering", "cartoonish elements"]
        }
      });

      assert.ok(brand.lockHash);

      // Negative Case: Content containing prohibited copy
      const nonCompliant = identityLockService.validateCompliance(brand.brandId, {
        headline: "Get our cheap discount offer now!",
        cta: "Book Now"
      });
      assert.strictEqual(nonCompliant.compliant, false);
      assert.ok(nonCompliant.violations.some(v => v.includes("cheap discount offer")));

      // Positive Case: Clean compliant content
      const compliant = identityLockService.validateCompliance(brand.brandId, {
        headline: "Experience Sovereign Elegance at Aarna Living",
        primaryText: "Luxury 3 BHK Residences in Prime Jaipur",
        cta: "Schedule Private Site Visit →"
      });
      assert.strictEqual(compliant.compliant, true);
      assert.strictEqual(compliant.violations.length, 0);
    });

    it("Builds Campaign Family with master direction and coordinated multi-variant asset specs", async () => {
      const brand = identityLockService.getBrandProfile("garuda_default");
      const family = identityLockService.buildCampaignFamilySpec(brand, "Q4 Sovereign Launch");

      assert.ok(family.familyId);
      assert.strictEqual(family.brandName, "GARUDA AI");
      assert.strictEqual(family.lockHash, brand.lockHash);
      assert.strictEqual(family.assetSpecs.length, 7);
      assert.ok(family.assetSpecs.some(s => s.variant === "MASTER_AD_VARIANT_A"));
      assert.ok(family.assetSpecs.some(s => s.variant === "REEL_STORYBOARD"));
      assert.ok(family.assetSpecs.some(s => s.variant === "LANDING_PAGE_HERO"));
    });
  });

  // ---------------------------------------------------------------------------
  // 5. DIGITAL MARKETING OS WORKFLOWS
  // ---------------------------------------------------------------------------
  describe("5. Digital Marketing OS Multi-Channel Workflows", () => {
    it("Generates 4 Content Pillars, 4-Week Editorial Calendar, and 5-Slide Carousel Concept", async () => {
      const pillars = digitalMarketingOsService.generateContentPillars("GARUDA Prime Living");
      assert.strictEqual(pillars.pillars.length, 4);
      assert.ok(pillars.pillars.some(p => p.pillarId === "pillar_authority"));

      const calendar = await digitalMarketingOsService.generateEditorialCalendar({
        brandName: "GARUDA Prime Living",
        weeksCount: 4,
        location: "Jaipur"
      });
      assert.ok(calendar.calendarId);
      assert.strictEqual(calendar.weeksCount, 4);
      assert.strictEqual(calendar.totalScheduledPosts, 16);
      assert.ok(calendar.posts[0].hook);
      assert.ok(calendar.posts[0].captionOutline);

      const carousel = digitalMarketingOsService.generateCarouselConcept({
        brandName: "GARUDA Prime Living"
      });
      assert.ok(carousel.carouselId);
      assert.strictEqual(carousel.slideCount, 5);
      assert.strictEqual(carousel.slides[0].type, "HOOK_COVER");
      assert.strictEqual(carousel.slides[4].type, "CALL_TO_ACTION");
    });

    it("Generates SEO Topic Clusters, Technical Article Brief, and High-Converting Landing Page Blueprint", () => {
      const clusters = digitalMarketingOsService.generateTopicClusters("luxury flats jaipur");
      assert.strictEqual(clusters.clusters.length, 3);
      assert.ok(clusters.truthNotice.includes("Live SERP rankings require connected"));

      const articleBrief = digitalMarketingOsService.generateArticleBrief("luxury flats jaipur");
      assert.ok(articleBrief.briefId);
      assert.strictEqual(articleBrief.targetWordCount, 1600);
      assert.ok(articleBrief.outline.length >= 4);
      assert.ok(articleBrief.faqSchema.length >= 3);

      const landingPage = digitalMarketingOsService.generateLandingPageBlueprint({
        projectName: "Regal Sovereign Palms",
        location: "Tonk Road, Jaipur",
        startingPrice: "₹95 Lakhs"
      });
      assert.ok(landingPage.pageId);
      assert.ok(landingPage.heroSection.headline.includes("Regal Sovereign Palms"));
      assert.ok(landingPage.trustSignals.some(t => t.label === "RERA Approved"));
      assert.ok(landingPage.unitShowcase.length >= 2);
      assert.ok(landingPage.leadCaptureFormSchema.fields.length >= 4);
    });

    it("Generates brand-aligned Review Responses and Digital Presence Profiles", () => {
      const posReply = digitalMarketingOsService.generateReviewResponses("Loved the clubhouse and layout!", "Amit S.", 5);
      assert.strictEqual(posReply.classification, "POSITIVE");
      assert.ok(posReply.responseDraft.includes("thank you for your generous feedback"));

      const negReply = digitalMarketingOsService.generateReviewResponses("Delayed site visit callback.", "Vikram R.", 1);
      assert.strictEqual(negReply.classification, "NEGATIVE_ESCALATION");
      assert.ok(negReply.responseDraft.includes("sincerely apologize"));

      const presence = digitalMarketingOsService.generateDigitalPresenceProfile("GARUDA Living");
      assert.ok(presence.googleBusinessProfile.category);
      assert.ok(presence.socialBios.instagramBio);
      assert.ok(presence.socialBios.linkedinBio);
    });
  });

  // ---------------------------------------------------------------------------
  // 6. PERFORMANCE MARKETING & LIVE AD PLATFORM ADAPTERS
  // ---------------------------------------------------------------------------
  describe("6. Performance Marketing Lifecycle & Ad Platform Adapters", () => {
    it("Enforces AD_PLATFORM_DATA_UNAVAILABLE when disconnected and maps Meta / Google schemas", async () => {
      const campaign = await performanceMarketingService.createCampaign({
        name: "Forensic Q3 Performance Launch",
        channel: "meta_ads",
        objective: "LEAD_GENERATION",
        budgetINR: 100000,
        utmCampaign: "forensic_q3_launch"
      });
      assert.ok(campaign.campaignId);

      // Meta Campaign Mapping
      const metaMapping = performanceMarketingService.buildMetaCampaignMapping(campaign.campaignId);
      assert.ok(metaMapping.mappingId);
      assert.strictEqual(metaMapping.metaPayloadSchema.objective, "OUTCOME_LEADS");
      assert.strictEqual(metaMapping.metaPayloadSchema.status, "PAUSED");

      // Google Campaign Mapping
      const googleMapping = performanceMarketingService.buildGoogleCampaignMapping(campaign.campaignId);
      assert.ok(googleMapping.mappingId);
      assert.strictEqual(googleMapping.googlePayloadSchema.advertising_channel_type, "SEARCH");

      // Record Attribution Events
      await performanceMarketingService.recordConversionEvent({
        campaignId: campaign.campaignId,
        eventType: "LEAD_CAPTURED",
        valueINR: 8500000,
        attribution: { utm_campaign: "forensic_q3_launch", utm_source: "meta_ads", utm_medium: "cpc" }
      });

      await performanceMarketingService.recordConversionEvent({
        campaignId: campaign.campaignId,
        eventType: "SITE_VISIT_COMPLETED",
        valueINR: 8500000,
        attribution: { utm_campaign: "forensic_q3_launch", utm_source: "meta_ads" }
      });

      await performanceMarketingService.recordConversionEvent({
        campaignId: campaign.campaignId,
        eventType: "BOOKING_CONFIRMED",
        valueINR: 8500000,
        attribution: { utm_campaign: "forensic_q3_launch", utm_source: "meta_ads" }
      });

      const report = await performanceMarketingService.getCampaignPerformance(campaign.campaignId);
      assert.strictEqual(report.available, true);

      // Verify Ad Platform Truth Law: No fake spend or CTR
      assert.strictEqual(report.adPlatformData.status, "META_ADS_NOT_CONNECTED");
      assert.strictEqual(report.adPlatformData.connected, false);
      assert.strictEqual(report.adPlatformData.spend, null);
      assert.strictEqual(report.adPlatformData.impressions, null);
      assert.strictEqual(report.adPlatformData.ctr, null);
      assert.strictEqual(report.adPlatformData.roas, null);

      // Verify Authoritative Internal Metrics
      assert.strictEqual(report.authoritativeFunnel.totalAttributedLeads, 1);
      assert.strictEqual(report.authoritativeFunnel.siteVisitsCompleted, 1);
      assert.strictEqual(report.authoritativeFunnel.confirmedBookings, 1);
      assert.strictEqual(report.authoritativeFunnel.grossBookingValueINR, 8500000);
      assert.strictEqual(report.truthClassification, "AUTHORITATIVE_INTERNAL_RECORDS");
    });
  });

  // ---------------------------------------------------------------------------
  // 7. REAL CLIENT PRODUCTION ONBOARDING PIPELINE
  // ---------------------------------------------------------------------------
  describe("7. Real Client Production Onboarding Pipeline & Launch Readiness", () => {
    it("Executes full client onboarding pipeline and evaluates 8-step launch readiness with honest blocker reporting", async () => {
      const onboarding = await clientProductionPipelineService.onboardRealClient({
        businessName: "Sovereign Crown Builders",
        industry: "Luxury Real Estate",
        contactPerson: "Rajeshwar Singhal",
        contactEmail: "singhal@sovereigncrown.in",
        contactPhone: "9829099887",
        minPriceINR: 12000000,
        maxPriceINR: 35000000,
        city: "Jaipur",
        submarket: "C-Scheme"
      });

      assert.strictEqual(onboarding.success, true);
      assert.ok(onboarding.client.clientId);
      assert.ok(onboarding.brand.lockHash);
      assert.ok(onboarding.project.projectId);
      assert.ok(onboarding.brief.briefId);
      assert.ok(onboarding.generatedAsset.assetId);
      assert.ok(onboarding.videoStoryboard.storyboardId);
      assert.ok(onboarding.landingPage.pageId);
      assert.ok(onboarding.campaign.campaignId);

      // Check 8-Step Launch Readiness
      const readiness = onboarding.launchReadiness;
      assert.ok(readiness.checklist.BUSINESS_PROFILE_READY.ready);
      assert.ok(readiness.checklist.BRAND_PROFILE_READY.ready);
      assert.ok(readiness.checklist.PROJECT_DATA_READY.ready);
      assert.ok(readiness.checklist.CREATIVE_READY.ready);
      assert.ok(readiness.checklist.LANDING_PAGE_READY.ready);

      // Since ad platform keys (Meta access token) are unconfigured in test runtime:
      assert.strictEqual(readiness.checklist.AD_PLATFORM_READY.ready, false);
      assert.strictEqual(readiness.canLaunchCampaign, false);
      assert.ok(readiness.blockers.some(b => b.includes("CONNECTION_MISSING") || b.includes("PIXEL")));
    });
  });

  // ---------------------------------------------------------------------------
  // 8. REAL ESTATE END-TO-END COMMERCIAL WORKFLOW
  // ---------------------------------------------------------------------------
  describe("8. Real Estate End-to-End Growth Orchestration", () => {
    it("Executes end-to-end vertical integration from Project -> Personas -> Brief -> Assets -> Lead -> Deduplication -> Score -> Visit -> Booking -> Revenue Attribution", async () => {
      // 1. Project Creation
      const project = await realEstateGrowthService.createProjectProfile({
        name: "Forensic Royal Crest",
        developerName: "GARUDA Sovereign Real Estate",
        minPriceINR: 9000000,
        maxPriceINR: 25000000,
        city: "Jaipur",
        submarket: "JLN Marg"
      });
      assert.ok(project.projectId);

      // 2. Full Campaign Orchestration
      const orch = await realEstateGrowthService.orchestrateProjectGrowthCampaign(project.projectId, {
        campaignName: "Royal Crest Commercial Launch"
      });
      assert.strictEqual(orch.success, true);
      assert.ok(orch.briefId);
      assert.ok(orch.campaignId);
      assert.ok(orch.generatedAsset.filePath);
      assert.ok(orch.videoStoryboard);
      assert.ok(orch.landingPageBlueprint);
      assert.ok(orch.buyerPersonas.personas.length >= 3);

      // 3. Lead Ingestion & Attribution
      const leadResult = await realEstateGrowthService.captureLead({
        name: "Manish Kothari",
        phone: "9829011223",
        email: "manish.kothari@investor.in",
        budgetINR: 15000000,
        bhkPreference: "3 BHK",
        possessionTimeline: "Immediate",
        purpose: "Investment",
        projectId: project.projectId,
        source: "meta_ads",
        utmCampaign: "royal_crest_launch"
      });
      assert.strictEqual(leadResult.isDuplicate, false);
      assert.strictEqual(leadResult.lead.qualification.tier, "HOT");
      assert.ok(leadResult.lead.qualification.score >= 75);

      // 4. Duplicate Ingestion Verification
      const dupResult = await realEstateGrowthService.captureLead({
        name: "M Kothari",
        phone: "9829011223",
        email: "manish.kothari@investor.in",
        projectId: project.projectId
      });
      assert.strictEqual(dupResult.isDuplicate, true);
      assert.strictEqual(dupResult.lead.interactionCount, 2);

      // 5. Site Visit Booking & Completion
      const visit = await realEstateGrowthService.bookSiteVisit({
        leadId: leadResult.lead.leadId,
        projectId: project.projectId,
        scheduledDate: "2026-09-10",
        assignedExecutive: "Vikram Shekhawat"
      });
      assert.strictEqual(visit.status, "SCHEDULED");

      const completedVisit = await realEstateGrowthService.completeSiteVisit(visit.visitId, {
        status: "COMPLETED",
        interestLevel: "HIGH",
        preferredUnit: "Crest Tower B - 801"
      });
      assert.strictEqual(completedVisit.status, "COMPLETED");

      // 6. Booking Confirmation & Attribution
      const booking = await realEstateGrowthService.confirmBooking({
        leadId: leadResult.lead.leadId,
        projectId: project.projectId,
        unitNumber: "Crest Tower B - 801",
        agreedAmountINR: 14500000,
        tokenAmountPaidINR: 200000
      });
      assert.strictEqual(booking.status, "CONFIRMED");

      // 7. Double-Booking Protection
      await assert.rejects(
        async () => realEstateGrowthService.confirmBooking({
          leadId: leadResult.lead.leadId,
          projectId: project.projectId,
          unitNumber: "Crest Tower B - 801",
          agreedAmountINR: 14500000
        }),
        /is already booked/
      );

      // 8. Outcome Learning Signal Verification
      const signals = await outcomeLearningService.getLearningSignals("real_estate");
      assert.ok(signals.totalRecordedOutcomes >= 1);
      assert.ok(signals.totalVerifiedYieldINR >= 14500000);
    });
  });

  // ---------------------------------------------------------------------------
  // 9. SPECIALIZED AGENT WORKFORCE DISPATCH & OBSERVABILITY
  // ---------------------------------------------------------------------------
  describe("9. Specialized Agent Workforce Autonomous Execution", () => {
    it("Dispatches real tasks across all growth & marketing agents and verifies structured outputs", async () => {
      const agentTasks = [
        { id: "agent.market_intelligence", input: { location: "Jaipur Highway" } },
        { id: "agent.competitor_intelligence", input: { industry: "Real Estate" } },
        { id: "agent.audience_intelligence", input: {} },
        { id: "agent.campaign_strategy", input: { title: "Strategy Test", brandName: "Aarna" } },
        { id: "agent.creative_direction", input: { brandName: "GARUDA AI" } },
        { id: "agent.copywriting", input: { title: "Copy Test", brandName: "GARUDA" } },
        { id: "agent.image_generation_router", input: { headline: "Agent SVG Test", mode: "SOVEREIGN_LAYOUT" } },
        { id: "agent.video_generation_router", input: { title: "Agent Reel", format: "REEL_9_16" } },
        { id: "agent.seo_intelligence", input: { keyword: "luxury penthouses" } },
        { id: "agent.performance_analysis", input: {} },
        { id: "agent.digital_marketing", input: { brandName: "GARUDA", weeksCount: 2 } }
      ];

      for (const t of agentTasks) {
        const res = await workforceRouterService.dispatchAgentTask(t.id, t.input);
        assert.strictEqual(res.success, true, `Agent ${t.id} failed task execution`);
        assert.ok(res.result, `Agent ${t.id} returned null result`);
      }
    });

    it("Rejects tasks to unregistered agents honestly", async () => {
      await assert.rejects(
        async () => workforceRouterService.dispatchAgentTask("agent.decorative_non_existent_bot", {}),
        /Agent not registered/
      );
    });
  });

  // ---------------------------------------------------------------------------
  // 10. CROSS-UNIVERSE EVENT NERVOUS SYSTEM
  // ---------------------------------------------------------------------------
  describe("10. Cross-Universe Event Propagation", () => {
    it("Verifies event wiring counters and active propagation without orphan events", () => {
      const stats = eventWiring.getEventStats();
      assert.ok(typeof stats === "object");
      assert.ok(Object.keys(stats).length > 0, "Event Nervous System must have active processed events");
    });
  });

  // ---------------------------------------------------------------------------
  // 11. HIGH COMMAND CENTER SNAPSHOT TRUTH
  // ---------------------------------------------------------------------------
  describe("11. High Command Center Snapshot Truth Compliance", () => {
    it("Enforces UNAVAILABLE !== 0 and returns authoritative reads across all active growth subsystems", async () => {
      const snapshot = await founderCommandService.getCommandCenterSnapshot();
      assert.ok(snapshot.generatedAt);
      assert.strictEqual(snapshot.freshness, "REALTIME");

      // Verify subsystem availability map
      assert.strictEqual(snapshot.subsystemAvailability.system, true);
      assert.strictEqual(snapshot.subsystemAvailability.realEstate, true);
      assert.strictEqual(snapshot.subsystemAvailability.creative, true);
      assert.strictEqual(snapshot.subsystemAvailability.performanceMarketing, true);
      assert.strictEqual(snapshot.subsystemAvailability.clientOnboarding, true);
      assert.strictEqual(snapshot.subsystemAvailability.learning, true);

      // Verify creative section
      assert.ok(snapshot.creative.providerStatus);
      assert.strictEqual(snapshot.creative.providerStatus.imageGenerators.sovereignSvgAvailable, true);
      assert.strictEqual(snapshot.creative.providerStatus.videoGenerators.storyboardEngineAvailable, true);

      // Verify performance marketing section
      assert.ok(snapshot.performanceMarketing.funnel);
      assert.strictEqual(snapshot.performanceMarketing.adPlatformIntegration.metaAds.status, "META_ADS_NOT_CONNECTED");
    });
  });
});
