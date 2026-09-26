const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const OUTPUT_DIR = path.join(__dirname, '..', '..', 'output', 'scouts');

async function testPost() {
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
    console.log('Navigating to post:', postUrl);
    await page.goto(postUrl, { waitUntil: 'networkidle2', timeout: 35000 });
    await new Promise(r => setTimeout(r, 4000));

    const shotPath = path.join(OUTPUT_DIR, 'test_ig_post_detail.png');
    await page.screenshot({ path: shotPath });
    console.log('Saved post detail screenshot:', shotPath);

    const data = await page.evaluate(() => {
      // Find all links
      const links = Array.from(document.querySelectorAll('a')).map(a => ({
        href: a.href,
        text: a.textContent.trim()
      })).filter(l => l.text.length > 0 && !l.href.includes('/explore/') && !l.href.includes('/direct/'));

      // Find headings / spans
      const textNodes = Array.from(document.querySelectorAll('h1, h2, span, div')).map(el => el.textContent.trim()).filter(t => t.length > 20 && t.length < 300);

      return {
        title: document.title,
        url: window.location.href,
        links: links.slice(0, 15),
        sampleTexts: textNodes.slice(0, 10)
      };
    });

    console.log('Extracted post info:', JSON.stringify(data, null, 2));

  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await browser.close();
  }
}

testPost();
