const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const OUTPUT_DIR = path.join(__dirname, '..', '..', 'output', 'scouts');

async function testIgSearch() {
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

    // Click Search icon on left nav
    console.log('Navigating to IG home...');
    await page.goto('https://www.instagram.com/', { waitUntil: 'domcontentloaded', timeout: 35000 });
    await new Promise(r => setTimeout(r, 4000));

    // Dismiss notifications if any
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      for (const b of btns) {
        if (b.textContent && (b.textContent.trim().toLowerCase() === 'not now' || b.textContent.trim().toLowerCase() === 'cancel')) {
          b.click();
          break;
        }
      }
    });

    console.log('Clicking Search nav link...');
    const clickedSearch = await page.evaluate(() => {
      const searchSvg = document.querySelector("svg[aria-label='Search']");
      if (searchSvg) {
        const link = searchSvg.closest('a') || searchSvg.closest("div[role='button']");
        if (link) { link.click(); return true; }
      }
      return false;
    });

    console.log('Clicked search nav?', clickedSearch);
    await new Promise(r => setTimeout(r, 2000));

    // Find search input
    const searchInput = await page.$("input[aria-label='Search input'], input[placeholder='Search']");
    if (searchInput) {
      console.log('Typing in search input: looking for website');
      await searchInput.type('looking for website', { delay: 60 });
      await new Promise(r => setTimeout(r, 4000));

      const shot = path.join(OUTPUT_DIR, 'test_ig_search_bar.png');
      await page.screenshot({ path: shot });
      console.log('Saved search bar screenshot:', shot);

      const results = await page.evaluate(() => {
        const items = Array.from(document.querySelectorAll("a[href^='/']")).map(a => ({
          href: a.getAttribute('href') || '',
          text: a.textContent.trim().replace(/\s+/g, ' ')
        })).filter(l => l.href.startsWith('/') && !l.href.includes('/p/') && !l.href.includes('/explore/') && l.text.length > 2);
        return items.slice(0, 15);
      });
      console.log('Search bar results:', results);
    }

  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await browser.close();
  }
}

testIgSearch();
