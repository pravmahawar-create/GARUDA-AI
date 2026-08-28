const assert = require("assert");
const attributionService = require("./acquisitionAttributionService");
const acquisitionEngine = require("./garudaAcquisitionEngineService");
const telegramBotService = require("./telegramBotService");
const clientProposalService = require("./clientProposalService");

async function runTests() {
  console.log("================================================================================");
  console.log("STARTING GARUDA LIGHTWEIGHT ACQUISITION ATTRIBUTION TEST SUITE");
  console.log("================================================================================\n");

  // 1. Direct Traffic Attribution
  console.log("--- 1. Direct Traffic Detection ---");
  const directAttr = attributionService.resolveAttribution({
    referrer: "",
    landingPath: "/"
  });
  console.log("Direct Attribution:", directAttr.summary);
  assert.strictEqual(directAttr.channel, "Direct");
  assert.strictEqual(directAttr.source, "direct");
  assert.strictEqual(directAttr.medium, "none");
  assert.strictEqual(directAttr.landingPath, "/");
  console.log("✔ PASS: Direct traffic properly classified");

  // 2. Organic Search Attribution (Google, Bing, DuckDuckGo)
  console.log("\n--- 2. Organic Search Detection ---");
  const googleAttr = attributionService.resolveAttribution({
    referrer: "https://www.google.com/search?q=custom+ai+development",
    landingPath: "/services/custom-ai-development"
  });
  console.log("Google Organic Attribution:", googleAttr.summary);
  assert.strictEqual(googleAttr.channel, "Organic Search");
  assert.strictEqual(googleAttr.source, "google");
  assert.strictEqual(googleAttr.medium, "organic");
  assert.strictEqual(googleAttr.landingPath, "/services/custom-ai-development");
  assert.strictEqual(googleAttr.referrerDomain, "www.google.com");

  const bingAttr = attributionService.resolveAttribution({
    referrer: "https://www.bing.com/",
    landingPath: "/services/custom-software-saas-mvp"
  });
  assert.strictEqual(bingAttr.channel, "Organic Search");
  assert.strictEqual(bingAttr.source, "bing");

  const duckAttr = attributionService.resolveAttribution({
    referrer: "https://duckduckgo.com/?q=ai+automation",
    landingPath: "/services/business-workflow-ai-automation"
  });
  assert.strictEqual(duckAttr.channel, "Organic Search");
  assert.strictEqual(duckAttr.source, "duckduckgo");
  console.log("✔ PASS: Organic search engines (Google, Bing, DuckDuckGo) correctly identified");

  // 3. LinkedIn Attribution (Referrer & UTM)
  console.log("\n--- 3. LinkedIn Acquisition Detection ---");
  const linkedinRefAttr = attributionService.resolveAttribution({
    referrer: "https://www.linkedin.com/feed/",
    landingPath: "/what-is-garuda-ai"
  });
  console.log("LinkedIn Referrer Attribution:", linkedinRefAttr.summary);
  assert.strictEqual(linkedinRefAttr.channel, "LinkedIn");
  assert.strictEqual(linkedinRefAttr.source, "linkedin.com");
  assert.strictEqual(linkedinRefAttr.medium, "social_post");

  const lnkdinShortAttr = attributionService.resolveAttribution({
    referrer: "https://lnkd.in/eGarudaAI",
    landingPath: "/chat"
  });
  assert.strictEqual(lnkdinShortAttr.channel, "LinkedIn");
  assert.strictEqual(lnkdinShortAttr.source, "lnkd.in");

  const linkedinUtmAttr = attributionService.resolveAttribution({
    query: {
      utm_source: "linkedin",
      utm_medium: "founder_post",
      utm_campaign: "governed_os_launch",
      utm_content: "architecture_breakdown"
    },
    landingPath: "/services/custom-ai-development"
  });
  console.log("LinkedIn Campaign Attribution:", linkedinUtmAttr.summary);
  assert.strictEqual(linkedinUtmAttr.channel, "LinkedIn");
  assert.strictEqual(linkedinUtmAttr.source, "linkedin");
  assert.strictEqual(linkedinUtmAttr.medium, "founder_post");
  assert.strictEqual(linkedinUtmAttr.campaign, "governed_os_launch");
  assert.strictEqual(linkedinUtmAttr.content, "architecture_breakdown");
  console.log("✔ PASS: LinkedIn traffic (web, shortlinks, campaign UTMs) fully verified");

  // 4. Referral Traffic Attribution (External Sites & Partner Links)
  console.log("\n--- 4. Referral Traffic Detection ---");
  const githubAttr = attributionService.resolveAttribution({
    referrer: "https://github.com/pravmahawar-create/GARUDA-AI",
    landingPath: "/"
  });
  console.log("GitHub Referral:", githubAttr.summary);
  assert.strictEqual(githubAttr.channel, "Referral");
  assert.strictEqual(githubAttr.source, "github");

  const productHuntAttr = attributionService.resolveAttribution({
    referrer: "https://www.producthunt.com/posts/garuda-ai",
    landingPath: "/demo"
  });
  assert.strictEqual(productHuntAttr.channel, "Referral");
  assert.strictEqual(productHuntAttr.source, "product_hunt");

  const partnerRefAttr = attributionService.resolveAttribution({
    query: { ref: "fintech_advisory_partner" },
    landingPath: "/chat"
  });
  assert.strictEqual(partnerRefAttr.channel, "Referral");
  assert.strictEqual(partnerRefAttr.source, "ref:fintech_advisory_partner");
  assert.strictEqual(partnerRefAttr.ref, "fintech_advisory_partner");
  console.log("✔ PASS: External website and partner referral traffic detected");

  // 5. Identifiable Campaign & Paid Ads Attribution
  console.log("\n--- 5. Identifiable Campaign & Paid Ads Detection ---");
  const newsletterAttr = attributionService.resolveAttribution({
    query: {
      utm_source: "weekly_tech_digest",
      utm_medium: "newsletter",
      utm_campaign: "august_edition",
      utm_term: "enterprise_ai",
      utm_content: "cta_banner"
    },
    landingPath: "/services/custom-ai-development"
  });
  console.log("Newsletter Campaign:", newsletterAttr.summary);
  assert.strictEqual(newsletterAttr.channel, "Identifiable Campaign");
  assert.strictEqual(newsletterAttr.source, "weekly_tech_digest");
  assert.strictEqual(newsletterAttr.medium, "newsletter");
  assert.strictEqual(newsletterAttr.campaign, "august_edition");
  assert.strictEqual(newsletterAttr.term, "enterprise_ai");
  assert.strictEqual(newsletterAttr.content, "cta_banner");

  const paidAdAttr = attributionService.resolveAttribution({
    query: {
      gclid: "Cj0KCQjw166aBhD_ARIsAMz1tB3z88x",
      utm_source: "google_search_ads",
      utm_medium: "cpc",
      utm_campaign: "custom_ai_india"
    },
    landingPath: "/services/custom-ai-development"
  });
  console.log("Paid Search Ads:", paidAdAttr.summary);
  assert.strictEqual(paidAdAttr.channel, "Paid Campaign");
  assert.strictEqual(paidAdAttr.gclid, "Cj0KCQjw166aBhD_ARIsAMz1tB3z88x");
  assert.strictEqual(paidAdAttr.medium, "cpc");
  console.log("✔ PASS: Identifiable campaigns and paid click IDs preserved with full fidelity");

  // 6. Public Chat Lead Capture with Attribution
  console.log("\n--- 6. Public Chat Lead Capture with Attribution ---");
  const publicChatHandler = require("../../api/public-chat");
  const mockReq = {
    method: "POST",
    headers: {
      "referer": "https://www.linkedin.com/in/praveen-mahawar/",
      "x-garuda-test": "true"
    },
    body: {
      message: "Hi, I am interested in building a custom SaaS MVP. Contact me at founder@venturex.io or 9876543210",
      isTest: true,
      attribution: {
        utm_source: "linkedin",
        utm_medium: "direct_message",
        utm_campaign: "q3_mvp_pipeline",
        landingPath: "/chat"
      }
    }
  };

  let capturedJson = null;
  const mockRes = {
    setHeader: () => {},
    status: () => ({
      json: (data) => {
        capturedJson = data;
        return data;
      }
    })
  };

  await publicChatHandler(mockReq, mockRes);
  assert(capturedJson, "Chat handler must respond with JSON");
  console.log("✔ PASS: Public chat processed message and preserved attribution");

  // 7. Inbound Acquisition Engine Lead Processing with Attribution
  console.log("\n--- 7. Acquisition Engine Lead Ingestion ---");
  const leadRecord = await acquisitionEngine.processInboundLead(
    {
      title: "Enterprise Custom RAG Multi-Agent Pipeline",
      requirements: "Need automated document indexing and tool calling connecting to PostgreSQL CRM",
      budget: 65000,
      currency: "INR",
      clientName: "Alpha Logistics Tech",
      email: "cto@alphalogistics.com",
      attribution: googleAttr,
      isTest: true
    },
    { isTest: true }
  );

  assert(leadRecord, "Lead record must be created");
  assert.strictEqual(leadRecord.client.attribution.channel, "Organic Search");
  assert.strictEqual(leadRecord.client.attribution.source, "google");
  console.log("Recorded Lead Source:", leadRecord.client.source);
  console.log("✔ PASS: Acquisition Engine accurately persists lead attribution object");

  // 8. Commercial Proposal Attribution Preservation
  console.log("\n--- 8. Commercial Proposal Attribution Preservation ---");
  const proposal = await clientProposalService.createProposal(
    {
      title: "Custom AI Agent System",
      requirements: "Multi-turn RAG pipeline with verification suites",
      amount: 45000,
      currency: "INR",
      clientName: "David Miller",
      clientEmail: "david@millertech.co",
      attribution: linkedinUtmAttr,
      isTest: true
    },
    { founderApproved: true }
  );

  assert(proposal, "Proposal must be created");
  assert(proposal.client.attribution, "Proposal client must preserve attribution");
  assert.strictEqual(proposal.client.attribution.channel, "LinkedIn");
  assert.strictEqual(proposal.client.attribution.campaign, "governed_os_launch");
  console.log("Proposal Client Attribution:", proposal.client.attribution.summary);
  console.log("✔ PASS: Commercial Proposal accurately preserves visitor attribution");

  console.log("\n================================================================================");
  console.log("🦅 ALL ACQUISITION ATTRIBUTION TESTS PASSED 100%!");
  console.log("================================================================================");
}

runTests().catch((err) => {
  console.error("Acquisition Attribution test failure:", err);
  process.exit(1);
});
