const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const OUTPUT_DIR = path.join(__dirname, '..', '..', 'output', 'scouts');

async function testFbProfile() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
    await page.setCookie(
      { name: 'c_user', value: process.env.FB_C_USER.trim(), domain: '.facebook.com', path: '/', secure: true },
      { name: 'xs', value: process.env.FB_XS.trim(), domain: '.facebook.com', path: '/', httpOnly: true, secure: true }
    );

    const profileUrl = 'https://www.facebook.com/candacecarr6';
    console.log('Navigating to profile:', profileUrl);
    await page.goto(profileUrl, { waitUntil: 'domcontentloaded', timeout: 35000 });
    await new Promise(r => setTimeout(r, 5000));

    const shotPath = path.join(OUTPUT_DIR, 'test_fb_candace_profile.png');
    await page.screenshot({ path: shotPath });
    console.log('Saved screenshot:', shotPath);

    const btnInfo = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("div[role='button'], a[role='button'], [aria-label*='Message' i], button")).map(b => ({
        tag: b.tagName,
        text: (b.textContent || '').trim(),
        ariaLabel: b.getAttribute('aria-label') || ''
      })).filter(b => b.text.toLowerCase().includes('message') || b.ariaLabel.toLowerCase().includes('message'));

      return {
        title: document.title,
        messageButtons: btns
      };
    });

    console.log('Profile button info:', JSON.stringify(btnInfo, null, 2));

  } catch (e) {
    console.error('FB profile test error:', e.message);
  } finally {
    await browser.close();
  }
}

testFbProfile();
