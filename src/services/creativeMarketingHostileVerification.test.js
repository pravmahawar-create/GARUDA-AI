/**
 * 🦅 GARUDA Creative, Digital Marketing & Performance Marketing Hostile Forensic Verification
 *
 * Forensic Truth Laws Enforced:
 * 1. ZERO fake AI images or fake MP4 videos (Truthful IMAGE_GENERATION_PROVIDER_UNAVAILABLE / VIDEO_GENERATION_UNAVAILABLE).
 * 2. Physical disk verification of sovereign SVG artifacts with exact SHA-256 byte matching.
 * 3. Canonical Provider Health Statuses: READY | NOT_CONFIGURED | UNREACHABLE | AUTH_FAILED | RATE_LIMITED | UNSUPPORTED.
 * 4. Distinct Output Classifications: REAL_AI_IMAGE | VECTOR_CREATIVE | PROVIDER_UNAVAILABLE | GENERATION_FAILED | PRODUCTION_PROMPT_READY | VECTOR_CREATIVE_READY.
 * 5. 6-Point Physical Artifact Verification (Existence, Non-zero byte, MIME type, SHA-256 seal match, Asset indexing).
 * 6. ZERO fake ad spend, impressions, CTR, or ROAS (Truthful AD_PLATFORM_DATA_UNAVAILABLE, META_ADS_NOT_CONNECTED, GOOGLE_ADS_NOT_CONNECTED).
 * 7. Genuine, multi-concept creative intelligence (differentiated angles, visual directions, hooks, and copy).
 * 8. IdentityLock™ brand governance with prohibited element scanning and lockHash integrity.
 * 9. Real Client Production Onboarding Pipeline & 8-Step Launch Readiness Checklist.
 * 10. High Command Center snapshot truth compliance (UNAVAILABLE !== 0).
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
const {
  PROVIDER_HEALTH_STATUSES,
  GENERATION_OUTPUT_TYPES
} = require("./growthSharedContracts");

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
  // 2. FORENSIC PROVIDER DISCOVERY & PHYSICAL ASSET TRUTH
  // ---------------------------------------------------------------------------
  describe("2. Forensic Provider Discovery & 6-Point Physical Asset Verification", () => {
    it("Discovers provider capabilities truthfully with canonical health statuses and machine audit", async () => {
      const discovery = await imageGenerationRouter.discoverProviderCapabilities();
      assert.ok(discovery.timestamp);
      assert.ok(discovery.providers);
      assert.ok(discovery.machineAudit);
      assert.ok(discovery.machineAudit.cpu.model);
      assert.ok(discovery.machineAudit.os.platform);
      assert.ok(discovery.machineAudit.capabilityCategory);
      assert.ok(discovery.machineAudit.feasibilityDecision);

      assert.strictEqual(discovery.providers.garuda_sovereign_svg_renderer.status, PROVIDER_HEALTH_STATUSES.READY);
      assert.strictEqual(discovery.providers.openai_dalle.status, PROVIDER_HEALTH_STATUSES.NOT_CONFIGURED);
      assert.strictEqual(discovery.providers.huggingface_diffusers.status, PROVIDER_HEALTH_STATUSES.NOT_CONFIGURED);
      assert.strictEqual(discovery.providers.stability_ai.status, PROVIDER_HEALTH_STATUSES.NOT_CONFIGURED);
      assert.strictEqual(discovery.providers.local_sd.status, PROVIDER_HEALTH_STATUSES.NOT_CONFIGURED);
    });

    it("Audits machine hardware and identifies local AI feasibility truthfully", async () => {
      const machineHardwareAuditor = require("./machineHardwareAuditor");
      const audit = await machineHardwareAuditor.auditMachineHardware();

      assert.ok(audit.os.totalMemMB > 0);
      assert.ok(audit.cpu.cores > 0);
      assert.ok(["Intel", "NVIDIA", "AMD", "Apple", "Unknown"].includes(audit.gpu.manufacturer));
      assert.ok(["GPU_ACCELERATED_READY", "GPU_ACCELERATED_FEASIBLE", "CPU_ONLY_FEASIBLE", "INSUFFICIENT_HARDWARE"].includes(audit.capabilityCategory));
      assert.ok(["LOCAL_REAL_AI_IMAGE_FEASIBLE", "LOCAL_REAL_AI_IMAGE_NOT_FEASIBLE"].includes(audit.feasibilityDecision));
      assert.strictEqual(typeof audit.localPorts.port7860InUse, "boolean");
      assert.strictEqual(typeof audit.localPorts.port8188InUse, "boolean");
    });

    it("Handles unreachable local engine endpoint safely without crashing or hanging", async () => {
      const prevLocal = process.env.LOCAL_SD_URL;
      process.env.LOCAL_SD_URL = "http://127.0.0.1:59999"; // Non-existent port

      const health = await imageGenerationRouter.checkProviderHealth("local_sd");
      assert.strictEqual(health.configured, true);
      assert.strictEqual(health.reachable, false);
      assert.strictEqual(health.status, PROVIDER_HEALTH_STATUSES.UNREACHABLE);

      if (prevLocal) process.env.LOCAL_SD_URL = prevLocal;
      else delete process.env.LOCAL_SD_URL;
    });

    it("Truthfully returns PROVIDER_UNAVAILABLE with PRODUCTION_PROMPT_READY & VECTOR_CREATIVE_READY fallback when unconfigured", async () => {
      const prevGemini = process.env.IMAGEN_ENABLED;
      delete process.env.IMAGEN_ENABLED;

      const result = await imageGenerationRouter.routeGeneration({
        headline: "Photorealistic Penthouse",
        prompt: "Ultra-photorealistic 8k render of modern penthouse",
        mode: "AI_PHOTOREALISTIC"
      });

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.status, "IMAGE_GENERATION_PROVIDER_UNAVAILABLE");
      assert.strictEqual(result.classification, GENERATION_OUTPUT_TYPES.PROVIDER_UNAVAILABLE);
      assert.strictEqual(result.fallbackState, GENERATION_OUTPUT_TYPES.VECTOR_CREATIVE_READY);
      assert.strictEqual(result.promptPackage.status, GENERATION_OUTPUT_TYPES.PRODUCTION_PROMPT_READY);
      assert.ok(result.fallbackAsset.filePath);
      assert.strictEqual(result.truthClassification, "TRUTHFUL_UNAVAILABLE");

      if (prevGemini) process.env.IMAGEN_ENABLED = prevGemini;
    });

    it("Generates sovereign SVG layout, writes physical file to disk, and verifies SHA-256 byte match (VECTOR_CREATIVE)", async () => {
      const brief = await creativeStudioService.createCreativeBrief({
        title: "Forensic Sovereign SVG Test",
        brandName: "GARUDA Sovereign Villas",
        location: "C-Scheme, Jaipur",
        priceRange: "₹2.5 Cr+"
      });

      const assetResult = await creativeStudioService.generateAsset(brief.briefId, "IMAGE_SQUARE", { mode: "SOVEREIGN_LAYOUT" });
      assert.strictEqual(assetResult.status, "GENERATED");
      assert.strictEqual(assetResult.classification, GENERATION_OUTPUT_TYPES.VECTOR_CREATIVE);
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

    it("Rejects zero-byte or corrupt files during 6-point physical verification", () => {
      const corruptFilePath = path.join(__dirname, "..", "..", "data", "creative-assets", "corrupt_test.png");
      fs.writeFileSync(corruptFilePath, Buffer.alloc(0)); // 0 bytes

      assert.throws(
        () => imageGenerationRouter.finalizeVerifiedAsset({
          assetId: "corrupt_test",
          jobId: "job_corrupt",
          title: "Corrupt Test",
          format: "IMAGE_PNG",
          mimeType: "image/png",
          platformSpec: { dimensions: { width: 100, height: 100 }, presetKey: "test" },
          fileName: "corrupt_test.png",
          filePath: corruptFilePath,
          fileSize: 0,
          assetHash: "dummy",
          provider: "test",
          brand: { brandId: "test", brandName: "test", lockHash: "test" }
        }),
        /Verification failure: File on disk is empty/
      );

      // Cleanup
      try { fs.unlinkSync(corruptFilePath); } catch {}
    });

    it("Rejects invalid image MIME types during physical verification", () => {
      const textFilePath = path.join(__dirname, "..", "..", "data", "creative-assets", "invalid_mime.txt");
      fs.writeFileSync(textFilePath, "fake content", "utf8");

      assert.throws(
        () => imageGenerationRouter.finalizeVerifiedAsset({
          assetId: "invalid_mime_test",
          jobId: "job_invalid",
          title: "Invalid MIME",
          format: "TEXT_FILE",
          mimeType: "text/plain",
          platformSpec: { dimensions: { width: 100, height: 100 }, presetKey: "test" },
          fileName: "invalid_mime.txt",
          filePath: textFilePath,
          fileSize: 12,
          assetHash: crypto.createHash("sha256").update("fake content").digest("hex"),
          provider: "test",
          brand: { brandId: "test", brandName: "test", lockHash: "test" }
        }),
        /Verification failure: Invalid image MIME type/
      );

      // Cleanup
      try { fs.unlinkSync(textFilePath); } catch {}
    });

    it("Supports platform presets (1:1 Square, 9:16 Story, 16:9 Hero Banner)", () => {
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
  // 3. PREMIUM NOIDA REAL ESTATE CREATIVE TEST SCENARIO
  // ---------------------------------------------------------------------------
  describe("3. Premium Noida Real Estate Isolated Creative Scenario", () => {
    it("Executes synthetic luxury campaign creative generation with IdentityLock compliance and production prompt packaging", async () => {
      const brief = await creativeStudioService.createCreativeBrief({
        title: "Sovereign Greens — Noida Expressway Launch",
        brandName: "Sovereign Greens",
        industry: "Luxury Real Estate",
        location: "Sector 128, Noida Expressway",
        priceRange: "₹2.2 Cr - ₹4.5 Cr",
        targetAudience: "C-suite executives & luxury investors seeking open golf-course living",
        objective: "Generate 25 qualified VIP site walkthrough appointments"
      });

      const concepts = await creativeStudioService.generateConcept(brief.briefId);
      assert.strictEqual(concepts.concepts.length, 3);

      // Request Generation
      const asset = await creativeStudioService.generateAsset(brief.briefId, "IMAGE_SQUARE", { mode: "SOVEREIGN_LAYOUT" });
      assert.strictEqual(asset.status, "GENERATED");
      assert.strictEqual(asset.classification, GENERATION_OUTPUT_TYPES.VECTOR_CREATIVE);
      assert.ok(fs.existsSync(asset.filePath));

      // Request Storyboard
      const storyboard = await creativeStudioService.generateVideoStoryboard(brief.briefId, "REEL_9_16");
      assert.strictEqual(storyboard.fallbackState, "STORYBOARD_READY");
      assert.strictEqual(storyboard.mp4Generated, false);
      assert.strictEqual(storyboard.storyboard.aspectRatio, "9:16");
      assert.strictEqual(storyboard.storyboard.totalDurationSeconds, 15);
    });
  });

  // ---------------------------------------------------------------------------
  // 4. VIDEO GENERATION ROUTER & STORYBOARD ARCHITECTURE
  // ---------------------------------------------------------------------------
  describe("4. Video Generation Router & Storyboard Truth", () => {
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
      assert.strictEqual(sbHealth.status, PROVIDER_HEALTH_STATUSES.READY);
      assert.strictEqual(sbHealth.type, "STORYBOARD_BLUEPRINT");
    });
  });

  // ---------------------------------------------------------------------------
  // 5. IDENTITYLOCK™ BRAND GOVERNANCE
  // ---------------------------------------------------------------------------
  describe("5. IdentityLock™ Brand Governance & Compliance", () => {
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
  // 6. DIGITAL MARKETING OS WORKFLOWS
  // ---------------------------------------------------------------------------
  describe("6. Digital Marketing OS Multi-Channel Workflows", () => {
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
  // 7. PERFORMANCE MARKETING & LIVE AD PLATFORM ADAPTERS
  // ---------------------------------------------------------------------------
  describe("7. Performance Marketing Lifecycle & Ad Platform Adapters", () => {
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
  // 8. REAL CLIENT PRODUCTION ONBOARDING PIPELINE
  // ---------------------------------------------------------------------------
  describe("8. Real Client Production Onboarding Pipeline & Launch Readiness", () => {
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
  // 9. REAL ESTATE END-TO-END COMMERCIAL WORKFLOW
  // ---------------------------------------------------------------------------
  describe("9. Real Estate End-to-End Growth Orchestration", () => {
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
  // 10. SPECIALIZED AGENT WORKFORCE DISPATCH & OBSERVABILITY
  // ---------------------------------------------------------------------------
  describe("10. Specialized Agent Workforce Autonomous Execution", () => {
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
        { id: "agent.digital_marketing", input: { brandName: "GARUDA", weeksCount: 2 } },
        { id: "agent.hospitality_hotel_hunter", input: { hotelName: "Seaside Grand Resort" } },
        { id: "agent.restaurant_dining_hunter", input: { brandName: "Urban Spice Cafe" } },
        { id: "agent.mobile_app_saas_hunter", input: { clientName: "Swift Fleet Logistics" } },
        { id: "agent.business_erp_hunter", input: { company: "National Timber Merchants" } },
        { id: "agent.factory_industrial_hunter", input: { plantName: "Apex Die Castings" } },
        { id: "agent.dairy_agro_hunter", input: { dairyName: "Shree Krishna Dairy" } },
        { id: "agent.surplus_wholesale_hunter", input: { traderName: "Metro Industrial Surplus" } },
        { id: "agent.legacy_web_rescuer", input: { domain: "old-hardware-wholesaler.in" } },
        { id: "agent.healthcare_clinic_hunter", input: { clinicName: "Smile Care Dental Clinic" } },
        { id: "agent.real_estate_hunter", input: { builderName: "Crown Heights Builders" } },
        { id: "agent.global_international_hunter", input: { companyName: "Hyperion SaaS Inc (San Francisco, CA)" } },
        { id: "agent.lead_qualifier_pitcher", input: { lead: { company: "Vertex Global", currency: "USD" } } }
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
  // 11. CROSS-UNIVERSE EVENT NERVOUS SYSTEM
  // ---------------------------------------------------------------------------
  describe("11. Cross-Universe Event Propagation", () => {
    it("Verifies event wiring counters and active propagation without orphan events", () => {
      const stats = eventWiring.getEventStats();
      assert.ok(typeof stats === "object");
      assert.ok(Object.keys(stats).length > 0, "Event Nervous System must have active processed events");
    });
  });

  // ---------------------------------------------------------------------------
  // 12. HIGH COMMAND CENTER SNAPSHOT TRUTH
  // ---------------------------------------------------------------------------
  describe("12. High Command Center Snapshot Truth Compliance", () => {
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

      // Verify creative section & operations
      assert.ok(snapshot.creative.creativeOperations);
      assert.strictEqual(snapshot.creative.creativeOperations.generationType, "VECTOR_CREATIVE");
      assert.strictEqual(snapshot.creative.creativeOperations.videoCapability, "STORYBOARD_ONLY");

      // Verify performance marketing section
      assert.ok(snapshot.performanceMarketing.funnel);
      assert.strictEqual(snapshot.performanceMarketing.adPlatformIntegration.metaAds.status, "META_ADS_NOT_CONNECTED");
    });
  });

  // ---------------------------------------------------------------------------
  // 13. SCHOLAR INTELLIGENCE & ACADEMIC ORIGINALITY INTEGRITY AUDIT
  // ---------------------------------------------------------------------------
  describe("13. Scholar Intelligence & Academic Originality Integrity Audit", () => {
    it("Audits academic text and mathematically derives originality, citations, and peer-review safety", () => {
      const academicIntegrityService = require("./academicIntegrityService");
      const sampleResearchText = `
        Abstract: This research paper investigates multi-agent deterministic orchestrations in autonomous operating systems.
        Recent advancements in transformer architectures [Vaswani et al., 2017] and self-governing multi-agent systems [1] have revealed significant efficiencies in automated software delivery.
        
        Methodology: We formulate an event-driven nervous system where agents communicate through cryptographically sealed events.
        Let S represent the system state and T the transition matrix. The probability of zero-hallucination convergence is maximized when validation gates are strictly decoupled from execution planners.
        
        References:
        [1] GARUDA Foundation. Autonomous Operating Systems & Multi-Agent Architecture. doi:10.1000/182
        [2] Vaswani, A., et al. (2017). Attention Is All You Need. Advances in Neural Information Processing Systems.
      `;

      const audit = academicIntegrityService.evaluateIntegrity(sampleResearchText);
      assert.strictEqual(audit.success, true);
      assert.ok(audit.originalityNumeric >= 90, "Originality score must be >= 90% for diverse academic text");
      assert.ok(audit.citationCount >= 2, "Citations must be accurately recognized");
      assert.strictEqual(audit.hasBibliography, true);
      assert.strictEqual(audit.safetyRating, "PUBLICATION_GRADE_EXCELLENCE");
      assert.strictEqual(audit.statusBadge, "PEER_REVIEW_SAFE");
      assert.ok(audit.recommendations.length > 0);
    });

    it("Rejects insufficient text input for integrity evaluation safely", () => {
      const academicIntegrityService = require("./academicIntegrityService");
      const res = academicIntegrityService.evaluateIntegrity("too short");
      assert.strictEqual(res.success, false);
      assert.strictEqual(res.status, "INSUFFICIENT_TEXT");
    });
  });

  // ---------------------------------------------------------------------------
  // 14. REAL ESTATE PROSPECT INTELLIGENCE & ACQUISITION LIFECYCLE
  // ---------------------------------------------------------------------------
  describe("14. Real Estate Prospect Intelligence & Client Acquisition", () => {
    const realEstateProspectService = require("./realEstateProspectIntelligenceService");

    beforeEach(() => {
      realEstateProspectService.clearForTesting();
    });

    it("1. Enforces all canonical packages default strictly to DRAFT with zero false FOUNDER_APPROVED state", () => {
      const packages = realEstateProspectService.getOfferPackages();
      assert.strictEqual(packages.length, 3);
      for (const pkg of packages) {
        assert.strictEqual(pkg.pricingState, "DRAFT", `Package ${pkg.title} must default to DRAFT`);
        assert.strictEqual(pkg.founderApprovalReference, null);
        assert.strictEqual(pkg.approvedAt, null);
        assert.strictEqual(pkg.approvedBy, null);
      }
    });

    it("2. Rejects package price approval when missing founderId or audit reference", () => {
      assert.throws(
        () => realEstateProspectService.approvePackagePricing("pkg_re_command", {}),
        /requires explicit founderId and approvalReference/
      );
      assert.throws(
        () => realEstateProspectService.approvePackagePricing("pkg_re_command", { founderId: "founder_1" }),
        /requires explicit founderId and approvalReference/
      );
    });

    it("3. Rejects representing DRAFT price as final approved commercial quote", () => {
      const quote = realEstateProspectService.getCommercialQuote("pkg_re_starter");
      assert.strictEqual(quote.isApprovedCommercialQuote, false);
      assert.strictEqual(quote.pricingState, "DRAFT");
      assert.strictEqual(quote.error, "DRAFT_PRICE_CANNOT_BE_PRESENTED_AS_FINAL_COMMERCIAL_QUOTE");
    });

    it("4. Successfully records FOUNDER_APPROVED state with explicit audit record", () => {
      const approved = realEstateProspectService.approvePackagePricing("pkg_re_command", {
        founderId: "founder_praveen",
        approvalReference: "AUDIT_SIGN_OFF_2026_Q3",
        approvedPriceINR: 175000,
        note: "Authorized by Principal Architect Praveen Mahawar"
      });

      assert.strictEqual(approved.pricingState, "FOUNDER_APPROVED");
      assert.strictEqual(approved.approvedBy, "founder_praveen");
      assert.strictEqual(approved.founderApprovalReference, "AUDIT_SIGN_OFF_2026_Q3");
      assert.strictEqual(approved.approvedPriceINR, 175000);
      assert.ok(approved.approvedAt);

      const quote = realEstateProspectService.getCommercialQuote("pkg_re_command");
      assert.strictEqual(quote.isApprovedCommercialQuote, true);
      assert.strictEqual(quote.approvedPriceINR, 175000);
      assert.strictEqual(quote.approvalReference, "AUDIT_SIGN_OFF_2026_Q3");
    });

    it("5. Rejects prospect ingestion when missing verifiable sourceUrl or sourceType", async () => {
      await assert.rejects(
        async () => realEstateProspectService.ingestProspect({ companyName: "Unverified Builders" }, { isTest: true }),
        /requires a valid public sourceUrl/
      );

      await assert.rejects(
        async () => realEstateProspectService.ingestProspect({ companyName: "Unverified Builders", sourceUrl: "https://example.com" }, { isTest: true }),
        /requires a valid sourceType/
      );
    });

    it("6. Ingests real prospect with traceable evidence and fact/inference separation", async () => {
      const prospect = await realEstateProspectService.ingestProspect({
        companyName: "Gulshan Homz (Noida)",
        sourceUrl: "https://gulshanhomz.example.com",
        sourceType: "OFFICIAL_WEBSITE",
        geography: "Noida Sector 144 / Expressway",
        projectNames: ["Gulshan Dynasty", "Gulshan One29"],
        reraNumber: "UPRERAPRJ998877",
        googleRating: 4.6
      }, { isTest: true });

      assert.strictEqual(prospect.companyName, "Gulshan Homz (Noida)");
      assert.strictEqual(prospect.stage, "PROSPECT_DISCOVERED");
      assert.strictEqual(prospect.isTestFixture, true);
      assert.ok(prospect.evidence.length >= 3, "Must capture structured evidence records");
      assert.ok(prospect.observedFacts.length >= 3, "Must capture verified observed facts");
      assert.ok(prospect.inferences.length >= 1, "Must separate analytical inferences");
      assert.ok(prospect.unknowns.length >= 3, "Must acknowledge verified unknowns");

      // Verify every observed fact has sourceUrl and evidenceType
      for (const fact of prospect.observedFacts) {
        assert.ok(fact.sourceUrl, `Fact ${fact.field} must have sourceUrl`);
        assert.ok(fact.evidenceType, `Fact ${fact.field} must have evidenceType`);
      }
    });

    it("7. Detects duplicate prospects across normalized company name and domain without polluting pipeline", async () => {
      await realEstateProspectService.ingestProspect({
        companyName: "ATS Greens Infrastructure",
        sourceUrl: "https://atsgreens.example.com",
        sourceType: "OFFICIAL_WEBSITE",
        geography: "Greater Noida West"
      }, { isTest: true });

      // Duplicate 1: same name with different casing / spacing
      const dup1 = await realEstateProspectService.ingestProspect({
        companyName: "  aTs greens infrastructure  ",
        sourceUrl: "https://different-url.example.com",
        sourceType: "PUBLIC_DIRECTORY"
      }, { isTest: true });
      assert.strictEqual(dup1.isDuplicate, true);

      // Duplicate 2: same domain
      const dup2 = await realEstateProspectService.ingestProspect({
        companyName: "ATS Group Real Estate",
        sourceUrl: "https://www.atsgreens.example.com/projects",
        sourceType: "OFFICIAL_WEBSITE"
      }, { isTest: true });
      assert.strictEqual(dup2.isDuplicate, true);
    });

    it("8. Truthfully reports PROSPECT_DISCOVERY_SOURCE_NOT_CONNECTED for live discovery", () => {
      const status = realEstateProspectService.getDiscoverySourceStatus();
      assert.strictEqual(status.status, "PROSPECT_DISCOVERY_SOURCE_NOT_CONNECTED");
      assert.strictEqual(status.liveDiscoveryActive, false);
      assert.ok(status.supportedIngestionModes.includes("MANUAL_REAL_PROSPECT_INGESTION"));
    });

    it("9. Builds canonical Dossier and 5-Format outreach suite with evidence anchors", async () => {
      const prospect = await realEstateProspectService.ingestProspect({
        companyName: "Ace Group India",
        sourceUrl: "https://acegroupindia.example.com",
        sourceType: "OFFICIAL_WEBSITE",
        geography: "Noida Sector 150",
        projectNames: ["Ace Parkway"]
      }, { isTest: true });

      const dossier = await realEstateProspectService.buildProspectDossier(prospect.prospectId);
      assert.strictEqual(dossier.prospectId, prospect.prospectId);
      assert.strictEqual(dossier.status, "DOSSIER_COMPLETE");

      const outreach = await realEstateProspectService.generateOutreachSuite(prospect.prospectId);
      assert.strictEqual(outreach.approvalStatus, "PENDING_FOUNDER_APPROVAL");
      assert.ok(outreach.channels.whatsappIntro.message.includes("Ace Group India"));
      assert.ok(outreach.channels.linkedInMessage.message.includes("Ace Parkway"));
      assert.ok(outreach.channels.emailOutreach.body.includes("Praveen Mahawar"));
      assert.ok(outreach.channels.founderToFounder.message.includes("GARUDA OS"));
      assert.ok(outreach.channels.followUpMessage.message.includes("Ace Parkway"));
    });

    it("10. Enforces Founder Approval Gate when transitioning to OUTREACH_SENT", async () => {
      const prospect = await realEstateProspectService.ingestProspect({
        companyName: "Eldeco Housing & Industries",
        sourceUrl: "https://eldeco.example.com",
        sourceType: "OFFICIAL_WEBSITE",
        geography: "Noida"
      }, { isTest: true });

      // Attempting OUTREACH_SENT without founder approval must be rejected by governance
      await assert.rejects(
        async () => realEstateProspectService.transitionStage(prospect.prospectId, "OUTREACH_SENT", { founderApproved: false }),
        /OUTREACH_SENT requires explicit founder approval/
      );

      // Transition with explicit founder approval succeeds
      const approved = await realEstateProspectService.transitionStage(prospect.prospectId, "OUTREACH_SENT", {
        founderApproved: true,
        actor: "founder_praveen"
      });
      assert.strictEqual(approved.success, true);
      assert.strictEqual(approved.currentStage, "OUTREACH_SENT");
    });
  });

  // ---------------------------------------------------------------------------
  // 15. MARKET INTELLIGENCE & ENTITY CLASSIFICATION TRUTH (SOURCE !== PROSPECT)
  // ---------------------------------------------------------------------------
  describe("15. Market Intelligence & Entity Classification Truth (SOURCE !== PROSPECT)", () => {
    const marketIntelligenceService = require("./marketIntelligence/marketIntelligenceService");
    const entityClassifier = require("./marketIntelligence/entityClassifier");
    const evidenceCollector = require("./marketIntelligence/evidenceCollector");
    const realEstateProspectService = require("./realEstateProspectIntelligenceService");

    beforeEach(() => {
      realEstateProspectService.clearForTesting();
    });

    it("1. PROPERTY_PORTAL cannot become REAL_ESTATE_DEVELOPER", () => {
      const classification = entityClassifier.classifyEntity({
        companyName: "Housing.com",
        sourceUrl: "https://housing.com/in/buy/noida/luxury-projects"
      });
      assert.strictEqual(classification.entityType, "PROPERTY_PORTAL");
      assert.strictEqual(classification.isDirectCommercialProspect, false);
      assert.strictEqual(classification.role, "INTELLIGENCE_SOURCE");
    });

    it("2. BUSINESS_DIRECTORY cannot directly enter prospect pipeline", () => {
      const classification = entityClassifier.classifyEntity({
        companyName: "RealEstateIndia Directory",
        sourceUrl: "https://www.realestateindia.com/builders-developers-in-noida.htm"
      });
      assert.strictEqual(classification.entityType, "BUSINESS_DIRECTORY");
      assert.strictEqual(classification.isDirectCommercialProspect, false);
      assert.strictEqual(entityClassifier.isEligibleDirectProspect(classification.entityType), false);
    });

    it("3. CONTENT_SITE cannot receive a developer qualification tier", () => {
      const classification = entityClassifier.classifyEntity({
        companyName: "360PropGuide Blog",
        sourceUrl: "https://www.360propguide.com/blogs/top-luxury-residential-properties"
      });
      assert.strictEqual(classification.entityType, "CONTENT_SITE");
      assert.strictEqual(classification.isDirectCommercialProspect, false);
    });

    it("4. NEWS_SOURCE cannot become a commercial prospect", () => {
      const classification = entityClassifier.classifyEntity({
        companyName: "Economic Times Real Estate",
        sourceUrl: "https://economictimes.indiatimes.com/news/economy/infrastructure/noida-expressway"
      });
      assert.strictEqual(classification.entityType, "NEWS_SOURCE");
      assert.strictEqual(classification.isDirectCommercialProspect, false);
    });

    it("5. Search result URL cannot become officialCompanyUrl automatically", async () => {
      const prospect = await realEstateProspectService.ingestProspect({
        companyName: "Prateek Group",
        sourceUrl: "https://www.squareyards.com/prateek-group-projects",
        sourceType: "PUBLIC_SEARCH",
        officialCompanyUrl: "https://prateekgroup.com/"
      }, { isTest: true });

      assert.strictEqual(prospect.sourceUrl, "https://www.squareyards.com/prateek-group-projects");
      assert.strictEqual(prospect.officialCompanyUrl, "https://prateekgroup.com/");
      assert.strictEqual(prospect.officialDomain, "prateekgroup.com");
    });

    it("6. Portal source becomes INTELLIGENCE_SOURCE and is stored without developer dossier", async () => {
      const run = await marketIntelligenceService.runMarketDiscovery({
        industry: "REAL_ESTATE",
        region: "DELHI_NCR",
        isTest: true,
        mockResults: [
          {
            companyName: "Square Yards Portal",
            sourceUrl: "https://www.squareyards.com/luxury-projects-in-noida",
            sourceType: "PUBLIC_SEARCH"
          }
        ]
      });

      assert.strictEqual(run.searchResultsFound, 1);
      assert.strictEqual(run.intelligenceSourcesFound, 1);
      assert.strictEqual(run.eligibleProspects, 0);
      assert.strictEqual(run.qualifiedProspects, 0);
      assert.strictEqual(run.dossiersReady, 0);
      assert.strictEqual(run.discoveredProspects.length, 0);
    });

    it("7. Extracted company candidate requires independent verification", () => {
      const unverified = entityClassifier.classifyEntity({
        companyName: "Generic Entity XYZ",
        sourceUrl: "https://generic-unknown-portal.in/listing/123"
      });
      assert.strictEqual(unverified.isDirectCommercialProspect, false);
      assert.strictEqual(unverified.entityType, "UNKNOWN");
    });

    it("8. REAL_ESTATE_DEVELOPER can enter qualification", () => {
      const classification = entityClassifier.classifyEntity({
        companyName: "Prateek Group",
        sourceUrl: "https://prateekgroup.com/"
      });
      assert.strictEqual(classification.entityType, "REAL_ESTATE_DEVELOPER");
      assert.strictEqual(classification.isDirectCommercialProspect, true);
    });

    it("9. REAL_ESTATE_BUILDER can enter qualification", () => {
      const classification = entityClassifier.classifyEntity({
        companyName: "Gulshan Homz Builders",
        sourceUrl: "https://gulshanhomz.com/"
      });
      assert.strictEqual(classification.entityType, "REAL_ESTATE_DEVELOPER");
      assert.strictEqual(classification.isDirectCommercialProspect, true);
    });

    it("10. Ineligible entity is blocked before scoring and dossier generation", async () => {
      const run = await marketIntelligenceService.runMarketDiscovery({
        industry: "REAL_ESTATE",
        region: "DELHI_NCR",
        isTest: true,
        mockResults: [
          { companyName: "Housing.com", sourceUrl: "https://housing.com/in/buy/noida" },
          { companyName: "RealEstateIndia", sourceUrl: "https://www.realestateindia.com/noida" }
        ]
      });

      assert.strictEqual(run.searchResultsFound, 2);
      assert.strictEqual(run.intelligenceSourcesFound, 2);
      assert.strictEqual(run.qualifiedProspects, 0);
      assert.strictEqual(run.dossiersReady, 0);
    });

    it("11. Previous incorrectly classified prospect can be reclassified with audit history", () => {
      const previousProspects = [
        { prospectId: "p1", companyName: "Housing.com", sourceUrl: "https://housing.com/buy" },
        { prospectId: "p2", companyName: "Prateek Group", sourceUrl: "https://prateekgroup.com/" }
      ];

      const auditLog = marketIntelligenceService.revalidateHistoricalDiscoveries(previousProspects);
      assert.strictEqual(auditLog.length, 2);
      assert.strictEqual(auditLog[0].auditStatus, "RECLASSIFIED_AFTER_FORENSIC_AUDIT");
      assert.strictEqual(auditLog[0].reclassifiedType, "PROPERTY_PORTAL");
      assert.strictEqual(auditLog[1].auditStatus, "VERIFIED_ELIGIBLE_DEVELOPER");
      assert.strictEqual(auditLog[1].reclassifiedType, "REAL_ESTATE_DEVELOPER");
    });

    it("12. Qualification metrics distinguish sources from prospects", async () => {
      const run = await marketIntelligenceService.runMarketDiscovery({
        industry: "REAL_ESTATE",
        region: "DELHI_NCR",
        isTest: true,
        mockResults: [
          { companyName: "Housing.com", sourceUrl: "https://housing.com/in/buy/noida" },
          { companyName: "Prateek Group", sourceUrl: "https://prateekgroup.com/" }
        ]
      });

      assert.strictEqual(run.searchResultsFound, 2);
      assert.strictEqual(run.intelligenceSourcesFound, 1);
      assert.strictEqual(run.eligibleProspects, 1);
      assert.strictEqual(run.qualifiedProspects, 1);
      assert.strictEqual(run.dossiersReady, 1);
    });

    it("13. Duplicate company discovered from multiple sources merges evidence", () => {
      const ev1 = { sourceUrl: "https://prateekgroup.com/", type: "OFFICIAL_SITE" };
      const ev2 = { sourceUrl: "https://prateekgroup.com/", type: "PUBLIC_SEARCH" };
      const ev3 = { sourceUrl: "https://uprera.gov.in/prateek", type: "RERA_REGISTRY" };

      const merged = evidenceCollector.mergeEvidence([ev1], [ev2, ev3]);
      assert.strictEqual(merged.length, 2);
    });

    it("14. Missing official verification blocks promotion", () => {
      assert.throws(
        () => evidenceCollector.collectEvidence({}),
        /verifiable sourceUrl/
      );
    });

    it("15. No outreach can be generated for an INTELLIGENCE_SOURCE", async () => {
      const run = await marketIntelligenceService.runMarketDiscovery({
        industry: "REAL_ESTATE",
        region: "DELHI_NCR",
        isTest: true,
        mockResults: [
          { companyName: "360PropGuide", sourceUrl: "https://www.360propguide.com/blogs/noida" }
        ]
      });

      assert.strictEqual(run.dossiersReady, 0);
      assert.strictEqual(run.discoveredProspects.length, 0);
    });

    it("16. Existing Founder Approval Gate remains intact before outreach dispatch", async () => {
      const prospect = await realEstateProspectService.ingestProspect({
        companyName: "Signature Global Developers",
        sourceUrl: "https://signatureglobal.in",
        sourceType: "OFFICIAL_WEBSITE",
        geography: "Gurgaon"
      }, { isTest: true });

      await assert.rejects(
        async () => realEstateProspectService.transitionStage(prospect.prospectId, "OUTREACH_SENT", { founderApproved: false }),
        /OUTREACH_SENT requires explicit founder approval/
      );

      const approved = await realEstateProspectService.transitionStage(prospect.prospectId, "OUTREACH_SENT", {
        founderApproved: true,
        actor: "founder_praveen"
      });
      assert.strictEqual(approved.success, true);
      assert.strictEqual(approved.currentStage, "OUTREACH_SENT");
    });
  });

  // ---------------------------------------------------------------------------
  // 16. AGENT WORKFORCE FORENSIC REALITY & TELEMETRY VERIFICATION
  // ---------------------------------------------------------------------------
  describe("16. Agent Workforce Forensic Reality & Telemetry Verification", () => {
    const workforceRouterService = require("./workforceRouterService");
    const founderCommandService = require("./founderCommandService");

    it("1. Verifies exact agent workforce count matches registry truth (30 agents in WorkforceRouter)", () => {
      const agents = workforceRouterService.listRegisteredAgents();
      assert.strictEqual(agents.length, 30, "Must have exactly 30 registered workforce agents");
    });

    it("2. Verifies all 30 workforce agents have executable handlers (Declared === Executable)", () => {
      const agents = workforceRouterService.listRegisteredAgents();
      for (const agent of agents) {
        const registered = workforceRouterService.registry.get(agent.id);
        assert.ok(typeof registered.handler === "function", `Agent ${agent.id} must have executable handler`);
      }
    });

    it("3. Rejects dispatch to unregistered agents truthfully", async () => {
      await assert.rejects(
        async () => workforceRouterService.dispatchAgentTask("agent.fake_nonexistent", {}),
        /Agent not registered: agent.fake_nonexistent/
      );
    });

    it("4. Dispatches and validates execution result across all 30 agents", async () => {
      const agents = workforceRouterService.listRegisteredAgents();
      for (const agent of agents) {
        const res = await workforceRouterService.dispatchAgentTask(agent.id, { isTest: true, verificationMode: true });
        assert.strictEqual(res.success, true, `Agent ${agent.id} must execute verification task successfully`);
        assert.ok(res.taskId, `Agent ${agent.id} task must have a valid taskId`);
        assert.ok(res.result, `Agent ${agent.id} must return execution result payload`);
      }
    });

    it("5. Verifies High Command Center snapshot reflects exact workforce telemetry", async () => {
      const snapshot = await founderCommandService.getCommandCenterSnapshot();
      assert.strictEqual(snapshot.workforce.available, true);
      assert.strictEqual(snapshot.workforce.registered, 30);
      assert.strictEqual(snapshot.workforce.wired, 30);
      assert.strictEqual(snapshot.workforce.executable, 30);
      assert.strictEqual(snapshot.workforce.roster.length, 30);
      assert.strictEqual(snapshot.workforce.truthClassification, "LIVE_PERSISTED");
    });
  });
});
