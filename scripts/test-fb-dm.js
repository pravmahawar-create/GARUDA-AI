const puppeteer = require('puppeteer');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const OUTPUT_DIR = path.join(__dirname, '..', 'output');

async function testDMTarget() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--window-size=1440,900'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

  await page.setCookie(
    { name: 'c_user', value: process.env.FB_C_USER.trim(), domain: '.facebook.com', path: '/', secure: true },
    { name: 'xs', value: process.env.FB_XS.trim(), domain: '.facebook.com', path: '/', httpOnly: true, secure: true }
  );

  // Navigate to Alanna search feed to get her profile link
  const query = 'Alanna Giselle reputable and reliable web designer';
  console.log('Navigating to Alanna feed to locate her profile link...');
  await page.goto('https://www.facebook.com/search/posts/?q=' + encodeURIComponent(query), { waitUntil: 'domcontentloaded', timeout: 35000 });
  await new Promise(r => setTimeout(r, 6000));

  // Extract author profile link
  const profileLink = await page.evaluate(() => {
    const allLinks = Array.from(document.querySelectorAll("a[role='link'], h2 a, strong a"));
    for (const a of allLinks) {
      if (a.textContent && a.textContent.includes('Alanna Giselle')) {
        return a.href;
      }
    }
    return null;
  });

  console.log('Alanna Giselle Profile Link:', profileLink);

  if (profileLink) {
    console.log('Navigating directly to profile...');
    await page.goto(profileLink, { waitUntil: 'domcontentloaded', timeout: 35000 });
    await new Promise(r => setTimeout(r, 5000));
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'fb_dm_alanna_profile.png') });

    // Check for "Message" button
    const hasMessageBtn = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("div[role='button'], a[role='button'], [aria-label*='Message' i]"));
      for (const b of btns) {
        if (b.textContent && b.textContent.trim().toLowerCase() === 'message') {
          return true;
        }
      }
      return false;
    });

    console.log('Profile has Message button?', hasMessageBtn);
  }

  await browser.close();
}

testDMTarget().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
