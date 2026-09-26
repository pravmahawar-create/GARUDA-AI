const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const OUTPUT_DIR = path.join(__dirname, '..', '..', 'output', 'scouts');

async function testProfileMenu() {
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

    const profileUrl = 'https://www.instagram.com/charms_hub/';
    console.log('Navigating to profile:', profileUrl);
    await page.goto(profileUrl, { waitUntil: 'domcontentloaded', timeout: 35000 });
    await new Promise(r => setTimeout(r, 4000));

    // Look for the "..." svg or button in the header
    const clickedDots = await page.evaluate(() => {
      const header = document.querySelector('header');
      if (!header) return false;
      const dotsSvg = header.querySelector("svg[aria-label='Options'], svg[aria-label='More options']");
      if (dotsSvg) {
        const btn = dotsSvg.closest("div[role='button']") || dotsSvg.closest('button');
        if (btn) { btn.click(); return true; }
      }
      return false;
    });

    console.log('Clicked dots button?', clickedDots);
    await new Promise(r => setTimeout(r, 2000));

    const shot1 = path.join(OUTPUT_DIR, 'test_ig_charms_dots_menu.png');
    await page.screenshot({ path: shot1 });
    console.log('Saved dots menu screenshot:', shot1);

    const menuOptions = await page.evaluate(() => {
      const dialog = document.querySelector("div[role='dialog']");
      if (!dialog) return [];
      return Array.from(dialog.querySelectorAll('button')).map(b => b.textContent.trim());
    });

    console.log('Dots menu options:', menuOptions);

  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await browser.close();
  }
}

testProfileMenu();
