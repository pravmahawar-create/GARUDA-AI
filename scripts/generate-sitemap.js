const fs = require("fs");
const path = require("path");

/**
 * 🦅 GARUDA AUTONOMOUS SEO ENGINE
 * - Automatically scans all canonical routes, tools, and founder profiles
 * - Generates clean, updated sitemap.xml with today's lastmod
 * - Injects high-priority routes: /praveen-mahawar, /pawan, /cloth-gst.html
 * - Pings Google and Bing search engines
 */

const PUBLIC_DIR = path.resolve(__dirname, "../frontend/public");
const DIST_DIR = path.resolve(__dirname, "../frontend/dist");
const SITEMAP_PUBLIC = path.join(PUBLIC_DIR, "sitemap.xml");
const SITEMAP_DIST = path.join(DIST_DIR, "sitemap.xml");

const BASE_URL = "https://www.garudaos.in";
const TODAY = new Date().toISOString().split("T")[0];

const CANONICAL_URLS = [
  // Core Platform & Brand
  { url: "/", priority: "1.0", changefreq: "daily" },
  { url: "/what-is-garuda-ai", priority: "0.95", changefreq: "weekly" },
  { url: "/praveen-mahawar", priority: "0.95", changefreq: "weekly" },
  { url: "/pawan", priority: "0.95", changefreq: "daily" },
  { url: "/cloth-gst.html", priority: "0.90", changefreq: "weekly" },
  { url: "/chat", priority: "0.90", changefreq: "weekly" },
  { url: "/demo", priority: "0.80", changefreq: "weekly" },
  { url: "/experience", priority: "0.85", changefreq: "weekly" },
  { url: "/investor", priority: "0.85", changefreq: "weekly" },
  { url: "/kudos", priority: "0.80", changefreq: "weekly" },

  // Commercial Services
  { url: "/services/custom-ai-development", priority: "0.90", changefreq: "weekly" },
  { url: "/services/ai-agent-development", priority: "0.90", changefreq: "weekly" },
  { url: "/services/custom-software-development", priority: "0.90", changefreq: "weekly" },
  { url: "/services/website-development", priority: "0.90", changefreq: "weekly" },
  { url: "/services/saas-mvp-development", priority: "0.90", changefreq: "weekly" },
  { url: "/services/business-automation", priority: "0.90", changefreq: "weekly" },
  { url: "/services/rag-development", priority: "0.90", changefreq: "weekly" },
  { url: "/services/whatsapp-telegram-ai-bots", priority: "0.90", changefreq: "weekly" },

  // Guides & Knowledge Base
  { url: "/guides", priority: "0.85", changefreq: "weekly" },
  { url: "/guides/ai-agent-vs-chatbot", priority: "0.80", changefreq: "monthly" },
  { url: "/guides/how-business-workflow-automation-works", priority: "0.80", changefreq: "monthly" },
  { url: "/guides/rag-systems-architecture-implementation-guide", priority: "0.80", changefreq: "monthly" },
  { url: "/guides/how-to-build-saas-mvp-architecture-timeline", priority: "0.80", changefreq: "monthly" },
  { url: "/guides/custom-software-vs-off-the-shelf-software", priority: "0.80", changefreq: "monthly" },
  { url: "/guides/automate-whatsapp-business-operations-ai", priority: "0.80", changefreq: "monthly" },
  { url: "/guides/what-custom-ai-development-actually-involves", priority: "0.80", changefreq: "monthly" },
  { url: "/guides/how-to-plan-ai-automation-project", priority: "0.80", changefreq: "monthly" },

  // Legal
  { url: "/privacy", priority: "0.50", changefreq: "yearly" },
  { url: "/terms", priority: "0.50", changefreq: "yearly" }
];

function generateSitemapXml() {
  const xmlItems = CANONICAL_URLS.map(item => `  <url>
    <loc>${BASE_URL}${item.url}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>${item.changefreq}</changefreq>
    <priority>${item.priority}</priority>
  </url>`).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlItems}
</urlset>
`;
}

async function runAutonomousSeo() {
  console.log("🦅 GARUDA Autonomous SEO Engine Running...");
  console.log(`Target Date: ${TODAY} | Total Canonical URLs: ${CANONICAL_URLS.length}`);

  const sitemapXml = generateSitemapXml();

  // Write to frontend/public
  if (fs.existsSync(PUBLIC_DIR)) {
    fs.writeFileSync(SITEMAP_PUBLIC, sitemapXml, "utf8");
    console.log(`✔ Updated sitemap written to: ${SITEMAP_PUBLIC}`);
  }

  // Write to frontend/dist if exists
  if (fs.existsSync(DIST_DIR)) {
    fs.writeFileSync(SITEMAP_DIST, sitemapXml, "utf8");
    console.log(`✔ Updated sitemap written to: ${SITEMAP_DIST}`);
  }

  // Ping Search Engines
  const sitemapUrl = encodeURIComponent(`${BASE_URL}/sitemap.xml`);
  const pingEndpoints = [
    { name: "Google Ping", url: `https://www.google.com/ping?sitemap=${sitemapUrl}` },
    { name: "Bing Ping", url: `https://www.bing.com/ping?sitemap=${sitemapUrl}` }
  ];

  for (const ping of pingEndpoints) {
    try {
      const res = await fetch(ping.url, { method: "GET" });
      console.log(`📡 Pinged ${ping.name}: Status ${res.status}`);
    } catch (err) {
      console.log(`⚠️ Ping ${ping.name} skipped: ${err.message}`);
    }
  }

  console.log("🎉 Autonomous SEO Cycle Completed Successfully!");
}

runAutonomousSeo().catch(console.error);
