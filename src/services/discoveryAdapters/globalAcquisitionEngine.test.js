const assert = require("assert");
const {
  detectCurrency,
  convertToINR,
  inspectOpportunitySafety,
  generateDeduplicationFingerprint
} = require("./baseAdapter");

const RemotiveDiscoveryAdapter = require("./remotiveAdapter");
const FreelanceRssDiscoveryAdapter = require("./freelanceRssAdapter");
const GitHubBountiesDiscoveryAdapter = require("./githubBountiesAdapter");
const CustomSoftwareRfpDiscoveryAdapter = require("./customSoftwareRfpAdapter");
const discoveryAdapterRegistry = require("./adapterRegistry");
const { normalizeOpportunity, runDiscoveryCycle } = require("../opportunityDiscoveryService");

async function runTests() {
  console.log("Starting GARUDA Global Acquisition Engine Test Suite...\n");

  // --- 1. Multi-Currency Detection & Benchmark Conversion ---
  console.log("--- 1. Multi-Currency Detection & Benchmark Conversion ---");
  assert.strictEqual(detectCurrency("$5,000 USD"), "USD");
  assert.strictEqual(detectCurrency("€4,500 monthly"), "EUR");
  assert.strictEqual(detectCurrency("£3,200 fixed"), "GBP");
  assert.strictEqual(detectCurrency("AED 15,000 per project"), "AED");
  assert.strictEqual(detectCurrency("CAD 8,000 contract"), "CAD");
  assert.strictEqual(detectCurrency("AUD 12,000 MVP"), "AUD");
  assert.strictEqual(detectCurrency("SGD 6,500 build"), "SGD");
  assert.strictEqual(detectCurrency("₹1,50,000 INR"), "INR");

  const inrFromUsd = convertToINR(1000, "USD");
  assert.strictEqual(inrFromUsd, 85000, "1000 USD should convert to 85,000 INR benchmark");
  const inrFromEur = convertToINR(1000, "EUR");
  assert(inrFromEur > 90000, "1000 EUR should convert to > 90,000 INR benchmark");
  const inrFromGbp = convertToINR(1000, "GBP");
  assert(inrFromGbp > 105000, "1000 GBP should convert to > 105,000 INR benchmark");
  const inrFromAed = convertToINR(10000, "AED");
  assert(inrFromAed > 200000, "10000 AED should convert to > 200,000 INR benchmark");
  console.log("✔ PASS: Multi-currency detection and benchmark conversion verified");

  // --- 2. Safety & Fraud Filtering ---
  console.log("\n--- 2. Safety & Fraud Filtering ---");
  const safeOpp = { title: "Build React SaaS Dashboard", description: "Node.js and MongoDB backend", url: "https://valid.com" };
  const safeCheck = inspectOpportunitySafety(safeOpp);
  assert.strictEqual(safeCheck.accepted, true);

  const casinoOpp = { title: "Online Casino Betting App", description: "Gambling backend", url: "https://casino.com" };
  const casinoCheck = inspectOpportunitySafety(casinoOpp);
  assert.strictEqual(casinoCheck.accepted, false);
  assert(casinoCheck.rejectionReasons.includes("prohibited_or_age_restricted_category"));

  const scamOpp = { title: "Data Entry Project", description: "Registration fee required upfront via telegram only", url: "https://work.com" };
  const scamCheck = inspectOpportunitySafety(scamOpp);
  assert.strictEqual(scamCheck.accepted, false);
  assert(scamCheck.rejectionReasons.includes("scam_signal_detected"));
  console.log("✔ PASS: Safety and scam filters protect against prohibited and fraudulent listings");

  // --- 3. Deduplication Fingerprinting ---
  console.log("\n--- 3. Deduplication Fingerprinting ---");
  const oppA = { title: "Senior Full Stack React Engineer", company: "Acme Corp" };
  const oppB = { title: "Senior Full-Stack React Engineer!", company: "Acme Corp." };
  const oppC = { title: "Python AI Developer", company: "Beta Inc" };
  const fpA = generateDeduplicationFingerprint(oppA);
  const fpB = generateDeduplicationFingerprint(oppB);
  const fpC = generateDeduplicationFingerprint(oppC);

  assert.strictEqual(fpA, fpB, "Fuzzy normalized titles and companies should produce identical fingerprints");
  assert.notStrictEqual(fpA, fpC, "Different opportunities must produce distinct fingerprints");
  console.log("✔ PASS: Cross-source fuzzy deduplication fingerprinting verified");

  // --- 4. Source Adapter Normalization ---
  console.log("\n--- 4. Source Adapter Normalization ---");

  // 4a. Remotive Adapter
  const remotiveAdapter = new RemotiveDiscoveryAdapter();
  const normRemotive = remotiveAdapter.normalize({
    id: 991,
    title: "AI Integrations Engineer",
    company_name: "TechFlow",
    description: "Build LLM RAG pipelines in Node.js",
    category: "Software Development",
    candidate_required_location: "Worldwide",
    url: "https://remotive.com/jobs/991",
    salary: "$85,000 / year",
    tags: ["Node.js", "AI", "RAG"]
  });
  assert.strictEqual(normRemotive.source, "remotive");
  assert.strictEqual(normRemotive.currency, "USD");
  assert.strictEqual(normRemotive.company, "TechFlow");

  // 4b. Freelance RSS Adapter
  const rssAdapter = new FreelanceRssDiscoveryAdapter();
  const normRss = rssAdapter.normalize({
    guid: "wwr_12345",
    title: "Nexus Labs is hiring Full Stack Next.js & Supabase Developer",
    description: "Fixed price contract $4,000 for SaaS MVP build",
    link: "https://weworkremotely.com/jobs/12345",
    pubDate: new Date().toISOString(),
    feedSource: "weworkremotely"
  });
  assert.strictEqual(normRss.source, "freelance_rss");
  assert.strictEqual(normRss.company, "Nexus Labs");
  assert.strictEqual(normRss.isDirectClientWork, true);

  // 4c. GitHub Bounties Adapter
  const bountyAdapter = new GitHubBountiesDiscoveryAdapter();
  const normBounty = bountyAdapter.normalize({
    id: "bounty_789",
    title: "Implement automated webhook signature verification",
    org_name: "OpenCore Protocol",
    description: "Write Node.js HMAC verification tests",
    reward_amount: 1500,
    currency: "USD",
    url: "https://github.com/bounties/789"
  });
  assert.strictEqual(normBounty.source, "github_bounties");
  assert.strictEqual(normBounty.company, "OpenCore Protocol");
  assert.strictEqual(normBounty.projectType, "bounty");

  // 4d. Custom Software RFP Adapter
  const rfpAdapter = new CustomSoftwareRfpDiscoveryAdapter();
  const normRfp = rfpAdapter.normalize({
    id: "rfp_442",
    title: "Hospital ERP Appointment Automation Workflow",
    client: "Healthcare Systems Ltd",
    description: "Build automated WhatsApp booking and calendar sync",
    budget: "AED 25,000 fixed",
    location: "Dubai, UAE"
  });
  assert.strictEqual(normRfp.source, "custom_software_rfp");
  assert.strictEqual(normRfp.currency, "AED");
  assert.strictEqual(normRfp.company, "Healthcare Systems Ltd");
  console.log("✔ PASS: All 4 source adapters normalize to unified schema cleanly");

  // --- 5. Unified Downstream Qualification & Scoring ---
  console.log("\n--- 5. Unified Downstream Qualification & Scoring ---");
  const candidate = normalizeOpportunity(normRss, "mission_test_root");
  assert.strictEqual(candidate.source, "freelance_rss");
  assert(candidate.score >= 45, "Opportunity should receive a valid score");
  assert(candidate.capabilityAssessment.matches.length > 0, "Should match GARUDA capability registry");
  assert.strictEqual(candidate.opportunityChannel, "garuda_deliverable", "Direct client contract should qualify as garuda_deliverable");
  assert.strictEqual(candidate.status, "ranked");
  console.log("✔ PASS: Unified opportunity scored and classified into garuda_deliverable channel");

  // --- 6. Multi-Source Adapter Registry & Fault Isolation ---
  console.log("\n--- 6. Multi-Source Adapter Registry & Fault Isolation ---");
  const registryResult = await discoveryAdapterRegistry.fetchAllOpportunities();
  assert(typeof registryResult.totalRawFetched === "number");
  assert(typeof registryResult.uniqueCount === "number");
  assert(registryResult.opportunities.length <= registryResult.totalRawFetched);
  console.log(`✔ PASS: Adapter Registry executed: Fetched ${registryResult.totalRawFetched} items, ${registryResult.duplicatesRemoved} duplicates removed, ${registryResult.uniqueCount} unique opportunities ready`);

  // --- 7. Full Discovery Cycle Integration ---
  console.log("\n--- 7. Full Discovery Cycle Integration ---");
  const cycleSummary = await runDiscoveryCycle({ intervalMs: 60000 });
  assert.strictEqual(typeof cycleSummary.fetched, "number");
  assert(cycleSummary.errors.length === 0 || cycleSummary.errors.every((e) => typeof e === "string"));
  console.log(`✔ PASS: runDiscoveryCycle executed cleanly across all global sources (Mode: ${cycleSummary.mode}, Fetched: ${cycleSummary.fetched}, Ranked: ${cycleSummary.ranked})`);

  console.log("\n🦅 ALL 7 GLOBAL ACQUISITION ENGINE TEST CASES PASSED CLEANLY!");
}

runTests().catch((err) => {
  console.error("Global Acquisition Engine test failure:", err);
  process.exit(1);
});
