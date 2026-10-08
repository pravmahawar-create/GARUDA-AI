const fs = require('fs');
require('dotenv').config();

const queries = [
  '"looking for a web developer" "@gmail.com" -job -internship',
  '"looking for an app developer" "@gmail.com"',
  '"need a developer to build" "@gmail.com"',
  '"hiring a web developer" "send resume to" OR "send portfolio to"',
  '"looking for freelance developer" "email me at"'
];

async function scan() {
  const hits = [];
  for (const q of queries) {
    try {
      const res = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': process.env.SERPER_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ q, num: 10, tbs: 'qdr:m' })
      });
      const data = await res.json();
      (data.organic || []).forEach(item => {
        const text = (item.title || '') + ' ' + (item.snippet || '');
        const email = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        if (email) {
          hits.push({
            title: item.title,
            snippet: item.snippet,
            link: item.link,
            email: email[0],
            date: item.date || 'Recent'
          });
        }
      });
    } catch (e) {
      console.error(e.message);
    }
  }

  console.log(`Discovered ${hits.length} leads with emails:`);
  hits.forEach(h => console.log(`- [${h.email}] ${h.title} (${h.link})`));
}

scan();
