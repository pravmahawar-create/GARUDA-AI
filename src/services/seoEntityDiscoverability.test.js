const assert = require("assert");
const fs = require("fs");
const path = require("path");

async function runTests() {
  console.log("================================================================================");
  console.log("STARTING GARUDA GOOGLE BRAND ENTITY & SEARCH DISCOVERABILITY TEST SUITE");
  console.log("================================================================================\n");

  const repoRoot = path.resolve(__dirname, "../..");
  const indexHtmlPath = path.join(repoRoot, "frontend", "index.html");
  const robotsTxtPath = path.join(repoRoot, "frontend", "public", "robots.txt");
  const sitemapXmlPath = path.join(repoRoot, "frontend", "public", "sitemap.xml");
  const whatIsGarudaPath = path.join(repoRoot, "frontend", "src", "pages", "WhatIsGarudaAI.jsx");
  const seoHeadPath = path.join(repoRoot, "frontend", "src", "components", "SEOHead.jsx");

  // 1. Check file existence
  console.log("--- 1. SEO & Entity Asset Existence ---");
  assert(fs.existsSync(indexHtmlPath), "frontend/index.html must exist");
  assert(fs.existsSync(robotsTxtPath), "frontend/public/robots.txt must exist");
  assert(fs.existsSync(sitemapXmlPath), "frontend/public/sitemap.xml must exist");
  assert(fs.existsSync(whatIsGarudaPath), "WhatIsGarudaAI.jsx must exist");
  assert(fs.existsSync(seoHeadPath), "SEOHead.jsx component must exist");
  console.log("✔ PASS: All required SEO and Entity source files exist");

  // 2. Canonical Domain Normalization in index.html
  console.log("\n--- 2. Canonical Domain Normalization (WWW Primary) ---");
  const indexHtml = fs.readFileSync(indexHtmlPath, "utf8");
  assert(indexHtml.includes('<link rel="canonical" href="https://www.garudaos.in/" />'), "Canonical link must point to https://www.garudaos.in/");
  assert(indexHtml.includes('<meta property="og:url" content="https://www.garudaos.in/" />'), "OG URL must point to https://www.garudaos.in/");
  assert(indexHtml.includes('<meta name="twitter:url" content="https://www.garudaos.in/" />'), "Twitter URL must point to https://www.garudaos.in/");
  assert(!indexHtml.includes('href="https://garudaos.in/"'), "Must not use non-www 308 redirect in canonical");
  console.log("✔ PASS: Canonical URLs strictly use non-redirecting https://www.garudaos.in/");

  // 3. Brand Naming & Title Strategy
  console.log("\n--- 3. Brand Naming & Search Title Strategy ---");
  assert(indexHtml.includes("<title>GARUDA AI Operating System | Custom AI & Software Engineering</title>"));
  assert(indexHtml.includes('content="GARUDA AI"'), "og:site_name must be GARUDA AI");
  assert(indexHtml.includes("Praveen Mahawar"), "Founder Praveen Mahawar must be attributed");
  console.log("✔ PASS: Title, brand naming, and founder attribution verified");

  // 4. Schema.org JSON-LD Entity Graph Integrity
  console.log("\n--- 4. Schema.org JSON-LD Entity Graph Integrity ---");
  const jsonLdMatch = indexHtml.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i);
  assert(jsonLdMatch, "Schema.org script block must exist in index.html");
  
  const parsedSchema = JSON.parse(jsonLdMatch[1]);
  assert(parsedSchema["@graph"] && Array.isArray(parsedSchema["@graph"]));
  
  const org = parsedSchema["@graph"].find((node) => node["@type"] === "Organization");
  assert(org, "Organization schema node must exist");
  assert.strictEqual(org.name, "GARUDA AI");
  assert.strictEqual(org.legalName, "GARUDA AI Operating System");
  assert(org.alternateName.includes("GARUDA AI OS"));
  assert(org.alternateName.includes("GARUDA-AI"));
  assert.strictEqual(org.url, "https://www.garudaos.in");
  assert.strictEqual(org.founder?.name, "Praveen Mahawar");
  assert(org.sameAs.includes("https://github.com/pravmahawar-create/GARUDA-AI"));
  assert(org.knowsAbout.includes("Artificial Intelligence"));
  assert(org.knowsAbout.includes("AI Operating Systems"));

  const app = parsedSchema["@graph"].find((node) => node["@type"] === "SoftwareApplication");
  assert(app, "SoftwareApplication schema node must exist");
  assert.strictEqual(app.name, "GARUDA AI Operating System");
  assert.strictEqual(app.applicationCategory, "BusinessApplication");

  const website = parsedSchema["@graph"].find((node) => node["@type"] === "WebSite");
  assert(website, "WebSite schema node must exist");
  assert.strictEqual(website.url, "https://www.garudaos.in");

  const profService = parsedSchema["@graph"].find((node) => node["@type"] === "ProfessionalService");
  assert(profService, "ProfessionalService schema node must exist");
  assert(profService.serviceType.includes("Custom AI Development"));
  console.log("✔ PASS: Complete multi-node Schema.org Entity Graph verified (Organization, SoftwareApplication, WebSite, ProfessionalService)");

  // 5. Robots.txt Syntax & Private Route Protection
  console.log("\n--- 5. Robots.txt Directives & Privacy Protection ---");
  const robotsTxt = fs.readFileSync(robotsTxtPath, "utf8");
  assert(robotsTxt.includes("Allow: /what-is-garuda-ai"));
  assert(robotsTxt.includes("Allow: /services/"));
  assert(robotsTxt.includes("Allow: /chat"));
  assert(robotsTxt.includes("Disallow: /founder"));
  assert(robotsTxt.includes("Disallow: /revenue"));
  assert(robotsTxt.includes("Disallow: /api/"));
  assert(robotsTxt.includes("Disallow: /app"));
  assert(robotsTxt.includes("Disallow: /pay/"));
  assert(robotsTxt.includes("Disallow: /proposal/"));
  assert(robotsTxt.includes("Disallow: /login"));
  assert(robotsTxt.includes("Disallow: /signup"));
  assert(robotsTxt.includes("Sitemap: https://www.garudaos.in/sitemap.xml"));
  console.log("✔ PASS: Robots.txt properly allows public pages, disallows private routes, and references canonical sitemap");

  // 6. Sitemap.xml Structure & URLs
  console.log("\n--- 6. Sitemap.xml Coverage & URL Verification ---");
  const sitemapXml = fs.readFileSync(sitemapXmlPath, "utf8");
  const expectedUrls = [
    "https://www.garudaos.in/",
    "https://www.garudaos.in/what-is-garuda-ai",
    "https://www.garudaos.in/chat",
    "https://www.garudaos.in/services/custom-ai-development",
    "https://www.garudaos.in/services/custom-software-saas-mvp",
    "https://www.garudaos.in/services/business-workflow-ai-automation",
    "https://www.garudaos.in/services/whatsapp-telegram-ai-bots",
    "https://www.garudaos.in/demo"
  ];
  for (const u of expectedUrls) {
    assert(sitemapXml.includes(`<loc>${u}</loc>`), `Sitemap must contain ${u}`);
  }
  assert(!sitemapXml.includes("https://garudaos.in/"), "Sitemap must not contain non-www redirect URLs");
  assert(!sitemapXml.includes("/founder"), "Sitemap must not contain private founder URLs");
  assert(!sitemapXml.includes("/revenue"), "Sitemap must not contain private revenue URLs");
  console.log(`✔ PASS: Sitemap.xml contains all ${expectedUrls.length} public canonical pages with zero private or redirecting URLs`);

  // 7. WhatIsGarudaAI Page Integrity & FAQ Schema
  console.log("\n--- 7. WhatIsGarudaAI Dedicated Entity Page ---");
  const whatIsGaruda = fs.readFileSync(whatIsGarudaPath, "utf8");
  assert(whatIsGaruda.includes("Entity Identity & Disambiguation"));
  assert(whatIsGaruda.includes("FAQPage"));
  assert(whatIsGaruda.includes("Garuda Linux"));
  assert(whatIsGaruda.includes("Mother Brain & Orchestration"));
  assert(whatIsGaruda.includes("Praveen Mahawar"));
  console.log("✔ PASS: Dedicated entity page contains architecture breakdown, disambiguation, and FAQPage schema");

  // 8. Prerendered Distribution Files Verification
  console.log("\n--- 8. Prerendered Static HTML Files (Crawler-Visible Output) ---");
  const distDir = path.join(repoRoot, "frontend", "dist");
  if (fs.existsSync(distDir)) {
    const distChecks = [
      {
        file: "index.html",
        expectedTitle: "GARUDA AI Operating System | Custom AI & Software Engineering",
        expectedCanonical: "https://www.garudaos.in/",
        expectedH1: "One Command. Infinite Intelligence."
      },
      {
        file: path.join("what-is-garuda-ai", "index.html"),
        expectedTitle: "What is GARUDA AI? | Autonomous AI Operating System",
        expectedCanonical: "https://www.garudaos.in/what-is-garuda-ai",
        expectedH1: "What is GARUDA AI?"
      },
      {
        file: path.join("services", "custom-ai-development", "index.html"),
        expectedTitle: "Custom AI Development Services | AI Agents & Automation | GARUDA",
        expectedCanonical: "https://www.garudaos.in/services/custom-ai-development",
        expectedH1: "Custom AI Development & Autonomous Agent Architecture"
      },
      {
        file: path.join("chat", "index.html"),
        expectedTitle: "Talk to GARUDA AI | AI Solution Architect & Project Scoping",
        expectedCanonical: "https://www.garudaos.in/chat",
        expectedH1: "Interactive AI Solution Architect & Project Scoping"
      }
    ];

    for (const c of distChecks) {
      const fullPath = path.join(distDir, c.file);
      assert(fs.existsSync(fullPath), `Prerendered file must exist: ${c.file}`);
      const html = fs.readFileSync(fullPath, "utf8");
      assert(html.includes(`<title>${c.expectedTitle}</title>`), `Title mismatch in ${c.file}`);
      assert(html.includes(`<link rel="canonical" href="${c.expectedCanonical}" />`), `Canonical mismatch in ${c.file}`);
      assert(html.includes(`>${c.expectedH1}</h1>`), `H1 mismatch in ${c.file}`);
    }
    console.log("✔ PASS: All prerendered distribution files have 100% unique titles, self-referencing canonicals, and unique H1s");
  }

  console.log("\n================================================================================");
  console.log("🦅 ALL GOOGLE BRAND ENTITY & SEARCH DISCOVERABILITY TESTS PASSED 100%!");
  console.log("================================================================================");
}

runTests().catch((err) => {
  console.error("SEO Entity Discoverability test failure:", err);
  process.exit(1);
});
