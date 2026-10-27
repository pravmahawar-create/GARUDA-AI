/**
 * 🦅 GARUDA SOVEREIGN REDDIT & TECH BUYER RADAR (RSS + SERPER HYBRID)
 * 
 * Fetches 100% REAL, LIVE hiring posts where clients have OPEN WALLETS.
 * 1. Queries Reddit RSS with polite pacing (no 429 rate limit).
 * 2. Queries Serper Google Search for Reddit [HIRING] posts from the past 7 days.
 * 3. Filters strictly for tech, web, app, automation, and cybersecurity projects.
 * 4. Extracts:
 *    - Reddit Author
 *    - Direct 1-Click Message Link
 *    - Exact Budget Range
 *    - Problem Statement
 *    - Surgical High-Caliber Architecture Proposal (Zero-Begging Standard)
 */

const https = require("https");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env") });

const SUBREDDITS = ["forhire", "freelance_forhire", "hiring", "jobbit"];
const SERPER_API_KEY = process.env.SERPER_API_KEY;

const DATA_DIR = path.join(__dirname, "..", "..", "data", "leads");
const OUTPUT_FILE = path.join(DATA_DIR, "live_reddit_buyers.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function cleanHtml(str) {
  if (!str) return "";
  return str
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function fetchRss(subreddit) {
  return new Promise((resolve) => {
    const userAgents = [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
      "GARUDA-Autonomous-Hunter/2.1 (contact: praveen@garudaos.in)"
    ];
    const chosenUa = userAgents[Math.floor(Math.random() * userAgents.length)];

    const options = {
      hostname: "www.reddit.com",
      path: `/r/${subreddit}/new/.rss`,
      headers: {
        "User-Agent": chosenUa,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
      }
    };

    https.get(options, (res) => {
      if (res.statusCode !== 200) {
        console.warn(`[RSS] /r/${subreddit} returned status ${res.statusCode}`);
        return resolve([]);
      }
      let xml = "";
      res.on("data", (c) => (xml += c));
      res.on("end", () => {
        resolve(parseRssXml(xml, subreddit));
      });
    }).on("error", (err) => {
      console.warn(`[RSS Error] ${err.message}`);
      resolve([]);
    });
  });
}

function parseRssXml(xml, subreddit) {
  const items = [];
  const entries = xml.split("<entry>").slice(1);

  for (const entry of entries) {
    const titleMatch = entry.match(/<title>([\s\S]*?)<\/title>/);
    const linkMatch = entry.match(/<link href="([^"]+)"/);
    const authorMatch = entry.match(/<name>([^<]+)<\/name>/);
    const updatedMatch = entry.match(/<updated>([^<]+)<\/updated>/);
    const contentMatch = entry.match(/<content type="html">([\s\S]*?)<\/content>/);

    const title = titleMatch ? cleanHtml(titleMatch[1]) : "";
    const link = linkMatch ? linkMatch[1] : "";
    const rawAuthor = authorMatch ? authorMatch[1].replace(/^\/u\//, "") : "";
    const updated = updatedMatch ? updatedMatch[1] : "";
    const rawContent = contentMatch ? cleanHtml(contentMatch[1]) : "";

    const titleLower = title.toLowerCase();

    // STRICT QUALIFICATION: MUST BE [HIRING]
    const isHiring = titleLower.includes("[hiring]") || titleLower.startsWith("hiring");
    const isForHire = titleLower.includes("[for hire]") || titleLower.includes("[forhire]") || titleLower.startsWith("for hire");

    if (isHiring && !isForHire && rawAuthor && !rawAuthor.toLowerCase().includes("bot")) {
      let budgetSignal = "Negotiable / Open Budget";
      const budgetMatch = rawContent.match(/(\$\d+[\d,]*(\s*-\s*\$?\d+[\d,]*)?|\d+\s*(USD|EUR|GBP|INR)|\$\d+\/hr)/i) ||
                          title.match(/(\$\d+[\d,]*(\s*-\s*\$?\d+[\d,]*)?|\$\d+\/hr)/i);
      if (budgetMatch) {
        budgetSignal = budgetMatch[0];
      }

      const techKeywords = ["developer", "react", "node", "python", "fullstack", "frontend", "backend", "web", "app", "flutter", "mobile", "automation", "api", "software", "ai", "bot", "database", "security", "pentest"];
      const isTechRelevant = techKeywords.some(kw => titleLower.includes(kw) || rawContent.toLowerCase().includes(kw));

      if (isTechRelevant) {
        const directDmUrl = `https://www.reddit.com/message/compose/?to=${rawAuthor}&subject=${encodeURIComponent("Regarding: " + title.slice(0, 50))}`;
        const chatUrl = `https://www.reddit.com/user/${rawAuthor}`;

        items.push({
          source: `Reddit RSS (r/${subreddit})`,
          title,
          author: rawAuthor,
          authorProfile: chatUrl,
          directDmUrl,
          postUrl: link,
          budgetSignal,
          postedAt: updated,
          snippet: rawContent.slice(0, 600),
          actionStrategy: generateAuthorityStrategy(title, rawContent, rawAuthor)
        });
      }
    }
  }

  return items;
}

function searchSerper(query) {
  return new Promise((resolve) => {
    if (!SERPER_API_KEY) return resolve([]);
    const postData = JSON.stringify({ q: query, num: 10, gl: "us", hl: "en" });
    const options = {
      hostname: "google.serper.dev",
      path: "/search",
      method: "POST",
      headers: {
        "X-API-KEY": SERPER_API_KEY,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (c) => (body += c));
      res.on("end", () => {
        try {
          const json = JSON.parse(body);
          resolve(json.organic || []);
        } catch (_) {
          resolve([]);
        }
      });
    });
    req.on("error", () => resolve([]));
    req.write(postData);
    req.end();
  });
}

function generateAuthorityStrategy(title, content, author) {
  return {
    strategyName: "Surgical Architecture Proof Drop",
    recommendation: "Never beg or send a generic resume. Break down their exact engineering bottleneck and provide live working proof (GARUDA OS).",
    readyPitch: `Hey /u/${author || "there"},

I saw your requirement for: "${title.slice(0, 80)}"

At GARUDA OS, we build production software and automation engines designed for sub-second execution, zero latency, and verified resilience.

How we solve this immediately:
1. Architecture: Clean typed codebase, reactive state management, and strict zero-bloat execution.
2. Verified Delivery: 100% build verification, end-to-end integration tests, and SHA-certified deployments.
3. Live Production Proof: https://www.garudaos.in

We can deploy a working prototype or proof-of-concept directly for you without lengthy agency delays. 
Let's connect if you want this solved cleanly.`
  };
}

async function runRedditHybridHunter() {
  console.log("🦅 ========================================================");
  console.log("🦅 GARUDA HYBRID REDDIT & BUYER INTENT RADAR (RSS + SERPER)");
  console.log("🦅 Scope: In-Market Buyers with Open Wallets & Real Tech Needs");
  console.log("🦅 ========================================================");

  const allBuyers = [];

  // 1. Fetch RSS feeds with polite spacing
  for (const sub of SUBREDDITS) {
    console.log(`📡 Fetching live RSS feed: r/${sub}...`);
    const results = await fetchRss(sub);
    console.log(`   Found ${results.length} qualified [HIRING] posts.`);
    allBuyers.push(...results);
    await sleep(2500); // 2.5s polite delay
  }

  // 2. Fetch via Serper Google Search for deep recent hiring posts
  const searchQueries = [
    'site:reddit.com/r/forhire "[HIRING]" ("developer" OR "automation" OR "web app")',
    'site:reddit.com/r/freelance_forhire "[Hiring]" ("developer" OR "programmer" OR "engineer")',
    'site:reddit.com/r/hiring "[Hiring]" ("fullstack" OR "backend" OR "frontend" OR "AI")'
  ];

  for (const sq of searchQueries) {
    console.log(`🔍 Google Search Radar: ${sq.slice(0, 50)}...`);
    const organic = await searchSerper(sq);
    for (const r of organic) {
      const titleLower = (r.title || "").toLowerCase();
      const isHiring = titleLower.includes("[hiring]") || titleLower.startsWith("hiring");
      const isForHire = titleLower.includes("[for hire]") || titleLower.includes("[forhire]");

      if (isHiring && !isForHire) {
        // Extract author from Reddit URL or snippet
        const authorMatch = r.snippet.match(/by\s+([a-zA-Z0-9_-]+)/i) || r.title.match(/by\s+([a-zA-Z0-9_-]+)/i);
        const author = authorMatch ? authorMatch[1] : "client";
        const directDmUrl = author !== "client" 
          ? `https://www.reddit.com/message/compose/?to=${author}&subject=${encodeURIComponent("Regarding: " + r.title.slice(0, 50))}`
          : r.link;

        allBuyers.push({
          source: "Google Deep Radar",
          title: r.title,
          author,
          authorProfile: author !== "client" ? `https://www.reddit.com/user/${author}` : r.link,
          directDmUrl,
          postUrl: r.link,
          budgetSignal: r.snippet.match(/\$\d+[\d,]*/)?.[0] || "Standard Project Rate",
          postedAt: r.date || "Recent",
          snippet: r.snippet,
          actionStrategy: generateAuthorityStrategy(r.title, r.snippet, author)
        });
      }
    }
    await sleep(1000);
  }

  // Deduplicate by postUrl
  const seen = new Set();
  const uniqueBuyers = [];
  for (const b of allBuyers) {
    if (!seen.has(b.postUrl)) {
      seen.add(b.postUrl);
      uniqueBuyers.push(b);
    }
  }

  const payload = {
    updatedAt: new Date().toISOString(),
    totalActiveBuyers: uniqueBuyers.length,
    buyers: uniqueBuyers
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(payload, null, 2), "utf8");
  const sha256 = crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");

  console.log("\n========================================================");
  console.log(`🦅 [RADAR COMPLETE] Total Active In-Market Tech Buyers Found: ${uniqueBuyers.length}`);
  console.log(`💾 Saved To: ${OUTPUT_FILE}`);
  console.log(`🔒 Verified SHA-256: ${sha256}`);
  console.log("========================================================\n");

  return payload;
}

if (require.main === module) {
  runRedditHybridHunter()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("FATAL:", err);
      process.exit(1);
    });
}

module.exports = { runRedditHybridHunter };
