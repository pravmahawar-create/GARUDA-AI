const puppeteer = require('puppeteer');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const OUTPUT_DIR = path.join(__dirname, '..', 'output');

async function inspectNotif() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--window-size=1440,900'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  await page.setCookie(
    { name: 'c_user', value: process.env.FB_C_USER.trim(), domain: '.facebook.com', path: '/', secure: true },
    { name: 'xs', value: process.env.FB_XS.trim(), domain: '.facebook.com', path: '/', httpOnly: true, secure: true }
  );

  await page.goto('https://www.facebook.com/notifications', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 4000));
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'fb_new_notification_inspect.png') });

  const notifs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("div[role='feed'] div, div[role='article']"))
      .map(e => e.textContent.trim())
      .filter(t => t.length > 10 && t.length < 200)
      .slice(0, 10);
  });

  console.log('Notifications found:', notifs);
  await browser.close();
}

inspectNotif().catch(e => {
  console.error(e);
  process.exit(1);
});
