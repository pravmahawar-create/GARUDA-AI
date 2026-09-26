const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

async function checkAccount() {
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

    const testUsers = ['socialmedia2evolve', 'webdeveloperneeded', 'needwebsite', 'hirewebdesigner'];
    for (const u of testUsers) {
      await page.goto(`https://www.instagram.com/${u}/`, { waitUntil: 'domcontentloaded', timeout: 35000 });
      await new Promise(r => setTimeout(r, 4000));
      const res = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll("div[role='button'], button, a")).map(b => (b.textContent || '').trim());
        const hasMsg = btns.some(t => t.toLowerCase() === 'message');
        return { title: document.title, hasMsg, btns: btns.slice(0, 10) };
      });
      console.log(`@${u}:`, res);
    }

  } catch (e) {
    console.error(e.message);
  } finally {
    await browser.close();
  }
}

checkAccount();
