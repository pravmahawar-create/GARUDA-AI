const puppeteer = require('puppeteer');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const OUTPUT_DIR = path.join(__dirname, '..', 'output');

async function checkFeed() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--window-size=1440,1100'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1100 });
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

  await page.setCookie(
    { name: 'c_user', value: process.env.FB_C_USER.trim(), domain: '.facebook.com', path: '/', secure: true },
    { name: 'xs', value: process.env.FB_XS.trim(), domain: '.facebook.com', path: '/', httpOnly: true, secure: true }
  );

  const query = 'Alanna Giselle reputable and reliable web designer';
  await page.goto('https://www.facebook.com/search/posts/?q=' + encodeURIComponent(query), { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 6000));

  // Scroll down a bit to see Katie Lancashire and beyond
  await page.evaluate(() => window.scrollBy(0, 800));
  await new Promise(r => setTimeout(r, 3000));
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'fb_feed_scroll_1.png') });

  await page.evaluate(() => window.scrollBy(0, 900));
  await new Promise(r => setTimeout(r, 3000));
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'fb_feed_scroll_2.png') });

  await browser.close();
}

checkFeed().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
