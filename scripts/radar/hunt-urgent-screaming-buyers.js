/**
 * 🦅 GARUDA RADAR: URGENT & DESPERATE TECH BUYER HUNTER
 * Finds Reddit clients screaming for help (urgent, ASAP, broken, emergency) in the last 24-48 hours.
 */

require("dotenv").config();
const https = require("https");
const fs = require("fs");
const path = require("path");

const SERPER_API_KEY = process.env.SERPER_API_KEY;

if (!SERPER_API_KEY) {
  console.error("SERPER_API_KEY is missing in .env");
  process.exit(1);
}

const QUERIES = [
  'site:reddit.com/r/forhire "[Hiring]" ("urgent" OR "ASAP" OR "emergency" OR "immediately")',
  'site:reddit.com/r/freelance_forhire "[Hiring]" ("urgent" OR "ASAP" OR "immediately")',
  'site:reddit.com/r/hiring "[Hiring]" ("urgent" OR "ASAP" OR "need developer now")',
  'site:reddit.com/r/webdev ("hiring" OR "need to hire") ("urgent" OR "broken" OR "fix my")',
  'site:reddit.com/r/Wordpress ("hire" OR "looking for developer") ("urgent" OR "critical" OR "broken")'
];

function querySerper(query) {
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      q: query,
      num: 10,
      tbs: "qdr:w" // past week to get fresh active posts
    });

    const req = https.request(
      "https://google.serper.dev/search",
      {
        method: "POST",
        headers: {
          "X-API-KEY": SERPER_API_KEY,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(postData)
        }
      },
      (res) => {
        let body = "";
        res.on("data", (c) => (body += c));
        res.on("end", () => {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            resolve({ organic: [] });
          }
        });
      }
    );

    req.on("error", () => resolve({ organic: [] }));
    req.write(postData);
    req.end();
  });
}

function generateUrgentPitch(title, snippet) {
  return `Hey there,\n\nI saw your urgent requirement: "${title}".\n\nAt GARUDA OS, we build production software and emergency engineering fixes with sub-second execution and zero agency bureaucracy.\n\nHow we resolve this immediately:\n1. Root-cause forensic audit of the defect/scope in under 2 hours.\n2. Clean typed code fix or MVP deployment with SHA-256 verification.\n3. Live production proof: https://www.garudaos.in\n\nIf you need this resolved today without excuses, let's connect directly.`;
}

(async () => {
  console.log("🦅 ========================================================");
  console.log("🦅 SCANNING LIVE RADAR FOR URGENT / DESPERATE TECH BUYERS");
  console.log("🦅 ========================================================");

  const leads = [];
  const seenUrls = new Set();

  for (const q of QUERIES) {
    console.log(`🔍 Scanning: ${q.slice(0, 60)}...`);
    const res = await querySerper(q);
    const items = res.organic || [];

    for (const item of items) {
      if (seenUrls.has(item.link)) continue;
      seenUrls.add(item.link);

      // Check if title or snippet signals hiring or desperation
      const text = `${item.title} ${item.snippet}`.toLowerCase();
      const isUrgent = text.includes("urgent") || text.includes("asap") || text.includes("immediately") || text.includes("emergency") || text.includes("broken") || text.includes("fix");
      const isHiring = text.includes("[hiring]") || text.includes("hiring") || text.includes("looking for") || text.includes("need a developer");

      if (isUrgent || isHiring) {
        // Extract reddit username if possible from URL
        let author = "Client";
        let dmUrl = item.link;

        leads.push({
          title: item.title,
          link: item.link,
          snippet: item.snippet,
          date: item.date || "Recent",
          directDmUrl: dmUrl,
          urgentPitch: generateUrgentPitch(item.title, item.snippet)
        });
      }
    }
  }

  const outputPath = path.join(__dirname, "..", "..", "data", "leads", "urgent_screaming_buyers.json");
  fs.writeFileSync(outputPath, JSON.stringify({ updatedAt: new Date().toISOString(), totalUrgentBuyers: leads.length, leads }, null, 2));

  console.log("\n========================================================");
  console.log(`🦅 [RADAR COMPLETE] Found ${leads.length} Urgent Screaming Tech Buyers!`);
  console.log(`💾 Saved To: ${outputPath}`);
  console.log("========================================================");

  // Print top 3 immediate actionable leads
  leads.slice(0, 3).forEach((lead, i) => {
    console.log(`\n[#${i + 1}] ${lead.title}`);
    console.log(`🔗 Link: ${lead.link}`);
    console.log(`⏱ Date: ${lead.date}`);
    console.log(`📝 Need: ${lead.snippet.slice(0, 140)}...`);
  });
})();
