/**
 * 🦅 GARUDA Growth Strategy Service — Test Suite
 * Growth Stage Phase 1
 *
 * Plain-node assertion suite following repository test conventions
 * (see capabilityRegistryService.test.js). Run: node src/services/growthStrategyService.test.js
 */

const assert = require("assert");
const {
  CAMPAIGN_GOALS,
  CHANNELS,
  STRATEGY_ENGINE,
  GrowthStrategyService
} = require("./growthStrategyService");

const service = new GrowthStrategyService();
service.clearForTesting();

async function run() {
  console.log("=== GROWTH STRATEGY SERVICE — PHASE 1 TESTS ===\n");

  // ---------------------------------------------------------------------------
  // 1. Brief validation — mandatory fields
  // ---------------------------------------------------------------------------
  console.log("--- 1. Business brief validation ---");
  assert.throws(() => service.validateBusinessBrief({}), /businessName is required/);
  assert.throws(() => service.validateBusinessBrief({ businessName: "X" }), /productOrService is required/);
  assert.throws(
    () => service.validateBusinessBrief({ businessName: "X", productOrService: "Y" }),
    /targetAudience is required/
  );
  assert.throws(
    () => service.validateBusinessBrief({
      businessName: "X", productOrService: "Y", targetAudience: "Z", campaignGoal: "GO_VIRAL"
    }),
    /campaignGoal must be one of/
  );
  console.log("✔ PASS: invalid briefs rejected with truthful 400-class errors");

  // ---------------------------------------------------------------------------
  // 2. Brief normalization — defaults + channel filtering
  // ---------------------------------------------------------------------------
  console.log("\n--- 2. Brief normalization ---");
  const normalized = service.validateBusinessBrief({
    businessName: "Skyline Residences",
    productOrService: "Luxury 3 & 4 BHK residences",
    targetAudience: "Affluent families and investors",
    campaignGoal: "lead_generation", // lowercase must normalize
    channels: ["instagram", "NO_SUCH_CHANNEL", "GOOGLE_SEARCH"],
    website: "https://skyline.example",
    brandContext: "RERA-first luxury developer"
  });
  assert.strictEqual(normalized.campaignGoal, CAMPAIGN_GOALS.LEAD_GENERATION);
  assert.deepStrictEqual(normalized.channels, [CHANNELS.INSTAGRAM, CHANNELS.GOOGLE_SEARCH]);
  assert.strictEqual(normalized.website, "https://skyline.example");
  assert.strictEqual(normalized.brandContext, "RERA-first luxury developer");
  assert.strictEqual(normalized.budgetLevel, "UNSPECIFIED");
  console.log("✔ PASS: goal normalized, unknown channels dropped, optionals preserved");

  // ---------------------------------------------------------------------------
  // 3. Deterministic generation — full structure
  // ---------------------------------------------------------------------------
  console.log("\n--- 3. Deterministic strategy generation ---");
  const strategy = await service.generateStrategy({
    businessName: "Skyline Residences",
    industry: "Real Estate",
    productOrService: "Luxury 3 & 4 BHK residences",
    targetAudience: "Affluent families and investors",
    campaignGoal: CAMPAIGN_GOALS.LEAD_GENERATION,
    geography: "Jaipur, Rajasthan",
    channels: ["INSTAGRAM", "GOOGLE_SEARCH", "EMAIL", "WHATSAPP"],
    brandContext: "RERA-first luxury developer"
  });

  assert.ok(strategy.strategyId && strategy.strategyId.startsWith("gs_"), "strategyId issued");
  assert.strictEqual(strategy.engine, STRATEGY_ENGINE.DETERMINISTIC_TEMPLATE_V1);
  assert.ok(strategy.engineNotice.includes("Deterministic"), "engine notice present");
  assert.ok(strategy.strategyHash && /^[a-f0-9]{64}$/.test(strategy.strategyHash), "SHA-256 strategy hash present");
  assert.strictEqual(strategy.businessBrief.businessName, "Skyline Residences");

  // All canonical strategy sections exist
  for (const section of [
    "audience", "positioning", "campaignObjective", "funnelStages", "channelStrategy",
    "contentRequirements", "creativeRequirements", "presenceRequirements",
    "communicationRequirements", "revenueHandoffRequirements", "measurementPlan"
  ]) {
    assert.ok(strategy[section] !== undefined && strategy[section] !== null, `section present: ${section}`);
  }

  // Funnel completeness
  assert.strictEqual(strategy.funnelStages.length, 6);
  assert.deepStrictEqual(
    strategy.funnelStages.map((s) => s.stage),
    ["AWARENESS", "INTEREST", "CONSIDERATION", "CONVERSION", "RETENTION", "ADVOCACY"]
  );
  assert.ok(strategy.funnelStages.every((s) => s.requirement && s.requirement.length >= 5));

  // Channel strategy mirrors declared channels
  assert.deepStrictEqual(
    strategy.channelStrategy.map((c) => c.channel),
    ["INSTAGRAM", "GOOGLE_SEARCH", "EMAIL", "WHATSAPP"]
  );
  assert.ok(strategy.channelStrategy.every((c) => c.role && Array.isArray(c.contentFormats)));

  // Universe ownership mapping present
  assert.strictEqual(strategy.contentRequirements.ownedByUniverse, "U20");
  assert.strictEqual(strategy.creativeRequirements.ownedByUniverse, "U19");
  assert.strictEqual(strategy.presenceRequirements.ownedByUniverse, "U22");
  assert.strictEqual(strategy.communicationRequirements.ownedByUniverse, "U07");
  assert.strictEqual(strategy.revenueHandoffRequirements.ownedByUniverse, "U10");
  console.log("✔ PASS: canonical GrowthStrategy structure with U19-U22/U07/U10 ownership");

  // Truth law: approval governance + no fabricated metrics
  assert.ok(
    strategy.communicationRequirements.governanceNotice.includes("founder approval"),
    "communication governance requires founder approval"
  );
  assert.ok(
    strategy.measurementPlan.truthNotice.includes("UNAVAILABLE"),
    "measurement plan declares UNAVAILABLE policy for disconnected platforms"
  );
  assert.ok(
    strategy.creativeRequirements.generationTruthNotice.includes("requires a connected generation provider"),
    "creative truth notice present"
  );
  console.log("✔ PASS: truth-law notices present (approval gates, unavailable metrics, provider truth)");

  // ---------------------------------------------------------------------------
  // 4. Determinism — same brief yields identical strategy hash
  // ---------------------------------------------------------------------------
  console.log("\n--- 4. Determinism verification ---");
  const again = await service.generateStrategy({
    businessName: "Skyline Residences",
    industry: "Real Estate",
    productOrService: "Luxury 3 & 4 BHK residences",
    targetAudience: "Affluent families and investors",
    campaignGoal: CAMPAIGN_GOALS.LEAD_GENERATION,
    geography: "Jaipur, Rajasthan",
    channels: ["INSTAGRAM", "GOOGLE_SEARCH", "EMAIL", "WHATSAPP"],
    brandContext: "RERA-first luxury developer"
  });
  assert.strictEqual(again.strategyHash, strategy.strategyHash, "same brief => same strategy hash");
  assert.notStrictEqual(again.strategyId, strategy.strategyId, "distinct strategyIds");
  console.log("✔ PASS: deterministic engine — identical briefs produce identical hashes");

  // ---------------------------------------------------------------------------
  // 5. Goal-dependent variation
  // ---------------------------------------------------------------------------
  console.log("\n--- 5. Goal-dependent variation ---");
  const launchStrategy = await service.generateStrategy({
    businessName: "Skyline Residences",
    productOrService: "Luxury 3 & 4 BHK residences",
    targetAudience: "Affluent families and investors",
    campaignGoal: CAMPAIGN_GOALS.LAUNCH
  });
  assert.notStrictEqual(launchStrategy.strategyHash, strategy.strategyHash, "different goal => different hash");
  assert.ok(launchStrategy.campaignObjective.includes("launch-window"), "objective reflects LAUNCH goal");
  const seoStrategy = await service.generateStrategy({
    businessName: "Skyline Residences",
    productOrService: "Luxury 3 & 4 BHK residences",
    targetAudience: "Affluent families and investors",
    campaignGoal: CAMPAIGN_GOALS.SEO_AUTHORITY
  });
  assert.ok(seoStrategy.campaignObjective.includes("organic authority"), "objective reflects SEO goal");
  console.log("✔ PASS: strategy varies correctly with campaign goal");

  // ---------------------------------------------------------------------------
  // 6. Persistence + retrieval
  // ---------------------------------------------------------------------------
  console.log("\n--- 6. Persistence & retrieval ---");
  const fetched = service.getStrategy(strategy.strategyId);
  assert.strictEqual(fetched.strategyId, strategy.strategyId);
  assert.strictEqual(fetched.strategyHash, strategy.strategyHash);
  const list = service.listStrategies(10);
  assert.ok(list.length >= 3, "listed strategies include all generated ones");
  assert.ok(list[0].createdAt >= list[list.length - 1].createdAt, "list sorted newest-first");
  assert.strictEqual(service.getStrategy("gs_does_not_exist"), null);
  console.log("✔ PASS: JSONL persistence, get by id, newest-first listing");

  // ---------------------------------------------------------------------------
  // 7. Intelligence hook — honest 501, no fake LLM
  // ---------------------------------------------------------------------------
  console.log("\n--- 7. LLM intelligence hook honesty ---");
  await assert.rejects(
    () => service.generateWithIntelligence(),
    (err) => err.statusCode === 501 && err.code === "STRATEGY_INTELLIGENCE_NOT_CONNECTED"
  );
  assert.strictEqual(STRATEGY_ENGINE.LLM_ASSISTED, "LLM_ASSISTED"); // contract reserved
  console.log("✔ PASS: LLM hook truthfully reports not-connected (501) — no fake AI claims");

  console.log("\n=== ALL GROWTH STRATEGY TESTS PASSED ===");
}

run().catch((err) => {
  console.error("✘ TEST FAILURE:", err.message);
  process.exit(1);
});
