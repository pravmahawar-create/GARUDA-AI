const fs = require('fs');
const path = require('path');
require('dotenv').config();

const SERPER_API_KEY = process.env.SERPER_API_KEY;

const queries = [
  'site:reddit.com/r/forhire "[hiring]" ("web developer" OR "website" OR "app" OR "full stack")',
  'site:reddit.com/r/hireaprogrammer "[hiring]"',
  'site:reddit.com/r/freelance_forhire "[hiring]" developer',
  'site:twitter.com OR site:x.com "looking for a web developer" OR "need a web developer to build"'
];

async function run() {
  const results = [];
  for (const q of queries) {
    console.log(`\n=== QUERY: ${q} ===`);
    try {
      const res = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: { 'X-API-KEY': SERPER_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ q, num: 10, tbs: 'qdr:m' }) // PAST MONTH ONLY
      });
      const data = await res.json();
      const organic = data.organic || [];
      console.log(`Found: ${organic.length}`);
      organic.forEach(item => {
        console.log(`- [${item.date || 'Recent'}] ${item.title}`);
        console.log(`  ${item.snippet}`);
        console.log(`  Link: ${item.link}`);
        results.push(item);
      });
    } catch (e) {
      console.error(e.message);
    }
  }

  fs.writeFileSync(
    path.join(__dirname, '..', '..', 'data', 'leads', 'ultra_fresh_reddit_gigs.json'),
    JSON.stringify(results, null, 2),
    'utf8'
  );
}

run();
