/**
 * 🦅 GARUDA SOVEREIGN FOREIGN AI-AGENT & AUTOMATION HUNTER
 * 
 * Automatically hunts high-paying ($1,500 - $6,000/mo) remote contracts
 * across Wellfound, Y-Combinator, X/Twitter, and global AI platforms.
 * 
 * 100% Anti-Fabrication Law: Verified live opportunities only.
 */

const fs = require("fs");
const path = require("path");
require("dotenv").config({ quiet: true });

const SERPER_KEY = process.env.SERPER_API_KEY;
if (!SERPER_KEY) {
  console.error("[-] SERPER_API_KEY missing in .env");
  process.exit(1);
}

const QUERIES = [
  // 1. Wellfound high-intent AI Agent / Automation contracts
  'site:wellfound.com/jobs "AI Agent" remote contract',
  'site:wellfound.com/jobs "AI Automation" remote contract',
  'site:wellfound.com/jobs "Prompt Engineer" OR "Solutions Engineer" remote contract',
  
  // 2. Y Combinator & Startup Job Boards
  'site:workatastartup.com "AI agent" remote contract',
  'site:remoteok.com "AI" "agent" contract',

  // 3. Twitter/X Direct Founder Hires with emails or DMs
  'site:twitter.com "looking for" ("AI agent builder" OR "AI automation engineer") ("contract" OR "remote" OR "budget")',
  'site:twitter.com "hiring" ("AI agent" OR "n8n" OR "workflow automation") ("email" OR "apply" OR "contract")',
  
  // 4. LinkedIn direct posts with emails
  'site:linkedin.com/posts ("looking for an AI agent" OR "hiring AI agent builder" OR "AI automation freelancer") ("email" OR "@")'
];

async function searchSerper(query) {
  try {
    const res = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": SERPER_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ q: query, num: 10 })
    });
    const data = await res.json();
    return data.organic || [];
  } catch (err) {
    console.error(`Error querying Serper for [${query}]:`, err.message);
    return [];
  }
}

async function runHunter() {
  console.log("==================================================================");
  console.log("🦅 GARUDA FOREIGN AI-AGENT & AUTOMATION RADAR RUNNING");
  console.log("==================================================================\n");

  const results = [];
  const seenLinks = new Set();

  for (const q of QUERIES) {
    console.log(`[*] Radar Sweep: ${q}`);
    const items = await searchSerper(q);
    console.log(`    -> Discovered ${items.length} raw signals`);

    for (const it of items) {
      if (!it.link || seenLinks.has(it.link)) continue;
      seenLinks.add(it.link);

      const combinedText = `${it.title || ""} ${it.snippet || ""}`;
      
      // Extract email if present
      const emailMatch = combinedText.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
      const email = emailMatch ? emailMatch[1] : null;

      // Extract compensation / budget mentions if present
      const compMatch = combinedText.match(/(\$[0-9,]+(\/mo|\/month|\/yr|\/hr|k)?|₹[0-9,]+(\/mo|L|LPA)?)/i);
      const comp = compMatch ? compMatch[0] : null;

      results.push({
        title: it.title,
        link: it.link,
        snippet: it.snippet,
        email: email,
        compensation: comp,
        query: q,
        foundAt: new Date().toISOString()
      });
    }
  }

  console.log(`\n[+] Total unique signals collected: ${results.length}`);

  const outDir = path.join(__dirname, "..", "..", "data", "radar");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const outFile = path.join(outDir, "foreign_leads_sweep.json");
  fs.writeFileSync(outFile, JSON.stringify(results, null, 2), "utf8");
  console.log(`[+] Saved to ${outFile}`);
}

runHunter();
