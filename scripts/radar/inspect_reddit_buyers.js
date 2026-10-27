/**
 * Inspect Reddit Buyer Posts to extract author, full body, budget, and requirements.
 */
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const leadsPath = path.join(__dirname, '..', '..', 'data', 'leads', 'urgent_screaming_buyers.json');
const leadsData = JSON.parse(fs.readFileSync(leadsPath, 'utf8'));

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

  const inspected = [];

  for (const lead of leadsData.leads.slice(0, 8)) {
    try {
      console.log(`Inspecting: ${lead.link}`);
      await page.goto(lead.link, { waitUntil: 'domcontentloaded', timeout: 25000 });
      await new Promise(r => setTimeout(r, 2000));

      const info = await page.evaluate(() => {
        const post = document.querySelector('shreddit-post');
        const author = post ? post.getAttribute('author') : null;
        const title = post ? post.getAttribute('post-title') : document.title;
        const textBody = document.querySelector('[slot="text-body"]');
        const body = textBody ? textBody.innerText : '';
        return { author, title, body };
      });

      console.log(` -> Author: /u/${info.author} | Title: ${info.title ? info.title.slice(0, 50) : 'none'}`);
      inspected.push({
        url: lead.link,
        author: info.author,
        title: info.title || lead.title,
        body: info.body || lead.snippet,
        originalSnippet: lead.snippet
      });
    } catch (e) {
      console.error(` -> Error on ${lead.link}:`, e.message);
    }
  }

  await browser.close();

  const outPath = path.join(__dirname, '..', '..', 'data', 'leads', 'inspected_screaming_buyers.json');
  fs.writeFileSync(outPath, JSON.stringify(inspected, null, 2));
  console.log(`Saved ${inspected.length} inspected buyers to: ${outPath}`);
})();
