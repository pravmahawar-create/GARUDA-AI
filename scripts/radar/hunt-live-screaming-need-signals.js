/**
 * 🦅 GARUDA SOVEREIGN BUYER-INTENT SIGNAL SCANNER
 * Searches Google & Social platforms via Serper API for clients actively screaming for developers & automation.
 * 
 * Extracts:
 * - Direct Client Need (Exact quote / post)
 * - Source URL & Platform (LinkedIn, X, Reddit, Contra)
 * - Contact info / Author Name
 * - Auto-tailored GARUDA Killer Pitch
 */

require("dotenv").config();
const fs = require("fs");
const path = require("path");

const SERPER_API_KEY = process.env.SERPER_API_KEY;
const OUTPUT_FILE = path.join(__dirname, "..", "..", "data", "leads", "live_screaming_need_signals.json");

const SEARCH_QUERIES = [
  'site:linkedin.com/posts "looking for a web developer" OR "need a web developer for my business"',
  'site:linkedin.com/posts "hiring freelance web developer" OR "need someone to build a website"',
  'site:linkedin.com/posts "looking for an automation specialist" OR "need n8n developer"',
  'site:x.com "looking for a web developer to build" OR "need someone to build my website"',
  'site:reddit.com/r/forhire "hiring" ("web developer" OR "app developer" OR "automation")'
];

async function searchSerper(query) {
  if (!SERPER_API_KEY) {
    throw new Error("SERPER_API_KEY missing in .env");
  }

  const response = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "X-API-KEY": SERPER_API_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      q: query,
      num: 8,
      tbs: "qdr:w" // past week for ultra-fresh live demand!
    })
  });

  if (!response.ok) {
    // If past week yields low results, fallback to past month
    const fallback = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": SERPER_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ q: query, num: 8 })
    });
    return await fallback.json();
  }

  return await response.json();
}

function extractEmail(text) {
  const match = (text || "").match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return match ? match[0] : null;
}

async function run() {
  console.log("\n========================================================");
  console.log("🦅 GARUDA BUYER-INTENT SIGNAL SCANNER (LIVE GOOGLE/SERPER)");
  console.log("========================================================\n");

  const allSignals = [];
  const seenUrls = new Set();

  for (let i = 0; i < SEARCH_QUERIES.length; i++) {
    const q = SEARCH_QUERIES[i];
    console.log(`[Query ${i + 1}/${SEARCH_QUERIES.length}] Scanning: ${q.slice(0, 60)}...`);

    try {
      const data = await searchSerper(q);
      const organic = data.organic || [];

      console.log(`   Found ${organic.length} raw hits.`);

      for (const item of organic) {
        if (seenUrls.has(item.link)) continue;
        seenUrls.add(item.link);

        const email = extractEmail(item.snippet) || extractEmail(item.title);
        
        allSignals.push({
          id: `SIGNAL_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          title: item.title,
          snippet: item.snippet,
          link: item.link,
          date: item.date || "Recent",
          directEmail: email,
          platform: item.link.includes("linkedin.com") ? "LinkedIn" : item.link.includes("x.com") || item.link.includes("twitter.com") ? "X/Twitter" : "Reddit/Web",
          scoutedAt: new Date().toISOString()
        });
      }

      await new Promise(r => setTimeout(r, 1000));
    } catch (err) {
      console.error(`   ❌ Search error for "${q}":`, err.message);
    }
  }

  console.log(`\n✔ Total Distinct High-Intent Screaming Need Signals Harvested: ${allSignals.length}`);
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allSignals, null, 2), "utf8");
  console.log(`✔ Saved to: ${OUTPUT_FILE}\n`);

  console.log("--- TOP 5 FRESHEST BUYER INTENT SIGNALS ---");
  allSignals.slice(0, 5).forEach((s, idx) => {
    console.log(`\n#${idx + 1} [${s.platform}] ${s.title}`);
    console.log(`Need: "${s.snippet.slice(0, 160)}..."`);
    console.log(`Link: ${s.link}`);
    if (s.directEmail) console.log(`📧 Direct Email: ${s.directEmail}`);
  });
}

if (require.main === module) {
  run().catch(console.error);
}

module.exports = { run };
