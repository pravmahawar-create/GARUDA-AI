require("dotenv").config();
const fs = require("fs");
const path = require("path");

async function huntMarketingLeads() {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) {
    console.error("SERPER_API_KEY missing in .env");
    return;
  }

  const queries = [
    '"looking for performance marketing agency" email OR contact India',
    '"need a digital marketing agency" contact email India',
    '"hiring performance marketing agency" Delhi OR Mumbai OR Bangalore email',
    'site:linkedin.com/posts "looking for a performance marketing" email'
  ];

  const foundLeads = [];

  for (const q of queries) {
    console.log(`Querying: ${q}`);
    try {
      const res = await fetch("https://google.serper.dev/search", {
        method: "POST",
        headers: {
          "X-API-KEY": apiKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ q, num: 10 })
      });
      const data = await res.json();
      const organic = data.organic || [];
      console.log(`  Found ${organic.length} results`);

      for (const item of organic) {
        const snippet = (item.snippet || "") + " " + (item.title || "");
        // Extract email if present
        const emailMatch = snippet.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        if (emailMatch && !emailMatch[0].includes("example") && !emailMatch[0].includes("domain")) {
          foundLeads.push({
            title: item.title,
            link: item.link,
            snippet: item.snippet,
            email: emailMatch[0]
          });
        }
      }
    } catch (err) {
      console.error("Error running query:", err.message);
    }
  }

  console.log(`\nExtracted ${foundLeads.length} leads with direct contact emails:`);
  foundLeads.forEach((l, idx) => {
    console.log(`${idx + 1}. [${l.email}] ${l.title} (${l.link})`);
  });

  const outPath = path.join(__dirname, "..", "data", "marketing-prospects.json");
  fs.writeFileSync(outPath, JSON.stringify(foundLeads, null, 2), "utf8");
  console.log(`\nSaved leads to ${outPath}`);
}

huntMarketingLeads();
