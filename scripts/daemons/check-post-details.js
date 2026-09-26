const puppeteer = require('puppeteer');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

async function checkPostDetails() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,900']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
    await page.setCookie(
      { name: 'sessionid', value: process.env.INSTAGRAM_SESSION_ID.trim(), domain: '.instagram.com', path: '/' },
      { name: 'ds_user_id', value: process.env.INSTAGRAM_USER_ID.trim(), domain: '.instagram.com', path: '/' }
    );

    await page.goto('https://www.instagram.com/explore/tags/webdeveloperneeded/', { waitUntil: 'domcontentloaded', timeout: 35000 });
    await new Promise(r => setTimeout(r, 4000));

    const posts = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("a[href*='/p/'], a[href*='/reel/']")).slice(0, 8).map(a => a.href);
    });

    for (const p of posts) {
      await page.goto(p, { waitUntil: 'domcontentloaded', timeout: 35000 });
      await new Promise(r => setTimeout(r, 3000));

      const info = await page.evaluate(() => {
        const text = (document.querySelector('article h1, article span, article') || {}).innerText || '';
        return { text: text.slice(0, 300).replace(/\s+/g, ' ') };
      });

      console.log(`Post: ${p}`);
      console.log(`Caption: ${info.text.slice(0, 150)}...\n`);
    }

  } catch (e) {
    console.error(e.message);
  } finally {
    await browser.close();
  }
}

checkPostDetails();
