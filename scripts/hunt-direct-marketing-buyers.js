require("dotenv").config();
const fs = require("fs");
const path = require("path");

async function huntSpecificRFPEmails() {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) {
    console.error("Missing SERPER_API_KEY");
    return;
  }

  const queries = [
    // Direct RFP emails from LinkedIn posts
    'site:linkedin.com/posts "performance marketing agency" ("email at" OR "send your deck" OR "share profile" OR "reach out at") email',
    'site:linkedin.com/posts "looking for a performance marketing agency" ("@" OR "mail")',
    'site:linkedin.com/posts "need a performance marketing agency" ("@" OR "mail")',
    'site:linkedin.com/posts "hiring a performance marketing agency" email',
    'site:linkedin.com/posts "looking for meta ads expert" ("@" OR "mail") India',
    'site:linkedin.com/posts "looking for digital marketing agency" ("send portfolio" OR "email") India',
    // Targeted queries for the specific individuals found earlier
    'site:linkedin.com/in/thesanskarsaxena OR "Sanskar Saxena" email OR brand',
    'site:linkedin.com/in/kanishka-garg OR "Kanishka Garg" "performance marketing" email',
    'site:linkedin.com/in/malavikajaggi OR "Malavika Jaggi" "performance marketing" email'
  ];

  const extracted = [];
  const seenEmails = new Set();

  for (const q of queries) {
    try {
      const res = await fetch("https://google.serper.dev/search", {
        method: "POST",
        headers: { "X-API-KEY": apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({ q, num: 10 })
      });
      const data = await res.json();
      const items = data.organic || [];

      for (const item of items) {
        const fullText = (item.title || "") + " " + (item.snippet || "");
        // Match standard email regex
        const matches = fullText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
        if (matches) {
          for (const email of matches) {
            const cleanEmail = email.toLowerCase().replace(/[.,;]$/, "");
            if (
              !seenEmails.has(cleanEmail) &&
              !cleanEmail.includes("example.com") &&
              !cleanEmail.includes("domain.com") &&
              !cleanEmail.includes("sentry") &&
              !cleanEmail.includes("wixpress")
            ) {
              seenEmails.add(cleanEmail);
              extracted.push({
                email: cleanEmail,
                title: item.title,
                snippet: item.snippet,
                link: item.link
              });
            }
          }
        }
      }
    } catch (err) {
      console.error("Query error:", err.message);
    }
  }

  console.log(`\n=== EXTRACTED ${extracted.length} UNIQUE RFP BUYER EMAILS ===`);
  extracted.forEach((e, idx) => {
    console.log(`${idx + 1}. [${e.email}] - ${e.title}`);
    console.log(`   Link: ${e.link}`);
    console.log(`   Context: ${e.snippet}\n`);
  });

  const outPath = path.join(__dirname, "..", "data", "performance-marketing-buyers.json");
  fs.writeFileSync(outPath, JSON.stringify(extracted, null, 2), "utf8");
  console.log(`Saved to ${outPath}`);
}

huntSpecificRFPEmails();
