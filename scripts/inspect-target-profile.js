const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const OUTPUT_DIR = path.join(__dirname, '..', 'output');

async function inspectProfile() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--window-size=1440,1100'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1100 });
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

  await page.setCookie(
    { name: 'c_user', value: process.env.FB_C_USER.trim(), domain: '.facebook.com', path: '/', secure: true },
    { name: 'xs', value: process.env.FB_XS.trim(), domain: '.facebook.com', path: '/', httpOnly: true, secure: true }
  );

  const targetUrl = 'https://www.facebook.com/profile.php?id=61589688085889';
  console.log('Navigating to target profile:', targetUrl);
  await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 35000 });
  await new Promise(r => setTimeout(r, 6000));

  await page.screenshot({ path: path.join(OUTPUT_DIR, 'target_profile_main.png') });
  console.log('Saved target_profile_main.png');

  // Extract all text info
  const profileData = await page.evaluate(() => {
    const title = document.title;
    const nameEl = document.querySelector('h1');
    const name = nameEl ? nameEl.textContent.trim() : '';

    const bioEls = Array.from(document.querySelectorAll('div[dir="auto"], span[dir="auto"]'));
    const snippets = bioEls
      .map(e => e.textContent.trim())
      .filter(t => t.length > 5 && t.length < 300);

    const buttons = Array.from(document.querySelectorAll('div[role="button"], a[role="button"]'))
      .map(b => b.textContent.trim())
      .filter(Boolean);

    return {
      title,
      name,
      buttons: buttons.slice(0, 15),
      snippets: snippets.slice(0, 30)
    };
  });

  console.log('Profile Data Extracted:', JSON.stringify(profileData, null, 2));

  // Scroll down to see posts
  await page.evaluate(() => window.scrollBy(0, 800));
  await new Promise(r => setTimeout(r, 3000));
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'target_profile_posts_1.png') });

  await page.evaluate(() => window.scrollBy(0, 1000));
  await new Promise(r => setTimeout(r, 3000));
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'target_profile_posts_2.png') });

  // Navigate to About tab
  const aboutUrl = 'https://www.facebook.com/profile.php?id=61589688085889&sk=about';
  console.log('Navigating to About tab:', aboutUrl);
  await page.goto(aboutUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 4000));
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'target_profile_about.png') });

  await browser.close();
}

inspectProfile().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
