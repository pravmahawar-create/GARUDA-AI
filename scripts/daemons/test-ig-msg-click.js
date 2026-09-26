const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const OUTPUT_DIR = path.join(__dirname, '..', '..', 'output', 'scouts');

async function testMsgClick() {
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

    const profileUrl = 'https://www.instagram.com/fansofcoimbatore/';
    console.log('Navigating to profile:', profileUrl);
    await page.goto(profileUrl, { waitUntil: 'domcontentloaded', timeout: 35000 });
    await new Promise(r => setTimeout(r, 4000));

    // Click Message button
    const clickedMsg = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("header div[role='button'], header button, header a"));
      for (const b of btns) {
        if (b.textContent && b.textContent.trim().toLowerCase() === 'message') {
          b.click();
          return true;
        }
      }
      return false;
    });

    console.log('Clicked Message button?', clickedMsg);
    await new Promise(r => setTimeout(r, 5000));

    // Dismiss "Not Now" if popup appeared
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      for (const b of btns) {
        if (b.textContent && (b.textContent.trim().toLowerCase() === 'not now' || b.textContent.trim().toLowerCase() === 'cancel')) {
          b.click();
          break;
        }
      }
    });
    await new Promise(r => setTimeout(r, 2000));

    const shotPath = path.join(OUTPUT_DIR, 'test_ig_msg_opened.png');
    await page.screenshot({ path: shotPath });
    console.log('Saved chat window screenshot:', shotPath);

    const chatInfo = await page.evaluate(() => {
      const textBox = document.querySelector("div[role='textbox'][aria-label*='Message' i], div[contenteditable='true']");
      return {
        url: window.location.href,
        hasTextBox: Boolean(textBox),
        title: document.title
      };
    });

    console.log('Chat window info:', chatInfo);

  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await browser.close();
  }
}

testMsgClick();
