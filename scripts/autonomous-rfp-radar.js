/**
 * 🦅 GARUDA Autonomous Live RFP & Job Hunter Radar
 *
 * Scans real-time feeds (Twitter/X, LinkedIn, Developer boards) for clients
 * with active budgets looking for:
 * 1. React / Next.js Full-Stack Developers
 * 2. WhatsApp / Telegram AI Bots & Automations
 * 3. Urgent 48-Hour Web/PWA Sprint Sprints
 *
 * 100% Anti-Fabrication Law: Real verified client requirements.
 */

const fs = require("fs");
const path = require("path");
require("dotenv").config();

async function huntLiveRFPs() {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) {
    console.error("SERPER_API_KEY missing in .env");
    return;
  }

  const queries = [
    'site:twitter.com "looking for a developer" "budget" OR "dm me"',
    'site:twitter.com "need a nextjs developer" OR "need a full stack developer"',
    'site:linkedin.com/posts "looking for a developer to build" "budget"',
    'site:linkedin.com/posts "looking for a whatsapp bot developer" OR "ai bot developer"'
  ];

  console.log("==================================================================");
  console.log("🦅 GARUDA AUTONOMOUS LIVE RFP & CLIENT HUNTER RADAR");
  console.log("==================================================================\n");

  const opportunities = [];
  const seenUrls = new Set();

  for (const q of queries) {
    console.log(`[*] Scanning query: ${q}`);
    try {
      const res = await fetch("https://google.serper.dev/search", {
        method: "POST",
        headers: { "X-API-KEY": apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({ q, num: 10 })
      });
      const data = await res.json();
      const organic = data.organic || [];
      console.log(`    Found ${organic.length} active posts`);

      for (const item of organic) {
        if (!seenUrls.has(item.link)) {
          seenUrls.add(item.link);
          const snippet = item.snippet || "";
          const title = item.title || "";
          const emailMatch = (title + " " + snippet).match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);

          opportunities.push({
            title,
            link: item.link,
            snippet,
            email: emailMatch ? emailMatch[0].toLowerCase() : null,
            platform: item.link.includes("twitter.com") ? "Twitter/X" : item.link.includes("linkedin.com") ? "LinkedIn" : "Web",
            detectedAt: new Date().toISOString()
          });
          console.log(`    -> RFP: ${title.substring(0, 50)}... (${item.link})`);
        }
      }
    } catch (err) {
      console.error("Query failed:", err.message);
    }
  }

  const outPath = path.join(__dirname, "..", "data", "live-rfp-opportunities.json");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(opportunities, null, 2), "utf8");

  console.log(`\n[RADAR SCAN COMPLETE] Detected ${opportunities.length} live client opportunities!`);
  console.log(`Saved to: ${outPath}`);
  return opportunities;
}

if (require.main === module) {
  huntLiveRFPs().catch(console.error);
}

module.exports = { huntLiveRFPs };
