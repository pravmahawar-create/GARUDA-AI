const assert = require("assert");
const fs = require("fs");
const path = require("path");

function runSearchDominanceTests() {
  console.log("================================================================================");
  console.log("STARTING GARUDA SEARCH DOMINANCE & HIGH-INTENT ACQUISITION TEST SUITE");
  console.log("================================================================================\n");

  // 1. Inspect Service Landing Data & Slugs
  console.log("--- 1. Service Clusters & Unique Intent Verification ---");
  const serviceLandingPath = path.join(__dirname, "..", "..", "frontend", "src", "pages", "ServiceLanding.jsx");
  const serviceLandingContent = fs.readFileSync(serviceLandingPath, "utf8");

  const requiredSlugs = [
    "custom-ai-development",
    "ai-agent-development",
    "custom-software-development",
    "website-development",
    "saas-mvp-development",
    "business-automation",
    "rag-development",
    "whatsapp-telegram-ai-bots"
  ];

  for (const slug of requiredSlugs) {
    assert(serviceLandingContent.includes(`"${slug}":`), `ServiceLanding.jsx must define service slug '${slug}'`);
  }
  console.log(`✔ PASS: All ${requiredSlugs.length} high-intent commercial clusters defined`);

  // 2. Inspect FAQ & Structured Data Definition
  console.log("\n--- 2. FAQ & Structured Data Verification ---");
  assert(serviceLandingContent.includes("faqs: ["), "ServiceLanding must include FAQ arrays for buyer questions");
  assert(serviceLandingContent.includes('"@type": "FAQPage"'), "ServiceLanding must inject FAQPage schema");
  assert(serviceLandingContent.includes('"@type": "Service"'), "ServiceLanding must inject Service schema");
  assert(serviceLandingContent.includes('"@type": "BreadcrumbList"'), "ServiceLanding must inject BreadcrumbList schema");
  console.log("✔ PASS: Service schema, FAQPage schema, and BreadcrumbList schema present");

  // 3. Inspect Sitemap.xml
  console.log("\n--- 3. Sitemap.xml Canonical URL Coverage ---");
  const sitemapPath = path.join(__dirname, "..", "..", "frontend", "public", "sitemap.xml");
  const sitemapContent = fs.readFileSync(sitemapPath, "utf8");

  for (const slug of requiredSlugs) {
    const expectedUrl = `https://www.garudaos.in/services/${slug}`;
    assert(sitemapContent.includes(expectedUrl), `sitemap.xml must include '${expectedUrl}'`);
  }
  assert(sitemapContent.includes("https://www.garudaos.in/what-is-garuda-ai"), "sitemap.xml must include what-is-garuda-ai");
  assert(sitemapContent.includes("https://www.garudaos.in/chat"), "sitemap.xml must include chat");
  console.log("✔ PASS: Sitemap.xml contains all canonical commercial & entity URLs");

  // 4. Inspect Prerender Pipeline Configuration
  console.log("\n--- 4. Static Prerender Pipeline Configuration ---");
  const prerenderPath = path.join(__dirname, "..", "..", "scripts", "prerender-seo.js");
  const prerenderContent = fs.readFileSync(prerenderPath, "utf8");

  for (const slug of requiredSlugs) {
    assert(prerenderContent.includes(`/services/${slug}`), `prerender-seo.js must configure route '/services/${slug}'`);
  }
  console.log("✔ PASS: Prerender pipeline covers all 8 commercial service routes");

  // 5. Inspect Internal Linking Architecture
  console.log("\n--- 5. Internal Crawlable Authority & Link Mesh ---");
  const landingPath = path.join(__dirname, "..", "..", "frontend", "src", "pages", "PublicLanding.jsx");
  const landingContent = fs.readFileSync(landingPath, "utf8");

  for (const slug of requiredSlugs) {
    assert(landingContent.includes(`/services/${slug}`), `PublicLanding.jsx must internally link to '/services/${slug}'`);
  }
  console.log("✔ PASS: Homepage includes crawlable internal links to all 8 service clusters");

  // 6. Inspect Search Intent Map & Paid Readiness Documentation
  console.log("\n--- 6. Search Documentation Artifacts ---");
  const intentMapPath = path.join(__dirname, "..", "..", "GARUDA_SEARCH_INTENT_MAP.md");
  assert(fs.existsSync(intentMapPath), "GARUDA_SEARCH_INTENT_MAP.md must exist");
  const paidReadinessPath = path.join(__dirname, "..", "..", "GARUDA_PAID_SEARCH_READINESS.md");
  assert(fs.existsSync(paidReadinessPath), "GARUDA_PAID_SEARCH_READINESS.md must exist");
  console.log("✔ PASS: Organic intent map & paid search readiness blueprints exist");

  console.log("\n================================================================================");
  console.log("🦅 ALL SEARCH DOMINANCE & ACQUISITION TESTS PASSED (100%)!");
  console.log("================================================================================");
}

try {
  runSearchDominanceTests();
} catch (err) {
  console.error("Search Dominance Test Failed:", err);
  process.exit(1);
}
