const puppeteer = require('puppeteer');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

async function inspectPostLinks() {
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

    const postUrl = 'https://www.instagram.com/p/DBG4xDIS8I5/';
    await page.goto(postUrl, { waitUntil: 'domcontentloaded', timeout: 35000 });
    await new Promise(r => setTimeout(r, 4000));

    const links = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a')).map(a => ({
        text: a.textContent.trim(),
        href: a.getAttribute('href') || '',
        fullHref: a.href,
        className: a.className,
        parentTag: a.parentElement ? a.parentElement.tagName : null
      })).filter(l => l.text.length > 0 && l.text.length < 40);
    });

    console.log('Post links:', JSON.stringify(links, null, 2));

  } catch (e) {
    console.error(e.message);
  } finally {
    await browser.close();
  }
}

inspectPostLinks();
