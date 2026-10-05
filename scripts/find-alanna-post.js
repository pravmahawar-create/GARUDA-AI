const puppeteer = require('puppeteer');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--window-size=1440,900'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

  await page.setCookie(
    { name: 'c_user', value: process.env.FB_C_USER.trim(), domain: '.facebook.com', path: '/', secure: true },
    { name: 'xs', value: process.env.FB_XS.trim(), domain: '.facebook.com', path: '/', httpOnly: true, secure: true }
  );

  const url = 'https://www.facebook.com/search/posts/?q=' + encodeURIComponent('Alanna Giselle reputable and reliable web designer');
  console.log('Navigating to:', url);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 6000));

  const postInfo = await page.evaluate(() => {
    const articles = Array.from(document.querySelectorAll("div[role='feed'] > div, div[role='article']"));
    for (const a of articles) {
      const text = a.innerText || '';
      if (text.includes('Alanna Giselle') || text.includes('Marine Park') || text.includes('business website')) {
        const links = Array.from(a.querySelectorAll('a[href]')).map(l => l.href);
        return { found: true, text: text.slice(0, 300), links: links.slice(0, 5) };
      }
    }
    return { found: false, snippet: document.body.innerText.slice(0, 300) };
  });

  console.log('Post search result:', JSON.stringify(postInfo, null, 2));
  await page.screenshot({ path: path.join(__dirname, '..', 'output', 'fb_alanna_direct_search.png') });
  await browser.close();
})();
