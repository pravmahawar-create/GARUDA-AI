const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const OUTPUT_DIR = path.join(__dirname, '..', '..', 'output', 'scouts');

async function testFbCandaceChat() {
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
    await new Promise(r => setTimeout(r, 4000));

    // Click [ Message ] button
    const clickedMsg = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("div[role='button'], a[role='button'], [aria-label*='Message' i], button"));
      for (const b of btns) {
        const txt = (b.textContent || '').trim().toLowerCase();
        const aria = (b.getAttribute('aria-label') || '').trim().toLowerCase();
        if (txt === 'message' || aria === 'message') {
          b.scrollIntoView({ behavior: 'instant', block: 'center' });
          b.click();
          return true;
        }
      }
      return false;
    });

    console.log('Clicked Message button on profile?', clickedMsg);
    await new Promise(r => setTimeout(r, 4000));

    // Messenger E2EE confirmation / continue dialog handling if present
    await page.evaluate(() => {
      const all = Array.from(document.querySelectorAll('div, span, button'));
      for (const el of all) {
        if (el.textContent && el.textContent.trim() === 'Continue') {
          el.click();
          break;
        }
      }
    });
    await new Promise(r => setTimeout(r, 2000));

    const shotPath = path.join(OUTPUT_DIR, 'test_fb_candace_chat_opened.png');
    await page.screenshot({ path: shotPath });
    console.log('Saved FB chat opened screenshot:', shotPath);

    const chatInfo = await page.evaluate(() => {
      const textBox = document.querySelector("div[role='textbox'][aria-label*='Message' i], div[contenteditable='true'][role='textbox'], div[aria-label='Message'], div[contenteditable='true']");
      return {
        hasTextBox: Boolean(textBox),
        title: document.title,
        textBoxAria: textBox ? textBox.getAttribute('aria-label') : null
      };
    });

    console.log('FB Chat box info:', chatInfo);

  } catch (e) {
    console.error('FB Candace chat test error:', e.message);
  } finally {
    await browser.close();
  }
}

testFbCandaceChat();
