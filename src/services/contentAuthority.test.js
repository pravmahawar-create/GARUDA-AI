const assert = require("assert");
const fs = require("fs");
const path = require("path");

function runContentAuthorityTests() {
  console.log("================================================================================");
  console.log("STARTING GARUDA CONTENT AUTHORITY & EVERGREEN GUIDES TEST SUITE");
  console.log("================================================================================\n");

  const repoRoot = path.resolve(__dirname, "..", "..");

  // 1. Guides Data Library
  console.log("--- 1. Guides Data Library Integrity ---");
  const guidesDataPath = path.join(repoRoot, "frontend", "src", "config", "guidesData.js");
  assert(fs.existsSync(guidesDataPath), "guidesData.js must exist");
  const guidesContent = fs.readFileSync(guidesDataPath, "utf8");

  const requiredGuideSlugs = [
    "ai-agent-vs-chatbot",
    "how-business-workflow-automation-works",
    "rag-systems-architecture-implementation-guide",
    "how-to-build-saas-mvp-architecture-timeline",
    "custom-software-vs-off-the-shelf-software",
    "automate-whatsapp-business-operations-ai",
    "what-custom-ai-development-actually-involves",
    "how-to-plan-ai-automation-project"
  ];

  for (const slug of requiredGuideSlugs) {
    assert(guidesContent.includes(`"${slug}":`), `guidesData.js must define guide slug '${slug}'`);
  }
  console.log(`✔ PASS: All ${requiredGuideSlugs.length} evergreen authority guide slugs defined`);

  // 2. Data Depth & Substance Checks
  console.log("\n--- 2. Guide Substance, TOC & Intent Attribution ---");
  assert(guidesContent.includes("Intent hypothesis — requires Search Console / keyword data validation."), "Guides must clearly attribute search intent hypotheses");
  assert(guidesContent.includes("tableOfContents: ["), "Guides must provide structured Table of Contents");
  assert(guidesContent.includes("faqs: ["), "Guides must provide structured FAQ data");
  assert(guidesContent.includes("relatedServiceSlug:"), "Guides must link to commercial services");
  console.log("✔ PASS: Guide articles contain TOC, FAQs, intent attribution, and commercial linkages");

  // 3. React Routing & Components
  console.log("\n--- 3. React Routes & Navigation Architecture ---");
  const appJsxPath = path.join(repoRoot, "frontend", "src", "App.jsx");
  const appJsx = fs.readFileSync(appJsxPath, "utf8");
  assert(appJsx.includes('path="/guides"'), "App.jsx must route /guides");
  assert(appJsx.includes('path="/guides/:slug"'), "App.jsx must route /guides/:slug");
  assert(appJsx.includes("GuidesIndex"), "App.jsx must import GuidesIndex");
  assert(appJsx.includes("GuideArticle"), "App.jsx must import GuideArticle");

  const landingJsxPath = path.join(repoRoot, "frontend", "src", "pages", "PublicLanding.jsx");
  const landingJsx = fs.readFileSync(landingJsxPath, "utf8");
  assert(landingJsx.includes('href="/guides"'), "PublicLanding.jsx footer must link to /guides");
  console.log("✔ PASS: React application wires /guides and /guides/:slug with footer discovery links");

  // 4. Sitemap.xml & Robots.txt Coverage
  console.log("\n--- 4. Sitemap.xml & Robots.txt Coverage ---");
  const sitemapPath = path.join(repoRoot, "frontend", "public", "sitemap.xml");
  const sitemap = fs.readFileSync(sitemapPath, "utf8");
  assert(sitemap.includes("<loc>https://www.garudaos.in/guides</loc>"), "Sitemap must include /guides hub");
  for (const slug of requiredGuideSlugs) {
    const expectedLoc = `<loc>https://www.garudaos.in/guides/${slug}</loc>`;
    assert(sitemap.includes(expectedLoc), `Sitemap must include '${expectedLoc}'`);
  }

  const robotsPath = path.join(repoRoot, "frontend", "public", "robots.txt");
  const robots = fs.readFileSync(robotsPath, "utf8");
  assert(robots.includes("Allow: /guides/"), "robots.txt must allow /guides/");
  console.log(`✔ PASS: Sitemap.xml and robots.txt correctly publish all ${requiredGuideSlugs.length + 1} guide authority URLs`);

  // 5. Prerender Pipeline Configuration
  console.log("\n--- 5. Static Prerender Configuration ---");
  const prerenderPath = path.join(repoRoot, "scripts", "prerender-seo.js");
  const prerender = fs.readFileSync(prerenderPath, "utf8");
  assert(prerender.includes('path: "/guides"'), "prerender-seo.js must configure /guides");
  for (const slug of requiredGuideSlugs) {
    assert(prerender.includes(`/guides/${slug}`), `prerender-seo.js must configure '/guides/${slug}'`);
  }
  console.log("✔ PASS: Prerender engine is configured for all 8 evergreen guides + guides hub");

  // 6. Vercel Rewrites
  console.log("\n--- 6. Vercel Clean URL Rewrites ---");
  const vercelPath = path.join(repoRoot, "vercel.json");
  const vercel = fs.readFileSync(vercelPath, "utf8");
  assert(vercel.includes('"source": "/guides"'), "vercel.json must rewrite /guides");
  for (const slug of requiredGuideSlugs) {
    assert(vercel.includes(`"source": "/guides/${slug}"`), `vercel.json must rewrite '/guides/${slug}'`);
  }
  console.log("✔ PASS: Vercel routing configuration includes all 8 guide endpoints");

  console.log("\n================================================================================");
  console.log("📚 ALL GARUDA CONTENT AUTHORITY & EVERGREEN GUIDES TESTS PASSED 100%!");
  console.log("================================================================================");
}

if (require.main === module) {
  runContentAuthorityTests();
}

module.exports = { runContentAuthorityTests };
