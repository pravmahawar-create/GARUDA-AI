const fs = require("fs");
const path = require("path");
require("dotenv").config({ quiet: true });

const SERPER_KEY = process.env.SERPER_API_KEY;

const TARGET_QUERIES = [
  '("looking for an AI agent developer" OR "hiring AI agent builder" OR "need an AI agent") ("email" OR "contact") "contract"',
  '("hiring AI automation freelancer" OR "looking for AI automation engineer") ("email" OR "@") "remote"',
  'site:twitter.com ("hiring" OR "looking for") ("AI agent" OR "n8n automation") ("email to" OR "reach out at" OR "send portfolio")',
  'site:linkedin.com/posts ("hiring" OR "looking for") ("AI agent developer" OR "AI automation freelancer") ("email" OR "@")',
  'site:wellfound.com/jobs "AI Agent" "contract" "remote" "USD"'
];

async function runSweep() {
  const allLeads = [];
  const seen = new Set();

  for (const q of TARGET_QUERIES) {
    try {
      const res = await fetch("https://google.serper.dev/search", {
        method: "POST",
        headers: { "X-API-KEY": SERPER_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ q, num: 10 })
      });
      const data = await res.json();
      const items = data.organic || [];

      for (const it of items) {
        if (!it.link || seen.has(it.link)) continue;
        seen.add(it.link);

        const text = `${it.title || ""} ${it.snippet || ""}`;
        const emailMatches = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];

        allLeads.push({
          title: it.title,
          link: it.link,
          snippet: it.snippet,
          emails: emailMatches,
          query: q
        });
      }
    } catch (e) {
      console.error("Error sweep:", e.message);
    }
  }

  const outPath = path.join(__dirname, "..", "..", "data", "radar", "direct_email_targets.json");
  fs.writeFileSync(outPath, JSON.stringify(allLeads, null, 2), "utf8");
  console.log(`Saved ${allLeads.length} leads to ${outPath}`);
}

runSweep();
