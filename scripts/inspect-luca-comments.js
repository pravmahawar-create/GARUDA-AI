const puppeteer = require('puppeteer');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function inspectLuca() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--window-size=1440,900'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  await page.setCookie(
    { name: 'c_user', value: process.env.FB_C_USER.trim(), domain: '.facebook.com', path: '/', secure: true },
    { name: 'xs', value: process.env.FB_XS.trim(), domain: '.facebook.com', path: '/', httpOnly: true, secure: true }
  );

  await page.goto('https://www.facebook.com/profile.php?id=61589688085889', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 5000));

  // Find all comments under his post
  const comments = await page.evaluate(() => {
    const list = [];
    const commentEls = Array.from(document.querySelectorAll("ul div[role='article'], div[aria-label*='Comment by' i]"));
    for (const c of commentEls) {
      list.push(c.textContent.trim().replace(/\s+/g, ' '));
    }
    return list;
  });

  console.log('Detected comments count:', comments.length);
  console.log('Comments:', JSON.stringify(comments, null, 2));

  await browser.close();
}

inspectLuca().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
