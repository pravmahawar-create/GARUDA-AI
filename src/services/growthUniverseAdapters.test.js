/**
 * 🦅 GARUDA Growth Universe Adapters — Test Suite
 * Growth Stage Phase 3
 *
 * Run: node src/services/growthUniverseAdapters.test.js
 */

const assert = require("assert");
const adapters = require("./growthUniverseAdapters");
const identityLockService = require("./identityLockService");

const BRAND = {
  brandName: "Aster Heights",
  industry: "Real Estate",
  geography: "Jaipur, Rajasthan",
  targetAudience: "Affluent families and investors",
  objective: "Generate qualified site-visit leads for the Aster Heights launch",
  campaignTheme: "Aster Heights Sovereign Living Launch"
};

async function run() {
  console.log("=== GROWTH UNIVERSE ADAPTERS — PHASE 3 TESTS ===\n");

  // ---------------------------------------------------------------------------
  // 1. Input validation
  // ---------------------------------------------------------------------------
  console.log("--- 1. Input validation ---");
  await assert.rejects(() => adapters.generateBrandContextPack({}), (e) => e.statusCode === 400);
  await assert.rejects(() => adapters.generateContentPack({}), (e) => e.statusCode === 400);
  await assert.rejects(() => adapters.generateCreativePack({ brandName: BRAND.brandName }), (e) => e.statusCode === 400);
  await assert.rejects(() => adapters.generatePresencePack({}), (e) => e.statusCode === 400);
  console.log("✔ PASS: all adapters reject missing brandName/objective with 400");

  // ---------------------------------------------------------------------------
  // 2. U21 Brand adapter
  // ---------------------------------------------------------------------------
  console.log("\n--- 2. U21 brand context pack ---");
  const brandPack = await adapters.generateBrandContextPack({
    brandName: BRAND.brandName,
    industry: BRAND.industry,
    positioning: "RERA-first luxury developer",
    masterDirection: "Sovereign high-contrast visual language with verifiable proof"
  });
  assert.strictEqual(brandPack.universe, "U21");
  assert.strictEqual(brandPack.packType, "BRAND_CONTEXT_PACK");
  assert.strictEqual(brandPack.classification, "LIVE_ENGINE_OUTPUT");
  assert.ok(brandPack.brandId, "brand profile bound");
  assert.ok(/^[a-f0-9]{64}$/.test(brandPack.lockHash), "IdentityLock hash present");
  assert.strictEqual(brandPack.profileCreated, true, "profile created for new brand");
  assert.ok(brandPack.compliance, "compliance check executed");
  console.log("✔ PASS: brand profile bound, lockHash + compliance surfaced");

  // Second call binds the EXISTING profile (no duplicate creation)
  const brandPack2 = await adapters.generateBrandContextPack({ brandName: BRAND.brandName });
  assert.strictEqual(brandPack2.profileCreated, false, "existing profile reused");
  assert.strictEqual(brandPack2.brandId, brandPack.brandId);
  console.log("✔ PASS: profile reuse without duplication");

  // ---------------------------------------------------------------------------
  // 3. U20 Content adapter
  // ---------------------------------------------------------------------------
  console.log("\n--- 3. U20 content pack ---");
  const contentPack = await adapters.generateContentPack({
    brandName: BRAND.brandName,
    industry: BRAND.industry,
    campaignTheme: BRAND.campaignTheme,
    geography: BRAND.geography
  });
  assert.strictEqual(contentPack.universe, "U20");
  assert.strictEqual(contentPack.classification, "LIVE_ENGINE_OUTPUT");
  assert.ok(contentPack.pillars.pillars.length >= 3, "pillars generated");
  assert.ok(contentPack.calendar.calendarId.startsWith("cal_"), "calendar generated + persisted");
  assert.ok(contentPack.calendar.posts.length >= 12, "4-week calendar has posts");
  assert.ok(contentPack.carousel.carouselId.startsWith("car_"), "carousel generated");
  console.log("✔ PASS: pillars + persisted calendar + carousel from live engines");

  // ---------------------------------------------------------------------------
  // 4. U19 Creative adapter — truthful provider scope
  // ---------------------------------------------------------------------------
  console.log("\n--- 4. U19 creative pack ---");
  const creativePack = await adapters.generateCreativePack({
    brandName: BRAND.brandName,
    objective: BRAND.objective,
    campaignTheme: BRAND.campaignTheme,
    industry: BRAND.industry,
    targetAudience: BRAND.targetAudience,
    geography: BRAND.geography
  });
  assert.strictEqual(creativePack.universe, "U19");
  assert.ok(creativePack.briefId.startsWith("cb_"), "creative brief created");
  assert.ok(creativePack.concept, "concept generated");
  assert.ok(creativePack.family, "family spec generated");
  assert.strictEqual(creativePack.deliverableScope, "BRIEF_AND_CONCEPT_AND_FAMILY_SPEC_ONLY");
  assert.ok(creativePack.truthNotice.includes("no rendering is implied"));
  console.log("✔ PASS: brief→concept→family spec with truthful rendering scope");

  // ---------------------------------------------------------------------------
  // 5. U22 Presence adapter
  // ---------------------------------------------------------------------------
  console.log("\n--- 5. U22 presence pack ---");
  const presencePack = await adapters.generatePresencePack({
    brandName: BRAND.brandName,
    projectName: BRAND.brandName,
    geography: BRAND.geography,
    primaryKeyword: "luxury apartments jaipur"
  });
  assert.strictEqual(presencePack.universe, "U22");
  assert.ok(presencePack.landing.pageId.startsWith("lp_"), "landing blueprint generated");
  assert.ok(presencePack.landing.leadCaptureFormSchema.fields.length >= 3, "lead capture schema present");
  assert.ok(presencePack.clusters.clusters.length >= 2, "topic clusters generated");
  assert.ok(presencePack.clusters.truthNotice.includes("Google Search Console"), "SERP truth notice preserved");
  assert.ok(presencePack.presence.googleBusinessProfile.businessName, "presence profile generated");
  console.log("✔ PASS: landing + clusters + presence profile with SERP truth notice");

  // ---------------------------------------------------------------------------
  // 6. Backward compatibility — existing routes/engines untouched
  // ---------------------------------------------------------------------------
  console.log("\n--- 6. Backward compatibility ---");
  // The engines the adapters call must still expose their original contracts.
  assert.strictEqual(typeof identityLockService.getBrandProfile, "function");
  assert.strictEqual(typeof identityLockService.validateCompliance, "function");
  const dm = require("./digitalMarketingOsService");
  assert.strictEqual(typeof dm.generateContentPillars, "function");
  assert.strictEqual(typeof dm.generateEditorialCalendar, "function");
  const cs = require("./creativeStudioService");
  assert.strictEqual(typeof cs.createCreativeBrief, "function");
  console.log("✔ PASS: underlying engines unmodified — original method surfaces intact");

  console.log("\n=== ALL GROWTH UNIVERSE ADAPTER TESTS PASSED ===");
}

run().catch((err) => {
  console.error("✘ TEST FAILURE:", err.message);
  process.exit(1);
});
