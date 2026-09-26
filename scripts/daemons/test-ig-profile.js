const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const OUTPUT_DIR = path.join(__dirname, '..', '..', 'output', 'scouts');

async function testIgProfile() {
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
    console.log('Navigating to IG profile:', profileUrl);
    await page.goto(profileUrl, { waitUntil: 'domcontentloaded', timeout: 35000 });
    await new Promise(r => setTimeout(r, 5000));

    const shotPath = path.join(OUTPUT_DIR, 'test_ig_charms_profile.png');
    await page.screenshot({ path: shotPath });
    console.log('Saved IG screenshot:', shotPath);

    const info = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("div[role='button'], button, a")).map(b => ({
        tag: b.tagName,
        text: (b.textContent || '').trim()
      })).filter(b => b.text.toLowerCase().includes('message') || b.text.toLowerCase().includes('follow'));

      return {
        title: document.title,
        url: window.location.href,
        buttons: btns
      };
    });

    console.log('IG profile info:', JSON.stringify(info, null, 2));

  } catch (e) {
    console.error('IG profile test error:', e.message);
  } finally {
    await browser.close();
  }
}

testIgProfile();
