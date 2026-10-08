const fs = require('fs');
const path = require('path');
require('dotenv').config();

const SERPER_API_KEY = process.env.SERPER_API_KEY;
if (!SERPER_API_KEY) {
  console.error("SERPER_API_KEY missing");
  process.exit(1);
}

const queries = [
  'site:reddit.com/r/forhire "[hiring]" ("web developer" OR "developer") ("email" OR "@gmail" OR "contact")',
  'site:news.ycombinator.com "Ask HN: Freelancer? Seeking freelancer" ("developer" OR "web" OR "react" OR "python")',
  'site:twitter.com OR site:x.com "looking for a web developer" ("email" OR "@")',
  '"looking for a web developer" "send portfolio to" OR "email me at"',
  '"need a web developer" "reach out to" OR "email:"',
  '"hiring freelance developer" "email your portfolio to"'
];

async function search() {
  const allResults = [];
  const seen = new Set();

  for (const q of queries) {
    console.log(`Searching: ${q}`);
    try {
      const res = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': SERPER_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ q, num: 10 })
      });
      const data = await res.json();
      const organic = data.organic || [];
      console.log(`  -> Found ${organic.length} results`);

      for (const item of organic) {
        if (seen.has(item.link)) continue;
        seen.add(item.link);

        // Regex for email
        const fullText = (item.title || '') + ' ' + (item.snippet || '');
        const emailMatch = fullText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);

        allResults.push({
          title: item.title,
          snippet: item.snippet,
          link: item.link,
          email: emailMatch ? emailMatch[0] : null
        });
      }
      await new Promise(r => setTimeout(r, 600));
    } catch (e) {
      console.error('Error on query', q, e.message);
    }
  }

  const outputPath = path.join(__dirname, '..', '..', 'data', 'leads', 'screaming_clients_with_contacts.json');
  fs.writeFileSync(outputPath, JSON.stringify(allResults, null, 2), 'utf8');
  console.log(`\nTotal results: ${allResults.length}`);
  const withEmail = allResults.filter(r => r.email);
  console.log(`Results with direct email: ${withEmail.length}`);
  withEmail.forEach(r => {
    console.log(`- [EMAIL: ${r.email}] ${r.title} (${r.link})`);
    console.log(`  ${r.snippet}`);
  });
}

search();
