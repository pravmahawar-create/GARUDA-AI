require("dotenv").config();
const fs = require("fs");
const path = require("path");

async function deepHuntMarketing() {
  const apiKey = process.env.SERPER_API_KEY;
  const queries = [
    'site:linkedin.com/posts "looking for a performance marketing agency" email OR "share your portfolio"',
    'site:linkedin.com/posts "looking for meta ads expert" OR "looking for google ads expert" email',
    'site:linkedin.com/posts "need digital marketing agency for my brand" email',
    'site:twitter.com "looking for performance marketing agency" OR "need a performance marketer"'
  ];

  const results = [];

  for (const q of queries) {
    try {
      const res = await fetch("https://google.serper.dev/search", {
        method: "POST",
        headers: { "X-API-KEY": apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({ q, num: 10 })
      });
      const data = await res.json();
      const organic = data.organic || [];
      for (const item of organic) {
        const text = (item.title || "") + " " + (item.snippet || "");
        const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        results.push({
          title: item.title,
          link: item.link,
          snippet: item.snippet,
          email: emailMatch ? emailMatch[0] : null
        });
      }
    } catch (e) {}
  }

  const outPath = path.join(__dirname, "..", "data", "deep-marketing-leads.json");
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2), "utf8");
  console.log(`Saved ${results.length} marketing opportunities to ${outPath}`);
}

deepHuntMarketing();
