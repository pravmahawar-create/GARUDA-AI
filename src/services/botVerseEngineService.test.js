const test = require("node:test");
const assert = require("node:assert");
const botVerseEngine = require("./botVerseEngineService");

test("GARUDA Bot-Verse Engine — Digital Marketing Universe", async (t) => {
  await t.test("generates full 6-platform omni-channel bot campaign with SHA-256", () => {
    const campaign = botVerseEngine.generateBotVerseCampaign({
      topic: "Scaling Indian B2B Agencies",
      niche: "Performance Marketing",
      targetAudience: "Founders"
    });

    assert.ok(campaign.campaignId.startsWith("bv_"));
    assert.strictEqual(campaign.universe, "U20_CONTENT_U22_PRESENCE_DIGITAL_MARKETING");
    assert.ok(campaign.sha256Evidence);
    assert.strictEqual(campaign.sha256Evidence.length, 64);

    // All 6 bot engines verified
    const { bots } = campaign;
    assert.ok(bots.youtubeApexBot);
    assert.strictEqual(bots.youtubeApexBot.optimizedTitles.length, 3);
    assert.ok(bots.youtubeApexBot.seoChapters.length >= 3);
    assert.ok(bots.youtubeApexBot.shortsFactory.hook_0_to_3s);

    assert.ok(bots.instagramViralBot);
    assert.strictEqual(bots.instagramViralBot.automatedDmTrigger.keyword, "SCALE");

    assert.ok(bots.facebookOmniBot);
    assert.ok(bots.linkedInExecutiveBot);
    assert.strictEqual(bots.linkedInExecutiveBot.carouselSlideDeck.length, 5);

    assert.ok(bots.googleSemanticSeoBot);
    assert.strictEqual(bots.googleSemanticSeoBot.jsonLdSchema["@type"], "VideoObject");

    assert.ok(bots.unifiedConversionBridge);
    assert.ok(bots.unifiedConversionBridge.channelRouting.youtube.includes("garudaos.in/chat"));
  });

  await t.test("optimizes and revives existing video", () => {
    const revived = botVerseEngine.optimizeExistingVideo({
      title: "Dead Marketing Video 2024",
      niche: "Ecommerce ROAS",
      videoUrl: "https://www.youtube.com/watch?v=sample123"
    });

    assert.ok(revived.campaignId);
    assert.strictEqual(revived.seedVideoUrl, "https://www.youtube.com/watch?v=sample123");
    assert.ok(revived.bots.youtubeApexBot.optimizedTitles[0].title);
  });

  await t.test("lists persisted campaigns", () => {
    const list = botVerseEngine.listCampaigns();
    assert.ok(Array.isArray(list));
    assert.ok(list.length >= 1);
  });
});
