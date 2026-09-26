const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const OUTPUT_DIR = path.join(__dirname, '..', '..', 'output', 'scouts');

async function inspectSpecificPost() {
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

    const postUrl = 'https://www.instagram.com/p/DdbuZy3TGKv/';
    await page.goto(postUrl, { waitUntil: 'domcontentloaded', timeout: 35000 });
    await new Promise(r => setTimeout(r, 4000));

    const shotPath = path.join(OUTPUT_DIR, 'test_ig_post_ddbu.png');
    await page.screenshot({ path: shotPath });
    console.log('Saved screenshot:', shotPath);

    const postData = await page.evaluate(() => {
      // Find all links to get author
      const links = Array.from(document.querySelectorAll('a')).map(a => ({
        href: a.getAttribute('href') || '',
        text: (a.textContent || '').trim()
      })).filter(l => l.href.startsWith('/') && !l.href.includes('/p/') && !l.href.includes('/reel/') && !l.href.includes('/explore/') && !l.href.includes('/direct/'));

      // Find all text inside main
      const main = document.querySelector('main') || document.body;
      const spans = Array.from(main.querySelectorAll('h1, h2, span')).map(s => s.innerText.trim()).filter(t => t.length > 15 && t.length < 500);

      return {
        title: document.title,
        links: links.slice(0, 10),
        spans: spans.slice(0, 5)
      };
    });

    console.log('Post data:', JSON.stringify(postData, null, 2));

  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await browser.close();
  }
}

inspectSpecificPost();
